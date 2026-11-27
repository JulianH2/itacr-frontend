import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ThemeName, ThemeService } from '@shared/services/theme.service';
import { renderComponent, rootElement } from '@shared/testing/render';
import { ThemeToggleComponent } from './theme-toggle.component';

describe('ThemeToggleComponent', () => {
  const theme = signal<ThemeName>('light');
  const toggle = vi.fn();

  beforeEach(() => {
    theme.set('light');
    toggle.mockReset();
    TestBed.configureTestingModule({
      providers: [{ provide: ThemeService, useValue: { theme, toggle } }],
    });
  });

  it('should offer the dark theme when the light one is shown', async () => {
    // Act
    const fixture = await renderComponent(ThemeToggleComponent);

    // Assert
    const button = rootElement(fixture).querySelector('button');
    expect(button?.getAttribute('aria-label')).toBe('Cambiar a tema oscuro');
  });

  it('should offer the light theme when the dark one is shown', async () => {
    // Arrange
    theme.set('dark');

    // Act
    const fixture = await renderComponent(ThemeToggleComponent);

    // Assert
    const button = rootElement(fixture).querySelector('button');
    expect(button?.getAttribute('aria-label')).toBe('Cambiar a tema claro');
  });

  it('should switch the theme when it is pressed', async () => {
    // Arrange
    const fixture = await renderComponent(ThemeToggleComponent);

    // Act
    rootElement(fixture).querySelector('button')?.click();

    // Assert
    expect(toggle).toHaveBeenCalledOnce();
  });
});
