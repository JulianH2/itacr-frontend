import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ConnectionStatusService } from '@shared/services/connection-status.service';
import {
  type ChosenOption,
  type ComboCustomization,
  type OrderDraftItem,
  lineIdOf,
  toRequestItem,
} from '@shared/state/order-draft/order-draft.model';
import { OrderDraftService } from '@shared/state/order-draft/order-draft.service';

import type { OrderDetail, OrderDetailItem } from '../models/take-order.models';
import { TAKE_ORDER_MESSAGES } from '../take-order.messages';
import { updateErrorMessage } from './order-error-message';
import { ORDERS_API } from './orders-api';
import { TakeOrderStore } from './take-order-store.service';

/** Why the edit screen shows a message instead of the form. */
export type EditLoadProblem = 'not-found' | 'unavailable' | 'failed';

/** Longest note the API accepts. */
export const NOTE_MAX_LENGTH = 500;

/** `saved` is the order as it is now; `reload` means the order changed meanwhile and must be read again; null, nothing was saved. */
export type SaveResult = { readonly saved: OrderDetail } | { readonly reload: true } | null;

const NO_EXTRA_PRICE = 0;

/**
 * The changes a waiter makes to an order that is New or InPreparation (HU_13). The lines are the shared {@link OrderDraftService}
 * (the catalog adds products to it), the table and the note live here, and nothing reaches the API until {@link save}: cancelling
 * only throws these changes away, so the order keeps its original data (CA3).
 *
 * Provided by the orders route, like {@link TakeOrderStore}, whose tables it reuses.
 */
@Injectable()
export class OrderEditStore {
  private readonly api = inject(ORDERS_API);
  private readonly draft = inject(OrderDraftService);
  private readonly connection = inject(ConnectionStatusService);
  private readonly takeOrder = inject(TakeOrderStore);

  private readonly orderState = signal<OrderDetail | null>(null);
  private readonly pickedTableId = signal<string | undefined>(undefined);
  private readonly noteState = signal('');
  private readonly loadingState = signal(false);
  private readonly problemState = signal<EditLoadProblem | null>(null);
  private readonly savingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  /** The order as it is saved now, the one the draft started from. */
  readonly order = this.orderState.asReadonly();
  readonly note = this.noteState.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly problem = this.problemState.asReadonly();
  readonly isSaving = this.savingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  readonly items = this.draft.items;
  readonly itemCount = this.draft.itemCount;
  readonly total = this.draft.total;
  readonly tables = this.takeOrder.tables;
  readonly isLoadingTables = this.takeOrder.isLoadingTables;
  readonly hasTablesError = this.takeOrder.hasTablesError;

  /** Only a dine-in order has a table to change; a take-away order keeps none. */
  readonly hasTable = computed(() => this.orderState()?.channel === 'DineIn');

  /** The table picked by the waiter, or the one the order already has until they pick another. */
  readonly tableId = computed(() => {
    const picked = this.pickedTableId();
    if (picked !== undefined) {
      return picked;
    }
    const number = this.orderState()?.tableNumber ?? null;
    return this.tables().find((table) => table.number === number)?.id ?? null;
  });

  /** Why saving is not possible right now, shown to the waiter; null when it is. */
  readonly blocker = computed<string | null>(() => {
    if (!this.connection.online()) {
      return TAKE_ORDER_MESSAGES.editOffline;
    }
    if (this.draft.itemCount() === 0) {
      return TAKE_ORDER_MESSAGES.editEmpty;
    }
    if (this.hasTable() && this.tableId() === null) {
      return TAKE_ORDER_MESSAGES.editTableRequired;
    }
    return null;
  });
  /** What the waiter reads above "Guardar": the failure of the last save, or else what blocks saving. */
  readonly notice = computed(() => this.errorState() ?? this.blocker());
  readonly canSave = computed(
    () => this.orderState() !== null && this.blocker() === null && !this.savingState(),
  );

  /**
   * Reads the order and puts its lines in the draft. Coming back from the catalog with the same order, the changes made so far
   * stay as they are.
   */
  async open(orderId: string): Promise<void> {
    if (this.orderState()?.id === orderId && this.draft.editingOrderId() === orderId) {
      return;
    }
    this.discard();
    this.errorState.set(null);
    this.loadingState.set(true);
    try {
      const order = await firstValueFrom(this.api.getOrder(orderId));
      if (
        order.channel === 'MobileApp' ||
        (order.status !== 'New' && order.status !== 'InPreparation')
      ) {
        this.problemState.set('unavailable');
        return;
      }
      const items = order.items.map(toDraftItem);
      if (!items.every((item) => item !== null)) {
        this.problemState.set('failed');
        return;
      }
      this.orderState.set(order);
      this.draft.beginEdit(order.id, items);
    } catch (error: unknown) {
      this.problemState.set(
        error instanceof HttpErrorResponse && error.status === 404 ? 'not-found' : 'failed',
      );
    } finally {
      this.loadingState.set(false);
    }
  }

  selectTable(tableId: string): void {
    this.pickedTableId.set(tableId);
    this.errorState.set(null);
  }

  setNote(note: string): void {
    this.noteState.set(note.slice(0, NOTE_MAX_LENGTH));
  }

  reloadTables(): void {
    this.takeOrder.reloadTables();
  }

  /**
   * Sends the changes. On success the draft goes back to what it was and the order is answered. When the order changed meanwhile
   * (409) or the API no longer finds it (404) the changes are dropped and `reload` tells the screen to read the order again;
   * any other failure keeps the changes so the waiter can try again. Editing needs a connection: nothing is queued.
   */
  async save(): Promise<SaveResult> {
    const order = this.orderState();
    if (order === null || this.savingState()) {
      return null;
    }
    const blocker = this.blocker();
    if (blocker !== null) {
      this.errorState.set(blocker);
      return null;
    }

    this.savingState.set(true);
    this.errorState.set(null);
    try {
      const note = this.noteState().trim();
      const saved = await firstValueFrom(
        this.api.updateOrder(order.id, {
          tableId: this.hasTable() ? this.tableId() : null,
          items: this.draft.items().map(toRequestItem),
          ...(note === '' ? {} : { note }),
        }),
      );
      this.discard();
      return { saved };
    } catch (error: unknown) {
      this.errorState.set(updateErrorMessage(error));
      if (error instanceof HttpErrorResponse && (error.status === 409 || error.status === 404)) {
        this.discard();
        return { reload: true };
      }
      return null;
    } finally {
      this.savingState.set(false);
    }
  }

  /** Throws the changes away: the order keeps the data it had (CA3). */
  cancel(): void {
    this.discard();
  }

  private discard(): void {
    this.draft.endEdit();
    this.orderState.set(null);
    this.pickedTableId.set(undefined);
    this.noteState.set('');
    this.problemState.set(null);
  }
}

/** A line of the order as a draft line, or null when it cannot be edited because the API did not say what it is made of. */
function toDraftItem(item: OrderDetailItem): OrderDraftItem | null {
  if (item.productId === undefined) {
    return null;
  }
  const customization = toCustomization(item);
  if (customization === undefined) {
    return null;
  }
  return {
    lineId: lineIdOf(item.productId, customization),
    productId: item.productId,
    name: item.name,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    customization,
  };
}

/** The options of a combo line, null for a product with none, or undefined when one of them is no longer on the menu. */
function toCustomization(item: OrderDetailItem): ComboCustomization | null | undefined {
  if (!item.sizeId && !item.drinkId) {
    return null;
  }
  const extras = pair(item.extras, item.extraIds);
  const exclusions = pair(item.exclusions, item.exclusionIds);
  if (!item.sizeId || !item.drinkId || !item.size || !item.drink || !extras || !exclusions) {
    return undefined;
  }
  return {
    size: { id: item.sizeId, name: item.size },
    drink: { id: item.drinkId, name: item.drink },
    // The price of an extra only matters when the combo is built; the unit price of the line is already known.
    extras: extras.map((extra) => ({ ...extra, price: NO_EXTRA_PRICE })),
    exclusions,
  };
}

function pair(
  names: readonly string[] | undefined,
  ids: readonly (string | null)[] | undefined,
): ChosenOption[] | null {
  const chosenNames = names ?? [];
  const chosenIds = ids ?? [];
  if (chosenNames.length !== chosenIds.length) {
    return null;
  }
  const options: ChosenOption[] = [];
  for (const [index, name] of chosenNames.entries()) {
    const id = chosenIds[index];
    if (!id) {
      return null;
    }
    options.push({ id, name });
  }
  return options;
}
