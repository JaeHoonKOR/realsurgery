# 리얼성형 — 에이전트 작업 규칙

## 이미지·에셋
- 모든 이미지는 `docs/IMAGES.md` 규칙을 따른다. 얼굴·실사·전후 사진·병원 사진 금지. 시술 이미지는 Gemini로 생성(키 `GEMINI_API_KEY`)하고 없으면 브랜드색 SVG 플레이스홀더.

## 품질 원칙 (v2 — docs/QUALITY.md)
- **목적**: 성형외과 개발·마케팅 팀 채용 심사용 실서비스. 심사자는 강남언니·바비톡을 매일 쓴다. 그들이 "우리보다 낫다"고 느껴야 하고, 공고 요건(SEO·AEO·GA4/GTM·검색광고·메타광고)이 화면에서 보여야 한다.
- **흐름이 완료 단위**: 마일스톤 M1 = 배포 URL에서 메인→가이드→병원→상담→완료가 클릭으로 이어짐. M1 전엔 어떤 화면도 done이 아니다.
- **코드 전에 레이아웃 명세**(docs/layouts/<ID>.md, BENCHMARK 대조 포함) → reviewer 승인 → 구현.
- **검수는 실사용**: reviewer는 저장된 스크린샷이 아니라 사이트를 직접 열어 클릭하고 센다. 텍스트만 있는 구간, 클릭 안 되는 카드, 404 링크는 즉시 반려.
- **최종 질문**: "성형외과 마케팅 팀장이 보면 채용하고 싶은가?" 아니오면 반려.
- 더미 데이터도 실서비스처럼. "테스트"·"샘플" 표기 금지.

## 단일 진실 소스
- **규범(SSOT)은 `docs/specs/*.md`뿐**(README에 목록·우선순위). `docs/spec/screen-spec.md`·`docs/layouts/*`는 파생물, `docs/QUALITY.md`는 80-quality 별칭, `docs/BENCHMARK.md`는 입력 데이터.
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
- 키가 들어오면 다음 루프에서 `needs-key` 항목을 자동 재검증한다.

## 권한 부트스트랩 (T-099)
첫 루프에서 `.claude/settings.json`을 아래 허용 목록으로 생성한다. 이후 사용자는 `claude --permission-mode acceptEdits`로 실행한다.
```json
{"permissions":{"allow":["Read","Write","Edit","Glob","Grep","Bash(pnpm *)","Bash(npm *)","Bash(npx *)","Bash(node *)","Bash(git *)","Bash(gh *)","Bash(supabase *)","Bash(mkdir *)","Bash(ls *)","Bash(cat *)","WebSearch","WebFetch"],"deny":["Bash(rm -rf *)","Bash(git push --force*)","Bash(gh repo delete*)"]}}
```
비용·삭제·결제 명령은 허용 목록에 없으므로 자동으로 멈춘다.

## 브랜치·머지 규칙
- 작업은 `feat/<ID>-<slug>` 브랜치. reviewer approve → 오케스트레이터가 로컬에서 `main`에 `--no-ff` 머지 → `git push origin main` 시도. push 403이면 needs-key로 기록하고 로컬 main은 그대로 진행(배포만 밀림).
- `main`은 항상 빌드 통과 상태를 유지한다. 머지 전 `pnpm build` 1회.

## 검토 예산 (세션 한도 방지)
- **반려는 차단 사유만**: 흐름 끊김·404·텍스트만 있는 구간·클릭 불가 카드·게이트 수치 미달·법무 위반·정의서 형식 누락. 그 외(스크립트 엣지 케이스, 문구, 개선 제안)는 "비차단"으로 기록하고 approve.
- **같은 작업 반려 상한 2회.** 3회차 검토는 차단 사유가 남아 있어도 approve + 남은 사유를 `fix:` 후속 작업으로 TASKS에 생성. 무한 반려 금지.
- 교차 검토 지적 **상한 10건/명**, "충돌·누락"만. 제안은 별도 "비차단" 절.
- hiring-reviewer 투입 범위: 00-product·90-deliverables·T-088 화면 정의서·레이아웃 명세·M1·M2. 분야 정의서(10·20·30·40·50·60·70·95)는 교차 검토 2명 + lint만.
- 정의서 10·20·30·60은 M1 전 **1쪽 요약(≤ 120줄)**. 넘으면 lint 실패. 완본은 구현 중 보강.
- 모델: 초안·구현·리뷰어 = opus, **교차 검토·hiring-reviewer 재확인 = sonnet**.

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
