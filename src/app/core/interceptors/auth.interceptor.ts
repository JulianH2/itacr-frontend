import { HttpErrorResponse, HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { environment } from '@env/environment';
import { AUTH_API_URL } from '@core/auth/auth-api.service';
import { AuthService } from '@core/auth/auth.service';
import { SessionService } from '@core/auth/session.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(environment.apiBaseUrl)) {
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
