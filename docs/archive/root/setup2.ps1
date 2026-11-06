$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Set-Location -Path $PSScriptRoot

function Has($cmd) { return [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }
function Refresh-Path { $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User") }

Write-Host "[1/6] .claude 에이전트·권한·MCP·워크플로 설치"
New-Item -ItemType Directory -Force -Path ".claude\agents", ".claude\commands", ".github\workflows" | Out-Null
Copy-Item "_claude-setup\agents\*" ".claude\agents\" -Force
if (Test-Path "_claude-setup\commands") { Copy-Item "_claude-setup\commands\*" ".claude\commands\" -Force }
Copy-Item "_claude-setup\settings.json" ".claude\settings.json" -Force
Copy-Item "_claude-setup\mcp.json" ".mcp.json" -Force
Copy-Item "_claude-setup\github-workflows\pages.yml" ".github\workflows\pages.yml" -Force

Write-Host "[2/6] CLI 확인·설치"
if (-not (Has "git"))  { Write-Host "  Git 설치..."; winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements; Refresh-Path }
if (-not (Has "node")) { Write-Host "  Node.js 설치..."; winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements; Refresh-Path }
if (-not (Has "pnpm")) { Write-Host "  pnpm 설치..."; npm i -g pnpm }
if (-not (Has "claude")) { Write-Host "  Claude Code 설치..."; npm i -g "@anthropic-ai/claude-code" }
if (-not (Has "gh"))   { Write-Host "  GitHub CLI 설치..."; winget install --id GitHub.cli -e --accept-source-agreements --accept-package-agreements; Refresh-Path }
if (-not (Has "supabase")) {
  Write-Host "  Supabase CLI 설치..."
  winget install --id Supabase.cli -e --accept-source-agreements --accept-package-agreements
  Refresh-Path
  if (-not (Has "supabase")) { Write-Host "  (설치 실패 - 에이전트가 npx supabase 로 대체)" }
}

Write-Host "[3/6] ASCII 경로 링크 C:\rs"
if (-not (Test-Path "C:\rs")) { cmd /c mklink /J C:\rs "$PSScriptRoot" | Out-Null }

Write-Host "[4/6] .env.local 준비"
if (-not (Test-Path ".env.local")) { Copy-Item ".env.example" ".env.local" }

Write-Host "[5/6] git 초기화"
if (-not (Test-Path ".git")) {
  git init -q -b main
  git add -A
  git -c user.name="JAE HOON" -c user.email="jaehunlee722@gmail.com" commit -q -m "chore: init agent workspace"
}

Write-Host "[6/6] 정리"
Remove-Item "_claude-setup" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "setup.cmd" -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "===== 완료 ====="
Write-Host "상태:  git=$(Has 'git')  node=$(Has 'node')  pnpm=$(Has 'pnpm')  claude=$(Has 'claude')  gh=$(Has 'gh')  supabase=$(Has 'supabase')"
Write-Host "다음 (새 터미널에서):"
Write-Host "  gh auth login"
Write-Host "  cd C:\rs"
Write-Host "  claude --permission-mode acceptEdits   ->   /loop"
Read-Host "Enter 를 누르면 닫힙니다"
