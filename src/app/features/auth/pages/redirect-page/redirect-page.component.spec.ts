import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import type { MockInstance } from 'vitest';

import { EmployeeRole } from '@shared/auth/auth.models';
import { SESSION_STORAGE, SessionService } from '@shared/auth/session.service';
import { loginResponse } from '@shared/testing/auth-fixtures';
import { MemoryStorage } from '@shared/testing/memory-storage';

import { REDIRECT_DELAY_MS, RedirectPageComponent } from './redirect-page.component';

describe('RedirectPageComponent', () => {
  let navigateByUrl: MockInstance<Router['navigateByUrl']>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    TestBed.configureTestingModule({
      imports: [RedirectPageComponent],
      providers: [provideRouter([]), { provide: SESSION_STORAGE, useValue: new MemoryStorage() }],
    });
    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should show "Redirigiendo…" and then open the waiter dashboard when a waiter logs in (CA1)', async () => {
    // Arrange
    TestBed.inject(SessionService).start(loginResponse(EmployeeRole.Waiter));
    const fixture = TestBed.createComponent(RedirectPageComponent);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    // Act
    vi.advanceTimersByTime(REDIRECT_DELAY_MS);

    // Assert
    expect(element.querySelector('h1')?.textContent).toBe('Redirigiendo…');
    expect(element.querySelector('[data-testid="redirect-target"]')?.textContent).toContain(
      'Dashboard del Mesero',
    );
    expect(navigateByUrl).toHaveBeenCalledWith('/orders');
  });

  it('should open the kitchen view when the kitchen staff logs in', async () => {
    // Arrange
    TestBed.inject(SessionService).start(loginResponse(EmployeeRole.Kitchen));
    const fixture = TestBed.createComponent(RedirectPageComponent);
    await fixture.whenStable();

    // Act
    vi.advanceTimersByTime(REDIRECT_DELAY_MS);

    // Assert
    expect(navigateByUrl).toHaveBeenCalledWith('/kitchen');
  });

  it('should log out and not open the panel when the employee cancels the redirect', async () => {
    // Arrange
    const session = TestBed.inject(SessionService);
    session.start(loginResponse(EmployeeRole.Manager));
    const fixture = TestBed.createComponent(RedirectPageComponent);
    await fixture.whenStable();

    // Act
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-testid="redirect-cancel"]')
      ?.click();
    vi.advanceTimersByTime(REDIRECT_DELAY_MS);

    // Assert
    expect(session.session()).toBeNull();
    expect(navigateByUrl).toHaveBeenCalledWith('/login');
    expect(navigateByUrl).not.toHaveBeenCalledWith('/manager');
  });

  it('should go back to login when there is no active session', async () => {
    // Arrange
    const fixture = TestBed.createComponent(RedirectPageComponent);

    // Act
    await fixture.whenStable();
    vi.advanceTimersByTime(REDIRECT_DELAY_MS);

    // Assert
    expect(navigateByUrl).toHaveBeenCalledTimes(1);
    expect(navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
