import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, InjectionToken, signal } from '@angular/core';

/** Fired by Chromium browsers (Chrome, Edge, Samsung Internet) once the app can be installed. Not in the DOM typings. */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ readonly outcome: 'accepted' | 'dismissed' }>;
}

/** How the app was opened and on which kind of device. */
export interface InstallPlatform {
  /** Opened from the installed icon, not from a browser tab. */
  readonly standalone: boolean;
  /** iPhone or iPad: Safari has no install prompt and installs from Compartir > Agregar a inicio. */
  readonly ios: boolean;
}

const STANDALONE_QUERY = '(display-mode: standalone)';
const IOS_DEVICE = /iphone|ipad|ipod/i;
const MAC = /macintosh/i;

interface IosNavigator {
  readonly standalone?: boolean;
}

function detectPlatform(view: Window | null): InstallPlatform {
  if (view === null) {
    return { standalone: false, ios: false };
  }
  const { navigator } = view;
  const standalone =
    (view.matchMedia?.(STANDALONE_QUERY).matches ?? false) ||
    (navigator as IosNavigator).standalone === true;
  // iPadOS reports itself as a Mac; only the touch screen tells them apart.
  const ios =
    IOS_DEVICE.test(navigator.userAgent) ||
    (MAC.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  return { standalone, ios };
}

export const INSTALL_PLATFORM = new InjectionToken<InstallPlatform>('INSTALL_PLATFORM', {
  providedIn: 'root',
  factory: () => detectPlatform(inject(DOCUMENT).defaultView),
});

/**
 * Installing ITACR on the device as an app (HU_11). The browser's prompt event is kept when it fires, so the home can offer
 * "Instalar" and open the browser's own dialog from a tap. Once installed, nothing is offered again.
 */
@Injectable({ providedIn: 'root' })
export class AppInstallService {
  private readonly view = inject(DOCUMENT).defaultView;
  private readonly platform = inject(INSTALL_PLATFORM);
  private readonly promptEvent = signal<BeforeInstallPromptEvent | null>(null);
  private readonly installedState = signal(this.platform.standalone);

  readonly installed = this.installedState.asReadonly();
  readonly canInstall = computed(() => this.promptEvent() !== null && !this.installedState());
  readonly showIosHint = computed(() => this.platform.ios && !this.installedState());

  /** Listens from app start: the browser fires the prompt event once, usually before the home is shown. */
  start(): void {
    this.view?.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.promptEvent.set(event as BeforeInstallPromptEvent);
    });
    this.view?.addEventListener('appinstalled', () => {
      this.promptEvent.set(null);
      this.installedState.set(true);
    });
  }

  async install(): Promise<void> {
    const event = this.promptEvent();
    if (event === null) {
      return;
    }
    // A prompt event opens the dialog only once; the browser fires a new one if the user dismisses it.
    this.promptEvent.set(null);
    try {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === 'accepted') {
        this.installedState.set(true);
      }
    } catch (error: unknown) {
      console.error('Failed to open the install prompt', error);
    }
  }
}
