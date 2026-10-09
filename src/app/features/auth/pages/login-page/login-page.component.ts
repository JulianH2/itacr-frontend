import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthApiService } from '@shared/auth/auth-api.service';
import { toAuthErrorMessage } from '@shared/auth/auth-errors';
import { AUTH_MESSAGES, ROLE_LABELS } from '@shared/auth/auth-messages';
import { EmployeeOption, EmployeeRole, PIN_LENGTH } from '@shared/auth/auth.models';
import { AuthService, SESSION_EXPIRED_REASON } from '@shared/auth/auth.service';
import { SessionService } from '@shared/auth/session.service';

import { PinPadComponent } from '../../components/pin-pad/pin-pad.component';

type LoginStep = 'role' | 'employee' | 'pin';

@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatProgressSpinnerModule, RouterLink, PinPadComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  private readonly authApi = inject(AuthApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly reason = input<string>();
  readonly returnUrl = input<string>();

  protected readonly roles = Object.values(EmployeeRole).map((role) => ({
    role,
    label: ROLE_LABELS[role],
  }));
  protected readonly selectedRole = signal<EmployeeRole | null>(null);
  protected readonly employees = signal<readonly EmployeeOption[]>([]);
  protected readonly isLoadingEmployees = signal(false);
  protected readonly selectedEmployee = signal<EmployeeOption | null>(null);
  protected readonly pin = signal('');
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly infoMessage = signal<string | null>(null);

  protected readonly step = computed<LoginStep>(() => {
    if (this.selectedRole() === null) {
      return 'role';
    }
    return this.selectedEmployee() === null ? 'employee' : 'pin';
  });
  protected readonly roleLabel = computed(() => {
    const role = this.selectedRole();
    return role === null ? '' : ROLE_LABELS[role];
  });
  protected readonly isSessionExpired = computed(() => this.reason() === SESSION_EXPIRED_REASON);
  protected readonly messages = AUTH_MESSAGES;

  constructor() {
    const lastEmployee = inject(SessionService).lastEmployee();
    if (lastEmployee !== null) {
      this.selectedRole.set(lastEmployee.role);
      this.selectedEmployee.set({ id: lastEmployee.id, displayName: lastEmployee.displayName });
    }
  }

  protected selectRole(role: EmployeeRole): void {
    this.selectedRole.set(role);
    this.selectedEmployee.set(null);
    this.employees.set([]);
    this.resetPinStep();
    this.isLoadingEmployees.set(true);
    this.authApi
      .getEmployees(role)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoadingEmployees.set(false)),
      )
      .subscribe({
        next: (employees) => this.employees.set(employees),
        error: (error: unknown) => this.errorMessage.set(toAuthErrorMessage(error, 'pin')),
      });
  }

  protected selectEmployee(employee: EmployeeOption): void {
    this.selectedEmployee.set(employee);
    this.resetPinStep();
  }

  protected changeRole(): void {
    this.selectedRole.set(null);
    this.selectedEmployee.set(null);
    this.resetPinStep();
  }

  protected changeEmployee(): void {
    const role = this.selectedRole();
    if (role === null) {
      return;
    }
    if (this.employees().length === 0) {
      this.selectRole(role);
      return;
    }
    this.selectedEmployee.set(null);
    this.resetPinStep();
  }

  protected submitPin(): void {
    const employee = this.selectedEmployee();
    if (employee === null || this.isSubmitting()) {
      return;
    }
    this.infoMessage.set(null);
    if (this.pin().length !== PIN_LENGTH) {
      this.errorMessage.set(AUTH_MESSAGES.pinIncomplete);
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);
    this.auth
      .loginWithPin(employee.id, this.pin())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: () => this.goToRedirect(),
        error: (error: unknown) => {
          this.errorMessage.set(toAuthErrorMessage(error, 'pin'));
          this.pin.set('');
        },
      });
  }

  protected requestPinReset(): void {
    const employee = this.selectedEmployee();
    if (employee === null) {
      return;
    }
    this.errorMessage.set(null);
    this.infoMessage.set(null);
    this.authApi
      .requestPinReset({ employeeId: employee.id })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.infoMessage.set(AUTH_MESSAGES.pinResetSent),
        error: (error: unknown) => this.errorMessage.set(toAuthErrorMessage(error, 'pin')),
      });
  }

  private resetPinStep(): void {
    this.pin.set('');
    this.errorMessage.set(null);
    this.infoMessage.set(null);
  }

  private goToRedirect(): void {
    const returnUrl = this.returnUrl();
    void this.router.navigate(['/login/redirect'], {
      queryParams: returnUrl === undefined ? {} : { returnUrl },
    });
  }
}
