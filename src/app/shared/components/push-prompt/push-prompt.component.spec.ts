import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  PushNotificationsService,
  type PushPermission,
  type PushTarget,
} from '@shared/services/push-notifications.service';

import { PushPromptComponent } from './push-prompt.component';

const TARGET: PushTarget = { kind: 'waiter' };

class FakePushNotifications {
  readonly permissionState = signal<PushPermission>('default');
  readonly permission = this.permissionState.asReadonly();
  enableResult = true;
  readonly enable = vi.fn(() => {
    this.permissionState.set(this.enableResult ? 'granted' : 'default');
    return Promise.resolve(this.enableResult);
  });
  readonly refresh = vi.fn(() => Promise.resolve());
}

describe('PushPromptComponent', () => {
  let push: FakePushNotifications;

  async function render(permission: PushPermission): Promise<HTMLElement> {
    push.permissionState.set(permission);
    await TestBed.configureTestingModule({
      imports: [PushPromptComponent],
      providers: [{ provide: PushNotificationsService, useValue: push }],
    }).compileComponents();
    const fixture = TestBed.createComponent(PushPromptComponent);
    fixture.componentRef.setInput('target', TARGET);
    fixture.componentRef.setInput('description', 'Te avisamos cuando esté listo.');
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    push = new FakePushNotifications();
  });

  it('should explain the notices and ask with a button when the browser has not decided', async () => {
    // Act
    const element = await render('default');

    // Assert
    expect(element.querySelector('[data-testid="push-prompt"]')?.textContent).toContain(
      'Te avisamos cuando esté listo.',
    );
    expect(push.enable).not.toHaveBeenCalled();
  });

  it('should turn the notices on for the target and confirm it when the waiter taps the button', async () => {
    // Arrange
    const element = await render('default');

    // Act
    element.querySelector<HTMLButtonElement>('[data-testid="enable-push"]')?.click();
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();

    // Assert
    expect(push.enable).toHaveBeenCalledWith(TARGET);
    expect(element.querySelector('[data-testid="push-enabled"]')).not.toBeNull();
    expect(element.querySelector('[data-testid="push-prompt"]')).toBeNull();
  });

  it('should say so when the notices could not be turned on', async () => {
    // Arrange
    push.enableResult = false;
    const element = await render('default');

    // Act
    element.querySelector<HTMLButtonElement>('[data-testid="enable-push"]')?.click();
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();

    // Assert
    expect(element.querySelector('[data-testid="push-failed"]')).not.toBeNull();
  });

  it('should show nothing where notices are not possible', async () => {
    // Act
    const element = await render('unsupported');

    // Assert
    expect(element.textContent?.trim()).toBe('');
  });

  it('should explain that the browser blocked them', async () => {
    // Act
    const element = await render('denied');

    // Assert
    expect(element.querySelector('[data-testid="push-denied"]')).not.toBeNull();
  });

  it('should quietly save the browser again when permission was already granted', async () => {
    // Act
    const element = await render('granted');

    // Assert
    expect(push.refresh).toHaveBeenCalledWith(TARGET);
    expect(element.textContent?.trim()).toBe('');
  });
});
