import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { MxnPricePipe } from '@shared/pipes/mxn-price.pipe';

import {
  PICKUP_STATUS_TONES,
  pickupStatusHint,
  pickupStatusLabel,
} from '../../models/pickup-order-status';
import { PickupOrderStore } from '../../services/pickup-order-store.service';
import { PickupTrackingStore } from '../../services/pickup-tracking-store.service';
import { PICKUP_MESSAGES } from '../../pickup-order.messages';

/**
 * Confirmation of the order just sent and the status of the active orders of this phone. The customer can come back
 * to it later: the receipts are kept on the device, so there is nothing to type.
 */
@Component({
  selector: 'app-pickup-orders-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    RouterLink,
    EmptyStateComponent,
    IconComponent,
    MxnPricePipe,
    StatusBadgeComponent,
  ],
  providers: [PickupTrackingStore],
  templateUrl: './pickup-orders-page.component.html',
  styleUrl: './pickup-orders-page.component.scss',
})
export class PickupOrdersPageComponent {
  protected readonly tracking = inject(PickupTrackingStore);
  protected readonly sentOrder = inject(PickupOrderStore).sentOrder;

  protected readonly tones = PICKUP_STATUS_TONES;
  protected readonly outdatedMessage = PICKUP_MESSAGES.trackingUnavailable;
  protected readonly statusLabel = pickupStatusLabel;
  protected readonly statusHint = pickupStatusHint;
}
