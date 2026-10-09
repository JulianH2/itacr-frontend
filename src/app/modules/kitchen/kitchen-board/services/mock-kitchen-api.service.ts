import { Injectable } from '@angular/core';
import { type Observable, delay, of } from 'rxjs';

import type { KitchenQueue } from '../models/kitchen.models';
import type { KitchenApi } from './kitchen-api';
import { mockKitchenQueue } from './mock-kitchen.data';

const MOCK_LATENCY_MS = 300;

/** In-memory kitchen queue used until `GET /kitchen/queue` is deployed. It adds a new order every few polls. */
@Injectable()
export class MockKitchenApiService implements KitchenApi {
  private calls = 0;

  getQueue(): Observable<KitchenQueue> {
    this.calls += 1;
    return of(mockKitchenQueue(Date.now(), this.calls)).pipe(delay(MOCK_LATENCY_MS));
  }
}
