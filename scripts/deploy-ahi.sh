#!/bin/bash
# Builds the AHI viewer and uploads it to the S3 + CloudFront hosting created by tenacity-infra.
# Usage:
#   DEPLOY_ENV=dev CLOUDFRONT_DISTRIBUTION_ID=<terraform output cloudfront_id> ./scripts/deploy-ahi.sh
# Reads AHI_ENDPOINT, COGNITO_AUTHORITY, COGNITO_CLIENT_ID from .env.ahi.<DEPLOY_ENV> (gitignored; required,
# so one environment's settings can never be deployed to another). Also needs Node >= 24, pnpm, and AWS
# credentials for the target account.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

: "${DEPLOY_ENV:?Set DEPLOY_ENV (e.g. dev, prod)}"

ENV_FILE="$REPO_ROOT/.env.ahi.${DEPLOY_ENV}"
if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE (AHI_ENDPOINT, COGNITO_AUTHORITY, COGNITO_CLIENT_ID for ${DEPLOY_ENV})" >&2
  exit 1
fi
set -a
source "$ENV_FILE"
set +a
: "${CLOUDFRONT_DISTRIBUTION_ID:?Set CLOUDFRONT_DISTRIBUTION_ID (terraform output cloudfront_id)}"
AWS_REGION="${AWS_REGION:-ap-southeast-2}"
BUCKET="ohifviewer-assets-${DEPLOY_ENV}-${AWS_REGION}"

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 24 ]; then
  echo "Node >= 24 required (found $(node -v))" >&2
  exit 1
fi

cd "$REPO_ROOT"
"$SCRIPT_DIR/apply-config.sh"
pnpm install --frozen-lockfile
APP_CONFIG=config/ahi.local.js pnpm build

# ponytail: no --delete, so old hashed chunks stay for open sessions; prune the bucket by hand if it grows
aws s3 sync platform/app/dist/ "s3://${BUCKET}/" --region "$AWS_REGION"
aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --paths '/*'

echo "Deployed to s3://${BUCKET} (CloudFront ${CLOUDFRONT_DISTRIBUTION_ID})"
