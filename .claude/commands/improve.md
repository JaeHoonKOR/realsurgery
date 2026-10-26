---
description: 개선 루프 1사이클(기본 운영 방식) — 감사 → 계획(I-### ≤3) → 병렬 구현(작업 트리) → 독립 리뷰 → 병합 → 통합 게이트 → 재감사 → feat/m1-flow push
---
너(메인 세션)가 **오케스트레이터**로 개선 루프 1사이클을 끝까지 수행한다. 너는 소스를 직접 고치지 않는다(TASKS·scorecard·budget 확인·로그·병합·되돌리기만). 서브에이전트는 다른 서브에이전트를 띄울 수 없으므로 모든 Agent 호출은 네가 한다. 무인 실행(`scripts/loop/improve.ps1`)이 기본이라 질문할 사람이 없다 — 모호하면 가장 단순한 해석으로 진행하고 로그에 "가정:" 을 남긴다.

인자: $ARGUMENTS — 선택 `--max N`(이번 사이클 항목 수, 기본 3), `--plan-only`(2단계까지만 하고 커밋·종료).
기준 문서: `docs/loop/GOAL.md`(목표·채점·가드레일), `docs/loop/IMPLEMENT.md`(구현 절차), CLAUDE.md. 레거시 `/loop`(T-### 순차 처리)는 남아 있지만 기본은 이 명령이다.

## 0. 준비
1. 시작 시각 `HHmm` 과 날짜를 정하고 로그 `backlog/log/<YYYY-MM-DD>-improve-<HHmm>.md` 를 만든다(이후 단계마다 덧붙인다).
2. `git switch feat/m1-flow` — 커밋 안 된 변경 때문에 실패하면 `git stash push -u -m "improve-preflight-<YYYYMMDD-HHmm>"` 후 다시(로그에 기록). `git pull --ff-only origin feat/m1-flow`(실패: 오프라인·권한 → 로그 경고 후 로컬로 계속). `pnpm install --frozen-lockfile`.
3. 읽기: GOAL.md, `backlog/scorecard.md` 마지막 2행, `backlog/TASKS.md` "개선 루프 (/improve)" 절, `backlog/budget.md`(승인 잔액), 직전 `backlog/log/*-improve-*.md` 1개.
4. 작업 트리 정리: `git worktree list` 의 `.claude/worktrees/agent-*` 중 브랜치가 이미 feat/m1-flow 에 병합된 것(`git branch --merged feat/m1-flow`)은 `git worktree remove --force <경로>` + `git branch -d <브랜치>`. 병합 안 된 것은 TASKS 비고에 "이전 브랜치"로 적혀 있으면 남기고, 아니면 로그에만 기록하고 남긴다. 잠긴(locked) 것은 건드리지 않는다.
5. 요금제 한도 경고(usage limit·rate limit·"resets at")가 어느 단계에서든 보이면: 진행 상황을 로그에 쓰고, 지금까지의 커밋 가능한 결과만 커밋한 뒤, 마지막 줄 `USAGE_LIMIT` 로 끝낸다.

## 1. 감사 (AUDIT)
- Agent `auditor`(격리 없음 — 메인 체크아웃에서 실행) 프롬프트: "mode full. 직전 scorecard: <행>. 이번 사이클 시작 감사. 끝나면 run 폴더, 점수 8개, findings.md 경로, NOTHING_ACTIONABLE 여부, 상위 개선 항목 요약을 돌려줘."
- `reports/audit/<run>/findings.md` 와 scorecard 새 행(before)을 확인한다. 사이트를 서빙할 수 없다는 결과면(빌드 실패): 빌드 복구 1건만 계획(lane 은 오류 위치에 따라 ui/perf/content-seo)하고 3단계로.

## 2. 계획 (PLAN)
1. **종료 판정**: 모든 영역 ≥ 4 이고 A ≥ 4.5, findings 에 사람 항목 외 실행할 것이 없고(NOTHING_ACTIONABLE), TASKS 개선 루프에 todo 가 없으면 → 감사 결과·scorecard·로그만 커밋하고 push(7단계 방식) 후 마지막 줄 `NOTHING_TO_DO`.
2. 후보: TASKS "개선 루프" 의 todo(이전에 반려·되돌림된 항목 먼저, 그다음 우선순위) + findings 의 새 항목(TASKS 에 없으면 다음 번호 `I-###` 로 추가, 출처 `findings F-n`).
3. 고르기 — 최대 3개(`--max`):
   - **예상 파일이 서로 겹치지 않을 것**(겹치면 하나만). 같은 화면이라도 파일이 다르면 가능.
   - 목표 미달 영역 우선. A < 4.5 이면 A 를 올리는 항목 1개 이상. 선행(depends)이 done 인 것만.
   - `assets` 는 `backlog/budget.md` 에 승인됐고 잔액이 있을 때만. 승인 밖·사람 결정·키 필요·`spec-question` 은 고르지 않고 TASKS "사람 확인 필요(개선 루프)" 표로 옮긴다.
4. TASKS.md 갱신: 고른 항목 `doing`, 비고에 run·수용 기준·대상 경로 키·예상 파일. `git add backlog/TASKS.md backlog/scorecard.md reports/audit/<run>/summary.md reports/audit/<run>/report.json reports/audit/<run>/findings.md reports/audit/LATEST.txt backlog/log/<이번 로그>` → `git commit -m "chore(loop): plan <run> — I-…, I-…"`. (`--plan-only` 면 여기서 로그를 마무리하고 마지막 줄 `CYCLE_DONE`.)

## 3. 구현 (IMPLEMENT) — 병렬
- **한 메시지에서** 고른 항목 수만큼 Agent 를 동시에 호출한다. 각 호출: `subagent_type` = lane 에이전트(ui→`ui-builder`, content·seo·aeo→`content-seo`, tracking→`tracker`, assets→`asset-maker`, perf→`perf`), **`isolation: "worktree"`**.
- 프롬프트(항목마다):
  ```
  /improve 사이클 <run> · I-### <제목> (lane <lane>)
  먼저 docs/loop/IMPLEMENT.md 를 읽고 그대로 따른다.
  수용 기준: 1) … 2) …
  대상 경로 키: … · 예상 파일(이 밖은 고치지 말 것): …
  근거: C:\rs\reports\audit\<run>\findings.md F-n, 스크린샷 C:\rs\reports\audit\<run>\screens\<키>-375-fold.png …
  (assets) 승인 ID: B-00n · 잔액 $x.xx
  (재시도) 이전 반려 사유: … · 이전 브랜치: <브랜치> (git merge 로 이어받기)
  마지막 메시지는 IMPLEMENT.md 5절 보고 형식으로.
  ```
- 결과에서 작업 트리 경로·브랜치·커밋 해시를 확인한다. 커밋이 없거나 `blocked` 면 그 항목은 리뷰 없이 todo(사유)·blocked(같은 사유 3사이클 연속)로.

## 4. 리뷰 (REVIEW) — 독립
- 구현마다 **새** `reviewer` 를 띄운다(격리 없음, 구현 에이전트·이전 리뷰어 재사용 금지). 여러 건이면 한 메시지에서 병렬로. 프롬프트: I-### 제목·수용 기준·대상 경로 키, 작업 트리 절대 경로, 브랜치, 구현 보고 전문.
- `VERDICT: approve` → 메인 체크아웃(feat/m1-flow)에서 `git merge --no-ff <브랜치> -m "merge: I-### <제목> (reviewer approved)"`. 충돌이면 `git merge --abort`, 항목 todo + 비고 "충돌: <파일>".
- `VERDICT: request-changes` → 항목당 사이클 안 최대 **2회 구현**. 2회째는 반려 사유와 이전 브랜치를 넘겨 새 구현 에이전트(격리)를 띄우고, 다시 새 리뷰어. 2회째도 반려면 todo 로 되돌리고 비고에 사유 누적(같은 사유로 3사이클 연속이면 blocked).

## 5. 통합 게이트 — 병합이 1건 이상일 때
- 메인 체크아웃에서: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e && pnpm test:a11y`.
- E2E 가 실패하면 실패한 spec 만 한 번 다시 돌려(`pnpm exec playwright test <spec>`) 일시적 실패인지 본다(로그에 기록).
- 실패가 확실하면 원인 병합을 찾는다(실패 테스트·바뀐 파일로 추정) → `git revert -m 1 <병합 커밋> --no-edit` → 게이트 재실행. 원인을 모르면 가장 최근 병합부터 하나씩 되돌리며 재실행(최대 3회). 되돌린 항목은 todo + 비고 "통합 게이트 실패: <테스트>". 끝까지 실패면 이번 사이클 병합을 모두 되돌린다. `git reset --hard` 는 쓰지 않는다(권한 거부).

## 6. 재감사
- 병합이 남아 있으면 Agent `auditor`(격리 없음): "mode after --routes <병합 항목들의 대상 경로 키>. 이번 사이클 병합: I-…. 직전 scorecard(before): <행>." → scorecard after 행.
- after 에서 병합 항목 때문에 새 치명·주요 문제나 점수 하락이 생겼으면 그 병합을 revert → 5단계 게이트 재실행, 항목 todo.

## 7. 보고·push
1. TASKS.md: 병합된 항목 `done`(병합 커밋 해시·run), 반려·되돌림 항목 `todo`(사유·이전 브랜치), 새 사람 항목. 오래된 done 은 그대로 둔다.
2. 로그 마무리: 감사 run(before/after), 점수 before→after(영역별), 항목별(lane·시도 수·리뷰 판정·병합 커밋·지표 변화·before/after 스크린샷 경로), 게이트 결과, 되돌림, 사람 확인 필요, 다음 사이클 후보 3개, 소요 시간.
3. 커밋: TASKS·scorecard·budget·`backlog/log/`(이번 사이클 리뷰 로그 포함)·이번 run 들의 `summary.md`·`report.json`·`findings.md`·`reports/audit/LATEST.txt` → `git commit -m "chore(loop): improve <YYYY-MM-DD HH:mm> — <한 줄 요약>"`.
4. 작업 트리 정리: 병합된 항목의 작업 트리 `git worktree remove --force <경로>`, `git branch -d <브랜치>`. 반려된 브랜치는 다음 사이클 재시도용으로 남긴다(TASKS 비고에 이름).
5. `git push origin feat/m1-flow` — **main 에는 절대 push·merge 하지 않는다.** 실패(403 등)는 로그에 남기고 사이클 실패로 보지 않는다.
6. 마지막 줄에 `CYCLE_DONE` 만 출력한다.

## 금지 (GOAL.md 가드레일 요약)
main 반영·배포, 승인 밖 지출, `content/images/request.json` 수정, 테스트·기준 약화, 가짜 데이터·평점·전후·효과 보장, 키·개인정보 출력, 외부 발송·외부 설정 변경, 스펙 직접 수정, 한글 파일명.
