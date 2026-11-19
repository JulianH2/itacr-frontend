import { HttpParams, HttpRequest, type HttpEvent, type HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import { AUTH_API_URL } from '@shared/auth/auth-api.service';
import { AUTH_PROBLEM_TYPES } from '@shared/auth/auth-messages';
import { EmployeeRole } from '@shared/auth/auth.models';

import { mockAuthInterceptor } from './mock-auth.interceptor';

const WAITER_ID = 'a1f0c6d2-0000-4000-8000-000000000001';
const KITCHEN_ID = 'a1f0c6d2-0000-4000-8000-000000000002';
const MANAGER_ID = 'a1f0c6d2-0000-4000-8000-000000000003';
const PENDING_ID = 'a1f0c6d2-0000-4000-8000-000000000004';
const ACCESS_KEY = 'Itacr2026!';

interface Outcome {
  response?: HttpResponse<unknown>;
  error?: { status: number; error: { type: string } };
}

async function send(request: HttpRequest<unknown>): Promise<Outcome> {
  const passthrough = vi.fn(() => of({ passthrough: true } as unknown as HttpEvent<unknown>));
  const result = firstValueFrom(
    TestBed.runInInjectionContext(() => mockAuthInterceptor(request, passthrough)),
  ).then(
    (response) => ({ response: response as HttpResponse<unknown> }),
    (error: Outcome['error']) => ({ error }),
  );
  await vi.advanceTimersByTimeAsync(1000);
  return result;
}

const get = (path: string, role?: string): HttpRequest<unknown> =>
  new HttpRequest('GET', `${AUTH_API_URL}${path}`, {
    params: role === undefined ? new HttpParams() : new HttpParams().set('role', role),
  });
const post = (path: string, body: unknown): HttpRequest<unknown> =>
  new HttpRequest('POST', `${AUTH_API_URL}${path}`, body);

describe('mockAuthInterceptor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('lets the requests of other APIs and unknown auth paths through', async () => {
    const other = await send(new HttpRequest('GET', 'https://example.test/other'));
    const unknown = await send(get('/unknown'));

    expect(other.response).toEqual({ passthrough: true });
    expect(unknown.response).toEqual({ passthrough: true });
  });

  it('lists only the active employees of the requested role', async () => {
    const waiters = await send(get('/employees', 'Waiter'));
    const kitchen = await send(get('/employees', 'Kitchen'));

    expect(waiters.response?.body).toEqual([{ id: WAITER_ID, displayName: 'Mesero P.' }]);
    expect(kitchen.response?.body).toEqual([{ id: KITCHEN_ID, displayName: 'Cocina P.' }]);
  });

  it('signs in with the right pin and returns the role of the employee', async () => {
    const outcome = await send(post('/login/pin', { employeeId: WAITER_ID, pin: '1111' }));

    expect(outcome.response?.status).toBe(200);
    expect(outcome.response?.body).toMatchObject({
      accessToken: `mock-token-${WAITER_ID}`,
      employee: { id: WAITER_ID, role: EmployeeRole.Waiter },
    });
  });

  it('answers 401 for an unknown employee and for a wrong pin', async () => {
    const unknown = await send(post('/login/pin', { employeeId: 'nobody', pin: '1111' }));
    const wrong = await send(post('/login/pin', { employeeId: WAITER_ID, pin: '0000' }));

    expect(unknown.error?.status).toBe(401);
    expect(wrong.error?.error.type).toBe(AUTH_PROBLEM_TYPES.invalidCredentials);
  });

  it('answers 403 when the account is still pending approval', async () => {
    const outcome = await send(post('/login/pin', { employeeId: PENDING_ID, pin: '4444' }));

    expect(outcome.error?.status).toBe(403);
    expect(outcome.error?.error.type).toBe(AUTH_PROBLEM_TYPES.accountPendingApproval);
  });

  it('locks the account after five wrong pins, even for the right one', async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      await send(post('/login/pin', { employeeId: MANAGER_ID, pin: '0000' }));
    }

    const locked = await send(post('/login/pin', { employeeId: MANAGER_ID, pin: '3333' }));

    expect(locked.error?.status).toBe(423);
    expect(locked.error?.error.type).toBe(AUTH_PROBLEM_TYPES.accountLocked);
  });

  it('signs in with the email (any case, with spaces) and the access key', async () => {
    const outcome = await send(
      post('/login/password', { email: '  GERENTE@itacr.test ', password: ACCESS_KEY }),
    );

    expect(outcome.response?.body).toMatchObject({ employee: { role: EmployeeRole.Manager } });
  });

  it('rejects a wrong access key or an unknown email, and a pending account', async () => {
    const wrong = await send(
      post('/login/password', { email: 'mesero@itacr.test', password: 'wrong' }),
    );
    const unknown = await send(
      post('/login/password', { email: 'x@itacr.test', password: ACCESS_KEY }),
    );
    const pending = await send(
      post('/login/password', { email: 'pendiente@itacr.test', password: ACCESS_KEY }),
    );

    expect(wrong.error?.status).toBe(401);
    expect(unknown.error?.status).toBe(401);
    expect(pending.error?.error.type).toBe(AUTH_PROBLEM_TYPES.accountPendingApproval);
  });

  it('accepts a registration request once and answers 409 for the same email', async () => {
    const first = await send(post('/registration-requests', { email: 'Nuevo@itacr.test' }));
    const repeated = await send(post('/registration-requests', { email: ' nuevo@itacr.test ' }));
    const existing = await send(post('/registration-requests', { email: 'mesero@itacr.test' }));

    expect(first.response?.status).toBe(202);
    expect(repeated.error?.status).toBe(409);
    expect(existing.error?.error.type).toBe(AUTH_PROBLEM_TYPES.accountAlreadyExists);
  });

  it('accepts a pin reset for a known employee and answers 404 for an unknown one', async () => {
    const known = await send(post('/pin-reset-requests', { employeeId: KITCHEN_ID }));
    const unknown = await send(post('/pin-reset-requests', { employeeId: 'nobody' }));

    expect(known.response?.status).toBe(202);
    expect(unknown.error?.status).toBe(404);
  });
});
