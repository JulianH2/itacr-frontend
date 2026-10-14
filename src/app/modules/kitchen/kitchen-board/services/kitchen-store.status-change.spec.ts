import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { type Observable, Subject, of, throwError } from 'rxjs';

import type {
  KitchenOrder,
  KitchenQueue,
  KitchenStatusChange,
  KitchenStep,
} from '../models/kitchen.models';
import { KITCHEN_API, type KitchenApi } from './kitchen-api';
import {
  KITCHEN_ACTION_MESSAGES,
  KitchenStore,
  POLL_INTERVAL_MS,
  UNDO_VISIBLE_MS,
} from './kitchen-store.service';

const START = Date.parse('2026-10-14T18:00:00Z');

function order(id: string, status: KitchenOrder['status']): KitchenOrder {
  return {
    id,
    orderNumber: Number(id.replace(/\D/g, '')),
    channel: 'DineIn',
    status,
    tableNumber: 1,
    createdAt: new Date(START).toISOString(),
    items: [],
  };
}

function answer(id: string, status: KitchenOrder['status']): Observable<KitchenStatusChange> {
  return of({ id, status, lastStatusChangeAt: new Date().toISOString() });
}

describe('KitchenStore status changes (HU_05)', () => {
  let queue: KitchenOrder[];
  let api: {
    changeStatus: ReturnType<typeof vi.fn<KitchenApi['changeStatus']>>;
    undoStatusChange: ReturnType<typeof vi.fn<KitchenApi['undoStatusChange']>>;
  };

  function createStore(): KitchenStore {
    TestBed.configureTestingModule({
      providers: [
        KitchenStore,
        {
          provide: KITCHEN_API,
          useValue: {
            getQueue: (): Observable<KitchenQueue> =>
              of({ serverTime: new Date(START).toISOString(), orders: queue }),
            changeStatus: api.changeStatus,
            undoStatusChange: api.undoStatusChange,
          },
        },
      ],
    });
    const store = TestBed.inject(KitchenStore);
    vi.advanceTimersByTime(0);
    return store;
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
    queue = [order('1', 'New'), order('2', 'InPreparation')];
    api = {
      changeStatus: vi.fn((id: string, status: KitchenStep) => answer(id, status)),
      undoStatusChange: vi.fn((id: string) => answer(id, 'New')),
    };
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // CA1
  it('should move a new order to En preparación and save it when its card is tapped', () => {
    // Arrange
    const store = createStore();

    // Act
    store.advance(store.newOrders()[0]);

    // Assert
    expect(api.changeStatus).toHaveBeenCalledWith('1', 'InPreparation');
    expect(store.newOrders()).toEqual([]);
    expect(store.inPreparationOrders().map((item) => item.id)).toEqual(['1', '2']);
  });

  // CA2
  it('should move an order in preparation to Listos when its card is tapped', () => {
    // Arrange
    const store = createStore();

    // Act
    store.advance(store.inPreparationOrders()[0]);

    // Assert
    expect(api.changeStatus).toHaveBeenCalledWith('2', 'Ready');
    expect(store.readyOrders().map((item) => item.id)).toEqual(['2']);
  });

  it('should keep the new column while the server confirms it, even if a poll still has the old one', () => {
    // Arrange
    const pending = new Subject<KitchenStatusChange>();
    api.changeStatus.mockReturnValue(pending);
    const store = createStore();
    store.advance(store.newOrders()[0]);

    // Act
    vi.advanceTimersByTime(POLL_INTERVAL_MS);

    // Assert
    expect(store.inPreparationOrders().map((item) => item.id)).toContain('1');
    expect(store.busyIds().has('1')).toBe(true);
  });

  it('should ignore a second tap on the same card while the first one is being saved', () => {
    // Arrange
    api.changeStatus.mockReturnValue(new Subject<KitchenStatusChange>());
    const store = createStore();
    const tapped = store.newOrders()[0];
    store.advance(tapped);

    // Act
    store.advance(tapped);

    // Assert
    expect(api.changeStatus).toHaveBeenCalledTimes(1);
  });

  it('should put the card back and show the reason when the server rejects the change', () => {
    // Arrange
    api.changeStatus.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { detail: 'El pedido ya cambió de estado. Actualiza el tablero.' },
          }),
      ),
    );
    const store = createStore();

    // Act
    store.advance(store.newOrders()[0]);

    // Assert
    expect(store.newOrders().map((item) => item.id)).toEqual(['1']);
    expect(store.actionError()).toBe('El pedido ya cambió de estado. Actualiza el tablero.');
  });

  it('should show the connection message when the change cannot reach the server', () => {
    // Arrange
    api.changeStatus.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    const store = createStore();

    // Act
    store.advance(store.newOrders()[0]);

    // Assert
    expect(store.actionError()).toBe(KITCHEN_ACTION_MESSAGES.network);
  });

  // CA3
  it('should offer to undo a tap and take the order back when Deshacer is tapped in time', () => {
    // Arrange
    const store = createStore();
    store.advance(store.newOrders()[0]);
    expect(store.undoOffer()?.orderNumber).toBe(1);

    // Act
    store.undo();

    // Assert
    expect(api.undoStatusChange).toHaveBeenCalledWith('1');
    expect(store.newOrders().map((item) => item.id)).toEqual(['1']);
    expect(store.undoOffer()).toBeNull();
  });

  it('should stop offering to undo after a few seconds', () => {
    // Arrange
    const store = createStore();
    store.advance(store.newOrders()[0]);

    // Act
    vi.advanceTimersByTime(UNDO_VISIBLE_MS);

    // Assert
    expect(store.undoOffer()).toBeNull();
    store.undo();
    expect(api.undoStatusChange).not.toHaveBeenCalled();
  });

  it('should not move a ready order: the waiter delivers it', () => {
    // Arrange
    queue = [order('3', 'Ready')];
    const store = createStore();

    // Act
    store.advance(store.readyOrders()[0]);

    // Assert
    expect(api.changeStatus).not.toHaveBeenCalled();
  });
});
