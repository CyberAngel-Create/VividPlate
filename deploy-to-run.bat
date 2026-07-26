@echo off
REM Deploy VividPlate to Cloud Run directly from source
set PROJECT_ID=vividplate-503310
set SERVICE_NAME=vividplate
set REGION=us-central1

echo ======================================================================
echo   Deploying VividPlate to Cloud Run
echo ======================================================================
echo Project: %PROJECT_ID%
echo Service: %SERVICE_NAME%
echo Region: %REGION%
echo.

gcloud config set project %PROJECT_ID% --quiet

echo.
echo Deploying from source (this will build and deploy automatically)...
echo This may take 10-20 minutes...
echo.

gcloud run deploy %SERVICE_NAME% ^
  --source . ^
  --project=%PROJECT_ID% ^
  --region=%REGION% ^
  --allow-unauthenticated ^
  --port=8080 ^
  --memory=1Gi ^
  --cpu=1 ^
  --min-instances=0 ^
  --max-instances=10 ^
  --cpu-boost ^
  --set-env-vars="NODE_ENV=production,CHAPA_ENABLED=false,TELEGRAM_BOT_TOKEN=false,LEMONSQUEEZY_STORE_ID=338030,LEMONSQUEEZY_MONTHLY_VARIANT_ID=1713315,LEMONSQUEEZY_YEARLY_VARIANT_ID=1713296,LEMONSQUEEZY_WEBSITE_ADDON_VARIANT_ID=1732293" ^
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,SESSION_SECRET=SESSION_SECRET:latest,LEMONSQUEEZY_API_KEY=LEMONSQUEEZY_API_KEY:latest,LEMONSQUEEZY_WEBHOOK_SECRET=LEMONSQUEEZY_WEBHOOK_SECRET:latest"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ======================================================================
    echo   SUCCESS - Service Deployed!
    echo ======================================================================
    echo.
    echo Get service URL:
    echo   gcloud run services describe %SERVICE_NAME% --region=%REGION% --project=%PROJECT_ID% --format="value(status.url)"
    echo.
    echo View logs:
    echo   gcloud run logs read %SERVICE_NAME% --region=%REGION% --project=%PROJECT_ID% --follow
) else (
    echo.
    echo ERROR: Deployment failed
    exit /b 1
)

