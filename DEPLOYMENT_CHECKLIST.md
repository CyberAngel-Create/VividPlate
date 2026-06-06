# VividPlate Deployment Checklist

## Google Cloud Setup

### Project ID
- **Project:** white-notch-467408-e9
- **Region:** us-central1
- **Service:** vividplate

### Step 1: Create Secrets in Cloud Secret Manager

Before deploying, create these secrets in GCP Secret Manager:

```bash
# Set project
export PROJECT_ID=white-notch-467408-e9
gcloud config set project $PROJECT_ID

# 1. Database URL (Neon PostgreSQL)
gcloud secrets create DATABASE_URL --data-file=- <<< "postgresql://user:password@endpoint.neon.tech/dbname?sslmode=require"

# 2. Session Secret (for session management)
gcloud secrets create SESSION_SECRET --data-file=- <<< "your-random-secret-key-$(openssl rand -hex 32)"

# 3. Lemonsqueezy API Key
gcloud secrets create LEMONSQUEEZY_API_KEY --data-file=- <<< "eyJ..."

# 4. Lemonsqueezy Webhook Secret
gcloud secrets create LEMONSQUEEZY_WEBHOOK_SECRET --data-file=- <<< "whsec_..."

# 5. Telegram Bot Token
gcloud secrets create TELEGRAM_BOT_TOKEN --data-file=- <<< "123456:ABCdef..."
```

### Step 2: Grant Cloud Run Service Account Access to Secrets

```bash
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Grant access to each secret
for SECRET in DATABASE_URL SESSION_SECRET LEMONSQUEEZY_API_KEY LEMONSQUEEZY_WEBHOOK_SECRET TELEGRAM_BOT_TOKEN; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor"
done
```

### Step 3: Deploy

```bash
gcloud builds submit --config cloudbuild.yaml --project $PROJECT_ID
```

## Verification Checklist

- [ ] All 5 secrets exist in Secret Manager
- [ ] Service account has access to all secrets
- [ ] Cloud Build permissions are correct
- [ ] Database migrations run successfully
- [ ] Application starts without errors
- [ ] Registration endpoint responds
- [ ] Agent token request endpoint responds
- [ ] Admin token approval endpoint responds

## Troubleshooting

### If deployment fails with "DATABASE_URL must be set"
1. Verify DATABASE_URL secret exists: `gcloud secrets describe DATABASE_URL`
2. Check service account has access: `gcloud secrets get-iam-policy DATABASE_URL`
3. Verify cloudbuild.yaml syntax for secrets section

### If database migration fails
1. Verify DATABASE_URL format (should include sslmode=require for Neon)
2. Check database credentials
3. Ensure database user has CREATE TABLE permissions

