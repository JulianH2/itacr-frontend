import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import {
  PICKUP_RECEIPTS_STORAGE,
  PickupReceiptsService,
} from '@shared/state/pickup-receipts/pickup-receipts.service';
import { MemoryStorage } from '@shared/testing/memory-storage';
import { renderComponent, rootElement } from '@shared/testing/render';
import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: PICKUP_RECEIPTS_STORAGE, useValue: new MemoryStorage() },
      ],
    });
  });

  it('should offer the pickup order and the staff access when the home opens', async () => {
    // Act
    const fixture = await renderComponent(HomePageComponent);

    // Assert
    const element = rootElement(fixture);
    expect(element.querySelector('h1')?.textContent).toContain('Tu mostrador');
    expect(element.querySelector('[data-testid="pickup-order"]')?.getAttribute('href')).toBe(
      '/catalog',
    );
    expect(element.querySelector('[data-testid="staff-access"]')?.getAttribute('href')).toBe(
      '/login',
    );
  });

  it('should not offer to follow an order when the phone has none', async () => {
    // Act
    const fixture = await renderComponent(HomePageComponent);

    // Assert
    expect(rootElement(fixture).querySelector('[data-testid="pickup-status"]')).toBeNull();
  });

  // CA3: the customer finds the order again from the home, with nothing to type.
  it('should offer to follow the order when the phone has an active pickup order', async () => {
    // Arrange
    TestBed.inject(PickupReceiptsService).add({ clientOrderId: 'a', orderNumber: 7 });

    // Act
    const fixture = await renderComponent(HomePageComponent);

    // Assert
    expect(
      rootElement(fixture).querySelector('[data-testid="pickup-status"]')?.getAttribute('href'),
    ).toBe('/pickup/orders');
  });

  it('should list the three steps of the pickup flow when the home opens', async () => {
    // Act
    const fixture = await renderComponent(HomePageComponent);

    // Assert
    expect(rootElement(fixture).querySelectorAll('.step')).toHaveLength(3);
  });
});
