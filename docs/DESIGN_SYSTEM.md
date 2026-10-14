# Design system

The visual reference is the **ITACR — UI UX Kit** mockup (31 sheets: foundations, components, patterns and every screen on phone and desktop). It lives outside this repo, in `ITACAR/Docs/maqueta/`, and is not committed. The mockup wins over any opinion: if the code and the mockup disagree, change the code.

## Tokens

`src/styles/tokens.css` is the single source of truth. It has three layers:

1. **Palette** (`--palette-*`): the brand colors from sheet 1/3. Components never use them directly.
2. **Semantic** (`--color-*`, `--space-*`, `--radius-*`, `--shadow-*`, `--duration-*`): what components use. The dark theme redefines only this layer, with the same names.
3. **Material bridge** (`--mat-sys-*`): maps the semantic layer onto Angular Material, so Material buttons, fields and overlays take the same colors, radii and type scale.

Rules:

- No hex colors or `rgb()` in components. Use `--color-*`. (`theme.service.ts` repeats two hex values for `<meta name="theme-color">`; keep them equal to `--color-nav-bg` and `--color-bg` of each theme.)
- Spacing is an 8px grid: `--space-1` (8) to `--space-8` (64). `--space-half` (4) and `--space-1-5` (12) are the only off-grid steps, for icon gaps and pill padding.
- Radii: cards 12 (`--radius-card`), buttons and inputs 8 (`--radius-control`), pills 999 (`--radius-pill`). Two shadows: `--shadow-subtle` for cards, `--shadow-medium` for floating things.
- Type is Inter: 32/24/18 at 600 for headings, 16 at 400/500 for body, 13 at 500 for captions. Use `font: var(--mat-sys-…)` plus `font-family: var(--font-family)` in every text rule. Use `.tabular` for prices, order numbers and timers.
- Sage (`--color-success*`) is for positive states only: success, "ready", live connection. Never decoration. For sage **text** on the page background use `--color-success-strong` (plain sage is 4.4:1 on cream).
- Form controls use `--color-border-strong` (3:1). `--color-border` is for decorative card edges.
- Touch targets are at least `--touch-target` (44px).

## Themes

The app follows `prefers-color-scheme` until the user taps the header button; the choice is saved in `localStorage` as `itacr.theme`. `public/theme-init.js` applies it before the first render (it is an external script because the QA and production CSP only allow `script-src 'self'`). `ThemeService` switches it at runtime, keeps `<meta name="theme-color">` in sync and cross-fades the page with the View Transitions API when the browser has it. The manifest has one static `theme_color` (the light wine); browsers use the meta tag for the dark one.

Dark contrast was computed (WCAG AA for text, 3:1 for controls), not eyeballed. When you change a color, check it in both themes.

## Components

Shared presentational components live in `src/app/shared/components/` (standalone, `OnPush`, signals): `app-icon` (outline set, 1.75px stroke), `app-status-badge`, `app-avatar`, `app-table-card`, `app-stat-card`, `app-empty-state`, `app-state-page`, `app-segmented-control`, `app-qty-stepper`, `app-option-row`, `app-step-indicator`, `app-breadcrumb`, `app-main-nav`, `app-connection-pill`, `app-theme-toggle`, `app-toast-host`. `app-qty-stepper`, `app-option-row`, `app-step-indicator` and `app-stat-card` are ready for the order wizard, edit order and reports stories.

Buttons are Angular Material buttons restyled in `src/styles/_material.scss`: `mat-flat-button` is primary, `mat-stroked-button` secondary, `mat-button` text.

## Motion

Subtle and CSS only (`transform` and `opacity`, 150–250ms, the `--duration-*` tokens): press and hover on controls, one staggered entrance when a product grid loads, the page cross-fade on route changes, the status badge pop when an order changes status, cards settling into a kitchen column, and the theme cross-fade. Hover styles live in `@media (hover: hover)`. `prefers-reduced-motion` sets the duration tokens to ~0 and disables the view transitions.

## Checking a screen

Compare it with its mockup sheet on a 390px and a 1280px viewport, in both themes. Do not copy the mockup's own defects (headings that wrap to two lines, overlapping text in the sidebar footer, the letter-spaced "Confirmar" placeholder).
