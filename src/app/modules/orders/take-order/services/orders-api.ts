import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

import type { CreateOrderRequest, DiningTable, PlacedOrder } from '../models/take-order.models';

/** What the waiter needs to send an order. Implemented by the HTTP client and by a mock. */
export interface OrdersApi {
  getDiningTables(): Observable<readonly DiningTable[]>;
  createOrder(request: CreateOrderRequest): Observable<PlacedOrder>;
}

export const ORDERS_API = new InjectionToken<OrdersApi>('ORDERS_API');
