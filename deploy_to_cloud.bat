@echo off
REM Deploy VividPlate to Cloud Run via Cloud Build
set PROJECT_ID=vividplate-503310
set SERVICE_NAME=vividplate
set REGION=us-central1

echo ================================================================
echo  Deploying VividPlate to Cloud Run
echo ================================================================
echo  Project: %PROJECT_ID%
echo  Service: %SERVICE_NAME%
echo  Region:  %REGION%
echo ================================================================
echo.

REM Set project
call gcloud config set project %PROJECT_ID% --quiet
echo.

REM Submit build to Cloud Build
echo Submitting build to Cloud Build (this takes 5-15 minutes)...
echo.
call gcloud builds submit --config=cloudbuild.yaml --project=%PROJECT_ID% --substitutions=_SERVICE_NAME=%SERVICE_NAME%,_REGION=%REGION% --timeout=3600 --quiet

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================================
    echo  BUILD SUCCESSFUL!
    echo ================================================================
    echo.
    echo Your app is deployed at:
    echo   https://%SERVICE_NAME%-4s2dqmjqqa-uc.a.run.app
    echo.
    echo View logs:
    echo   gcloud run logs read %SERVICE_NAME% --region=%REGION% --project=%PROJECT_ID%
    echo.
) else (
    echo.
    echo ================================================================
    echo  BUILD FAILED!
    echo ================================================================
    echo  Check build logs in Cloud Console:
    echo  https://console.cloud.google.com/cloud-build/builds?project=%PROJECT_ID%
    echo.
    exit /b 1
)

