import { renderComponent, rootElement } from '@shared/testing/render';
import { TableCardComponent } from './table-card.component';

describe('TableCardComponent', () => {
  it('should describe the table with its status and seats when it is rendered', async () => {
    // Act
    const fixture = await renderComponent(TableCardComponent, {
      number: 3,
      status: 'pending',
      seats: 4,
    });

    // Assert
    const button = rootElement(fixture).querySelector('button');
    expect(button?.getAttribute('aria-label')).toBe('Mesa 3, pedido pendiente, 4 lugares');
    expect(button?.classList).toContain('table-card--pending');
  });

  it('should emit selected when the card is pressed', async () => {
    // Arrange
    const fixture = await renderComponent(TableCardComponent, {
      number: 1,
      status: 'free',
      seats: 2,
    });
    let selections = 0;
    fixture.componentInstance.selected.subscribe(() => (selections += 1));

    // Act
    rootElement(fixture).querySelector('button')?.click();

    // Assert
    expect(selections).toBe(1);
  });
});
