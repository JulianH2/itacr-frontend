import { HttpErrorResponse, HttpEventType, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { defer, finalize, retry, tap, throwError, timer } from 'rxjs';

import { environment } from '@env/environment';
import { ConnectionStatusService } from '@shared/services/connection-status.service';
import { ServerWakeService } from '@shared/services/server-wake.service';

/** Waits before each new try: about a minute in total, which is what the App Service plus the database need to start. */
export const WAKE_RETRY_DELAYS_MS: readonly number[] = [2000, 4000, 8000, 15_000, 15_000, 15_000];

const BAD_GATEWAY = 502;
const SERVICE_UNAVAILABLE = 503;
const GATEWAY_TIMEOUT = 504;

/** Status 0 is what the browser reports when the platform answers while starting: that answer has no CORS headers. */
function looksAsleep(error: unknown, online: boolean): boolean {
  if (!(error instanceof HttpErrorResponse)) {
    return false;
  }
  if (error.status === 0) {
    return online;
  }
  return [BAD_GATEWAY, SERVICE_UNAVAILABLE, GATEWAY_TIMEOUT].includes(error.status);
}

export const serverWakeInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(environment.apiBaseUrl)) {
    return next(request);
  }

  const wake = inject(ServerWakeService);
  const connection = inject(ConnectionStatusService);
  // Only reads are tried again: an order or a status change must not be sent twice by a retry the user cannot see.
  const retries = request.method === 'GET' ? WAKE_RETRY_DELAYS_MS.length : 0;

  return defer(() => {
    const stopWatching = wake.watch();
    return next(request).pipe(
      tap({
        next: (event) => {
          if (event.type === HttpEventType.Response) {
            wake.awake();
          }
        },
        error: (error: unknown) => {
          if (!looksAsleep(error, connection.online())) {
            wake.awake();
          }
        },
      }),
      finalize(stopWatching),
    );
  }).pipe(
    retry({
      count: retries,
      delay: (error, attempt) => {
        if (!looksAsleep(error, connection.online())) {
          return throwError(() => error);
        }
        wake.retrying();
        return timer(WAKE_RETRY_DELAYS_MS[attempt - 1]);
      },
    }),
    tap({
      error: (error: unknown) => {
        if (looksAsleep(error, connection.online())) {
          wake.failed();
        }
      },
    }),
  );
};
