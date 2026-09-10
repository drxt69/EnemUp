$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$logDir = Join-Path $projectRoot "logs"
$outLog = Join-Path $logDir "enem-up.out.log"
$errLog = Join-Path $logDir "enem-up.err.log"

New-Item -ItemType Directory -Force -Path $logDir | Out-Null
Set-Location $projectRoot

$listener = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($listener) {
  "[$(Get-Date -Format o)] ENEM UP already listening on port 3000." | Add-Content $outLog
  exit 0
}

if (-not (Test-Path (Join-Path $projectRoot ".next"))) {
  "[$(Get-Date -Format o)] Building ENEM UP before production start." | Add-Content $outLog
  npm run build *>> $outLog
}

"[$(Get-Date -Format o)] Starting ENEM UP on port 3000." | Add-Content $outLog
Start-Process -FilePath "npm.cmd" `
  -ArgumentList "run", "start" `
  -WorkingDirectory $projectRoot `
  -WindowStyle Hidden `
  -RedirectStandardOutput $outLog `
  -RedirectStandardError $errLog
