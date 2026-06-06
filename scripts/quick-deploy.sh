#!/bin/bash

# VividPlate Quick Deploy Script
# This script handles the complete deployment process

set -e

PROJECT_ID="white-notch-467408-e9"
SERVICE_NAME="vividplate"
REGION="us-central1"

echo "╔════════════════════════════════════════════════════════╗"
echo "║  VividPlate Quick Deploy Script                         ║"
echo "║  Project: $PROJECT_ID"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if all required secrets exist
echo "Checking required secrets..."
REQUIRED_SECRETS=("DATABASE_URL" "SESSION_SECRET" "LEMONSQUEEZY_API_KEY" "LEMONSQUEEZY_WEBHOOK_SECRET" "TELEGRAM_BOT_TOKEN")

MISSING_SECRETS=()
for SECRET in "${REQUIRED_SECRETS[@]}"; do
    if ! gcloud secrets describe $SECRET --project=$PROJECT_ID &>/dev/null; then
        MISSING_SECRETS+=("$SECRET")
    else
        echo "✓ Found: $SECRET"
    fi
done

if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
    echo ""
    echo "❌ Missing secrets:"
    for SECRET in "${MISSING_SECRETS[@]}"; do
        echo "  - $SECRET"
    done
    echo ""
    echo "Please create these secrets first. See DEPLOYMENT_GUIDE.md for instructions."
    exit 1
fi

echo ""
echo "✓ All secrets found!"
echo ""

# Verify service account permissions
echo "Verifying service account permissions..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

for SECRET in "${REQUIRED_SECRETS[@]}"; do
    if gcloud secrets get-iam-policy $SECRET --project=$PROJECT_ID 2>/dev/null | grep -q "$SERVICE_ACCOUNT"; then
        echo "✓ Permissions OK: $SECRET"
    else
        echo "❌ Missing permissions for: $SECRET"
        echo "  Run: gcloud secrets add-iam-policy-binding $SECRET --member=\"serviceAccount:$SERVICE_ACCOUNT\" --role=\"roles/secretmanager.secretAccessor\" --project=$PROJECT_ID"
        exit 1
    fi
done

echo ""
echo "✓ All permissions verified!"
echo ""

# Deploy
echo "Starting deployment... (this may take 10-15 minutes)"
echo ""

gcloud builds submit --config cloudbuild.yaml --project $PROJECT_ID

if [ $? -eq 0 ]; then
    echo ""
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║  ✓ Deployment Submitted Successfully!                  ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""
    echo "Next steps:"
    echo "1. Monitor the build: gcloud builds list --project=$PROJECT_ID"
    echo "2. View Cloud Run logs:"
    echo "   gcloud run logs read $SERVICE_NAME --region=$REGION --project=$PROJECT_ID --follow"
    echo "3. Get service URL:"
    echo "   gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID --format='value(status.url)'"
    echo ""
else
    echo ""
    echo "❌ Deployment failed. Check the logs above for details."
    exit 1
fi
