import { Routes } from '@angular/router';

import { guestGuard } from '@shared/guards/guest.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    title: 'Iniciar sesión | ITACR',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/login-page/login-page.component').then((m) => m.LoginPageComponent),
  },
  {
    path: 'password',
    title: 'Usuario y contraseña | ITACR',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/password-login-page/password-login-page.component').then(
        (m) => m.PasswordLoginPageComponent,
      ),
  },
  {
    path: 'redirect',
    title: 'Redirigiendo… | ITACR',
    loadComponent: () =>
      import('./pages/redirect-page/redirect-page.component').then((m) => m.RedirectPageComponent),
  },
];
