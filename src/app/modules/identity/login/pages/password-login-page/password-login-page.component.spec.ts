import { HttpStatusCode, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import type { MockInstance } from 'vitest';

import { AUTH_API_URL } from '@shared/auth/auth-api.service';
import { AUTH_MESSAGES, AUTH_PROBLEM_TYPES } from '@shared/auth/auth-messages';
import { EmployeeRole } from '@shared/auth/auth.models';
import { SESSION_STORAGE, SessionService } from '@shared/auth/session.service';
import { loginResponse } from '@shared/testing/auth-fixtures';
import { MemoryStorage } from '@shared/testing/memory-storage';

import { PasswordLoginPageComponent } from './password-login-page.component';

describe('PasswordLoginPageComponent', () => {
  let http: HttpTestingController;
  let navigate: MockInstance<Router['navigate']>;
  let fixture: ComponentFixture<PasswordLoginPageComponent>;

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function textOf(testId: string): string | undefined {
    return element().querySelector(`[data-testid="${testId}"]`)?.textContent?.trim();
  }

  function field(control: string): HTMLInputElement | null {
    return element().querySelector<HTMLInputElement>(`input[formcontrolname="${control}"]`);
  }

  function type(control: string, value: string): void {
    const input = field(control);
    input!.value = value;
    input!.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function submit(): void {
    element().querySelector<HTMLButtonElement>('[data-testid="password-submit"]')?.click();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [PasswordLoginPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SESSION_STORAGE, useValue: new MemoryStorage() },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(PasswordLoginPageComponent);
    await fixture.whenStable();
  });

  afterEach(() => {
    http.verify();
  });

  it('should not call the API when the form is empty', () => {
    // Act
    submit();

    // Assert
    http.expectNone(`${AUTH_API_URL}/login/password`);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('should not call the API when the email is not a valid one', () => {
    // Arrange
    type('email', 'not-an-email');
    type('password', 'Itacr2026!');

    // Act
    submit();

    // Assert
    http.expectNone(`${AUTH_API_URL}/login/password`);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('should start the session and go to the redirect screen when the credentials are right', async () => {
    // Arrange
    type('email', 'mesero@itacr.test');
    type('password', 'Itacr2026!');

    // Act
    submit();
    const request = http.expectOne(`${AUTH_API_URL}/login/password`);
    request.flush(loginResponse(EmployeeRole.Waiter));
    await fixture.whenStable();

    // Assert
    expect(request.request.body).toEqual({ email: 'mesero@itacr.test', password: 'Itacr2026!' });
    expect(TestBed.inject(SessionService).employee()?.role).toBe(EmployeeRole.Waiter);
    expect(navigate).toHaveBeenCalledWith(['/login/redirect'], { queryParams: {} });
  });

  it('should carry the page the employee wanted to the redirect screen', async () => {
    // Arrange
    fixture.componentRef.setInput('returnUrl', '/orders');
    type('email', 'mesero@itacr.test');
    type('password', 'Itacr2026!');

    // Act
    submit();
    http.expectOne(`${AUTH_API_URL}/login/password`).flush(loginResponse(EmployeeRole.Waiter));
    await fixture.whenStable();

    // Assert
    expect(navigate).toHaveBeenCalledWith(['/login/redirect'], {
      queryParams: { returnUrl: '/orders' },
    });
  });

  it('should show the invalid credentials message and clear the password when the password is wrong', async () => {
    // Arrange
    type('email', 'mesero@itacr.test');
    type('password', 'wrong-password');

    // Act
    submit();
    http
      .expectOne(`${AUTH_API_URL}/login/password`)
      .flush(
        { type: AUTH_PROBLEM_TYPES.invalidCredentials, status: HttpStatusCode.Unauthorized },
        { status: HttpStatusCode.Unauthorized, statusText: 'Error' },
      );
    await fixture.whenStable();

    // Assert
    expect(textOf('login-error')).toBe(AUTH_MESSAGES.invalidPassword);
    expect(field('password')?.value).toBe('');
    expect(TestBed.inject(SessionService).session()).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('should show the locked message when the account is locked', async () => {
    // Arrange
    type('email', 'mesero@itacr.test');
    type('password', 'Itacr2026!');

    // Act
    submit();
    http
      .expectOne(`${AUTH_API_URL}/login/password`)
      .flush(
        { type: AUTH_PROBLEM_TYPES.accountLocked, status: HttpStatusCode.Locked },
        { status: HttpStatusCode.Locked, statusText: 'Error' },
      );
    await fixture.whenStable();

    // Assert
    expect(textOf('login-error')).toBe(AUTH_MESSAGES.locked);
  });
});
