/** The two channels the manager compares: the orders a waiter took, and the pickup orders of customers (HU_16). */
export type ManagerChannel = 'Waiter' | 'Pickup';

export type ManagerOrderStatus = 'New' | 'InPreparation' | 'Ready' | 'Delivered';

/** How an order reached the restaurant: a waiter took it for a table or to take away, or a customer sent it from the phone. */
export type ManagerOrderChannel = 'DineIn' | 'TakeAway' | 'MobileApp';

/** The numbers of one channel in the date range, as `GET /manager/dashboard` returns them. */
export interface ChannelMetrics {
  readonly channel: ManagerChannel;
  readonly orders: number;
  readonly deliveredOrders: number;
  /** Total of the orders delivered in the range, in MXN. */
  readonly sales: number;
  readonly preparedOrders: number;
  /** Average time between the creation of an order and the moment it became Ready; null when none was prepared. */
  readonly averagePreparationSeconds: number | null;
}

/** An hour of UTC that had orders created or sales. */
export interface TrendPoint {
  readonly hourStart: string;
  readonly orders: number;
  readonly sales: number;
}

export interface ManagerDashboard {
  readonly from: string;
  readonly to: string;
  readonly totalOrders: number;
  readonly deliveredOrders: number;
  readonly sales: number;
  /** Always both channels, Waiter first. */
  readonly channels: readonly ChannelMetrics[];
  /** The channel that takes longer, only when there is something to compare. */
  readonly slowestChannel: ManagerChannel | null;
  readonly trend: readonly TrendPoint[];
}

/** A row of the table of recent orders. */
export interface ManagerOrderRow {
  readonly id: string;
  readonly orderNumber: number;
  readonly channel: ManagerOrderChannel;
  readonly status: ManagerOrderStatus;
  readonly tableNumber: number | null;
  readonly total: number;
  readonly createdAt: string;
  readonly readyAt: string | null;
  readonly deliveredAt: string | null;
  /** Seconds between the creation and the moment the order became Ready; null while it is not Ready. */
  readonly preparationSeconds: number | null;
}

export interface ManagerOrdersPage {
  readonly page: number;
  readonly pageSize: number;
  /** Orders that match the filters, in all the pages. */
  readonly totalCount: number;
  readonly items: readonly ManagerOrderRow[];
}

/** The filters of the table of recent orders. A null filter means every channel or every status. */
export interface ManagerOrdersQuery {
  readonly from: string;
  readonly to: string;
  readonly channel: ManagerChannel | null;
  readonly status: ManagerOrderStatus | null;
  readonly page: number;
  readonly pageSize: number;
}
