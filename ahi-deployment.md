# AWS HealthImaging (AHI) Deployment Guide

## Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `AHI_ENDPOINT` | Full DICOMWeb endpoint URL for your AHI datastore | `https://dicom-medical-imaging.ap-southeast-2.amazonaws.com/datastore/<datastore-id>` |
| `COGNITO_AUTHORITY` | Cognito User Pool issuer URL | `https://cognito-idp.<region>.amazonaws.com/<user-pool-id>` |
| `COGNITO_CLIENT_ID` | Cognito App Client ID | `24336qr32beitfg549af71qf6u` |

## Local Development

### Quick start (one command)

```bash
./scripts/dev-ahi.sh
```

Reads credentials from `.env.ahi` at repo root (gitignored), regenerates `ahi.local.js`, and starts the dev server on `http://localhost:3000`.

`.env.ahi` format:

```
AHI_ENDPOINT=https://dicom-medical-imaging.<region>.amazonaws.com/datastore/<datastore-id>
COGNITO_AUTHORITY=https://cognito-idp.<region>.amazonaws.com/<user-pool-id>
COGNITO_CLIENT_ID=<app-client-id>
```

### Manual

1. Export the variables:

```bash
export AHI_ENDPOINT="https://dicom-medical-imaging.ap-southeast-2.amazonaws.com/datastore/<your-datastore-id>"
export COGNITO_AUTHORITY="https://cognito-idp.ap-southeast-2.amazonaws.com/<your-pool-id>"
export COGNITO_CLIENT_ID="<your-client-id>"
```

2. Generate the local config:

```bash
./scripts/apply-config.sh
```

3. Start the dev server (bypass `yarn dev`, which hardcodes `APP_CONFIG=config/default.js`):

```bash
cd platform/app
npx cross-env NODE_ENV=development APP_CONFIG=config/ahi.local.js \
  webpack serve --config .webpack/webpack.pwa.js
```

## Static Build (S3 / Amplify)

```bash
export AHI_ENDPOINT="..."
export COGNITO_AUTHORITY="..."
export COGNITO_CLIENT_ID="..."

./scripts/apply-config.sh
APP_CONFIG=config/ahi.local.js yarn build
```

The build output in `platform/app/dist/` can be deployed to any static host.

## Docker

```bash
docker build -t ohif-ahi .

docker run -p 3000:80 \
  -e AHI_ENDPOINT="https://dicom-medical-imaging.ap-southeast-2.amazonaws.com/datastore/<id>" \
  -e COGNITO_AUTHORITY="https://cognito-idp.ap-southeast-2.amazonaws.com/<pool-id>" \
  -e COGNITO_CLIENT_ID="<client-id>" \
  ohif-ahi
```

The Docker entrypoint automatically substitutes the placeholders in the config at container start time.

## Config Template

The config template is at `platform/app/public/config/ahi.js`. It contains `__AHI_ENDPOINT__`, `__COGNITO_AUTHORITY__`, and `__COGNITO_CLIENT_ID__` placeholders that are replaced at build/deploy time. Never commit real credentials to this file.

## Operational Runbooks

| Symptom | Runbook |
|---|---|
| Modified `PatientID` / `PatientName` in AHI not reflected in OHIF Tag Browser (SRs inheriting wrong tags) | [ahi-dicom-tag-update-runbook.md](ahi-dicom-tag-update-runbook.md) |
| SR saved via OHIF STOW-RS but missing from QIDO / returns 404 on WADO-RS (AHI DICOMweb proxy indexing gap) | Run `IMAGE_SET_ID=<sr-id> bash scripts/ahi-reindex-sr.sh apply` (or `STUDY_UID=<uid>` to reindex all SRs in a study). Triggered automatically when the toast "SR saved but not yet indexed" appears in-app. Root cause: [AHI_DICOMWEB_BUG_REPORT.md](testdata/AUS002-001-SR/AHI_DICOMWEB_BUG_REPORT.md). |
