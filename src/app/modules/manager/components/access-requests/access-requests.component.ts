import { ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { PIN_LENGTH } from '@shared/auth/auth.models';
import { ROLE_LABELS } from '@shared/auth/auth-messages';

import { ACCESS_REQUEST_MESSAGES } from '../../models/access-requests.messages';
import type { PendingAccount, PendingPinReset } from '../../models/manager.models';
import { AccessRequestsStore } from '../../services/access-requests.store';

const FOUR_DIGITS = new RegExp(`^[0-9]{${PIN_LENGTH}}$`);

const REQUESTED_AT = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
});

/**
 * The section of requests of the manager's dashboard (HU_15): the accounts that asked for access, to approve or reject, and the
 * employees who forgot the PIN, to give a temporary one. When nothing is pending it says so (CA4); after every action the list is read
 * again.
 */
@Component({
  selector: 'app-access-requests',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  providers: [AccessRequestsStore],
  template: `
    <section class="requests" aria-labelledby="requests-title">
      <h2 id="requests-title" class="requests__title">Solicitudes</h2>

      @if (store.feedback(); as feedback) {
        <p
          class="requests__feedback"
          [class.requests__feedback--error]="feedback.kind === 'error'"
          [attr.role]="feedback.kind === 'error' ? 'alert' : 'status'"
          data-testid="requests-feedback"
        >
          {{ feedback.message }}
        </p>
      }

      @if (store.loadFailed()) {
        <p
          class="requests__feedback requests__feedback--error"
          role="alert"
          data-testid="requests-error"
        >
          {{ messages.loadFailed }}
          <button type="button" mat-button (click)="store.refresh()">Reintentar</button>
        </p>
      }

      @if (store.requests(); as requests) {
        @if (store.isEmpty()) {
          <p class="requests__empty" data-testid="requests-empty">{{ messages.empty }}</p>
        } @else {
          @if (requests.accounts.length > 0) {
            <h3 class="requests__subtitle">Cuentas nuevas</h3>
            <ul class="requests__list" data-testid="account-requests">
              @for (account of requests.accounts; track account.id) {
                <li class="requests__item" [attr.data-testid]="'account-' + account.id">
                  <div class="requests__who">
                    <span class="requests__name">{{ account.fullName }}</span>
                    <span class="requests__meta">
                      {{ roleLabel(account.role) }} · Solicitada {{ time(account.requestedAt) }}
                    </span>
                  </div>
                  <div class="requests__actions">
                    <button
                      type="button"
                      mat-flat-button
                      data-testid="approve"
                      [disabled]="store.busyEmployeeId() !== null"
                      (click)="approve(account)"
                    >
                      Aprobar
                    </button>
                    <button
                      type="button"
                      mat-stroked-button
                      data-testid="reject"
                      [disabled]="store.busyEmployeeId() !== null"
                      (click)="askToReject(account)"
                    >
                      Rechazar
                    </button>
                  </div>
                  @if (rejectingId() === account.id) {
                    <div class="requests__confirm" role="alert" data-testid="reject-confirmation">
                      <span>{{ messages.confirmReject(account.fullName) }}</span>
                      <button
                        type="button"
                        mat-flat-button
                        data-testid="confirm-reject"
                        [disabled]="store.busyEmployeeId() !== null"
                        (click)="reject(account)"
                      >
                        Sí, rechazar
                      </button>
                      <button
                        type="button"
                        mat-button
                        data-testid="cancel-reject"
                        (click)="rejectingId.set(null)"
                      >
                        Cancelar
                      </button>
                    </div>
                  }
                </li>
              }
            </ul>
          }

          @if (requests.pinResets.length > 0) {
            <h3 class="requests__subtitle">Restablecer PIN</h3>
            <ul class="requests__list" data-testid="pin-requests">
              @for (reset of requests.pinResets; track reset.employeeId) {
                <li class="requests__item" [attr.data-testid]="'pin-reset-' + reset.employeeId">
                  <div class="requests__who">
                    <span class="requests__name">{{ reset.fullName }}</span>
                    <span class="requests__meta">
                      {{ roleLabel(reset.role) }} · Solicitado {{ time(reset.requestedAt) }}
                    </span>
                  </div>
                  @if (editingId() === reset.employeeId) {
                    <form class="requests__pin" (submit)="assignPin($event, reset)">
                      <mat-form-field subscriptSizing="dynamic">
                        <mat-label>PIN temporal de 4 dígitos</mat-label>
                        <input
                          matInput
                          type="text"
                          inputmode="numeric"
                          autocomplete="off"
                          [maxlength]="pinLength"
                          [formControl]="pin"
                          data-testid="temporary-pin"
                        />
                        @if (pin.touched && pin.invalid) {
                          <mat-error data-testid="error-temporary-pin">
                            {{ messages.pinFourDigits }}
                          </mat-error>
                        }
                      </mat-form-field>
                      <button
                        type="submit"
                        mat-flat-button
                        data-testid="save-pin"
                        [disabled]="store.busyEmployeeId() !== null"
                      >
                        Guardar PIN
                      </button>
                      <button
                        type="button"
                        mat-button
                        data-testid="cancel-pin"
                        (click)="closePinForm()"
                      >
                        Cancelar
                      </button>
                    </form>
                  } @else {
                    <div class="requests__actions">
                      <button
                        type="button"
                        mat-flat-button
                        data-testid="open-pin"
                        [disabled]="store.busyEmployeeId() !== null"
                        (click)="openPinForm(reset)"
                      >
                        Asignar PIN temporal
                      </button>
                    </div>
                  }
                </li>
              }
            </ul>
          }
        }
      } @else if (store.isLoading()) {
        <p class="requests__state" role="status" data-testid="requests-loading">
          Cargando solicitudes…
        </p>
      }
    </section>
  `,
  styles: `
    .requests {
      background: var(--color-surface);
      border: 1px solid var(--color-card-border);
      border-radius: var(--radius-card);
      display: grid;
      gap: var(--space-2);
      padding: var(--space-2);
    }

    .requests__title {
      font: var(--mat-sys-title-medium);
      font-family: var(--font-family);
      margin: 0;
    }

    .requests__subtitle {
      color: var(--color-text-secondary);
      font: var(--mat-sys-label-large);
      font-family: var(--font-family);
      margin: 0;
    }

    .requests__feedback {
      background: var(--color-bg-alt);
      border-radius: var(--radius-control);
      font: var(--mat-sys-body-medium);
      font-family: var(--font-family);
      margin: 0;
      padding: var(--space-1) var(--space-2);
    }

    .requests__feedback--error {
      background: var(--color-error-tint);
      color: var(--color-error);
    }

    .requests__empty,
    .requests__state {
      color: var(--color-text-secondary);
      font: var(--mat-sys-body-large);
      font-family: var(--font-family);
      margin: 0;
    }

    .requests__list {
      display: grid;
      gap: var(--space-1);
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .requests__item {
      align-items: center;
      border-bottom: 1px solid var(--color-divider);
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1) var(--space-2);
      justify-content: space-between;
      padding-bottom: var(--space-1);
    }

    .requests__who {
      display: grid;
    }

    .requests__name {
      font: var(--mat-sys-title-small);
      font-family: var(--font-family);
    }

    .requests__meta {
      color: var(--color-text-secondary);
      font: var(--mat-sys-body-medium);
      font-family: var(--font-family);
    }

    .requests__confirm {
      align-items: center;
      display: flex;
      flex-basis: 100%;
      flex-wrap: wrap;
      gap: var(--space-1);
    }

    .requests__actions,
    .requests__pin {
      align-items: center;
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1);
    }
  `,
})
export class AccessRequestsComponent {
  protected readonly store = inject(AccessRequestsStore);

  protected readonly messages = ACCESS_REQUEST_MESSAGES;
  protected readonly pinLength = PIN_LENGTH;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly editingId = signal<string | null>(null);
  protected readonly rejectingId = signal<string | null>(null);
  protected readonly pin = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(FOUR_DIGITS)],
  });

  protected roleLabel(role: PendingAccount['role']): string {
    return ROLE_LABELS[role];
  }

  protected time(instant: string): string {
    return REQUESTED_AT.format(new Date(instant));
  }

  protected approve(account: PendingAccount): void {
    this.rejectingId.set(null);
    void this.store.approve(account.id, account.fullName);
  }

  protected askToReject(account: PendingAccount): void {
    this.editingId.set(null);
    this.rejectingId.set(account.id);
    setTimeout(() =>
      this.host.nativeElement.querySelector<HTMLElement>('[data-testid="confirm-reject"]')?.focus(),
    );
  }

  protected reject(account: PendingAccount): void {
    this.rejectingId.set(null);
    void this.store.reject(account.id, account.fullName);
  }

  protected openPinForm(reset: PendingPinReset): void {
    this.pin.reset('');
    this.rejectingId.set(null);
    this.editingId.set(reset.employeeId);
  }

  protected closePinForm(): void {
    this.editingId.set(null);
  }

  protected async assignPin(event: Event, reset: PendingPinReset): Promise<void> {
    event.preventDefault();
    this.pin.markAsTouched();
    if (this.pin.invalid) {
      return;
    }
    if (await this.store.assignTemporaryPin(reset.employeeId, reset.fullName, this.pin.value)) {
      this.closePinForm();
    }
  }
}
