/** Statuses shown on the board. Delivered orders are not part of the queue. */
export type KitchenOrderStatus = 'New' | 'InPreparation' | 'Ready';

export type KitchenOrderChannel = 'DineIn' | 'TakeAway' | 'MobileApp';

/** A product of an order with the customization the kitchen has to follow. */
export interface KitchenOrderItem {
  readonly productName: string;
  readonly quantity: number;
  readonly size: string | null;
  readonly drink: string | null;
  readonly extras: readonly string[];
  readonly exclusions: readonly string[];
}

/** An active order, as returned by `GET /kitchen/queue`. */
export interface KitchenOrder {
  readonly id: string;
  readonly orderNumber: number;
  readonly channel: KitchenOrderChannel;
  readonly status: KitchenOrderStatus;
  /** Table number of a dine-in order, null for take-away and mobile orders. */
  readonly tableNumber: number | null;
  /** UTC instant (ISO 8601) when the order was created; the queue is ordered by it. */
  readonly createdAt: string;
  readonly items: readonly KitchenOrderItem[];
}

export interface KitchenQueue {
  /** UTC instant (ISO 8601) of the server when it answered, so timers do not depend on the device clock. */
  readonly serverTime: string;
  readonly orders: readonly KitchenOrder[];
}
