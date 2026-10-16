import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

import { EmployeeRole } from '@shared/auth/auth.models';
import { SessionService } from '@shared/auth/session.service';
import { IconComponent } from '@shared/components/icon/icon.component';
import { MxnPricePipe } from '@shared/pipes/mxn-price.pipe';
import { ToastService } from '@shared/services/toast.service';
import { PICKUP_ORDER_LIMITS } from '@shared/state/order-draft/order-draft.limits';
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
  private readonly toast = inject(ToastService);

  protected readonly itemCount = this.orderDraft.itemCount;
  protected readonly total = this.orderDraft.total;

  /**
   * Where the cart leads. A waiter takes the order to the kitchen from `/orders/summary`; a customer without a session
   * orders for pickup from `/pickup/summary`. Kitchen staff and managers only browse the menu, so they get no cart.
   */
  protected readonly cartLink = computed(() => {
    const role = this.session.employee()?.role;
    if (role === undefined) {
      return '/pickup/summary';
    }
    return role === EmployeeRole.Waiter ? '/orders/summary' : null;
  });

  protected addToOrder(product: Product): void {
    // A customer's order has the limits of the pickup endpoint; the waiter's has none in the app.
    const limits = this.session.employee() === null ? PICKUP_ORDER_LIMITS : {};
    const refusal = this.orderDraft.add(
      { productId: product.id, name: product.name, unitPrice: product.price },
      1,
      limits,
    );
    if (refusal !== null) {
      this.toast.show({
        title: 'Límite del pedido',
        message:
          refusal === 'quantity-limit'
            ? `Puedes pedir hasta ${PICKUP_ORDER_LIMITS.maxQuantity} unidades de cada producto.`
            : `Un pedido admite hasta ${PICKUP_ORDER_LIMITS.maxProducts} productos distintos.`,
        icon: 'cart',
      });
    }
  }
}
