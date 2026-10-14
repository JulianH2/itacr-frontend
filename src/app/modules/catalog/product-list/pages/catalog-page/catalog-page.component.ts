import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

import { EmployeeRole } from '@shared/auth/auth.models';
import { SessionService } from '@shared/auth/session.service';
import { IconComponent } from '@shared/components/icon/icon.component';
import { MxnPricePipe } from '@shared/pipes/mxn-price.pipe';
import { OrderDraftService } from '@shared/state/order-draft/order-draft.service';

import { provideCatalogApi } from '../../catalog.config';
import { CategoryTabsComponent } from '../../components/category-tabs/category-tabs.component';
import { OrderCounterComponent } from '../../components/order-counter/order-counter.component';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import type { Product } from '../../models/catalog.models';
import { CatalogStore } from '../../services/catalog-store.service';

/** Public menu page, shown to waiters and customers alike (no login required). */
@Component({
  selector: 'app-catalog-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CategoryTabsComponent,
    OrderCounterComponent,
    ProductCardComponent,
    IconComponent,
    MatButtonModule,
    MxnPricePipe,
    RouterLink,
  ],
  providers: [provideCatalogApi(), CatalogStore],
  templateUrl: './catalog-page.component.html',
  styleUrl: './catalog-page.component.scss',
})
export class CatalogPageComponent {
  protected readonly store = inject(CatalogStore);
  private readonly orderDraft = inject(OrderDraftService);
  private readonly session = inject(SessionService);

  protected readonly itemCount = this.orderDraft.itemCount;
  protected readonly total = this.orderDraft.total;

  /** Only a waiter takes the order to the kitchen; customers just browse the menu. */
  protected readonly isWaiter = computed(
    () => this.session.employee()?.role === EmployeeRole.Waiter,
  );

  protected addToOrder(product: Product): void {
    this.orderDraft.add({ productId: product.id, name: product.name, unitPrice: product.price });
  }
}
