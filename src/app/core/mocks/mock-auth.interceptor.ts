import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
  HttpStatusCode,
} from '@angular/common/http';
import { mergeMap, Observable, throwError, timer, map } from 'rxjs';

import { AUTH_API_URL } from '@core/auth/auth-api.service';
import { AUTH_PROBLEM_TYPES } from '@core/auth/auth-messages';
import {
  EmployeeOption,
  EmployeeRole,
  LoginResponse,
  PasswordLoginRequest,
  PinLoginRequest,
  PinResetRequest,
} from '@core/auth/auth.models';

const MOCK_PASSWORD = 'Itacr2026!';
const MOCK_LATENCY_MS = 400;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const SHIFT_MS = 12 * 60 * 60 * 1000;

type MockStatus = 'Active' | 'PendingApproval';

interface MockEmployee extends EmployeeOption {
  readonly role: EmployeeRole;
  readonly email: string;
  readonly pin: string;
  readonly status: MockStatus;
}

const MOCK_EMPLOYEES: readonly MockEmployee[] = [
  {
    id: 'a1f0c6d2-0000-4000-8000-000000000001',
    displayName: 'Mesero P.',
    role: EmployeeRole.Waiter,
    email: 'mesero@itacr.test',
    pin: '1111',
    status: 'Active',
  },
  {
    id: 'a1f0c6d2-0000-4000-8000-000000000002',
    displayName: 'Cocina P.',
    role: EmployeeRole.Kitchen,
    email: 'cocina@itacr.test',
    pin: '2222',
    status: 'Active',
  },
  {
    id: 'a1f0c6d2-0000-4000-8000-000000000003',
    displayName: 'Gerente P.',
    role: EmployeeRole.Manager,
    email: 'gerente@itacr.test',
    pin: '3333',
    status: 'Active',
  },
  {
    id: 'a1f0c6d2-0000-4000-8000-000000000004',
    displayName: 'Mesero P.',
    role: EmployeeRole.Waiter,
    email: 'pendiente@itacr.test',
    pin: '4444',
    status: 'PendingApproval',
  },
];

const failedAttempts = new Map<string, number>();
const lockedUntil = new Map<string, number>();

function respond<T>(
  body: T,
  status: HttpStatusCode = HttpStatusCode.Ok,
): Observable<HttpResponse<T>> {
  return timer(MOCK_LATENCY_MS).pipe(map(() => new HttpResponse({ status, body })));
}

function fail(
  request: HttpRequest<unknown>,
  status: HttpStatusCode,
  type: string,
  title: string,
): Observable<never> {
  const error = new HttpErrorResponse({
    status,
    url: request.url,
    error: { type, title, status, instance: request.url },
  });
  return timer(MOCK_LATENCY_MS).pipe(mergeMap(() => throwError(() => error)));
}

function loginResponse(employee: MockEmployee): LoginResponse {
  return {
    accessToken: `mock-token-${employee.id}`,
    expiresAt: new Date(Date.now() + SHIFT_MS).toISOString(),
    employee: { id: employee.id, displayName: employee.displayName, role: employee.role },
  };
}

function notActive(request: HttpRequest<unknown>): Observable<never> {
  return fail(
    request,
    HttpStatusCode.Forbidden,
    AUTH_PROBLEM_TYPES.accountPendingApproval,
    'Account pending approval',
  );
}

function invalidCredentials(request: HttpRequest<unknown>): Observable<never> {
  return fail(
    request,
    HttpStatusCode.Unauthorized,
    AUTH_PROBLEM_TYPES.invalidCredentials,
    'Invalid credentials',
  );
}

function loginWithPin(request: HttpRequest<unknown>): Observable<HttpResponse<LoginResponse>> {
  const body = request.body as PinLoginRequest;
  const employee = MOCK_EMPLOYEES.find((candidate) => candidate.id === body.employeeId);
  if (employee === undefined) {
    return invalidCredentials(request);
  }
  if (employee.status !== 'Active') {
    return notActive(request);
  }
  if ((lockedUntil.get(employee.id) ?? 0) > Date.now()) {
    return fail(request, HttpStatusCode.Locked, AUTH_PROBLEM_TYPES.accountLocked, 'Account locked');
  }
  if (body.pin !== employee.pin) {
    const attempts = (failedAttempts.get(employee.id) ?? 0) + 1;
    failedAttempts.set(employee.id, attempts);
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      failedAttempts.delete(employee.id);
      lockedUntil.set(employee.id, Date.now() + LOCKOUT_MS);
    }
    return invalidCredentials(request);
  }
  failedAttempts.delete(employee.id);
  return respond(loginResponse(employee));
}

function loginWithPassword(request: HttpRequest<unknown>): Observable<HttpResponse<LoginResponse>> {
  const body = request.body as PasswordLoginRequest;
  const employee = MOCK_EMPLOYEES.find(
    (candidate) => candidate.email === body.email.trim().toLowerCase(),
  );
  if (employee === undefined || body.password !== MOCK_PASSWORD) {
    return invalidCredentials(request);
  }
  return employee.status === 'Active' ? respond(loginResponse(employee)) : notActive(request);
}

export const mockAuthInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(AUTH_API_URL)) {
    return next(request);
  }

  const path = request.url.slice(AUTH_API_URL.length);
  if (request.method === 'GET' && path === '/employees') {
    const role = request.params.get('role');
    const employees: EmployeeOption[] = MOCK_EMPLOYEES.filter(
      (employee) => employee.role === role && employee.status === 'Active',
    ).map(({ id, displayName }) => ({ id, displayName }));
    return respond(employees);
  }
  if (request.method === 'POST' && path === '/login/pin') {
    return loginWithPin(request);
  }
  if (request.method === 'POST' && path === '/login/password') {
    return loginWithPassword(request);
  }
  if (request.method === 'POST' && path === '/pin-reset-requests') {
    const body = request.body as PinResetRequest;
    return MOCK_EMPLOYEES.some((employee) => employee.id === body.employeeId)
      ? respond(null, HttpStatusCode.Accepted)
      : fail(request, HttpStatusCode.NotFound, 'about:blank', 'Not Found');
  }
  return next(request);
};
