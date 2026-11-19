export interface DiningTable {
  readonly id: string;
  readonly number: number;
}

export interface CreateOrderItem {
  readonly productId: string;
  readonly quantity: number;
  /** Only for a combo (HU_12): the options chosen from `GET /catalog/combo-options`, by id. */
  readonly sizeId?: string;
  readonly drinkId?: string;
  readonly extraIds?: readonly string[];
  readonly exclusionIds?: readonly string[];
}

/** Body of `POST /orders`. Prices are never sent: the API takes them from the menu. */
export interface CreateOrderRequest {
  /** Generated once per order on the device, so a retry never creates a second order. */
  readonly clientOrderId: string;
  readonly tableId: string | null;
  readonly takeAway: boolean;
  readonly items: readonly CreateOrderItem[];
  /**
   * When the waiter sent it on the device. Only orders that waited offline carry it, so the kitchen sees them in their
   * place; an order sent online leaves it out and the server uses its own clock, whatever the device clock says.
   */
  readonly createdAt?: string;
}

/**
 * Body of `PUT /orders/{id}` (HU_13): the whole new content of an order that is New or InPreparation. `items` replaces every
 * product, `tableId` is the table of a dine-in order (null for take-away), and `note` is added to the notes of the order.
 */
export interface UpdateOrderRequest {
  readonly tableId: string | null;
  readonly items: readonly CreateOrderItem[];
  readonly note?: string;
}

/** An order of the offline queue: it always keeps the time the waiter sent it. */
export type QueuedOrderRequest = CreateOrderRequest & { readonly createdAt: string };

/** `pending` waits for the connection; `failed` was rejected by the API and only the waiter can discard it. */
export type PendingOrderState = 'pending' | 'failed';

/** An order saved on the device because it could not reach the API. It is not in the kitchen yet. */
export interface PendingOrder {
  readonly clientOrderId: string;
  /** Only this waiter's session sends it, so another waiter on the same device never sends it as theirs. */
  readonly employeeId: string;
  readonly request: QueuedOrderRequest;
  readonly tableNumber: number | null;
  readonly itemCount: number;
  readonly total: number;
  readonly state: PendingOrderState;
  readonly error: string | null;
}

export type OrderChannel = 'DineIn' | 'TakeAway' | 'MobileApp';

export type OrderStatus = 'New' | 'InPreparation' | 'Ready' | 'Delivered';

export interface OrderDetailItem {
  /** The menu product and the options by id, to edit the order (HU_13). Left out by an API that does not send them yet. */
  readonly productId?: string;
  readonly sizeId?: string | null;
  readonly drinkId?: string | null;
  /** In the same order as `extras` and `exclusions`; an entry is null when its option is no longer on the menu. */
  readonly extraIds?: readonly (string | null)[];
  readonly exclusionIds?: readonly (string | null)[];
  readonly name: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly subtotal: number;
  /** What was chosen for a combo (HU_12). Left out by an API that does not send them yet. */
  readonly size?: string | null;
  readonly drink?: string | null;
  readonly extras?: readonly string[];
  readonly exclusions?: readonly string[];
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
  readonly deliveredAt: string | null;
  /** When the waiter last modified the order (HU_13), or null when it never was. */
  readonly modifiedAt?: string | null;
  readonly items: readonly OrderDetailItem[];
  /** The notes the waiter added when modifying the order, oldest first. */
  readonly notes?: readonly string[];
  readonly timeline: readonly OrderTimelineEntry[];
}

/** An order after the waiter handed it over (`POST /orders/{id}/deliver`). */
export interface DeliveredOrder {
  readonly id: string;
  readonly status: 'Delivered';
  readonly deliveredAt: string;
}

/** One of the last orders of the waiter (`GET /orders/active`), to open its detail. */
export interface ActiveOrder {
  readonly id: string;
  readonly orderNumber: number;
  readonly channel: OrderChannel;
  readonly status: OrderStatus;
  readonly tableNumber: number | null;
  readonly createdAt: string;
  /** Instant of its last status change, to tell how long it has been ready. */
  readonly lastStatusChangeAt: string;
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
