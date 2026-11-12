import { Injectable, computed, signal } from '@angular/core';

import type { DraftLimits, DraftRefusal } from './order-draft.limits';
import { type OrderDraftItem, type OrderDraftProduct, lineIdOf } from './order-draft.model';

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
  private readonly editingState = signal<string | null>(null);
  private stashedItems: readonly OrderDraftItem[] = [];

  /** Lines of the draft, in the order they were first added. */
  readonly items = this.itemsState.asReadonly();

  /**
   * The order whose lines the draft holds while a waiter modifies it (HU_13), or null when the draft is a new order. The
   * catalog adds products to the draft the same way in both cases; what happens to them is up to the screen that owns it.
   */
  readonly editingOrderId = this.editingState.asReadonly();

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

  /**
   * Adds `quantity` units of a product, increasing the existing line when there is one: the same product with the same
   * options. A combo with other options is another line. With `limits`, a product that would go over them is not added
   * and the reason is returned; otherwise it returns null.
   */
  add(
    product: OrderDraftProduct,
    quantity = DEFAULT_ADD_QUANTITY,
    limits: DraftLimits = {},
  ): DraftRefusal | null {
    if (!isValidQuantity(quantity)) {
      return null;
    }
    const current = this.itemsState();
    const lineId = lineIdOf(product.productId, product.customization);
    const existing = current.find((item) => item.lineId === lineId);
    if (existing === undefined && current.length >= (limits.maxProducts ?? Infinity)) {
      return 'products-limit';
    }
    if ((existing?.quantity ?? 0) + quantity > (limits.maxQuantity ?? Infinity)) {
      return 'quantity-limit';
    }
    this.itemsState.set(
      existing === undefined
        ? [
            ...current,
            {
              lineId,
              productId: product.productId,
              name: product.name,
              unitPrice: product.unitPrice,
              quantity,
              customization: product.customization ?? null,
            },
          ]
        : current.map((item) =>
            item.lineId === lineId ? { ...item, quantity: item.quantity + quantity } : item,
          ),
    );
    return null;
  }

  /** Removes a whole line. Does nothing when the line is not in the draft. */
  remove(lineId: string): void {
    this.itemsState.update((items) => items.filter((item) => item.lineId !== lineId));
  }

  /**
   * Sets the quantity of an existing line. A quantity of zero or less removes the line;
   * a non-integer quantity is ignored. Does nothing when the line is not in the draft.
   */
  changeQuantity(lineId: string, quantity: number): void {
    if (!Number.isInteger(quantity)) {
      return;
    }
    if (quantity <= 0) {
      this.remove(lineId);
      return;
    }
    this.itemsState.update((items) =>
      items.map((item) => (item.lineId === lineId ? { ...item, quantity } : item)),
    );
  }

  /**
   * Starts modifying an order: the draft holds its lines until {@link endEdit}, and the new order the waiter was building, if any,
   * waits aside so it is not lost. Starting again on the order already being modified keeps the changes made so far.
   */
  beginEdit(orderId: string, items: readonly OrderDraftItem[]): void {
    if (this.editingState() === orderId) {
      return;
    }
    if (this.editingState() === null) {
      this.stashedItems = this.itemsState();
    }
    this.editingState.set(orderId);
    this.itemsState.set(items);
  }

  /** Discards the lines of the order being modified and brings back the new order that was waiting. */
  endEdit(): void {
    if (this.editingState() === null) {
      return;
    }
    this.itemsState.set(this.stashedItems);
    this.stashedItems = [];
    this.editingState.set(null);
  }

  /** Empties the draft. */
  clear(): void {
    this.itemsState.set([]);
  }
}

function isValidQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity > 0;
}
