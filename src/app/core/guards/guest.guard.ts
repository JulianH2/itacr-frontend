import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { ROLE_HOME } from '@core/auth/auth-messages';
import { SessionService } from '@core/auth/session.service';

export const guestGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const employee = session.employee();

  return employee !== null && session.isActive()
    ? inject(Router).createUrlTree([ROLE_HOME[employee.role]])
    : true;
};
