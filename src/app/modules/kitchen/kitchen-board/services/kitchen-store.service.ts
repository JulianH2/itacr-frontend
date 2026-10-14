import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, interval, merge, switchMap, tap, timer } from 'rxjs';

import { KITCHEN_TIMER_THRESHOLDS } from '../kitchen.config';
import { byArrival, nextKitchenStep } from '../models/kitchen-order';
import type { KitchenOrder, KitchenOrderStatus, KitchenQueue } from '../models/kitchen.models';
import { KITCHEN_API } from './kitchen-api';

/** The queue refreshes by polling. Real time (SignalR) comes with HU_09. */
export const POLL_INTERVAL_MS = 5000;
/** How long the board offers to undo a tap. The API accepts it for 15 s, to allow for the network. */
export const UNDO_VISIBLE_MS = 6000;
const CLOCK_TICK_MS = 1000;

export const KITCHEN_ACTION_MESSAGES = {
  network: 'No se guardó el cambio: no hay conexión. Inténtalo de nuevo.',
  unexpected: 'No se pudo cambiar el estado del pedido. Inténtalo de nuevo.',
} as const;

/** The last tap, while it can still be undone. */
export interface KitchenChange {
  readonly orderId: string;
  readonly orderNumber: number;
  readonly from: KitchenOrderStatus;
  readonly to: KitchenOrderStatus;
  readonly at: number;
}

const NO_ORDERS: readonly KitchenOrder[] = [];

function actionErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return KITCHEN_ACTION_MESSAGES.network;
    }
    const detail = (error.error as { detail?: unknown } | null)?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
  }
  return KITCHEN_ACTION_MESSAGES.unexpected;
}

/**
 * State of the kitchen board: the active orders, refreshed every few seconds without reloading the page, and the
 * clock that drives the order timers. Provided by the page, so leaving the screen stops the polling.
 */
@Injectable()
export class KitchenStore {
  private readonly api = inject(KITCHEN_API);
  private readonly refreshRequested = new Subject<void>();
  private readonly queue = signal<KitchenQueue | null>(null);
  private readonly pollFailed = signal(false);
  private readonly deviceNow = signal(Date.now());
  private readonly clockOffsetMs = signal(0);
  /** Every order id seen so far; null until the first answer, so the orders already there do not ring. */
  private seenOrderIds: Set<string> | null = null;

  readonly thresholds = inject(KITCHEN_TIMER_THRESHOLDS);

  /** Server time: the device clock corrected by the offset measured on the last answer. */
  readonly now = computed(() => this.deviceNow() + this.clockOffsetMs());

  /** Grows by one every time a poll brings at least one order that was not on the board. The page plays the alert. */
  readonly newOrderAlerts = signal(0);

  readonly isLoading = computed(() => this.queue() === null && !this.pollFailed());
  /** The first answer failed, so there is nothing to show. */
  readonly hasError = computed(() => this.queue() === null && this.pollFailed());
  /** A later poll failed: the board keeps the last data and says it may be outdated. */
  readonly isOutdated = computed(() => this.queue() !== null && this.pollFailed());

  /** Statuses shown before the API confirms them, so a tap moves the card at once. */
  private readonly overrides = signal<ReadonlyMap<string, KitchenOrderStatus>>(new Map());
  private readonly pending = signal<ReadonlySet<string>>(new Set());
  private readonly lastChange = signal<KitchenChange | null>(null);

  /** Orders waiting for the API; their cards ignore taps meanwhile. */
  readonly busyIds = this.pending.asReadonly();
  readonly actionError = signal<string | null>(null);
  /** The last tap while it can still be undone (CA3), or null. */
  readonly undoOffer = computed(() => {
    const change = this.lastChange();
    return change !== null && this.deviceNow() - change.at < UNDO_VISIBLE_MS ? change : null;
  });

  private readonly orders = computed(() => {
    const overrides = this.overrides();
    return (this.queue()?.orders ?? NO_ORDERS).map((order) => {
      const status = overrides.get(order.id);
      return status === undefined ? order : { ...order, status };
    });
  });
  readonly newOrders = computed(() => this.inColumn('New'));
  readonly inPreparationOrders = computed(() => this.inColumn('InPreparation'));
  readonly readyOrders = computed(() => this.inColumn('Ready'));
  readonly isEmpty = computed(() => this.queue() !== null && this.orders().length === 0);

  constructor() {
    const destroyRef = inject(DestroyRef);

    interval(CLOCK_TICK_MS)
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => this.deviceNow.set(Date.now()));

    merge(timer(0, POLL_INTERVAL_MS), this.refreshRequested)
      .pipe(
        switchMap(() =>
          this.api.getQueue().pipe(
            tap((queue) => this.accept(queue)),
            catchError((error: unknown) => {
              console.error('Failed to load the kitchen queue', error);
              this.pollFailed.set(true);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe();
  }

  /** Asks for the queue now instead of waiting for the next poll. */
  reload(): void {
    this.refreshRequested.next();
  }

  /** A tap on a card: New goes to InPreparation (CA1) and InPreparation to Ready (CA2). */
  advance(order: KitchenOrder): void {
    const next = nextKitchenStep(order.status);
    if (next === null || this.pending().has(order.id)) {
      return;
    }

    this.actionError.set(null);
    this.show(order.id, next);
    this.api.changeStatus(order.id, next).subscribe({
      next: () => {
        this.settle(order.id);
        this.lastChange.set({
          orderId: order.id,
          orderNumber: order.orderNumber,
          from: order.status,
          to: next,
          at: Date.now(),
        });
      },
      error: (error: unknown) => this.fail(order.id, error),
    });
  }

  /** Takes the order of the last tap back to its previous status (CA3). */
  undo(): void {
    const change = this.undoOffer();
    if (change === null || this.pending().has(change.orderId)) {
      return;
    }

    this.lastChange.set(null);
    this.actionError.set(null);
    this.show(change.orderId, change.from);
    this.api.undoStatusChange(change.orderId).subscribe({
      next: () => this.settle(change.orderId),
      error: (error: unknown) => this.fail(change.orderId, error),
    });
  }

  private show(orderId: string, status: KitchenOrderStatus): void {
    this.overrides.update((current) => new Map(current).set(orderId, status));
    this.pending.update((current) => new Set(current).add(orderId));
  }

  private settle(orderId: string): void {
    this.pending.update((current) => {
      const next = new Set(current);
      next.delete(orderId);
      return next;
    });
  }

  private fail(orderId: string, error: unknown): void {
    console.error('Failed to change the order status', error);
    this.settle(orderId);
    this.overrides.update((current) => {
      const next = new Map(current);
      next.delete(orderId);
      return next;
    });
    this.actionError.set(actionErrorMessage(error));
    this.reload();
  }

  private inColumn(status: KitchenOrderStatus): readonly KitchenOrder[] {
    return this.orders()
      .filter((order) => order.status === status)
      .sort(byArrival);
  }

  private accept(queue: KitchenQueue): void {
    this.clockOffsetMs.set(Date.parse(queue.serverTime) - Date.now());
    this.deviceNow.set(Date.now());
    this.pollFailed.set(false);

    const seen = this.seenOrderIds;
    if (
      seen !== null &&
      queue.orders.some((order) => order.status === 'New' && !seen.has(order.id))
    ) {
      this.newOrderAlerts.update((count) => count + 1);
    }
    this.seenOrderIds = new Set(queue.orders.map((order) => order.id));
    // Once the API answered, the server is the truth; a tap still waiting for it keeps its status on screen.
    const pending = this.pending();
    this.overrides.update(
      (current) => new Map([...current].filter(([orderId]) => pending.has(orderId))),
    );
    this.queue.set(queue);
  }
}
