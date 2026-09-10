$ErrorActionPreference = "Continue"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$logDir = Join-Path $projectRoot "logs"
$watchdogLog = Join-Path $logDir "watchdog.log"
$startScript = Join-Path $PSScriptRoot "start-enem-up.ps1"

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Write-WatchdogLog {
  param([string] $Message)
  "[$(Get-Date -Format o)] $Message" | Add-Content $watchdogLog
}

$cloudflared = Get-Service -Name "Cloudflared" -ErrorAction SilentlyContinue
if ($cloudflared -and $cloudflared.Status -ne "Running") {
  Write-WatchdogLog "Cloudflared service is $($cloudflared.Status). Starting service."
  Start-Service -Name "Cloudflared" -ErrorAction SilentlyContinue
}

$localHealthy = $false
try {
  $response = Invoke-WebRequest -Uri "http://127.0.0.1:3000/api/health" -UseBasicParsing -TimeoutSec 10
  $localHealthy = $response.StatusCode -eq 200
} catch {
  Write-WatchdogLog "Local health check failed: $($_.Exception.Message)"
}

if (-not $localHealthy) {
  Write-WatchdogLog "Starting ENEM UP after failed local health check."
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File $startScript | Out-Null
}

try {
  $domainResponse = Invoke-WebRequest -Uri "https://enemup.com" -UseBasicParsing -TimeoutSec 15
  Write-WatchdogLog "Domain health check OK: $($domainResponse.StatusCode)."
} catch {
  $statusCode = $null
  if ($_.Exception.Response) {
    $statusCode = [int]$_.Exception.Response.StatusCode
  }

  Write-WatchdogLog "Domain health check failed. Status=$statusCode Message=$($_.Exception.Message)"

  if ($cloudflared) {
    Restart-Service -Name "Cloudflared" -Force -ErrorAction SilentlyContinue
    Write-WatchdogLog "Requested Cloudflared restart after domain failure."
  }
}
