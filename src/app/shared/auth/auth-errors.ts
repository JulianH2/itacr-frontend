import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';

import { AUTH_MESSAGES, AUTH_PROBLEM_TYPES, REGISTRATION_MESSAGES } from './auth-messages';

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

/** The fields of the form to ask for an account, with the names the API uses. */
export type RegistrationField =
  'fullName' | 'email' | 'phone' | 'role' | 'pin' | 'pinConfirmation' | 'acceptedPrivacyNotice';

const REGISTRATION_FIELDS: readonly RegistrationField[] = [
  'fullName',
  'email',
  'phone',
  'role',
  'pin',
  'pinConfirmation',
  'acceptedPrivacyNotice',
];

/** What went wrong when asking for an account: a message for each field the API rejected, or one for the whole form. */
export interface RegistrationFailure {
  readonly fields: Partial<Record<RegistrationField, string>>;
  readonly general: string | null;
}

export function toRegistrationFailure(error: unknown): RegistrationFailure {
  if (!(error instanceof HttpErrorResponse)) {
    return { fields: {}, general: AUTH_MESSAGES.unexpected };
  }
  if (error.status === 0) {
    return { fields: {}, general: AUTH_MESSAGES.network };
  }
  if (error.status === HttpStatusCode.TooManyRequests) {
    return { fields: {}, general: REGISTRATION_MESSAGES.tooManyRequests };
  }
  const problem = isProblemDetails(error.error) ? error.error : undefined;
  if (
    error.status === HttpStatusCode.Conflict ||
    problem?.type === AUTH_PROBLEM_TYPES.accountAlreadyExists
  ) {
    return {
      fields: { email: problem?.detail ?? REGISTRATION_MESSAGES.accountExists },
      general: null,
    };
  }
  if (error.status === HttpStatusCode.BadRequest) {
    const rejected = (error.error as { errors?: Record<string, readonly string[]> } | null)?.errors;
    const fields: Partial<Record<RegistrationField, string>> = {};
    for (const field of REGISTRATION_FIELDS) {
      const message = rejected?.[field]?.[0];
      if (message !== undefined) {
        fields[field] = message;
      }
    }
    return Object.keys(fields).length > 0
      ? { fields, general: null }
      : { fields: {}, general: AUTH_MESSAGES.unexpected };
  }
  return { fields: {}, general: AUTH_MESSAGES.unexpected };
}
