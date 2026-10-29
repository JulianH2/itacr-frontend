import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

import type {
  CreateOrderRequest,
  DeliveredOrder,
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
  /** Marks a Ready order as delivered (HU_10). Answers 409 when it is not Ready or was already delivered. */
  deliverOrder(orderId: string): Observable<DeliveredOrder>;
  /** The pickup orders of customers that are Ready, which no waiter took, oldest first. */
  getReadyPickupOrders(): Observable<readonly ActiveOrder[]>;
}

export const ORDERS_API = new InjectionToken<OrdersApi>('ORDERS_API');
