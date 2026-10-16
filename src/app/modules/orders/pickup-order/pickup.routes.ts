import { Routes } from '@angular/router';

import { providePickupApi } from './pickup.config';
import { PickupOrderStore } from './services/pickup-order-store.service';

/**
 * The pickup flow of a customer without an account. It has its own route entry, API token and store: it is never hung
 * from `ORDERS_ROUTES`, whose parent route is guarded for waiters and provides the waiter's `TakeOrderStore`.
 */
export const PICKUP_ROUTES: Routes = [
  {
    path: '',
    providers: [providePickupApi(), PickupOrderStore],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'summary' },
      {
        path: 'summary',
        title: 'Tu pedido para recoger | ITACR',
        loadComponent: () =>
          import('./pages/pickup-summary-page/pickup-summary-page.component').then(
            (m) => m.PickupSummaryPageComponent,
          ),
      },
      {
        path: 'orders',
        title: 'Estado de tu pedido | ITACR',
        loadComponent: () =>
          import('./pages/pickup-orders-page/pickup-orders-page.component').then(
            (m) => m.PickupOrdersPageComponent,
          ),
      },
    ],
  },
];
