import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

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
  imports: [CategoryTabsComponent, OrderCounterComponent, ProductCardComponent],
  providers: [provideCatalogApi(), CatalogStore],
  templateUrl: './catalog-page.component.html',
  styleUrl: './catalog-page.component.scss',
})
export class CatalogPageComponent {
  protected readonly store = inject(CatalogStore);
  private readonly orderDraft = inject(OrderDraftService);

  protected readonly itemCount = this.orderDraft.itemCount;

  protected addToOrder(product: Product): void {
    this.orderDraft.add({ productId: product.id, name: product.name, unitPrice: product.price });
  }
}
