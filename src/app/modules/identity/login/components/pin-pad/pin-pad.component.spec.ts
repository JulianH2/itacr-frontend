import { renderComponent, rootElement } from '@shared/testing/render';
import { PinPadComponent } from './pin-pad.component';

describe('PinPadComponent', () => {
  function press(element: HTMLElement, key: string): void {
    element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  }

  function tap(element: HTMLElement, key: string): void {
    element.querySelector<HTMLButtonElement>(`[data-testid="pin-key-${key}"]`)?.click();
  }

  it('should add the digits that are tapped, up to four', async () => {
    // Arrange
    const fixture = await renderComponent(PinPadComponent);
    const element = rootElement(fixture);

    // Act
    for (const digit of ['1', '0', '2', '3', '4']) {
      tap(element, digit);
    }
    await fixture.whenStable();

    // Assert
    expect(fixture.componentInstance.value()).toBe('1023');
    expect(element.querySelectorAll('.pin-pad__slot--filled')).toHaveLength(4);
  });

  it('should take digits and Backspace from the keyboard and ignore other keys', async () => {
    // Arrange
    const fixture = await renderComponent(PinPadComponent);
    const element = rootElement(fixture);

    // Act
    press(element, '5');
    press(element, '6');
    press(element, 'Backspace');
    press(element, 'a');

    // Assert
    expect(fixture.componentInstance.value()).toBe('5');
  });

  it('should remove the last digit with the backspace key of the pad', async () => {
    // Arrange
    const fixture = await renderComponent(PinPadComponent, { value: '98' });

    // Act
    tap(rootElement(fixture), 'backspace');

    // Assert
    expect(fixture.componentInstance.value()).toBe('9');
  });

  it('should change nothing while it is disabled', async () => {
    // Arrange
    const fixture = await renderComponent(PinPadComponent, { value: '12', disabled: true });
    const element = rootElement(fixture);

    // Act
    press(element, '3');
    press(element, 'Backspace');

    // Assert
    expect(fixture.componentInstance.value()).toBe('12');
  });
});
