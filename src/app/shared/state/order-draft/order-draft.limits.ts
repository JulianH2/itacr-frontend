/** Caps on what an order may hold. A field left out means no cap. */
export interface DraftLimits {
  /** Most units of one product. */
  readonly maxQuantity?: number;
  /** Most different products. */
  readonly maxProducts?: number;
}

/**
 * What the backend accepts in the order of a customer without an account (ITACR-42): 1 to 10 units of a product and
 * at most 20 products. The waiter has no cap in the app; the API allows 50 products with up to 99 units.
 */
export const PICKUP_ORDER_LIMITS = {
  maxQuantity: 10,
  maxProducts: 20,
} as const satisfies DraftLimits;

/** Why a product was not added to the draft. */
export type DraftRefusal = 'quantity-limit' | 'products-limit';
