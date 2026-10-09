import { Routes } from '@angular/router';

export const KITCHEN_ROUTES: Routes = [
  {
    path: '',
    title: 'Cocina | ITACR',
    loadComponent: () => import('./kitchen-page.component').then((m) => m.KitchenPageComponent),
  },
];
