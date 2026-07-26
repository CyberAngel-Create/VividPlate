@echo off
echo Deploying VividPlate to Cloud Run...
echo Project: vividplate-503310
echo Region: us-central1
echo Service: vividplate
echo.

call gcloud config set project vividplate-503310 --quiet

call gcloud run deploy vividplate --source . ^
  --region us-central1 ^
  --platform managed ^
  --allow-unauthenticated ^
  --port 8080 ^
  --memory 1Gi ^
  --cpu 1 ^
  --min-instances 0 ^
  --max-instances 10 ^
  --cpu-boost ^
  --set-env-vars "NODE_ENV=production,CHAPA_ENABLED=false,TELEGRAM_BOT_TOKEN=false,LEMONSQUEEZY_STORE_ID=338030,LEMONSQUEEZY_MONTHLY_VARIANT_ID=1713315,LEMONSQUEEZY_YEARLY_VARIANT_ID=1713296,LEMONSQUEEZY_WEBSITE_ADDON_VARIANT_ID=1732293" ^
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,SESSION_SECRET=SESSION_SECRET:latest,LEMONSQUEEZY_API_KEY=LEMONSQUEEZY_API_KEY:latest,LEMONSQUEEZY_WEBHOOK_SECRET=LEMONSQUEEZY_WEBHOOK_SECRET:latest"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo  DEPLOYMENT SUCCESSFUL!
    echo ============================================================
    echo.
    echo Getting service URL...
    for /f "tokens=*" %%a in ('gcloud run services describe vividplate --region us-central1 --project vividplate-503310 --format^=value^(status.url^)') do set SERVICE_URL=%%a
    echo Service URL: %SERVICE_URL%
    echo.
) else (
    echo.
    echo ============================================================
    echo  DEPLOYMENT FAILED
    echo ============================================================
    echo.
    echo Check logs at:
    echo https://console.cloud.google.com/run/deploy/us-central1/vividplate?project=vividplate-503310
    echo.
    echo Or run:
    echo gcloud builds list --project=vividplate-503310
    echo.
    pause
    exit /b 1
)

pause

