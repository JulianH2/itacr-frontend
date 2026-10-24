import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';

/**
 * Whether the browser reports a network connection. It can say online on a Wi-Fi without internet, so whoever sends
 * data still has to handle a network error.
 */
@Injectable({ providedIn: 'root' })
export class ConnectionStatusService {
  private readonly view = inject(DOCUMENT).defaultView;
  private readonly state = signal(this.view?.navigator.onLine ?? true);

  readonly online = this.state.asReadonly();

  constructor() {
    this.view?.addEventListener('online', () => this.state.set(true));
    this.view?.addEventListener('offline', () => this.state.set(false));
  }
}
