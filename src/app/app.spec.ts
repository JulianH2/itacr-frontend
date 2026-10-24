import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { EmployeeRole } from '@shared/auth/auth.models';
import { SESSION_STORAGE, SessionService } from '@shared/auth/session.service';
import { loginResponse } from '@shared/testing/auth-fixtures';
import { ConnectionStatusService } from '@shared/services/connection-status.service';
import { MemoryStorage } from '@shared/testing/memory-storage';

import { App, NAVIGATION_BY_ROLE } from './app';
import type { PendingOrder } from './modules/orders/take-order/models/take-order.models';
import { OfflineOrdersService } from './modules/orders/take-order/services/offline-orders.service';

describe('App', () => {
  let online: ReturnType<typeof signal<boolean>>;
  let unsentOrders: ReturnType<typeof signal<readonly PendingOrder[]>>;

  beforeEach(async () => {
    online = signal(true);
    unsentOrders = signal<readonly PendingOrder[]>([]);
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: SESSION_STORAGE, useValue: new MemoryStorage() },
        { provide: ConnectionStatusService, useValue: { online } },
        { provide: OfflineOrdersService, useValue: { orders: unsentOrders } },
      ],
    }).compileComponents();
  });

  // jsdom has no modal dialogs.
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement): void {
      this.open = true;
    };
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement): void {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    };
  });

  function offlineNotice(fixture: { nativeElement: unknown }): HTMLDialogElement | null {
    return (fixture.nativeElement as HTMLElement).querySelector('app-offline-dialog dialog');
  }

  it('should render the brand name when the app starts', async () => {
    // Arrange
    const fixture = TestBed.createComponent(App);

    // Act
    await fixture.whenStable();

    // Assert
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.brand-name')?.textContent?.trim()).toBe('ITACR');
  });

  it('should hide the navigation and profile when nobody is logged in', async () => {
    // Arrange
    const fixture = TestBed.createComponent(App);

    // Act
    await fixture.whenStable();

    // Assert
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.nav')).toBeNull();
    expect(element.querySelector('[data-testid="logout"]')).toBeNull();
  });

  it('should show only the links of the role when a waiter is logged in', async () => {
    // Arrange
    TestBed.inject(SessionService).start(loginResponse(EmployeeRole.Waiter));
    const fixture = TestBed.createComponent(App);

    // Act
    await fixture.whenStable();

    // Assert
    const element = fixture.nativeElement as HTMLElement;
    const links = element.querySelectorAll('.nav__link:not(button)');
    expect(links.length).toBe(NAVIGATION_BY_ROLE[EmployeeRole.Waiter].length);
    expect(element.querySelector('[data-testid="profile-name"]')?.textContent).toContain('Ana M.');
  });

  // The manager can follow the kitchen queue, so the kitchen link is part of their navigation.
  it('should link the kitchen board when a manager is logged in', async () => {
    // Arrange
    TestBed.inject(SessionService).start(loginResponse(EmployeeRole.Manager));
    const fixture = TestBed.createComponent(App);

    // Act
    await fixture.whenStable();

    // Assert
    const links = (fixture.nativeElement as HTMLElement).querySelectorAll('.nav__link:not(button)');
    expect(Array.from(links, (link) => link.getAttribute('href'))).toContain('/kitchen');
  });

  it('should clear the session and go to login when the employee logs out', async () => {
    // Arrange
    const session = TestBed.inject(SessionService);
    session.start(loginResponse(EmployeeRole.Waiter));
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    // Act
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-testid="logout"]')
      ?.click();
    await fixture.whenStable();

    // Assert
    expect(session.session()).toBeNull();
    expect(navigate).toHaveBeenCalledWith('/login');
  });

  // HU_07 CA4
  it('should show the offline notice over the current screen and close it when the waiter continues', async () => {
    // Arrange
    TestBed.inject(SessionService).start(loginResponse(EmployeeRole.Waiter));
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    // Act
    online.set(false);
    await fixture.whenStable();
    const wasOpen = offlineNotice(fixture)?.open;
    offlineNotice(fixture)
      ?.querySelector<HTMLButtonElement>('[data-testid="continue-offline"]')
      ?.click();
    await fixture.whenStable();

    // Assert
    expect(wasOpen).toBe(true);
    expect(offlineNotice(fixture)?.textContent).toContain('Sin conexión');
    expect(offlineNotice(fixture)?.open).toBe(false);
    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('should close the offline notice by itself when the connection comes back', async () => {
    // Arrange
    TestBed.inject(SessionService).start(loginResponse(EmployeeRole.Waiter));
    const fixture = TestBed.createComponent(App);
    online.set(false);
    await fixture.whenStable();

    // Act
    online.set(true);
    await fixture.whenStable();

    // Assert
    expect(offlineNotice(fixture)?.open).toBe(false);
  });

  it('should not show the offline notice when nobody is logged in', async () => {
    // Arrange
    const fixture = TestBed.createComponent(App);

    // Act
    online.set(false);
    await fixture.whenStable();

    // Assert
    expect(offlineNotice(fixture)?.open).toBe(false);
  });

  it('should stay signed in when the waiter has unsent orders and cancels the logout', async () => {
    // Arrange
    const session = TestBed.inject(SessionService);
    session.start(loginResponse(EmployeeRole.Waiter));
    unsentOrders.set([{ clientOrderId: 'order-1' } as PendingOrder]);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    // Act
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-testid="logout"]')
      ?.click();

    // Assert
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('1 pedido sin enviar'));
    expect(session.session()).not.toBeNull();
  });
});
