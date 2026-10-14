import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { IconComponent } from '../icon/icon.component';

export type TableStatus = 'occupied' | 'free' | 'pending';

export const TABLE_STATUS_LABELS: Readonly<Record<TableStatus, string>> = {
  occupied: 'Ocupada',
  free: 'Libre',
  pending: 'Pedido pendiente',
};

const SEATS_ICON_SIZE = 20;

/** Restaurant table tile: number, status and seats. Pressing it emits `selected`. */
@Component({
  selector: 'app-table-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <button
      type="button"
      [class]="'table-card table-card--' + status()"
      [attr.aria-label]="description()"
      (click)="selected.emit()"
    >
      <span class="table-card__head">
        <span class="table-card__name">Mesa {{ number() }}</span>
        <app-icon name="users" [size]="seatsIconSize" />
      </span>
      <span class="table-card__status">{{ statusLabel() }}</span>
      <span class="table-card__seats">{{ seats() }} lugares</span>
    </button>
  `,
  styles: `
    :host {
      display: block;
    }

    .table-card {
      background: transparent;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-card);
      color: var(--color-text);
      cursor: pointer;
      display: grid;
      font-family: var(--font-family);
      gap: var(--space-half);
      min-height: 96px;
      padding: var(--space-2);
      text-align: left;
      transition:
        transform var(--duration-fast) var(--ease-standard),
        box-shadow var(--duration-base) var(--ease-standard);
      width: 100%;
    }

    .table-card:active {
      transform: scale(0.98);
    }

    @media (hover: hover) {
      .table-card:hover {
        box-shadow: var(--shadow-subtle);
      }
    }

    .table-card__head {
      align-items: center;
      display: flex;
      justify-content: space-between;
    }

    .table-card__name {
      font: var(--mat-sys-title-large);
      font-family: var(--font-family);
    }

    .table-card__status {
      font: var(--mat-sys-label-large);
      font-family: var(--font-family);
      font-weight: 600;
    }

    .table-card__seats {
      color: var(--color-text-secondary);
      font: var(--mat-sys-body-small);
      font-family: var(--font-family);
    }

    .table-card--occupied {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: var(--color-on-primary);
    }

    .table-card--occupied .table-card__seats {
      color: inherit;
      opacity: 0.8;
    }

    .table-card--pending {
      background: var(--color-success-tint);
      border-color: var(--color-success);
      color: var(--color-success-strong);
    }

    .table-card--pending .table-card__seats {
      color: inherit;
    }
  `,
})
export class TableCardComponent {
  readonly number = input.required<number>();
  readonly status = input.required<TableStatus>();
  readonly seats = input.required<number>();

  readonly selected = output<void>();

  protected readonly seatsIconSize = SEATS_ICON_SIZE;
  protected readonly statusLabel = computed(() => TABLE_STATUS_LABELS[this.status()]);
  protected readonly description = computed(
    () => `Mesa ${this.number()}, ${this.statusLabel().toLowerCase()}, ${this.seats()} lugares`,
  );
}
