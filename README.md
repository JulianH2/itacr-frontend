# itacr-frontend

**ITACR** is a Progressive Web App (PWA) for managing fast-food restaurants in Mexico. Waiters take orders from their phone or tablet (even offline), customers place pickup orders, the kitchen works from a Kitchen Display System (KDS), and managers review metrics.

This repository contains the frontend: the Angular PWA. The backend (ASP.NET Core API on .NET and Azure SQL database) lives in [itacr-backend](https://github.com/JulianH2/itacr-backend).

> Course project: Progressive Web Applications, Universidad Tecnológica de Tula-Tepeji (UTTT), group 10IDGS-G3.

## Tech stack

| Area           | Technology                                                                           |
| -------------- | ------------------------------------------------------------------------------------ |
| Framework      | Angular 22 (standalone components, signals, zoneless, strict TypeScript)             |
| UI             | Angular Material 3 (custom red/orange theme), SCSS                                   |
| PWA            | `@angular/pwa` (Angular Service Worker), Web App Manifest                            |
| Offline data   | IndexedDB (orders queue) + Background Sync                                           |
| Real time      | SignalR client (`@microsoft/signalr`, KDS updates)                                   |
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
├── public/                   # Static files: manifest, icons, favicon
├── src/
│   ├── app/
│   │   ├── core/             # Singletons: guards, interceptors, services, models
│   │   ├── shared/           # Reusable presentational components, pipes, directives
│   │   ├── features/         # One lazy-loaded folder per epic
│   │   │   ├── home/         # Landing screen with "Acceso Personal" (/)
│   │   │   ├── auth/         # Staff login, role redirect, and logout (/login)
│   │   │   ├── catalog/      # Products, combos, categories (/catalog)
│   │   │   ├── orders/       # Waiter and pickup orders, offline queue (/orders)
│   │   │   ├── kitchen/      # Kitchen Display System (/kitchen)
│   │   │   ├── tracking/     # Order tracking and notifications (/tracking)
│   │   │   └── manager/      # Manager metrics (/manager)
│   │   ├── app.config.ts     # Providers: router, HttpClient, service worker
│   │   ├── app.routes.ts     # Lazy routes for every feature
│   │   └── app.ts            # App shell (toolbar + router outlet)
│   ├── environments/         # Build-time configuration (API URL, SignalR hub URL, VAPID key)
│   ├── index.html
│   ├── index.production.html # index.html plus the production CSP
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

### Simulated API (development only)

While an endpoint does not exist in itacr-backend yet, `useMockApi: true` in `environment.development.ts` makes `src/app/core/mocks/mock-auth.interceptor.ts` answer the auth calls with test data that follows the API contract. Set it to `false` to call the real backend. Production builds never use it.

The simulated employees are the same as the Development test employees seeded by itacr-backend (`docs/database.md`), so the same logins work with both. Every employee's password is `Itacr2026!`, and 5 wrong PINs lock that employee for 15 minutes.

| Employee         | Email                  | PIN    | Role    | Status                                 |
| ---------------- | ---------------------- | ------ | ------- | -------------------------------------- |
| Mesero P.        | `mesero@itacr.test`    | `1111` | Waiter  | Active                                 |
| Cocina P.        | `cocina@itacr.test`    | `2222` | Kitchen | Active                                 |
| Gerente P.       | `gerente@itacr.test`   | `3333` | Manager | Active                                 |
| Mesero Pendiente | `pendiente@itacr.test` | `4444` | Waiter  | Pending (not in the picker; CA4 login) |

Service worker caching (`ngsw-config.json`):

| Data group       | URLs                                                                     | Strategy                                        |
| ---------------- | ------------------------------------------------------------------------ | ----------------------------------------------- |
| `catalog-api-v2` | `/api/v1/catalog/**` and `https://*.azurewebsites.net/api/v1/catalog/**` | `freshness` (network first, 3 s timeout, 1 day) |
| `catalog-api`    | `/api/v1/products`, `/api/v1/categories`, `/api/v1/combos`               | `freshness` (network first, 3 s timeout, 1 day) |
| `product-images` | `/uploads/**`                                                            | `performance` (cache first, 7 days)             |

In production the API is on another domain, so only the data groups that list the full `azurewebsites.net` URL apply there.

## Production

The PWA runs on Azure App Service `app-itacr-frontend-prod` (Linux, Node LTS, plan `asp-itacr-prod-westus` shared with the backend, resource group `rg-itacr-prod-westus`). App Service only serves the files of `dist/itacr-frontend/browser`, with the startup command:

```
pm2 serve /home/site/wwwroot --no-daemon --spa
```

`--spa` answers every unknown path with `index.html`, so routes such as `/login` work after a reload.

| URL      | Value                                                                                |
| -------- | ------------------------------------------------------------------------------------ |
| Frontend | `https://app-itacr-frontend-prod-hchjfvaadffrhre3.westus-01.azurewebsites.net`       |
| API      | `https://app-itacr-backend-prod-b3hvcggncghafbgp.westus-01.azurewebsites.net/api/v1` |

- Azure generates the domains with a unique suffix; they are shown in each App Service > Overview > **Default domain**. `src/environments/environment.ts` uses the backend one for `apiBaseUrl` and `kitchenHubUrl`.
- The backend only accepts this frontend if its domain is in the backend `Cors__Origins__0` setting (itacr-backend README, "Production settings").
- **Content Security Policy:** `pm2 serve` cannot send HTTP headers, so the production build uses `src/index.production.html` (set in `angular.json`), which is `src/index.html` plus a CSP `<meta>` tag that only allows scripts from the site itself and connections to the backend. **Keep both index files in sync**, and add any new external origin (API, fonts, images) to the CSP. A `<meta>` CSP cannot set `frame-ancestors`.

## Branching model

```
personal branches                    sprint            integration     QA/staging      production

feature/ITACR-7-pin-login --+
fix/ITACR-9-order-total ----+--PR--> sprint-01 --PR--> develop --PR--> release --PR--> main --> vX.Y.Z tag
docs/ITACR-29-readme -------+                                             ^             |      (release-please)
                                                                          |             |
                                                                          +-back-merge--+

hotfix/ITACR-N-description (from main) --PR--> main, then the same branch --PR--> develop
```

- `main` (production), `release` (QA/staging), and `develop` (integration, default branch) are protected: PR required, 1 approval, green CI, no direct or force pushes.
- `sprint-XX` is created from `develop` every Monday and only receives PRs from personal branches.
- Personal branches: `<type>/ITACR-<N>-<short-description>`, one per Jira issue, created from `sprint-XX` and deleted after merge. `type` is `feature`, `fix`, `docs`, `refactor`, `test`, or `chore`.
- Every Friday: `sprint-XX` → `develop` → `release` (QA) → `main`. release-please then creates the version tag (`v0.1.0`, `v0.2.0`, ...), `CHANGELOG.md`, and the GitHub Release on `main` (it never runs on or targets other branches), and `main` is back-merged into `release`.
- Hotfixes: `hotfix/ITACR-<N>-<description>` from `main`, PR into `main`, then the same branch into `develop`.
- CI validates that each PR comes from an allowed branch and prints the allowed flow when it does not.

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
