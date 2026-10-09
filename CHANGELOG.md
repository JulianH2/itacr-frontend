# Changelog

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
