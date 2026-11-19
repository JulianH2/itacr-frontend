import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AUTH_API_URL, AuthApiService } from './auth-api.service';
import { EmployeeRole } from './auth.models';

describe('AuthApiService', () => {
  it('should post the request of an account to the registration endpoint', () => {
    // Arrange
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const service = TestBed.inject(AuthApiService);
    const http = TestBed.inject(HttpTestingController);
    const request = {
      fullName: 'Ana López',
      email: 'ana.lopez',
      phone: '7711234567',
      role: EmployeeRole.Kitchen,
      pin: '4821',
      pinConfirmation: '4821',
      acceptedPrivacyNotice: true,
    } as const;

    // Act
    service.registerEmployee(request).subscribe();

    // Assert
    const call = http.expectOne(`${AUTH_API_URL}/registration-requests`);
    expect(call.request.method).toBe('POST');
    expect(call.request.body).toEqual(request);
    call.flush(null, { status: 202, statusText: 'Accepted' });
    http.verify();
  });
});
