import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { OrderDraftService } from '@shared/state/order-draft/order-draft.service';
import {
  PICKUP_RECEIPTS_STORAGE,
  PickupReceiptsService,
} from '@shared/state/pickup-receipts/pickup-receipts.service';
import { MemoryStorage } from '@shared/testing/memory-storage';

import type { CreatePickupOrderRequest, PickupOrder } from '../../models/pickup-order.models';
import { PICKUP_MESSAGES } from '../../pickup-order.messages';
import { PICKUP_API, type PickupApi } from '../../services/pickup-api';
import { PickupOrderStore } from '../../services/pickup-order-store.service';
import { PickupSummaryPageComponent } from './pickup-summary-page.component';

const BURGER = { productId: 'burger', name: 'Hamburguesa Clásica', unitPrice: 79 };

function createApi(requests: CreatePickupOrderRequest[]): PickupApi {
  return {
    createOrder: (request) => {
      requests.push(request);
      const order: PickupOrder = {
        clientOrderId: request.clientOrderId,
        orderNumber: 201,
        status: 'New',
        total: 79,
        createdAt: '2026-10-15T18:00:00Z',
        items: [],
      };
      return of(order);
    },
    getOrder: () => of({} as PickupOrder),
  };
}

async function renderPage(
  requests: CreatePickupOrderRequest[],
): Promise<{ fixture: ComponentFixture<PickupSummaryPageComponent>; page: HTMLElement }> {
  await TestBed.configureTestingModule({
    imports: [PickupSummaryPageComponent],
    providers: [
      provideRouter([]),
      PickupOrderStore,
      { provide: PICKUP_API, useValue: createApi(requests) },
      { provide: PICKUP_RECEIPTS_STORAGE, useValue: new MemoryStorage() },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(PickupSummaryPageComponent);
  await fixture.whenStable();
  return { fixture, page: fixture.nativeElement as HTMLElement };
}

function type(page: HTMLElement, selector: string, value: string): void {
  const input = page.querySelector<HTMLInputElement>(selector);
  if (!input) {
    throw new Error(`${selector} not found`);
  }
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

async function send(
  fixture: ComponentFixture<PickupSummaryPageComponent>,
  page: HTMLElement,
): Promise<void> {
  page.querySelector<HTMLButtonElement>('[data-testid="pickup-send"]')?.click();
  await fixture.whenStable();
  fixture.detectChanges();
}

describe('PickupSummaryPageComponent', () => {
  let requests: CreatePickupOrderRequest[];

  beforeEach(() => {
    requests = [];
  });

  it('should show the products of the order with the total', async () => {
    // Arrange
    const { fixture, page } = await renderPage(requests);
    TestBed.inject(OrderDraftService).add(BURGER, 2);

    // Act
    fixture.detectChanges();

    // Assert
    expect(page.querySelector('.pickup__item-name')?.textContent).toContain('Hamburguesa Clásica');
    expect(page.querySelector('[data-testid="pickup-total"]')?.textContent).toContain('158');
  });

  it('should invite the customer to the menu when there are no products', async () => {
    // Act
    const { page } = await renderPage(requests);

    // Assert
    expect(page.textContent).toContain('Aún no hay productos');
    expect(page.querySelector<HTMLButtonElement>('[data-testid="pickup-send"]')?.disabled).toBe(
      true,
    );
  });

  // CA2
  it('should say the field is required and send nothing when the phone is missing', async () => {
    // Arrange
    const { fixture, page } = await renderPage(requests);
    TestBed.inject(OrderDraftService).add(BURGER);
    fixture.detectChanges();
    type(page, '#pickup-name', 'Ana María');

    // Act
    await send(fixture, page);

    // Assert
    expect(page.querySelector('#pickup-phone-error')?.textContent).toContain(
      PICKUP_MESSAGES.required,
    );
    expect(page.querySelector('#pickup-phone')?.getAttribute('aria-invalid')).toBe('true');
    expect(requests).toHaveLength(0);
  });

  // CA1
  it('should send the order and go to the confirmation when the name and the phone are valid', async () => {
    // Arrange
    const { fixture, page } = await renderPage(requests);
    TestBed.inject(OrderDraftService).add(BURGER);
    fixture.detectChanges();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    type(page, '#pickup-name', 'Ana María');
    type(page, '#pickup-phone', '771 123 4567');

    // Act
    await send(fixture, page);

    // Assert
    expect(requests).toHaveLength(1);
    expect(requests[0].phone).toBe('7711234567');
    expect(navigate).toHaveBeenCalledWith('/pickup/orders');
    expect(TestBed.inject(PickupReceiptsService).receipts()).toHaveLength(1);
  });

  it('should write only the digits of the phone', async () => {
    // Arrange
    const { fixture, page } = await renderPage(requests);
    TestBed.inject(OrderDraftService).add(BURGER);
    fixture.detectChanges();

    // Act
    type(page, '#pickup-phone', 'ab77-11x23');
    fixture.detectChanges();

    // Assert
    expect(page.querySelector<HTMLInputElement>('#pickup-phone')?.value).toBe('771123');
  });

  it('should not let the customer go over 10 units of a product with the stepper', async () => {
    // Arrange
    const { fixture, page } = await renderPage(requests);
    TestBed.inject(OrderDraftService).add(BURGER, 10);

    // Act
    fixture.detectChanges();

    // Assert
    const add = page.querySelector<HTMLButtonElement>('button[aria-label^="Agregar uno de"]');
    expect(add?.disabled).toBe(true);
  });

  it('should block sending and explain it when the order has more than 20 products', async () => {
    // Arrange
    const { fixture, page } = await renderPage(requests);
    const draft = TestBed.inject(OrderDraftService);
    for (let index = 0; index < 21; index++) {
      draft.add({ productId: `p${index}`, name: `Producto ${index}`, unitPrice: 10 });
    }

    // Act
    fixture.detectChanges();

    // Assert
    expect(page.querySelector('.pickup__error')?.textContent).toContain(
      PICKUP_MESSAGES.tooManyProducts,
    );
    expect(page.querySelector<HTMLButtonElement>('[data-testid="pickup-send"]')?.disabled).toBe(
      true,
    );
  });
});
