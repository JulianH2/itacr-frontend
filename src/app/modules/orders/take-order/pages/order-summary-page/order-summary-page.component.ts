import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';

import { MxnPricePipe } from '@shared/pipes/mxn-price.pipe';
import { OrderDraftService } from '@shared/state/order-draft/order-draft.service';

import { TakeOrderStore } from '../../services/take-order-store.service';

/** Review of the order before it goes to the kitchen: products, total, and a table or "Para llevar". */
@Component({
  selector: 'app-order-summary-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, RouterLink, MxnPricePipe],
  templateUrl: './order-summary-page.component.html',
  styleUrl: './order-summary-page.component.scss',
})
export class OrderSummaryPageComponent {
  protected readonly store = inject(TakeOrderStore);
  private readonly draft = inject(OrderDraftService);
  private readonly router = inject(Router);

  protected increase(productId: string, quantity: number): void {
    this.draft.changeQuantity(productId, quantity + 1);
  }

  protected decrease(productId: string, quantity: number): void {
    this.draft.changeQuantity(productId, quantity - 1);
  }

  protected remove(productId: string): void {
    this.draft.remove(productId);
  }

  protected async send(): Promise<void> {
    if (await this.store.send()) {
      await this.router.navigateByUrl('/orders/sent');
    }
  }
}
