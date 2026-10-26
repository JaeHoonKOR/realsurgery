# 리얼성형 — 에이전트 작업 규칙

## 개선 루프 (/improve) — 기본 운영 방식 (2026-10-27~)
- 목표·채점·가드레일: `docs/loop/GOAL.md` (8개 영역 0~5점, 목표 전 영역 ≥4·A ≥4.5). 구현 절차: `docs/loop/IMPLEMENT.md`.
- 1사이클 = `/improve`(`.claude/commands/improve.md`): 감사(auditor, `pnpm audit:site` + 스크린샷 육안 채점) → 항목 ≤3 계획 → lane 에이전트 병렬 구현(작업 트리) → 독립 reviewer → `feat/m1-flow` 병합 → 통합 게이트 → 재감사 → push.
- 실행: `scripts/loop/improve.ps1`(1회), `scripts/loop/schedule.ps1 -Hours 3`(예약), `scripts/loop/unschedule.ps1`(해제). 시작 방법: `docs/loop/START.md`.
- 지출은 `backlog/budget.md` 승인 범위 안에서만. 점수 기록 `backlog/scorecard.md`. 작업 큐 `backlog/TASKS.md` "개선 루프" 절.
- **main 반영·배포는 소유자만.** 루프는 `feat/m1-flow` 에만 push 한다.
- 아래 "단일 진실 소스·루프 프로토콜"은 레거시 `/loop`(스펙 기반 구축) 규칙이다. `/improve` 와 충돌하면 `/improve` 문서가 우선한다. 절대 규칙·한글 경로·인코딩·mock 규칙은 그대로 적용한다.

## 품질 원칙
- 배포보다 **로컬 품질**이 우선. `docs/QUALITY.md`가 모든 화면의 완료 기준이며, 동작만 하는 화면은 미완성이다.
- 눈으로 본다: 리뷰어는 스크린샷을 Read로 열어 판정한다. 수치 통과 + 외관 미달 = 반려.
- 더미 데이터도 실서비스처럼. "테스트"·"샘플" 표기 금지.

## 단일 진실 소스
- 화면 정의서: `docs/spec/screen-spec.md` (SSOT). 모든 구현·검증은 이 문서 기준.
- 파이프라인 정의: `docs/pipelines/*.md`. 각 에이전트는 자기 파이프라인 파일만 따른다.
- 작업 큐: `backlog/TASKS.md`. 상태 전이는 여기서만.
- 실행 로그: `backlog/log/YYYY-MM-DD-<agent>.md`. 루프 1회당 1파일.

## 루프 프로토콜 (모든 에이전트 공통)
1. **PICK** — `backlog/TASKS.md`에서 자기 lane, 상태 `todo`, 우선순위 가장 높은 1건을 `doing`으로 바꾼다.
2. **READ** — 해당 화면 ID·절을 `screen-spec.md`에서 다시 읽는다. 기억으로 작업하지 않는다.
3. **ACT** — 파이프라인 파일의 Act 절대로 실행한다.
4. **VERIFY** — 파이프라인의 Verify 체크리스트 + `docs/QUALITY.md` 전체를 통과할 때까지 ACT로 돌아간다. 횟수 제한 없음(루프 턴 예산 안에서). 같은 원인으로 5회 연속 실패하면 `blocked` + 원인·시도 목록 기록. 테스트를 통과시키기 위해 테스트를 약화하는 것은 금지.
5. **REPORT** — 로그 파일에 변경 파일, 검증 결과, 남은 리스크 3줄. `TASKS.md` 상태를 `review`로.
6. **REVIEW GATE** — reviewer가 approve하면 오케스트레이터가 `done`으로 바꾼다. 단 제목에 `[human-gate]`가 붙은 작업(약관·비용·외부 발송)은 approve 후 `review` 상태로 두고 사람을 기다린다.

## 절대 규칙
- 작업 경로는 이 저장소 안으로 한정. 상위 폴더·다른 저장소 접근 금지.
- 비용이 발생하는 행동(광고 집행, 유료 API, 도메인 구매, 유료 플랜)은 실행하지 않고 `backlog/TASKS.md`에 `needs-approval`로 올린다.
- 의료 효과 보장·전후 사진·평점(AggregateRating) 생성 금지. 시술 정보에는 출처 필수.
- 개인정보(리드 실데이터)는 로그·커밋에 넣지 않는다. 더미 데이터만.
- 태그(GA4·Pixel)는 코드에 하드코딩하지 않는다. dataLayer.push만.
- 스펙과 충돌하면 스펙을 고치지 말고 `backlog/TASKS.md`에 `spec-question`으로 올린다.

## 한글 경로·파일명·인코딩 규칙 (Windows, 모든 에이전트)
- 작업 디렉터리는 항상 **`C:\rs`**(ASCII 정션)에서 시작한다. `C:\Users\이재훈\...` 경로를 명령·설정·스크립트에 쓰지 않는다. 절대 경로가 필요하면 `process.cwd()`/`$PSScriptRoot`로 얻는다.
- **소스 파일·폴더 이름은 ASCII만**: 컴포넌트, 스크립트, MDX 파일명(`double-eyelid-surgery.mdx`), 스크린샷(`P-03.png`), 로그 파일명. 한글은 파일 **내용**과 URL `slug` 프런트매터 값에만 쓴다(빌드 산출물 `out/`에 한글 디렉터리가 생기는 것은 허용).
- 새 스크립트는 `.mjs`/`.ts`/`.ps1`로만. **`.cmd`/`.bat`에 한글 금지**(cmd가 UTF-8을 깨뜨림). `.ps1`은 UTF-8 BOM으로 저장.
- 파일 I/O는 항상 인코딩 명시: `fs.readFileSync(p, 'utf8')`, Python `open(p, encoding='utf-8')`. 셸 출력은 `chcp 65001` 가정하지 말고 Node/PowerShell로 처리.
- `.gitattributes`로 `* text=auto eol=lf` 고정, `git config core.quotepath false`. CRLF 경고는 무시하지 말고 `.gitattributes`로 해결한다.
- `supabase` CLI는 전역 설치가 없으므로 **`npx supabase <cmd>`**로 호출한다.

## 외부 서비스 mock 모드
- `.env.local`에 키가 없는 서비스(Supabase, GTM/GA4 서비스 계정, 메타, Resend)는 **인터페이스만 구현하고 더미 응답**으로 진행한다. 키가 필요한 지점은 `lib/env.ts`의 `hasKey('SUPABASE')` 같은 가드로 감싸고, 로그에 "mock 모드로 통과" 를 남긴다.
- 키가 없어서 VERIFY를 완료할 수 없는 항목은 실패가 아니라 `needs-key`로 표시하고 TASKS.md T-001에 어떤 키인지 적는다.
- `needs-key`는 **항목 단위** 표시다. 나머지 VERIFY가 mock으로 통과하면 작업은 정상적으로 `review`→`done`으로 가고, 해당 작업 비고에 `needs-key: <키 목록>`을 남긴다. 작업 상태 자체를 `needs-key`로 두는 것은 작업 전체가 키 없이 의미가 없을 때뿐이다(그래야 의존 체인이 끊기지 않는다).
- 키가 들어오면 다음 루프에서 `needs-key` 항목을 자동 재검증한다.

## 권한 부트스트랩 (T-099)
권한 목록의 원본은 **`config/claude-settings.json`** 하나다. `run-night.ps1`이 매 실행 시 이를 `.claude/settings.json`으로 복사하므로 `.claude/settings.json`을 직접 고치지 말고 config 쪽을 고친다. 이후 사용자는 `claude --permission-mode acceptEdits`로 실행한다.
비용·삭제·결제 명령은 허용 목록에 없으므로 자동으로 멈춘다.

## 루프 실행 규칙
- **무인 모드**(`run-night.ps1`): 질문할 사람이 없다. 모호하면 스펙의 가장 단순한 해석으로 진행하고 로그에 "가정:" 줄을 남긴다. 되돌릴 수 없는 결정(외부 발송·결제·삭제·외부 서비스 설정 변경)만 멈춘다.
- 같은 작업이 3회 연속 blocked면 건너뛰고 다음 todo로. 돌릴 todo가 없으면 마지막 줄에 `NOTHING_TO_DO`를 출력하고 끝낸다.
- 권한 거부로 명령이 실패하면 우회하지 말고 `blocked` + 거부된 명령을 기록한다.
- `/loop`는 기본 **순차**: 게이트 통과한 lane 중 우선순위 높은 1개 lane의 1건만 처리. `/loop --parallel`일 때만 lane별 병렬.
- 요금제 한도 경고가 나오면 즉시 현재 작업을 REPORT하고 멈춘다. 다음 `/loop`가 이어받는다.

## MCP 사용 규칙
- `context7`: Next.js 15 정적 export·Supabase Edge Functions·GTM API 같은 **최신 문서가 필요할 때만** 호출. 일반 코드는 호출하지 않는다.
- `playwright`: 리뷰어 스크린샷·375px 스모크·GIF 프레임 캡처용. 외부 사이트 조작 금지, localhost와 배포 URL만.

## 기술 기본값
Next.js 15 App Router + TypeScript + Tailwind, `output: 'export'`(GitHub Pages 정적 배포), Supabase(브라우저는 읽기 전용 + 쓰기는 Edge Functions), MDX. 패키지 매니저 pnpm. 테스트 vitest + playwright. 커밋은 Conventional Commits, 브랜치 `feat/<screen-id>-<slug>`. 서버 전용 Next.js 기능(Route Handler, SSR, ISR, middleware) 사용 금지 — 서버 로직은 Supabase Edge Functions로.
