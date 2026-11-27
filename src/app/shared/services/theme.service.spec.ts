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

  describe('with the media queries of the browser', () => {
    let listeners: ((event: MediaQueryListEvent) => void)[];
    let prefersDark: boolean;
    let reducedMotion: boolean;

    beforeEach(() => {
      listeners = [];
      prefersDark = true;
      reducedMotion = false;
      vi.stubGlobal('matchMedia', (query: string) => ({
        matches: query.includes('reduced-motion') ? reducedMotion : prefersDark,
        addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) =>
          listeners.push(listener),
      }));
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      delete (document as { startViewTransition?: unknown }).startViewTransition;
    });

    it('should follow the system when nothing was saved and the system is dark', () => {
      // Act
      const service = createService();

      // Assert
      expect(service.theme()).toBe('dark');
    });

    it('should follow the system when its preference changes', () => {
      // Arrange
      const service = createService();

      // Act
      listeners.forEach((listener) => listener({ matches: false } as MediaQueryListEvent));

      // Assert
      expect(service.theme()).toBe('light');
    });

    it('should switch to light when the current theme is dark', () => {
      // Arrange
      const service = createService();

      // Act
      service.toggle();

      // Assert
      expect(service.theme()).toBe('light');
    });

    it('should cross-fade with a view transition when the browser has them', () => {
      // Arrange
      const startViewTransition = vi.fn((update: () => void) => update());
      Object.assign(document, { startViewTransition });
      const service = createService();

      // Act
      service.set('light');

      // Assert
      expect(startViewTransition).toHaveBeenCalledOnce();
      expect(service.theme()).toBe('light');
    });

    it('should switch instantly when the user asked for reduced motion', () => {
      // Arrange
      reducedMotion = true;
      const startViewTransition = vi.fn();
      Object.assign(document, { startViewTransition });
      const service = createService();

      // Act
      service.set('light');

      // Assert
      expect(startViewTransition).not.toHaveBeenCalled();
      expect(service.theme()).toBe('light');
    });
  });

  it('should follow the system when the storage cannot be read', () => {
    // Arrange
    const blocked = new MemoryStorage();
    blocked.getItem = () => {
      throw new DOMException('blocked', 'SecurityError');
    };
    storage = blocked;

    // Act
    const service = createService();

    // Assert
    expect(service.theme()).toBe('light');
  });
});
