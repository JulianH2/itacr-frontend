import { Routes } from '@angular/router';

import { TakeOrderStore } from './services/take-order-store.service';

export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    providers: [TakeOrderStore],
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
