# VividPlate Deployment Script for PowerShell
$ErrorActionPreference = "Stop"
$PROJECT = "vividplate-503310"
$REGION = "us-central1"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " VividPlate Deployment to Cloud Run" -ForegroundColor Cyan
Write-Host " Project: $PROJECT" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Set project
gcloud config set project $PROJECT --quiet

# Step 1: Create secrets
Write-Host "[1/4] Creating secrets if needed..." -ForegroundColor Yellow

# Check and create DATABASE_URL
$secretExists = gcloud secrets describe DATABASE_URL --project=$PROJECT --quiet 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating DATABASE_URL..."
    $dbUrl = 'postgresql://neondb_owner:npg_J5TFArU0wejI@ep-calm-poetry-abx9kptm-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
    $dbUrl | gcloud secrets create DATABASE_URL --data-file=- --project=$PROJECT --quiet
} else {
    Write-Host "DATABASE_URL exists" -ForegroundColor Green
}

# Check and create SESSION_SECRET
$secretExists = gcloud secrets describe SESSION_SECRET --project=$PROJECT --quiet 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating SESSION_SECRET..."
    'Nx1QZQyys8vi6um2y30dblzyfowic8N45rs+djwkVeSJyQlnMG5rVueSMc7YESxjmd9ChiYdAYN85TlGVjjKKQ==' | gcloud secrets create SESSION_SECRET --data-file=- --project=$PROJECT --quiet
} else {
    Write-Host "SESSION_SECRET exists" -ForegroundColor Green
}

# Check and create LEMONSQUEEZY_API_KEY
$secretExists = gcloud secrets describe LEMONSQUEEZY_API_KEY --project=$PROJECT --quiet 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating LEMONSQUEEZY_API_KEY..."
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NGQ1OWNlZi1kYmI4LTRlYTUtYjE3OC1kMjU0MGZjZDY5MTkiLCJqdGkiOiJkOTBkMDlmNzhmM2Q4ZDRiZDcyMGUzZTc5OWI5YzE1NmM5Y2I0ODhjN2ZhZWEyOThlNGU3ZTNmODJmNTg0MmZhNTY2M2FmNmIyM2M1Yzk0NSIsImlhdCI6MTc4MDAzNTA2MS44NjM0MzgsIm5iZiI6MTc4MDAzNTA2MS44NjM0NCwiZXhwIjoxNzk1OTEwNDAwLjEyMzYzNywic3ViIjoiNjg0NzcxOSIsInNjb3BlcyI6W119.uOdJ2aEjkPAHz9x0Oh7x9MmogiupVI46UHut7e9q9vnxpec8eNVv-qiUxwOlmHwgKzr2_L7FCE8MmiRC_6hGGWMnqI1a1DjUJgowjkb3Z001LbaKQpMXBNgFVrYwMJZE2xtbdecTl8Uv8Y3xuTG_kd3WdvzQKk462tnLOMCArmVgGL0FGHcW2OhG6IxTPVgeKzI6PSFhS8Sm2yFHjwUpsA0luMIpTXgu_W529BNC--UVLZAnP4hk6noLdrsl9RVBXtIqF5wUDXG1Gxd4ubd-Df8e4RHcPrqf6ASQXXoZUmFTnyZ_Jmkt7AM4BADtUpw4J7nU7gtzKgEKYBNSXaU44v41nJp3q5NuXS8xJaPh4XXw24dH88Ks6Keg6r1Hl8VJuxwfc-e_Gsa27aXCEsjV9JxRko78l-TJDRpZzIS42KIjNs2DI80FZIsMdnowzx1tLbHKqkLKiwW-arYXo6F5_Q5t6q-5nfaREJJBLCXLhEv3UpPvrRpV63w7meT2tKrxEcXoEjDDe7Hlo80r_Ry3icu9N5rmsx2E4dkyqZG80frmUZa8p4ZZzQI2Rahf4qYIDSidj3ZgpA7dCuB7tige3ISsovBnx-d3dMex3CKelqTN7FF02kX0fbZLghl0XkhoQv8ajUb_QTXgmFZsOv8ebh-9_3ieUuBqOLoshZllP3k' | gcloud secrets create LEMONSQUEEZY_API_KEY --data-file=- --project=$PROJECT --quiet
} else {
    Write-Host "LEMONSQUEEZY_API_KEY exists" -ForegroundColor Green
}

# Check and create LEMONSQUEEZY_WEBHOOK_SECRET
$secretExists = gcloud secrets describe LEMONSQUEEZY_WEBHOOK_SECRET --project=$PROJECT --quiet 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating LEMONSQUEEZY_WEBHOOK_SECRET..."
    'f594b96f30b6804162035a0dcfa13f3ee21fe7be' | gcloud secrets create LEMONSQUEEZY_WEBHOOK_SECRET --data-file=- --project=$PROJECT --quiet
} else {
    Write-Host "LEMONSQUEEZY_WEBHOOK_SECRET exists" -ForegroundColor Green
}

# Step 2: Grant IAM access
Write-Host ""
Write-Host "[2/4] Granting IAM access..." -ForegroundColor Yellow
$projectInfo = gcloud projects describe $PROJECT --format="value(projectNumber)" --quiet
$sa = "$projectInfo-compute@developer.gserviceaccount.com"
Write-Host "Service Account: $sa" -ForegroundColor Gray

$secrets = @("DATABASE_URL", "SESSION_SECRET", "LEMONSQUEEZY_API_KEY", "LEMONSQUEEZY_WEBHOOK_SECRET")
foreach ($secret in $secrets) {
    gcloud secrets add-iam-policy-binding $secret --member="serviceAccount:$sa" --role="roles/secretmanager.secretAccessor" --project=$PROJECT --quiet 2>$null
    Write-Host "  IAM bound for $secret" -ForegroundColor Green
}

# Step 3: Deploy to Cloud Run
Write-Host ""
Write-Host "[3/4] Deploying to Cloud Run (via source build)..." -ForegroundColor Yellow
Write-Host "This will build and deploy - may take 10-15 minutes..." -ForegroundColor Gray
Write-Host ""

$envVars = "NODE_ENV=production,CHAPA_ENABLED=false,TELEGRAM_BOT_TOKEN=false,LEMONSQUEEZY_STORE_ID=338030,LEMONSQUEEZY_MONTHLY_VARIANT_ID=1713315,LEMONSQUEEZY_YEARLY_VARIANT_ID=1713296,LEMONSQUEEZY_WEBSITE_ADDON_VARIANT_ID=1732293"
$secretsStr = "DATABASE_URL=DATABASE_URL:latest,SESSION_SECRET=SESSION_SECRET:latest,LEMONSQUEEZY_API_KEY=LEMONSQUEEZY_API_KEY:latest,LEMONSQUEEZY_WEBHOOK_SECRET=LEMONSQUEEZY_WEBHOOK_SECRET:latest"

gcloud run deploy vividplate --source . `
    --region $REGION `
    --platform managed `
    --allow-unauthenticated `
    --port 8080 `
    --memory 1Gi `
    --cpu 1 `
    --min-instances 0 `
    --max-instances 10 `
    --cpu-boost `
    --set-env-vars $envVars `
    --set-secrets $secretsStr `
    --quiet

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host " DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
    $url = gcloud run services describe vividplate --region=$REGION --project=$PROJECT --format="value(status.url)" --quiet
    Write-Host "Service URL: $url" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Service Console: https://console.cloud.google.com/run/detail/$REGION/vividplate?project=$PROJECT" -ForegroundColor Blue
} else {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host " BUILD IN PROGRESS - Check status at:" -ForegroundColor Yellow
    Write-Host " https://console.cloud.google.com/cloud-build/builds?project=$PROJECT" -ForegroundColor Blue
    Write-Host "============================================================" -ForegroundColor Red
}

Read-Host "Press Enter to exit"
