# VividPlate - Complete Deployment Guide

## Prerequisites

- Google Cloud Project: `white-notch-467408-e9`
- gcloud CLI installed and authenticated
- GitHub repository: `CyberAngel-Create/VividPlate.git`
- Database (Neon PostgreSQL) with active connection

---

## Step 1: Verify Your Google Cloud Setup

### 1.1 Configure gcloud
```bash
gcloud config set project white-notch-467408-e9
gcloud auth login  # If not already authenticated
```

### 1.2 Run Pre-deployment Check
```bash
# Windows PowerShell
.\scripts\deploy-to-cloud.ps1 -Action check

# Linux/Mac
bash scripts/deploy-debug.sh
```

---

## Step 2: Create/Update Secrets in Secret Manager

### 2.1 Database URL Secret

**Required Format**: PostgreSQL connection string from Neon

```bash
# Get your Neon database connection string from:
# https://console.neon.tech/app/projects
# Format: postgresql://user:password@endpoint.neon.tech/dbname?sslmode=require

gcloud secrets create DATABASE_URL \
  --data-file=- \
  --project=white-notch-467408-e9 <<< "postgresql://..."
```

### 2.2 Session Secret

```bash
# Generate a random secret (any random string works)
gcloud secrets create SESSION_SECRET \
  --data-file=- \
  --project=white-notch-467408-e9 <<< "your-random-secret-key-$(openssl rand -hex 32)"
```

### 2.3 Lemonsqueezy Secrets (if using payments)

```bash
# Get API key from: https://app.lemonsqueezy.com/settings/api
gcloud secrets create LEMONSQUEEZY_API_KEY \
  --data-file=- \
  --project=white-notch-467408-e9 <<< "eyJ..."

# Get webhook secret from Lemonsqueezy dashboard
gcloud secrets create LEMONSQUEEZY_WEBHOOK_SECRET \
  --data-file=- \
  --project=white-notch-467408-e9 <<< "whsec_..."
```

### 2.4 Telegram Bot Secret (if using Telegram integration)

```bash
# Get bot token from @BotFather on Telegram
gcloud secrets create TELEGRAM_BOT_TOKEN \
  --data-file=- \
  --project=white-notch-467408-e9 <<< "123456789:ABCdef..."
```

---

## Step 3: Grant Service Account Access to Secrets

```bash
# Get project number
PROJECT_NUMBER=$(gcloud projects describe white-notch-467408-e9 --format='value(projectNumber)')
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Grant access to each secret
for SECRET in DATABASE_URL SESSION_SECRET LEMONSQUEEZY_API_KEY LEMONSQUEEZY_WEBHOOK_SECRET TELEGRAM_BOT_TOKEN; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor" \
    --project=white-notch-467408-e9
done
```

---

## Step 4: Deploy to Cloud Run

### 4.1 Using PowerShell (Windows)
```powershell
.\scripts\deploy-to-cloud.ps1 -Action full -ProjectID white-notch-467408-e9
```

### 4.2 Using Bash (Linux/Mac)
```bash
gcloud builds submit --config cloudbuild.yaml \
  --project white-notch-467408-e9
```

---

## Step 5: Monitor Deployment

### 5.1 View Build Status
```bash
# Check real-time build logs
gcloud builds log --stream <BUILD_ID> --project=white-notch-467408-e9

# Or use Cloud Console:
# https://console.cloud.google.com/cloud-build/builds?project=white-notch-467408-e9
```

### 5.2 View Cloud Run Logs
```bash
# After deployment is complete
gcloud run logs read vividplate --region=us-central1 \
  --project=white-notch-467408-e9 --limit=50 --follow
```

### 5.3 Check Service URL
```bash
gcloud run services describe vividplate --region=us-central1 \
  --project=white-notch-467408-e9 --format='value(status.url)'
```

---

## Step 6: Verify Deployment

### 6.1 Check Application Health
```bash
# Get the service URL
SERVICE_URL=$(gcloud run services describe vividplate --region=us-central1 \
  --project=white-notch-467408-e9 --format='value(status.url)')

# Test registration endpoint
curl -X POST $SERVICE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "fullName": "Test User",
    "phone": "+1234567890",
    "password": "TestPassword123"
  }'

# You should get a 201 Created response
```

### 6.2 Test Agent Features
```bash
# After user is logged in, they can request tokens
# This verifies the agent system works

# 1. Agent registers as agent (see /agent-registration page)
# 2. Admin approves agent (admin dashboard)
# 3. Agent requests tokens
# 4. Admin approves token request
# 5. Agent can create premium restaurants
```

---

## Troubleshooting

### Issue: "DATABASE_URL must be set"

**Cause**: Secret Manager secret not properly configured

**Solution**:
```bash
# Verify secret exists
gcloud secrets describe DATABASE_URL --project=white-notch-467408-e9

# Verify service account has access
PROJECT_NUMBER=$(gcloud projects describe white-notch-467408-e9 --format='value(projectNumber)')
gcloud secrets get-iam-policy DATABASE_URL --project=white-notch-467408-e9 | \
  grep "${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
```

### Issue: "Build failed - Docker build error"

**Cause**: Dockerfile or node modules issue

**Solution**:
```bash
# Check the build logs for details
gcloud builds list --project=white-notch-467408-e9 --limit=5
gcloud builds log <BUILD_ID> --project=white-notch-467408-e9
```

### Issue: "Failed to connect to database"

**Cause**: DATABASE_URL format incorrect or database credentials wrong

**Solution**:
1. Verify format: `postgresql://user:password@host:port/database?sslmode=require`
2. Test locally: `psql "connection_string"`
3. Update secret: `gcloud secrets versions add DATABASE_URL --data-file=-`

### Issue: "Authentication fails - invalid admin credentials"

**Cause**: Admin user doesn't have `isAdmin: true` in database

**Solution**:
```sql
-- Update user to admin status in database
UPDATE users SET is_admin = true WHERE username = 'admin_username';
```

---

## Features to Test After Deployment

### Registration & Authentication
- [ ] Register new user (restaurant owner)
- [ ] Register new user (agent)
- [ ] Login with credentials
- [ ] Password reset works
- [ ] User profile can be edited

### Agent Management
- [ ] Agent completes registration (uploads documents)
- [ ] Admin can see pending agents
- [ ] Admin approves/rejects agent
- [ ] Approved agent can request tokens
- [ ] Admin can approve/reject token requests
- [ ] Tokens added to agent balance when approved

### Restaurant Management
- [ ] Approved agent can create restaurant
- [ ] Restaurant uses correct number of tokens
- [ ] Premium restaurants work
- [ ] Restaurant menu can be managed
- [ ] QR codes generate correctly

### Admin Functions
- [ ] Admin dashboard shows statistics
- [ ] Admin can approve agents
- [ ] Admin can approve token requests
- [ ] Admin logs are recorded
- [ ] Admin can manage users

---

## Environment Variables

These are set from Secret Manager during deployment:

| Variable | Source | Purpose |
|----------|--------|---------|
| `DATABASE_URL` | Secret Manager | PostgreSQL connection string |
| `SESSION_SECRET` | Secret Manager | Express session encryption key |
| `NODE_ENV` | Build config | Set to 'production' |
| `LEMONSQUEEZY_STORE_ID` | cloudbuild.yaml | Payment provider store ID |
| `LEMONSQUEEZY_API_KEY` | Secret Manager | Payment provider API key |
| `TELEGRAM_BOT_TOKEN` | Secret Manager | Telegram bot token |

---

## Rollback & Troubleshooting

### If Deployment Goes Wrong

```bash
# See previous revisions
gcloud run revisions list --service=vividplate --region=us-central1 \
  --project=white-notch-467408-e9

# Roll back to previous version
gcloud run deploy vividplate --region=us-central1 \
  --image=gcr.io/white-notch-467408-e9/vividplate:previous \
  --project=white-notch-467408-e9
```

### Check Database Migrations

The `migrate-agent-tokens.mjs` script should run automatically during Cloud Build. To manually check:

```bash
# Connect to database and check tables
psql $DATABASE_URL -c "\dt"

# Should see tables:
# - agents
# - token_requests
# - token_transactions
```

---

## Support & Resources

- **GCP Console**: https://console.cloud.google.com
- **Cloud Run Docs**: https://cloud.google.com/run/docs
- **Cloud Build Docs**: https://cloud.google.com/build/docs
- **Secret Manager**: https://cloud.google.com/secret-manager/docs

