import { TestBed } from '@angular/core/testing';
import {
  type ActivatedRouteSnapshot,
  type CanActivateFn,
  type RouterStateSnapshot,
  Router,
  UrlTree,
  provideRouter,
} from '@angular/router';

import { EmployeeRole } from '@shared/auth/auth.models';
import { ROLE_HOME } from '@shared/auth/auth-messages';
import { SESSION_STORAGE, SessionService } from '@shared/auth/session.service';
import { loginResponse } from '@shared/testing/auth-fixtures';
import { MemoryStorage } from '@shared/testing/memory-storage';

import { routes } from './app.routes';

/** The paths of the table that only some roles can open, with the roles that can. */
const PROTECTED_PATHS: readonly { path: string; roles: readonly EmployeeRole[] }[] = [
  { path: 'orders', roles: [EmployeeRole.Waiter] },
  { path: 'kitchen', roles: [EmployeeRole.Kitchen, EmployeeRole.Manager] },
  { path: 'manager/orders/:id', roles: [EmployeeRole.Manager] },
  { path: 'manager', roles: [EmployeeRole.Manager] },
];

const ALL_ROLES: readonly EmployeeRole[] = [
  EmployeeRole.Waiter,
  EmployeeRole.Kitchen,
  EmployeeRole.Manager,
];

describe('routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: SESSION_STORAGE, useValue: new MemoryStorage() }],
    });
  });

  function openKitchen(role: EmployeeRole): unknown {
    return openPath('kitchen', role);
  }

  /** Runs the guard of a path with an employee of the given role and returns what the guard answers. */
  function openPath(path: string, role: EmployeeRole): unknown {
    TestBed.inject(SessionService).start(loginResponse(role));
    const guard = routes.find((route) => route.path === path)?.canActivate?.[0] as CanActivateFn;
    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, { url: `/${path}` } as RouterStateSnapshot),
    );
    return result instanceof UrlTree ? TestBed.inject(Router).serializeUrl(result) : result;
  }

  it.each([EmployeeRole.Kitchen, EmployeeRole.Manager])(
    'should let a %s employee open the kitchen board',
    (role) => {
      // Act / Assert
      expect(openKitchen(role)).toBe(true);
    },
  );

  it('should send a waiter to their own panel when they open the kitchen board', () => {
    // Act / Assert
    expect(openKitchen(EmployeeRole.Waiter)).toBe('/orders');
  });

  it.each(PROTECTED_PATHS.map((entry) => [entry.path, entry.roles] as const))(
    'should let only the roles of the path %s open it',
    (path, roles) => {
      // Act
      const answers = ALL_ROLES.map((role) => openPath(path, role));

      // Assert: the roles of the path go in, and the others are sent to their own panel.
      for (const [index, role] of ALL_ROLES.entries()) {
        expect(answers[index]).toBe(roles.includes(role) ? true : ROLE_HOME[role]);
      }
    },
  );

  it('should load the feature of every path of the table', async () => {
    for (const route of routes) {
      // Act
      const children = await route.loadChildren?.();
      const component = await route.loadComponent?.();

      // Assert
      expect(children ?? component).toBeDefined();
    }
  });

  it('should send an employee without a session to the login page', () => {
    // Arrange
    const guard = routes.find((route) => route.path === 'orders')
      ?.canActivate?.[0] as CanActivateFn;

    // Act
    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, { url: '/orders' } as RouterStateSnapshot),
    );

    // Assert
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(
      '/login?returnUrl=%2Forders',
    );
  });
});
