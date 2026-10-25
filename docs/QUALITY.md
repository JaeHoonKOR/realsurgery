# 품질 기준 (Definition of Done) — 서비스급

"동작한다"가 아니라 "강남언니·바비톡 옆에 놓아도 어색하지 않다"가 기준이다. 모든 화면은 아래를 전부 통과해야 `review`로 갈 수 있다. 통과할 때까지 반복하며, 재시도 횟수 제한은 없다(루프 예산 안에서). 같은 원인으로 5회 연속 실패하면 `blocked`(CLAUDE.md 루프 프로토콜 4).

- **E2E 적용 범위**: 화면 작업(T-101~T-108)은 3개 흐름 중 **이미 구현된 화면으로 구성된 구간**만 통과하면 된다(미구현 화면이 필요한 단계는 `test.fixme` 대신 해당 작업 ID로 태그해 건너뛰고 로그에 명시). 3개 흐름 전체 통과는 T-111에서 요구한다.
- **키 없는 항목**: Supabase Auth·Edge Function 실호출이 필요한 단계는 mock(`lib/env.ts` 가드)으로 통과시키고 `needs-key`로 기록한다.

## 1. 자동 게이트 (스크립트로 측정, 수치 미달 = 실패)
| 항목 | 기준 | 측정 |
| --- | --- | --- |
| Lighthouse 모바일 | Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO = 100 | `pnpm lh <route>` (localhost, 3회 중앙값) |
| Core Web Vitals | LCP ≤ 2.0s, CLS ≤ 0.05, INP ≤ 200ms | Lighthouse |
| 접근성 | axe-core critical·serious 0건 | `pnpm test:a11y` (playwright + axe) |
| 타입·린트 | `tsc --noEmit` 0 error, eslint 0 error 0 warning | `pnpm typecheck && pnpm lint` |
| 단위 | track() 호출·폼 검증·유틸 커버리지 ≥ 80% | `pnpm test` (vitest) |
| E2E | 핵심 흐름 3개 통과: 검색→가이드→상담 완료 / 병원→전화·카톡 이벤트 / 관리자 로그인→리드 상태 변경 | `pnpm test:e2e` (playwright, 375px·1280px 둘 다) |
| 콘솔 | 브라우저 콘솔 error·warning 0 (개발 모드 포함) | playwright 수집 |
| 번들 | 첫 로드 JS ≤ 150KB gzip | `next build` 출력 |
| 이미지 | 전부 next/image, WebP/AVIF, width/height 명시, alt 있음 | lint 스크립트 |
| 링크 | 깨진 내부 링크 0, 모든 CTA가 실제 경로로 이동 | crawl 스크립트 |

## 2. 상태 커버리지 (각 화면마다 구현·스크린샷)
- 로딩(스켈레톤), 빈 상태(검색 결과 0·리드 0), 에러(네트워크 실패·폼 서버 오류), 성공.
- 폼: 필드별 인라인 검증 메시지, 제출 중 버튼 비활성·스피너, 중복 제출 방지, 실패 시 입력값 보존.
- 긴 텍스트·긴 병원명·가격 미정(null) 같은 경계값에서 레이아웃이 깨지지 않음.

## 3. 디자인 기준 (리뷰어가 스크린샷으로 판정)
- 방향: **토스형 클린 SaaS** — 흰 바탕·회색 밴드·넓은 여백·블루 1색 강조·3D 일러스트(Fluent Emoji 3D, MIT, `components/ui/Emoji3D`).
- 디자인 토큰 1곳(`styles/tokens.css`): 중립·블루·상태색만, 간격 4px 배수, 모서리 위계(sm 칩·md 버튼/입력·lg 카드·xl 패널), 그림자는 떠 있는 요소만. 토큰 외 임의 값 금지(`pnpm lint`의 check-tokens).
- 시그니처: 가격 범위 바(`components/ui/PriceBar`) — 가격 비교는 같은 눈금 위 막대로 보여 준다.
- 타이포: Pretendard Variable, 본문 16px/1.7, display·h1·h2·h3 위계, 제목 자간 촘촘하게, 숫자 `tabular-nums`. 한글 줄바꿈 `word-break: keep-all`.
- 공통 클래스(`lib/ui.ts`)의 버튼·칩·카드·입력 모양만 쓴다. 표기는 `lib/format.ts`(가격 "50만~250만 원", 기간 "약 7일").
- 모바일 375px에서 터치 타겟 ≥ 44px, 하단 고정 바가 콘텐츠를 가리지 않음(safe-area 패딩).
- 1280px에서 콘텐츠 최대폭 1120px, 좌우 여백 균형, 카드 그리드 정렬.
- "템플릿 느낌" 금지: 보라색 그라디언트 히어로, 똑같은 아이콘 3열 섹션, 모든 제목 위 영문 대문자 라벨, "A · B · C" 메타 문자열, 링크 뒤 "→", lorem ipsum, 텍스트 이모지 아이콘(3D 일러스트 이미지는 허용).
- 모션: 첫 로드의 한 순간(히어로 막대)과 사용자 행동에 대한 반응만. `prefers-reduced-motion` 존중.
- 실제 서비스처럼 보이는 더미 데이터: 시술 10개·병원 7곳(예시 데이터 표기)·FAQ 각 5개, 실존 가격대, 실제 지역명. "테스트", "샘플", "병원1" 같은 표기 금지.
- 다크모드는 범위 밖(라이트 고정).

## 4. 리뷰어 판정 절차
1. 1절 스크립트를 **직접 다시 실행**해 수치 확인.
2. `backlog/log/screens/<ID>-375.png`, `<ID>-1280.png`, 상태별 스크린샷을 **Read로 열어 눈으로 본다**. 3절 항목을 하나씩 대조해 위반 좌표·요소를 적는다.
3. 하나라도 미달이면 request-changes. "거의 됐다"는 없다.

## 5. 폴리시 패스 (T-111)
P0 화면이 모두 done이면 전 화면을 한 번에 열어 일관성(여백·색·버튼 스타일·문구 톤)을 맞추는 별도 작업을 돌린다. 이때 UX 카피도 통일: 존댓말, 버튼은 동사형("상담 가이드 받기"), 에러는 원인+해결 1문장.
