import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, RouterLink],
  template: `
    <section class="home">
      <h1 class="home__title">ITACR</h1>
      <p class="home__subtitle">Pedidos rápidos para tu restaurante.</p>
      <div class="home__actions">
        <a mat-flat-button routerLink="/catalog">Ver menú</a>
        <a mat-stroked-button routerLink="/login" data-testid="staff-access">Acceso Personal</a>
      </div>
    </section>
  `,
  styles: `
    .home {
      display: grid;
      gap: 16px;
      justify-items: center;
      padding: 48px 16px;
      text-align: center;
    }

    .home__title {
      font: var(--mat-sys-display-medium);
      margin: 0;
    }

    .home__subtitle {
      font: var(--mat-sys-title-medium);
      margin: 0;
    }

    .home__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;

      a {
        min-height: 44px;
      }
    }
  `,
})
export class HomePageComponent {}
