import { renderComponent, rootElement } from '@shared/testing/render';
import { IconComponent } from './icon.component';
import { ICON_PATHS } from './icon-paths';

describe('IconComponent', () => {
  it('should draw every path of the icon with the 1.75px stroke when it is rendered', async () => {
    // Act
    const fixture = await renderComponent(IconComponent, { name: 'trash' });

    // Assert
    const svg = rootElement(fixture).querySelector('svg');
    expect(svg?.getAttribute('stroke-width')).toBe('1.75');
    expect(rootElement(fixture).querySelectorAll('path')).toHaveLength(ICON_PATHS.trash.length);
  });

  it('should hide the icon from screen readers when it has no label', async () => {
    // Act
    const fixture = await renderComponent(IconComponent, { name: 'home' });

    // Assert
    expect(rootElement(fixture).querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('should expose the label when the icon stands alone', async () => {
    // Act
    const fixture = await renderComponent(IconComponent, { name: 'home', label: 'Inicio' });

    // Assert
    const svg = rootElement(fixture).querySelector('svg');
    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-label')).toBe('Inicio');
  });
});
