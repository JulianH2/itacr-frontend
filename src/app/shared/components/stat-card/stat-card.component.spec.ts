import { renderComponent, rootElement } from '@shared/testing/render';
import { StatCardComponent } from './stat-card.component';

describe('StatCardComponent', () => {
  it('should show the caption when it has one', async () => {
    // Act
    const fixture = await renderComponent(StatCardComponent, {
      label: 'Activos',
      value: 5,
      icon: 'bell',
      caption: 'En cocina o en mesa',
    });

    // Assert
    expect(rootElement(fixture).querySelector('.stat__caption')?.textContent).toBe(
      'En cocina o en mesa',
    );
  });

  it('should leave the caption out when it has none', async () => {
    // Act
    const fixture = await renderComponent(StatCardComponent, {
      label: 'Activos',
      value: 5,
      icon: 'bell',
    });

    // Assert
    expect(rootElement(fixture).querySelector('.stat__value')?.textContent).toBe('5');
    expect(rootElement(fixture).querySelector('.stat__caption')).toBeNull();
  });
});
