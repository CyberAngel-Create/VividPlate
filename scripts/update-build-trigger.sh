#!/bin/bash
# Update Cloud Build Trigger to use main branch HEAD
# This script helps fix the issue where builds are using an old commit
# instead of the latest commit on the main branch

set -euo pipefail

PROJECT_ID=${1:-}
TRIGGER_NAME=${2:-vividplate-main-trigger}

if [ -z "$PROJECT_ID" ]; then
  echo "Usage: $0 PROJECT_ID [TRIGGER_NAME]"
  echo ""
  echo "This script will:"
  echo "  1. Delete the existing build trigger (if it exists)"
  echo "  2. Create a new trigger configured to build from main branch HEAD"
  echo ""
  echo "Example:"
  echo "  $0 my-gcp-project-id vividplate-main-trigger"
  exit 1
fi

echo "=========================================="
echo "Updating Cloud Build Trigger"
echo "=========================================="
echo "Project ID: $PROJECT_ID"
echo "Trigger Name: $TRIGGER_NAME"
echo ""

# Check if trigger exists
if gcloud builds triggers describe "$TRIGGER_NAME" --project="$PROJECT_ID" &>/dev/null; then
  echo "Found existing trigger: $TRIGGER_NAME"
  read -p "Delete and recreate the trigger? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Deleting existing trigger..."
    gcloud builds triggers delete "$TRIGGER_NAME" --project="$PROJECT_ID" --quiet
    echo "✓ Trigger deleted"
  else
    echo "Operation cancelled. No changes were made to the trigger."
    echo "To update manually, go to: https://console.cloud.google.com/cloud-build/triggers?project=$PROJECT_ID"
    exit 0
  fi
fi

# Create new trigger
echo ""
echo "Creating new trigger from cloudbuild-trigger.yaml..."
if [ -f "cloudbuild-trigger.yaml" ]; then
  # Use the trigger configuration file
  gcloud builds triggers import \
    --source=cloudbuild-trigger.yaml \
    --project="$PROJECT_ID"
  echo "✓ Trigger created from configuration file"
else
  # Create trigger directly with gcloud command
  gcloud builds triggers create github \
    --repo-name=VividPlate \
    --repo-owner=CyberAngel-Create \
    --branch-pattern="^main$" \
    --build-config=cloudbuild.yaml \
    --name="$TRIGGER_NAME" \
    --description="Build and deploy VividPlate on push to main branch" \
    --substitutions="_SERVICE_NAME=vividplate,_REGION=us-central1" \
    --project="$PROJECT_ID"
  echo "✓ Trigger created"
fi

echo ""
echo "=========================================="
echo "Trigger Update Complete!"
echo "=========================================="
echo ""
echo "The trigger is now configured to:"
echo "  - Watch: main branch"
echo "  - Build: Always use latest commit (HEAD)"
echo "  - Config: cloudbuild.yaml"
echo ""
echo "Next steps:"
echo "  1. Push a commit to main branch to test the trigger"
echo "  2. OR manually trigger a build:"
echo "     gcloud builds triggers run $TRIGGER_NAME --branch=main --project=$PROJECT_ID"
echo "  3. Monitor builds at: https://console.cloud.google.com/cloud-build/builds?project=$PROJECT_ID"
echo ""
