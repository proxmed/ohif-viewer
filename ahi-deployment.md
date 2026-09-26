# AWS HealthImaging (AHI) Deployment Guide

## Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `AHI_ENDPOINT` | Full DICOMWeb endpoint URL for your AHI datastore | `https://dicom-medical-imaging.ap-southeast-2.amazonaws.com/datastore/<datastore-id>` |
| `COGNITO_AUTHORITY` | Cognito User Pool issuer URL | `https://cognito-idp.<region>.amazonaws.com/<user-pool-id>` |
| `COGNITO_CLIENT_ID` | Cognito App Client ID | `24336qr32beitfg549af71qf6u` |

## Prerequisites

- Node >= 24 and pnpm (the repo moved from yarn to pnpm in the upstream sync, #8)
- `pnpm install` at the repo root

## Local Development

1. Create `.env.ahi.dev` at the repo root (gitignored; one file per environment, e.g. `.env.ahi.prod`) or export the variables:

```bash
export AHI_ENDPOINT="https://dicom-medical-imaging.ap-southeast-2.amazonaws.com/datastore/<your-datastore-id>"
export COGNITO_AUTHORITY="https://cognito-idp.ap-southeast-2.amazonaws.com/<your-pool-id>"
export COGNITO_CLIENT_ID="<your-client-id>"
```

2. Generate the local config:

```bash
set -a; source .env.ahi.dev; set +a   # skip if you exported the variables
./scripts/apply-config.sh
```

3. Start the dev server. `pnpm dev` pins `APP_CONFIG=config/default.js`, so call rspack directly:

```bash
cd platform/app
NODE_ENV=development APP_CONFIG=config/ahi.local.js pnpm exec rspack serve --config .webpack/webpack.pwa.js
```

## Deploy (S3 + CloudFront)

This is how `deploy/ahi` is actually hosted. The S3 bucket (`ohifviewer-assets-<env>-<region>`), the CloudFront distribution, and the Cognito pool are managed by Terraform in `tenacity-infra`. That repo's pipeline does not build or upload the viewer; you deploy it manually:

```bash
DEPLOY_ENV=dev CLOUDFRONT_DISTRIBUTION_ID=<terraform output cloudfront_id> ./scripts/deploy-ahi.sh
```

The script reads `.env.ahi.<DEPLOY_ENV>` (e.g. `.env.ahi.prod`) and refuses to run without it, so dev settings can't be deployed to prod. It checks for Node >= 24. It then runs `apply-config.sh`, `pnpm install --frozen-lockfile`, and `APP_CONFIG=config/ahi.local.js pnpm build`, syncs `platform/app/dist/` to the bucket, and invalidates CloudFront. It needs AWS credentials for the target account.

To build without deploying:

```bash
./scripts/apply-config.sh
APP_CONFIG=config/ahi.local.js pnpm build
```

## Docker

Not used by the current hosting. The Dockerfile defaults to `config/default.js`, so pass the AHI config explicitly:

```bash
docker build --build-arg APP_CONFIG=config/ahi.js -t ohif-ahi .

docker run -p 3000:80 \
  -e AHI_ENDPOINT="https://dicom-medical-imaging.ap-southeast-2.amazonaws.com/datastore/<id>" \
  -e COGNITO_AUTHORITY="https://cognito-idp.ap-southeast-2.amazonaws.com/<pool-id>" \
  -e COGNITO_CLIENT_ID="<client-id>" \
  ohif-ahi
```

The Docker entrypoint automatically substitutes the placeholders in the config at container start time.

## Config Template

The config template is at `platform/app/public/config/ahi.js`. It contains `__AHI_ENDPOINT__`, `__COGNITO_AUTHORITY__`, and `__COGNITO_CLIENT_ID__` placeholders that are replaced at build/deploy time. Never commit real credentials to this file.
