import { Routes } from '@angular/router';

export const MANAGER_ROUTES: Routes = [
  {
    path: '',
    title: 'Gerencia | ITACR',
    loadComponent: () => import('./dashboard-page.component').then((m) => m.DashboardPageComponent),
  },
];
