import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';

import { AUTH_MESSAGES, AUTH_PROBLEM_TYPES } from './auth-messages';

export type LoginMethod = 'pin' | 'password';

interface ProblemDetails {
  readonly type?: string;
  readonly status?: number;
  readonly detail?: string;
}

function isProblemDetails(value: unknown): value is ProblemDetails {
  return typeof value === 'object' && value !== null && ('type' in value || 'status' in value);
}

export function toAuthErrorMessage(error: unknown, method: LoginMethod): string {
  if (!(error instanceof HttpErrorResponse)) {
    return AUTH_MESSAGES.unexpected;
  }
  if (error.status === 0) {
    return AUTH_MESSAGES.network;
  }

  const invalidCredentialsMessage =
    method === 'pin' ? AUTH_MESSAGES.invalidPin : AUTH_MESSAGES.invalidPassword;
  const problemType = isProblemDetails(error.error) ? error.error.type : undefined;

  switch (problemType) {
    case AUTH_PROBLEM_TYPES.invalidCredentials:
      return invalidCredentialsMessage;
    case AUTH_PROBLEM_TYPES.accountPendingApproval:
      return AUTH_MESSAGES.pendingApproval;
    case AUTH_PROBLEM_TYPES.accountInactive:
      return AUTH_MESSAGES.inactive;
    case AUTH_PROBLEM_TYPES.accountLocked:
      return AUTH_MESSAGES.locked;
  }

  switch (error.status) {
    case HttpStatusCode.Unauthorized:
      return invalidCredentialsMessage;
    case HttpStatusCode.Locked:
      return AUTH_MESSAGES.locked;
    case HttpStatusCode.TooManyRequests:
      return AUTH_MESSAGES.tooManyRequests;
    default:
      return AUTH_MESSAGES.unexpected;
  }
}
