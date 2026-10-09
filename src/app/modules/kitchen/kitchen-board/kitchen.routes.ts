import { Routes } from '@angular/router';

export const KITCHEN_ROUTES: Routes = [
  {
    path: '',
    title: 'Cocina | ITACR',
    loadComponent: () =>
      import('./pages/kitchen-page/kitchen-page.component').then((m) => m.KitchenPageComponent),
  },
];
