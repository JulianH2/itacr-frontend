import { Routes } from '@angular/router';

export const TRACKING_ROUTES: Routes = [
  {
    path: '',
    title: 'Seguimiento | ITACR',
    loadComponent: () => import('./tracking-page.component').then((m) => m.TrackingPageComponent),
  },
];
