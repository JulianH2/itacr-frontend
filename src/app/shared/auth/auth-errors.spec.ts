import { HttpErrorResponse } from '@angular/common/http';

import { toRegistrationFailure } from './auth-errors';
import { AUTH_PROBLEM_TYPES } from './auth-messages';

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
