import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SwPush } from '@angular/service-worker';
import { of, throwError } from 'rxjs';

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

  it('should not turn the notices on when they are unsupported', async () => {
    // Arrange
    swPush.isEnabled = false;
    const service = setUp();

    // Act
    const enabled = await service.enable({ kind: 'waiter' });

    // Assert
    expect(enabled).toBe(false);
    expect(swPush.requestSubscription).not.toHaveBeenCalled();
  });

  it('should do nothing when the app has no service worker', async () => {
    // Arrange
    swPush = null as unknown as FakeSwPush;
    const service = setUp('granted');

    // Act
    const enabled = await service.enable({ kind: 'waiter' });
    await service.refresh({ kind: 'waiter' });

    // Assert
    expect(enabled).toBe(false);
    expect(service.permission()).toBe('unsupported');
  });

  it('should not save anything on refresh when the browser has no subscription', async () => {
    // Arrange
    swPush = Object.assign(new FakeSwPush(), { subscription: of<PushSubscription | null>(null) });
    const service = setUp('granted');

    // Act
    await service.refresh({ kind: 'waiter' });

    // Assert
    http.expectNone(`${environment.apiBaseUrl}/push/subscriptions`);
  });

  it('should log and go on when the subscription cannot be read on refresh', async () => {
    // Arrange
    swPush = Object.assign(new FakeSwPush(), {
      subscription: throwError(() => new Error('no service worker')),
    });
    const service = setUp('granted');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    // Act
    await service.refresh({ kind: 'waiter' });

    // Assert
    expect(consoleError).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });

  it('should send empty keys when the subscription has none', async () => {
    // Arrange
    const withoutKeys = {
      toJSON: () => ({ endpoint: 'https://push.example.com/send/xyz' }),
    } as unknown as PushSubscription;
    swPush = Object.assign(new FakeSwPush(), {
      subscription: of<PushSubscription | null>(withoutKeys),
    });
    const service = setUp('granted');

    // Act
    const refreshing = service.refresh({ kind: 'waiter' });
    await Promise.resolve();
    await Promise.resolve();
    const request = http.expectOne(`${environment.apiBaseUrl}/push/subscriptions`);
    request.flush(null);
    await refreshing;

    // Assert
    expect(request.request.body).toEqual({
      endpoint: 'https://push.example.com/send/xyz',
      p256dh: '',
      auth: '',
    });
  });

  it('should log and go on when a notice cannot be recorded as read', async () => {
    // Arrange
    const service = setUp();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    // Act
    const marking = service.markRead('notice-1');
    http
      .expectOne(`${environment.apiBaseUrl}/public/notifications/notice-1/read`)
      .flush(null, { status: 500, statusText: 'Server Error' });
    await marking;

    // Assert
    expect(consoleError).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });
});
