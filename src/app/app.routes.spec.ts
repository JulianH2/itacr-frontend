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
import { SESSION_STORAGE, SessionService } from '@shared/auth/session.service';
import { loginResponse } from '@shared/testing/auth-fixtures';
import { MemoryStorage } from '@shared/testing/memory-storage';

import { routes } from './app.routes';

describe('routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: SESSION_STORAGE, useValue: new MemoryStorage() }],
    });
  });

  function openKitchen(role: EmployeeRole): unknown {
    TestBed.inject(SessionService).start(loginResponse(role));
    const guard = routes.find((route) => route.path === 'kitchen')
      ?.canActivate?.[0] as CanActivateFn;
    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, { url: '/kitchen' } as RouterStateSnapshot),
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
});
