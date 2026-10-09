import { Routes } from '@angular/router';

import { EmployeeRole } from '@shared/auth/auth.models';
import { roleGuard } from '@shared/guards/role.guard';

/** Every feature is lazy-loaded so the waiter flow ships the smallest possible initial bundle. */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadChildren: () => import('@modules/home/home-page/home.routes').then((m) => m.HOME_ROUTES),
  },
  {
    path: 'login',
    loadChildren: () => import('@modules/identity/login/login.routes').then((m) => m.LOGIN_ROUTES),
  },
  {
    path: 'catalog',
    loadChildren: () =>
      import('@modules/catalog/product-list/catalog.routes').then((m) => m.CATALOG_ROUTES),
  },
  {
    path: 'orders',
    canActivate: [roleGuard(EmployeeRole.Waiter)],
    loadChildren: () =>
      import('@modules/orders/take-order/orders.routes').then((m) => m.ORDERS_ROUTES),
  },
  {
    path: 'kitchen',
    canActivate: [roleGuard(EmployeeRole.Kitchen)],
    loadChildren: () =>
      import('@modules/kitchen/kitchen-board/kitchen.routes').then((m) => m.KITCHEN_ROUTES),
  },
  {
    path: 'tracking',
    loadChildren: () =>
      import('@modules/tracking/tracking-page/tracking.routes').then((m) => m.TRACKING_ROUTES),
  },
  {
    path: 'manager',
    canActivate: [roleGuard(EmployeeRole.Manager)],
    loadChildren: () =>
      import('@modules/manager/dashboard-page/manager.routes').then((m) => m.MANAGER_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
