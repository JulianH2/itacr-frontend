import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { ThemeService } from '@shared/services/theme.service';
import { IconComponent } from '../icon/icon.component';

/** Header button that switches between the light and dark theme. */
@Component({
  selector: 'app-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <button
      type="button"
      class="theme-toggle"
      data-testid="theme-toggle"
      [attr.aria-label]="label()"
      [attr.title]="label()"
      (click)="toggle()"
    >
      <app-icon [name]="icon()" />
    </button>
  `,
  styles: `
    .theme-toggle {
      align-items: center;
      background: transparent;
      border: 0;
      border-radius: var(--radius-pill);
      color: var(--color-text);
      cursor: pointer;
      display: inline-flex;
      font-family: var(--font-family);
      height: var(--touch-target);
      justify-content: center;
      transition:
        background-color var(--duration-fast) var(--ease-standard),
        transform var(--duration-fast) var(--ease-standard);
      width: var(--touch-target);
    }

    .theme-toggle:active {
      transform: scale(0.94);
    }

    @media (hover: hover) {
      .theme-toggle:hover {
        background: var(--color-primary-tint);
      }
    }
  `,
})
export class ThemeToggleComponent {
  private readonly themes = inject(ThemeService);

  // The icon shows where the button takes you, not where you are.
  protected readonly icon = computed(() => (this.themes.theme() === 'dark' ? 'sun' : 'moon'));
  protected readonly label = computed(() =>
    this.themes.theme() === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro',
  );

  protected toggle(): void {
    this.themes.toggle();
  }
}
