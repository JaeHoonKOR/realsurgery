# 개선 루프 1사이클 실행기 — Claude Code(/improve)를 무인으로 1회 돌린다.
# 사용: powershell -NoProfile -ExecutionPolicy Bypass -File C:\rs\scripts\loop\improve.ps1
# 예약 실행은 scripts\loop\schedule.ps1 이 이 파일을 등록한다.
param([int]$MaxTurns = 200)

$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
# 홈 폴더 package.json(yarn 지정) 간섭 방지 — 저장소의 packageManager(pnpm@9)를 쓰고 다운로드 프롬프트를 끈다
$env:COREPACK_ENABLE_DOWNLOAD_PROMPT = "0"
$env:COREPACK_ENABLE_STRICT = "0"
Set-Location "C:\rs"

if (-not (Test-Path "backlog\log")) { New-Item -ItemType Directory -Force -Path "backlog\log" | Out-Null }

# 겹침 방지: 앞 사이클이 6시간 안에 시작돼 아직 돌고 있으면 이번 회차는 건너뛴다
$lock = "backlog\log\.improve.lock"
if (Test-Path $lock) {
  $age = (Get-Date) - (Get-Item $lock).LastWriteTime
  if ($age.TotalHours -lt 6) { "이전 사이클이 진행 중이라 이번 회차는 건너뜁니다."; exit 0 }
}
New-Item -ItemType File -Force -Path $lock | Out-Null

try {
  # 권한 목록 원본은 config\claude-settings.json (CLAUDE.md 권한 부트스트랩)
  Copy-Item "config\claude-settings.json" ".claude\settings.json" -Force

  # 로컬 감사용 Playwright 브라우저 — 처음 한 번만 설치
  $marker = ".claude\.playwright-installed"
  if (-not (Test-Path $marker)) {
    & pnpm exec playwright install chromium
    if ($LASTEXITCODE -eq 0) { New-Item -ItemType File -Force -Path $marker | Out-Null }
  }

  $log = "backlog\log\improve-run-$(Get-Date -Format yyyyMMdd-HHmm).log"
  "=== improve start $(Get-Date) ===" | Tee-Object -FilePath $log -Append
  $out = & claude -p "/improve" --permission-mode acceptEdits --max-turns $MaxTurns 2>&1 | Out-String
  $out | Tee-Object -FilePath $log -Append | Out-Null

  if ($out -match "(?i)(usage limit|rate limit|limit reached|try again in|resets at|USAGE_LIMIT)") {
    "요금제 한도 — 다음 예약 회차에서 이어갑니다." | Tee-Object -FilePath $log -Append
  } elseif ($out -match "NOTHING_TO_DO") {
    "목표 달성·할 일 없음 — 예약을 끄려면 scripts\loop\unschedule.ps1" | Tee-Object -FilePath $log -Append
  }
  "=== improve end $(Get-Date) ===" | Tee-Object -FilePath $log -Append
}
finally {
  Remove-Item $lock -Force -ErrorAction SilentlyContinue
}
