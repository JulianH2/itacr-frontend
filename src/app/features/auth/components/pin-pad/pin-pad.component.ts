import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { PIN_LENGTH } from '@core/auth/auth.models';

const DIGIT_PATTERN = /^\d$/;

@Component({
  selector: 'app-pin-pad',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './pin-pad.component.html',
  styleUrl: './pin-pad.component.scss',
  host: {
    role: 'group',
    'aria-label': 'Teclado para capturar el PIN',
    tabindex: '0',
    '(keydown)': 'onKeydown($event)',
  },
})
export class PinPadComponent {
  readonly value = model('');
  readonly disabled = input(false);

  protected readonly digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  protected readonly slots = computed(() =>
    Array.from({ length: PIN_LENGTH }, (_, index) => index < this.value().length),
  );

  protected append(digit: string): void {
    if (this.disabled() || this.value().length >= PIN_LENGTH) {
      return;
    }
    this.value.update((current) => current + digit);
  }

  protected removeLast(): void {
    if (this.disabled()) {
      return;
    }
    this.value.update((current) => current.slice(0, -1));
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (DIGIT_PATTERN.test(event.key)) {
      event.preventDefault();
      this.append(event.key);
    } else if (event.key === 'Backspace') {
      event.preventDefault();
      this.removeLast();
    }
  }
}
