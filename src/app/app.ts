import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

import { ROLE_LABELS } from '@shared/auth/auth-messages';
import { EmployeeRole } from '@shared/auth/auth.models';
import { AuthService } from '@shared/auth/auth.service';
import { SessionService } from '@shared/auth/session.service';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { BrandMarkComponent } from '@shared/components/brand-mark/brand-mark.component';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { ConnectionPillComponent } from '@shared/components/connection-pill/connection-pill.component';
import { MainNavComponent } from '@shared/components/main-nav/main-nav.component';
import { ThemeToggleComponent } from '@shared/components/theme-toggle/theme-toggle.component';
import { ToastHostComponent } from '@shared/components/toast-host/toast-host.component';
import { breadcrumbsFor } from '@shared/navigation/breadcrumbs';
import type { NavigationLink } from '@shared/navigation/navigation-link';

export const NAVIGATION_BY_ROLE: Readonly<Record<EmployeeRole, readonly NavigationLink[]>> = {
  [EmployeeRole.Waiter]: [
    { path: '/orders', label: 'Pedidos', icon: 'list' },
    { path: '/catalog', label: 'Menú', icon: 'table' },
  ],
  [EmployeeRole.Kitchen]: [{ path: '/kitchen', label: 'Cocina', icon: 'kitchen' }],
  [EmployeeRole.Manager]: [
    { path: '/manager', label: 'Gerencia', icon: 'bar-chart' },
    { path: '/kitchen', label: 'Cocina', icon: 'kitchen' },
    { path: '/catalog', label: 'Menú', icon: 'table' },
  ],
};

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    AvatarComponent,
    BrandMarkComponent,
    BreadcrumbComponent,
    ConnectionPillComponent,
    MainNavComponent,
    ThemeToggleComponent,
    ToastHostComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly employee = inject(SessionService).employee;
  protected readonly navigationLinks = computed(() => {
    const employee = this.employee();
    return employee === null ? [] : NAVIGATION_BY_ROLE[employee.role];
  });
  protected readonly roleLabel = computed(() => {
    const employee = this.employee();
    return employee === null ? '' : ROLE_LABELS[employee.role];
  });
  protected readonly breadcrumbs = computed(() => breadcrumbsFor(this.url()));
  protected readonly screenTitle = computed(() => this.breadcrumbs().at(-1)?.label ?? '');

  /** The kitchen board is a full-screen display: it has its own header and no navigation. */
  protected readonly isBare = computed(() => this.employee()?.role === EmployeeRole.Kitchen);

  protected logout(): void {
    this.auth.logout();
  }
}
