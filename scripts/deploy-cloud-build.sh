#!/bin/bash
# Build and deploy using Cloud Build + cloudbuild.yaml
# Usage: ./scripts/deploy-cloud-build.sh PROJECT_ID

set -euo pipefail
PROJECT_ID=${1:-}
if [ -z "$PROJECT_ID" ]; then
  echo "Usage: $0 PROJECT_ID"
  exit 1
fi

gcloud builds submit --project="$PROJECT_ID" --config=cloudbuild.yaml --substitutions=_SERVICE_NAME=vividplate,_REGION=us-central1

echo "Build submitted. Cloud Build will deploy the service to Cloud Run."