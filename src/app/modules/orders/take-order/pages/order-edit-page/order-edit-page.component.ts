import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';

import { IconComponent } from '@shared/components/icon/icon.component';
import { ItemChoicesComponent } from '@shared/components/item-choices/item-choices.component';
import { QtyStepperComponent } from '@shared/components/qty-stepper/qty-stepper.component';
import { MxnPricePipe } from '@shared/pipes/mxn-price.pipe';
import { ToastService } from '@shared/services/toast.service';
import { customizationLines } from '@shared/state/order-draft/order-draft.model';
import { OrderDraftService } from '@shared/state/order-draft/order-draft.service';

import { TAKE_ORDER_MESSAGES } from '../../take-order.messages';
import { NOTE_MAX_LENGTH, OrderEditStore } from '../../services/order-edit-store.service';

/** Most units of one product the API accepts in a waiter's order. */
const MAX_QUANTITY = 99;

/**
 * Modify an order that is New or InPreparation (HU_13): change the products and their quantities, the table, and add a note, and
 * save or cancel. The products are added from the catalog, which fills the same draft as a new order. Nothing is saved until "Guardar".
 */
@Component({
  selector: 'app-order-edit-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ItemChoicesComponent,
    MatButtonModule,
    RouterLink,
    IconComponent,
    MxnPricePipe,
    QtyStepperComponent,
  ],
  templateUrl: './order-edit-page.component.html',
  styleUrls: [
    '../order-summary-page/order-summary-page.component.scss',
    './order-edit-page.component.scss',
  ],
})
export class OrderEditPageComponent {
  /** Route parameter `:id`. */
  readonly id = input.required<string>();

  protected readonly store = inject(OrderEditStore);
  private readonly draft = inject(OrderDraftService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly choices = customizationLines;
  protected readonly noteMaxLength = NOTE_MAX_LENGTH;
  protected readonly maxQuantity = MAX_QUANTITY;
  protected readonly messages = TAKE_ORDER_MESSAGES;

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => void this.store.open(id));
    });
  }

  protected setQuantity(lineId: string, quantity: number): void {
    this.draft.changeQuantity(lineId, quantity);
  }

  protected remove(lineId: string): void {
    this.draft.remove(lineId);
  }

  protected onNote(event: Event): void {
    this.store.setNote((event.target as HTMLTextAreaElement).value);
  }

  protected async save(): Promise<void> {
    const result = await this.store.save();
    if (result === null) {
      return;
    }
    if ('saved' in result) {
      this.toast.show({
        title: 'Orden modificada',
        message: `La orden #${result.saved.orderNumber} se actualizó y cocina verá los cambios.`,
        icon: 'check-circle',
      });
    } else {
      this.toast.show({
        title: 'No se guardaron los cambios',
        message: this.store.error() ?? TAKE_ORDER_MESSAGES.editUnexpected,
        icon: 'bell',
      });
    }
    await this.router.navigate(['/orders', 'detail', this.id()]);
  }

  protected async cancel(): Promise<void> {
    this.store.cancel();
    await this.router.navigate(['/orders', 'detail', this.id()]);
  }
}
