import { ChangeDetectionStrategy, Component, input } from '@angular/core';

const DEFAULT_MARK_SIZE = 32;

/** ITACR logo mark: a ring with two bars. Takes the color of the surrounding text. */
@Component({
  selector: 'app-brand-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      [attr.width]="size()"
      [attr.height]="size()"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="16" cy="16" r="12" />
      <path d="M12.5 10.5v11" />
      <path d="M19.5 10.5v11" />
      <path d="M19.5 17.5c-2 0-4.5.5-7 1.5" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      line-height: 0;
    }
  `,
})
export class BrandMarkComponent {
  readonly size = input(DEFAULT_MARK_SIZE);
}
