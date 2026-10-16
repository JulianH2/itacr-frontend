import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { OrderDraftService } from '@shared/state/order-draft/order-draft.service';
import { PickupReceiptsService } from '@shared/state/pickup-receipts/pickup-receipts.service';

import { toPhoneDigits, validateName, validatePhone } from '../models/pickup-customer';
import type { CreatePickupOrderRequest, PickupOrder } from '../models/pickup-order.models';
import { PICKUP_MESSAGES } from '../pickup-order.messages';
import { PICKUP_API } from './pickup-api';

interface PendingOrder {
  /** The request without its id, to know whether a retry sends the same order. */
  readonly content: string;
  readonly clientOrderId: string;
}

interface FieldErrors {
  readonly name?: string;
  readonly phone?: string;
}

/**
 * The order the customer is about to send: the name and phone, the send itself and its confirmation. The products
 * are in the shared {@link OrderDraftService}, which the catalog fills. The name and the phone live in memory only
 * until the order is sent; they are never stored on the device.
 *
 * Provided by the pickup route, so it is not shared with the waiter flow.
 */
@Injectable()
export class PickupOrderStore {
  private readonly api = inject(PICKUP_API);
  private readonly draft = inject(OrderDraftService);
  private readonly receipts = inject(PickupReceiptsService);

  private readonly nameState = signal('');
  private readonly phoneState = signal('');
  private readonly submittedState = signal(false);
  private readonly serverFieldErrors = signal<FieldErrors>({});
  private readonly sendingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly sentOrderState = signal<PickupOrder | null>(null);
  private pending: PendingOrder | null = null;

  readonly items = this.draft.items;
  readonly itemCount = this.draft.itemCount;
  readonly total = this.draft.total;

  readonly name = this.nameState.asReadonly();
  readonly phone = this.phoneState.asReadonly();
  readonly isSending = this.sendingState.asReadonly();
  /** A message that is not about one field (no connection, too many requests, a rule of the server). */
  readonly error = this.errorState.asReadonly();
  /** The order the server saved last; the confirmation highlights it. */
  readonly sentOrder = this.sentOrderState.asReadonly();

  /** Field messages show after the first attempt to send, so the form does not shout while it is being filled. */
  readonly nameError = computed(() =>
    this.submittedState()
      ? (this.serverFieldErrors().name ?? validateName(this.nameState()))
      : null,
  );
  readonly phoneError = computed(() =>
    this.submittedState()
      ? (this.serverFieldErrors().phone ?? validatePhone(this.phoneState()))
      : null,
  );

  /** An order without products cannot be sent. */
  readonly canSend = computed(() => this.draft.itemCount() > 0 && !this.sendingState());

  setName(value: string): void {
    this.nameState.set(value);
    this.serverFieldErrors.update(({ phone }) => ({ phone }));
    this.errorState.set(null);
  }

  setPhone(value: string): void {
    this.phoneState.set(toPhoneDigits(value));
    this.serverFieldErrors.update(({ name }) => ({ name }));
    this.errorState.set(null);
  }

  /**
   * Sends the order. Returns true when the API saved it (or already had it); then the draft and the form are empty,
   * the receipt is kept on the device, and {@link sentOrder} holds the confirmation.
   */
  async send(): Promise<boolean> {
    if (!this.canSend()) {
      return false;
    }
    this.submittedState.set(true);
    this.serverFieldErrors.set({});
    if (validateName(this.nameState()) !== null || validatePhone(this.phoneState()) !== null) {
      return false;
    }

    const request = this.buildRequest();
    this.sendingState.set(true);
    this.errorState.set(null);
    try {
      const order = await firstValueFrom(this.api.createOrder(request));
      this.receipts.add({ clientOrderId: order.clientOrderId, orderNumber: order.orderNumber });
      this.sentOrderState.set(order);
      this.resetOrder();
      return true;
    } catch (error: unknown) {
      this.showError(error);
      return false;
    } finally {
      this.sendingState.set(false);
    }
  }

  private buildRequest(): CreatePickupOrderRequest {
    const content = {
      name: this.nameState().trim(),
      phone: this.phoneState(),
      items: this.draft
        .items()
        .map((item) => ({ productId: item.productId, quantity: item.quantity })),
    };
    const key = JSON.stringify(content);
    if (this.pending?.content !== key) {
      this.pending = { content: key, clientOrderId: crypto.randomUUID() };
    }
    return { clientOrderId: this.pending.clientOrderId, ...content };
  }

  private resetOrder(): void {
    this.draft.clear();
    this.nameState.set('');
    this.phoneState.set('');
    this.submittedState.set(false);
    this.serverFieldErrors.set({});
    this.pending = null;
  }

  private showError(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) {
      this.errorState.set(PICKUP_MESSAGES.unexpected);
      return;
    }
    if (error.status === 0) {
      this.errorState.set(PICKUP_MESSAGES.network);
      return;
    }
    if (error.status === 429) {
      this.errorState.set(PICKUP_MESSAGES.tooManyRequests);
      return;
    }

    const fields = fieldMessages(error.error);
    if (fields.name !== undefined || fields.phone !== undefined) {
      this.serverFieldErrors.set(fields);
      return;
    }
    this.errorState.set(problemMessage(error.error) ?? PICKUP_MESSAGES.unexpected);
  }
}

/** The first message the server gave for the name and for the phone (Problem Details `errors`, camelCase keys). */
function fieldMessages(body: unknown): FieldErrors {
  const errors = (body as { errors?: unknown } | null)?.errors;
  if (typeof errors !== 'object' || errors === null) {
    return {};
  }
  const first = (field: string): string | undefined => {
    const messages = (errors as Record<string, unknown>)[field];
    return Array.isArray(messages) && typeof messages[0] === 'string' ? messages[0] : undefined;
  };
  return { name: first('name'), phone: first('phone') };
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
