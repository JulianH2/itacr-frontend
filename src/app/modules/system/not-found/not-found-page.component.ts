import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

import { IconComponent } from '@shared/components/icon/icon.component';
import { StatePageComponent } from '@shared/components/state-page/state-page.component';

/** Shown for any address the app does not have. */
@Component({
  selector: 'app-not-found-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, RouterLink, IconComponent, StatePageComponent],
  template: `
    <app-state-page
      icon="bag"
      eyebrow="Error 404"
      heading="Página no encontrada"
      description="El enlace que abriste no existe o fue movido. Revisa la dirección o vuelve al inicio."
    >
      <a mat-flat-button routerLink="/" data-testid="go-home">
        <app-icon name="home" [size]="20" />
        Volver al inicio
      </a>
    </app-state-page>
  `,
})
export class NotFoundPageComponent {}
