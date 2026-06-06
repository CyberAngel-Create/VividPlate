#!/bin/bash

# VividPlate Debug & Deploy Script
# This script helps diagnose and fix issues with agent tokens, registration, and deployment

PROJECT_ID="white-notch-467408-e9"
SERVICE_NAME="vividplate"
REGION="us-central1"

set -e  # Exit on error

echo "=== VividPlate Deployment Debug Script ==="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Step 1: Verify project configuration
echo "Step 1: Checking Google Cloud Configuration..."
if ! gcloud config get-value project &>/dev/null; then
    print_error "GCloud not configured"
    exit 1
fi
CURRENT_PROJECT=$(gcloud config get-value project)
if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
    print_warning "Current project is $CURRENT_PROJECT, setting to $PROJECT_ID"
    gcloud config set project $PROJECT_ID
fi
print_status "Project configured: $PROJECT_ID"

# Step 2: Check secrets in Secret Manager
echo ""
echo "Step 2: Checking Secrets in Secret Manager..."
REQUIRED_SECRETS=("DATABASE_URL" "SESSION_SECRET" "LEMONSQUEEZY_API_KEY" "LEMONSQUEEZY_WEBHOOK_SECRET" "TELEGRAM_BOT_TOKEN")

for SECRET in "${REQUIRED_SECRETS[@]}"; do
    if gcloud secrets describe $SECRET &>/dev/null; then
        print_status "Secret exists: $SECRET"
    else
        print_error "Secret missing: $SECRET"
        echo "  Create it with: gcloud secrets create $SECRET --data-file=- <<< 'your-secret-value'"
    fi
done

# Step 3: Verify service account permissions
echo ""
echo "Step 3: Checking Service Account Permissions..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
print_status "Service Account: $SERVICE_ACCOUNT"

for SECRET in "${REQUIRED_SECRETS[@]}"; do
    if gcloud secrets get-iam-policy $SECRET 2>/dev/null | grep -q "$SERVICE_ACCOUNT"; then
        print_status "Permissions OK: $SECRET"
    else
        print_warning "Missing permissions for $SECRET"
        echo "  Run: gcloud secrets add-iam-policy-binding $SECRET --member=\"serviceAccount:$SERVICE_ACCOUNT\" --role=\"roles/secretmanager.secretAccessor\""
    fi
done

# Step 4: Check if Cloud Run service exists
echo ""
echo "Step 4: Checking Cloud Run Service..."
if gcloud run services describe $SERVICE_NAME --region $REGION &>/dev/null; then
    print_status "Cloud Run service exists: $SERVICE_NAME"
    echo "  URL: $(gcloud run services describe $SERVICE_NAME --region $REGION --format='value(status.url)')"
else
    print_warning "Cloud Run service does not exist (will be created on first deploy)"
fi

# Step 5: Check Cloud Build permissions
echo ""
echo "Step 5: Checking Cloud Build Permissions..."
if gcloud projects get-iam-policy $PROJECT_ID --flatten="bindings[].members" --filter="bindings.role:roles/cloudbuild.builds.editor" &>/dev/null; then
    print_status "Cloud Build permissions OK"
else
    print_warning "Cloud Build permissions may need to be verified"
fi

# Step 6: Validate cloudbuild.yaml syntax
echo ""
echo "Step 6: Validating cloudbuild.yaml..."
if [ -f "cloudbuild.yaml" ]; then
    print_status "cloudbuild.yaml found"
    # Basic syntax check
    if grep -q "steps:" cloudbuild.yaml && grep -q "images:" cloudbuild.yaml; then
        print_status "cloudbuild.yaml syntax looks OK"
    else
        print_error "cloudbuild.yaml may have syntax errors"
    fi
else
    print_error "cloudbuild.yaml not found"
fi

# Step 7: Summary and next steps
echo ""
echo "=== Summary ==="
echo ""
echo "If all checks passed, deploy with:"
echo ""
echo "  gcloud builds submit --config cloudbuild.yaml --project $PROJECT_ID"
echo ""
echo "Monitor the build:"
echo "  gcloud builds log --stream <BUILD_ID>"
echo ""
echo "View Cloud Run logs:"
echo "  gcloud run logs read $SERVICE_NAME --region $REGION --limit 50"
echo ""
