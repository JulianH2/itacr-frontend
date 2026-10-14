import { renderComponent, rootElement } from '@shared/testing/render';
import { SegmentedControlComponent } from './segmented-control.component';

describe('SegmentedControlComponent', () => {
  const options = [
    { value: 'waiter', label: 'Mesero' },
    { value: 'kitchen', label: 'Cocina' },
    { value: 'manager', label: 'Gerente' },
  ];

  function press(element: HTMLElement, key: string): void {
    element
      .querySelector('[data-value="waiter"]')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  }

  it('should select the clicked option when the user taps it', async () => {
    // Arrange
    const fixture = await renderComponent(SegmentedControlComponent, {
      options,
      label: 'Rol',
      value: 'waiter',
    });

    // Act
    rootElement(fixture).querySelector<HTMLElement>('[data-value="kitchen"]')?.click();
    await fixture.whenStable();

    // Assert
    expect(fixture.componentInstance.value()).toBe('kitchen');
  });

  it('should move to the next option when the right arrow is pressed', async () => {
    // Arrange
    const fixture = await renderComponent(SegmentedControlComponent, {
      options,
      label: 'Rol',
      value: 'waiter',
    });

    // Act
    press(rootElement(fixture), 'ArrowRight');
    await fixture.whenStable();

    // Assert
    expect(fixture.componentInstance.value()).toBe('kitchen');
  });

  it('should wrap to the last option when the left arrow is pressed on the first', async () => {
    // Arrange
    const fixture = await renderComponent(SegmentedControlComponent, {
      options,
      label: 'Rol',
      value: 'waiter',
    });

    // Act
    press(rootElement(fixture), 'ArrowLeft');
    await fixture.whenStable();

    // Assert
    expect(fixture.componentInstance.value()).toBe('manager');
  });

  it('should let the first option take focus when nothing is selected yet', async () => {
    // Act
    const fixture = await renderComponent(SegmentedControlComponent, {
      options,
      label: 'Rol',
      value: '',
    });

    // Assert
    const tabIndexes = Array.from(
      rootElement(fixture).querySelectorAll('[role="radio"]'),
      (option) => option.getAttribute('tabindex'),
    );
    expect(tabIndexes).toEqual(['0', '-1', '-1']);
  });

  it('should add the test id prefix to every option when one is given', async () => {
    // Act
    const fixture = await renderComponent(SegmentedControlComponent, {
      options,
      label: 'Rol',
      testIdPrefix: 'role-',
    });

    // Assert
    expect(rootElement(fixture).querySelector('[data-testid="role-kitchen"]')).not.toBeNull();
  });
});
