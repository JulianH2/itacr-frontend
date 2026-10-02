import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '@core/auth/auth.service';
import { ROLE_HOME } from '@core/auth/auth-messages';
import { EmployeeRole } from '@core/auth/auth.models';
import { SessionService } from '@core/auth/session.service';

export function roleGuard(...allowedRoles: readonly EmployeeRole[]): CanActivateFn {
  return (_route, state) => {
    const session = inject(SessionService);
    const auth = inject(AuthService);
    const router = inject(Router);
    const employee = session.employee();

    if (employee === null) {
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }
    if (!session.isActive()) {
      return auth.loginUrlForExpiredSession(state.url);
    }
    return allowedRoles.includes(employee.role)
      ? true
      : router.createUrlTree([ROLE_HOME[employee.role]]);
  };
}
