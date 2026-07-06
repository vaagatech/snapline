# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Consumer utilities in `@vaagatech/snapline-core`** — `moduleDir`, `fixturesDir`, `resolveReportConfig`, `runApiFixtureCases`, `runSnaplineFixtureCases` (no need to copy demo boilerplate)
- **Configurable fixture layout** — `layout` option and per-case overrides for `case.json`, `expected.json`, `query.graphql`, `variables.json`, `input.json`, `input.xml`, `live.json`, and `casesDir`
- **Scenario-level fixture defaults** — shared `ignoreFields`, `transformations`, `dataMapping`, `dataPath`, etc. in `defaults`; `case.json` overrides only when needed
- **Configurable report output** — `resolveReportConfig({ defaultOutputPath })` plus existing CLI/env flags
- **Configurable fixtures directory** — `fixturesDir(import.meta.url, { relativePath })`
- **Asymmetric DB ↔ DB** — `sourceQuery` / `targetQuery` with `linkKeys` or `targetParamsFromSource` for primary-key lookups across different schemas
- **NoSQL document comparison** — `DocumentStoreLike`, `nosql.memory()`, and `sourceCollection` / `targetCollection` on `dbComparison`
- **Engine aliases** — `SnaplineOptions`, `SnaplineResult`, and `snapline()` as aliases of `ReconcileOptions`, `ReconcileResult`, and `reconcile()`

### Changed

- **Demo scenarios** — consumer-style `src/run.ts` per scenario (env-based `API_BASE_URL`, DB URLs); copy-pasteable folders depending only on `@vaagatech/snapline-core`
- **BREAKING:** Removed `bootstrapScenario`, `ScenarioModule`, and `createDemoAuth` from `@vaagatech/snapline-demo-shared` (mock server + SQLite seeding remain for `npm run demo` only)
- **BREAKING:** Renamed the product and npm packages from **Reconcile** to **Snapline** (`reconcile-*` → `snapline-*` under `@vaagatech`), including demo scenario workspaces and GitHub repository references.
- **BREAKING:** `runReconcileFixtureCases` renamed to `runSnaplineFixtureCases`; `resolveFixtureReconcileOptions` renamed to `resolveFixtureSnaplineOptions` (internal)

## [0.2.0] - 2026-07-04

### Added

- `@vaagatech/snapline-api-adapters` — minimal REST, SOAP, and GraphQL adapters with file-driven requests
- **API ↔ DB** (`apiToDb`) and **DB ↔ API** (`dbToApi`) cross-system test modes in `@vaagatech/snapline-core`
- `api.rest()`, `api.soap()`, `api.graphql()` factories re-exported from `@vaagatech/snapline-core`
- Full demo covering 6 modes: REST/GraphQL/SOAP file tests, DB↔DB, API↔DB, DB↔API
- Per-protocol examples in `packages/api-adapters/examples/` and `packages/core/examples/`

## [0.1.0] - 2026-07-04

### Added

- `@vaagatech/snapline-engine` — data reconciliation engine with field ignoring, transformations, and cross-system mapping
- `@vaagatech/snapline-auth-adapters` — Basic Auth, OAuth2 client credentials, and OpenID adapters
- `@vaagatech/snapline-core` — declarative test suite orchestrator DSL
- Dual **CJS + ESM** builds with TypeScript declarations (`.d.ts` / `.d.cts`)
- Monorepo demo with mock API and cross-database reconciliation
- Per-package README files with usage guides and runnable demos

[0.2.0]: https://github.com/vaagatech/snapline/releases/tag/v0.2.0
[0.1.0]: https://github.com/vaagatech/snapline/releases/tag/v0.1.0
