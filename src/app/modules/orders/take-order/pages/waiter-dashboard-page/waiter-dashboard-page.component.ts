import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

import { SessionService } from '@shared/auth/session.service';
import { MxnPricePipe } from '@shared/pipes/mxn-price.pipe';

import { TakeOrderStore } from '../../services/take-order-store.service';

/** The waiter's home: start an order, or go back to the one in progress. */
@Component({
  selector: 'app-waiter-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, RouterLink, MxnPricePipe],
  templateUrl: './waiter-dashboard-page.component.html',
  styleUrl: './waiter-dashboard-page.component.scss',
})
export class WaiterDashboardPageComponent {
  protected readonly store = inject(TakeOrderStore);
  private readonly session = inject(SessionService);

  protected readonly displayName = computed(() => this.session.employee()?.displayName ?? '');
}
