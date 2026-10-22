import { Routes } from '@angular/router';

/** Pages that explain a state of the app (no connection) instead of belonging to a feature. */
export const SYSTEM_ROUTES: Routes = [
  {
    path: '',
    title: 'Sin conexión | ITACR',
    loadComponent: () =>
      import('./offline/offline-page.component').then((m) => m.OfflinePageComponent),
  },
];
