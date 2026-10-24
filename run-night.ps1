$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Set-Location "C:\rs"
# 홈 폴더 package.json(yarn 지정) 간섭 방지: 저장소 package.json의 packageManager(pnpm@9)를 쓰고 다운로드 프롬프트를 끈다
$env:COREPACK_ENABLE_DOWNLOAD_PROMPT = "0"
$env:COREPACK_ENABLE_STRICT = "0"
if (-not (Test-Path "backlog\log")) { New-Item -ItemType Directory -Force -Path "backlog\log" | Out-Null }
$max = 12
$log = "backlog\log\night-$(Get-Date -Format yyyyMMdd-HHmm).log"
powercfg /change standby-timeout-ac 0 | Out-Null
powercfg /change hibernate-timeout-ac 0 | Out-Null
Copy-Item "config\claude-settings.json" ".claude\settings.json" -Force
if (Test-Path "config\orchestrator.md") { Copy-Item "config\orchestrator.md" ".claude\agents\orchestrator.md" -Force }
"=== night run start $(Get-Date) ===" | Tee-Object -FilePath $log -Append
for ($i = 1; $i -le $max; $i++) {
  "--- loop $i / $max  $(Get-Date -Format HH:mm) ---" | Tee-Object -FilePath $log -Append
  $out = & claude -p "/loop" --permission-mode acceptEdits --max-turns 150 2>&1 | Out-String
  $out | Tee-Object -FilePath $log -Append | Out-Null
  if ($out -match "NOTHING_TO_DO") { "no runnable tasks - stopping" | Tee-Object -FilePath $log -Append; break }
  if ($out -match "(?i)(rate limit|usage limit|limit reached|try again in|resets at)") {
    "usage limit hit - sleeping 60 min" | Tee-Object -FilePath $log -Append
    Start-Sleep -Seconds 3600
    continue
  }
  Start-Sleep -Seconds 20
}
"=== night run end $(Get-Date) ===" | Tee-Object -FilePath $log -Append
git -C C:\rs add -A 2>$null
git -C C:\rs commit -q -m "chore: night run log" 2>$null
