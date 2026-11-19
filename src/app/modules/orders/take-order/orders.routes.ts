import { Routes } from '@angular/router';

import { OrderEditStore } from './services/order-edit-store.service';
import { TakeOrderStore } from './services/take-order-store.service';

export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    providers: [TakeOrderStore, OrderEditStore],
    children: [
      {
        path: '',
        title: 'Pedidos | ITACR',
        loadComponent: () =>
          import('./pages/waiter-dashboard-page/waiter-dashboard-page.component').then(
            (m) => m.WaiterDashboardPageComponent,
          ),
      },
      {
        path: 'summary',
        title: 'Resumen del pedido | ITACR',
        loadComponent: () =>
          import('./pages/order-summary-page/order-summary-page.component').then(
            (m) => m.OrderSummaryPageComponent,
          ),
      },
      {
        path: 'sent',
        title: 'Pedido enviado | ITACR',
        loadComponent: () =>
          import('./pages/order-sent-page/order-sent-page.component').then(
            (m) => m.OrderSentPageComponent,
          ),
      },
      {
        path: 'detail/:id/edit',
        title: 'Modificar pedido | ITACR',
        loadComponent: () =>
          import('./pages/order-edit-page/order-edit-page.component').then(
            (m) => m.OrderEditPageComponent,
          ),
      },
      {
        path: 'detail/:id',
        title: 'Detalle del pedido | ITACR',
        loadComponent: () =>
          import('./pages/order-detail-page/order-detail-page.component').then(
            (m) => m.OrderDetailPageComponent,
          ),
      },
    ],
  },
];
