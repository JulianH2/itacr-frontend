import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';

import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { QtyStepperComponent } from '@shared/components/qty-stepper/qty-stepper.component';
import { MxnPricePipe } from '@shared/pipes/mxn-price.pipe';
import { OrderDraftService } from '@shared/state/order-draft/order-draft.service';

import { NAME_MAX_LENGTH, PHONE_LENGTH } from '../../models/pickup-customer';
import { PickupOrderStore } from '../../services/pickup-order-store.service';

/** The order of the customer, their name and phone, and the button that sends it to the kitchen. */
@Component({
  selector: 'app-pickup-summary-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    RouterLink,
    EmptyStateComponent,
    IconComponent,
    MxnPricePipe,
    QtyStepperComponent,
  ],
  templateUrl: './pickup-summary-page.component.html',
  styleUrl: './pickup-summary-page.component.scss',
})
export class PickupSummaryPageComponent {
  protected readonly store = inject(PickupOrderStore);
  private readonly draft = inject(OrderDraftService);
  private readonly router = inject(Router);

  protected readonly nameMaxLength = NAME_MAX_LENGTH;
  protected readonly phoneLength = PHONE_LENGTH;

  protected setQuantity(productId: string, quantity: number): void {
    this.draft.changeQuantity(productId, quantity);
  }

  protected remove(productId: string): void {
    this.draft.remove(productId);
  }

  protected onName(event: Event): void {
    this.store.setName((event.target as HTMLInputElement).value);
  }

  protected onPhone(event: Event): void {
    this.store.setPhone((event.target as HTMLInputElement).value);
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (await this.store.send()) {
      await this.router.navigateByUrl('/pickup/orders');
    }
  }
}
