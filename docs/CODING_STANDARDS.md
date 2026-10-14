# ITACR Coding Standards: itacr-frontend

These standards apply to the frontend (Angular PWA). The backend has its own standards for .NET and the database in `itacr-backend/docs/CODING_STANDARDS.md`; both share the same principles, commit convention, and language policy. Change this file through a Pull Request reviewed by the other team member.

Tooling enforces what it can (TypeScript strict mode, ESLint, Prettier, commitlint, CI). Everything else is checked in code review.

## Table of contents

1. [General](#1-general)
2. [Angular](#2-angular)
3. [Language policy](#3-language-policy)

---

## 1. General

### 1.1 Principles

- Follow **Clean Code** and **SOLID**. Apply **DRY** (don't repeat yourself) and **KISS** (keep it simple): the simplest solution that meets the acceptance criteria wins.
- Write small, single-purpose functions. If a function needs "and" to describe it, split it.
- Prefer **early returns** over nested `if`/`else`.
- No dead code and no commented-out code. Git keeps the history.
- No magic numbers or strings. Use named constants or enums.

```ts
// Bad
if (pin.length !== 4) { ... }

// Good
const PIN_LENGTH = 4;
if (pin.length !== PIN_LENGTH) { ... }
```

### 1.2 TypeScript

- `strict` mode is on. Do not disable it, not even per file.
- Never use `any`. Use `unknown` plus a type guard when the type is truly unknown.
- Explicit return types on public functions and methods.
- Prefer `const` over `let`, and `readonly` for properties and arrays that are not reassigned.
- Use `interface` for data contracts (DTOs, API responses, models). Use `type` for unions and utility types.
- Use `enum` or `as const` objects for closed sets of values (order status, roles). Their values match the strings the API returns.

```ts
export enum OrderStatus {
  Pending = 'Pending',
  InKitchen = 'InKitchen',
  Ready = 'Ready',
  Delivered = 'Delivered',
  Cancelled = 'Cancelled',
}

function isProblemDetails(value: unknown): value is ProblemDetails {
  return typeof value === 'object' && value !== null && 'status' in value && 'title' in value;
}
```

### 1.3 Naming

| Element                           | Convention                | Example                                              |
| --------------------------------- | ------------------------- | ---------------------------------------------------- |
| Variables, functions, methods     | camelCase                 | `totalAmount`, `calculateTotal()`                    |
| Classes, interfaces, types, enums | PascalCase                | `OrdersService`, `CreateOrderRequest`, `OrderStatus` |
| Constants (module level)          | UPPER_SNAKE_CASE          | `MAX_ITEMS_PER_ORDER`, `ORDERS_ROUTES`               |
| File names                        | kebab-case                | `order-summary.component.ts`, `orders.service.ts`    |
| Angular selectors                 | kebab-case, `app-` prefix | `app-order-summary`                                  |
| IndexedDB stores                  | kebab-case plural         | `pending-orders`, `catalog-snapshot`                 |

- Use descriptive English names. No abbreviations except widely known ones: `id`, `url`, `dto`, `api`, `http`, `uuid`, `jwt`.
- Booleans read as questions: `isOffline`, `hasPendingOrders`, `canCancel`.
- File suffixes describe the role: `.component.ts`, `.service.ts`, `.guard.ts`, `.interceptor.ts`, `.pipe.ts`, `.directive.ts`, `.routes.ts`, `.model.ts`, `.spec.ts`. The Angular CLI is configured to generate these suffixes.

### 1.4 Formatting

- **Prettier owns formatting**: 2-space indentation, single quotes, semicolons, 100-character line width, trailing commas, LF line endings.
- The pre-commit hook formats staged files and CI runs `npm run format:check`.
- **Do not debate formatting in code reviews.** If Prettier accepts it, it is correct.

### 1.5 Comments and documentation

- Comments explain **why**, not **what**. If the code needs a comment to explain what it does, rename or refactor it first.
- Use **TSDoc** (`/** ... */`) on public APIs: exported functions, services, and model properties that are not self-explanatory.
- `TODO` comments must reference a Jira key: `// TODO(ITACR-15): retry with exponential backoff`.

### 1.6 Error handling

- Never swallow errors (`catch {}` with nothing inside is forbidden). Handle them, rethrow them, or log them with context.
- Never show stack traces or technical messages to users. The API returns errors as RFC 9457 Problem Details with a Spanish `detail`: show that `detail`, or a generic Spanish message when there is none.
- Handle HTTP errors in one place: the error interceptor turns them into a typed error and a user notification. Components only react to the result.
- Never log tokens, PINs, or personal data to the console.

```ts
export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: unknown) => {
      const message = isHttpProblem(error) ? error.error.detail : GENERIC_ERROR_MESSAGE;
      inject(NotificationService).showError(message);
      return throwError(() => error);
    }),
  );
```

### 1.7 Security (OWASP Top 10 basics)

- **Never put secrets in the frontend.** Everything in `src/environments/` and the bundle is public once built. Only public values (API URL, SignalR hub URL, VAPID public key) go there.
- Validate forms for user experience, but never rely on it: the backend validates every request.
- The staff session (JWT valid for one 12-hour shift, no refresh token) is stored in `localStorage` through `SessionService`, and logout removes all session data. This is a deliberate trade-off:
  - HU_01 requires the session to stay on the device until the employee logs out, and the PWA must keep it while offline. `sessionStorage` and memory lose it when the tab or app closes.
  - An `httpOnly` cookie is not an option: the frontend (`app-itacr-frontend-prod`) and the API (`app-itacr-backend-prod`) are two App Services on different `azurewebsites.net` sites, so browsers treat the API cookie as third-party and block it.
  - The risk of `localStorage` is token theft through XSS. It is mitigated by Angular's built-in sanitization, the rules below, the short token lifetime, and the Content Security Policy `<meta>` tag of the production build (`src/index.production.html`), which only allows scripts from the site itself and connections to the backend.
- Never bind untrusted HTML with `[innerHTML]` or bypass Angular sanitization (`bypassSecurityTrust*`), and never add inline scripts, inline event handlers, or scripts from other domains: the CSP blocks them in production.
- Guard every route by role (waiter, kitchen, manager); the backend enforces the same roles.
- Keep dependencies updated: review Dependabot PRs every week and run `npm audit` before each sprint close.

### 1.8 Testing

- Unit tests for services, guards, interceptors, and business rules (totals, order status transitions, sync logic, validation).
- Test names follow `should <expected behavior> when <condition>`.
- Structure every test as **Arrange, Act, Assert**.
- Write at least one test per acceptance criterion when feasible.
- Tests must be deterministic: no real network (`provideHttpClientTesting`), no real dates (mock the clock), no order dependency between tests.

```ts
it('should reject the PIN when it has fewer than 4 digits', () => {
  // Arrange
  const pin = '123';

  // Act
  const result = validatePin(pin);

  // Assert
  expect(result.isValid).toBe(false);
});
```

---

## 2. Angular

### 2.1 Structure

Follow the official [Angular Style Guide](https://angular.dev/style-guide).

```
src/app/
├── modules/                  # One folder per module, one subfolder per screen, each lazy-loaded
│   ├── identity/login/
│   ├── catalog/product-list/
│   ├── orders/take-order/
│   ├── kitchen/kitchen-board/
│   ├── tracking/tracking-page/
│   ├── home/home-page/
│   └── manager/dashboard-page/
│       ├── <module>.routes.ts
│       ├── <screen>.component.ts   # Routed (smart) component, with its template, styles, and spec
│       └── components/, services/, models/   # Only what that screen uses
├── shared/                   # Code used by more than one module: auth, guards, interceptors, mocks, services, state, components
└── app.routes.ts             # One lazy route per screen
```

- A module never imports from another module. Shared code moves to `shared/`. `eslint-plugin-boundaries` enforces this, and `shared/` never imports from `modules/`.
- Each screen exposes a `<module>.routes.ts` file lazy-loaded from `app.routes.ts` with `loadChildren`.
- Import with the `@modules/*` and `@shared/*` aliases.

### 2.2 Components

- Standalone components only (no `NgModule`).
- `changeDetection: ChangeDetectionStrategy.OnPush` on every component (the CLI is configured to add it).
- **Signals** for local state (`signal`, `computed`, `input`, `output`, `model`).
- New control flow syntax: `@if`, `@for` (always with `track`), `@switch`, `@defer`. Do not use `*ngIf` or `*ngFor`.
- **Smart vs. presentational**:
  - Pages (smart) inject services, read route data, and pass data down.
  - Presentational components only use `input()` and `output()`, with no injected services.
- Components contain **no business logic and no HTTP calls**. That belongs in services.

### 2.3 Forms, HTTP, real time, and routing

- Typed reactive forms (`FormGroup<{ pin: FormControl<string> }>` or `NonNullableFormBuilder`).
- Functional HTTP interceptors (`withInterceptors`) for the auth token and for error handling.
- Functional route guards for role-based access (`waiter`, `kitchen`, `manager`).
- Services return typed `Observable<T>` or signals. Never return `any`.
- API contracts mirror the backend: JSON in camelCase, enums as strings, dates as ISO 8601 UTC strings, lists as `{ data, meta: { page, limit, total } }`.
- Real-time updates use the **SignalR** client (`@microsoft/signalr`) against `environment.kitchenHubUrl`, wrapped in one service per hub that exposes signals or observables, reconnects automatically, and sends the JWT with `accessTokenFactory`.

### 2.4 Subscriptions

- Prefer the `async` pipe or `toSignal()`.
- When a manual `subscribe()` is unavoidable, use `takeUntilDestroyed()`.

### 2.5 PWA and offline

- Version the service worker caches in `ngsw-config.json`: increase `appData.cacheVersion` and the `version` of a data group when its response format changes.
- The catalog (`/api/v1/products`, `/categories`, `/combos`) uses the `freshness` strategy. Product images (`/uploads/**`) use `performance`.
- Orders are **never** cached by the service worker. They go to IndexedDB and are synced with Background Sync.
- IndexedDB naming: database `itacr`, stores in kebab-case plural (`pending-orders`, `catalog-snapshot`). Keep store names in constants in one file.
- Every order gets a client-generated UUID (`crypto.randomUUID()`) that the API uses as an idempotency key, so a retried sync never creates duplicates.
- Never block the UI while offline. Show the connection state and queue the action.
- **Never drop queued orders on logout or when the session expires** (HU_07). The queue lives in IndexedDB, separate from the session. When the token expires, the app asks for the PIN again and the queued orders sync after the employee logs in; logout clears the session but not the queue.
- Never force a reload when a new version is deployed: `AppUpdateService` offers it with an **Actualizar** button, so nothing in progress is lost. Only an unrecoverable service worker state reloads by itself.

### 2.6 Accessibility

- Semantic HTML (`header`, `nav`, `main`, `button` for actions, `a` for navigation).
- Every input has a visible `<label>` or `mat-label`.
- Sufficient color contrast (WCAG AA). Use the `--color-*` tokens from `src/styles/tokens.css` (see `docs/DESIGN_SYSTEM.md`), not hard-coded colors.
- Touch targets of at least **44x44 px**.

---

## 3. Language policy

| What                                            | Language |
| ----------------------------------------------- | -------- |
| Code, identifiers, comments, commit messages    | English  |
| Documentation, PR descriptions, issues          | English  |
| User-facing UI text (labels, buttons, messages) | Spanish  |
| Page titles and notifications                   | Spanish  |
