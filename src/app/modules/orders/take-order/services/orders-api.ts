import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

import type {
  CreateOrderRequest,
  DiningTable,
  OrderDetail,
  PlacedOrder,
  RecentOrder,
} from '../models/take-order.models';

/** What the waiter needs to send an order and follow it. Implemented by the HTTP client and by a mock. */
export interface OrdersApi {
  getDiningTables(): Observable<readonly DiningTable[]>;
  createOrder(request: CreateOrderRequest): Observable<PlacedOrder>;
  getOrder(orderId: string): Observable<OrderDetail>;
  /** The last orders of the signed-in waiter, newest first. */
  getRecentOrders(): Observable<readonly RecentOrder[]>;
}

export const ORDERS_API = new InjectionToken<OrdersApi>('ORDERS_API');
