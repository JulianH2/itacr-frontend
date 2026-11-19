import { Routes } from '@angular/router';

import { provideManagerApi } from '../manager.config';
import { ManagerDashboardStore } from '../services/manager-dashboard.store';

export const MANAGER_ROUTES: Routes = [
  {
    path: '',
    title: 'Gerencia | ITACR',
    providers: [provideManagerApi(), ManagerDashboardStore],
    loadComponent: () => import('./dashboard-page.component').then((m) => m.DashboardPageComponent),
  },
];
