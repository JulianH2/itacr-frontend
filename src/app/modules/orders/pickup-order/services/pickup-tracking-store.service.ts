import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { exhaustMap, filter, firstValueFrom, fromEvent, merge, timer } from 'rxjs';

import { PickupReceiptsService } from '@shared/state/pickup-receipts/pickup-receipts.service';

import type { PickupOrder } from '../models/pickup-order.models';
import { PICKUP_API } from './pickup-api';

/** The customer's status refreshes by polling. Each customer makes at most 12 requests a minute (2 receipts). */
export const TRACKING_INTERVAL_MS = 10_000;

/**
 * The active orders of this device with their current status. It asks the API for each receipt every few seconds
 * while the page is visible. An order stays on screen until the customer leaves, even after it is delivered; its
 * receipt is dropped at that moment (or when the server no longer knows the order).
 *
 * Provided by the page that shows it, so leaving the page stops the polling.
 */
@Injectable()
export class PickupTrackingStore {
  private readonly api = inject(PICKUP_API);
  private readonly receipts = inject(PickupReceiptsService);

  /** Receipts shown on this visit, in the order they were made. A delivered order leaves the receipts but not this list. */
  private readonly shown = signal(this.receipts.receipts().map((receipt) => receipt.clientOrderId));
  private readonly loaded = signal<Readonly<Record<string, PickupOrder>>>({});
  private readonly failedState = signal(false);

  /** Newest first. */
  readonly orders = computed(() =>
    this.shown()
      .map((id) => this.loaded()[id])
      .filter((order): order is PickupOrder => order !== undefined)
      .sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt)),
  );
  /** There are receipts, but none of them answered yet. */
  readonly isLoading = computed(
    () => this.shown().length > 0 && this.orders().length === 0 && !this.failedState(),
  );
  /** The last poll failed; the screen keeps what it has and says it may be outdated. */
  readonly isOutdated = this.failedState.asReadonly();
  readonly isEmpty = computed(() => this.shown().length === 0);

  constructor() {
    const destroyRef = inject(DestroyRef);
    merge(
      timer(0, TRACKING_INTERVAL_MS),
      fromEvent(document, 'visibilitychange').pipe(filter(() => !document.hidden)),
    )
      .pipe(
        filter(() => !document.hidden),
        exhaustMap(() => this.poll()),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe();
  }

  /** Orders of this visit that are not delivered yet. */
  private pendingIds(): string[] {
    return this.shown().filter((id) => this.loaded()[id]?.status !== 'Delivered');
  }

  private async poll(): Promise<void> {
    let failed = false;
    for (const id of this.pendingIds()) {
      try {
        const order = await firstValueFrom(this.api.getOrder(id));
        this.loaded.update((loaded) => ({ ...loaded, [id]: order }));
        if (order.status === 'Delivered') {
          this.receipts.remove(id);
        }
      } catch (error: unknown) {
        if (error instanceof HttpErrorResponse && error.status === 404) {
          this.forget(id);
        } else {
          failed = true;
          console.error('Failed to load the status of a pickup order', error);
        }
      }
    }
    this.failedState.set(failed);
  }

  private forget(id: string): void {
    this.receipts.remove(id);
    this.shown.update((ids) => ids.filter((shownId) => shownId !== id));
  }
}
