export interface DiningTable {
  readonly id: string;
  readonly number: number;
}

export interface CreateOrderItem {
  readonly productId: string;
  readonly quantity: number;
}

/** Body of `POST /orders`. Prices are never sent: the API takes them from the menu. */
export interface CreateOrderRequest {
  /** Generated once per order on the device, so a retry never creates a second order. */
  readonly clientOrderId: string;
  readonly tableId: string | null;
  readonly takeAway: boolean;
  readonly items: readonly CreateOrderItem[];
}

export type OrderChannel = 'DineIn' | 'TakeAway' | 'MobileApp';

export type OrderStatus = 'New' | 'InPreparation' | 'Ready' | 'Delivered';

export interface PlacedOrderItem {
  readonly productId: string;
  readonly name: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly subtotal: number;
}

/** The order as the API saved it (`201`), or as it already existed when the request was a retry (`200`). */
export interface PlacedOrder {
  readonly id: string;
  readonly clientOrderId: string;
  readonly orderNumber: number;
  readonly status: OrderStatus;
  readonly channel: OrderChannel;
  readonly tableNumber: number | null;
  readonly total: number;
  readonly createdAt: string;
  readonly items: readonly PlacedOrderItem[];
}
