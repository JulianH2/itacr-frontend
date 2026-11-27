import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import type { Product } from '../../models/catalog.models';
import { DRINK_REQUIRED_MESSAGE, SIZE_REQUIRED_MESSAGE } from '../../models/combo-customization';
import { MOCK_COMBO_OPTIONS } from '../../services/mock-catalog.data';
import { ComboCustomizerComponent } from './combo-customizer.component';

const COMBO: Product = {
  id: 'combo-classic',
  categoryId: 'cat-combos',
  name: 'Combo Clásico',
  description: 'Hamburguesa, papas y bebida',
  price: 119,
  imageUrl: null,
  isCombo: true,
};

const GRANDE = MOCK_COMBO_OPTIONS.find((option) => option.name === 'Grande');
const CHEESE = MOCK_COMBO_OPTIONS.find((option) => option.name === 'Queso extra');

/** The handlers the buttons of the template call, reached directly for the states the buttons never allow. */
interface Customizer {
  step(): number;
  error(): string | null;
  choice(): { extraIds: readonly string[] };
  chooseSize(id: string): void;
  toggleExtra(id: string, checked: boolean): void;
  confirm(): void;
}

describe('ComboCustomizerComponent', () => {
  let fixture: ComponentFixture<ComboCustomizerComponent>;
  let showModal: ReturnType<typeof vi.fn>;

  function customizer(): Customizer {
    return fixture.componentInstance as unknown as Customizer;
  }

  async function render(): Promise<void> {
    fixture = TestBed.createComponent(ComboCustomizerComponent);
    fixture.componentRef.setInput('product', COMBO);
    fixture.componentRef.setInput('options', MOCK_COMBO_OPTIONS);
    await fixture.whenStable();
  }

  async function tap(testId: string): Promise<void> {
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>(`[data-testid="${testId}"]`)
      ?.click();
    await fixture.whenStable();
  }

  beforeEach(() => {
    showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    });
    HTMLDialogElement.prototype.showModal = showModal as unknown as () => void;
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement): void {
      this.removeAttribute('open');
    };
  });

  it('should ask for the drink and stay on its step when the user goes on without it', async () => {
    // Arrange
    await render();
    customizer().chooseSize(GRANDE?.id ?? '');
    await tap('combo-next');

    // Act
    await tap('combo-next');

    // Assert
    expect(customizer().step()).toBe(1);
    expect(customizer().error()).toBe(DRINK_REQUIRED_MESSAGE);
  });

  it('should go back to the size from the drink', async () => {
    // Arrange
    await render();
    customizer().chooseSize(GRANDE?.id ?? '');
    await tap('combo-next');

    // Act
    await tap('combo-back');

    // Assert
    expect(customizer().step()).toBe(0);
    expect(customizer().error()).toBeNull();
  });

  it('should take an extra out again when it is unchecked', async () => {
    // Arrange
    await render();
    const cheese = CHEESE?.id ?? '';
    customizer().toggleExtra(cheese, true);

    // Act
    customizer().toggleExtra(cheese, false);

    // Assert
    expect(customizer().choice().extraIds).toEqual([]);
  });

  it('should send the user to the size when the combo is confirmed without one', async () => {
    // Arrange
    await render();
    const confirmed = vi.fn();
    fixture.componentInstance.confirmed.subscribe(confirmed);

    // Act
    customizer().confirm();

    // Assert
    expect(confirmed).not.toHaveBeenCalled();
    expect(customizer().step()).toBe(0);
    expect(customizer().error()).toBe(SIZE_REQUIRED_MESSAGE);
  });

  it('should send the user to the drink when the combo is confirmed without one', async () => {
    // Arrange
    await render();
    customizer().chooseSize(GRANDE?.id ?? '');

    // Act
    customizer().confirm();

    // Assert
    expect(customizer().step()).toBe(1);
    expect(customizer().error()).toBe(DRINK_REQUIRED_MESSAGE);
  });

  it('should not open the dialog again when it is already open', async () => {
    // Arrange
    const open = vi.spyOn(HTMLDialogElement.prototype, 'open', 'get').mockReturnValue(true);

    // Act
    await render();

    // Assert
    expect(showModal).not.toHaveBeenCalled();
    open.mockRestore();
  });
});
