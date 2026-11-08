# Saia da Teoria institutional site

Official static website for [saiadateoria.com](https://saiadateoria.com). It is intentionally lightweight and dependency-free.

## Local development

Open `index.html` directly or serve the directory with any static HTTP server.

## Deployment

The project deploys to Vercel. The private application is hosted separately at [app.saiadateoria.com](https://app.saiadateoria.com).

## Branches

- `main` is production and deploys on every push. It only receives PRs from `develop`, except hotfixes (`hotfix/<short-desc>`, which must also land on `develop`). Never push directly to `main`.
- Work goes straight to `develop` (staging), no PR needed; release with one `develop` -> `main` PR.
- The "Main only from develop" check (`.github/workflows/branch-rule.yml`) fails any other PR into `main`.
