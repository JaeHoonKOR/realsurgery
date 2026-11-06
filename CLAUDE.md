# 리얼성형

성형 시술 정보 서비스. 실서비스가 목적이고, 성형외과 마케팅·개발 직무 포트폴리오는 부산물이다.
무엇을 왜 만드는지는 `docs/product/BRIEF.md`, 지금 할 일은 `harness/features.json`, 지난 세션 기록은 `harness/progress.md`.

## 작업 방식 (자세히: `harness/README.md`)
- 메인 세션은 오케스트레이터다. 구현은 `builder`, 판정은 `evaluator`, 기획은 `planner` 서브에이전트가 한다.
- 사용자 명령: `/define <주제>` 기획 · `/cycle [n]` 기능 n개 구현·검증 · `/report` 보고·판정 · `/release` 배포.
- 기능은 한 번에 1개. evaluator PASS → `passes: true` → progress 기록 → 커밋. 세션은 빌드되는 상태로 끝낸다.
- 작업 브랜치는 `cycle/YYYY-MM-DD`. `main` 머지·push는 `/release`에서만.

## 명령어
- 개발 서버 `pnpm dev` (http://localhost:3000) · 정적 빌드 `pnpm build` → `out/` · 정적 서빙 `pnpm serve`
- 확인 `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm test:e2e` · `pnpm test:a11y` · `pnpm lh`
- 데이터 `pnpm data` (`data/seed/*.json` → `data/generated/`) · 이미지 `pnpm assets:images`
- Supabase CLI는 전역 설치가 없다: `npx supabase <cmd>`

## 기술 기본값
- Next.js 15 App Router + TypeScript + Tailwind, `output: 'export'`(GitHub Pages). pnpm. vitest + Playwright.
- 서버 전용 기능(Route Handler, SSR, ISR, middleware) 금지. 서버 로직은 Supabase Edge Functions.
- 디자인 토큰은 `styles/tokens.css` 한 곳. 토큰 밖 색 리터럴은 `scripts/check-tokens.mjs`가 막는다.
- 외부 서비스 키가 없으면 `lib/env.ts`의 `hasKey()` 가드로 감싸고 더미 응답으로 동작시킨다.
- 커밋은 Conventional Commits. `main`은 항상 빌드 통과.

## 법·콘텐츠 경계 (자세히: `docs/legal/MEDICAL-AD.md`)
- 의료 효과 보장, 전후 사진, 다른 병원과 비교·비방, 치료경험담, 평점·AggregateRating, 최상급 표현 금지.
- 시술 정보에는 출처를 단다. 가격은 범위 + 출처 + 조사일.
- 상담·리드 건수에 연동된 대가를 받는 구조는 만들지 않는다(의료법 제27조 제3항).
- 얼굴·실사·병원 사진 금지. 이미지 규칙은 `docs/design/IMAGES.md`.
- 리드 실데이터·키는 로그·커밋에 넣지 않는다. GA4·Pixel ID는 코드에 하드코딩하지 않고 dataLayer.push만.
- 화면에 "테스트"·"샘플" 문구 금지. 가상 병원은 `is_demo` 표기.

## 사람이 하는 일
- 비용이 드는 행동(광고 집행, 유료 API·플랜, 도메인 구매), 외부 발송, 외부 서비스 설정 변경은 하지 않는다.
  필요하면 `docs/product/DECISIONS.md`에 올린다.
- 디자인·콘텐츠 방향은 사용자가 하루 1회 판정한다. 판정은 `docs/design/calibration/`에 쌓인다.

## Windows 함정
- 작업 디렉터리는 `C:\rs`(ASCII 정션). 명령·스크립트에 한글 사용자 경로를 쓰지 않는다.
- 소스 파일·폴더 이름은 ASCII만. 한글은 파일 내용과 slug 값에만.
- 파일 I/O는 인코딩을 명시한다(`'utf8'`). 새 스크립트는 `.mjs`/`.ts`/`.ps1`, `.cmd`/`.bat`에 한글 금지.
- `.gitattributes`가 `eol=lf`를 고정한다.

## 참고
- 이전 하네스(v2)의 정의서·벤치마크·작업 로그는 `docs/archive/`에 있다. 규범이 아니라 참고 자료다.
  경쟁 서비스 실측은 `docs/archive/BENCHMARK.md`, 계정·키 세팅 절차는 `docs/archive/SETUP-HUMAN.md`.
