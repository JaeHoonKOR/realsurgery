# 구현 에이전트 공통 절차 (/improve)

대상: `ui-builder` · `content-seo` · `tracker` · `asset-maker` · `perf`. 한 번에 **I-### 1건**만 한다. 판정 기준은 `docs/loop/GOAL.md`·`docs/QUALITY.md`, 금지 사항은 GOAL.md "하지 않는 것".

## 0. 작업 트리 준비
- 너는 격리된 작업 트리(`.claude/worktrees/agent-*`, 브랜치 `worktree-agent-*`)에서 시작한다. 이 폴더 안 파일만 고친다.
- 작업 트리는 기본 브랜치(main)에서 만들어질 수 있다. 먼저 `git merge --ff-only feat/m1-flow`. 실패(분기)하면 고치지 말고 바로 보고한다.
- 재시도 항목이면 프롬프트의 이전 브랜치를 이어받는다: `git merge --no-edit <이전 브랜치>`.
- `pnpm install --frozen-lockfile` (작업 트리에는 node_modules 가 없다). `git log -1 --oneline` 을 기록한다.
- Playwright 포트는 작업 트리마다 자동으로 다르다(`scripts/serve-out.mjs` defaultPorts) — 환경 변수를 붙이지 않는다.
- 한글 경로는 셸 인자로 넘기지 말고 감사 라우트 키를 쓴다(`home`, `procedures-double-eyelid`, `clinics-danhaneul`, `consult`, `404`).

## 1. 읽기
프롬프트의 수용 기준, findings 근거와 스크린샷(메인 체크아웃 `C:\rs\reports\audit\<run>\screens\…` — Read 로 연다), GOAL.md 해당 영역, QUALITY.md, 관련 스펙 절(`docs/spec/screen-spec.md`), 시각 작업이면 `docs/design/asset-plan.md`.
**바꿀 파일을 먼저 정하고 그 밖은 건드리지 않는다**(병렬로 도는 다른 항목과 충돌 방지). 범위 밖 문제는 보고서 "발견"에만 적는다.

## 2. before
`pnpm build` → `pnpm audit:site --no-build --routes <대상 키> --label <i-###>-before`. 대상 화면의 `-375-fold.png`·`-1280-fold.png`·`-375-sheet1.jpg` 를 Read 로 연다.

## 3. 구현 → 검증 (통과할 때까지 반복)
1. 구현한다. lane 규칙은 각 에이전트 파일.
2. `pnpm typecheck && pnpm lint && pnpm test`
3. `pnpm build`
4. 관련 E2E·접근성: `pnpm exec playwright test tests/e2e/<화면>.spec.ts tests/a11y/<화면>.spec.ts` (홈 home, 시술 procedure, 병원 clinic, 상담 consult). 공통 컴포넌트를 바꿨으면 `pnpm test:e2e && pnpm test:a11y` 전체.
5. `pnpm audit:site --no-build --routes <대상 키> --label <i-###>-after` → summary 비교, after 스크린샷을 before 와 **나란히 Read 로 열어** 수용 기준을 하나씩 대조하고 회귀(겹침·잘림·여백 붕괴·폴백 깨짐)가 없는지 본다.
6. 미달이면 1로. 같은 원인으로 5번 연속 실패하면 멈추고 `blocked` 로 보고(시도 목록 포함).
- 테스트를 통과시키려고 테스트·기준을 약화하지 않는다. 기대값이 스펙상 바뀌어야 하면 근거(스펙 절·GOAL)와 함께 보고서에 적고 리뷰어 판단에 맡긴다.

## 4. 커밋
- `git add` 는 파일을 지정해서. **넣지 않는 것**: `reports/audit/`(감사 출력), `backlog/TASKS.md`·`backlog/scorecard.md`(오케스트레이터 전용), `.env*`, `content/images/request.json`, `.gen-candidates/`.
- 로그 `backlog/log/<YYYY-MM-DD>-<에이전트>-<I-###>.md`(커밋에 포함): 바꾼 파일, 검증 결과, before/after 스크린샷 경로, "가정:" 줄, 남은 리스크 3줄.
- `git commit -m "<type>(<scope>): <한국어 요약> (I-###)"` — Conventional Commits. push 하지 않는다(오케스트레이터가 병합·push).

## 5. 보고 (마지막 메시지 — 오케스트레이터가 그대로 리뷰어에게 넘긴다)
```
I-### <제목> — ready-for-review | blocked
- 작업 트리: <절대 경로> · 브랜치: <이름> · 커밋: <해시>
- 바꾼 파일: …
- 검증: typecheck ✓ · lint ✓ · test ✓ · build ✓ · e2e <spec> ✓ · a11y ✓ · audit after: reports/audit/<run>/
- 수용 기준: 1) ✓ 근거 … 2) ✓ 근거 …
- before ↔ after 스크린샷(절대 경로): <before>/screens/<키>-375-fold.png ↔ <after>/screens/<키>-375-fold.png …
- 지표 변화: text-wall 2→0 · contentImages 0→6 · LCP 780→690ms …
- 남은 리스크(3줄) · 발견(범위 밖) · 가정
```
