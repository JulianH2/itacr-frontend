import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal } from '@angular/core';
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
import { OfflineDialogComponent } from '@shared/components/offline-dialog/offline-dialog.component';
import { ThemeToggleComponent } from '@shared/components/theme-toggle/theme-toggle.component';
import { ToastHostComponent } from '@shared/components/toast-host/toast-host.component';
import { breadcrumbsFor } from '@shared/navigation/breadcrumbs';
import type { NavigationLink } from '@shared/navigation/navigation-link';
import { ConnectionStatusService } from '@shared/services/connection-status.service';

import { OfflineOrdersService } from './modules/orders/take-order/services/offline-orders.service';

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
    OfflineDialogComponent,
    ThemeToggleComponent,
    ToastHostComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly connection = inject(ConnectionStatusService);
  private readonly offlineOrders = inject(OfflineOrdersService);
  private readonly window = inject(DOCUMENT).defaultView;

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

  /**
   * Opens when the connection drops while someone is signed in and closes when it comes back (HU_07 CA4). Dismissing
   * it keeps it closed until the next drop.
   */
  protected readonly isOfflineNoticeOpen = linkedSignal(
    () => !this.connection.online() && this.employee() !== null,
  );

  /** The kitchen board is a full-screen display: it has its own header and no navigation. */
  protected readonly isBare = computed(() => this.employee()?.role === EmployeeRole.Kitchen);

  /** Orders still on the device are kept for this waiter; they go out the next time they sign in here. */
  protected logout(): void {
    const unsent = this.offlineOrders.orders().length;
    if (unsent > 0 && this.window?.confirm(unsentOrdersWarning(unsent)) === false) {
      return;
    }
    this.auth.logout();
  }
}

function unsentOrdersWarning(count: number): string {
  const orders = count === 1 ? '1 pedido sin enviar' : `${count} pedidos sin enviar`;
  return `Tienes ${orders} a cocina. Se enviarán cuando vuelvas a entrar en este dispositivo. ¿Cerrar sesión?`;
}
