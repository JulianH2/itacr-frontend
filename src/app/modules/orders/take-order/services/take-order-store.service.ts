import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { firstValueFrom, tap } from 'rxjs';

import { OrderDraftService } from '@shared/state/order-draft/order-draft.service';

import type { CreateOrderRequest, DiningTable, PlacedOrder } from '../models/take-order.models';
import { TAKE_ORDER_MESSAGES } from '../take-order.messages';
import { ORDERS_API } from './orders-api';

const NO_TABLES: readonly DiningTable[] = [];

interface PendingOrder {
  /** The request without its id, to know whether a retry sends the same order. */
  readonly content: string;
  readonly clientOrderId: string;
}

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

  private readonly tableIdState = signal<string | null>(null);
  private readonly takeAwayState = signal(false);
  private readonly sendingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly sentOrderState = signal<PlacedOrder | null>(null);
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
   * Sends the order to the kitchen. Returns true when the API saved it (or already had it); then the draft is
   * empty and {@link sentOrder} holds the confirmation.
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
      const order = await firstValueFrom(this.api.createOrder(request));
      this.sentOrderState.set(order);
      this.resetOrder();
      return true;
    } catch (error: unknown) {
      this.errorState.set(errorMessage(error));
      return false;
    } finally {
      this.sendingState.set(false);
    }
  }

  /** Empties everything for the next order (HU_03 CA4). */
  startNewOrder(): void {
    this.resetOrder();
    this.sentOrderState.set(null);
    this.errorState.set(null);
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
    return { clientOrderId: this.pending.clientOrderId, ...content };
  }

  private resetOrder(): void {
    this.draft.clear();
    this.tableIdState.set(null);
    this.takeAwayState.set(false);
    this.pending = null;
  }
}

function errorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return TAKE_ORDER_MESSAGES.unexpected;
  }
  if (error.status === 0) {
    return TAKE_ORDER_MESSAGES.network;
  }
  return problemMessage(error.error) ?? TAKE_ORDER_MESSAGES.unexpected;
}

/** The first validation message of a Problem Details body, or its `detail`. */
function problemMessage(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) {
    return null;
  }
  const problem = body as Record<string, unknown>;
  const errors = problem['errors'];
  if (typeof errors === 'object' && errors !== null) {
    for (const messages of Object.values(errors as Record<string, unknown>)) {
      if (Array.isArray(messages) && typeof messages[0] === 'string') {
        return messages[0];
      }
    }
  }
  return typeof problem['detail'] === 'string' ? problem['detail'] : null;
}
