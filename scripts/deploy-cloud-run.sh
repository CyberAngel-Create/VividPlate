#!/bin/bash
# Build, push and deploy to Cloud Run using docker + gcloud
# Usage: ./scripts/deploy-cloud-run.sh PROJECT_ID REGION

set -euo pipefail
PROJECT_ID=${1:-}
REGION=${2:-us-central1}
if [ -z "$PROJECT_ID" ]; then
  echo "Usage: $0 PROJECT_ID [REGION]"
  exit 1
fi
SERVICE_NAME=vividplate
IMAGE=gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

# Build
docker build -t $IMAGE .

# Push
gcloud auth configure-docker --quiet
docker push $IMAGE

# Deploy
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi

echo "Deployed $SERVICE_NAME to Cloud Run (region: $REGION)."