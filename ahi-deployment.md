# AWS HealthImaging (AHI) Deployment Guide

## Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `AHI_ENDPOINT` | Full DICOMWeb endpoint URL for your AHI datastore | `https://dicom-medical-imaging.ap-southeast-2.amazonaws.com/datastore/<datastore-id>` |
| `COGNITO_AUTHORITY` | Cognito User Pool issuer URL | `https://cognito-idp.<region>.amazonaws.com/<user-pool-id>` |
| `COGNITO_CLIENT_ID` | Cognito App Client ID | `24336qr32beitfg549af71qf6u` |

## Local Development

1. Create a `.env` file or export the variables:

```bash
export AHI_ENDPOINT="https://dicom-medical-imaging.ap-southeast-2.amazonaws.com/datastore/<your-datastore-id>"
export COGNITO_AUTHORITY="https://cognito-idp.ap-southeast-2.amazonaws.com/<your-pool-id>"
export COGNITO_CLIENT_ID="<your-client-id>"
```

2. Generate the local config:

```bash
./scripts/apply-config.sh
```

3. Start the dev server:

```bash
APP_CONFIG=config/ahi.local.js yarn dev
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
