@echo off
REM VividPlate Direct Deployment Script
REM Bypass prompt issues with direct gcloud call

setlocal enabledelayedexpansion

set PROJECT_ID=vividplate-503310
set SERVICE_NAME=vividplate
set REGION=us-central1

echo ======================================================================
echo   VividPlate Cloud Build Deployment
echo ======================================================================
echo.
echo Project: %PROJECT_ID%
echo Service: %SERVICE_NAME%
echo Region: %REGION%
echo.

REM Set environment to disable prompts
set CLOUDSDK_CORE_DISABLE_PROMPTS=true
set CLOUDSDK_CORE_DISABLE_USAGE_REPORTING=true

REM Step 1: Configure gcloud
echo [1/3] Configuring gcloud project...
call gcloud config set project %PROJECT_ID% --quiet
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to configure gcloud
    exit /b 1
)
echo OK - Project configured
echo.

REM Step 2: Check secrets exist
echo [2/3] Checking secrets...
setlocal enabledelayedexpansion
for %%S in (DATABASE_URL,SESSION_SECRET,LEMONSQUEEZY_API_KEY,LEMONSQUEEZY_WEBHOOK_SECRET) do (
    call gcloud secrets describe %%S --project=%PROJECT_ID% --quiet >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo OK - %%S
    ) else (
        echo ERROR - %%S missing!
        exit /b 1
    )
)
echo.

REM Step 3: Submit build
echo [3/3] Submitting build to Cloud Build...
echo This may take 5-15 minutes...
echo.

call gcloud builds submit ^
  --config=cloudbuild.yaml ^
  --project=%PROJECT_ID% ^
  --substitutions="_SERVICE_NAME=%SERVICE_NAME%,_REGION=%REGION%" ^
  --timeout=3600 ^
  --quiet

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ======================================================================
    echo   SUCCESS - Build submitted!
    echo ======================================================================
    echo.
    echo Monitor your build:
    echo   https://console.cloud.google.com/cloud-build/builds?project=%PROJECT_ID%
    echo.
    echo View logs:
    echo   gcloud run logs read %SERVICE_NAME% --region=%REGION% --project=%PROJECT_ID% --follow
    echo.
    exit /b 0
) else (
    echo.
    echo ERROR: Build submission failed
    exit /b 1
)
