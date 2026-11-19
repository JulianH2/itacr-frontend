import { TestBed } from '@angular/core/testing';

import { SLOW_REQUEST_MS, ServerWakeService } from './server-wake.service';

describe('ServerWakeService', () => {
  let service: ServerWakeService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = TestBed.inject(ServerWakeService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is idle until a request is slow', () => {
    service.watch();

    vi.advanceTimersByTime(SLOW_REQUEST_MS - 1);
    expect(service.phase()).toBe('idle');

    vi.advanceTimersByTime(1);
    expect(service.phase()).toBe('waking');
  });

  it('does not wake up for a request that finished in time', () => {
    const stop = service.watch();

    vi.advanceTimersByTime(SLOW_REQUEST_MS - 1);
    stop();
    vi.advanceTimersByTime(SLOW_REQUEST_MS);

    expect(service.phase()).toBe('idle');
  });

  it('is waking while a try is being repeated, and idle once the server answers', () => {
    service.retrying();
    expect(service.phase()).toBe('waking');

    service.awake();
    expect(service.phase()).toBe('idle');
  });

  it('is failed after giving up, until the server answers or the user dismisses it', () => {
    service.retrying();
    service.failed();
    expect(service.phase()).toBe('failed');

    service.dismiss();
    expect(service.phase()).toBe('idle');

    service.failed();
    service.awake();
    expect(service.phase()).toBe('idle');
  });

  it('goes back to waking when a new try starts after a failure', () => {
    service.failed();

    service.retrying();

    expect(service.phase()).toBe('waking');
  });
});
