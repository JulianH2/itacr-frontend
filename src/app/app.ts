import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ROLE_LABELS } from '@shared/auth/auth-messages';
import { EmployeeRole } from '@shared/auth/auth.models';
import { AuthService } from '@shared/auth/auth.service';
import { SessionService } from '@shared/auth/session.service';

interface NavigationLink {
  readonly path: string;
  readonly label: string;
}

export const NAVIGATION_BY_ROLE: Readonly<Record<EmployeeRole, readonly NavigationLink[]>> = {
  [EmployeeRole.Waiter]: [
    { path: '/orders', label: 'Pedidos' },
    { path: '/catalog', label: 'Menú' },
  ],
  [EmployeeRole.Kitchen]: [{ path: '/kitchen', label: 'Cocina' }],
  [EmployeeRole.Manager]: [
    { path: '/manager', label: 'Gerencia' },
    { path: '/kitchen', label: 'Cocina' },
    { path: '/catalog', label: 'Menú' },
  ],
};

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly auth = inject(AuthService);

  protected readonly employee = inject(SessionService).employee;
  protected readonly navigationLinks = computed(() => {
    const employee = this.employee();
    return employee === null ? [] : NAVIGATION_BY_ROLE[employee.role];
  });
  protected readonly roleLabel = computed(() => {
    const employee = this.employee();
    return employee === null ? '' : ROLE_LABELS[employee.role];
  });

  protected logout(): void {
    this.auth.logout();
  }
}
