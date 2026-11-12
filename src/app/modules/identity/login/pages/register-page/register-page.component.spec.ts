import { HttpErrorResponse } from '@angular/common/http';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { type Observable, of, throwError } from 'rxjs';

import { AuthApiService } from '@shared/auth/auth-api.service';
import { AUTH_PROBLEM_TYPES } from '@shared/auth/auth-messages';
import type { RegisterEmployeeRequest } from '@shared/auth/auth.models';

import { RegisterPageComponent } from './register-page.component';

const REQUIRED = 'Este campo es obligatorio.';

describe('RegisterPageComponent', () => {
  let registerEmployee: ReturnType<
    typeof vi.fn<(request: RegisterEmployeeRequest) => Observable<void>>
  >;
  let fixture: ComponentFixture<RegisterPageComponent>;
  let page: HTMLElement;

  async function render(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [RegisterPageComponent],
      providers: [provideRouter([]), { provide: AuthApiService, useValue: { registerEmployee } }],
    }).compileComponents();
    fixture = TestBed.createComponent(RegisterPageComponent);
    await settle();
    page = fixture.nativeElement as HTMLElement;
  }

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function byTestId(testId: string): HTMLElement | null {
    return page.querySelector(`[data-testid="${testId}"]`);
  }

  async function type(field: string, value: string): Promise<void> {
    const input = byTestId(`register-${field}`) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    await settle();
  }

  async function chooseRole(role: string): Promise<void> {
    byTestId(`register-role-${role}`)?.click();
    await settle();
  }

  async function acceptPrivacy(): Promise<void> {
    (byTestId('register-privacy')?.querySelector('input') as HTMLInputElement).click();
    await settle();
  }

  async function fillCorrectly(): Promise<void> {
    await type('fullName', '  Ana López  ');
    await type('email', 'ana.lopez');
    await type('phone', '7711234567');
    await chooseRole('Waiter');
    await type('pin', '4821');
    await type('pinConfirmation', '4821');
    await acceptPrivacy();
  }

  async function submit(): Promise<void> {
    byTestId('register-submit')?.click();
    await settle();
  }

  function errorOf(field: string): string | undefined {
    return byTestId(`error-${field}`)?.textContent?.trim();
  }

  beforeEach(() => {
    registerEmployee = vi.fn(() => of(undefined));
  });

  it('should send the request and show the confirmation when every field is correct (CA1)', async () => {
    // Arrange
    await render();
    await fillCorrectly();

    // Act
    await submit();

    // Assert
    expect(registerEmployee).toHaveBeenCalledWith({
      fullName: 'Ana López',
      email: 'ana.lopez',
      phone: '7711234567',
      role: 'Waiter',
      pin: '4821',
      pinConfirmation: '4821',
      acceptedPrivacyNotice: true,
    });
    expect(byTestId('register-sent')?.textContent).toContain(
      'Solicitud enviada. Tu acceso quedará pendiente hasta que el gerente lo apruebe.',
    );
    expect(byTestId('register-submit')).toBeNull();
  });

  it('should say a field is required next to it and not send anything when the form is empty (CA2)', async () => {
    // Arrange
    await render();

    // Act
    await submit();

    // Assert
    for (const field of ['fullName', 'email', 'phone', 'role', 'pin', 'pinConfirmation']) {
      expect(errorOf(field)).toBe(REQUIRED);
    }
    expect(errorOf('acceptedPrivacyNotice')).toBe(
      'Debes aceptar el aviso de privacidad para continuar.',
    );
    expect(registerEmployee).not.toHaveBeenCalled();
  });

  it('should count a name made of spaces as empty (CA2)', async () => {
    // Arrange
    await render();
    await type('fullName', '    ');

    // Act
    await submit();

    // Assert
    expect(errorOf('fullName')).toBe(REQUIRED);
  });

  it('should say the PINs do not match and not send anything when the confirmation is different (CA3)', async () => {
    // Arrange
    await render();
    await fillCorrectly();
    await type('pinConfirmation', '4822');

    // Act
    await submit();

    // Assert
    expect(errorOf('pinConfirmation')).toBe('Los PIN no coinciden.');
    expect(registerEmployee).not.toHaveBeenCalled();
  });

  it('should check the confirmation again when the PIN changes after it was typed', async () => {
    // Arrange
    await render();
    await type('pin', '4821');
    await type('pinConfirmation', '4821');

    // Act
    await type('pin', '1111');

    // Assert
    expect(errorOf('pinConfirmation')).toBe('Los PIN no coinciden.');
  });

  it('should not send the request when the privacy notice is not accepted', async () => {
    // Arrange
    await render();
    await fillCorrectly();
    await acceptPrivacy();

    // Act
    await submit();

    // Assert
    expect(errorOf('acceptedPrivacyNotice')).toBe(
      'Debes aceptar el aviso de privacidad para continuar.',
    );
    expect(registerEmployee).not.toHaveBeenCalled();
  });

  it.each([
    ['phone', '77112', 'El teléfono debe tener 10 dígitos.'],
    ['pin', '12', 'El PIN debe tener 4 dígitos.'],
    ['email', 'ana lopez', 'Escribe un correo o un usuario sin espacios, de 3 a 254 caracteres.'],
    ['fullName', 'A', 'El nombre debe tener entre 2 y 120 caracteres.'],
  ])('should explain the %s when it is not valid', async (field, value, message) => {
    // Arrange
    await render();
    await type(field, value);

    // Act
    await submit();

    // Assert
    expect(errorOf(field)).toBe(message);
    expect(registerEmployee).not.toHaveBeenCalled();
  });

  it('should only offer the roles of waiter and kitchen', async () => {
    // Arrange
    await render();

    // Assert
    expect(byTestId('register-role-Waiter')).not.toBeNull();
    expect(byTestId('register-role-Kitchen')).not.toBeNull();
    expect(byTestId('register-role-Manager')).toBeNull();
  });

  it('should show the message of the API next to the email when it is already taken', async () => {
    // Arrange
    registerEmployee.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: {
              type: AUTH_PROBLEM_TYPES.accountAlreadyExists,
              detail: 'Ya existe una cuenta o una solicitud con ese correo o usuario.',
            },
          }),
      ),
    );
    await render();
    await fillCorrectly();

    // Act
    await submit();

    // Assert
    expect(errorOf('email')).toBe('Ya existe una cuenta o una solicitud con ese correo o usuario.');
    expect(byTestId('register-sent')).toBeNull();
  });

  it('should show the messages of the API next to the fields it rejected', async () => {
    // Arrange
    registerEmployee.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { errors: { phone: ['El teléfono debe tener 10 dígitos.'] } },
          }),
      ),
    );
    await render();
    await fillCorrectly();

    // Act
    await submit();

    // Assert
    expect(errorOf('phone')).toBe('El teléfono debe tener 10 dígitos.');
  });

  it.each([
    [429, 'Demasiadas solicitudes desde esta conexión. Inténtalo de nuevo más tarde.'],
    [0, 'No hay conexión con el servidor. Inténtalo de nuevo.'],
    [500, 'Ocurrió un error inesperado. Inténtalo de nuevo.'],
  ])(
    'should show one message above the button when the API answers %s',
    async (status, message) => {
      // Arrange
      registerEmployee.mockReturnValue(throwError(() => new HttpErrorResponse({ status })));
      await render();
      await fillCorrectly();

      // Act
      await submit();

      // Assert
      expect(byTestId('register-error')?.textContent?.trim()).toBe(message);
    },
  );

  it('should keep what the user typed when the request fails', async () => {
    // Arrange
    registerEmployee.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    await render();
    await fillCorrectly();

    // Act
    await submit();

    // Assert
    expect((byTestId('register-email') as HTMLInputElement).value).toBe('ana.lopez');
    expect(byTestId('register-submit')).not.toBeNull();
  });
});
