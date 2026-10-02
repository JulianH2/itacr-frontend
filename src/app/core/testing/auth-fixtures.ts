import { EmployeeOption, EmployeeRole, LoginResponse } from '@core/auth/auth.models';

export const FUTURE_EXPIRATION = '2999-01-01T00:00:00.000Z';
export const PAST_EXPIRATION = '2000-01-01T00:00:00.000Z';

export const WAITER: EmployeeOption = { id: 'waiter-1', displayName: 'Ana M.' };

export function loginResponse(
  role: EmployeeRole = EmployeeRole.Waiter,
  expiresAt: string = FUTURE_EXPIRATION,
): LoginResponse {
  return {
    accessToken: 'access-token',
    expiresAt,
    employee: { id: WAITER.id, displayName: WAITER.displayName, role },
  };
}
