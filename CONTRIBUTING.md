# Contributing to @vaagatech/snapline-engine

Thank you for your interest in contributing. This project is open source under the [MIT License](LICENSE). Anyone may use, fork, modify, and contribute.

## Ways to contribute

- Report bugs via [GitHub Issues](https://github.com/vaagatech/snapline/issues)
- Propose features or discuss design in Issues before large changes
- Submit pull requests with focused, tested changes
- Improve documentation and examples — published docs: [vaagatech.github.io/snapline](https://vaagatech.github.io/snapline/) · [Python](https://vaagatech.github.io/snapline-python/)
- Share feedback from production usage

## Development setup

```bash
git clone https://github.com/vaagatech/snapline.git
cd snapline
npm install
npm run build
npm run typecheck
npm run demo
```

The demo runs all 6 integration modes and must pass before submitting a PR.

## Pull request guidelines

1. **One concern per PR** — keep changes focused and reviewable
2. **Build must pass** — run `npm run build && npm run typecheck && npm run demo` before submitting
3. **Follow existing style** — TypeScript strict mode, modular files, dual CJS/ESM exports
4. **Update docs** — if you change public API, update the relevant package README and CHANGELOG
5. **No breaking changes without discussion** — open an Issue for API changes that affect consumers

## Monorepo structure

| Path | Package |
|------|---------|
| `packages/snapline` | `@vaagatech/snapline-engine` |
| `packages/auth-adapters` | `@vaagatech/snapline-auth-adapters` |
| `packages/api-adapters` | `@vaagatech/snapline-api-adapters` |
| `packages/core` | `@vaagatech/snapline-core` |
| `demo/` | Integration demo (not published) |

## Publishing (maintainers)

Packages publish to npm in dependency order:

```bash
npm run build
npm publish --workspace=@vaagatech/snapline-engine --access public
npm publish --workspace=@vaagatech/snapline-auth-adapters --access public
npm publish --workspace=@vaagatech/snapline-api-adapters --access public
npm publish --workspace=@vaagatech/snapline-core --access public
```

Or: `npm run publish:packages`

## Code of conduct

Be respectful and constructive. We welcome contributors of all experience levels.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

Maintained by [VaagaTech](https://www.vaagatech.com).
