import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  model,
} from '@angular/core';

export interface SegmentedOption {
  readonly value: string;
  readonly label: string;
}

export type SegmentedVariant = 'segmented' | 'chips';

const ARROW_STEPS: Readonly<Record<string, number>> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

/**
 * Single choice among a few options. `segmented` is the joined track (login role tabs);
 * `chips` are separate pills (catalog categories). Arrow keys move the selection.
 */
@Component({
  selector: 'app-segmented-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      [class]="'segmented segmented--' + variant()"
      role="radiogroup"
      [attr.aria-label]="label()"
    >
      @for (option of options(); track option.value) {
        <button
          type="button"
          role="radio"
          class="segmented__option"
          [attr.aria-checked]="option.value === value()"
          [attr.data-value]="option.value"
          [attr.data-testid]="testIdPrefix() ? testIdPrefix() + option.value : null"
          [tabindex]="option.value === tabStop() ? 0 : -1"
          (click)="value.set(option.value)"
          (keydown)="onKeydown($event)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .segmented {
      display: flex;
      font-family: var(--font-family);
      gap: var(--space-1);
    }

    .segmented--chips {
      overflow-x: auto;
      padding-bottom: var(--space-half);
      scrollbar-width: none;
    }

    .segmented--segmented {
      background: var(--color-bg-alt);
      border-radius: var(--radius-card);
      gap: 0;
      padding: var(--space-half);
    }

    .segmented__option {
      background: transparent;
      border: 0;
      color: var(--color-text-secondary);
      cursor: pointer;
      font: var(--mat-sys-label-large);
      font-family: var(--font-family);
      font-weight: 600;
      min-height: var(--touch-target);
      padding: 0 var(--space-2);
      transition:
        background-color var(--duration-base) var(--ease-standard),
        color var(--duration-base) var(--ease-standard),
        transform var(--duration-fast) var(--ease-standard);
      white-space: nowrap;
    }

    .segmented__option:active {
      transform: scale(0.97);
    }

    .segmented--segmented .segmented__option {
      border-radius: var(--radius-control);
      flex: 1;
    }

    .segmented--chips .segmented__option {
      background: var(--color-bg-alt);
      border-radius: var(--radius-pill);
      flex: none;
    }

    .segmented__option[aria-checked='true'] {
      background: var(--color-primary);
      color: var(--color-on-primary);
    }

    @media (hover: hover) {
      .segmented__option[aria-checked='false']:hover {
        background: var(--color-primary-tint);
        color: var(--color-text);
      }
    }
  `,
})
export class SegmentedControlComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly options = input.required<readonly SegmentedOption[]>();
  readonly label = input.required<string>();
  readonly variant = input<SegmentedVariant>('segmented');
  /** When set, each option gets data-testid="<prefix><value>". */
  readonly testIdPrefix = input('');
  readonly value = model<string>('');

  /** The one option reachable with Tab: the selected one, or the first when nothing is selected yet. */
  protected readonly tabStop = computed(() => {
    const options = this.options();
    return options.some((option) => option.value === this.value())
      ? this.value()
      : options[0]?.value;
  });

  protected onKeydown(event: KeyboardEvent): void {
    const step = ARROW_STEPS[event.key] ?? 0;
    if (step === 0) {
      return;
    }
    event.preventDefault();
    const options = this.options();
    const current = options.findIndex((option) => option.value === this.value());
    const next = options[(current + step + options.length) % options.length];
    if (next) {
      this.value.set(next.value);
      queueMicrotask(() =>
        this.host.nativeElement.querySelector<HTMLElement>('[aria-checked="true"]')?.focus(),
      );
    }
  }
}
