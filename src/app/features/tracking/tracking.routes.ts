import { Routes } from '@angular/router';

export const TRACKING_ROUTES: Routes = [
  {
    path: '',
    title: 'Seguimiento | ITACR',
    loadComponent: () =>
      import('./pages/tracking-page/tracking-page.component').then((m) => m.TrackingPageComponent),
  },
];
