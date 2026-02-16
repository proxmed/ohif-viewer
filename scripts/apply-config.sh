#!/bin/bash
# Substitutes AHI placeholders in ahi.js with real values from environment variables.
# Usage: AHI_ENDPOINT=... COGNITO_AUTHORITY=... COGNITO_CLIENT_ID=... ./scripts/apply-config.sh
#
# The output file (ahi.local.js) is gitignored and safe to use for local dev or static builds:
#   APP_CONFIG=config/ahi.local.js yarn dev

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC="$REPO_ROOT/platform/app/public/config/ahi.js"
DST="$REPO_ROOT/platform/app/public/config/ahi.local.js"

cp "$SRC" "$DST"

sed -i '' "s|__AHI_ENDPOINT__|${AHI_ENDPOINT}|g" "$DST"
sed -i '' "s|__COGNITO_AUTHORITY__|${COGNITO_AUTHORITY}|g" "$DST"
sed -i '' "s|__COGNITO_CLIENT_ID__|${COGNITO_CLIENT_ID}|g" "$DST"

echo "Config written to $DST"
