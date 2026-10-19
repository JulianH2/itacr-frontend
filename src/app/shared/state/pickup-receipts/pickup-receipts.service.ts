import { Injectable, InjectionToken, inject, signal } from '@angular/core';

/** Where the receipts live. The browser keeps them across visits; tests replace it with a memory storage. */
export const PICKUP_RECEIPTS_STORAGE = new InjectionToken<Storage>('PICKUP_RECEIPTS_STORAGE', {
  providedIn: 'root',
  factory: () => localStorage,
});

const STORAGE_KEY = 'itacr.pickup-receipts';

/** The id of an order is a GUID made by the browser; anything else in the storage was not written by this app. */
const GUID_FORMAT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The backend lets a phone have 2 active orders, so a customer never needs more than 2 receipts. */
export const MAX_RECEIPTS = 2;

/** What the phone keeps of an order to follow it later. Never the name or the phone of the customer. */
export interface PickupReceipt {
  readonly clientOrderId: string;
  readonly orderNumber: number;
}

/**
 * The active pickup orders of this device, at most 2. An order is added when the server saves it and dropped when it
 * is delivered (or the server no longer knows it). It lives in `shared/` because the pickup screens and the home page
 * both read it.
 */
@Injectable({ providedIn: 'root' })
export class PickupReceiptsService {
  private readonly storage = inject(PICKUP_RECEIPTS_STORAGE);
  private readonly receiptsState = signal<readonly PickupReceipt[]>(this.read());

  readonly receipts = this.receiptsState.asReadonly();

  /** Adds a receipt, or replaces the one with the same id. With more than 2, the oldest is dropped. */
  add(receipt: PickupReceipt): void {
    const others = this.receiptsState().filter(
      (existing) => existing.clientOrderId !== receipt.clientOrderId,
    );
    this.save([...others, receipt].slice(-MAX_RECEIPTS));
  }

  remove(clientOrderId: string): void {
    this.save(this.receiptsState().filter((receipt) => receipt.clientOrderId !== clientOrderId));
  }

  private save(receipts: readonly PickupReceipt[]): void {
    this.receiptsState.set(receipts);
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(receipts));
    } catch {
      // Without storage the receipts only last until the tab closes; the order itself is already saved.
    }
  }

  private read(): readonly PickupReceipt[] {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      const parsed: unknown = raw === null ? [] : JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(isReceipt).slice(-MAX_RECEIPTS) : [];
    } catch {
      return [];
    }
  }
}

function isReceipt(value: unknown): value is PickupReceipt {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  const id = candidate['clientOrderId'];
  return (
    typeof id === 'string' && GUID_FORMAT.test(id) && typeof candidate['orderNumber'] === 'number'
  );
}
