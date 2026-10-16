import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { type Observable, of, throwError } from 'rxjs';

import { OrderDraftService } from '@shared/state/order-draft/order-draft.service';
import {
  PICKUP_RECEIPTS_STORAGE,
  PickupReceiptsService,
} from '@shared/state/pickup-receipts/pickup-receipts.service';
import { MemoryStorage } from '@shared/testing/memory-storage';

import type { CreatePickupOrderRequest, PickupOrder } from '../models/pickup-order.models';
import { PICKUP_MESSAGES } from '../pickup-order.messages';
import { PICKUP_API } from './pickup-api';
import { PickupOrderStore } from './pickup-order-store.service';

const BURGER = { productId: 'burger', name: 'Hamburguesa Clásica', unitPrice: 79 };
const SODA = { productId: 'soda', name: 'Refresco de Cola', unitPrice: 29 };

function savedOrder(request: CreatePickupOrderRequest, orderNumber = 201): PickupOrder {
  return {
    clientOrderId: request.clientOrderId,
    orderNumber,
    status: 'New',
    total: 108,
    createdAt: '2026-10-15T18:00:00Z',
    items: [],
  };
}

describe('PickupOrderStore', () => {
  let requests: CreatePickupOrderRequest[];
  let answer: (request: CreatePickupOrderRequest) => Observable<PickupOrder>;
  let store: PickupOrderStore;
  let draft: OrderDraftService;
  let receipts: PickupReceiptsService;
  let storage: MemoryStorage;

  function fillForm(name = 'Ana María', phone = '7711234567'): void {
    store.setName(name);
    store.setPhone(phone);
  }

  beforeEach(() => {
    requests = [];
    answer = (request) => of(savedOrder(request));
    storage = new MemoryStorage();
    TestBed.configureTestingModule({
      providers: [
        PickupOrderStore,
        { provide: PICKUP_RECEIPTS_STORAGE, useValue: storage },
        {
          provide: PICKUP_API,
          useValue: {
            createOrder: (request: CreatePickupOrderRequest) => {
              requests.push(request);
              return answer(request);
            },
            getOrder: () => throwError(() => new Error('not used')),
          },
        },
      ],
    });
    store = TestBed.inject(PickupOrderStore);
    draft = TestBed.inject(OrderDraftService);
    receipts = TestBed.inject(PickupReceiptsService);
    draft.add(BURGER, 2);
    draft.add(SODA);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('should not send the order and say the field is required when the phone is missing', async () => {
    // Arrange (CA2)
    store.setName('Ana María');

    // Act
    const sent = await store.send();

    // Assert
    expect(sent).toBe(false);
    expect(requests).toHaveLength(0);
    expect(store.phoneError()).toBe(PICKUP_MESSAGES.required);
    expect(store.nameError()).toBeNull();
  });

  it('should keep the field messages hidden until the first attempt to send', () => {
    // Act
    store.setPhone('77');

    // Assert
    expect(store.phoneError()).toBeNull();
  });

  it('should not send an order without products', async () => {
    // Arrange
    draft.clear();
    fillForm();

    // Act / Assert
    expect(store.canSend()).toBe(false);
    expect(await store.send()).toBe(false);
    expect(requests).toHaveLength(0);
  });

  it('should keep only the digits of the phone, up to 10', () => {
    // Act
    store.setPhone('(771) 123-45-67 99');

    // Assert
    expect(store.phone()).toBe('7711234567');
  });

  it('should send the trimmed name, the phone and the products, with no prices', async () => {
    // Arrange
    fillForm('  Ana María  ');

    // Act
    const sent = await store.send();

    // Assert
    expect(sent).toBe(true);
    const [request] = requests;
    expect(request.name).toBe('Ana María');
    expect(request.phone).toBe('7711234567');
    expect(request.items).toEqual([
      { productId: 'burger', quantity: 2 },
      { productId: 'soda', quantity: 1 },
    ]);
    expect(JSON.stringify(request)).not.toContain('Price');
  });

  // CA1
  it('should keep the receipt, clear the order and the form, and confirm it when the server saves it', async () => {
    // Arrange
    fillForm();

    // Act
    await store.send();

    // Assert
    expect(store.sentOrder()?.orderNumber).toBe(201);
    expect(receipts.receipts()).toEqual([
      { clientOrderId: requests[0].clientOrderId, orderNumber: 201 },
    ]);
    expect(draft.itemCount()).toBe(0);
    expect(store.name()).toBe('');
    expect(store.phone()).toBe('');
  });

  it('should never store the name or the phone on the device', async () => {
    // Arrange
    fillForm('Ana María', '7711234567');

    // Act
    await store.send();

    // Assert
    const stored = JSON.stringify(
      [...Array(storage.length).keys()].map((index) => storage.getItem(storage.key(index) ?? '')),
    );
    expect(stored).not.toContain('Ana');
    expect(stored).not.toContain('7711234567');
  });

  it('should reuse the same clientOrderId when the same order is sent again after a failure', async () => {
    // Arrange
    fillForm();
    answer = () => throwError(() => new HttpErrorResponse({ status: 0 }));
    await store.send();

    // Act
    answer = (request) => of(savedOrder(request));
    await store.send();

    // Assert
    expect(requests).toHaveLength(2);
    expect(requests[1].clientOrderId).toBe(requests[0].clientOrderId);
  });

  it('should use another clientOrderId when the order changed after a failure', async () => {
    // Arrange
    fillForm();
    answer = () => throwError(() => new HttpErrorResponse({ status: 0 }));
    await store.send();

    // Act
    draft.add(SODA);
    answer = (request) => of(savedOrder(request));
    await store.send();

    // Assert
    expect(requests[1].clientOrderId).not.toBe(requests[0].clientOrderId);
  });

  it.each([
    [0, PICKUP_MESSAGES.network],
    [429, PICKUP_MESSAGES.tooManyRequests],
    [500, PICKUP_MESSAGES.unexpected],
  ])('should explain a %i answer without losing the order', async (status, message) => {
    // Arrange
    fillForm();
    answer = () => throwError(() => new HttpErrorResponse({ status }));

    // Act
    const sent = await store.send();

    // Assert
    expect(sent).toBe(false);
    expect(store.error()).toBe(message);
    expect(draft.itemCount()).toBe(3);
    expect(receipts.receipts()).toHaveLength(0);
  });

  it('should show the message of the server when the phone already has two active orders', async () => {
    // Arrange
    fillForm();
    const detail = 'Ya tienes 2 pedidos en curso.';
    answer = () => throwError(() => new HttpErrorResponse({ status: 409, error: { detail } }));

    // Act
    await store.send();

    // Assert
    expect(store.error()).toBe(detail);
  });

  it('should show the field messages of the server under the right field', async () => {
    // Arrange
    fillForm();
    answer = () =>
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { errors: { phone: ['El teléfono no es válido.'] } },
          }),
      );

    // Act
    await store.send();

    // Assert
    expect(store.phoneError()).toBe('El teléfono no es válido.');
    expect(store.error()).toBeNull();

    store.setPhone('7711234568');
    expect(store.phoneError()).toBeNull();
  });

  describe('limits of the order', () => {
    it('should not send an order with more than 20 products and say why', async () => {
      // Arrange
      draft.clear();
      for (let index = 0; index < 21; index++) {
        draft.add({ productId: `p${index}`, name: `Producto ${index}`, unitPrice: 10 });
      }
      fillForm();

      // Act
      const sent = await store.send();

      // Assert
      expect(store.limitError()).toBe(PICKUP_MESSAGES.tooManyProducts);
      expect(store.canSend()).toBe(false);
      expect(sent).toBe(false);
      expect(requests).toHaveLength(0);
    });

    it('should not send an order with more than 10 units of a product and say why', async () => {
      // Arrange: the draft is shared with the waiter flow, which allows more.
      draft.clear();
      draft.add(BURGER, 15);
      fillForm();

      // Act
      const sent = await store.send();

      // Assert
      expect(store.limitError()).toBe(PICKUP_MESSAGES.quantityTooHigh);
      expect(sent).toBe(false);
      expect(requests).toHaveLength(0);
    });

    it('should send an order at the limits', async () => {
      // Arrange
      draft.clear();
      for (let index = 0; index < 20; index++) {
        draft.add({ productId: `p${index}`, name: `Producto ${index}`, unitPrice: 10 }, 10);
      }
      fillForm();

      // Act
      const sent = await store.send();

      // Assert
      expect(store.limitError()).toBeNull();
      expect(sent).toBe(true);
    });
  });
});
