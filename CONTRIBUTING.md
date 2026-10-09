# Contributing to itacr-frontend

This guide describes how the ITACR team works day to day. Read it together with [docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md).

All commands work in PowerShell, Git Bash, and macOS/Linux terminals, one line at a time. The backend repository, [itacr-backend](https://github.com/JulianH2/itacr-backend), follows the same workflow.

## Table of contents

1. [One-time setup](#1-one-time-setup)
2. [Branching model](#2-branching-model)
3. [Commit convention](#3-commit-convention)
4. [Daily workflow](#4-daily-workflow)
5. [Keeping your branch up to date and resolving conflicts](#5-keeping-your-branch-up-to-date-and-resolving-conflicts)
6. [Pull Requests and code review](#6-pull-requests-and-code-review)
7. [Starting a sprint](#7-starting-a-sprint-monday)
8. [Closing a sprint](#8-closing-a-sprint-friday)
9. [Hotfixes](#9-hotfixes)
10. [Releases and versioning](#10-releases-and-versioning)
11. [Scrum Master responsibilities](#11-scrum-master-responsibilities)
12. [Definition of Done](#12-definition-of-done)
13. [Deployment to Azure](#13-deployment-to-azure)

---

## 1. One-time setup

```bash
git clone https://github.com/JulianH2/itacr-frontend.git
cd itacr-frontend
npm ci                         # installs dependencies and activates the Husky git hooks
git config pull.rebase true    # pulling never creates accidental merge commits
git config user.name "Your Name"
git config user.email "you@example.com"   # use the email linked to your GitHub account
```

`develop` is the default branch, so the clone starts there. Use the Node.js version in `.nvmrc` (24 LTS). Install the VS Code extensions recommended in `.vscode/extensions.json` (ESLint, Prettier, Angular Language Service, EditorConfig).

## 2. Branching model

```
personal branches                    sprint            integration     QA/staging      production

feature/ITACR-7-pin-login --+
fix/ITACR-9-order-total ----+--PR--> sprint-01 --PR--> develop --PR--> release --PR--> main --> vX.Y.Z tag
docs/ITACR-29-readme -------+                                             ^             |      (release-please)
                                                                          |             |
                                                                          +-back-merge--+

hotfix/ITACR-N-description (from main) --PR--> main, then the same branch --PR--> develop
```

### 2.1 Branches

| Branch                           | Role                                                                                   | Created from | Receives PRs from                                |
| -------------------------------- | -------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------ |
| `main`                           | Production. release-please creates the version tag, `CHANGELOG.md`, and GitHub Release | -            | `release`, `hotfix/*`, the release-please PR     |
| `release`                        | Staging / QA. The sprint increment is tested here before production                    | `main`       | `develop`, `main` (back-merge)                   |
| `develop`                        | Integration. **Default branch** on GitHub                                              | `main`       | `sprint-XX`, `hotfix/*` (back-merge), Dependabot |
| `sprint-XX`                      | One per weekly sprint (`sprint-01`, `sprint-02`, ...). Nobody commits to it directly   | `develop`    | Personal branches only                           |
| `<type>/ITACR-<N>-<description>` | Personal work branch, one per Jira issue. Deleted after merge                          | `sprint-XX`  | -                                                |
| `hotfix/ITACR-<N>-<description>` | Urgent fix for production                                                              | `main`       | -                                                |

### 2.2 Protection rules

`main`, `release`, and `develop` are protected (the Scrum Master can also protect `sprint-*`):

- Pull Request required, with **1 approval** from the other team member.
- Required status checks: **`ci`** and **`branch-name`**.
- No direct pushes and no force pushes, for everyone (including admins).

### 2.3 Personal branch names

```
<type>/ITACR-<N>-<short-kebab-description>
```

- `type`: `feature`, `fix`, `docs`, `refactor`, `test`, or `chore`.
- Examples: `feature/ITACR-7-pin-login`, `fix/ITACR-9-order-total`, `docs/ITACR-29-readme`.
- Lowercase kebab-case after the key: letters, numbers, and single hyphens only.
- The `branch-name` CI job rejects PRs whose source branch does not match the flow above.

## 3. Commit convention

[Conventional Commits](https://www.conventionalcommits.org/) in English, imperative mood, lowercase, no final period, with the Jira key at the end:

```
type(scope): short description (ITACR-N)
```

Examples:

```
feat(auth): add 4-digit pin validation (ITACR-7)
fix(orders): prevent duplicate orders on offline sync (ITACR-12)
docs(repo): document the branching model (ITACR-29)
chore(deps): bump @angular/core to 22.2.1
```

| Types                                                                              | Scopes                                                                                   |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert` | `auth` `catalog` `orders` `kitchen` `tracking` `manager` `pwa` `db` `core` `deps` `repo` |

- The Husky `commit-msg` hook runs **commitlint** and rejects messages that do not follow the format. Only the `deps` scope may omit the Jira key.
- The Husky `pre-commit` hook runs **lint-staged**: ESLint `--fix` and Prettier on the staged files only.
- The Jira key in the commit, the branch name, and the PR title links everything to the Jira issue automatically (GitHub for Jira integration).
- Commit types drive the version and the changelog (see [section 10](#10-releases-and-versioning)), so choose them carefully: `feat` is a new feature for users, `fix` is a bug fix.

## 4. Daily workflow

The examples use `sprint-01` and the issue `ITACR-7`.

### 4.1 Start an issue: create your personal branch

From the terminal:

```bash
git switch sprint-01
git pull
git switch -c feature/ITACR-7-pin-login
```

Or from Jira: open the issue, click **Create branch**, choose the `itacr-frontend` repository, set the **base branch to `sprint-01`**, and edit the name to follow `<type>/ITACR-<N>-<description>`. Then:

```bash
git fetch origin
git switch feature/ITACR-7-pin-login
```

Move the Jira issue to **In Progress**.

### 4.2 Work and commit

```bash
npm start                          # http://localhost:4200
git status
git add src/app/modules/identity      # stage specific paths; avoid "git add ." with unknown files
git commit -m "feat(auth): add 4-digit pin validation (ITACR-7)"
```

If commitlint rejects the message, fix it and commit again. Your staged changes are kept.

### 4.3 Push (at least once a day)

```bash
npm test
npm run build
git push -u origin feature/ITACR-7-pin-login     # -u only the first time; later just "git push"
```

### 4.4 Open the PR into the sprint branch

When the issue is ready, open a PR from your branch into `sprint-01` (see [6.1](#61-opening-a-pr)) and move the Jira issue to **In Review**.

### 4.5 After the merge

Click **Delete branch** on the merged PR in GitHub, then clean up locally:

```bash
git switch sprint-01
git pull
git branch -d feature/ITACR-7-pin-login
git fetch --prune
```

## 5. Keeping your branch up to date and resolving conflicts

### 5.1 Bring the latest sprint changes into your branch

Do this when your teammate merged something you need, or when GitHub says your PR has conflicts:

```bash
git switch feature/ITACR-7-pin-login
git fetch origin
git merge origin/sprint-01
```

If there are conflicts:

1. Open the conflicted files in VS Code and choose the correct result (often both changes).
2. Remove every `<<<<<<<`, `=======`, `>>>>>>>` marker.
3. Finish the merge and push:

```bash
git add src/app/app.routes.ts
git commit                         # accept the default merge message
npm test
git push
```

To give up and go back to the state before the merge: `git merge --abort`.

If `package-lock.json` conflicts, take the sprint version and regenerate it with your dependencies:

```bash
git checkout --theirs package-lock.json
npm install
git add package-lock.json
```

### 5.2 Rules

- **Never** use `git push --force` on `sprint-*`, `develop`, `release`, or `main` (protection blocks it anyway).
- Merge the sprint branch into your personal branch; do not rebase a personal branch that is already pushed and under review.

## 6. Pull Requests and code review

### 6.1 Opening a PR

| From                        | To          | Compare URL                                                                                | When                          |
| --------------------------- | ----------- | ------------------------------------------------------------------------------------------ | ----------------------------- |
| `feature/ITACR-7-pin-login` | `sprint-01` | `https://github.com/JulianH2/itacr-frontend/compare/sprint-01...feature/ITACR-7-pin-login` | Issue finished                |
| `sprint-01`                 | `develop`   | `https://github.com/JulianH2/itacr-frontend/compare/develop...sprint-01`                   | Sprint close                  |
| `develop`                   | `release`   | `https://github.com/JulianH2/itacr-frontend/compare/release...develop`                     | Sprint close                  |
| `release`                   | `main`      | `https://github.com/JulianH2/itacr-frontend/compare/main...release`                        | Sprint close, after QA        |
| `hotfix/ITACR-N-...`        | `main`      | `https://github.com/JulianH2/itacr-frontend/compare/main...hotfix/ITACR-N-...`             | Urgent production fix         |
| `hotfix/ITACR-N-...`        | `develop`   | `https://github.com/JulianH2/itacr-frontend/compare/develop...hotfix/ITACR-N-...`          | After the hotfix is in `main` |
| `main`                      | `release`   | `https://github.com/JulianH2/itacr-frontend/compare/release...main`                        | Back-merge after a release    |

Any other combination is rejected by the `branch-name` CI check, which prints the allowed flow in its log.

- **Personal PR title**: a Conventional Commit with the key, e.g. `feat(auth): add pin login (ITACR-7)`.
- **Flow PR title**: `Sprint 01: sprint-01 into develop`, `Sprint 01: develop into release`, `Release: release into main`.
- Fill in every section of the PR template. The other team member is requested automatically through `CODEOWNERS`.

### 6.2 Reviewing a PR

1. Read the description and the linked Jira issue.
2. Check out the PR branch and run it:

   ```bash
   git fetch origin
   git switch feature/ITACR-7-pin-login
   npm ci
   npm run lint
   npm test
   npm run build
   npm start
   ```

3. Test the acceptance criteria in the browser at phone and tablet widths. For offline features, test a production build (see [README: Testing the PWA](README.md#testing-the-pwa-and-offline-mode)) with DevTools > Network > **Offline**.
4. Review the code against the coding standards. Leave comments on **Files changed**. Prefix optional remarks with `nit:`.
5. Submit **Approve** or **Request changes**. Do not approve with failing CI.

### 6.3 Merging

- Merge method: **Create a merge commit**, for every PR. Squash or rebase merges on long-lived branches rewrite commits, which makes `develop`, `release`, and `main` diverge and causes false conflicts at the next sprint close.
- Only merge after 1 approval and green `ci` and `branch-name` checks.
- Delete personal and hotfix branches after merge. Never delete `develop`, `release`, or `main`.

## 7. Starting a sprint (Monday)

The Scrum Master of the new sprint creates the branch from the updated `develop`:

```bash
git switch develop
git pull
git switch -c sprint-02
git push -u origin sprint-02
```

The other team member then runs:

```bash
git fetch origin
git switch sprint-02
```

## 8. Closing a sprint (Friday)

The Scrum Master runs the close; the other team member approves each PR. Replace `01` with the current sprint number.

- [ ] **1. All personal PRs are merged into `sprint-01`.** Check that `is:pr is:open base:sprint-01` returns nothing in the GitHub PR list, then verify the branch locally:

  ```bash
  git fetch origin --prune
  git switch sprint-01
  git pull
  npm ci
  npm run lint
  npm test
  npm run build
  ```

- [ ] **2. PR `sprint-01` → `develop`.** Open `https://github.com/JulianH2/itacr-frontend/compare/develop...sprint-01`, get approval and green checks, and merge with a merge commit.

- [ ] **3. PR `develop` → `release`, then QA on `release`.** Open `https://github.com/JulianH2/itacr-frontend/compare/release...develop` and merge it. Then test the increment:

  ```bash
  git fetch origin
  git switch release
  git pull
  npm ci
  npm run build
  npx http-server -p 8080 -c-1 dist/itacr-frontend/browser
  ```

  Smoke test at `http://localhost:8080`: every route loads, the app installs as a PWA, and the waiter flow works with DevTools > Network > **Offline**. If you find a blocking bug, fix it with a personal branch into `sprint-01` and repeat steps 2 and 3. Do not go on to step 4 until QA passes.

- [ ] **4. PR `release` → `main`, then production deploy.** Open `https://github.com/JulianH2/itacr-frontend/compare/main...release`, get approval, and merge. The push to `main` starts the **Deploy** workflow ([section 13](#13-deployment-to-azure)). Deploy the backend first when both repositories change in the same sprint, so the new frontend never calls endpoints that do not exist yet. When the workflow finishes, open `https://app-itacr-frontend-prod-hchjfvaadffrhre3.westus-01.azurewebsites.net`, log in, and check the sprint's screens.

- [ ] **5. Merge the release-please PR.** A few seconds after step 4, release-please opens (or updates) the PR `chore(repo): release vX.Y.Z` on `main`. Review the version and the generated `CHANGELOG.md`, approve, and merge. release-please then creates the tag `vX.Y.Z` and the GitHub Release.

- [ ] **6. Back-merge `main` into `release`**, so `release` has the version bump and `CHANGELOG.md` before the next sprint. The branch is protected, so this is done with a PR:

  ```bash
  git fetch origin --tags
  git log --oneline origin/release..origin/main    # what the back-merge brings into release
  ```

  Open `https://github.com/JulianH2/itacr-frontend/compare/release...main` and merge it (merge commit). It cannot conflict: `release` was merged into `main` in step 4, so the only new commit is the release-please one.

  `develop` is not back-merged. It never edits `CHANGELOG.md` or the version, and release-please only reads `main`, so the next `develop` → `release` → `main` PRs stay conflict-free.

  Then update your local copies:

  ```bash
  git switch main
  git pull
  git switch release
  git pull
  git tag --list "v*"                              # the new tag must appear
  ```

- [ ] **7. On Monday, create `sprint-02` from `develop`** (see [section 7](#7-starting-a-sprint-monday)).

Keep the old `sprint-XX` branches: they are evidence of each sprint's work for the course. Nobody commits to them after the close.

## 9. Hotfixes

Only for urgent bugs in production (`main`). The example uses `ITACR-35`:

```bash
git switch main
git pull
git switch -c hotfix/ITACR-35-offline-sync-duplicates
# fix + test
git commit -m "fix(orders): prevent duplicate orders on offline sync (ITACR-35)"
git push -u origin hotfix/ITACR-35-offline-sync-duplicates
```

1. Open a PR `hotfix/ITACR-35-offline-sync-duplicates` → `main`, get 1 approval and green checks, and merge it. **Do not delete the branch yet.**
2. release-please opens a patch release PR (for example `v0.1.1`). Merge it.
3. Open a second PR from **the same hotfix branch** into `develop` (`https://github.com/JulianH2/itacr-frontend/compare/develop...hotfix/ITACR-35-offline-sync-duplicates`) and merge it. If it conflicts, bring `develop` into the hotfix branch first:

   ```bash
   git switch hotfix/ITACR-35-offline-sync-duplicates
   git fetch origin
   git merge origin/develop
   # resolve the conflicts, then:
   git add .
   git commit
   git push
   ```

4. Back-merge `main` into `release`, exactly like [step 6 of the sprint close](#8-closing-a-sprint-friday).
5. Delete the hotfix branch.

The current `sprint-XX` receives the fix at the next sprint close. If someone needs it earlier, they merge `origin/develop` into their personal branch ([5.1](#51-bring-the-latest-sprint-changes-into-your-branch), with `origin/develop` instead of `origin/sprint-01`).

## 10. Releases and versioning

Releases are automated with [release-please](https://github.com/googleapis/release-please) (`.github/workflows/release-please.yml`). It runs **only** on pushes to `main` and always opens its PR against `main` (`target-branch: main`); it never runs on or targets `sprint-XX`, `develop`, or `release`:

- It reads the Conventional Commits merged into `main` since the last release, and opens or updates a PR `chore(repo): release vX.Y.Z` with the new version in `package.json` and `.release-please-manifest.json`, and the new `CHANGELOG.md` section.
- Merging that PR creates the tag `vX.Y.Z` and the GitHub Release.
- **Never edit `CHANGELOG.md` or the version by hand, and never create tags manually.**

Version rules (Semantic Versioning, while below 1.0.0):

| Commits since the last release | Bump  | Example         |
| ------------------------------ | ----- | --------------- |
| At least one `feat`            | minor | `0.1.0 → 0.2.0` |
| Only `fix`, `perf`, etc.       | patch | `0.2.0 → 0.2.1` |
| Breaking change (`feat!:`)     | minor | `0.2.1 → 0.3.0` |

A normal sprint therefore produces `v0.1.0`, `v0.2.0`, and so on. For the final release, add the footer `Release-As: 1.0.0` to a commit body on the last sprint:

```bash
git commit -m "chore(repo): prepare final release (ITACR-N)" -m "Release-As: 1.0.0"
```

**One-time setup (repository owner):** release-please must open its PR with a personal access token, because PRs created with the default `GITHUB_TOKEN` do not trigger CI and the required checks would never pass.

1. GitHub > Settings > Developer settings > **Fine-grained tokens** > Generate new token. Repository access: only `itacr-frontend`. Permissions: **Contents: Read and write**, **Pull requests: Read and write**.
2. In the repository: Settings > Secrets and variables > Actions > **New repository secret**, named `RELEASE_PLEASE_TOKEN`.

## 11. Scrum Master responsibilities

The Scrum Master role rotates every sprint. Regarding the repository, the Scrum Master:

- Creates `sprint-XX` from `develop` on Monday and announces it.
- Makes sure personal PRs are reviewed within one working day and that CI failures are fixed quickly.
- Reviews and merges the weekly Dependabot PRs into `develop` (or assigns them).
- On Friday, runs the [sprint close checklist](#8-closing-a-sprint-friday) up to the release and the back-merge into `release`.
- Makes sure every Jira issue in the sprint is in the correct column and that closed issues meet the Definition of Done.

## 12. Definition of Done

An issue is **Done** only when all of the following are true:

- [ ] The acceptance criteria in Jira are met and were tested by the other team member.
- [ ] The code was reviewed and approved in a PR into `sprint-XX`, and the personal branch was deleted.
- [ ] CI is green (`branch-name`, and `ci`: lint, format check, tests, build).
- [ ] It follows [docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md), with at least one test per acceptance criterion when feasible.
- [ ] It works on a phone and a tablet, and offline if the story involves the waiter flow.
- [ ] Docs are updated (README, `.env.example`) if applicable.
- [ ] The Jira issue is moved to **Done**.

## 13. Deployment to Azure

The Azure resources are created by hand in the Azure Portal; this repository never creates or changes them. The PWA is served by App Service `app-itacr-frontend-prod` with `pm2 serve /home/site/wwwroot --no-daemon --spa`.

### 13.1 Deploy workflow

`.github/workflows/deploy.yml` runs on every push to `main` (and by hand with **Run workflow**):

1. `npm ci` with the Node.js version of `.nvmrc`.
2. `npm test`.
3. `npm run build` (production configuration).
4. Checks that `dist/itacr-frontend/browser` contains `index.html` and `ngsw.json`.
5. Deploys that folder to `app-itacr-frontend-prod` with `azure/webapps-deploy` and the `AZURE_FRONTEND_PUBLISH_PROFILE` secret.

If a test or the build fails, nothing is deployed.

**One-time setup (repository owner):** App Service `app-itacr-frontend-prod` > Overview > **Download publish profile**, then paste the whole file into the repository secret `AZURE_FRONTEND_PUBLISH_PROFILE` (Settings > Secrets and variables > Actions). Delete the downloaded file afterwards, and never commit it. Downloading it requires App Service > Configuration > **SCM Basic Auth Publishing Credentials** turned on. If the file is ever exposed, reset it (Overview > **Reset publish profile**) and update the secret.

### 13.2 New versions of the PWA

The service worker keeps the app working offline, so a device can keep an old version after a deploy. To avoid it:

- The service worker downloads the new version in the background, checking `ngsw.json` with a cache-busting parameter.
- `AppUpdateService` then shows "Hay una nueva versión disponible." with an **Actualizar** button. The app does not reload by itself, so a waiter never loses an order in progress; the next reload uses the new version.
- If the service worker reaches an unrecoverable state (for example, files of the old version are gone from the server), the app reloads right away.
- To force the update on a device: reload the page twice, or DevTools > Application > Service workers > **Update**.
