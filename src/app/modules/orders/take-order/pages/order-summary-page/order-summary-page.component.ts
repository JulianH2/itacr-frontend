import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';

import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { ItemChoicesComponent } from '@shared/components/item-choices/item-choices.component';
import { QtyStepperComponent } from '@shared/components/qty-stepper/qty-stepper.component';
import { MxnPricePipe } from '@shared/pipes/mxn-price.pipe';
import { customizationLines } from '@shared/state/order-draft/order-draft.model';
import { OrderDraftService } from '@shared/state/order-draft/order-draft.service';

import { TakeOrderStore } from '../../services/take-order-store.service';

@Component({
  selector: 'app-order-summary-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ItemChoicesComponent,
    MatButtonModule,
    RouterLink,
    EmptyStateComponent,
    IconComponent,
    MxnPricePipe,
    QtyStepperComponent,
  ],
  templateUrl: './order-summary-page.component.html',
  styleUrl: './order-summary-page.component.scss',
})
export class OrderSummaryPageComponent {
  protected readonly store = inject(TakeOrderStore);
  private readonly draft = inject(OrderDraftService);
  private readonly router = inject(Router);

  protected readonly choices = customizationLines;

  protected setQuantity(lineId: string, quantity: number): void {
    this.draft.changeQuantity(lineId, quantity);
  }

  protected remove(lineId: string): void {
    this.draft.remove(lineId);
  }

  protected async send(): Promise<void> {
    if (await this.store.send()) {
      await this.router.navigateByUrl('/orders/sent');
    }
  }
}
