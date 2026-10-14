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

export interface OrderDetailItem {
  readonly name: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly subtotal: number;
}

/** One step of the order timeline. `undone` marks a step back, when the kitchen undid its previous tap. */
export interface OrderTimelineEntry {
  readonly status: OrderStatus;
  readonly changedAt: string;
  readonly undone: boolean;
}

/** Answer of `GET /orders/{id}`: the order with its products and the timeline of its statuses, oldest first. */
export interface OrderDetail {
  readonly id: string;
  readonly orderNumber: number;
  readonly channel: OrderChannel;
  readonly status: OrderStatus;
  readonly tableNumber: number | null;
  readonly total: number;
  readonly createdAt: string;
  readonly readyAt: string | null;
  readonly items: readonly OrderDetailItem[];
  readonly timeline: readonly OrderTimelineEntry[];
}

/** One of the last orders of the waiter (`GET /orders/recent`), to open its detail. */
export interface RecentOrder {
  readonly id: string;
  readonly orderNumber: number;
  readonly channel: OrderChannel;
  readonly status: OrderStatus;
  readonly tableNumber: number | null;
  readonly createdAt: string;
}

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
