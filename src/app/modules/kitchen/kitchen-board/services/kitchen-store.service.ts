import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, interval, merge, switchMap, tap, timer } from 'rxjs';

import { KITCHEN_TIMER_THRESHOLDS } from '../kitchen.config';
import { byArrival } from '../models/kitchen-order';
import type { KitchenOrder, KitchenOrderStatus, KitchenQueue } from '../models/kitchen.models';
import { KITCHEN_API } from './kitchen-api';

/** The queue refreshes by polling. Real time (SignalR) comes with HU_05 and HU_09. */
export const POLL_INTERVAL_MS = 5000;
const CLOCK_TICK_MS = 1000;

const NO_ORDERS: readonly KitchenOrder[] = [];

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

  private readonly orders = computed(() => this.queue()?.orders ?? NO_ORDERS);
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
    this.queue.set(queue);
  }
}
