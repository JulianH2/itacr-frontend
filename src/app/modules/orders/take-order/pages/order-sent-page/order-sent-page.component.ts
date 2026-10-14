import { ChangeDetectionStrategy, Component, inject, type OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';

import { IconComponent } from '@shared/components/icon/icon.component';
import { MxnPricePipe } from '@shared/pipes/mxn-price.pipe';

import { TakeOrderStore } from '../../services/take-order-store.service';

/** Confirmation that the kitchen received the order. */
@Component({
  selector: 'app-order-sent-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, RouterLink, IconComponent, MxnPricePipe],
  templateUrl: './order-sent-page.component.html',
  styleUrl: './order-sent-page.component.scss',
})
export class OrderSentPageComponent implements OnInit {
  protected readonly store = inject(TakeOrderStore);
  private readonly router = inject(Router);

  ngOnInit(): void {
    if (this.store.sentOrder() === null) {
      void this.router.navigateByUrl('/orders');
    }
  }

  protected async startNewOrder(): Promise<void> {
    this.store.startNewOrder();
    await this.router.navigateByUrl('/orders');
  }
}
