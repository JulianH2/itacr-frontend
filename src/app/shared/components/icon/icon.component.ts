import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ICON_PATHS, type IconName } from './icon-paths';

const DEFAULT_ICON_SIZE = 24;

/**
 * Outline icon from the ITACR set. Decorative by default (aria-hidden); pass `label` when the icon
 * is the only content of a control or conveys meaning on its own.
 */
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.width]="size()"
      [attr.height]="size()"
      [attr.role]="label() ? 'img' : null"
      [attr.aria-label]="label() || null"
      [attr.aria-hidden]="label() ? null : 'true'"
      focusable="false"
    >
      @for (path of paths(); track path) {
        <path [attr.d]="path" />
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
      line-height: 0;
    }
  `,
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input(DEFAULT_ICON_SIZE);
  readonly label = input('');

  protected readonly paths = computed(() => ICON_PATHS[this.name()]);
}
