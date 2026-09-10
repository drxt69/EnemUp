$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$startScript = Join-Path $PSScriptRoot "start-enem-up.ps1"
$watchdogScript = Join-Path $PSScriptRoot "watchdog-enem-up.ps1"

$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest

$startAction = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$startScript`"" `
  -WorkingDirectory $projectRoot

$startupTrigger = New-ScheduledTaskTrigger -AtLogOn

Register-ScheduledTask `
  -TaskName "ENEM UP - iniciar servidor" `
  -Action $startAction `
  -Trigger $startupTrigger `
  -Principal $principal `
  -Description "Inicia o servidor local do ENEM UP na porta 3000 quando o usuario entra no Windows." `
  -Force | Out-Null

$watchdogAction = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$watchdogScript`"" `
  -WorkingDirectory $projectRoot

$watchdogTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1)
$watchdogTrigger.Repetition.Interval = "PT5M"
$watchdogTrigger.Repetition.Duration = "P3650D"

Register-ScheduledTask `
  -TaskName "ENEM UP - monitor de disponibilidade" `
  -Action $watchdogAction `
  -Trigger $watchdogTrigger `
  -Principal $principal `
  -Description "Verifica o ENEM UP a cada 5 minutos e tenta recuperar servidor local e Cloudflared." `
  -Force | Out-Null

Write-Host "Tarefas agendadas criadas:"
Write-Host "- ENEM UP - iniciar servidor"
Write-Host "- ENEM UP - monitor de disponibilidade"
