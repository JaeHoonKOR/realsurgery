# 01 build — 화면 구현 루프

**단위**: 화면 ID 1개 (P-01, P-03, P-05, P-06, P-07, P-12, A-01, C-01 순서).
**에이전트**: `.claude/agents/builder.md`

## PICK
`backlog/TASKS.md` lane=build, 상태 todo, 우선순위 P0 → ID 순.

## READ
- `docs/spec/screen-spec.md` 2절(해당 행), 3절 전체, 4절(해당 화면 표), 8절 데이터 모델.
- 해당 화면이 쓰는 테이블·이벤트명을 체크리스트로 뽑아 로그에 먼저 적는다.

## ACT
1. 브랜치 `feat/<ID>-<slug>` 생성.
2. 필요한 Supabase 마이그레이션(`supabase/migrations/*.sql`) 작성. 더미 시드 `supabase/seed.sql` 갱신.
3. 페이지 `app/<route>/page.tsx` + 컴포넌트 `components/<screen>/*`. **정적 export 제약**: 동적 경로는 `generateStaticParams`, 데이터는 빌드 시 JSON으로. Route Handler·SSR·middleware 금지, 서버 로직은 `supabase/functions/*`(Edge Function). 클라이언트 컴포넌트는 폼·인터랙션·Edge Function 호출만. **leads 테이블은 브라우저에서 읽기·쓰기 모두 금지**(submit-lead / admin-leads 함수 경유).
4. 표의 **이벤트 열**에 있는 모든 이벤트를 `lib/track.ts`의 `track(name, params)`로 호출. 클릭 요소에 `data-track="<event>"` 속성.
5. 표의 **기능·규칙 열**을 하나씩 구현. 구현 못 하는 규칙은 `// SPEC-GAP:` 주석 + TASKS.md spec-question.
6. 3절 공통 요소(헤더·푸터·CTA 블록·동의 배너)는 `components/common/`에 1회만 만들고 재사용.

## VERIFY (전부 통과해야 REPORT — `docs/QUALITY.md` 1·2·3절 포함)
- [ ] QUALITY.md 1절 자동 게이트 전부 통과 (`pnpm lh`, `pnpm test`, `pnpm test:a11y`, `pnpm test:e2e`)
- [ ] QUALITY.md 2절 상태(로딩·빈·에러·성공) 구현 + 스크린샷
- [ ] 스크린샷 `backlog/log/screens/<ID>-375.png`, `<ID>-1280.png` 저장 후 **직접 Read로 열어** 3절 디자인 기준 자가 점검, 위반 시 수정
- [ ] `pnpm lint && pnpm typecheck && pnpm build` 통과 (`out/`에 해당 화면 HTML 생성 확인)
- [ ] 외부 키 없는 항목은 mock 가드로 통과하고 `needs-key`로 기록
- [ ] 4절 표의 **구성 요소** 행 전부 화면에 존재 (playwright 스모크: 각 영역 testid 존재)
- [ ] 4절 표의 **이벤트** 전부 dataLayer에 push됨 (vitest: track 호출 mock)
- [ ] 375px 뷰포트에서 가로 스크롤 없음, CTA 1탭 도달
- [ ] 하드코딩된 GA/Pixel 스크립트 없음 (`grep -r "gtag\|fbq(" app components` 결과 0)
- [ ] 더미 데이터 외 개인정보 없음

## REPORT
로그: 변경 파일 목록, VERIFY 결과, SPEC-GAP 목록, 리스크 3줄. TASKS.md → review.

## 종료 조건
P0 8개 전부 done. 이후 P1 lane으로 전환.
