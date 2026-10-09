import { TestBed } from '@angular/core/testing';
import { type Observable, of, throwError } from 'rxjs';

import type { KitchenOrder, KitchenQueue } from '../models/kitchen.models';
import { KITCHEN_API } from './kitchen-api';
import { KitchenStore, POLL_INTERVAL_MS } from './kitchen-store.service';

const START = Date.parse('2026-10-09T18:00:00Z');

function order(
  id: string,
  status: KitchenOrder['status'],
  minutesAfterStart: number,
): KitchenOrder {
  return {
    id,
    orderNumber: Number(id.replace(/\D/g, '')),
    channel: 'DineIn',
    status,
    tableNumber: 1,
    createdAt: new Date(START + minutesAfterStart * 60_000).toISOString(),
    items: [],
  };
}

function queueOf(...orders: KitchenOrder[]): KitchenQueue {
  return { serverTime: new Date(START).toISOString(), orders };
}

describe('KitchenStore', () => {
  let answer: () => Observable<KitchenQueue>;
  let calls: number;

  function createStore(): KitchenStore {
    TestBed.configureTestingModule({
      providers: [
        KitchenStore,
        {
          provide: KITCHEN_API,
          useValue: {
            getQueue: () => {
              calls += 1;
              return answer();
            },
          },
        },
      ],
    });
    const store = TestBed.inject(KitchenStore);
    vi.advanceTimersByTime(0); // the first poll is scheduled with timer(0)
    return store;
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
    calls = 0;
    answer = () => of(queueOf());
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should load the queue at once and poll again every interval', () => {
    // Arrange
    const store = createStore();
    expect(calls).toBe(1);
    expect(store.isLoading()).toBe(false);

    // Act
    vi.advanceTimersByTime(POLL_INTERVAL_MS * 2);

    // Assert
    expect(calls).toBe(3);
  });

  it('should group the orders by status and sort each column by arrival', () => {
    // Arrange
    answer = () =>
      of(
        queueOf(
          order('3', 'New', 3),
          order('1', 'New', 1),
          order('2', 'InPreparation', 2),
          order('4', 'Ready', 0),
          order('5', 'New', 2),
        ),
      );

    // Act
    const store = createStore();

    // Assert
    expect(store.newOrders().map((item) => item.id)).toEqual(['1', '5', '3']);
    expect(store.inPreparationOrders().map((item) => item.id)).toEqual(['2']);
    expect(store.readyOrders().map((item) => item.id)).toEqual(['4']);
    expect(store.isEmpty()).toBe(false);
  });

  // CA4
  it('should report an empty board when there are no active orders', () => {
    // Act
    const store = createStore();

    // Assert
    expect(store.isEmpty()).toBe(true);
    expect(store.hasError()).toBe(false);
  });

  // CA1
  it('should raise an alert when a poll brings a new order, but not for the orders already there', () => {
    // Arrange
    answer = () => of(queueOf(order('1', 'New', 0)));
    const store = createStore();
    expect(store.newOrderAlerts()).toBe(0);

    // Act
    vi.advanceTimersByTime(POLL_INTERVAL_MS);
    const afterSamePoll = store.newOrderAlerts();
    answer = () => of(queueOf(order('1', 'New', 0), order('2', 'New', 1)));
    vi.advanceTimersByTime(POLL_INTERVAL_MS);

    // Assert
    expect(afterSamePoll).toBe(0);
    expect(store.newOrderAlerts()).toBe(1);
  });

  it('should not raise an alert when an order only changes column', () => {
    // Arrange
    answer = () => of(queueOf(order('1', 'New', 0)));
    const store = createStore();

    // Act
    answer = () => of(queueOf(order('1', 'InPreparation', 0)));
    vi.advanceTimersByTime(POLL_INTERVAL_MS);

    // Assert
    expect(store.newOrderAlerts()).toBe(0);
    expect(store.inPreparationOrders()).toHaveLength(1);
  });

  it('should show an error, and recover on reload, when the first answer fails', () => {
    // Arrange
    answer = () => throwError(() => new Error('offline'));
    const store = createStore();
    expect(store.hasError()).toBe(true);

    // Act
    answer = () => of(queueOf(order('1', 'New', 0)));
    store.reload();

    // Assert
    expect(store.hasError()).toBe(false);
    expect(store.newOrders()).toHaveLength(1);
  });

  it('should keep the last queue and flag it as outdated when a later poll fails', () => {
    // Arrange
    answer = () => of(queueOf(order('1', 'New', 0)));
    const store = createStore();

    // Act
    answer = () => throwError(() => new Error('offline'));
    vi.advanceTimersByTime(POLL_INTERVAL_MS);

    // Assert
    expect(store.isOutdated()).toBe(true);
    expect(store.hasError()).toBe(false);
    expect(store.newOrders()).toHaveLength(1);
  });

  it('should measure time with the server clock when the device clock is off', () => {
    // Arrange
    const serverAhead = 90_000;
    answer = () => of({ serverTime: new Date(START + serverAhead).toISOString(), orders: [] });

    // Act
    const store = createStore();

    // Assert
    expect(store.now()).toBe(START + serverAhead);
    vi.advanceTimersByTime(2000);
    expect(store.now()).toBe(START + serverAhead + 2000);
  });
});
