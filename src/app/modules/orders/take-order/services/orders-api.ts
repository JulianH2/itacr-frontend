import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

import type {
  CreateOrderRequest,
  DeliveredOrder,
  DiningTable,
  OrderDetail,
  PlacedOrder,
  ActiveOrder,
  UpdateOrderRequest,
} from '../models/take-order.models';

/** What the waiter needs to send an order and follow it. Implemented by the HTTP client and by a mock. */
export interface OrdersApi {
  getDiningTables(): Observable<readonly DiningTable[]>;
  createOrder(request: CreateOrderRequest): Observable<PlacedOrder>;
  getOrder(orderId: string): Observable<OrderDetail>;
  /**
   * Replaces the products, the table, and adds a note to an order that is New or InPreparation (HU_13), and answers the order as it
   * is now. 404 for another waiter's order, 409 when it is Ready or Delivered or changed meanwhile, 400 for no products.
   */
  updateOrder(orderId: string, request: UpdateOrderRequest): Observable<OrderDetail>;
  /** Orders of the signed-in waiter still New, InPreparation or Ready, newest first. */
  getActiveOrders(): Observable<readonly ActiveOrder[]>;
  /** Marks a Ready order as delivered (HU_10). Answers 409 when it is not Ready or was already delivered. */
  deliverOrder(orderId: string): Observable<DeliveredOrder>;
  /** The pickup orders of customers that are Ready, which no waiter took, oldest first. */
  getReadyPickupOrders(): Observable<readonly ActiveOrder[]>;
}

export const ORDERS_API = new InjectionToken<OrdersApi>('ORDERS_API');
