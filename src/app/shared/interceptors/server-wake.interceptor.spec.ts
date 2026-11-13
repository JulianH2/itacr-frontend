import {
  HttpClient,
  HttpStatusCode,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { environment } from '@env/environment';
import { ConnectionStatusService } from '@shared/services/connection-status.service';
import { SLOW_REQUEST_MS, ServerWakeService } from '@shared/services/server-wake.service';

import { serverWakeInterceptor, WAKE_RETRY_DELAYS_MS } from './server-wake.interceptor';

const API_URL = `${environment.apiBaseUrl}/catalog/products`;

describe('serverWakeInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let wake: ServerWakeService;
  const online = signal(true);

  function flushStatus(url: string, status: number): void {
    backend.expectOne(url).flush(null, { status, statusText: 'status' });
  }

  function flushNetworkError(url: string): void {
    backend.expectOne(url).error(new ProgressEvent('error'), { status: 0 });
  }

  beforeEach(() => {
    vi.useFakeTimers();
    online.set(true);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([serverWakeInterceptor])),
        provideHttpClientTesting(),
        { provide: ConnectionStatusService, useValue: { online } },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    wake = TestBed.inject(ServerWakeService);
  });

  afterEach(() => {
    backend.verify();
    vi.useRealTimers();
  });

  it('asks again after a 503 and delivers the data once the server answers', async () => {
    const received: unknown[] = [];
    http.get(API_URL).subscribe((body) => received.push(body));

    flushStatus(API_URL, HttpStatusCode.ServiceUnavailable);
    expect(wake.phase()).toBe('waking');
    expect(received).toEqual([]);

    await vi.advanceTimersByTimeAsync(WAKE_RETRY_DELAYS_MS[0]);
    backend.expectOne(API_URL).flush([{ id: 1 }]);

    expect(received).toEqual([[{ id: 1 }]]);
    expect(wake.phase()).toBe('idle');
  });

  it.each([HttpStatusCode.BadGateway, HttpStatusCode.GatewayTimeout])(
    'asks again after a %s',
    async (status) => {
      http.get(API_URL).subscribe();

      flushStatus(API_URL, status);
      await vi.advanceTimersByTimeAsync(WAKE_RETRY_DELAYS_MS[0]);

      backend.expectOne(API_URL).flush([]);
      expect(wake.phase()).toBe('idle');
    },
  );

  it('asks again after a network error with the browser online (the platform answers without CORS headers)', async () => {
    http.get(API_URL).subscribe();

    flushNetworkError(API_URL);
    expect(wake.phase()).toBe('waking');
    await vi.advanceTimersByTimeAsync(WAKE_RETRY_DELAYS_MS[0]);

    backend.expectOne(API_URL).flush([]);
    expect(wake.phase()).toBe('idle');
  });

  it('does not treat a network error as a sleeping server while the browser is offline', () => {
    online.set(false);
    let failed = false;
    http.get(API_URL).subscribe({ error: () => (failed = true) });

    flushNetworkError(API_URL);

    expect(failed).toBe(true);
    expect(wake.phase()).toBe('idle');
  });

  it('waits longer before each new try', async () => {
    http.get(API_URL).subscribe({ error: () => undefined });
    flushStatus(API_URL, HttpStatusCode.ServiceUnavailable);

    await vi.advanceTimersByTimeAsync(WAKE_RETRY_DELAYS_MS[0] - 1);
    backend.expectNone(API_URL);
    await vi.advanceTimersByTimeAsync(1);
    flushStatus(API_URL, HttpStatusCode.ServiceUnavailable);

    await vi.advanceTimersByTimeAsync(WAKE_RETRY_DELAYS_MS[1] - 1);
    backend.expectNone(API_URL);
    await vi.advanceTimersByTimeAsync(1);
    backend.expectOne(API_URL).flush([]);
  });

  it('gives up after the last try, passes the error on and reports the failure', async () => {
    let status: number | undefined;
    http.get(API_URL).subscribe({ error: (error: { status: number }) => (status = error.status) });

    flushStatus(API_URL, HttpStatusCode.ServiceUnavailable);
    for (const delay of WAKE_RETRY_DELAYS_MS) {
      await vi.advanceTimersByTimeAsync(delay);
      flushStatus(API_URL, HttpStatusCode.ServiceUnavailable);
    }

    expect(status).toBe(HttpStatusCode.ServiceUnavailable);
    expect(wake.phase()).toBe('failed');
  });

  it.each([
    HttpStatusCode.BadRequest,
    HttpStatusCode.Unauthorized,
    HttpStatusCode.NotFound,
    HttpStatusCode.Conflict,
    HttpStatusCode.InternalServerError,
  ])('does not ask again after a %s: the server is awake and answered', (status) => {
    let failed = false;
    http.get(API_URL).subscribe({ error: () => (failed = true) });

    flushStatus(API_URL, status);

    expect(failed).toBe(true);
    expect(wake.phase()).toBe('idle');
  });

  it('never repeats a request that changes data', () => {
    let failed = false;
    http.post(API_URL, {}).subscribe({ error: () => (failed = true) });

    flushStatus(API_URL, HttpStatusCode.ServiceUnavailable);

    expect(failed).toBe(true);
    expect(wake.phase()).toBe('failed');
  });

  it('shows the waiting state when a request is slow and clears it when it answers', () => {
    http.get(API_URL).subscribe();

    vi.advanceTimersByTime(SLOW_REQUEST_MS);
    expect(wake.phase()).toBe('waking');

    backend.expectOne(API_URL).flush([]);
    expect(wake.phase()).toBe('idle');
  });

  it('does not show it for a request that answers in time', () => {
    http.get(API_URL).subscribe();

    vi.advanceTimersByTime(SLOW_REQUEST_MS - 1);
    backend.expectOne(API_URL).flush([]);
    vi.advanceTimersByTime(SLOW_REQUEST_MS);

    expect(wake.phase()).toBe('idle');
  });

  it('ignores requests to other servers', () => {
    let failed = false;
    http.get('https://other.example/data').subscribe({ error: () => (failed = true) });

    flushStatus('https://other.example/data', HttpStatusCode.ServiceUnavailable);
    vi.advanceTimersByTime(SLOW_REQUEST_MS);

    expect(failed).toBe(true);
    expect(wake.phase()).toBe('idle');
  });
});
