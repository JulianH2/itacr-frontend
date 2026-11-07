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
