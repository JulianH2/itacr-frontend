import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  computed,
  input,
  output,
  signal,
  viewChild,
  afterNextRender,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

import { OptionRowComponent } from '@shared/components/option-row/option-row.component';
import { SegmentedControlComponent } from '@shared/components/segmented-control/segmented-control.component';
import { StepIndicatorComponent } from '@shared/components/step-indicator/step-indicator.component';
import { MxnPricePipe } from '@shared/pipes/mxn-price.pipe';
import {
  type ComboCustomization,
  customizationLines,
} from '@shared/state/order-draft/order-draft.model';

import type { ComboOption, Product } from '../../models/catalog.models';
import {
  type ComboChoice,
  DRINK_REQUIRED_MESSAGE,
  NO_CHOICE,
  SIZE_REQUIRED_MESSAGE,
  comboUnitPrice,
  optionsOfType,
  toCustomization,
} from '../../models/combo-customization';

/** What the dialog hands back when the user adds the combo: the choices and the price of one unit with them. */
export interface ConfirmedCombo {
  readonly customization: ComboCustomization;
  readonly unitPrice: number;
}

const STEPS = ['Tamaño', 'Bebida', 'Extras', 'Exclusiones'] as const;
const SIZE_STEP = 0;
const DRINK_STEP = 1;
const LAST_STEP = STEPS.length - 1;
const MXN_CENTS = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
});

function priceDetail(adjustment: number): string {
  return adjustment > 0 ? `+${MXN_CENTS.format(adjustment)}` : '';
}

/**
 * Guided flow to customize a combo (HU_12): size, drink, extras, and ingredients to leave out, one step at a time. The
 * price of one unit is always on screen and changes with each choice. The size and the drink are required, so going on
 * without them shows a message instead of moving. A native modal `<dialog>`: it traps focus and closes with Escape.
 */
@Component({
  selector: 'app-combo-customizer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MxnPricePipe,
    OptionRowComponent,
    SegmentedControlComponent,
    StepIndicatorComponent,
  ],
  template: `
    <dialog
      #dialog
      class="customizer"
      aria-labelledby="customizer-title"
      data-testid="combo-customizer"
      (close)="dismissed.emit()"
    >
      <header class="customizer__header">
        <h2 id="customizer-title" class="customizer__title">Personaliza: {{ product().name }}</h2>
        <p class="customizer__price tabular" data-testid="combo-price" aria-live="polite">
          {{ unitPrice() | mxnPrice }}
        </p>
      </header>

      <app-step-indicator [steps]="steps" [current]="step()" />

      <div class="customizer__body">
        @switch (step()) {
          @case (0) {
            <h3 class="customizer__question">¿De qué tamaño?</h3>
            <app-segmented-control
              label="Tamaño"
              testIdPrefix="size-"
              [options]="sizeOptions()"
              [value]="choice().sizeId ?? ''"
              (valueChange)="chooseSize($event)"
            />
          }
          @case (1) {
            <h3 class="customizer__question">¿Qué bebida?</h3>
            <app-segmented-control
              label="Bebida"
              testIdPrefix="drink-"
              variant="chips"
              [options]="drinkOptions()"
              [value]="choice().drinkId ?? ''"
              (valueChange)="chooseDrink($event)"
            />
          }
          @case (2) {
            <h3 class="customizer__question">¿Algún extra? (opcional)</h3>
            <div class="customizer__rows">
              @for (extra of extras(); track extra.id) {
                <app-option-row
                  [label]="extra.name"
                  [detail]="detailOf(extra)"
                  [checked]="choice().extraIds.includes(extra.id)"
                  (checkedChange)="toggleExtra(extra.id, $event)"
                />
              }
            </div>
          }
          @default {
            <h3 class="customizer__question">¿Quieres quitar algo? (opcional)</h3>
            <div class="customizer__rows">
              @for (exclusion of exclusions(); track exclusion.id) {
                <app-option-row
                  [label]="'Sin ' + exclusion.name.toLowerCase()"
                  [checked]="choice().exclusionIds.includes(exclusion.id)"
                  (checkedChange)="toggleExclusion(exclusion.id, $event)"
                />
              }
            </div>
          }
        }

        @if (error(); as error) {
          <p class="customizer__error" role="alert" data-testid="customizer-error">{{ error }}</p>
        }

        @if (summary().length > 0) {
          <section class="customizer__summary" aria-labelledby="customizer-summary-title">
            <h3 id="customizer-summary-title" class="customizer__summary-title">Tu combo</h3>
            <ul class="customizer__summary-list" data-testid="combo-summary">
              @for (line of summary(); track $index) {
                <li>{{ line }}</li>
              }
            </ul>
          </section>
        }
      </div>

      <footer class="customizer__actions">
        @if (step() > 0) {
          <button type="button" mat-stroked-button data-testid="combo-back" (click)="back()">
            Atrás
          </button>
        } @else {
          <button type="button" mat-stroked-button data-testid="combo-cancel" (click)="close()">
            Cancelar
          </button>
        }
        @if (isLastStep()) {
          <button type="button" mat-flat-button data-testid="combo-add" (click)="confirm()">
            Agregar al pedido
          </button>
        } @else {
          <button type="button" mat-flat-button data-testid="combo-next" (click)="next()">
            Continuar
          </button>
        }
      </footer>
    </dialog>
  `,
  styles: `
    .customizer {
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-card);
      color: var(--color-text);
      max-height: calc(100dvh - 2 * var(--space-2));
      max-width: min(480px, calc(100vw - 2 * var(--space-2)));
      padding: var(--space-3);
      width: 100%;
    }

    .customizer::backdrop {
      background: rgb(0 0 0 / 40%);
    }

    .customizer__header {
      align-items: baseline;
      display: flex;
      gap: var(--space-2);
      justify-content: space-between;
      margin-bottom: var(--space-2);
    }

    .customizer__title {
      font: var(--mat-sys-title-large);
      font-family: var(--font-family);
      margin: 0;
    }

    .customizer__price {
      font: var(--mat-sys-title-large);
      font-family: var(--font-family);
      margin: 0;
      white-space: nowrap;
    }

    .customizer__body {
      display: grid;
      gap: var(--space-2);
      margin: var(--space-2) 0;
    }

    .customizer__question {
      font: var(--mat-sys-title-medium);
      font-family: var(--font-family);
      margin: 0;
    }

    .customizer__rows {
      display: grid;
      gap: var(--space-1);
    }

    .customizer__error {
      color: var(--color-error);
      font: var(--mat-sys-body-large);
      font-family: var(--font-family);
      margin: 0;
    }

    .customizer__summary {
      background: var(--color-bg-alt);
      border-radius: var(--radius-card);
      padding: var(--space-1-5) var(--space-2);
    }

    .customizer__summary-title {
      font: var(--mat-sys-label-large);
      font-family: var(--font-family);
      margin: 0 0 var(--space-half);
    }

    .customizer__summary-list {
      font: var(--mat-sys-body-medium);
      font-family: var(--font-family);
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .customizer__actions {
      display: flex;
      gap: var(--space-1);
      justify-content: space-between;
    }
  `,
})
export class ComboCustomizerComponent {
  readonly product = input.required<Product>();
  readonly options = input.required<readonly ComboOption[]>();
  readonly confirmed = output<ConfirmedCombo>();
  readonly dismissed = output();

  protected readonly steps = STEPS;
  protected readonly step = signal(SIZE_STEP);
  protected readonly choice = signal<ComboChoice>(NO_CHOICE);
  protected readonly error = signal<string | null>(null);

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly sizes = computed(() => optionsOfType(this.options(), 'Size'));
  protected readonly drinks = computed(() => optionsOfType(this.options(), 'Drink'));
  protected readonly extras = computed(() => optionsOfType(this.options(), 'Extra'));
  protected readonly exclusions = computed(() => optionsOfType(this.options(), 'Exclusion'));

  protected readonly sizeOptions = computed(() =>
    this.sizes().map((size) => ({
      value: size.id,
      label: `${size.name} ${priceDetail(size.priceAdjustment)}`.trim(),
    })),
  );
  protected readonly drinkOptions = computed(() =>
    this.drinks().map((drink) => ({ value: drink.id, label: drink.name })),
  );

  /** Price of one unit with what is chosen so far. */
  protected readonly unitPrice = computed(() =>
    comboUnitPrice(this.product().price, this.options(), this.choice()),
  );
  protected readonly isLastStep = computed(() => this.step() === LAST_STEP);

  /** What was chosen so far, one line each, so the user sees it before adding the combo (HU_12 CA1). */
  protected readonly summary = computed(() =>
    customizationLines(toCustomization(this.options(), this.choice())),
  );

  constructor() {
    afterNextRender(() => {
      const dialog = this.dialog().nativeElement;
      if (!dialog.open) {
        dialog.showModal();
      }
    });
  }

  protected detailOf(option: ComboOption): string {
    return priceDetail(option.priceAdjustment);
  }

  protected chooseSize(sizeId: string): void {
    this.choice.update((choice) => ({ ...choice, sizeId }));
    this.error.set(null);
  }

  protected chooseDrink(drinkId: string): void {
    this.choice.update((choice) => ({ ...choice, drinkId }));
    this.error.set(null);
  }

  protected toggleExtra(id: string, checked: boolean): void {
    this.choice.update((choice) => ({ ...choice, extraIds: toggle(choice.extraIds, id, checked) }));
  }

  protected toggleExclusion(id: string, checked: boolean): void {
    this.choice.update((choice) => ({
      ...choice,
      exclusionIds: toggle(choice.exclusionIds, id, checked),
    }));
  }

  protected next(): void {
    const missing = this.missingMessage();
    if (missing !== null) {
      this.error.set(missing);
      return;
    }
    this.error.set(null);
    this.step.update((step) => Math.min(step + 1, LAST_STEP));
  }

  protected back(): void {
    this.error.set(null);
    this.step.update((step) => Math.max(step - 1, SIZE_STEP));
  }

  protected confirm(): void {
    const customization = toCustomization(this.options(), this.choice());
    if (customization === null) {
      this.error.set(
        this.choice().sizeId === null ? SIZE_REQUIRED_MESSAGE : DRINK_REQUIRED_MESSAGE,
      );
      this.step.set(this.choice().sizeId === null ? SIZE_STEP : DRINK_STEP);
      return;
    }
    this.confirmed.emit({ customization, unitPrice: this.unitPrice() });
    this.close();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  /** The step the user is on needs a choice before going on: the size first, then the drink. */
  private missingMessage(): string | null {
    if (this.step() === SIZE_STEP && this.choice().sizeId === null) {
      return SIZE_REQUIRED_MESSAGE;
    }
    if (this.step() === DRINK_STEP && this.choice().drinkId === null) {
      return DRINK_REQUIRED_MESSAGE;
    }
    return null;
  }
}

function toggle(ids: readonly string[], id: string, checked: boolean): readonly string[] {
  const without = ids.filter((current) => current !== id);
  return checked ? [...without, id] : without;
}
