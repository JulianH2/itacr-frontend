import { TestBed } from '@angular/core/testing';
import {
  type ActivatedRouteSnapshot,
  type CanActivateFn,
  type RouterStateSnapshot,
  Router,
  UrlTree,
  provideRouter,
} from '@angular/router';

import { ROLE_HOME } from '@shared/auth/auth-messages';
import { EmployeeRole } from '@shared/auth/auth.models';
import { SESSION_STORAGE, SessionService } from '@shared/auth/session.service';
import { loginResponse } from '@shared/testing/auth-fixtures';
import { MemoryStorage } from '@shared/testing/memory-storage';

import { LOGIN_ROUTES } from './login.routes';

describe('LOGIN_ROUTES', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: SESSION_STORAGE, useValue: new MemoryStorage() }],
    });
  });

  it('should load the page of every path', async () => {
    for (const route of LOGIN_ROUTES) {
      // Act
      const component = await route.loadComponent?.();

      // Assert
      expect(component).toBeDefined();
    }
  });

  it('should keep the guest guard on the paths that open a session', () => {
    // Assert: only the redirect page is open, because it is the page that receives the session.
    const guarded = LOGIN_ROUTES.filter((route) => route.canActivate !== undefined).map(
      (r) => r.path,
    );
    expect(guarded).toEqual(['', 'password', 'register']);
  });

  it('should send an employee with a session to their own panel', () => {
    // Arrange
    TestBed.inject(SessionService).start(loginResponse(EmployeeRole.Waiter));
    const guard = LOGIN_ROUTES[0].canActivate?.[0] as CanActivateFn;

    // Act
    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, { url: '/login' } as RouterStateSnapshot),
    );

    // Assert
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(
      ROLE_HOME[EmployeeRole.Waiter],
    );
  });

  it('should let a visitor without a session open the login page', () => {
    // Arrange
    const guard = LOGIN_ROUTES[0].canActivate?.[0] as CanActivateFn;

    // Act
    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, { url: '/login' } as RouterStateSnapshot),
    );

    // Assert
    expect(result).toBe(true);
  });
});
