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
gcloud builds triggers delete vividplate-main-trigger \
  --project=YOUR_PROJECT_ID \
  --quiet

# Create a new trigger from the configuration file
gcloud builds triggers import \
  --source=cloudbuild-trigger.yaml \
  --project=YOUR_PROJECT_ID

# OR create it directly with command
gcloud builds triggers create github \
  --repo-name=VividPlate \
  --repo-owner=CyberAngel-Create \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml \
  --name=vividplate-main-trigger \
  --description="Build and deploy VividPlate on push to main branch" \
  --substitutions="_SERVICE_NAME=vividplate,_REGION=us-central1" \
  --project=YOUR_PROJECT_ID
```

### Solution 3: Manually Trigger Build for Latest Commit

```bash
# Option A: Trigger the existing build trigger to run on main branch
gcloud builds triggers run vividplate-main-trigger \
  --branch=main \
  --project=YOUR_PROJECT_ID

# Option B: Submit a build from your local repository state
# Note: This builds from your current local state, not directly from a specific commit
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_SERVICE_NAME=vividplate,_REGION=us-central1 \
  --project=YOUR_PROJECT_ID
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

### Verifying Your Setup

To verify your trigger is working correctly:

```bash
# Check the latest commit SHA on main
git rev-parse main

# Or view recent commits
git log --oneline -5
```

**Expected behavior**: 
- Build trigger should automatically start a build when you push to main
- The build should use the latest commit SHA from the main branch
- If builds are still using an old commit, follow one of the solutions above

## Quick Deploy

For immediate deployment of the latest code:

```bash
# Using Cloud Build
./scripts/deploy-cloud-build.sh YOUR_PROJECT_ID

# OR using Docker + Cloud Run
./scripts/deploy-cloud-run.sh YOUR_PROJECT_ID us-central1
```
