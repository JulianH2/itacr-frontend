import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

import type { KitchenQueue } from '../models/kitchen.models';

/** Read-only access to the active orders. Implemented by the HTTP client and by a mock. */
export interface KitchenApi {
  getQueue(): Observable<KitchenQueue>;
}

export const KITCHEN_API = new InjectionToken<KitchenApi>('KITCHEN_API');
