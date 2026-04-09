#!/usr/bin/env pwsh
# Deploy to Cloudflare Pages
# Usage: .\deploy.ps1
# Requires: npm, wrangler (installed via npx)
#
# Set these environment variables before running:
#   $env:CLOUDFLARE_API_TOKEN = "your-token"
#   $env:CLOUDFLARE_ACCOUNT_ID = "your-account-id"
#
# Or create a .env.local file in the project root with:
#   CLOUDFLARE_API_TOKEN=your-token
#   CLOUDFLARE_ACCOUNT_ID=your-account-id

$ErrorActionPreference = "Stop"

# Load .env.local if it exists
$envFile = Join-Path $PSScriptRoot ".env.local"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.+)$') {
            [System.Environment]::SetEnvironmentVariable($Matches[1].Trim(), $Matches[2].Trim(), "Process")
        }
    }
    Write-Host "[+] Loaded .env.local" -ForegroundColor Green
}

# Validate credentials
if (-not $env:CLOUDFLARE_API_TOKEN) {
    Write-Host "[!] CLOUDFLARE_API_TOKEN is not set." -ForegroundColor Red
    Write-Host "    Set it via: `$env:CLOUDFLARE_API_TOKEN = 'your-token'"
    Write-Host "    Or create a .env.local file in the project root."
    exit 1
}
if (-not $env:CLOUDFLARE_ACCOUNT_ID) {
    Write-Host "[!] CLOUDFLARE_ACCOUNT_ID is not set." -ForegroundColor Red
    Write-Host "    Set it via: `$env:CLOUDFLARE_ACCOUNT_ID = 'your-account-id'"
    Write-Host "    Or create a .env.local file in the project root."
    exit 1
}

Write-Host "`n[1/3] Installing dependencies..." -ForegroundColor Cyan
npm ci --silent
if ($LASTEXITCODE -ne 0) { Write-Host "[!] npm ci failed" -ForegroundColor Red; exit 1 }

Write-Host "[2/3] Building..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "[!] Build failed" -ForegroundColor Red; exit 1 }

Write-Host "[3/3] Deploying to Cloudflare Pages..." -ForegroundColor Cyan
npx wrangler pages deploy dist --project-name=3d-viewer
if ($LASTEXITCODE -ne 0) { Write-Host "[!] Deploy failed" -ForegroundColor Red; exit 1 }

Write-Host "`n[+] Deployed successfully!" -ForegroundColor Green
