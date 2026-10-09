import { Routes } from '@angular/router';

import { EmployeeRole } from '@shared/auth/auth.models';
import { roleGuard } from '@shared/guards/role.guard';

/** Every feature is lazy-loaded so the waiter flow ships the smallest possible initial bundle. */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadChildren: () => import('@features/home/home.routes').then((m) => m.HOME_ROUTES),
  },
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
    canActivate: [roleGuard(EmployeeRole.Waiter)],
    loadChildren: () => import('@features/orders/orders.routes').then((m) => m.ORDERS_ROUTES),
  },
  {
    path: 'kitchen',
    canActivate: [roleGuard(EmployeeRole.Kitchen)],
    loadChildren: () => import('@features/kitchen/kitchen.routes').then((m) => m.KITCHEN_ROUTES),
  },
  {
    path: 'tracking',
    loadChildren: () => import('@features/tracking/tracking.routes').then((m) => m.TRACKING_ROUTES),
  },
  {
    path: 'manager',
    canActivate: [roleGuard(EmployeeRole.Manager)],
    loadChildren: () => import('@features/manager/manager.routes').then((m) => m.MANAGER_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
