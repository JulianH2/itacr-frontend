import { HttpErrorResponse } from '@angular/common/http';

import { toAuthErrorMessage, toRegistrationFailure } from './auth-errors';
import { AUTH_MESSAGES, AUTH_PROBLEM_TYPES } from './auth-messages';

describe('toRegistrationFailure', () => {
  it('should put the message of each field the API rejected next to that field', () => {
    // Arrange
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        errors: {
          pinConfirmation: ['Los PIN no coinciden.'],
          acceptedPrivacyNotice: ['Debes aceptar el aviso de privacidad para continuar.'],
          unknownField: ['not a field of the form'],
        },
      },
    });

    // Act
    const failure = toRegistrationFailure(error);

    // Assert
    expect(failure).toEqual({
      fields: {
        pinConfirmation: 'Los PIN no coinciden.',
        acceptedPrivacyNotice: 'Debes aceptar el aviso de privacidad para continuar.',
      },
      general: null,
    });
  });

  it('should blame the email or user, with the message of the API, when the account already exists', () => {
    // Arrange
    const error = new HttpErrorResponse({
      status: 409,
      error: { type: AUTH_PROBLEM_TYPES.accountAlreadyExists, detail: 'Ya existe una cuenta.' },
    });

    // Assert
    expect(toRegistrationFailure(error)).toEqual({
      fields: { email: 'Ya existe una cuenta.' },
      general: null,
    });
  });

  it('should use its own message for a conflict that carries none', () => {
    // Assert
    expect(toRegistrationFailure(new HttpErrorResponse({ status: 409 })).fields.email).toBe(
      'Ya existe una cuenta o una solicitud con ese correo o usuario.',
    );
  });

  it.each([
    [429, 'Demasiadas solicitudes desde esta conexión. Inténtalo de nuevo más tarde.'],
    [0, 'No hay conexión con el servidor. Inténtalo de nuevo.'],
    [500, 'Ocurrió un error inesperado. Inténtalo de nuevo.'],
    [400, 'Ocurrió un error inesperado. Inténtalo de nuevo.'],
  ])('should give one general message for the status %s', (status, message) => {
    // Assert
    expect(toRegistrationFailure(new HttpErrorResponse({ status }))).toEqual({
      fields: {},
      general: message,
    });
  });

  it('should give the general message when the error is not an HTTP error', () => {
    // Assert
    expect(toRegistrationFailure(new Error('boom')).general).toBe(
      'Ocurrió un error inesperado. Inténtalo de nuevo.',
    );
  });
});

describe('toAuthErrorMessage', () => {
  it('should give the unexpected message when the error is not an HTTP error', () => {
    // Act / Assert
    expect(toAuthErrorMessage(new Error('boom'), 'pin')).toBe(AUTH_MESSAGES.unexpected);
  });

  it('should give the network message when the server could not be reached', () => {
    // Act / Assert
    expect(toAuthErrorMessage(new HttpErrorResponse({ status: 0 }), 'pin')).toBe(
      AUTH_MESSAGES.network,
    );
  });

  it.each([
    [AUTH_PROBLEM_TYPES.invalidCredentials, 'pin', AUTH_MESSAGES.invalidPin],
    [AUTH_PROBLEM_TYPES.invalidCredentials, 'password', AUTH_MESSAGES.invalidPassword],
    [AUTH_PROBLEM_TYPES.accountPendingApproval, 'pin', AUTH_MESSAGES.pendingApproval],
    [AUTH_PROBLEM_TYPES.accountInactive, 'pin', AUTH_MESSAGES.inactive],
    [AUTH_PROBLEM_TYPES.accountLocked, 'password', AUTH_MESSAGES.locked],
  ] as const)('should map the problem type %s of a %s login', (type, method, message) => {
    // Arrange
    const error = new HttpErrorResponse({ status: 400, error: { type } });

    // Act / Assert
    expect(toAuthErrorMessage(error, method)).toBe(message);
  });

  it.each([
    [401, 'pin', AUTH_MESSAGES.invalidPin],
    [401, 'password', AUTH_MESSAGES.invalidPassword],
    [423, 'pin', AUTH_MESSAGES.locked],
    [429, 'pin', AUTH_MESSAGES.tooManyRequests],
    [500, 'pin', AUTH_MESSAGES.unexpected],
  ] as const)(
    'should map the status %s of a %s login without a known problem type',
    (status, method, message) => {
      // Arrange
      const error = new HttpErrorResponse({
        status,
        error: { status, type: 'https://example.com/other' },
      });

      // Act / Assert
      expect(toAuthErrorMessage(error, method)).toBe(message);
    },
  );

  it('should map by status when the body is not a problem', () => {
    // Arrange
    const error = new HttpErrorResponse({ status: 401, error: 'Unauthorized' });

    // Act / Assert
    expect(toAuthErrorMessage(error, 'pin')).toBe(AUTH_MESSAGES.invalidPin);
  });
});
