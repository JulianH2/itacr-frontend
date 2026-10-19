import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

import type { CreatePickupOrderRequest, PickupOrder } from '../models/pickup-order.models';

/** What a customer without an account needs to send an order and follow it. Implemented by the HTTP client and by a mock. */
export interface PickupApi {
  createOrder(request: CreatePickupOrderRequest): Observable<PickupOrder>;
  /** The order of a receipt. Answers `404` when it does not exist or is not a pickup order. */
  getOrder(clientOrderId: string): Observable<PickupOrder>;
}

export const PICKUP_API = new InjectionToken<PickupApi>('PICKUP_API');
