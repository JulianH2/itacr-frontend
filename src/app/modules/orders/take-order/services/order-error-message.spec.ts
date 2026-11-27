import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';

import { TAKE_ORDER_MESSAGES } from '../take-order.messages';
import {
  deliverErrorMessage,
  isNetworkError,
  orderErrorMessage,
  updateErrorMessage,
} from './order-error-message';

describe('isNetworkError', () => {
  it.each([
    ['a timeout', new TimeoutError(), true],
    ['an answer with status 0', new HttpErrorResponse({ status: 0 }), true],
    ['an answer of the API', new HttpErrorResponse({ status: 500 }), false],
    ['an error of the app', new Error('boom'), false],
  ])('should tell whether %s is a network error', (_case, error, expected) => {
    // Act / Assert
    expect(isNetworkError(error)).toBe(expected);
  });
});

describe.each([
  [
    'orderErrorMessage',
    orderErrorMessage,
    TAKE_ORDER_MESSAGES.unexpected,
    TAKE_ORDER_MESSAGES.network,
  ],
  [
    'updateErrorMessage',
    updateErrorMessage,
    TAKE_ORDER_MESSAGES.editUnexpected,
    TAKE_ORDER_MESSAGES.editNetwork,
  ],
  [
    'deliverErrorMessage',
    deliverErrorMessage,
    TAKE_ORDER_MESSAGES.deliverUnexpected,
    TAKE_ORDER_MESSAGES.deliverNetwork,
  ],
] as const)('%s', (_name, message, unexpected, network) => {
  it('should give the generic text when the error is not an HTTP error', () => {
    // Act / Assert
    expect(message(new Error('boom'))).toBe(unexpected);
  });

  it('should give the network text when the API could not be reached', () => {
    // Act / Assert
    expect(message(new HttpErrorResponse({ status: 0 }))).toBe(network);
  });

  it('should give the first validation message of the API', () => {
    // Arrange
    const error = new HttpErrorResponse({
      status: 400,
      error: { errors: { notes: [42], items: ['La orden no tiene productos.'] }, detail: 'detail' },
    });

    // Act / Assert
    expect(message(error)).toBe('La orden no tiene productos.');
  });

  it('should give the detail of the problem when it has no usable validation message', () => {
    // Arrange
    const error = new HttpErrorResponse({
      status: 409,
      error: { errors: { items: 'not a list' }, detail: 'La orden ya fue entregada.' },
    });

    // Act / Assert
    expect(message(error)).toBe('La orden ya fue entregada.');
  });

  it('should give the generic text when the problem has no detail', () => {
    // Arrange
    const error = new HttpErrorResponse({ status: 409, error: { errors: null, detail: 7 } });

    // Act / Assert
    expect(message(error)).toBe(unexpected);
  });

  it('should give the generic text when the body is not a problem', () => {
    // Act / Assert
    expect(message(new HttpErrorResponse({ status: 500, error: 'Server Error' }))).toBe(unexpected);
    expect(message(new HttpErrorResponse({ status: 500, error: null }))).toBe(unexpected);
  });
});
