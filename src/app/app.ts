import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface NavigationLink {
  readonly path: string;
  readonly label: string;
}

export const NAVIGATION_LINKS: readonly NavigationLink[] = [
  { path: '/orders', label: 'Pedidos' },
  { path: '/catalog', label: 'Catálogo' },
  { path: '/kitchen', label: 'Cocina' },
  { path: '/tracking', label: 'Seguimiento' },
  { path: '/manager', label: 'Gerencia' },
];

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly navigationLinks = NAVIGATION_LINKS;
}
