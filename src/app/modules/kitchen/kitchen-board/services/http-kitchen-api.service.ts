import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { environment } from '@env/environment';

import type { KitchenQueue, KitchenStatusChange, KitchenStep } from '../models/kitchen.models';
import type { KitchenApi } from './kitchen-api';

/**
 * Kitchen client for itacr-backend. The queue is live data: it lives under `/kitchen`, which no data group
 * of ngsw-config.json caches, so the service worker always goes to the network.
 */
@Injectable()
export class HttpKitchenApiService implements KitchenApi {
  private readonly http = inject(HttpClient);

  getQueue(): Observable<KitchenQueue> {
    return this.http.get<KitchenQueue>(`${environment.apiBaseUrl}/kitchen/queue`);
  }

  changeStatus(orderId: string, status: KitchenStep): Observable<KitchenStatusChange> {
    return this.http.post<KitchenStatusChange>(
      `${environment.apiBaseUrl}/orders/${orderId}/status`,
      { status },
    );
  }

  undoStatusChange(orderId: string): Observable<KitchenStatusChange> {
    return this.http.post<KitchenStatusChange>(
      `${environment.apiBaseUrl}/orders/${orderId}/status/undo`,
      null,
    );
  }
}
