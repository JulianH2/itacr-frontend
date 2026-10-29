import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';

import { TAKE_ORDER_MESSAGES } from '../take-order.messages';

/** The request never got an answer: no network, or a network that does not reach the API. */
export function isNetworkError(error: unknown): boolean {
  return (
    error instanceof TimeoutError || (error instanceof HttpErrorResponse && error.status === 0)
  );
}

/** The message the waiter sees when the API rejects an order. */
export function orderErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return TAKE_ORDER_MESSAGES.unexpected;
  }
  if (error.status === 0) {
    return TAKE_ORDER_MESSAGES.network;
  }
  return problemMessage(error.error) ?? TAKE_ORDER_MESSAGES.unexpected;
}

/** The first validation message of a Problem Details body, or its `detail`. */
function problemMessage(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) {
    return null;
  }
  const problem = body as Record<string, unknown>;
  const errors = problem['errors'];
  if (typeof errors === 'object' && errors !== null) {
    for (const messages of Object.values(errors as Record<string, unknown>)) {
      if (Array.isArray(messages) && typeof messages[0] === 'string') {
        return messages[0];
      }
    }
  }
  return typeof problem['detail'] === 'string' ? problem['detail'] : null;
}

/** The message the waiter sees when delivering an order fails: the API explains a conflict, the rest is a generic text. */
export function deliverErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return TAKE_ORDER_MESSAGES.deliverUnexpected;
  }
  if (error.status === 0) {
    return TAKE_ORDER_MESSAGES.deliverNetwork;
  }
  return problemMessage(error.error) ?? TAKE_ORDER_MESSAGES.deliverUnexpected;
}
