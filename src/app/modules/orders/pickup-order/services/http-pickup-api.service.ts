import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { environment } from '@env/environment';

import type { CreatePickupOrderRequest, PickupOrder } from '../models/pickup-order.models';
import type { PickupApi } from './pickup-api';

/**
 * Pickup client for itacr-backend (`POST /public/orders` and `GET /public/orders/{clientOrderId}`, no login). These are
 * live data and never cached by the service worker: `ngsw-config.json` has no data group for `/public/`.
 */
@Injectable()
export class HttpPickupApiService implements PickupApi {
  private readonly http = inject(HttpClient);

  createOrder(request: CreatePickupOrderRequest): Observable<PickupOrder> {
    return this.http.post<PickupOrder>(`${environment.apiBaseUrl}/public/orders`, request);
  }

  getOrder(clientOrderId: string): Observable<PickupOrder> {
    return this.http.get<PickupOrder>(
      `${environment.apiBaseUrl}/public/orders/${encodeURIComponent(clientOrderId)}`,
    );
  }
}
