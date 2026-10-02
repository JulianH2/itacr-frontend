import { Routes } from '@angular/router';

export const HOME_ROUTES: Routes = [
  {
    path: '',
    title: 'Inicio | ITACR',
    loadComponent: () =>
      import('./pages/home-page/home-page.component').then((m) => m.HomePageComponent),
  },
];
