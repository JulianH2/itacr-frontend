import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { Subject, takeUntil, timer } from 'rxjs';

import { ROLE_HOME_LABELS } from '@shared/auth/auth-messages';
import { AuthService } from '@shared/auth/auth.service';
import { SessionService } from '@shared/auth/session.service';

export const REDIRECT_DELAY_MS = 1500;

@Component({
  selector: 'app-redirect-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule],
  template: `
    <section class="redirect" aria-live="polite">
      <span class="redirect__spinner" aria-hidden="true"></span>
      <h1 class="redirect__title">Redirigiendo…</h1>
      <p data-testid="redirect-target">Te llevamos a tu {{ panelLabel() }}.</p>
      <button mat-button type="button" data-testid="redirect-cancel" (click)="cancel()">
        Cancelar
      </button>
    </section>
  `,
  styles: `
    .redirect {
      display: grid;
      gap: var(--space-1);
      justify-items: center;
      min-height: 60dvh;
      align-content: center;
      padding: var(--space-5) var(--space-2);
      text-align: center;
    }

    .redirect__spinner {
      animation: redirect-spin 900ms linear infinite;
      border: 5px solid var(--color-secondary-tint);
      border-radius: var(--radius-pill);
      border-top-color: var(--color-primary);
      height: var(--space-8);
      margin-bottom: var(--space-2);
      width: var(--space-8);
    }

    .redirect__title {
      font: var(--mat-sys-title-large);
      font-family: var(--font-family);
      margin: 0;
    }

    p {
      color: var(--color-text-secondary);
      font: var(--mat-sys-body-large);
      font-family: var(--font-family);
      margin: 0 0 var(--space-1);
    }

    @keyframes redirect-spin {
      to {
        transform: rotate(360deg);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .redirect__spinner {
        animation-duration: 3s;
      }
    }
  `,
})
export class RedirectPageComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly cancelled = new Subject<void>();

  readonly returnUrl = input<string>();

  protected readonly panelLabel = computed(() => {
    const employee = this.session.employee();
    return employee === null ? '' : ROLE_HOME_LABELS[employee.role];
  });

  constructor() {
    timer(REDIRECT_DELAY_MS)
      .pipe(takeUntil(this.cancelled), takeUntilDestroyed())
      .subscribe(() => this.goToPanel());
  }

  ngOnInit(): void {
    if (!this.session.isActive()) {
      this.cancelled.next();
      void this.router.navigateByUrl('/login');
    }
  }

  protected cancel(): void {
    this.cancelled.next();
    this.auth.logout();
  }

  private goToPanel(): void {
    const employee = this.session.employee();
    if (employee === null) {
      return;
    }
    void this.router.navigateByUrl(this.auth.homeUrl(employee, this.returnUrl()));
  }
}
