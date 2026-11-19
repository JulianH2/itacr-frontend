import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { environment } from '@env/environment';

import type {
  AccessRequests,
  ManagerDashboard,
  ManagerOrdersPage,
  ManagerOrdersQuery,
} from '../models/manager.models';
import type { ManagerApi } from './manager-api';

/** Client of the manager endpoints of itacr-backend. Only a manager can call them. */
@Injectable()
export class HttpManagerApiService implements ManagerApi {
  private readonly http = inject(HttpClient);
  private readonly managerUrl = `${environment.apiBaseUrl}/manager`;

  getDashboard(from: string, to: string): Observable<ManagerDashboard> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<ManagerDashboard>(`${this.managerUrl}/dashboard`, { params });
  }

  getOrders(query: ManagerOrdersQuery): Observable<ManagerOrdersPage> {
    let params = new HttpParams()
      .set('from', query.from)
      .set('to', query.to)
      .set('page', query.page)
      .set('pageSize', query.pageSize);
    if (query.channel !== null) {
      params = params.set('channel', query.channel);
    }
    if (query.status !== null) {
      params = params.set('status', query.status);
    }
    return this.http.get<ManagerOrdersPage>(`${this.managerUrl}/orders`, { params });
  }

  getAccessRequests(): Observable<AccessRequests> {
    return this.http.get<AccessRequests>(`${this.managerUrl}/access-requests`);
  }

  approveAccount(employeeId: string): Observable<void> {
    return this.http.post<void>(`${this.managerUrl}/access-requests/${employeeId}/approve`, null);
  }

  rejectAccount(employeeId: string): Observable<void> {
    return this.http.post<void>(`${this.managerUrl}/access-requests/${employeeId}/reject`, null);
  }

  assignTemporaryPin(employeeId: string, pin: string): Observable<void> {
    return this.http.post<void>(
      `${this.managerUrl}/pin-reset-requests/${employeeId}/temporary-pin`,
      {
        pin,
      },
    );
  }
}
