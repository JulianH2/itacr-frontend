import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';

import { SessionService } from '@shared/auth/session.service';
import { ConnectionStatusService } from '@shared/services/connection-status.service';
import { ToastService } from '@shared/services/toast.service';

import type { CreateOrderRequest, PendingOrder } from '../models/take-order.models';
import { orderErrorMessage } from './order-error-message';
import { ORDERS_API } from './orders-api';
import { PENDING_ORDERS_STORAGE } from './pending-orders-storage';

/** `navigator.onLine` can say online on a Wi-Fi without internet, so the queue also retries on its own. */
export const SYNC_RETRY_MS = 30_000;
export const SEND_TIMEOUT_MS = 15_000;

export interface PendingOrderSummary {
  readonly tableNumber: number | null;
  readonly itemCount: number;
  readonly total: number;
}

type SendOutcome = 'sent' | 'failed' | 'stop';

/**
 * Orders sent without a connection (HU_07). They are saved on the device and sent to the kitchen when the connection
 * comes back, oldest first, with the same `clientOrderId`, so an order that already arrived is never duplicated.
 *
 * Provided in root and started with the app, so it syncs on any screen.
 */
@Injectable({ providedIn: 'root' })
export class OfflineOrdersService {
  private readonly api = inject(ORDERS_API);
  private readonly storage = inject(PENDING_ORDERS_STORAGE);
  private readonly session = inject(SessionService);
  private readonly connection = inject(ConnectionStatusService);
  private readonly toasts = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly ordersState = signal<readonly PendingOrder[]>([]);
  private syncing: Promise<void> | null = null;

  /** The orders of the signed-in waiter that have not reached the kitchen, oldest first. */
  readonly orders = computed(() => {
    const employeeId = this.session.employee()?.id;
    return this.ordersState()
      .filter((order) => order.employeeId === employeeId)
      .sort((a, b) => a.request.createdAt.localeCompare(b.request.createdAt));
  });

  readonly pendingCount = computed(
    () => this.orders().filter((order) => order.state === 'pending').length,
  );

  constructor() {
    effect(() => {
      if (this.connection.online() && this.session.employee() !== null) {
        void this.sync();
      }
    });
  }

  /** Loads the orders saved in a previous visit and keeps retrying while some are waiting. */
  async start(): Promise<void> {
    const interval = setInterval(() => void this.sync(), SYNC_RETRY_MS);
    this.destroyRef.onDestroy(() => clearInterval(interval));
    try {
      this.ordersState.set(await this.storage.getAll());
    } catch (error: unknown) {
      console.error('Failed to read the pending orders', error);
    }
    await this.sync();
  }

  /** Saves the order on the device. Throws when the device cannot store it, so the waiter is not told it is safe. */
  async enqueue(request: CreateOrderRequest, summary: PendingOrderSummary): Promise<void> {
    const employeeId = this.session.employee()?.id;
    if (employeeId === undefined) {
      throw new Error('A pending order needs a signed-in waiter');
    }
    const order: PendingOrder = {
      clientOrderId: request.clientOrderId,
      employeeId,
      request,
      ...summary,
      state: 'pending',
      error: null,
    };
    await this.storage.put(order);
    this.ordersState.update((orders) => [
      ...orders.filter((saved) => saved.clientOrderId !== order.clientOrderId),
      order,
    ]);
  }

  /** Removes an order the API rejected; it never reaches the kitchen. */
  async discard(clientOrderId: string): Promise<void> {
    await this.storage.delete(clientOrderId);
    this.ordersState.update((orders) =>
      orders.filter((order) => order.clientOrderId !== clientOrderId),
    );
  }

  /** Sends the waiting orders one by one, oldest first. A second call while one runs waits for it. */
  sync(): Promise<void> {
    this.syncing ??= this.sendPending().finally(() => (this.syncing = null));
    return this.syncing;
  }

  private async sendPending(): Promise<void> {
    let sent = 0;
    for (const order of this.orders()) {
      if (order.state !== 'pending') {
        continue;
      }
      if (!this.connection.online() || this.session.accessToken() === null) {
        break;
      }
      const outcome = await this.send(order);
      if (outcome === 'stop') {
        break;
      }
      if (outcome === 'sent') {
        sent++;
      }
    }
    if (sent > 0) {
      this.toasts.show({
        title: 'Pedidos sincronizados',
        message: sent === 1 ? '1 pedido llegó a cocina.' : `${sent} pedidos llegaron a cocina.`,
        icon: 'check-circle',
      });
    }
  }

  private async send(order: PendingOrder): Promise<SendOutcome> {
    try {
      await firstValueFrom(this.api.createOrder(order.request).pipe(timeout(SEND_TIMEOUT_MS)));
    } catch (error: unknown) {
      if (!isRejection(error)) {
        return 'stop';
      }
      await this.save({ ...order, state: 'failed', error: orderErrorMessage(error) });
      return 'failed';
    }
    await this.discard(order.clientOrderId);
    return 'sent';
  }

  private async save(order: PendingOrder): Promise<void> {
    await this.storage.put(order);
    this.ordersState.update((orders) =>
      orders.map((saved) => (saved.clientOrderId === order.clientOrderId ? order : saved)),
    );
  }
}

/**
 * The API answered and will answer the same again: the order cannot be sent as it is. A network error, a timeout,
 * an expired session, a rate limit or a server error is worth retrying later.
 */
function isRejection(error: unknown): boolean {
  return (
    error instanceof HttpErrorResponse &&
    error.status >= 400 &&
    error.status < 500 &&
    error.status !== HttpStatusCode.Unauthorized &&
    error.status !== HttpStatusCode.RequestTimeout &&
    error.status !== HttpStatusCode.TooManyRequests
  );
}
