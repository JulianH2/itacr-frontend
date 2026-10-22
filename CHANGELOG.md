# Changelog

## [0.3.0](https://github.com/JulianH2/itacr-frontend/compare/v0.2.0...v0.3.0) (2026-10-22)


### Added

* **catalog:** cap what a customer adds to the order at the pickup limits (ITACR-12) ([cca8a9c](https://github.com/JulianH2/itacr-frontend/commit/cca8a9c4f0cf8bf99380dcd7c5af81a19507e1f8))
* **catalog:** take a customer without a session to the pickup summary (ITACR-12) ([345c742](https://github.com/JulianH2/itacr-frontend/commit/345c742e2c3c49d9edb5e37eac2bc501e74fc6a3))
* **core:** add sprint, develop and release build environments (ITACR-41) ([a69a5a0](https://github.com/JulianH2/itacr-frontend/commit/a69a5a0d3dcd54c3df858d35ec380a609019b295))
* **core:** add the app shell, the 404 and offline pages and the boot splash (ITACR-49) ([cc74fc8](https://github.com/JulianH2/itacr-frontend/commit/cc74fc8bcbd4e0aa31d54527b3f500dc13216b61))
* **core:** add the qa build deployed from release (ITACR-41) ([5527f0c](https://github.com/JulianH2/itacr-frontend/commit/5527f0c223ae79234581e0af85680c685533398e))
* **core:** keep the employee token off the public endpoints (ITACR-12) ([dfe7cf8](https://github.com/JulianH2/itacr-frontend/commit/dfe7cf852cfe4651a24609006af09ac0ecab2f22))
* **core:** let the order draft refuse products over given limits (ITACR-12) ([effb860](https://github.com/JulianH2/itacr-frontend/commit/effb860102628eb5db0cc53ead1e1060687c5921))
* **kitchen:** advance an order with a tap and follow it in its detail (ITACR-11) ([591051f](https://github.com/JulianH2/itacr-frontend/commit/591051f696cd02e7f122181386229e3334eeb4dc))
* **kitchen:** advance an order with a tap on its card and undo it (ITACR-11) ([305dd4b](https://github.com/JulianH2/itacr-frontend/commit/305dd4b0606a98069d4217ba4e8f4326f36fc524))
* **orders:** add pickup api with mock and the receipts of the device (ITACR-12) ([c15a2f3](https://github.com/JulianH2/itacr-frontend/commit/c15a2f310557585927c3514ebde919245356b9e6))
* **orders:** add pickup order models and customer validation (ITACR-12) ([820067a](https://github.com/JulianH2/itacr-frontend/commit/820067a9c162e1034b3fde689d91f617b4ebba8a))
* **orders:** add the order detail with its timeline and the recent orders (ITACR-11) ([ab58d6b](https://github.com/JulianH2/itacr-frontend/commit/ab58d6bf6abc35f72746ccf6a3bf242e31420bbc))
* **orders:** add the pickup order and tracking stores (ITACR-12) ([2013cac](https://github.com/JulianH2/itacr-frontend/commit/2013cac3eb18be60ea08da3562a15fd7fbd10c4c))
* **orders:** add the pickup summary and tracking pages with their own route (ITACR-12) ([2d95378](https://github.com/JulianH2/itacr-frontend/commit/2d953785f49d58c49c933bc837ad1fdbffe57567))
* **orders:** offer the home a link to follow the pickup order (ITACR-12) ([c394cd1](https://github.com/JulianH2/itacr-frontend/commit/c394cd14cc011af4d40a6ede6191dc087e0b4595))
* **orders:** pickup order flow for customers without an account (ITACR-12) ([d65d8c1](https://github.com/JulianH2/itacr-frontend/commit/d65d8c15ccd6867fb18ec2a730477e467333fca6))


### Fixed

* **orders:** accept only guid receipts and encode the id in the status url (ITACR-12) ([058ef1f](https://github.com/JulianH2/itacr-frontend/commit/058ef1ffe570f2eb5e460f57678851f2f95529c8))
* **orders:** respect the customer limits in the pickup summary (ITACR-12) ([1482d0f](https://github.com/JulianH2/itacr-frontend/commit/1482d0ff70d3d745dc46dba4d6cb561557773774))


### Changed

* **core:** add the design system with tokens, themes and shared components (ITACR-49) ([7f65fa4](https://github.com/JulianH2/itacr-frontend/commit/7f65fa4b58264812d2e4ef54a26b4c9bc3acc2d9))
* **core:** redesign the pwa with the mockup design system (ITACR-49) ([532aa3c](https://github.com/JulianH2/itacr-frontend/commit/532aa3caabee2576f6877bd136f7b4f857c37918))
* **core:** replace the sprint, develop and release builds with one qa build (ITACR-41) ([294a987](https://github.com/JulianH2/itacr-frontend/commit/294a987794b18c59dbedc12d5de2934195837872))


### Documentation

* **orders:** define the public pickup flow for customers (ITACR-42) ([dc1a922](https://github.com/JulianH2/itacr-frontend/commit/dc1a922db056816dbd8aed8f5902c2002e046d44))
* **orders:** define the public pickup flow for customers (ITACR-42) ([a654c04](https://github.com/JulianH2/itacr-frontend/commit/a654c04294ce849fe952d4a368fb079c9ac7438a))
* **orders:** document the pickup screens and their mock (ITACR-12) ([c63765e](https://github.com/JulianH2/itacr-frontend/commit/c63765ec848475ec50f869f967f603222627b5f8))
* **orders:** keep a list of receipts and give pickup its own route (ITACR-42) ([4673d21](https://github.com/JulianH2/itacr-frontend/commit/4673d218ca4659bf783cdc21109141e939977b04))
* **repo:** document the design system, themes and motion rules (ITACR-49) ([81c20f6](https://github.com/JulianH2/itacr-frontend/commit/81c20f60827e2fee55508838f5d88140e80cb45c))
* **repo:** document the kitchen taps, undo and the order detail (ITACR-11) ([fe62720](https://github.com/JulianH2/itacr-frontend/commit/fe62720073e281cf497e2a973b0ba920c7414afa))
* **repo:** document the qa build and environment (ITACR-41) ([f0c6377](https://github.com/JulianH2/itacr-frontend/commit/f0c637741c53902477513e08fc8737169c88c4a6))

## [0.2.0](https://github.com/JulianH2/itacr-frontend/compare/v0.1.1...v0.2.0) (2026-10-09)


### Added

* **kitchen:** add kitchen api with http client and mock (ITACR-10) ([76405dd](https://github.com/JulianH2/itacr-frontend/commit/76405dd49f42782c9819303784353fa4a036be12))
* **kitchen:** add kitchen queue models and timer rules (ITACR-10) ([fb49c91](https://github.com/JulianH2/itacr-frontend/commit/fb49c9183d8ad16ca6b56942a6027b0fc14cff51))
* **kitchen:** add kitchen store with polling and new order detection (ITACR-10) ([7c49733](https://github.com/JulianH2/itacr-frontend/commit/7c497338becd207e21617b372f14a49bbb3d4603))
* **kitchen:** add new order alert sound with explicit enable (ITACR-10) ([7ad0658](https://github.com/JulianH2/itacr-frontend/commit/7ad0658c71de95c18738d6148dc967a31acc8747))
* **kitchen:** add order card and board column components (ITACR-10) ([dffd3f7](https://github.com/JulianH2/itacr-frontend/commit/dffd3f78e067c45248f396d748799ed4c311c566))
* **kitchen:** build the kitchen board page with polling, empty and error states (ITACR-10) ([bab3efc](https://github.com/JulianH2/itacr-frontend/commit/bab3efce16810a8c7c6c41ae619385a39e20711e))
* **kitchen:** kitchen board with a single ordered queue (ITACR-10) ([e0039c0](https://github.com/JulianH2/itacr-frontend/commit/e0039c0ff68282b2ba1698ea3842efa9f4384162))
* **kitchen:** let managers open the kitchen board (ITACR-10) ([d76ad2d](https://github.com/JulianH2/itacr-frontend/commit/d76ad2d116a0a9636dcfc951f8fdeffb5bdb1703))
* **orders:** add order summary, send to kitchen and confirmation pages (ITACR-9) ([f3a89f6](https://github.com/JulianH2/itacr-frontend/commit/f3a89f6dbd664d4d974f78f65cf101a690be79f5))
* **orders:** add the orders api client and the take order store (ITACR-9) ([a988bf6](https://github.com/JulianH2/itacr-frontend/commit/a988bf60dd60710da50ffb70cf2891b3394587d0))
* **orders:** take an order and send it to the kitchen (ITACR-9) ([027ffa4](https://github.com/JulianH2/itacr-frontend/commit/027ffa4ad66aaeb535a65bfade9b081d8a983af0))


### Changed

* **auth:** move login to modules/identity/login (ITACR-39) ([9a727c1](https://github.com/JulianH2/itacr-frontend/commit/9a727c19e64c311e5866fa363362b6f7e87e9316))
* **catalog:** move catalog to modules/catalog/product-list (ITACR-39) ([879213a](https://github.com/JulianH2/itacr-frontend/commit/879213ae1b8824fdbec14630e3272aadb38db761))
* **core:** move core into shared (ITACR-39) ([25f4f4d](https://github.com/JulianH2/itacr-frontend/commit/25f4f4d419a7ff8fd4bec0a9685df4ab43181964))
* **core:** move placeholder screens into modules (ITACR-39) ([95a9591](https://github.com/JulianH2/itacr-frontend/commit/95a959196c8eeb9af2a9f8cd349f96aa44c35162))
* **core:** move the price pipe to shared (ITACR-9) ([781f061](https://github.com/JulianH2/itacr-frontend/commit/781f0617a3880976fc7b0cec69a8e6c0a13828e9))
* **core:** restructure angular into modules and shared (ITACR-39) ([02f24cd](https://github.com/JulianH2/itacr-frontend/commit/02f24cd847090ef2e63213e98191fd90b772a855))


### Reverted

* **pwa:** deploy frontend to azure static web apps (ITACR-32) ([c415113](https://github.com/JulianH2/itacr-frontend/commit/c415113a786bccc63e41b54f29e351812c936f8a))
* **pwa:** deploy frontend to azure static web apps (ITACR-32) ([0a577a5](https://github.com/JulianH2/itacr-frontend/commit/0a577a596c66bd542154db1d34e8f5c2cc7b3aa3))


### Documentation

* **kitchen:** document the kitchen board mock and polling (ITACR-10) ([cd1db74](https://github.com/JulianH2/itacr-frontend/commit/cd1db7475dbb1b6e81d771595c1b2072533fee2c))
* **repo:** document the frontend architecture (ITACR-33) ([3001e03](https://github.com/JulianH2/itacr-frontend/commit/3001e034e64defe015e071d50be2400177eb23e8))
* **repo:** document the frontend architecture (ITACR-33) ([5518825](https://github.com/JulianH2/itacr-frontend/commit/5518825566fad683cb75a97de720d0a609e5e25e))
* **repo:** update structure paths for modules and shared (ITACR-39) ([5b19891](https://github.com/JulianH2/itacr-frontend/commit/5b198910402d0240c59494c0c66658c29adc577d))

## [0.1.1](https://github.com/JulianH2/itacr-frontend/compare/v0.1.0...v0.1.1) (2026-10-02)


### Fixed

* **catalog:** use the backend catalog in production and hide broken product photos (ITACR-8) ([4d06b26](https://github.com/JulianH2/itacr-frontend/commit/4d06b261016e4802d6ffd48cf62abb20c2b7738a))
* **catalog:** use the backend catalog in production and hide broken product photos (ITACR-8) ([74e66f8](https://github.com/JulianH2/itacr-frontend/commit/74e66f8d991cddedf1bc4e643365ed9d320d404e))

## 0.1.0 (2026-10-02)


### Added

* **auth:** add home, pin login, password login, and role redirect screens (ITACR-7) ([8de3c3e](https://github.com/JulianH2/itacr-frontend/commit/8de3c3e35e46407b2a1282a9e4291996a77c00d0))
* **auth:** add session handling, auth api client, role guards, and simulated auth api (ITACR-7) ([fb1ddba](https://github.com/JulianH2/itacr-frontend/commit/fb1ddbabc15d7ec9b8265d1c4f6e764a09e61f25))
* **auth:** add staff pin login, role redirect, and session handling (ITACR-7) ([e5662d7](https://github.com/JulianH2/itacr-frontend/commit/e5662d708d182a530f1a61acc085e1121894c93c))
* **auth:** align simulated auth api with the backend test employees (ITACR-7) ([ec3663e](https://github.com/JulianH2/itacr-frontend/commit/ec3663e742ed7283ac8861704d185675e29bc9aa))
* **catalog:** add menu catalog by category with order draft state (ITACR-8) ([5f4d127](https://github.com/JulianH2/itacr-frontend/commit/5f4d1279cb372dab1aec8dccf6b808269940a385))
* **catalog:** menu catalog by category with order draft state (ITACR-8) ([7080d80](https://github.com/JulianH2/itacr-frontend/commit/7080d800771dee34c324ccd763d5a2f2f197f54b))
* **pwa:** offer to reload when a new version is deployed (ITACR-32) ([3058b31](https://github.com/JulianH2/itacr-frontend/commit/3058b31f82aa8c070d040246b4bf0fd40b8261aa))
* **pwa:** point production to the azure backend with a meta csp (ITACR-31) ([5378687](https://github.com/JulianH2/itacr-frontend/commit/5378687d057c14ee20b65335960fccb4dd7fe59c))
* **pwa:** point the production build to the azure backend and add a meta csp (ITACR-31) ([77c10f7](https://github.com/JulianH2/itacr-frontend/commit/77c10f7c9ba3a69552accafe0593e40533b9bd0e))
* **pwa:** scaffold angular 22 pwa with material and feature-based structure (ITACR-25) ([975994d](https://github.com/JulianH2/itacr-frontend/commit/975994d96b8ba69cbb101e0839bffa42c74eb4af))
* **pwa:** scaffold angular pwa with material, feature structure, and quality tooling (ITACR-25) ([4d22b4c](https://github.com/JulianH2/itacr-frontend/commit/4d22b4c993f20032977483a87765185ebd4a82a4))


### Documentation

* **repo:** add readme, contributing guide, coding standards, and templates (ITACR-29) ([63e4fa5](https://github.com/JulianH2/itacr-frontend/commit/63e4fa5fe3ed8e0c8485a1f8f0ae64d933853790))
* **repo:** add readme, contributing guide, coding standards, and templates (ITACR-29) ([1c81eba](https://github.com/JulianH2/itacr-frontend/commit/1c81ebaf3b4a08e8ba83a72c7b54999e3f6b0369))
* **repo:** document the azure app service hosting and production urls (ITACR-31) ([81bc66c](https://github.com/JulianH2/itacr-frontend/commit/81bc66c6c70f7b5ff54ad0852a0ac2bacdb5efc5))
* **repo:** document the deploy workflow and pwa updates (ITACR-32) ([58ac4df](https://github.com/JulianH2/itacr-frontend/commit/58ac4dfae53a856ec8b04613e7843c7a59565437))

## Changelog

All notable changes to this project are documented in this file. It follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This file is **generated by [release-please](https://github.com/googleapis/release-please)** from the Conventional Commits merged into `main`. Do not edit it by hand: write good commit messages instead. `feat` commits appear under "Added", `fix` under "Fixed", `perf`/`refactor` under "Changed", and `docs` under "Documentation".
