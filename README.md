# itacr-frontend

**ITACR** is a Progressive Web App (PWA) for managing fast-food restaurants in Mexico. Waiters take orders from their phone or tablet (even offline), customers place pickup orders, the kitchen works from a Kitchen Display System (KDS), and managers review metrics.

This repository contains the frontend: the Angular PWA. The backend (NestJS API and PostgreSQL database) lives in [itacr-backend](https://github.com/JulianH2/itacr-backend).

> Course project: Progressive Web Applications, Universidad Tecnológica de Tula-Tepeji (UTTT), group 10IDGS-G3.

## Tech stack

| Area           | Technology                                                                           |
| -------------- | ------------------------------------------------------------------------------------ |
| Framework      | Angular 22 (standalone components, signals, zoneless, strict TypeScript)             |
| UI             | Angular Material 3 (custom red/orange theme), SCSS                                   |
| PWA            | `@angular/pwa` (Angular Service Worker), Web App Manifest                            |
| Offline data   | IndexedDB (orders queue) + Background Sync                                           |
| Real time      | Socket.IO client (KDS updates)                                                       |
| Notifications  | Push API with VAPID keys                                                             |
| Tests          | Vitest + jsdom via `ng test`                                                         |
| Quality        | ESLint (angular-eslint, typescript-eslint), Prettier, Husky, lint-staged, commitlint |
| CI and release | GitHub Actions, Dependabot, release-please                                           |

## Prerequisites

- **Node.js 24 LTS** (see `.nvmrc`) and npm 11
- Git
- A Chromium-based browser for PWA and offline testing
- [itacr-backend](https://github.com/JulianH2/itacr-backend) running locally for features that need data

## Getting started

```bash
git clone https://github.com/JulianH2/itacr-frontend.git
cd itacr-frontend
npm ci
npm start
```

Open `http://localhost:4200`. The dev server reloads on every change.

### Testing the PWA and offline mode

The service worker is **disabled** in development (`ng serve`). To test it:

```bash
npm run build
npx http-server -p 8080 -c-1 dist/itacr-frontend/browser
```

Open `http://localhost:8080`, then use DevTools > Application > Service workers, and DevTools > Network > **Offline**.

## npm scripts

| Script                 | Description                                                   |
| ---------------------- | ------------------------------------------------------------- |
| `npm start`            | Dev server at `http://localhost:4200`                         |
| `npm run build`        | Production build with service worker in `dist/itacr-frontend` |
| `npm run watch`        | Development build in watch mode                               |
| `npm test`             | Run unit tests once (Vitest)                                  |
| `npm run test:watch`   | Run unit tests in watch mode                                  |
| `npm run lint`         | Lint TypeScript and templates with ESLint                     |
| `npm run lint:fix`     | Lint and auto-fix                                             |
| `npm run format`       | Format every file with Prettier                               |
| `npm run format:check` | Check formatting (used by CI)                                 |

## Folder structure

```
itacr-frontend/
├── .github/                  # CI and release-please workflows, Dependabot, PR and issue templates, CODEOWNERS
├── .husky/                   # Git hooks: pre-commit (lint-staged), commit-msg (commitlint)
├── docs/
│   └── CODING_STANDARDS.md
├── public/                   # Static files: manifest.webmanifest, icons, favicon
├── src/
│   ├── app/
│   │   ├── core/             # Singletons: guards, interceptors, services, models
│   │   ├── shared/           # Reusable presentational components, pipes, directives
│   │   ├── features/         # One lazy-loaded folder per epic
│   │   │   ├── auth/         # Staff access and accounts (/login)
│   │   │   ├── catalog/      # Products, combos, categories (/catalog)
│   │   │   ├── orders/       # Waiter and pickup orders, offline queue (/orders)
│   │   │   ├── kitchen/      # Kitchen Display System (/kitchen)
│   │   │   ├── tracking/     # Order tracking and notifications (/tracking)
│   │   │   └── manager/      # Manager metrics (/manager)
│   │   ├── app.config.ts     # Providers: router, HttpClient, service worker
│   │   ├── app.routes.ts     # Lazy routes for every feature
│   │   └── app.ts            # App shell (toolbar + router outlet)
│   ├── environments/         # Build-time configuration (API URL, socket URL, VAPID key)
│   ├── index.html
│   └── styles.scss           # Angular Material theme and global styles
├── ngsw-config.json          # Service worker caching strategies
├── release-please-config.json # Release automation (with .release-please-manifest.json)
├── angular.json
└── package.json
```

## Environment variables

Angular bundles its configuration at build time from `src/environments/`:

| File                                          | Used by                 |
| --------------------------------------------- | ----------------------- |
| `src/environments/environment.development.ts` | `ng serve`, `ng test`   |
| `src/environments/environment.ts`             | `ng build` (production) |

The keys are defined by the `AppEnvironment` interface and documented in [.env.example](.env.example). Everything in these files is public once built, so **never put secrets in them**.

Service worker caching (`ngsw-config.json`):

| Data group       | URLs                                                       | Strategy                                        |
| ---------------- | ---------------------------------------------------------- | ----------------------------------------------- |
| `catalog-api`    | `/api/v1/products`, `/api/v1/categories`, `/api/v1/combos` | `freshness` (network first, 3 s timeout, 1 day) |
| `product-images` | `/uploads/**`                                              | `performance` (cache first, 7 days)             |

In production, the API must be served on the same origin (reverse proxy to `/api/v1` and `/uploads`) for these rules to apply.

## Branching model

```
personal branches                    sprint            integration     QA/staging      production

feature/ITACR-7-pin-login --+
fix/ITACR-9-order-total ----+--PR--> sprint-01 --PR--> develop --PR--> release --PR--> main --> vX.Y.Z tag
docs/ITACR-29-readme -------+                             ^               ^             |      (release-please)
                                                          |               |             |
                                                          +---------------+-back-merge--+

hotfix/ITACR-N-description (from main) --PR--> main, then back-merge main into release and develop
```

- `main` (production), `release` (QA/staging), and `develop` (integration, default branch) are protected: PR required, 1 approval, green CI, no direct or force pushes.
- `sprint-XX` is created from `develop` every Monday and only receives PRs from personal branches.
- Personal branches: `<type>/ITACR-<N>-<short-description>`, one per Jira issue, created from `sprint-XX` and deleted after merge. `type` is `feature`, `fix`, `docs`, `refactor`, `test`, or `chore`.
- Every Friday: `sprint-XX` → `develop` → `release` (QA) → `main`. release-please then creates the version tag (`v0.1.0`, `v0.2.0`, ...), `CHANGELOG.md`, and the GitHub Release, and `main` is back-merged into `release` and `develop`.
- CI validates that each PR comes from an allowed branch.

Full workflow and sprint close checklist: [CONTRIBUTING.md](CONTRIBUTING.md).

## Commit convention

```
type(scope): short description (ITACR-N)
feat(auth): add 4-digit pin validation (ITACR-7)
```

Enforced by commitlint. Types, scopes, and details are in [CONTRIBUTING.md](CONTRIBUTING.md#3-commit-convention).

## Team

| Member                          | GitHub                                             |
| ------------------------------- | -------------------------------------------------- |
| José Julián Hernández Hernández | [@JulianH2](https://github.com/JulianH2)           |
| José Guillermo Rangel Hernández | [@GuillermoRH19](https://github.com/GuillermoRH19) |

Instructor: Juan Carlos Benítez Reyes. The Scrum Master role rotates every sprint.

## Project management

- Jira project **ITACR**: `https://<your-site>.atlassian.net/jira/software/projects/ITACR/boards` (placeholder: replace with the real board URL)
- Sprints: weekly, Monday to Friday. Sprint 1: 2026-09-28 to 2026-10-02.

## Related documents

- [CONTRIBUTING.md](CONTRIBUTING.md): daily workflow, sprints, reviews, Definition of Done
- [docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md)
- [CHANGELOG.md](CHANGELOG.md) (generated by release-please)
- [SECURITY.md](SECURITY.md)
