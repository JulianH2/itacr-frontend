import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { IconComponent } from '@shared/components/icon/icon.component';
import type { IconName } from '@shared/components/icon/icon-paths';

import { HeroArtComponent } from './hero-art/hero-art.component';

interface Feature {
  readonly icon: IconName;
  readonly label: string;
}

interface Step {
  readonly title: string;
  readonly text: string;
}

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, HeroArtComponent, IconComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent {
  protected readonly features: readonly Feature[] = [
    { icon: 'clock', label: 'Tiempo real' },
    { icon: 'cloud-off', label: 'Funciona offline' },
    { icon: 'kitchen', label: 'Hecho para equipos rápidos' },
  ];

  protected readonly steps: readonly Step[] = [
    { title: 'Elige y personaliza', text: 'Arma tu pedido desde el catálogo en segundos.' },
    { title: 'Envíalo a cocina', text: 'Tu orden llega al instante, incluso sin conexión.' },
    { title: 'Recógelo o te avisamos', text: 'Te avisamos cuando tu pedido esté listo.' },
  ];
}
