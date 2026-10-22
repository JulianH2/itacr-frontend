import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, InjectionToken, signal } from '@angular/core';

export type ThemeName = 'light' | 'dark';

export const THEME_STORAGE = new InjectionToken<Storage>('THEME_STORAGE', {
  providedIn: 'root',
  factory: () => localStorage,
});

export const THEME_STORAGE_KEY = 'itacr.theme';

/** Browser UI colors (meta theme-color) per theme: the wine header and the dark page background. */
export const THEME_COLORS: Readonly<Record<ThemeName, string>> = {
  light: '#5a3e37',
  dark: '#1c1715',
};

const DARK_QUERY = '(prefers-color-scheme: dark)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function isThemeName(value: unknown): value is ThemeName {
  return value === 'light' || value === 'dark';
}

interface ViewTransitionDocument {
  startViewTransition?: (update: () => void) => unknown;
}

/**
 * Light/dark theme. Follows the system until the user picks one with the header button; the
 * choice is saved and applied before the first render by public/theme-init.js.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storage = inject(THEME_STORAGE);
  private readonly prefersDark = this.matchMedia(DARK_QUERY);

  private readonly choice = signal<ThemeName | null>(this.read());
  private readonly systemDark = signal(this.prefersDark?.matches ?? false);

  /** The theme being shown: the saved choice, or the system preference. */
  readonly theme = computed<ThemeName>(
    () => this.choice() ?? (this.systemDark() ? 'dark' : 'light'),
  );

  constructor() {
    this.prefersDark?.addEventListener('change', (event) => this.systemDark.set(event.matches));
  }

  toggle(): void {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  set(theme: ThemeName): void {
    const apply = (): void => this.apply(theme);
    const doc = this.document as unknown as ViewTransitionDocument;
    const reducedMotion = this.matchMedia(REDUCED_MOTION_QUERY)?.matches ?? false;

    // A view transition cross-fades the whole page (opacity only). Without it, switch instantly.
    if (doc.startViewTransition && !reducedMotion) {
      doc.startViewTransition(apply);
    } else {
      apply();
    }
  }

  private apply(theme: ThemeName): void {
    this.choice.set(theme);
    this.document.documentElement.setAttribute('data-theme', theme);
    this.syncThemeColor(theme);
    try {
      this.storage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Storage can be blocked (private mode); the choice still applies for this visit.
    }
  }

  private syncThemeColor(theme: ThemeName): void {
    const metas = this.document.querySelectorAll('meta[name="theme-color"]');
    metas.forEach((meta) => {
      meta.setAttribute('content', THEME_COLORS[theme]);
      meta.removeAttribute('media');
    });
  }

  private read(): ThemeName | null {
    try {
      const saved = this.storage.getItem(THEME_STORAGE_KEY);
      return isThemeName(saved) ? saved : null;
    } catch {
      return null;
    }
  }

  private matchMedia(query: string): MediaQueryList | null {
    const view = this.document.defaultView;
    return view?.matchMedia ? view.matchMedia(query) : null;
  }
}
