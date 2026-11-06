import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AppInstallService } from '@shared/services/app-install.service';
import {
  PICKUP_RECEIPTS_STORAGE,
  PickupReceiptsService,
} from '@shared/state/pickup-receipts/pickup-receipts.service';
import { MemoryStorage } from '@shared/testing/memory-storage';
import { renderComponent, rootElement } from '@shared/testing/render';
import { HomePageComponent } from './home-page.component';

class FakeAppInstallService {
  readonly canInstall = signal(false);
  readonly showIosHint = signal(false);
  readonly install = vi.fn(() => Promise.resolve());
}

describe('HomePageComponent', () => {
  let appInstall: FakeAppInstallService;

  beforeEach(() => {
    appInstall = new FakeAppInstallService();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: PICKUP_RECEIPTS_STORAGE, useValue: new MemoryStorage() },
        { provide: AppInstallService, useValue: appInstall },
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

  // HU_11 CA1: the browser can install the app, so the home offers it and a tap opens the browser's dialog.
  it('should open the install dialog when the browser can install the app and the user taps Instalar', async () => {
    // Arrange
    appInstall.canInstall.set(true);
    const fixture = await renderComponent(HomePageComponent);
    const button = rootElement(fixture).querySelector<HTMLButtonElement>(
      '[data-testid="install-app"]',
    );

    // Act
    button?.click();

    // Assert
    expect(button?.textContent).toContain('Instalar');
    expect(appInstall.install).toHaveBeenCalledOnce();
  });

  // HU_11 CA3: an installed app (or a browser that cannot install it) shows no install button.
  it('should not offer to install when the app cannot be installed or already is', async () => {
    // Act
    const fixture = await renderComponent(HomePageComponent);

    // Assert
    expect(rootElement(fixture).querySelector('[data-testid="install-app"]')).toBeNull();
    expect(rootElement(fixture).querySelector('[data-testid="install-ios-hint"]')).toBeNull();
  });

  it('should explain how to install from Safari when the device is an iPhone', async () => {
    // Arrange
    appInstall.showIosHint.set(true);

    // Act
    const fixture = await renderComponent(HomePageComponent);

    // Assert
    expect(
      rootElement(fixture).querySelector('[data-testid="install-ios-hint"]')?.textContent,
    ).toContain('Agregar a inicio');
  });

  it('should list the three steps of the pickup flow when the home opens', async () => {
    // Act
    const fixture = await renderComponent(HomePageComponent);

    // Assert
    expect(rootElement(fixture).querySelectorAll('.step')).toHaveLength(3);
  });
});
