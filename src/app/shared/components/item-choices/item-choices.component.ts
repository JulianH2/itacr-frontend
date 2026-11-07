import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** What was chosen for a combo (size, drink, extras, exclusions), one short line each, under the name of the product. */
@Component({
  selector: 'app-item-choices',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (lines().length > 0) {
      <ul class="choices" aria-label="Opciones del combo">
        @for (line of lines(); track $index) {
          <li class="choices__line">{{ line }}</li>
        }
      </ul>
    }
  `,
  styles: `
    .choices {
      color: var(--color-text-secondary);
      font: var(--mat-sys-body-medium);
      font-family: var(--font-family);
      list-style: none;
      margin: var(--space-0-5) 0 0;
      padding: 0;
    }
  `,
})
export class ItemChoicesComponent {
  readonly lines = input.required<readonly string[]>();
}
