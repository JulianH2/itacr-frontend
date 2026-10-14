import { ChangeDetectionStrategy, Component } from '@angular/core';

import { BrandMarkComponent } from '@shared/components/brand-mark/brand-mark.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';

const WATERMARK_SIZE = 200;

/**
 * The wine panel of the home hero with two floating status cards (wide screens only). It is an
 * illustration: the order shown is an example, not data.
 */
@Component({
  selector: 'app-hero-art',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BrandMarkComponent, StatusBadgeComponent],
  template: `
    <div class="art" aria-hidden="true">
      <app-brand-mark class="art__watermark" [size]="watermarkSize" />
      <div class="float float--status">
        <app-status-badge tone="success" icon="check-circle">En línea</app-status-badge>
      </div>
      <div class="float float--order">
        <p class="float__label tabular">Mesa 5 · Orden #1042</p>
        <app-status-badge tone="brand">En preparación</app-status-badge>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: none;
    }

    @media (min-width: 900px) {
      :host {
        display: block;
      }
    }

    .art {
      align-items: center;
      aspect-ratio: 1;
      background: var(--color-brand-surface);
      border-radius: calc(var(--radius-card) * 2);
      color: var(--color-on-brand-surface);
      display: flex;
      justify-content: center;
      position: relative;
    }

    .art__watermark {
      opacity: 0.18;
    }

    // The one orchestrated moment of the home: the two cards settle in after the panel.
    .float {
      animation: float-in var(--duration-slow) var(--ease-standard) both;
      background: var(--color-surface);
      border-radius: var(--radius-card);
      box-shadow: var(--shadow-medium);
      color: var(--color-text);
      display: grid;
      gap: var(--space-1);
      padding: var(--space-2);
      position: absolute;
    }

    .float--status {
      animation-delay: 250ms;
      right: calc(var(--space-3) * -1);
      top: var(--space-5);
    }

    .float--order {
      animation-delay: 400ms;
      bottom: var(--space-8);
      left: calc(var(--space-4) * -1);
    }

    .float__label {
      color: var(--color-text-secondary);
      font: var(--mat-sys-label-large);
      font-family: var(--font-family);
      margin: 0;
    }

    @keyframes float-in {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
    }
  `,
})
export class HeroArtComponent {
  protected readonly watermarkSize = WATERMARK_SIZE;
}
