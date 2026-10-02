import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { Subject, takeUntil, timer } from 'rxjs';

import { ROLE_HOME_LABELS } from '@core/auth/auth-messages';
import { AuthService } from '@core/auth/auth.service';
import { SessionService } from '@core/auth/session.service';

export const REDIRECT_DELAY_MS = 1500;

@Component({
  selector: 'app-redirect-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatProgressSpinnerModule],
  template: `
    <section class="redirect" aria-live="polite">
      <mat-spinner diameter="48" aria-hidden="true" />
      <h1 class="redirect__title">Redirigiendo…</h1>
      <p data-testid="redirect-target">Te llevamos a tu {{ panelLabel() }}.</p>
      <button mat-stroked-button type="button" data-testid="redirect-cancel" (click)="cancel()">
        Cancelar
      </button>
    </section>
  `,
  styles: `
    .redirect {
      display: grid;
      gap: 16px;
      justify-items: center;
      padding: 48px 16px;
      text-align: center;
    }

    .redirect__title {
      font: var(--mat-sys-headline-medium);
      margin: 0;
    }

    button {
      min-height: 44px;
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
