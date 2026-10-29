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
| Offline data   | IndexedDB (orders queue), synced when the connection comes back                      |
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

### Waiter dashboard (HU_08)

`/orders` lists the orders of the signed-in waiter that are not delivered (`GET /orders/active`), with the counters Activos, Listos and Pendientes (orders still on the device waiting for the connection) and a filter by Todos, En cocina and Listos. The list is asked again every 15 seconds only while the page is visible, and right away when the tab comes back to the front. With `useMockApi: true` it lists the orders created in the same session.

### Delivering an order (HU_10)

In the detail of an order (`/orders/detail/:id`) a waiter sees **Marcar como entregado** only while the order is **Listo** (`POST /orders/{id}/deliver`); in any other status, and for a manager, the option is not there. After delivering, the order leaves the active lists and the detail shows the time of each stage and the total time of the service. If the API refuses it (for example, another waiter already delivered it), the message of the API is shown and the detail refreshes. The pickup orders of customers that are ready (`GET /orders/pickups/ready`) appear on the dashboard as **Para recoger (listos)**, because no waiter took them. With `useMockApi: true` no order reaches Listo, so the button never shows in the mock.

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
│   ├── ARCHITECTURE.md
│   └── CODING_STANDARDS.md
├── public/                   # Static files: manifest, icons, favicon
├── src/
│   ├── app/
│   │   ├── modules/          # One lazy-loaded folder per module, one subfolder per screen
│   │   │   ├── home/home-page/                # Landing screen with "Acceso Personal" (/)
│   │   │   ├── identity/login/                # Staff login, role redirect, and logout (/login)
│   │   │   ├── catalog/product-list/          # Products, combos, categories (/catalog)
│   │   │   ├── orders/take-order/             # Waiter and pickup orders, offline queue (/orders)
│   │   │   ├── kitchen/kitchen-board/         # Kitchen Display System (/kitchen)
│   │   │   ├── tracking/tracking-page/        # Order tracking and notifications (/tracking)
│   │   │   └── manager/dashboard-page/        # Manager metrics (/manager)
│   │   ├── shared/           # Code used by several modules: auth, guards, interceptors, mocks, state, components
│   │   ├── app.config.ts     # Providers: router, HttpClient, service worker
│   │   ├── app.routes.ts     # One lazy route per screen
│   │   └── app.ts            # App shell (toolbar + router outlet)
│   ├── environments/         # Build-time configuration (API URL, SignalR hub URL)
│   ├── index.html
│   ├── index.production.html # index.html plus the production CSP
│   ├── index.qa.html         # index.html plus the QA CSP
│   └── styles.scss           # Angular Material theme and global styles
├── ngsw-config.json          # Service worker caching strategies
├── release-please-config.json # Release automation (with .release-please-manifest.json)
├── angular.json
└── package.json
```

## Environment variables

Angular bundles its configuration at build time from `src/environments/`:

| File                                          | Used by                                                         |
| --------------------------------------------- | --------------------------------------------------------------- |
| `src/environments/environment.development.ts` | `ng serve`, `ng test`                                           |
| `src/environments/environment.ts`             | `npm run build` (production, deployed from `main`)              |
| `src/environments/environment.qa.ts`          | `npm run build:qa` (QA, deployed from `release`; see [QA](#qa)) |

The keys are defined by the `AppEnvironment` interface and documented in [.env.example](.env.example). Everything in these files is public once built, so **never put secrets in them**.

### Simulated API (development only)

While an endpoint does not exist in itacr-backend yet, `useMockApi: true` in `environment.development.ts` makes `src/app/shared/mocks/mock-auth.interceptor.ts` answer the auth calls with test data that follows the API contract. Set it to `false` to call the real backend. Production builds never use it.

The pickup flow of a customer (`/pickup`) also has its own mock, `MockPickupApiService`: it validates nothing the browser did not already check, refuses a third active order of the same phone with a `409`, and moves each order one step every 12 seconds (Recibido, En preparación, Listo, Entregado) so the whole flow can be seen without a kitchen. Open `/catalog` without signing in, add products, and the cart leads to `/pickup/summary`.

The kitchen board (`/kitchen`) has its own mock, `MockKitchenApiService`, chosen by the same flag: it returns orders of different ages so the three timer colors show up, and adds a new order every few polls to hear the alert. With the flag on, log in as Cocina or Gerente and open `/kitchen`. The real board calls `GET /kitchen/queue` every 5 seconds and the service worker never caches it.

A tap on a card moves the order one step (`POST /orders/{id}/status`): the card changes column at once and goes back with a message if the API refuses. For 6 seconds the board offers **Deshacer** (`POST /orders/{id}/status/undo`); the API accepts it for 15. The waiter sees the change in the order detail (`/orders/detail/:id`, `GET /orders/{id}`, refreshed every 10 seconds), opened from the confirmation or from **Últimos pedidos** on the dashboard (`GET /orders/recent`). The mock kitchen remembers the taps, but the mock orders of the waiter stay in New, because the two mocks do not share data.

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

## Product photos

The 18 photos of the menu live in `public/assets/images/products/`, one per seeded product, named after it without accents and in kebab case (`combo-clasico.webp`, `refresco-de-lima-limon.webp`). They match the `ImageUrl` of the products in `database/` of itacr-backend (`/assets/images/products/<name>.webp`).

- **Format:** WebP, cropped to 4:3 and resized to 800 × 600 pixels, **under 100 KB each**. To replace one, keep the name and the size.
- **Offline:** the service worker prefetches `/assets/images/products/**` (`ngsw-config.json`), so the photos work without a connection after the first visit.
- **Credits:** every photo comes from Wikimedia Commons under a license that allows its use here. The author, source, and license of each one are in [CREDITS.md](public/assets/images/products/CREDITS.md), which is also served with the app.
- With `useMockApi: true` the mock catalog uses the same files.

## Production

The PWA runs on Azure App Service `app-itacr-frontend-prod` (Linux, Node LTS, plan `asp-itacr-prod-westus` shared with the backend, resource group `rg-itacr-prod-westus`). App Service only serves the files of `dist/itacr-frontend/browser`, plus `server.cjs` (the source is `server/server.cjs`, which the deploy copies next to `index.html`), with the startup command:

```
node /home/site/wwwroot/server.cjs
```

`server.cjs` is a small server without dependencies. It answers every unknown path without an extension with `index.html`, so routes such as `/login` work after a reload, and it sends the security headers on every answer: `Content-Security-Policy: frame-ancestors 'none'` and `X-Frame-Options: DENY`, so no other site can put the app in a frame (clickjacking, CWE-1021, ITACR-57). `pm2 serve`, the previous startup command, cannot send headers. Check it after a deploy with `curl -I https://<frontend domain>/`: both headers must be there. Its tests are `npm run test:server`.

| URL      | Value                                                                                |
| -------- | ------------------------------------------------------------------------------------ |
| Frontend | `https://app-itacr-frontend-prod-hchjfvaadffrhre3.westus-01.azurewebsites.net`       |
| API      | `https://app-itacr-backend-prod-b3hvcggncghafbgp.westus-01.azurewebsites.net/api/v1` |

- Azure generates the domains with a unique suffix; they are shown in each App Service > Overview > **Default domain**. `src/environments/environment.ts` uses the backend one for `apiBaseUrl` and `kitchenHubUrl`.
- The backend only accepts this frontend if its domain is in the backend `Cors__Origins__0` setting (itacr-backend README, "Production settings").
- **Content Security Policy:** `frame-ancestors` is ignored in a `<meta>` tag, so it goes in the header of `server.cjs`. The other directives stay in the page: the production build uses `src/index.production.html` (set in `angular.json`), which is `src/index.html` plus a CSP `<meta>` tag that only allows scripts from the site itself and connections to the backend. **Keep the three index files in sync** (`index.html`, `index.production.html`, `index.qa.html`), and add any new external origin (API, fonts, images) to both CSPs.

### QA

`release` deploys to its own environment, created in ITACR-43, so a sprint is tested before it reaches production:

| URL      | Value                                                   |
| -------- | ------------------------------------------------------- |
| Frontend | `https://app-itacr-frontend-qa.azurewebsites.net`       |
| API      | `https://app-itacr-backend-qa.azurewebsites.net/api/v1` |

- `npm run build:qa` runs `ng build --configuration production,qa`: the production settings plus `environment.qa.ts` and `index.qa.html`, whose CSP allows the QA API instead of the production one.
- The QA database has the four test employees of the table above, so the same logins work there.
- `.github/workflows/deploy.yml` deploys `main` to `app-itacr-frontend-prod` with `AZURE_FRONTEND_PUBLISH_PROFILE` and `release` to `app-itacr-frontend-qa` with `AZURE_FRONTEND_QA_PUBLISH_PROFILE`. From any other branch it does nothing.

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

## Code quality analysis (Xygeni)

The code is analyzed with [Xygeni](https://in.xygeni.io) (free plan) for code quality and security: quality findings, vulnerable dependencies, exposed secrets, and workflow risks (ITACR-50).

- **Installation (once, repository owner):** sign in to in.xygeni.io with GitHub, install the Xygeni GitHub App on `JulianH2`, and import `JulianH2/itacr-frontend` in **Manage Scans**. Create an API token in Xygeni and save it as the repository secret `XYGENI_TOKEN` (Settings > Secrets and variables > Actions); never commit it.
- **Automatic run:** `.github/workflows/xygeni-scan.yml` runs the Xygeni scanner on every PR into `sprint-*`, `develop`, `release`, and `main`, every night, and by hand (**Actions** > **Xygeni Scan** > **Run workflow**). The Xygeni GitHub App also runs scheduled scans. Dependabot PRs skip it: GitHub does not give them the repository secrets, so the scan would fail without `XYGENI_TOKEN`; the nightly scan of `develop` covers those updates after they are merged (ITACR-55).
- **Results:** in.xygeni.io > **Code Quality** and **Risks**, project `JulianH2/itacr-frontend`; the history of runs is in **Scan History**.
- **Exclusions:** none beyond build output and dependencies (`bin/`, `obj/`, `node_modules/`); findings are fixed, never hidden.
- GitHub **CodeQL** (Security > Code scanning, default setup with the `security-and-quality` suite) also analyzes every PR.
- **Check dependencies on your machine:** `npm audit` must report 0 vulnerabilities (the findings of Xygeni SCA were fixed this way in ITACR-51); Xygeni results of each run are in its dashboard and in the `Xygeni Scan` check of the PR.

## Database versioning (DbUp)

This repository has no database: the schema is versioned in [itacr-backend](https://github.com/JulianH2/itacr-backend) with [DbUp](https://dbup.readthedocs.io/), through numbered T-SQL scripts in `database/migrations/`, a history in `dbo.SchemaVersions`, and reversal scripts in `database/rollbacks/` (ITACR-52). The PWA only needs the API to run on top of it.

To reproduce the migrator (status, rollback, reapplication) clone itacr-backend and follow the section "Database versioning (DbUp)" of its [README](https://github.com/JulianH2/itacr-backend#database-versioning-dbup); in short, with Docker running:

```bash
docker compose up -d sqlserver
dotnet run --project database/Itacr.Database.Migrator
dotnet run --project database/Itacr.Database.Migrator -- status
dotnet run --project database/Itacr.Database.Migrator -- rollback V005__add_product_is_available.sql
dotnet run --project database/Itacr.Database.Migrator
```

`rollback` only runs in Development. Connection strings are never committed: they live in `dotnet user-secrets` and in GitHub secrets.

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
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): layers, request flow, data access, security, and key decisions
- [docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md)
- [CHANGELOG.md](CHANGELOG.md) (generated by release-please)
- [SECURITY.md](SECURITY.md)
