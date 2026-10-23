import { Injectable, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { firstValueFrom, tap, timeout } from 'rxjs';

import { ConnectionStatusService } from '@shared/services/connection-status.service';
import { OrderDraftService } from '@shared/state/order-draft/order-draft.service';

import type { CreateOrderRequest, DiningTable, PlacedOrder } from '../models/take-order.models';
import { TAKE_ORDER_MESSAGES } from '../take-order.messages';
import {
  OfflineOrdersService,
  SEND_TIMEOUT_MS,
  type PendingOrderSummary,
} from './offline-orders.service';
import { isNetworkError, orderErrorMessage } from './order-error-message';
import { ORDERS_API } from './orders-api';

const NO_TABLES: readonly DiningTable[] = [];

interface PendingOrder {
  /** The request without its id, to know whether a retry sends the same order. */
  readonly content: string;
  readonly clientOrderId: string;
}

/** An order saved on the device because there was no connection (HU_07 CA1). */
export type QueuedOrder = PendingOrderSummary;

/**
 * The order the waiter is about to send: its destination (a table or to take away), the send itself, and the
 * confirmation. The products are in the shared {@link OrderDraftService}, which the catalog fills.
 *
 * Provided by the orders route, so it keeps the destination while the waiter goes back to the catalog.
 */
@Injectable()
export class TakeOrderStore {
  private readonly api = inject(ORDERS_API);
  private readonly draft = inject(OrderDraftService);
  private readonly connection = inject(ConnectionStatusService);
  private readonly offlineOrders = inject(OfflineOrdersService);

  private readonly tableIdState = signal<string | null>(null);
  private readonly takeAwayState = signal(false);
  private readonly sendingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly sentOrderState = signal<PlacedOrder | null>(null);
  private readonly queuedOrderState = signal<QueuedOrder | null>(null);
  private pending: PendingOrder | null = null;

  private readonly tablesResource = rxResource({
    stream: () =>
      this.api
        .getDiningTables()
        .pipe(tap({ error: (error: unknown) => console.error('Failed to load tables', error) })),
  });

  readonly tables = computed(() => this.tablesResource.value() ?? NO_TABLES);
  readonly isLoadingTables = this.tablesResource.isLoading;
  readonly hasTablesError = computed(() => this.tablesResource.error() !== undefined);

  readonly items = this.draft.items;
  readonly itemCount = this.draft.itemCount;
  readonly total = this.draft.total;

  readonly tableId = this.tableIdState.asReadonly();
  readonly takeAway = this.takeAwayState.asReadonly();
  readonly isSending = this.sendingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly sentOrder = this.sentOrderState.asReadonly();
  readonly queuedOrder = this.queuedOrderState.asReadonly();

  /** An order without products cannot be sent (HU_03 CA3). */
  readonly canSend = computed(() => this.draft.itemCount() > 0 && !this.sendingState());

  selectTable(tableId: string): void {
    this.tableIdState.set(tableId);
    this.takeAwayState.set(false);
    this.errorState.set(null);
  }

  setTakeAway(takeAway: boolean): void {
    this.takeAwayState.set(takeAway);
    if (takeAway) {
      this.tableIdState.set(null);
    }
    this.errorState.set(null);
  }

  reloadTables(): void {
    this.tablesResource.reload();
  }

  /**
   * Sends the order to the kitchen. Returns true when the API saved it (or already had it), with the confirmation in
   * {@link sentOrder}, or when there is no connection and the order was saved on the device, in {@link queuedOrder}.
   * Either way the draft is empty.
   */
  async send(): Promise<boolean> {
    if (!this.canSend()) {
      return false;
    }
    if (this.tableIdState() === null && !this.takeAwayState()) {
      this.errorState.set(TAKE_ORDER_MESSAGES.destinationRequired);
      return false;
    }

    const request = this.buildRequest();
    this.sendingState.set(true);
    this.errorState.set(null);
    try {
      if (!this.connection.online()) {
        return await this.queue(request);
      }
      const order = await firstValueFrom(
        this.api.createOrder(request).pipe(timeout(SEND_TIMEOUT_MS)),
      );
      this.sentOrderState.set(order);
      this.queuedOrderState.set(null);
      this.resetOrder();
      return true;
    } catch (error: unknown) {
      if (isNetworkError(error)) {
        return await this.queue(request);
      }
      this.errorState.set(orderErrorMessage(error));
      return false;
    } finally {
      this.sendingState.set(false);
    }
  }

  /** Empties everything for the next order (HU_03 CA4). */
  startNewOrder(): void {
    this.resetOrder();
    this.sentOrderState.set(null);
    this.queuedOrderState.set(null);
    this.errorState.set(null);
  }

  /** Saves the order on the device; the queue sends it with the same `clientOrderId` when the connection is back. */
  private async queue(request: CreateOrderRequest): Promise<boolean> {
    const summary: QueuedOrder = {
      tableNumber: this.tables().find((table) => table.id === request.tableId)?.number ?? null,
      itemCount: this.draft.itemCount(),
      total: this.draft.total(),
    };
    try {
      await this.offlineOrders.enqueue(request, summary);
    } catch (error: unknown) {
      console.error('Failed to save the order on the device', error);
      this.errorState.set(TAKE_ORDER_MESSAGES.notSaved);
      return false;
    }
    this.queuedOrderState.set(summary);
    this.sentOrderState.set(null);
    this.resetOrder();
    return true;
  }

  private buildRequest(): CreateOrderRequest {
    const content = {
      tableId: this.tableIdState(),
      takeAway: this.takeAwayState(),
      items: this.draft
        .items()
        .map((item) => ({ productId: item.productId, quantity: item.quantity })),
    };
    const key = JSON.stringify(content);
    if (this.pending?.content !== key) {
      this.pending = { content: key, clientOrderId: crypto.randomUUID() };
    }
    return {
      clientOrderId: this.pending.clientOrderId,
      ...content,
      createdAt: new Date().toISOString(),
    };
  }

  private resetOrder(): void {
    this.draft.clear();
    this.tableIdState.set(null);
    this.takeAwayState.set(false);
    this.pending = null;
  }
}
