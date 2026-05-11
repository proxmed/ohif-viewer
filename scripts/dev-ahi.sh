#!/bin/bash
# Run OHIF dev server against an AWS HealthImaging datastore.
#
# Usage:
#   ./scripts/dev-ahi.sh
#
# Requires a .env.ahi file at repo root with:
#   AHI_ENDPOINT=https://dicom-medical-imaging.<region>.amazonaws.com/datastore/<id>
#   COGNITO_AUTHORITY=https://cognito-idp.<region>.amazonaws.com/<pool-id>
#   COGNITO_CLIENT_ID=<client-id>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env.ahi"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE. Create it with AHI_ENDPOINT, COGNITO_AUTHORITY, COGNITO_CLIENT_ID." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

: "${AHI_ENDPOINT:?AHI_ENDPOINT not set in $ENV_FILE}"
: "${COGNITO_AUTHORITY:?COGNITO_AUTHORITY not set in $ENV_FILE}"
: "${COGNITO_CLIENT_ID:?COGNITO_CLIENT_ID not set in $ENV_FILE}"

"$SCRIPT_DIR/apply-config.sh"

cd "$REPO_ROOT/platform/app"
# Bypass the `yarn dev` script which hardcodes APP_CONFIG=config/default.js.
exec npx cross-env NODE_ENV=development APP_CONFIG=config/ahi.local.js \
  webpack serve --config .webpack/webpack.pwa.js
