import {
  HttpClient,
  HttpStatusCode,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import type { MockInstance } from 'vitest';

import { environment } from '@env/environment';
import { AUTH_API_URL } from '@core/auth/auth-api.service';
import { EmployeeRole } from '@core/auth/auth.models';
import { SESSION_STORAGE, SessionService } from '@core/auth/session.service';
import { loginResponse } from '@core/testing/auth-fixtures';
import { MemoryStorage } from '@core/testing/memory-storage';

import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let session: SessionService;
  let navigateByUrl: MockInstance<Router['navigateByUrl']>;

  function failWithUnauthorized(url: string): void {
    http.get(url).subscribe({ error: () => undefined });
    backend
      .expectOne(url)
      .flush(null, { status: HttpStatusCode.Unauthorized, statusText: 'Unauthorized' });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: SESSION_STORAGE, useValue: new MemoryStorage() },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    session = TestBed.inject(SessionService);
    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => {
    backend.verify();
  });

  it('should send the bearer token when the request goes to the API', () => {
    // Arrange
    session.start(loginResponse(EmployeeRole.Waiter));

    // Act
    http.get(`${environment.apiBaseUrl}/orders`).subscribe();

    // Assert
    const request = backend.expectOne(`${environment.apiBaseUrl}/orders`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer access-token');
    request.flush([]);
  });

  it('should not send the token when the request goes to another site', () => {
    // Arrange
    session.start(loginResponse(EmployeeRole.Waiter));

    // Act
    http.get('https://fonts.googleapis.com/css').subscribe();

    // Assert
    const request = backend.expectOne('https://fonts.googleapis.com/css');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush('');
  });

  it('should expire the session and ask for the PIN when the API rejects the token', () => {
    // Arrange
    session.start(loginResponse(EmployeeRole.Waiter));

    // Act
    failWithUnauthorized(`${environment.apiBaseUrl}/orders`);

    // Assert
    expect(session.session()).toBeNull();
    expect(session.lastEmployee()?.role).toBe(EmployeeRole.Waiter);
    expect(navigateByUrl).toHaveBeenCalledTimes(1);
  });

  it('should leave the session alone when a login attempt is rejected', () => {
    // Act
    failWithUnauthorized(`${AUTH_API_URL}/login/pin`);

    // Assert
    expect(navigateByUrl).not.toHaveBeenCalled();
  });
});
