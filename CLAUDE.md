# 리얼성형 — 에이전트 작업 규칙

## 단일 진실 소스
- 화면 정의서: `docs/spec/screen-spec.md` (SSOT). 모든 구현·검증은 이 문서 기준.
- 파이프라인 정의: `docs/pipelines/*.md`. 각 에이전트는 자기 파이프라인 파일만 따른다.
- 작업 큐: `backlog/TASKS.md`. 상태 전이는 여기서만.
- 실행 로그: `backlog/log/YYYY-MM-DD-<agent>.md`. 루프 1회당 1파일.

## 루프 프로토콜 (모든 에이전트 공통)
1. **PICK** — `backlog/TASKS.md`에서 자기 lane, 상태 `todo`, 우선순위 가장 높은 1건을 `doing`으로 바꾼다.
2. **READ** — 해당 화면 ID·절을 `screen-spec.md`에서 다시 읽는다. 기억으로 작업하지 않는다.
3. **ACT** — 파이프라인 파일의 Act 절대로 실행한다.
4. **VERIFY** — 파이프라인의 Verify 체크리스트를 전부 통과할 때까지 ACT로 돌아간다. 최대 3회. 3회 실패 시 `blocked` + 사유 기록.
5. **REPORT** — 로그 파일에 변경 파일, 검증 결과, 남은 리스크 3줄. `TASKS.md` 상태를 `review`로.
6. **HUMAN GATE** — `review` → `done`은 사람만 바꾼다. 에이전트는 다음 PICK으로.

## 절대 규칙
- 작업 경로는 이 저장소 안으로 한정. 상위 폴더·다른 저장소 접근 금지.
- 비용이 발생하는 행동(광고 집행, 유료 API, 도메인 구매, 유료 플랜)은 실행하지 않고 `backlog/TASKS.md`에 `needs-approval`로 올린다.
- 의료 효과 보장·전후 사진·평점(AggregateRating) 생성 금지. 시술 정보에는 출처 필수.
- 개인정보(리드 실데이터)는 로그·커밋에 넣지 않는다. 더미 데이터만.
- 태그(GA4·Pixel)는 코드에 하드코딩하지 않는다. dataLayer.push만.
- 스펙과 충돌하면 스펙을 고치지 말고 `backlog/TASKS.md`에 `spec-question`으로 올린다.

## 외부 서비스 mock 모드
- `.env.local`에 키가 없는 서비스(Supabase, GTM/GA4 서비스 계정, 메타, Resend)는 **인터페이스만 구현하고 더미 응답**으로 진행한다. 키가 필요한 지점은 `lib/env.ts`의 `hasKey('SUPABASE')` 같은 가드로 감싸고, 로그에 "mock 모드로 통과" 를 남긴다.
- 키가 없어서 VERIFY를 완료할 수 없는 항목은 실패가 아니라 `needs-key`로 표시하고 TASKS.md T-001에 어떤 키인지 적는다.
- 키가 들어오면 다음 루프에서 `needs-key` 항목을 자동 재검증한다.

## 권한 부트스트랩 (T-099)
첫 루프에서 `.claude/settings.json`을 아래 허용 목록으로 생성한다. 이후 사용자는 `claude --permission-mode acceptEdits`로 실행한다.
```json
{"permissions":{"allow":["Read","Write","Edit","Glob","Grep","Bash(pnpm *)","Bash(npm *)","Bash(npx *)","Bash(node *)","Bash(git *)","Bash(gh *)","Bash(supabase *)","Bash(mkdir *)","Bash(ls *)","Bash(cat *)","WebSearch","WebFetch"],"deny":["Bash(rm -rf *)","Bash(git push --force*)","Bash(gh repo delete*)"]}}
```
비용·삭제·결제 명령은 허용 목록에 없으므로 자동으로 멈춘다.

## 루프 실행 규칙
- `/loop`는 기본 **순차**: 게이트 통과한 lane 중 우선순위 높은 1개 lane의 1건만 처리. `/loop --parallel`일 때만 lane별 병렬.
- 요금제 한도 경고가 나오면 즉시 현재 작업을 REPORT하고 멈춘다. 다음 `/loop`가 이어받는다.

## MCP 사용 규칙
- `context7`: Next.js 15 정적 export·Supabase Edge Functions·GTM API 같은 **최신 문서가 필요할 때만** 호출. 일반 코드는 호출하지 않는다.
- `playwright`: 리뷰어 스크린샷·375px 스모크·GIF 프레임 캡처용. 외부 사이트 조작 금지, localhost와 배포 URL만.

## 기술 기본값
Next.js 15 App Router + TypeScript + Tailwind, `output: 'export'`(GitHub Pages 정적 배포), Supabase(브라우저는 읽기 전용 + 쓰기는 Edge Functions), MDX. 패키지 매니저 pnpm. 테스트 vitest + playwright. 커밋은 Conventional Commits, 브랜치 `feat/<screen-id>-<slug>`. 서버 전용 Next.js 기능(Route Handler, SSR, ISR, middleware) 사용 금지 — 서버 로직은 Supabase Edge Functions로.
