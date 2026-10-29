import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { NotificationReadService } from './notification-read.service';
import { PushNotificationsService } from './push-notifications.service';

@Component({ template: '' })
class BlankPageComponent {}

describe('NotificationReadService', () => {
  const markRead = vi.fn(() => Promise.resolve());
  let router: Router;

  beforeEach(() => {
    markRead.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', component: BlankPageComponent }]),
        { provide: PushNotificationsService, useValue: { markRead } },
      ],
    });
    router = TestBed.inject(Router);
    TestBed.inject(NotificationReadService).start();
  });

  // HU_09: "registro de la notificación como leída"
  it('should record the notice and remove its id from the address when a tapped notice opens the app', async () => {
    // Act
    await router.navigateByUrl(
      '/orders/detail/42?notification=0c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f',
    );
    await TestBed.inject(Router).navigated;
    await new Promise((resolve) => setTimeout(resolve));

    // Assert
    expect(markRead).toHaveBeenCalledWith('0c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f');
    expect(router.url).toBe('/orders/detail/42');
  });

  it('should only remove the parameter when it is not a notification id', async () => {
    // Act
    await router.navigateByUrl('/pickup/orders?notification=not-an-id');
    await new Promise((resolve) => setTimeout(resolve));

    // Assert
    expect(markRead).not.toHaveBeenCalled();
    expect(router.url).toBe('/pickup/orders');
  });

  it('should do nothing on a normal navigation', async () => {
    // Act
    await router.navigateByUrl('/orders?filter=ready');
    await new Promise((resolve) => setTimeout(resolve));

    // Assert
    expect(markRead).not.toHaveBeenCalled();
    expect(router.url).toBe('/orders?filter=ready');
  });
});
