@echo off
setlocal enabledelayedexpansion

set PROJECT=vividplate-503310
echo ============================================================
echo  VividPlate Deployment - Project: %PROJECT%
echo ============================================================
echo.

call gcloud config set project %PROJECT% --quiet

REM ---- Helper to create secret from file ----
echo [1/4] Creating secrets if needed...

gcloud secrets describe DATABASE_URL --project=%PROJECT% --quiet >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Creating DATABASE_URL...
  echo postgresql://neondb_owner:npg_J5TFArU0wejI@ep-calm-poetry-abx9kptm-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require^&channel_binding=require > "%temp%\db_url_secret.txt"
  gcloud secrets create DATABASE_URL --data-file="%temp%\db_url_secret.txt" --project=%PROJECT% --quiet
) else (
  echo DATABASE_URL exists
)

gcloud secrets describe SESSION_SECRET --project=%PROJECT% --quiet >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Creating SESSION_SECRET...
  echo Nx1QZQyys8vi6um2y30dblzyfowic8N45rs+djwkVeSJyQlnMG5rVueSMc7YESxjmd9ChiYdAYN85TlGVjjKKQ== > "%temp%\ss.txt"
  gcloud secrets create SESSION_SECRET --data-file="%temp%\ss.txt" --project=%PROJECT% --quiet
) else (
  echo SESSION_SECRET exists
)

gcloud secrets describe LEMONSQUEEZY_API_KEY --project=%PROJECT% --quiet >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Creating LEMONSQUEEZY_API_KEY...
  echo eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NGQ1OWNlZi1kYmI4LTRlYTUtYjE3OC1kMjU0MGZjZDY5MTkiLCJqdGkiOiJkOTBkMDlmNzhmM2Q4ZDRiZDcyMGUzZTc5OWI5YzE1NmM5Y2I0ODhjN2ZhZWEyOThlNGU3ZTNmODJmNTg0MmZhNTY2M2FmNmIyM2M1Yzk0NSIsImlhdCI6MTc4MDAzNTA2MS44NjM0MzgsIm5iZiI6MTc4MDAzNTA2MS44NjM0NCwiZXhwIjoxNzk1OTEwNDAwLjEyMzYzNywic3ViIjoiNjg0NzcxOSIsInNjb3BlcyI6W119.uOdJ2aEjkPAHz9x0Oh7x9MmogiupVI46UHut7e9q9vnxpec8eNVv-qiUxwOlmHwgKzr2_L7FCE8MmiRC_6hGGWMnqI1a1DjUJgowjkb3Z001LbaKQpMXBNgFVrYwMJZE2xtbdecTl8Uv8Y3xuTG_kd3WdvzQKk462tnLOMCArmVgGL0FGHcW2OhG6IxTPVgeKzI6PSFhS8Sm2yFHjwUpsA0luMIpTXgu_W529BNC--UVLZAnP4hk6noLdrsl9RVBXtIqF5wUDXG1Gxd4ubd-Df8e4RHcPrqf6ASQXXoZUmFTnyZ_Jmkt7AM4BADtUpw4J7nU7gtzKgEKYBNSXaU44v41nJp3q5NuXS8xJaPh4XXw24dH88Ks6Keg6r1Hl8VJuxwfc-e_Gsa27aXCEsjV9JxRko78l-TJDRpZzIS42KIjNs2DI80FZIsMdnowzx1tLbHKqkLKiwW-arYXo6F5_Q5t6q-5nfaREJJBLCXLhEv3UpPvrRpV63w7meT2tKrxEcXoEjDDe7Hlo80r_Ry3icu9N5rmsx2E4dkyqZG80frmUZa8p4ZZzQI2Rahf4qYIDSidj3ZgpA7dCuB7tige3ISsovBnx-d3dMex3CKelqTN7FF02kX0fbZLghl0XkhoQv8ajUb_QTXgmFZsOv8ebh-9_3ieUuBqOLoshZllP3k > "%temp%\ls_api.txt"
  gcloud secrets create LEMONSQUEEZY_API_KEY --data-file="%temp%\ls_api.txt" --project=%PROJECT% --quiet
) else (
  echo LEMONSQUEEZY_API_KEY exists
)

gcloud secrets describe LEMONSQUEEZY_WEBHOOK_SECRET --project=%PROJECT% --quiet >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Creating LEMONSQUEEZY_WEBHOOK_SECRET...
  echo f594b96f30b6804162035a0dcfa13f3ee21fe7be > "%temp%\ls_ws.txt"
  gcloud secrets create LEMONSQUEEZY_WEBHOOK_SECRET --data-file="%temp%\ls_ws.txt" --project=%PROJECT% --quiet
) else (
  echo LEMONSQUEEZY_WEBHOOK_SECRET exists
)

REM ---- Grant IAM ----
echo.
echo [2/4] Granting IAM access...
for /f "tokens=*" %%a in ('gcloud projects describe %PROJECT% --format^=value^(projectNumber^) --quiet') do set PN=%%a
set SA=!PN!-compute@developer.gserviceaccount.com
echo Service Account: !SA!

for %%S in (DATABASE_URL SESSION_SECRET LEMONSQUEEZY_API_KEY LEMONSQUEEZY_WEBHOOK_SECRET) do (
  gcloud secrets add-iam-policy-binding %%S --member="serviceAccount:!SA!" --role="roles/secretmanager.secretAccessor" --project=%PROJECT% --quiet >nul 2>&
