# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-07-04

### Added

- `@vaagatech/api-adapters` — minimal REST, SOAP, and GraphQL adapters with file-driven requests
- **API ↔ DB** (`apiToDb`) and **DB ↔ API** (`dbToApi`) cross-system test modes in `@vaagatech/core`
- `api.rest()`, `api.soap()`, `api.graphql()` factories re-exported from `@vaagatech/core`
- Full demo covering 6 modes: REST/GraphQL/SOAP file tests, DB↔DB, API↔DB, DB↔API
- Per-protocol examples in `packages/api-adapters/examples/` and `packages/core/examples/`

## [0.1.0] - 2026-07-04

### Added

- `@vaagatech/reconcile` — data reconciliation engine with field ignoring, transformations, and cross-system mapping
- `@vaagatech/auth-adapters` — Basic Auth, OAuth2 client credentials, and OpenID adapters
- `@vaagatech/core` — declarative test suite orchestrator DSL
- Dual **CJS + ESM** builds with TypeScript declarations (`.d.ts` / `.d.cts`)
- Monorepo demo with mock API and cross-database reconciliation
- Per-package README files with usage guides and runnable demos

[0.2.0]: https://github.com/vaagatech/reconcile/releases/tag/v0.2.0
[0.1.0]: https://github.com/vaagatech/reconcile/releases/tag/v0.1.0
