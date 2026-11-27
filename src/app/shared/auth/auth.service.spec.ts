import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EmployeeRole, SessionEmployee } from './auth.models';
import { AuthService } from './auth.service';
import { SESSION_STORAGE } from './session.service';
import { MemoryStorage } from '@shared/testing/memory-storage';

describe('AuthService.homeUrl', () => {
  const kitchen: SessionEmployee = {
    id: 'kitchen-1',
    displayName: 'Luis P.',
    role: EmployeeRole.Kitchen,
  };
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: SESSION_STORAGE, useValue: new MemoryStorage() },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('should go back to the internal page the employee came from', () => {
    // Act / Assert
    expect(service.homeUrl(kitchen, '/kitchen/orders')).toBe('/kitchen/orders');
  });

  it.each([null, undefined, '/', '//evil.example.com', 'https://evil.example.com'])(
    'should go to the home of the role when the return url is %s',
    (returnUrl) => {
      // Act / Assert
      expect(service.homeUrl(kitchen, returnUrl)).toBe('/kitchen');
    },
  );
});
