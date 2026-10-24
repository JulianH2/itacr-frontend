import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { environment } from '@env/environment';

import type {
  CreateOrderRequest,
  DiningTable,
  OrderDetail,
  PlacedOrder,
  RecentOrder,
} from '../models/take-order.models';
import type { OrdersApi } from './orders-api';

/**
 * Orders client for itacr-backend (`GET /dining-tables`, `POST /orders`, waiter role). Orders are never cached by
 * the service worker; the tables are (`dining-tables` in `ngsw-config.json`), so a table can be picked offline.
 */
@Injectable()
export class HttpOrdersApiService implements OrdersApi {
  private readonly http = inject(HttpClient);

  getDiningTables(): Observable<readonly DiningTable[]> {
    return this.http.get<readonly DiningTable[]>(`${environment.apiBaseUrl}/dining-tables`);
  }

  createOrder(request: CreateOrderRequest): Observable<PlacedOrder> {
    return this.http.post<PlacedOrder>(`${environment.apiBaseUrl}/orders`, request);
  }

  getOrder(orderId: string): Observable<OrderDetail> {
    return this.http.get<OrderDetail>(`${environment.apiBaseUrl}/orders/${orderId}`);
  }

  getRecentOrders(): Observable<readonly RecentOrder[]> {
    return this.http.get<readonly RecentOrder[]>(`${environment.apiBaseUrl}/orders/recent`);
  }
}
