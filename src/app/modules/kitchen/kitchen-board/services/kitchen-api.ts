import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

import type { KitchenQueue, KitchenStatusChange, KitchenStep } from '../models/kitchen.models';

/** The active orders, and moving them one step. Implemented by the HTTP client and by a mock. */
export interface KitchenApi {
  getQueue(): Observable<KitchenQueue>;
  changeStatus(orderId: string, status: KitchenStep): Observable<KitchenStatusChange>;
  /** Takes the order back to its previous status, a few seconds after an accidental tap. */
  undoStatusChange(orderId: string): Observable<KitchenStatusChange>;
}

export const KITCHEN_API = new InjectionToken<KitchenApi>('KITCHEN_API');
