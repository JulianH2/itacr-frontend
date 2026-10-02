import { Routes } from '@angular/router';

export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    title: 'Pedidos | ITACR',
    loadComponent: () =>
      import('./pages/orders-page/orders-page.component').then((m) => m.OrdersPageComponent),
  },
];
