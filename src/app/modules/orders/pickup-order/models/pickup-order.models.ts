/** Statuses of an order, in the order the kitchen moves it. */
export type PickupOrderStatus = 'New' | 'InPreparation' | 'Ready' | 'Delivered';

export interface PickupOrderItemRequest {
  readonly productId: string;
  readonly quantity: number;
  /** Only for a combo (HU_12): the options chosen from `GET /catalog/combo-options`, by id. */
  readonly sizeId?: string;
  readonly drinkId?: string;
  readonly extraIds?: readonly string[];
  readonly exclusionIds?: readonly string[];
}

/** Body of `POST /public/orders`. Prices are never sent: the API takes them from the menu. */
export interface CreatePickupOrderRequest {
  /** Generated once per order on the device, so a retry never creates a second order. */
  readonly clientOrderId: string;
  readonly name: string;
  /** Exactly 10 digits. */
  readonly phone: string;
  readonly items: readonly PickupOrderItemRequest[];
}

export interface PickupOrderItem {
  readonly name: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly subtotal: number;
}

/**
 * Answer of `POST /public/orders` and of `GET /public/orders/{clientOrderId}`. It never carries the name or the phone
 * of the customer.
 */
export interface PickupOrder {
  readonly clientOrderId: string;
  readonly orderNumber: number;
  readonly status: PickupOrderStatus;
  readonly total: number;
  readonly createdAt: string;
  readonly items: readonly PickupOrderItem[];
}
