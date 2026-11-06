# 하네스

한 세션(메인)이 오케스트레이터로 일하고, 서브에이전트 3개를 루프로 돌린다.
근거: Anthropic [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents), [Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps), [Claude Code best practices](https://code.claude.com/docs/en/best-practices).

```
사용자 ──/define──▶ 오케스트레이터 ──▶ planner ──▶ BRIEF·CONTENT·SCREENS·features.json
   ▲                 (메인 세션)  ◀── QUESTIONS (오케스트레이터가 사용자에게 묻고 답을 돌려줌)
   │
   ├────/cycle────▶ 오케스트레이터 ──▶ builder ──▶ evaluator ──FAIL──▶ builder (최대 3라운드)
   │                      │                           │
   │                      └──── PASS: passes=true · progress · 커밋 ◀┘
   │
   └◀───/report─── 스크린샷 + 점수 → 사용자 판정(좋다/괜찮다/별로다) → docs/design/calibration/
        /release   사용자만: cycle 브랜치 → main → GitHub Pages → 배포 URL 재확인
```

## 구성
| 이름 | 위치 | 하는 일 |
| --- | --- | --- |
| 오케스트레이터 | 메인 세션 + `.claude/skills/{cycle,define,report,release}` | 순서 정하기, 서브에이전트에 넘길 정보 고르기, 상태 기록, 커밋. 직접 구현·판정하지 않음 |
| planner | `.claude/agents/planner.md` | 무엇을 만들지 정함. 범위는 크게, 기술 세부는 적지 않음 |
| builder | `.claude/agents/builder.md` | 기능 1개 구현 + 브라우저 확인. 끝낼 때 typecheck·lint hook |
| evaluator | `.claude/agents/evaluator.md` | 실행 중인 사이트를 클릭해 PASS/FAIL. 쓰기 도구 없음. 구현자 추론을 받지 않음 |

만드는 쪽과 평가하는 쪽을 나눈 이유: 자기 작업을 스스로 평가하면 후해진다. evaluator 점수는 사용자 판정 예시(`docs/design/calibration/`)로 보정한다.

## 플러그인·MCP (프로젝트 범위, `.claude/settings.json`·`.mcp.json`)
| 이름 | 출처 | 쓰는 곳 |
| --- | --- | --- |
| `frontend-design` | Anthropic 공식 `claude-plugins-official` | planner가 시각 언어를 정할 때, builder가 화면을 만들 때 Skill로 불러 씀 |
| `typescript-lsp` | Anthropic 공식 `claude-plugins-official` | 코드 탐색·타입 오류 확인. 전역 `typescript-language-server` 필요(아래) |
| `playwright` MCP | `@playwright/mcp@0.0.83` | builder 자가 확인, evaluator 판정 |
| `context7` MCP | `@upstash/context7-mcp@4.4.4` | 최신 라이브러리 문서가 필요할 때만 |

새 PC에서는 한 번: `claude plugin marketplace add anthropics/claude-plugins-official` → `claude plugin install frontend-design@claude-plugins-official --scope project` (typescript-lsp도 같은 방식) → `npm install -g typescript-language-server typescript`.
builder 종료 hook이 돌 때마다 `harness/hooks.log`에 한 줄이 남는다(발동 확인용, gitignore).

## 강제 규칙 (hook)
| 규칙 | 구현 |
| --- | --- |
| 저장소 밖 접근·위험한 git/gh 명령 차단 | `scripts/guard.mjs` (PreToolUse Bash) + `.claude/settings.json` deny |
| features.json: planner만 목록 변경, 오케스트레이터는 `passes`만, 나머지 서브에이전트는 변경 불가. passes를 true로 바꾸는 건 오케스트레이터만, 그것도 회귀 테스트 파일이 있을 때만 | `scripts/hooks/check-features.mjs` (PreToolUse Write·Edit, `agent_type`으로 구분), 셸 변경은 guard가 차단 |
| builder는 typecheck·lint 통과 전에 끝낼 수 없음 | `scripts/hooks/verify-build.mjs` (`.claude/settings.json` SubagentStop, 스크립트가 `agent_type == builder`일 때만 검사. 에이전트 frontmatter의 Stop hook은 이 환경에서 발동하지 않았다) |
| 통과한 기능이 깨지면 배포 안 됨 | CI(`.github/workflows/pages.yml`)가 `pnpm test:features` 실패 시 배포 중단 |

나머지 규칙은 CLAUDE.md와 에이전트 지침에 둔다. hook은 예외가 없는 규칙에만 쓴다.

## 회귀 테스트
- 기능 1개 = `tests/e2e/features/<id>.spec.ts` 1개. builder가 steps를 옮겨 쓰고, evaluator가 steps를 빠짐없이 검증하는지 읽는다.
- `pnpm build && pnpm test:features [id...]` — `out/`을 basePath 하위로 서빙해 375·1280에서 실행.
- `/cycle`은 시작할 때 전부 돌린다. 깨진 게 있으면 새 기능보다 먼저 고친다.

## 이용자 지표
- 서비스 목표는 무료 + 높은 이용자 수 + 바이럴(`docs/product/BRIEF.md`). evaluator 기준에 "공유"가 있고, `/report`는 `node scripts/metrics.mjs`로 최근 7일 활성·신규 사용자, 세션, 공유 유입(`utm_medium=share`), `share` 이벤트를 보여준다.
- GA4 Data API 키(`GA4_PROPERTY_ID` + 서비스 계정 JSON)가 없으면 needs-key만 출력한다(DECISIONS D-3).
- 공유 동작은 `lib/track.ts`의 `share` 이벤트(GA4 권장 이벤트)로 남기고, 공유 링크에는 `utm_medium=share`를 붙인다.

## 상태 파일
### `features.json`
```json
[
  {
    "id": "F-001",
    "category": "flow",
    "description": "메인에서 시술 카드를 누르면 그 시술 가이드가 열린다",
    "steps": ["/realsurgery/ 열기", "첫 번째 시술 카드 클릭", "가이드 H1이 카드 제목과 같은지 확인"],
    "priority": 1,
    "passes": false
  }
]
```
- 필드는 이 6개뿐. `id`는 `F-000` 형식, `priority`는 1이 먼저.
- 기능 = 사용자가 브라우저에서 클릭으로 확인할 수 있는 단위.

### `progress.md` (최신이 위, 항목당 5줄 이하)
```
## YYYY-MM-DD · F-00x · <기능 요약>
- 결과: PASS (라운드 2) | BLOCKED: <이유>
- 점수: 기능 5 · 신뢰 5 · 디자인 완성도 n · 독창성 n · 만듦새 n · 공유 n
- 커밋: <sha>
- 메모: 다음 세션이 알아야 할 것
```

### `init.mjs`
의존성 확인 → `pnpm dev`(이미 떠 있으면 재사용) → 첫 화면 200 + `<h1>` 확인. `--stop`으로 종료. 스크린샷은 `harness/screens/`(gitignore).

## 하루 사이클
1. 사용자: `/cycle 3` — 미통과 기능 3개를 builder → evaluator로 통과시킨다.
2. 끝나면 오케스트레이터가 `/report` 절차로 스크린샷·점수를 보여주고 판정을 받는다.
3. 사용자 판정이 calibration에 쌓이고, 다음 날 evaluator가 그 예시로 채점한다.
4. 배포하고 싶을 때 사용자: `/release`.

## 바꿀 때
하네스의 구성요소는 모두 "모델이 혼자서는 못 한다"는 가정이다. 문제가 관찰되면 하나 추가하고, 필요 없어 보이면 하나씩 뺀다. 한꺼번에 바꾸지 않는다.
