import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { MemoryStorage } from '@shared/testing/memory-storage';
import { THEME_COLORS, THEME_STORAGE, THEME_STORAGE_KEY, ThemeService } from './theme.service';

describe('ThemeService', () => {
  let storage: MemoryStorage;
  let themeColorMeta: HTMLMetaElement;

  function createService(): ThemeService {
    TestBed.configureTestingModule({ providers: [{ provide: THEME_STORAGE, useValue: storage }] });
    return TestBed.inject(ThemeService);
  }

  beforeEach(() => {
    storage = new MemoryStorage();
    themeColorMeta = document.createElement('meta');
    themeColorMeta.name = 'theme-color';
    themeColorMeta.content = '#000000';
    themeColorMeta.media = '(prefers-color-scheme: dark)';
    document.head.append(themeColorMeta);
  });

  afterEach(() => {
    themeColorMeta.remove();
    document.documentElement.removeAttribute('data-theme');
  });

  it('should use the saved theme when the user chose one before', () => {
    // Arrange
    storage.setItem(THEME_STORAGE_KEY, 'dark');

    // Act
    const service = createService();

    // Assert
    expect(service.theme()).toBe('dark');
  });

  it('should ignore a saved value that is not a theme when the storage was edited by hand', () => {
    // Arrange
    storage.setItem(THEME_STORAGE_KEY, 'sepia');

    // Act
    const service = createService();

    // Assert
    expect(['light', 'dark']).toContain(service.theme());
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('should switch to dark and save it when the current theme is light', () => {
    // Arrange
    storage.setItem(THEME_STORAGE_KEY, 'light');
    const service = createService();

    // Act
    service.toggle();

    // Assert
    expect(service.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('should sync the browser theme-color when the theme changes', () => {
    // Arrange
    const service = createService();

    // Act
    service.set('dark');

    // Assert
    expect(themeColorMeta.getAttribute('content')).toBe(THEME_COLORS.dark);
    expect(themeColorMeta.hasAttribute('media')).toBe(false);
  });

  it('should still apply the theme when the storage is blocked', () => {
    // Arrange
    const blocked = new MemoryStorage();
    blocked.setItem = () => {
      throw new DOMException('blocked', 'SecurityError');
    };
    storage = blocked;
    const service = createService();

    // Act
    service.set('dark');

    // Assert
    expect(service.theme()).toBe('dark');
    expect(TestBed.inject(DOCUMENT).documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
