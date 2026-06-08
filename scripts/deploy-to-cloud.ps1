# VividPlate Cloud Deployment Script for PowerShell (Windows)
# Usage: .\scripts\deploy-to-cloud.ps1

param(
    [string]$Action = "full",  # Options: full, check, deploy, logs
    [string]$ProjectID = "white-notch-467408-e9"
)

$ErrorActionPreference = "Stop"

# Colors for output
$Green = "`e[32m"
$Red = "`e[31m"
$Yellow = "`e[33m"
$Reset = "`e[0m"

function Write-Success {
    Write-Host "$Green[OK]$Reset $args"
}

function Write-Error2 {
    Write-Host "$Red[ERROR]$Reset $args" -ForegroundColor Red
}

function Write-Warning2 {
    Write-Host "$Yellow[WARNING]$Reset $args"
}

$Region = "us-central1"
$ServiceName = "vividplate"
$RequiredSecrets = @("DATABASE_URL", "SESSION_SECRET", "LEMONSQUEEZY_API_KEY", "LEMONSQUEEZY_WEBHOOK_SECRET", "TELEGRAM_BOT_TOKEN")

Write-Host ""
Write-Host "=========================================================="
Write-Host "         VividPlate Cloud Deployment Manager              "
Write-Host "           Project: $ProjectID"
Write-Host "=========================================================="
Write-Host ""

# Function: Check prerequisites
function Check-Prerequisites {
    Write-Host "Step 1: Checking Prerequisites..."
    Write-Host ""
    
    # Check if gcloud is installed
    try {
        $null = gcloud version 2>$null
        Write-Success "gcloud CLI installed"
    }
    catch {
        Write-Error2 "gcloud CLI not found. Install it from https://cloud.google.com/sdk/docs/install"
        exit 1
    }
    
    # Check Docker
    try {
        $null = docker --version 2>$null
        Write-Success "Docker installed"
    }
    catch {
        Write-Warning2 "Docker not found (needed for local builds, but Cloud Build can work without it)"
    }
    
    # Check if authenticated
    try {
        $account = gcloud config get-value account 2>$null
        Write-Success "Authenticated as: $account"
    }
    catch {
        Write-Error2 "Not authenticated with gcloud. Run: gcloud auth login"
        exit 1
    }
}

# Function: Check secrets
function Check-Secrets {
    Write-Host ""
    Write-Host "Step 2: Checking Secrets in Secret Manager..."
    Write-Host ""
    
    $SetProject = gcloud config set project $ProjectID --quiet 2>$null
    
    $allSecretsExist = $true
    foreach ($secret in $RequiredSecrets) {
        try {
            $null = gcloud secrets describe $secret --project=$ProjectID 2>$null
            Write-Success "Secret exists: $secret"
        }
        catch {
            Write-Error2 "Secret missing: $secret"
            $allSecretsExist = $false
        }
    }
    
    if (-not $allSecretsExist) {
        Write-Host ""
        Write-Warning2 "Some secrets are missing. Create them with:"
        Write-Host ""
        Write-Host "  # Database URL (Neon PostgreSQL)"
        Write-Host '  gcloud secrets create DATABASE_URL --data-file=- <<< "postgresql://..."'
        Write-Host ""
        Write-Host "  # Session Secret"
        Write-Host '  gcloud secrets create SESSION_SECRET --data-file=- <<< "your-random-secret"'
        Write-Host ""
        exit 1
    }
    
    return $allSecretsExist
}

# Function: Check service account permissions
function Check-ServiceAccountPermissions {
    Write-Host ""
    Write-Host "Step 3: Checking Service Account Permissions..."
    Write-Host ""
    
    $ProjectNumber = gcloud projects describe $ProjectID --format='value(projectNumber)' 2>$null
    $ServiceAccount = "$ProjectNumber-compute@developer.gserviceaccount.com"
    
    Write-Host "Service Account: $ServiceAccount"
    Write-Host ""
    
    foreach ($secret in $RequiredSecrets) {
        $policy = gcloud secrets get-iam-policy $secret --project=$ProjectID --format=json 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue
        
        if ($policy.bindings | Where-Object { $_.members -contains "serviceAccount:$ServiceAccount" }) {
            Write-Success "Permissions OK: $secret"
        }
        else {
            Write-Error2 "Missing permissions for: $secret"
            Write-Host "  Run: gcloud secrets add-iam-policy-binding $secret --member=`"serviceAccount:$ServiceAccount`" --role=`"roles/secretmanager.secretAccessor`" --project=$ProjectID"
        }
    }
}

# Function: Deploy
function Deploy {
    Write-Host ""
    Write-Host "Step 4: Submitting Build to Cloud Build..."
    Write-Host ""
    
    $BuildConfig = "cloudbuild.yaml"
    if (-not (Test-Path $BuildConfig)) {
        Write-Error2 "cloudbuild.yaml not found in current directory"
        exit 1
    }
    
    Write-Host "Starting build... This may take 5-10 minutes."
    Write-Host ""
    
    gcloud builds submit --config=$BuildConfig --project=$ProjectID --substitutions="_SERVICE_NAME=$ServiceName,_REGION=$Region"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Success "Build submitted successfully!"
        Write-Host ""
        Write-Host "Monitor the build in Cloud Console:"
        Write-Host "  https://console.cloud.google.com/cloud-build/builds?project=$ProjectID"
        Write-Host ""
    }
    else {
        Write-Error2 "Build submission failed"
        exit 1
    }
}

# Function: View logs
function View-Logs {
    Write-Host ""
    Write-Host "Fetching recent logs from Cloud Run..."
    Write-Host ""
    
    gcloud run logs read $ServiceName --region=$Region --project=$ProjectID --limit=50
}

# Function: Full deployment
function Full-Deploy {
    Check-Prerequisites
    Check-Secrets
    Check-ServiceAccountPermissions
    Deploy
}

# Main
switch ($Action) {
    "check" {
        Check-Prerequisites
        Check-Secrets
        Check-ServiceAccountPermissions
    }
    "deploy" {
        Deploy
    }
    "logs" {
        View-Logs
    }
    "full" {
        Full-Deploy
    }
    default {
        Write-Error2 "Unknown action: $Action"
        Write-Host "Valid options: full, check, deploy, logs"
    }
}

Write-Host ""
Write-Host "Done!"
Write-Host ""
