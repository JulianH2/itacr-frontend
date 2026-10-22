import { HttpErrorResponse, HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { environment } from '@env/environment';
import { AUTH_API_URL } from '@shared/auth/auth-api.service';
import { AuthService } from '@shared/auth/auth.service';
import { SessionService } from '@shared/auth/session.service';

/** Endpoints for customers without an account. They never carry the JWT of an employee who is signed in on the same phone. */
const PUBLIC_API_URL = `${environment.apiBaseUrl}/public/`;

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(environment.apiBaseUrl) || request.url.startsWith(PUBLIC_API_URL)) {
    return next(request);
  }

  const session = inject(SessionService);
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = session.accessToken();
  const authorizedRequest =
    token === null ? request : request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      const isExpiredToken =
        error instanceof HttpErrorResponse &&
        error.status === HttpStatusCode.Unauthorized &&
        token !== null &&
        !request.url.startsWith(AUTH_API_URL);
      if (isExpiredToken) {
        void router.navigateByUrl(auth.loginUrlForExpiredSession(router.url));
      }
      return throwError(() => error);
    }),
  );
};
