# Run Docker container locally with env from .env (PowerShell)
Param(
  [string]$EnvFile = ".env"
)

if (Test-Path $EnvFile) {
  Get-Content $EnvFile | ForEach-Object {
    if ($_ -and -not $_.StartsWith('#')) {
      $parts = $_ -split '=', 2
      if ($parts.Length -eq 2) { Set-Item -Path Env:$($parts[0]) -Value $parts[1] }
    }
  }
}

docker build -t vividplate:local .

docker run --rm -p 8080:8080 `
  -e DATABASE_URL="$env:DATABASE_URL" `
  -e SESSION_SECRET="$env:SESSION_SECRET" `
  -e TELEGRAM_BOT_TOKEN="$env:TELEGRAM_BOT_TOKEN" `
  -e CHAPA_SECRET_KEY="$env:CHAPA_SECRET_KEY" `
  --name vividplate-local vividplate:local
