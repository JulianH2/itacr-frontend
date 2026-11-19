import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

import type {
  AccessRequests,
  ManagerDashboard,
  ManagerOrdersPage,
  ManagerOrdersQuery,
} from '../models/manager.models';

/**
 * What the manager's dashboard asks the API for: the numbers (HU_16, read only) and the access requests to attend (HU_15).
 * Implemented by the HTTP client and by a mock.
 */
export interface ManagerApi {
  /** The summary of the range: `from` inclusive and `to` exclusive, as UTC instants. */
  getDashboard(from: string, to: string): Observable<ManagerDashboard>;
  getOrders(query: ManagerOrdersQuery): Observable<ManagerOrdersPage>;
  getAccessRequests(): Observable<AccessRequests>;
  /** The account becomes active and the employee can sign in. Fails with 409 when another manager decided first. */
  approveAccount(employeeId: string): Observable<void>;
  /** The account becomes rejected and the employee cannot sign in. Fails with 409 when another manager decided first. */
  rejectAccount(employeeId: string): Observable<void>;
  /** Answers a PIN reset request with a 4-digit PIN the employee signs in with. Fails with 409 when it was already answered. */
  assignTemporaryPin(employeeId: string, pin: string): Observable<void>;
}

export const MANAGER_API = new InjectionToken<ManagerApi>('MANAGER_API');
