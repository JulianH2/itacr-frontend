import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '@env/environment';

import {
  EmployeeOption,
  EmployeeRole,
  LoginResponse,
  PasswordLoginRequest,
  PinLoginRequest,
  PinResetRequest,
} from './auth.models';

export const AUTH_API_URL = `${environment.apiBaseUrl}/auth`;

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

  getEmployees(role: EmployeeRole): Observable<readonly EmployeeOption[]> {
    return this.http.get<readonly EmployeeOption[]>(`${AUTH_API_URL}/employees`, {
      params: { role },
    });
  }

  loginWithPin(request: PinLoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${AUTH_API_URL}/login/pin`, request);
  }

  loginWithPassword(request: PasswordLoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${AUTH_API_URL}/login/password`, request);
  }

  requestPinReset(request: PinResetRequest): Observable<void> {
    return this.http.post<void>(`${AUTH_API_URL}/pin-reset-requests`, request);
  }
}
