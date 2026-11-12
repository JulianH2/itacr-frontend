import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

import type {
  ManagerDashboard,
  ManagerOrdersPage,
  ManagerOrdersQuery,
} from '../models/manager.models';

/** Read-only access to the numbers of the manager's dashboard (HU_16). Implemented by the HTTP client and by a mock. */
export interface ManagerApi {
  /** The summary of the range: `from` inclusive and `to` exclusive, as UTC instants. */
  getDashboard(from: string, to: string): Observable<ManagerDashboard>;
  getOrders(query: ManagerOrdersQuery): Observable<ManagerOrdersPage>;
}

export const MANAGER_API = new InjectionToken<ManagerApi>('MANAGER_API');
