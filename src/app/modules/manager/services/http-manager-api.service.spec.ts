import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '@env/environment';

import type { AccessRequests, ManagerDashboard, ManagerOrdersPage } from '../models/manager.models';
import { HttpManagerApiService } from './http-manager-api.service';

const MANAGER_URL = `${environment.apiBaseUrl}/manager`;

describe('HttpManagerApiService', () => {
  let service: HttpManagerApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HttpManagerApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(HttpManagerApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should request the dashboard with the dates of the period', () => {
    // Act
    let received: ManagerDashboard | undefined;
    service.getDashboard('2026-10-01', '2026-10-31').subscribe((result) => (received = result));

    // Assert
    const request = http.expectOne(
      (candidate) =>
        candidate.url === `${MANAGER_URL}/dashboard` &&
        candidate.params.get('from') === '2026-10-01' &&
        candidate.params.get('to') === '2026-10-31',
    );
    expect(request.request.method).toBe('GET');
    request.flush({} as ManagerDashboard);
    expect(received).toEqual({});
  });

  it('should request the orders of the period and of the page', () => {
    // Act
    service
      .getOrders({
        from: '2026-10-01',
        to: '2026-10-31',
        page: 2,
        pageSize: 20,
        channel: null,
        status: null,
      })
      .subscribe();

    // Assert
    const request = http.expectOne(
      (candidate) =>
        candidate.url === `${MANAGER_URL}/orders` &&
        candidate.params.get('from') === '2026-10-01' &&
        candidate.params.get('to') === '2026-10-31' &&
        candidate.params.get('page') === '2' &&
        candidate.params.get('pageSize') === '20',
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.params.has('channel')).toBe(false);
    expect(request.request.params.has('status')).toBe(false);
    request.flush({} as ManagerOrdersPage);
  });

  it('should filter the orders by channel and by status when they are asked', () => {
    // Act
    service
      .getOrders({
        from: '2026-10-01',
        to: '2026-10-31',
        page: 1,
        pageSize: 20,
        channel: 'Waiter',
        status: 'New',
      })
      .subscribe();

    // Assert
    const request = http.expectOne(
      (candidate) =>
        candidate.url === `${MANAGER_URL}/orders` &&
        candidate.params.get('channel') === 'Waiter' &&
        candidate.params.get('status') === 'New',
    );
    request.flush({} as ManagerOrdersPage);
  });

  it('should request the access requests of the manager', () => {
    // Act
    let received: AccessRequests | undefined;
    service.getAccessRequests().subscribe((result) => (received = result));

    // Assert
    const request = http.expectOne(`${MANAGER_URL}/access-requests`);
    expect(request.request.method).toBe('GET');
    request.flush({ pending: [] });
    expect(received).toEqual({ pending: [] });
  });

  it('should approve an account with its own path', () => {
    // Act
    service.approveAccount('employee-1').subscribe();

    // Assert
    const request = http.expectOne(`${MANAGER_URL}/access-requests/employee-1/approve`);
    expect(request.request.method).toBe('POST');
    request.flush(null);
  });

  it('should reject an account with its own path', () => {
    // Act
    service.rejectAccount('employee-1').subscribe();

    // Assert
    const request = http.expectOne(`${MANAGER_URL}/access-requests/employee-1/reject`);
    expect(request.request.method).toBe('POST');
    request.flush(null);
  });

  it('should send the temporary PIN of an employee to the reset path', () => {
    // Act
    service.assignTemporaryPin('employee-1', '1234').subscribe();

    // Assert
    const request = http.expectOne(`${MANAGER_URL}/pin-reset-requests/employee-1/temporary-pin`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ pin: '1234' });
    request.flush(null);
  });
});
