import { inject, Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { map, Observable, tap } from 'rxjs';

import { AuthApiService } from './auth-api.service';
import { ROLE_HOME } from './auth-messages';
import { LoginResponse, SessionEmployee } from './auth.models';
import { SessionService } from './session.service';

export const SESSION_EXPIRED_REASON = 'expired';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApiService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  loginWithPin(employeeId: string, pin: string): Observable<SessionEmployee> {
    return this.api.loginWithPin({ employeeId, pin }).pipe(this.startSession());
  }

  loginWithPassword(email: string, password: string): Observable<SessionEmployee> {
    return this.api.loginWithPassword({ email, password }).pipe(this.startSession());
  }

  logout(): void {
    this.session.clear();
    void this.router.navigateByUrl('/login');
  }

  loginUrlForExpiredSession(returnUrl: string): UrlTree {
    this.session.expire();
    return this.router.createUrlTree(['/login'], {
      queryParams: { reason: SESSION_EXPIRED_REASON, returnUrl },
    });
  }

  homeUrl(employee: SessionEmployee, returnUrl?: string | null): string {
    const isInternalPath =
      typeof returnUrl === 'string' && returnUrl.startsWith('/') && !returnUrl.startsWith('//');
    return isInternalPath && returnUrl !== '/' ? returnUrl : ROLE_HOME[employee.role];
  }

  private startSession(): (source: Observable<LoginResponse>) => Observable<SessionEmployee> {
    return (source) =>
      source.pipe(
        tap((response) => this.session.start(response)),
        map((response) => response.employee),
      );
  }
}
