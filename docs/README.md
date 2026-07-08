# GitHub Pages setup

Documentation lives in the `docs/` folder and deploys automatically via `.github/workflows/pages.yml`.

## One-time repository settings

1. Open **Settings → Pages** in the GitHub repository.
2. Under **Build and deployment**, set **Source** to **GitHub Actions** (not “Deploy from branch”).
3. Push to `main` (or `master`) — the workflow publishes on changes under `docs/`.

## Site structure

| Page | Contents |
|------|----------|
| [index.html](index.html) | Overview, install, reconciliation pipeline |
| [architecture.html](architecture.html) | Package layers (engine, API, auth, **messaging**, core) |
| [getting-started.html](getting-started.html) | 5-minute walkthrough |
| [guide.html](guide.html) | End-to-end workflow including **queue → poll** |
| [demos.html](demos.html) | 21 runnable demo scenarios |
| [reference.html](reference.html) | API reference including `publishAndPoll` |

Styling: [assets/style.css](assets/style.css) — Inter font, sticky sidebar, responsive layout.

## URLs

| Repo | GitHub Pages URL |
|------|------------------|
| [vaagatech/snapline](https://github.com/vaagatech/snapline) | https://vaagatech.github.io/snapline/ |
| [vaagatech/snapline-python](https://github.com/vaagatech/snapline-python) | https://vaagatech.github.io/snapline-python/ |
| [vaagatech/snapline-hub](https://github.com/vaagatech/snapline-hub) | Optional reporting UI (self-hosted) |

## Local preview

```bash
# from repo root
npx serve docs
# open http://localhost:3000
```

## Manual deploy

Actions → **Deploy documentation to GitHub Pages** → **Run workflow**
