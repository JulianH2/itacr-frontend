import { HttpStatusCode, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import type { MockInstance } from 'vitest';

import { AUTH_API_URL } from '@shared/auth/auth-api.service';
import { AUTH_MESSAGES, AUTH_PROBLEM_TYPES } from '@shared/auth/auth-messages';
import { EmployeeRole } from '@shared/auth/auth.models';
import { SESSION_STORAGE, SessionService } from '@shared/auth/session.service';
import { loginResponse, WAITER } from '@shared/testing/auth-fixtures';
import { MemoryStorage } from '@shared/testing/memory-storage';

import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  let http: HttpTestingController;
  let navigate: MockInstance<Router['navigate']>;
  let fixture: ComponentFixture<LoginPageComponent>;

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function click(testId: string): void {
    element().querySelector<HTMLButtonElement>(`[data-testid="${testId}"]`)?.click();
    fixture.detectChanges();
  }

  async function goToPinStep(): Promise<void> {
    click(`role-${EmployeeRole.Waiter}`);
    http
      .expectOne(
        (request) =>
          request.url === `${AUTH_API_URL}/employees` &&
          request.params.get('role') === EmployeeRole.Waiter,
      )
      .flush([WAITER]);
    await fixture.whenStable();
    click(`employee-${WAITER.id}`);
  }

  function enterPin(digits: string): void {
    for (const digit of digits) {
      click(`pin-key-${digit}`);
    }
  }

  async function submitPinAndFail(status: HttpStatusCode, type: string): Promise<void> {
    click('pin-submit');
    http
      .expectOne(`${AUTH_API_URL}/login/pin`)
      .flush({ type, status }, { status, statusText: 'Error' });
    await fixture.whenStable();
  }

  function textOf(testId: string): string | undefined {
    return element().querySelector(`[data-testid="${testId}"]`)?.textContent?.trim();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SESSION_STORAGE, useValue: new MemoryStorage() },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(LoginPageComponent);
    await fixture.whenStable();
  });

  afterEach(() => {
    http.verify();
  });

  it('should offer to create an account from the login screen (HU_14)', () => {
    // Act
    fixture.detectChanges();

    // Assert
    const link = element().querySelector<HTMLAnchorElement>('[data-testid="create-account"]');
    expect(link?.getAttribute('href')).toBe('/login/register');
    expect(link?.textContent).toContain('Crear cuenta');
  });

  it('should start the session and go to the redirect screen when an active waiter enters the right PIN (CA1)', async () => {
    // Arrange
    await goToPinStep();
    enterPin('1234');

    // Act
    click('pin-submit');
    const request = http.expectOne(`${AUTH_API_URL}/login/pin`);
    request.flush(loginResponse(EmployeeRole.Waiter));
    await fixture.whenStable();

    // Assert
    expect(request.request.body).toEqual({ employeeId: WAITER.id, pin: '1234' });
    expect(TestBed.inject(SessionService).employee()?.role).toBe(EmployeeRole.Waiter);
    expect(navigate).toHaveBeenCalledWith(['/login/redirect'], { queryParams: {} });
  });

  it('should ask for the 4 digits and not call the API when the PIN has only 3 digits (CA2)', async () => {
    // Arrange
    await goToPinStep();
    enterPin('123');

    // Act
    click('pin-submit');

    // Assert
    http.expectNone(`${AUTH_API_URL}/login/pin`);
    expect(textOf('login-error')).toBe(AUTH_MESSAGES.pinIncomplete);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('should show the invalid PIN message and clear the PIN when the PIN is wrong (CA3)', async () => {
    // Arrange
    await goToPinStep();
    enterPin('9999');

    // Act
    await submitPinAndFail(HttpStatusCode.Unauthorized, AUTH_PROBLEM_TYPES.invalidCredentials);

    // Assert
    expect(textOf('login-error')).toBe(AUTH_MESSAGES.invalidPin);
    expect(element().querySelectorAll('.pin-pad__slot--filled').length).toBe(0);
    expect(TestBed.inject(SessionService).session()).toBeNull();
  });

  it('should deny access with the pending approval message when the account is pending (CA4)', async () => {
    // Arrange
    await goToPinStep();
    enterPin('1234');

    // Act
    await submitPinAndFail(HttpStatusCode.Forbidden, AUTH_PROBLEM_TYPES.accountPendingApproval);

    // Assert
    expect(textOf('login-error')).toBe(AUTH_MESSAGES.pendingApproval);
    expect(TestBed.inject(SessionService).session()).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('should send the reset request to the manager and confirm it when the PIN is forgotten (CA5)', async () => {
    // Arrange
    await goToPinStep();

    // Act
    click('pin-reset');
    const request = http.expectOne(`${AUTH_API_URL}/pin-reset-requests`);
    request.flush(null, { status: HttpStatusCode.Accepted, statusText: 'Accepted' });
    await fixture.whenStable();

    // Assert
    expect(request.request.body).toEqual({ employeeId: WAITER.id });
    expect(textOf('login-info')).toBe(AUTH_MESSAGES.pinResetSent);
  });

  it('should show the lockout message when the PIN login is locked after failed attempts', async () => {
    // Arrange
    await goToPinStep();
    enterPin('1234');

    // Act
    await submitPinAndFail(HttpStatusCode.Locked, AUTH_PROBLEM_TYPES.accountLocked);

    // Assert
    expect(textOf('login-error')).toBe(AUTH_MESSAGES.locked);
  });

  function buttonWithText(text: string): HTMLButtonElement | undefined {
    return Array.from(element().querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.trim() === text,
    );
  }

  /** The handlers and values the template only reaches in another step. */
  function page(): {
    roleLabel(): string;
    pickRole(value: string): void;
    changeEmployee(): void;
    submitPin(): void;
    requestPinReset(): void;
    step(): string;
  } {
    return fixture.componentInstance as unknown as ReturnType<typeof page>;
  }

  it('should show the error when the staff of the role cannot be loaded', async () => {
    // Act
    click(`role-${EmployeeRole.Waiter}`);
    http
      .expectOne((request) => request.url === `${AUTH_API_URL}/employees`)
      .flush(null, { status: 500, statusText: 'Error' });
    await fixture.whenStable();

    // Assert
    expect(textOf('login-error')).toBe(AUTH_MESSAGES.unexpected);
  });

  it('should go back to the roles when the employee changes the role', async () => {
    // Arrange
    click(`role-${EmployeeRole.Waiter}`);
    http.expectOne((request) => request.url === `${AUTH_API_URL}/employees`).flush([WAITER]);
    await fixture.whenStable();

    // Act
    buttonWithText('Cambiar rol')?.click();
    fixture.detectChanges();

    // Assert
    expect(page().step()).toBe('role');
    expect(page().roleLabel()).toBe('');
  });

  it('should go back to the staff list, without loading it again, when the employee is not the one chosen', async () => {
    // Arrange
    await goToPinStep();

    // Act
    buttonWithText('No soy yo')?.click();
    fixture.detectChanges();

    // Assert
    expect(page().step()).toBe('employee');
    expect(element().querySelector(`[data-testid="employee-${WAITER.id}"]`)).not.toBeNull();
  });

  it('should send the PIN once when it is submitted twice', async () => {
    // Arrange
    await goToPinStep();
    enterPin('1234');

    // Act
    click('pin-submit');
    page().submitPin();

    // Assert
    http.expectOne(`${AUTH_API_URL}/login/pin`).flush(loginResponse(EmployeeRole.Waiter));
    await fixture.whenStable();
  });

  it('should keep the page where it should go next when it was asked for', async () => {
    // Arrange
    fixture.componentRef.setInput('returnUrl', '/orders/catalog');
    await goToPinStep();
    enterPin('1234');

    // Act
    click('pin-submit');
    http.expectOne(`${AUTH_API_URL}/login/pin`).flush(loginResponse(EmployeeRole.Waiter));
    await fixture.whenStable();

    // Assert
    expect(navigate).toHaveBeenCalledWith(['/login/redirect'], {
      queryParams: { returnUrl: '/orders/catalog' },
    });
  });

  it('should show the error when the PIN reset cannot be sent', async () => {
    // Arrange
    await goToPinStep();

    // Act
    click('pin-reset');
    http
      .expectOne(`${AUTH_API_URL}/pin-reset-requests`)
      .flush(null, { status: 0, statusText: 'Unknown Error' });
    await fixture.whenStable();

    // Assert
    expect(textOf('login-error')).toBe(AUTH_MESSAGES.network);
  });

  it('should ignore what has no meaning before a role and an employee are chosen', () => {
    // Act
    page().pickRole('Chef');
    page().changeEmployee();
    page().submitPin();
    page().requestPinReset();

    // Assert
    expect(page().step()).toBe('role');
    http.expectNone(() => true);
  });
});

describe('LoginPageComponent when the session expired', () => {
  it('should ask the same employee for the PIN, and load the staff when it is someone else', async () => {
    // Arrange
    const storage = new MemoryStorage();
    storage.setItem(
      'itacr.last-employee',
      JSON.stringify({ id: WAITER.id, displayName: WAITER.displayName, role: EmployeeRole.Waiter }),
    );
    TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SESSION_STORAGE, useValue: storage },
      ],
    });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(LoginPageComponent);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="selected-employee"]')?.textContent).toContain(
      WAITER.displayName,
    );

    // Act
    Array.from(element.querySelectorAll<HTMLButtonElement>('button'))
      .find((button) => button.textContent?.trim() === 'No soy yo')
      ?.click();

    // Assert
    http
      .expectOne(
        (request) =>
          request.url === `${AUTH_API_URL}/employees` &&
          request.params.get('role') === EmployeeRole.Waiter,
      )
      .flush([WAITER]);
    http.verify();
  });
});
