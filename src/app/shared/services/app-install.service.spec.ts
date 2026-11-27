import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import {
  AppInstallService,
  BeforeInstallPromptEvent,
  INSTALL_PLATFORM,
  InstallPlatform,
} from './app-install.service';

const BROWSER_TAB: InstallPlatform = { standalone: false, ios: false };

function promptEvent(outcome: 'accepted' | 'dismissed'): BeforeInstallPromptEvent {
  const event = new Event('beforeinstallprompt', { cancelable: true });
  return Object.assign(event, {
    prompt: vi.fn(() => Promise.resolve()),
    userChoice: Promise.resolve({ outcome }),
  });
}

describe('AppInstallService', () => {
  function setUp(platform: InstallPlatform = BROWSER_TAB): AppInstallService {
    TestBed.configureTestingModule({
      providers: [{ provide: INSTALL_PLATFORM, useValue: platform }],
    });
    const service = TestBed.inject(AppInstallService);
    service.start();
    return service;
  }

  it('should not offer to install when the browser has not fired its prompt', () => {
    // Act
    const service = setUp();

    // Assert
    expect(service.canInstall()).toBe(false);
  });

  it('should offer to install and keep the browser prompt when the browser fires it', () => {
    // Arrange
    const service = setUp();
    const event = promptEvent('accepted');

    // Act
    window.dispatchEvent(event);

    // Assert
    expect(service.canInstall()).toBe(true);
    expect(event.defaultPrevented).toBe(true);
  });

  // CA1: tapping "Instalar" opens the browser's dialog and, once accepted, the app is installed.
  it('should open the browser dialog and count the app as installed when the user accepts', async () => {
    // Arrange
    const service = setUp();
    const event = promptEvent('accepted');
    window.dispatchEvent(event);

    // Act
    await service.install();

    // Assert
    expect(event.prompt).toHaveBeenCalledOnce();
    expect(service.installed()).toBe(true);
    expect(service.canInstall()).toBe(false);
  });

  it('should stop offering until the browser fires a new prompt when the user dismisses the dialog', async () => {
    // Arrange
    const service = setUp();
    window.dispatchEvent(promptEvent('dismissed'));

    // Act
    await service.install();

    // Assert
    expect(service.installed()).toBe(false);
    expect(service.canInstall()).toBe(false);
  });

  // CA3: an installed app never offers "Instalar" again.
  it('should not offer to install when the app was opened from its icon', () => {
    // Arrange
    const service = setUp({ standalone: true, ios: false });

    // Act
    window.dispatchEvent(promptEvent('accepted'));

    // Assert
    expect(service.installed()).toBe(true);
    expect(service.canInstall()).toBe(false);
  });

  it('should stop offering when the app is installed from the browser menu', () => {
    // Arrange
    const service = setUp();
    window.dispatchEvent(promptEvent('accepted'));

    // Act
    window.dispatchEvent(new Event('appinstalled'));

    // Assert
    expect(service.installed()).toBe(true);
    expect(service.canInstall()).toBe(false);
  });

  it('should show how to install from Safari when the device is an iPhone in a browser tab', () => {
    // Act
    const service = setUp({ standalone: false, ios: true });

    // Assert
    expect(service.showIosHint()).toBe(true);
  });

  it('should not show the Safari hint when the iPhone already opened the installed app', () => {
    // Act
    const service = setUp({ standalone: true, ios: true });

    // Assert
    expect(service.showIosHint()).toBe(false);
  });
});

describe('AppInstallService without a prompt', () => {
  it('should do nothing when there is no prompt to open', async () => {
    // Arrange
    TestBed.configureTestingModule({
      providers: [{ provide: INSTALL_PLATFORM, useValue: BROWSER_TAB }],
    });
    const service = TestBed.inject(AppInstallService);

    // Act
    await service.install();

    // Assert
    expect(service.installed()).toBe(false);
  });

  it('should log and keep the app uninstalled when the browser prompt fails', async () => {
    // Arrange
    TestBed.configureTestingModule({
      providers: [{ provide: INSTALL_PLATFORM, useValue: BROWSER_TAB }],
    });
    const service = TestBed.inject(AppInstallService);
    service.start();
    const event = promptEvent('accepted');
    event.prompt = vi.fn(() => Promise.reject(new Error('blocked')));
    window.dispatchEvent(event);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    // Act
    await service.install();

    // Assert
    expect(consoleError).toHaveBeenCalledOnce();
    expect(service.installed()).toBe(false);
    consoleError.mockRestore();
  });
});

describe('INSTALL_PLATFORM', () => {
  function detect(view: unknown): InstallPlatform {
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: { defaultView: view } }],
    });
    return TestBed.inject(INSTALL_PLATFORM);
  }

  function view(
    userAgent: string,
    options: {
      standaloneQuery?: boolean;
      iosStandalone?: boolean;
      touchPoints?: number;
      noMatchMedia?: boolean;
    } = {},
  ): unknown {
    return {
      navigator: {
        userAgent,
        maxTouchPoints: options.touchPoints ?? 0,
        standalone: options.iosStandalone,
      },
      matchMedia: options.noMatchMedia
        ? undefined
        : () => ({ matches: options.standaloneQuery ?? false }),
    };
  }

  it('should be a browser tab when there is no window', () => {
    // Act / Assert
    expect(detect(null)).toEqual({ standalone: false, ios: false });
  });

  it('should be standalone when the display mode is standalone', () => {
    // Act / Assert
    expect(detect(view('Mozilla/5.0 (Linux; Android 14)', { standaloneQuery: true }))).toEqual({
      standalone: true,
      ios: false,
    });
  });

  it('should be the installed iPhone app when Safari says it is standalone', () => {
    // Act / Assert
    expect(
      detect(
        view('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)', {
          iosStandalone: true,
          noMatchMedia: true,
        }),
      ),
    ).toEqual({
      standalone: true,
      ios: true,
    });
  });

  it('should be an iPad when a Mac user agent has a touch screen', () => {
    // Act / Assert
    expect(
      detect(view('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', { touchPoints: 5 })),
    ).toEqual({
      standalone: false,
      ios: true,
    });
  });

  it('should be a Mac when the Mac user agent has no touch screen', () => {
    // Act / Assert
    expect(detect(view('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'))).toEqual({
      standalone: false,
      ios: false,
    });
  });
});
