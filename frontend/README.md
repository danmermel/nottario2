# Nottario — Frontend

Nuxt 3 + Vuetify 3 static site, deployed to GitHub Pages.

## Setup

```bash
npm install
```

Copy the environment file and fill in your Lambda Function URLs:

```bash
cp .env.example .env
# edit .env with your actual URLs from terraform output
```

## Development

```bash
npm run dev        # http://localhost:3000
```

## Build

```bash
npm run generate   # static output → .output/public/
```

## Pages

| Route       | File                      | Purpose                        |
|-------------|---------------------------|--------------------------------|
| `/`         | `pages/index.vue`         | Landing page                   |
| `/notarise` | `pages/notarise.vue`      | Upload, pay, receive receipt   |
| `/verify`   | `pages/verify.vue`        | Verify a notarised document    |

## Environment variables

All variables are prefixed `NUXT_PUBLIC_` and baked into the static
bundle at build time. They are injected by GitHub Actions from AWS SSM
Parameter Store — see `.env.example` for the full list.

For local development, copy `.env.example` to `.env` and paste in
the Lambda Function URLs from `terraform output`.

## Deployment

Deployment is handled by GitHub Actions on push to `main`.
The workflow runs `npm run generate` and deploys `.output/public/`
to GitHub Pages. See `.github/workflows/deploy.yml`.
