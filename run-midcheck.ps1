$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Set-Location "C:\rs"
$env:COREPACK_ENABLE_DOWNLOAD_PROMPT = "0"
$log = "backlog\log\midcheck-$(Get-Date -Format yyyyMMdd-HHmm).log"
"=== midcheck start $(Get-Date) ===" | Tee-Object -FilePath $log -Append
# 1) 밤샘 러너가 아직 돌고 있으면 끝날 때까지 대기 (최대 3시간)
$waited = 0
while ((Get-Process -Name claude -ErrorAction SilentlyContinue) -and $waited -lt 180) { Start-Sleep -Seconds 60; $waited++ }
"runner finished (waited $waited min)" | Tee-Object -FilePath $log -Append
Copy-Item "config\claude-settings.json" ".claude\settings.json" -Force
if (Test-Path "config\agents") { Copy-Item "config\agents\*.md" ".claude\agents\" -Force }
# 2) 점검·개선 세션 (최대 3회, 각 400턴)
$prompt = Get-Content "config\midcheck-prompt.md" -Raw -Encoding UTF8
for ($i = 1; $i -le 3; $i++) {
  "--- midcheck pass $i  $(Get-Date -Format HH:mm) ---" | Tee-Object -FilePath $log -Append
  $out = & claude -p $prompt --permission-mode acceptEdits --max-turns 400 2>&1 | Out-String
  $out | Tee-Object -FilePath $log -Append | Out-Null
  if ($out -match "NOTHING_TO_DO") { "nothing left - stopping midcheck" | Tee-Object -FilePath $log -Append; break }
  if ($out -match "(?i)(hit your (usage |rate )?limit|usage limit reached|rate_limit_error|You.ve reached|resets at \d)") { "usage limit - sleeping 60 min" | Tee-Object -FilePath $log -Append; Start-Sleep -Seconds 3600 }
}
git -C C:\rs add -A 2>$null; git -C C:\rs commit -q -m "chore: midcheck log" 2>$null
# 3) 남은 todo가 있으면 밤샘 러너를 한 번 더
if (-not ($out -match "NOTHING_TO_DO")) { "restarting run-night" | Tee-Object -FilePath $log -Append; & powershell -NoProfile -ExecutionPolicy Bypass -File "C:\rs\run-night.ps1" }
"=== midcheck end $(Get-Date) ===" | Tee-Object -FilePath $log -Append
