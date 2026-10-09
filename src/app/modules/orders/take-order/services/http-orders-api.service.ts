import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { environment } from '@env/environment';

import type { CreateOrderRequest, DiningTable, PlacedOrder } from '../models/take-order.models';
import type { OrdersApi } from './orders-api';

/**
 * Orders client for itacr-backend (`GET /dining-tables`, `POST /orders`, waiter role). Orders are never cached by
 * the service worker: `ngsw-config.json` has no data group for these URLs.
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
}
