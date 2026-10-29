import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SwPush } from '@angular/service-worker';
import { of } from 'rxjs';

import { environment } from '@env/environment';

import { PushNotificationsService } from './push-notifications.service';

const PUBLIC_KEY = 'BPublicKeyFromTheApi';
const CLIENT_ORDER_ID = '3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b';

const SUBSCRIPTION = {
  endpoint: 'https://push.example.com/send/abc',
  toJSON: () => ({
    endpoint: 'https://push.example.com/send/abc',
    keys: { p256dh: 'BP256dhKey', auth: 'authKey' },
  }),
} as unknown as PushSubscription;

class FakeSwPush {
  isEnabled = true;
  readonly requestSubscription = vi.fn(() => Promise.resolve(SUBSCRIPTION));
  readonly subscription = of<PushSubscription | null>(SUBSCRIPTION);
}

describe('PushNotificationsService', () => {
  let swPush: FakeSwPush;
  let http: HttpTestingController;

  function setUp(permission: NotificationPermission | null = 'default'): PushNotificationsService {
    vi.stubGlobal('Notification', permission === null ? undefined : { permission });
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SwPush, useValue: swPush },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    return TestBed.inject(PushNotificationsService);
  }

  async function answerPublicKey(): Promise<void> {
    await Promise.resolve();
    http
      .expectOne(`${environment.apiBaseUrl}/public/push/public-key`)
      .flush({ publicKey: PUBLIC_KEY });
    await Promise.resolve();
    await Promise.resolve();
  }

  beforeEach(() => {
    swPush = new FakeSwPush();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    http.verify();
  });

  it('should be unsupported when the service worker is off, as in development', () => {
    // Arrange
    swPush.isEnabled = false;

    // Act
    const service = setUp();

    // Assert
    expect(service.permission()).toBe('unsupported');
  });

  it('should be unsupported when the browser has no Notification API', () => {
    // Act
    const service = setUp(null);

    // Assert
    expect(service.permission()).toBe('unsupported');
  });

  // CA1
  it('should subscribe with the API key and save the browser for the waiter', async () => {
    // Arrange
    const service = setUp();

    // Act
    const enabling = service.enable({ kind: 'waiter' });
    await answerPublicKey();
    const save = http.expectOne(`${environment.apiBaseUrl}/push/subscriptions`);
    save.flush(null);
    const enabled = await enabling;

    // Assert
    expect(swPush.requestSubscription).toHaveBeenCalledWith({ serverPublicKey: PUBLIC_KEY });
    expect(save.request.method).toBe('POST');
    expect(save.request.body).toEqual({
      endpoint: 'https://push.example.com/send/abc',
      p256dh: 'BP256dhKey',
      auth: 'authKey',
    });
    expect(enabled).toBe(true);
  });

  // CA2
  it('should save the browser for the customer of the pickup order', async () => {
    // Arrange
    const service = setUp();

    // Act
    const enabling = service.enable({ kind: 'pickup', clientOrderId: CLIENT_ORDER_ID });
    await answerPublicKey();
    http
      .expectOne(`${environment.apiBaseUrl}/public/orders/${CLIENT_ORDER_ID}/push-subscription`)
      .flush(null);

    // Assert
    expect(await enabling).toBe(true);
  });

  it('should not ask for permission when the API has no key', async () => {
    // Arrange
    const service = setUp();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    // Act
    const enabling = service.enable({ kind: 'waiter' });
    await Promise.resolve();
    http
      .expectOne(`${environment.apiBaseUrl}/public/push/public-key`)
      .flush(null, { status: 404, statusText: 'Not Found' });

    // Assert
    expect(await enabling).toBe(false);
    expect(swPush.requestSubscription).not.toHaveBeenCalled();
  });

  it('should save the current browser again without any prompt when permission was granted', async () => {
    // Arrange
    const service = setUp('granted');

    // Act
    const refreshing = service.refresh({ kind: 'waiter' });
    await Promise.resolve();
    await Promise.resolve();
    http.expectOne(`${environment.apiBaseUrl}/push/subscriptions`).flush(null);
    await refreshing;

    // Assert
    expect(swPush.requestSubscription).not.toHaveBeenCalled();
  });

  it('should not save anything on refresh when permission was not granted', async () => {
    // Arrange
    const service = setUp('default');

    // Act
    await service.refresh({ kind: 'waiter' });

    // Assert
    http.expectNone(`${environment.apiBaseUrl}/push/subscriptions`);
  });

  it('should record a notice as read', async () => {
    // Arrange
    const service = setUp();
    const id = '0c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f';

    // Act
    const marking = service.markRead(id);
    const request = http.expectOne(`${environment.apiBaseUrl}/public/notifications/${id}/read`);
    request.flush(null);
    await marking;

    // Assert
    expect(request.request.method).toBe('POST');
  });
});
