import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  GuardResult,
  MaybeAsync,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';

import { EmployeeRole } from '@shared/auth/auth.models';
import { SESSION_STORAGE, SessionService } from '@shared/auth/session.service';
import { loginResponse, PAST_EXPIRATION } from '@shared/testing/auth-fixtures';
import { MemoryStorage } from '@shared/testing/memory-storage';

import { roleGuard } from './role.guard';

describe('roleGuard', () => {
  function runGuard(role: EmployeeRole, url: string): MaybeAsync<GuardResult> {
    return TestBed.runInInjectionContext(() =>
      roleGuard(role)({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    );
  }

  function serialize(result: MaybeAsync<GuardResult>): string {
    return result instanceof UrlTree ? TestBed.inject(Router).serializeUrl(result) : String(result);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: SESSION_STORAGE, useValue: new MemoryStorage() }],
    });
  });

  it('should allow the panel when the employee has the role', () => {
    // Arrange
    TestBed.inject(SessionService).start(loginResponse(EmployeeRole.Waiter));

    // Act
    const result = runGuard(EmployeeRole.Waiter, '/orders');

    // Assert
    expect(result).toBe(true);
  });

  it('should send the employee to their own panel when the screen belongs to another role', () => {
    // Arrange
    TestBed.inject(SessionService).start(loginResponse(EmployeeRole.Kitchen));

    // Act
    const result = runGuard(EmployeeRole.Manager, '/manager');

    // Assert
    expect(serialize(result)).toBe('/kitchen');
  });

  it('should go to login with the requested page when nobody is logged in', () => {
    // Act
    const result = runGuard(EmployeeRole.Waiter, '/orders');

    // Assert
    expect(serialize(result)).toBe('/login?returnUrl=%2Forders');
  });

  it('should ask for the PIN again and keep the employee when the token expired', () => {
    // Arrange
    const session = TestBed.inject(SessionService);
    session.start(loginResponse(EmployeeRole.Waiter, PAST_EXPIRATION));

    // Act
    const result = runGuard(EmployeeRole.Waiter, '/orders');

    // Assert
    expect(serialize(result)).toBe('/login?reason=expired&returnUrl=%2Forders');
    expect(session.session()).toBeNull();
    expect(session.lastEmployee()?.role).toBe(EmployeeRole.Waiter);
  });
});
