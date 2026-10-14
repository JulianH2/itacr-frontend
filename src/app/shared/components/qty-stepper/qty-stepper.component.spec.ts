import { renderComponent, rootElement } from '@shared/testing/render';
import { QtyStepperComponent } from './qty-stepper.component';

describe('QtyStepperComponent', () => {
  it('should disable the minus button when the quantity is at its minimum', async () => {
    // Act
    const fixture = await renderComponent(QtyStepperComponent, {
      subject: 'Papas',
      value: 1,
      min: 1,
    });

    // Assert
    const [minus] = Array.from(rootElement(fixture).querySelectorAll('button'));
    expect(minus?.disabled).toBe(true);
  });

  it('should add one when the plus button is pressed', async () => {
    // Arrange
    const fixture = await renderComponent(QtyStepperComponent, { subject: 'Papas', value: 2 });

    // Act
    const plus = rootElement(fixture).querySelectorAll('button')[1];
    plus?.click();
    await fixture.whenStable();

    // Assert
    expect(fixture.componentInstance.value()).toBe(3);
  });
});
