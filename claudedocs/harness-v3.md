# 하네스 v3 설계안 — 리얼성형

- 작성 2026-11-06 · 상태: **제안(승인 전, 아직 아무 파일도 옮기지 않음)**
- 확정된 의도 (2026-11-06 사용자 답변)
  - 불만: 결과물 없음 · 문서/프로세스 과다 · 화면 품질 · 컨셉 자체 (4개 전부)
  - 마감: 한 달 이상
  - 목적: **실서비스 우선** (포트폴리오는 부산물)
  - 작업 방식: **하루 단위 확인**

## 0. 근거 (Anthropic 공식 자료)

| 출처 | 가져온 원칙 |
| --- | --- |
| [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) (2025-11) | 첫 세션만 다른 프롬프트(initializer). 상태는 **기능 목록 JSON(`passes`만 바꿈) + 진행 로그 + git + init 스크립트**. 한 번에 기능 1개. 브라우저로 사람처럼 검증한 뒤에만 통과 처리. 세션은 깨끗한 상태로 끝냄 |
| [Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps) (2026-03) | **만드는 에이전트와 평가하는 에이전트를 분리**(자기 평가는 후하다). 평가자는 Playwright로 실제 화면을 클릭하고, 기준 4개(디자인 완성도·독창성·완성도(craft)·기능)로 채점하며 기준마다 하한이 있다. 평가자는 사람 판단과 비교해 여러 번 보정. 플래너는 기술 세부를 적지 않는다. "하네스 구성요소는 모두 모델이 못 한다는 가정" → 하나씩만 추가·제거 |
| [Claude Code best practices](https://code.claude.com/docs/en/best-practices) | CLAUDE.md는 짧게, Claude가 저장소에서 알 수 없는 것만. **예외 없는 규칙은 hook/deny**, 지침은 CLAUDE.md. 팀 절차는 skill(부작용 있는 건 `disable-model-invocation`). 리뷰어는 읽기 전용 subagent, "스타일은 빼고" 지시(안 그러면 뭐든 찾아냄). 스펙은 사람과 대화로 먼저 만들고 새 세션에서 구현 |

## 1. v2가 실패한 이유 → v3의 대응

| v2 (지금) | 결과 | v3 |
| --- | --- | --- |
| 에이전트 17개, 파이프라인 9개, 정의서 6종 4,500줄 | 2주 동안 화면 1장 | 메인 세션 1개 + 평가자 1개로 시작. 필요가 **관찰되면** 추가 |
| 에이전트끼리 서로의 문서를 검토(교차 검토 53건, 벤치마크 리뷰 4라운드) | 문서가 문서를 낳음 | 평가 대상은 **작동하는 화면뿐**. 문서는 검토하지 않음 |
| 디자인을 숫자로 규정(밀도 ≥2, 3초 규칙) | 규칙은 통과, 화면은 별로 | 기준 4개 루브릭 + **사용자 판정으로 보정한 예시**(좋다/별로 사례) |
| 무인 야간 루프가 "가정:"을 쌓음 | 사용자 취향이 루프 밖에 있음 | 하루 1회 사용자 확인이 루프의 입력. 무인 실행은 평가자 보정 후 |
| TASKS.md 120줄, spec-question 20건, ID 체계(KPI-01, K1~K18, D1~D8) | 사람도 에이전트도 못 따라감 | `features.json`(기계용) + `DECISIONS.md`(사람 결정 대기 목록, 5건 이하 유지) |
| CLAUDE.md 80줄 + 전역 SuperClaude 20여 파일이 매 세션 로드 | 지침 충돌·컨텍스트 낭비 | 프로젝트 CLAUDE.md ≤ 60줄. 전역 설정은 사용자가 정리(아래 6절) |

## 2. 파일 구조

```
CLAUDE.md                     ≤60줄: 명령어 · 금지사항 · 함정(Windows 경로 등)
docs/
  product/BRIEF.md            1쪽: 누구를 위해, 무엇을, 왜, 어떻게 돈을 버나, 법적 경계
  product/CONTENT.md          콘텐츠 정의 (다음 단계에서 사용자와 작성)
  product/SCREENS.md          화면 정의 (CONTENT 다음)
  product/DECISIONS.md        사용자 결정 대기 목록 (≤5건)
  design/RUBRIC.md            평가 기준 4개 + 가중치 + 하한
  design/calibration/         사용자가 "좋다/별로" 판정한 스크린샷 + 한 줄 이유
  legal/MEDICAL-AD.md         의료법·개인정보 체크리스트 (기존 95-legal-ops에서 추출, 출처 포함)
  archive/                    기존 specs/ pipelines/ spec/ layouts/ QUALITY.md BENCHMARK.md (참고 전용)
harness/
  features.json               기능 목록. 에이전트는 passes만 false→true로 바꿀 수 있음
  progress.md                 세션 로그 (최신이 위, 세션당 5줄)
  init.mjs                    설치 확인 → 데이터 빌드 → dev 서버 → 스모크 1회
.claude/
  settings.json               deny 규칙 + hooks (아래)
  agents/evaluator.md         읽기 전용 + Playwright. 회의적 QA
  skills/
    session-start/SKILL.md    오리엔트 루틴 (pwd → git log → progress → features → init)
    build-feature/SKILL.md    기능 1개: 구현 → 자가 확인 → evaluator → 커밋 → progress
    evaluate/SKILL.md         evaluator 호출 규칙 + 루브릭 + 보정 예시 주입
    daily-report/SKILL.md     하루치 요약: 바뀐 화면 스크린샷, 통과 기능, 결정 필요 사항
    write-guide/SKILL.md      시술 가이드 작성 절차 + 출처·의료 표현 규칙 (콘텐츠 정의 후)
    release/SKILL.md          배포 (disable-model-invocation: 사용자만 /release로 실행)
scripts/                      유지: guard, check-links, build-data, gen-image, og, copy-fonts, serve-out
                              신규: check-features.mjs (features.json 변경 검증)
```

### features.json 형식 (Anthropic 글의 형식 그대로)
```json
[
  {
    "id": "F-001",
    "category": "flow",
    "description": "메인에서 시술 카드를 누르면 해당 시술 가이드가 열린다",
    "steps": ["/ 열기", "첫 시술 카드 클릭", "가이드 H1이 카드 제목과 같은지 확인"],
    "priority": 1,
    "passes": false
  }
]
```
- 기능은 **사용자가 클릭으로 확인할 수 있는 단위**로만 적는다. "토큰 정의", "스펙 작성" 같은 항목은 없다.
- 순서: CONTENT.md → SCREENS.md가 확정되면 그 화면에서 features.json을 만든다(initializer 세션).

## 3. 에이전트와 역할

| 역할 | 무엇 | 도구 | 모델 |
| --- | --- | --- | --- |
| 메인 세션 (generator) | 기능 1개씩 구현·자가 확인·커밋 | 전체 | opus |
| evaluator (subagent) | 실행 중인 사이트를 375/1280에서 클릭, 루브릭 4개 채점, 버그 목록. **수정 권한 없음** | Read, Grep, Glob, Bash(읽기 명령), Playwright | opus |
| 사용자 | 하루 1회 판정: 좋다/별로 + 이유 한 줄, 다음 우선순위, DECISIONS 답변 | — | — |

- 평가자 규칙: 버그를 찾고 나서 "그래도 괜찮다"고 승인하지 않는다. 기준 하나라도 하한 미달이면 불합격. 스타일·문구 취향 지적은 하지 않는다.
- 보정: 처음 3~5일은 평가자 점수와 사용자 판정을 나란히 기록하고, 어긋난 사례를 `design/calibration/`에 추가한다(Anthropic 글의 few-shot 보정 방식).
- 플래너 역할은 따로 두지 않는다. CONTENT/SCREENS를 사용자와 직접 대화로 만드는 것이 플래너 단계다.

## 4. 강제 규칙 (hook·deny, 예외 없음)

| 규칙 | 방식 |
| --- | --- |
| 저장소 밖 접근·위험 git 명령 | 기존 `scripts/guard.mjs` PreToolUse + deny 목록 유지 |
| features.json은 `passes` 외 변경 금지 | PreToolUse(Edit/Write) → `check-features.mjs`가 diff 검사, 위반 시 exit 2 |
| 턴 종료 전 타입체크·린트 통과 | Stop hook: `pnpm typecheck && pnpm lint` 실패 시 exit 2 |
| 비용 발생 행동(광고 집행·유료 API·결제) | deny + CLAUDE.md 명시. 사용자만 실행 |
| GA4/Pixel ID 하드코딩 금지 | 린트 규칙(check-tokens 확장) |

나머지(문체, 컴포넌트 패턴 등)는 CLAUDE.md 지침이나 skill로 둔다. hook은 5개 이하로 유지한다.

## 5. 하루 사이클

```
[사용자, 아침 10분]  daily-report 읽기 → 미리보기 URL 열기 → 좋다/별로 + 우선순위 + 결정
        ↓
[세션]  /session-start → features.json 최상위 미통과 1개 → build-feature → evaluate
        → 통과면 passes=true + 커밋 / 불합격이면 고쳐서 재평가 (같은 원인 3회면 DECISIONS로)
        → 반복 → 끝에 daily-report
```
- 무인 실행(`run-night.ps1`)은 평가자 보정이 끝난 뒤(사용자 판정과 4일 연속 일치) 다시 켠다. 그때도 같은 skill을 `claude -p`로 돌릴 뿐, 별도 오케스트레이터는 만들지 않는다.

## 6. 정리 대상 (승인 후 실행)

| 대상 | 처리 |
| --- | --- |
| `.claude/agents/` 17개 | evaluator 1개만 남기고 `docs/archive/agents/`로 이동 |
| `.claude/commands/` | skills로 대체 후 archive |
| `.claude/agent-memory/` | 오래된 사실이 섞여 있어 archive (참고용) |
| `docs/specs/ pipelines/ spec/ layouts/ QUALITY.md BENCHMARK.md` | `docs/archive/`로 이동. 법무 요점은 `legal/MEDICAL-AD.md`로, 경쟁 실측 수치는 CONTENT 작성 때 참고 |
| `backlog/TASKS.md`, `backlog/log/` | archive. 열린 사용자 결정 중 유효한 것만 DECISIONS.md로 |
| `run-night.ps1/.cmd`, `setup2.*` | archive (무인 실행 재개 때 새로 작성) |
| 코드(app/, components/, lib/, data/seed, scripts/, tests/) | **유지**. 콘텐츠·화면 정의 후 필요한 것만 다시 씀 |
| 전역 `~/.claude/CLAUDE.md` (SuperClaude 20여 파일 import) | 저장소 밖이라 건드리지 않음. "기능 브랜치 강제", "Serena 메모리" 같은 지침이 매 세션 섞이므로 이 프로젝트에서는 끄기를 권장 (사용자가 직접) |

- 삭제는 하지 않는다. 전부 `git mv`로 archive에 옮기고, 작업 전 현재 미커밋 변경을 스냅샷 커밋으로 남긴다.

## 7. 진행 순서

1. 현재 상태 스냅샷 커밋 (새 브랜치 `chore/harness-v3`)
2. 하네스 v3 파일 생성 + 기존 파일 archive (이 문서 2·4·6절)
3. **콘텐츠 정의** — 사용자와 대화로 `CONTENT.md` (무엇이 사람을 모으고, 머물게 하고, 돈이 되는가 + 법적 경계)
4. **화면 정의** — `SCREENS.md` (콘텐츠를 담을 화면, 흐름)
5. initializer 세션: SCREENS.md → features.json, RUBRIC.md, init.mjs
6. 하루 사이클 시작
