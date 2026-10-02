import { Injectable, computed, signal } from '@angular/core';

import type { OrderDraftItem, OrderDraftProduct } from './order-draft.model';

const CENTS_PER_UNIT = 100;
const DEFAULT_ADD_QUANTITY = 1;

/**
 * Order in progress, shared by every feature that builds an order (catalog, order review).
 *
 * The state is in memory only: it is not persisted and not sent to the API. Submitting the
 * order (and its offline queue) belongs to the orders feature, which reads `items` and calls
 * `clear()` once the order is queued.
 */
@Injectable({ providedIn: 'root' })
export class OrderDraftService {
  private readonly itemsState = signal<readonly OrderDraftItem[]>([]);

  /** Lines of the draft, in the order they were first added. */
  readonly items = this.itemsState.asReadonly();

  /** Total number of units across all lines (the order counter). */
  readonly itemCount = computed(() =>
    this.itemsState().reduce((count, item) => count + item.quantity, 0),
  );

  /** Order total in MXN. Summed in cents to avoid floating point drift. */
  readonly total = computed(
    () =>
      this.itemsState().reduce(
        (cents, item) => cents + Math.round(item.unitPrice * CENTS_PER_UNIT) * item.quantity,
        0,
      ) / CENTS_PER_UNIT,
  );

  /** Adds `quantity` units of a product, increasing the existing line when there is one. */
  add(product: OrderDraftProduct, quantity = DEFAULT_ADD_QUANTITY): void {
    if (!isValidQuantity(quantity)) {
      return;
    }
    this.itemsState.update((items) => {
      const existing = items.find((item) => item.productId === product.productId);
      if (!existing) {
        return [...items, { ...product, quantity }];
      }
      return items.map((item) =>
        item.productId === product.productId
          ? { ...item, quantity: item.quantity + quantity }
          : item,
      );
    });
  }

  /** Removes the whole line of a product. Does nothing when the product is not in the draft. */
  remove(productId: string): void {
    this.itemsState.update((items) => items.filter((item) => item.productId !== productId));
  }

  /**
   * Sets the quantity of an existing line. A quantity of zero or less removes the line;
   * a non-integer quantity is ignored. Does nothing when the product is not in the draft.
   */
  changeQuantity(productId: string, quantity: number): void {
    if (!Number.isInteger(quantity)) {
      return;
    }
    if (quantity <= 0) {
      this.remove(productId);
      return;
    }
    this.itemsState.update((items) =>
      items.map((item) => (item.productId === productId ? { ...item, quantity } : item)),
    );
  }

  /** Empties the draft. */
  clear(): void {
    this.itemsState.set([]);
  }
}

function isValidQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity > 0;
}
