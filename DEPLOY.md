# VividPlate Deployment Guide

## Google Cloud Build Trigger Configuration

### Issue: Build Trigger Not Using Latest Commit

If your Cloud Build is building an old commit instead of the latest commit on `main`, follow these steps:

### Solution 1: Re-run Build from Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Cloud Build → History**
3. Click **"Run trigger"** or **"Re-run"**
4. Select the trigger for VividPlate
5. Ensure it's building from the `main` branch at HEAD (latest commit)

### Solution 2: Update/Recreate the Build Trigger

#### Using Google Cloud Console:

1. Navigate to **Cloud Build → Triggers**
2. Find the VividPlate trigger
3. Click **Edit**
4. Verify these settings:
   - **Source Repository**: `CyberAngel-Create/VividPlate` (GitHub)
   - **Branch**: `^main$` (regex pattern for main branch)
   - **Build configuration**: `Cloud Build configuration file (yaml or json)`
   - **Cloud Build configuration file location**: `cloudbuild.yaml`
   - **Event**: `Push to a branch`
5. Click **Save**

#### Using gcloud CLI:

```bash
# Delete the old trigger (if exists)
gcloud builds triggers delete vividplate-main-trigger --quiet

# Create a new trigger from the configuration file
gcloud builds triggers import --source=cloudbuild-trigger.yaml

# OR create it directly with command
gcloud builds triggers create github \
  --repo-name=VividPlate \
  --repo-owner=CyberAngel-Create \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml \
  --name=vividplate-main-trigger \
  --description="Build and deploy VividPlate on push to main branch" \
  --substitutions="_SERVICE_NAME=vividplate,_REGION=us-central1"
```

### Solution 3: Manually Trigger Build for Latest Commit

```bash
# Get the latest commit SHA on main
git rev-parse main

# Submit a build manually for the latest commit
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_SERVICE_NAME=vividplate,_REGION=us-central1,COMMIT_SHA=$(git rev-parse main)
```

### Verifying the Fix

After updating the trigger:

1. Push a new commit to the `main` branch
2. Check **Cloud Build → History** to verify a new build starts automatically
3. Verify the build is using the correct commit SHA
4. Once deployed, check the Cloud Run service is running the latest version

### Common Issues

- **Trigger not firing**: Check that the GitHub App is properly connected and has repository access
- **Building wrong branch**: Verify the branch pattern is `^main$` (not `master` or other branches)
- **Old commit being built**: The trigger might have a custom revision set - remove it to use HEAD

### Current Status

- **Latest commit on main**: `ccd8b8b` - Fix server build errors
- **Expected behavior**: Build trigger should automatically build this commit on push to main
- **If still building old commit**: Follow one of the solutions above

## Quick Deploy

For immediate deployment of the latest code:

```bash
# Using Cloud Build
./scripts/deploy-cloud-build.sh YOUR_PROJECT_ID

# OR using Docker + Cloud Run
./scripts/deploy-cloud-run.sh YOUR_PROJECT_ID us-central1
```
