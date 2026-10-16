import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { PICKUP_RECEIPTS_STORAGE } from '@shared/state/pickup-receipts/pickup-receipts.service';
import { MemoryStorage } from '@shared/testing/memory-storage';

import type { PickupOrder, PickupOrderStatus } from '../../models/pickup-order.models';
import { PICKUP_API, type PickupApi } from '../../services/pickup-api';
import { PickupOrderStore } from '../../services/pickup-order-store.service';
import { PickupOrdersPageComponent } from './pickup-orders-page.component';

function order(id: string, number: number, status: PickupOrderStatus): PickupOrder {
  return {
    clientOrderId: id,
    orderNumber: number,
    status,
    total: 108,
    createdAt: new Date(Date.UTC(2026, 9, 15, 18, number)).toISOString(),
    items: [
      { name: 'Hamburguesa Clásica', quantity: 1, unitPrice: 79, subtotal: 79 },
      { name: 'Refresco de Cola', quantity: 1, unitPrice: 29, subtotal: 29 },
    ],
  };
}

describe('PickupOrdersPageComponent', () => {
  let statuses: Record<string, PickupOrderStatus>;
  let storage: MemoryStorage;

  async function renderPage(): Promise<{
    fixture: ComponentFixture<PickupOrdersPageComponent>;
    page: HTMLElement;
  }> {
    const api: PickupApi = {
      createOrder: () => of({} as PickupOrder),
      getOrder: (id) => of(order(id, id === 'a' ? 1 : 2, statuses[id])),
    };
    await TestBed.configureTestingModule({
      imports: [PickupOrdersPageComponent],
      providers: [
        provideRouter([]),
        PickupOrderStore,
        { provide: PICKUP_API, useValue: api },
        { provide: PICKUP_RECEIPTS_STORAGE, useValue: storage },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PickupOrdersPageComponent);
    await settle(fixture);
    return { fixture, page: fixture.nativeElement as HTMLElement };
  }

  async function settle(fixture: ComponentFixture<PickupOrdersPageComponent>): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
    await Promise.resolve();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    statuses = { a: 'New', b: 'InPreparation' };
    storage = new MemoryStorage();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  // CA3
  it('should show the current status of the order when the customer comes back to the screen', async () => {
    // Arrange
    storage.setItem('itacr.pickup-receipts', '[{"clientOrderId":"a","orderNumber":1}]');
    statuses = { a: 'Ready', b: 'New' };

    // Act
    const { page } = await renderPage();

    // Assert
    expect(page.querySelector('.order__number')?.textContent).toContain('Orden #1');
    expect(page.querySelector('app-status-badge')?.textContent).toContain('Listo para recoger');
    expect(page.querySelector('.order__hint')?.textContent).toContain('paga en el mostrador');
    expect(page.querySelector('.order')?.getAttribute('data-status')).toBe('Ready');
  });

  it('should list both active orders, the newest first, so a second order never hides the first', async () => {
    // Arrange
    storage.setItem(
      'itacr.pickup-receipts',
      '[{"clientOrderId":"a","orderNumber":1},{"clientOrderId":"b","orderNumber":2}]',
    );

    // Act
    const { page } = await renderPage();

    // Assert
    const numbers = Array.from(page.querySelectorAll('.order__number'), (item) =>
      item.textContent?.trim(),
    );
    expect(numbers).toEqual(['Orden #2', 'Orden #1']);
    expect(page.textContent).toContain('Hamburguesa Clásica');
    expect(page.textContent).toContain('Total a pagar al recoger');
  });

  it('should say there are no active orders when the device has no receipts', async () => {
    // Act
    const { page } = await renderPage();

    // Assert
    expect(page.textContent).toContain('No tienes pedidos activos');
    expect(page.querySelector('.order')).toBeNull();
  });

  it('should never show the name or the phone of the customer', async () => {
    // Arrange
    storage.setItem('itacr.pickup-receipts', '[{"clientOrderId":"a","orderNumber":1}]');

    // Act
    const { page } = await renderPage();

    // Assert
    expect(page.textContent).not.toMatch(/\d{10}/);
  });
});
