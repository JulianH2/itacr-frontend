import { Injectable, computed, signal } from '@angular/core';

/** A request that takes longer than this is probably waiting for the App Service or the database to start. */
export const SLOW_REQUEST_MS = 4000;

export type ServerWakePhase = 'idle' | 'waking' | 'failed';

/**
 * Whether the API is waking up. The free plan unloads the apps when idle and pauses the database, so the first
 * requests after a while can take about a minute (ITACR-67). The interceptor reports what happens and the banner shows it.
 */
@Injectable({ providedIn: 'root' })
export class ServerWakeService {
  private readonly waking = signal(false);
  private readonly gaveUp = signal(false);

  readonly phase = computed<ServerWakePhase>(() => {
    if (this.gaveUp()) {
      return 'failed';
    }
    return this.waking() ? 'waking' : 'idle';
  });

  /** Starts watching a request. The returned function stops watching it, whatever its result. */
  watch(): () => void {
    const timer = setTimeout(() => this.waking.set(true), SLOW_REQUEST_MS);
    return () => clearTimeout(timer);
  }

  /** The server is waking up and the request is going to be tried again. */
  retrying(): void {
    this.gaveUp.set(false);
    this.waking.set(true);
  }

  /** The tries ran out without an answer. */
  failed(): void {
    this.waking.set(false);
    this.gaveUp.set(true);
  }

  /** The server answered, with data or with an error of its own, so it is awake. */
  awake(): void {
    this.waking.set(false);
    this.gaveUp.set(false);
  }

  dismiss(): void {
    this.awake();
  }
}
