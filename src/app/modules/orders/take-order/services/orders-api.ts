import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

import type {
  CreateOrderRequest,
  DiningTable,
  OrderDetail,
  PlacedOrder,
  ActiveOrder,
} from '../models/take-order.models';

/** What the waiter needs to send an order and follow it. Implemented by the HTTP client and by a mock. */
export interface OrdersApi {
  getDiningTables(): Observable<readonly DiningTable[]>;
  createOrder(request: CreateOrderRequest): Observable<PlacedOrder>;
  getOrder(orderId: string): Observable<OrderDetail>;
  /** Orders of the signed-in waiter still New, InPreparation or Ready, newest first. */
  getActiveOrders(): Observable<readonly ActiveOrder[]>;
}

export const ORDERS_API = new InjectionToken<OrdersApi>('ORDERS_API');
