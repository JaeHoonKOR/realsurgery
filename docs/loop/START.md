# 개선 루프 시작하기 (소유자 PC, 1회)

PowerShell 에서 한 번만 실행한다. 작업 폴더는 `C:\rs`(= `C:\Users\이재훈\CLAUDE\realsurgery`).

```powershell
cd C:\rs
git fetch origin
git switch feat/m1-flow          # 커밋 안 된 변경이 있다고 나오면: git stash push -u -m "before-improve"
git pull --ff-only origin feat/m1-flow
pnpm install
pnpm exec playwright install chromium
```

## 1사이클 직접 돌려 보기 (약 30~90분)
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\rs\scripts\loop\improve.ps1
```

## 3시간마다 자동 실행
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\rs\scripts\loop\schedule.ps1 -Hours 3
```
- 중지: `powershell -NoProfile -ExecutionPolicy Bypass -File C:\rs\scripts\loop\unschedule.ps1`
- PC 가 켜져 있고 로그인돼 있을 때만 돈다. 요금제 한도에 걸리면 그 회차는 멈추고 다음 회차에 이어간다.

## 결과 보는 곳
| 무엇 | 파일 |
| --- | --- |
| 점수 추이(8개 영역) | `backlog/scorecard.md` |
| 최근 감사 요약·문제 목록 | `reports/audit/<LATEST.txt 의 폴더>/summary.md`, `findings.md` |
| 사이클별 기록(무엇을 고쳤고 리뷰 판정은?) | `backlog/log/<날짜>-improve-<시각>.md` |
| 사람이 할 일·지출 승인 | `backlog/TASKS.md` "사람 확인 필요(개선 루프)", `backlog/budget.md` |

키(`.env.local`)는 git 에 올라가지 않는다(`.gitignore` 의 `.env*`). 루프는 main 에 반영하지 않는다 — 배포는 소유자가 결정한다.
