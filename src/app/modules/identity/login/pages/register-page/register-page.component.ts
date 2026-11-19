import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  type AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  type ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthApiService } from '@shared/auth/auth-api.service';
import { type RegistrationField, toRegistrationFailure } from '@shared/auth/auth-errors';
import { REGISTRATION_MESSAGES, ROLE_LABELS } from '@shared/auth/auth-messages';
import { EmployeeRole, type RequestableRole } from '@shared/auth/auth.models';
import type { SegmentedOption } from '@shared/components/segmented-control/segmented-control.component';
import { SegmentedControlComponent } from '@shared/components/segmented-control/segmented-control.component';

const NAME_MIN = 2;
const NAME_MAX = 120;

const EMAIL_OR_USER = /^\S{3,254}$/;
const FOUR_DIGITS = /^[0-9]{4}$/;
const TEN_DIGITS = /^[0-9]{10}$/;

/** Required, and not only spaces. */
function requiredText(control: AbstractControl<string>): ValidationErrors | null {
  return control.value.trim() === '' ? { required: true } : null;
}

function nameLength(control: AbstractControl<string>): ValidationErrors | null {
  const length = control.value.trim().length;
  return length === 0 || (length >= NAME_MIN && length <= NAME_MAX) ? null : { nameLength: true };
}

function matching(pattern: RegExp, key: string) {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = control.value.trim();
    return value === '' || pattern.test(value) ? null : { [key]: true };
  };
}

/** The privacy notice must be accepted. It has its own key because `Validators.requiredTrue` reports `required`. */
function accepted(control: AbstractControl<boolean>): ValidationErrors | null {
  return control.value ? null : { privacyRequired: true };
}

/** The confirmation of the PIN is the same as the PIN. It is checked again when the PIN changes. */
function sameAsPin(control: AbstractControl<string>): ValidationErrors | null {
  const pin = control.parent?.get('pin')?.value as string | undefined;
  return control.value === '' || control.value === pin ? null : { pinsDoNotMatch: true };
}

const MESSAGES: Readonly<Record<string, string>> = {
  required: REGISTRATION_MESSAGES.required,
  privacyRequired: REGISTRATION_MESSAGES.privacyRequired,
  nameLength: REGISTRATION_MESSAGES.fullNameLength,
  emailOrUser: REGISTRATION_MESSAGES.emailOrUser,
  phoneLength: REGISTRATION_MESSAGES.phoneLength,
  pinFourDigits: REGISTRATION_MESSAGES.pinFourDigits,
  pinsDoNotMatch: REGISTRATION_MESSAGES.pinsDoNotMatch,
};

/**
 * Where a new employee asks for an account (HU_14): name, email or user, phone, role, PIN twice, and the privacy notice. The account
 * waits for the manager, and nobody can sign in with it until then. Each field says what is wrong next to it, with the same texts
 * as the API.
 */
@Component({
  selector: 'app-register-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    RouterLink,
    SegmentedControlComponent,
  ],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss',
})
export class RegisterPageComponent {
  private readonly api = inject(AuthApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form = inject(NonNullableFormBuilder).group({
    fullName: ['', [requiredText, nameLength]],
    email: ['', [requiredText, matching(EMAIL_OR_USER, 'emailOrUser')]],
    phone: ['', [requiredText, matching(TEN_DIGITS, 'phoneLength')]],
    role: ['' as RequestableRole | '', Validators.required],
    pin: ['', [Validators.required, matching(FOUR_DIGITS, 'pinFourDigits')]],
    pinConfirmation: ['', [Validators.required, sameAsPin]],
    acceptedPrivacyNotice: [false, accepted],
  });

  protected readonly roleOptions: readonly SegmentedOption[] = [
    { value: EmployeeRole.Waiter, label: ROLE_LABELS[EmployeeRole.Waiter] },
    { value: EmployeeRole.Kitchen, label: ROLE_LABELS[EmployeeRole.Kitchen] },
  ];
  protected readonly isSubmitting = signal(false);
  protected readonly generalError = signal<string | null>(null);
  protected readonly sent = signal(false);
  protected readonly sentMessage = REGISTRATION_MESSAGES.sent;

  constructor() {
    // The confirmation depends on the PIN: it is checked again when the PIN changes.
    this.form.controls.pin.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.form.controls.pinConfirmation.updateValueAndValidity());
  }

  /** The message of the field, once the user touched it or tried to send the form. */
  protected errorOf(field: RegistrationField): string | null {
    const control = this.form.controls[field];
    if (!control.touched || control.errors === null) {
      return null;
    }
    const server = control.errors['server'] as string | undefined;
    if (server !== undefined) {
      return server;
    }
    const key = Object.keys(control.errors)[0];
    return MESSAGES[key] ?? null;
  }

  protected chooseRole(role: string): void {
    this.form.controls.role.setValue(role as RequestableRole);
    this.form.controls.role.markAsTouched();
  }

  protected submit(): void {
    if (this.isSubmitting()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.generalError.set(null);
    this.isSubmitting.set(true);
    this.api
      .registerEmployee({
        fullName: value.fullName.trim(),
        email: value.email.trim(),
        phone: value.phone.trim(),
        role: value.role as RequestableRole,
        pin: value.pin,
        pinConfirmation: value.pinConfirmation,
        acceptedPrivacyNotice: value.acceptedPrivacyNotice,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: () => this.sent.set(true),
        error: (error: unknown) => this.showFailure(error),
      });
  }

  /** What the API rejected goes next to its field; anything else goes above the button. */
  private showFailure(error: unknown): void {
    const failure = toRegistrationFailure(error);
    for (const [field, message] of Object.entries(failure.fields)) {
      const control = this.form.controls[field as RegistrationField];
      control.setErrors({ server: message });
      control.markAsTouched();
    }
    this.generalError.set(failure.general);
  }
}
