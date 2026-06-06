# VividPlate Manual Deployment Instructions

## Prerequisites

Before starting, ensure you have:
1. **gcloud CLI** installed (https://cloud.google.com/sdk/docs/install)
2. **Git** configured with GitHub access
3. Access to GCP Project: `white-notch-467408-e9`
4. Database connection string from Neon PostgreSQL

---

## Step 1: Download and Authenticate

### 1.1 Install gcloud CLI (if not already installed)

**Windows**:
- Download from: https://cloud.google.com/sdk/docs/install-sdk
- Or use: `choco install google-cloud-sdk`

**macOS/Linux**:
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### 1.2 Authenticate with Google Cloud

```bash
gcloud auth login
gcloud config set project white-notch-467408-e9
```

---

## Step 2: Create Secrets in GCP Secret Manager

Run these commands to create the required secrets. Replace the placeholder values with your actual credentials.

### 2.1 Database URL Secret

```bash
gcloud secrets create DATABASE_URL \
  --replication-policy="automatic" \
  --data-file=- <<< "postgresql://user:password@endpoint.neon.tech/dbname?sslmode=require"
```

### 2.2 Session Secret

```bash
gcloud secrets create SESSION_SECRET \
  --replication-policy="automatic" \
  --data-file=- <<< "your-random-session-secret-key-here"
```

### 2.3 Lemonsqueezy API Key (if using payments)

```bash
gcloud secrets create LEMONSQUEEZY_API_KEY \
  --replication-policy="automatic" \
  --data-file=- <<< "eyJ0eXAiOiJKV1QiLCJhbGc..."
```

### 2.4 Lemonsqueezy Webhook Secret (if using payments)

```bash
gcloud secrets create LEMONSQUEEZY_WEBHOOK_SECRET \
  --replication-policy="automatic" \
  --data-file=- <<< "whsec_..."
```

### 2.5 Telegram Bot Token (if using Telegram integration)

```bash
gcloud secrets create TELEGRAM_BOT_TOKEN \
  --replication-policy="automatic" \
  --data-file=- <<< "123456789:ABCdefGHIjklmno..."
```

### Verify Secrets Were Created

```bash
gcloud secrets list --project=white-notch-467408-e9
```

You should see all 5 secrets listed.

---

## Step 3: Grant Service Account Permissions

### 3.1 Get Service Account Email

```bash
PROJECT_NUMBER=$(gcloud projects describe white-notch-467408-e9 --format='value(projectNumber)')
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
echo "Service Account: $SERVICE_ACCOUNT"
```

### 3.2 Grant Permissions for Each Secret

```bash
# Grant access to DATABASE_URL
gcloud secrets add-iam-policy-binding DATABASE_URL \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor" \
  --project=white-notch-467408-e9

# Grant access to SESSION_SECRET
gcloud secrets add-iam-policy-binding SESSION_SECRET \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor" \
  --project=white-notch-467408-e9

# Grant access to LEMONSQUEEZY_API_KEY
gcloud secrets add-iam-policy-binding LEMONSQUEEZY_API_KEY \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor" \
  --project=white-notch-467408-e9

# Grant access to LEMONSQUEEZY_WEBHOOK_SECRET
gcloud secrets add-iam-policy-binding LEMONSQUEEZY_WEBHOOK_SECRET \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor" \
  --project=white-notch-467408-e9

# Grant access to TELEGRAM_BOT_TOKEN
gcloud secrets add-iam-policy-binding TELEGRAM_BOT_TOKEN \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor" \
  --project=white-notch-467408-e9
```

---

## Step 4: Deploy to Cloud Run

### Navigate to the project directory

```bash
cd e:\VividPlateLast\VividPlateLast
# or
cd /path/to/VividPlate
```

### Submit the build

```bash
gcloud builds submit --config cloudbuild.yaml --project white-notch-467408-e9
```

This will:
1. Build the Docker image
2. Run database migrations
3. Push to Container Registry
4. Deploy to Cloud Run
5. Configure all environment variables and secrets

**Deployment time**: Approximately 5-15 minutes

---

## Step 5: Monitor the Deployment

### Option 1: Watch Build in Terminal

```bash
# Get the build ID from the previous command, then:
gcloud builds log --stream <BUILD_ID> --project=white-notch-467408-e9

# Or view all recent builds
gcloud builds list --project=white-notch-467408-e9 --limit=5
```

### Option 2: Monitor in Cloud Console

Open: https://console.cloud.google.com/cloud-build/builds?project=white-notch-467408-e9

---

## Step 6: Get the Service URL

Once deployment completes successfully:

```bash
gcloud run services describe vividplate --region=us-central1 \
  --project=white-notch-467408-e9 --format='value(status.url)'
```

This will output something like: `https://vividplate-abc123def456.a.run.app`

---

## Step 7: View Logs

### Real-time logs:

```bash
gcloud run logs read vividplate --region=us-central1 \
  --project=white-notch-467408-e9 --follow
```

### Recent logs:

```bash
gcloud run logs read vividplate --region=us-central1 \
  --project=white-notch-467408-e9 --limit=50
```

---

## Troubleshooting

### Issue: "DATABASE_URL must be set"

**Solution:**
1. Verify secret exists: `gcloud secrets describe DATABASE_URL`
2. Verify service account has access: `gcloud secrets get-iam-policy DATABASE_URL`
3. Check format includes `?sslmode=require` for Neon

### Issue: "Build failed - permission denied"

**Solution:**
1. Ensure you're authenticated: `gcloud auth login`
2. Ensure project is set correctly: `gcloud config set project white-notch-467408-e9`
3. Check Cloud Build permissions in IAM

### Issue: "Secret not found"

**Solution:**
```bash
# List all secrets
gcloud secrets list --project=white-notch-467408-e9

# Recreate missing secret
gcloud secrets create <SECRET_NAME> --data-file=- <<< "<value>"
```

### Issue: "Service account doesn't have access"

**Solution:**
```bash
# Get service account email
PROJECT_NUMBER=$(gcloud projects describe white-notch-467408-e9 --format='value(projectNumber)')
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Grant permissions
gcloud secrets add-iam-policy-binding <SECRET_NAME> \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor" \
  --project=white-notch-467408-e9
```

---

## After Deployment

### Test Registration Endpoint

```bash
SERVICE_URL="https://vividplate-abc123.a.run.app"

curl -X POST $SERVICE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "fullName": "Test User",
    "phone": "+1234567890",
    "password": "TestPassword123"
  }'
```

Expected response: 201 Created with user data

### Test Login Endpoint

```bash
curl -X POST $SERVICE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "testuser",
    "password": "TestPassword123"
  }'
```

### Test Agent Endpoints

After user is created and logged in (requires setting session cookie):

```bash
# Get agent profile
curl -X GET $SERVICE_URL/api/agents/me \
  -H "Cookie: connect.sid=<your_session_cookie>"
```

---

## Important Notes

- All secrets are stored securely in GCP Secret Manager
- Service account has minimal permissions (only access to secrets)
- Cloud Run scales automatically from 0 to 10 instances
- Each deployment creates a new revision; old ones are retained for rollback

---

## Quick Command Reference

```bash
# Deploy
gcloud builds submit --config cloudbuild.yaml --project white-notch-467408-e9

# Check status
gcloud builds list --project=white-notch-467408-e9 --limit=1

# View logs
gcloud run logs read vividplate --region=us-central1 --project=white-notch-467408-e9 --follow

# Get URL
gcloud run services describe vividplate --region=us-central1 --project=white-notch-467408-e9 --format='value(status.url)'

# Rollback (if needed)
gcloud run revisions list --service=vividplate --region=us-central1 --project=white-notch-467408-e9
gcloud run deploy vividplate --region=us-central1 --revision=<REVISION_ID> --project=white-notch-467408-e9
```

