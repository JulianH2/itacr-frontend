import { Routes } from '@angular/router';

/** Every feature is lazy-loaded so the waiter flow ships the smallest possible initial bundle. */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadChildren: () => import('@features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'catalog',
    loadChildren: () => import('@features/catalog/catalog.routes').then((m) => m.CATALOG_ROUTES),
  },
  {
    path: 'orders',
    loadChildren: () => import('@features/orders/orders.routes').then((m) => m.ORDERS_ROUTES),
  },
  {
    path: 'kitchen',
    loadChildren: () => import('@features/kitchen/kitchen.routes').then((m) => m.KITCHEN_ROUTES),
  },
  {
    path: 'tracking',
    loadChildren: () => import('@features/tracking/tracking.routes').then((m) => m.TRACKING_ROUTES),
  },
  {
    path: 'manager',
    loadChildren: () => import('@features/manager/manager.routes').then((m) => m.MANAGER_ROUTES),
  },
  { path: '**', redirectTo: 'login' },
];
