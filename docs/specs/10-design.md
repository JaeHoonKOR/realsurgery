# 디자인 정의서 (10-design) — v2 완본

- 버전 v2 · 2026-10-25 · owner `spec-designer` · 교차 검토 `spec-content-lead`·`spec-tech-lead` · 판정 `hiring-reviewer` · r1 지적 반영표 = `backlog/log/2026-10-25-spec-design.md` 3절
- 우선순위 7위(README: 95 > 00 > 30·70 > 40 > 50 > 80 > **10** > 20 > 60). 위 문서와 다르면 위 문서를 따르고 4-2 충돌 기록(DC)·4-3 질문(DQ)에 남긴다. 이 문서는 다른 파일을 고치지 않는다(T-088 일괄 정리).
- 입력: `docs/BENCHMARK.md` v1.3(승인), `00-product` v3.1, `90-deliverables` v3, `95-legal-ops` v3, `docs/QUALITY.md` v2, `docs/IMAGES.md`, `docs/spec/screen-spec.md`(파생물), 코드 `styles/tokens.css`·`app/globals.css`·`app/layout.tsx`·`components/**`·`scripts/bench-measure.mjs`·`scripts/check-out.mjs`(2026-10-25 작업트리). 경쟁사 최신 관찰은 hiring-reviewer r1 기록(2026-10-25)만 인용, 추가 열람 0(T-026).
- 완본 표기 사유: M1 구현에 필요한 첫 화면 배분·컴포넌트 상태·측정 규칙이 120줄에 들어가지 않는다. 구현자는 0절 + 3-6 + 3-7만 읽어도 된다.
- ID: 컴포넌트 `BTN`·`CRD`·`BDG`·`CHP`·`CH-n`·`DG-n`·`FRM`·`BNR`·`SKL`·`EMP`·`ACC`·`BAR`·`HDR`·`SUM`·`TRK`·`CODE`·`BRD`·`FN`, 섹션 규칙 `R-TXT1`~`6`, 충돌 `DC-nn`, 질문 `DQ-nn`. 00의 C·Q, 95의 K, BENCHMARK의 S·E와 겹치지 않는다.
- 글자 수 "자" = 공백·문장부호 포함 글자 수(JS `[...s].length`). 이 문서의 글자 수는 **px 폭에서 계산한 물리 상한**이고, 문구 원문·톤은 20-content가 정한다(4-1).

## 0. 1쪽 요약 (M1 구현자용 최소 규칙)

1. 색 8개 토큰(3-2). 글자 대비 ≥ 4.5:1, 그래픽·경계 ≥ 3:1. `accent`(#D97B66) 글자 0. 상태 접두 투명도(`hover:opacity-*`)·토큰색 알파(`bg-brand/90`) 0.
2. 글자 7단계: 12(각주·"AI 생성" 캡션만)·14·16·20·24(h2·숫자 강조 `text-num`)·28(375 h1)·40(1280 h1). 본문 16px/27.2px. SVG 글자는 **렌더 크기** ≥ 12px(축)·≥ 13px(라벨).
3. 간격 4px 배수 11단계(4~80, padding·margin·gap만). 브레이크포인트 2개(md 768·lg 1024). 최소 지원 폭 360px, 가로 스크롤 0.
4. 터치 타깃 ≥ 44×44px. 44 이상 타깃끼리는 맞닿아도 되고(겹침 0), 44 미만(본문 인라인 링크·각주)만 이웃과 ≥ 8px.
5. **텍스트만 있는 구간 0**: 비텍스트(≥ 24×24px) 윗변 간격 375 ≤ 320px·1280 ≤ 380px, 페이지 첫 비텍스트 윗변 y ≤ 320(1280 ≤ 380), 마지막 667px(1280 800px) 창 안 비텍스트 ≥ 2(R-TXT1·6).
6. **P-03 375 첫 화면 = 3-6 배분표 그대로**(합계 680 ≤ 684px). 헤더 1줄 56px, 순서 H1 → 메타 묶음 → 가격 CH-1 → 수치 칩 CHP-D → 3줄 요약 SUM.
7. 모든 카드는 `<a href data-card>` 1개(안쪽 a·button 0, 같은 탭). 갈 곳 없으면 렌더 0.
8. 첫 화면 채운 배경 CTA 정확히 1(바 있는 화면 375 = 하단 바 주 CTA, P-03 1280 = 목차 열 주 CTA). 헤더 CTA·쿠키 배너 버튼·칩은 외곽선형.
9. 상호작용 컴포넌트는 6상태(default·hover·active·focus·disabled·loading) 값을 3-7 표대로. hover는 `(hover: hover) and (pointer: fine)`에서만. 2px 상태 테두리는 `ring-1 ring-inset` 덧대기(크기 변화 0).
10. 모션 4단계 120·200·320·640ms, easing 2종. 위치·크기 변화는 transform만, 이동 클래스는 `motion-safe:` 접두.
11. 하단 고정 바 높이 64px(border-box, 테두리 포함) + 안전 영역. 쿠키 배너 1층 = CSS 폭 ≥ 360에서 1줄·≤ 64px, 문구 ≤ 8자(375).
12. 일러스트 = Gemini 고정 접두사 + 주제 + 고정 접미사(3-9), 사람·눈동자·글자 0, 효과 암시 0. 아이콘 = lucide-react 선 아이콘 stroke 2.
13. 아코디언 트리거 = `<h2>`/`<h3>` 안 `<button aria-expanded data-accordion="accordion-…">`, 조상 `<header>`·`<nav>` 0. 아코디언 밖 `aria-expanded` 0(헤더 안 검색 제외).
14. 금지 18종(3-11): 평점·전후 사진·할인율·카운트다운·자동 캐러셀·그라디언트·이모지·"인기/추천/TOP/BEST"·더미 표기("테스트 병원" 류) 등.

## 1. 목적과 범위

이 문서는 리얼성형의 **보이는 모든 것**의 값을 정한다. 기준은 BENCHMARK v1.3 실측 최고값이며 목표는 그 값과 같거나 넘는다(3-12). 판정은 리뷰어가 배포 URL에서 `bench-measure.mjs`·Playwright로 세는 숫자로 한다.

| 이 문서가 결정하는 것 | 결정하지 않는 것 (원본) |
| --- | --- |
| 워드마크 사용 규칙, 파비콘·OG 규격 (3-1) | 로고 최종 안 a·b·c 선택 (사람, T-112) |
| 색 토큰 8개·대비비·투명도 규칙 (3-2) | 화면 문구 원문·톤 (20-content) |
| 타이포 7단계, 글자 수 물리 상한 (3-3) | 이벤트 이름·파라미터 (40-tracking) |
| 그리드·간격 11단계·브레이크포인트 2개·쌓임 5단 (3-4) | JSON-LD 구조·URL 최종 형식 (50-seo-aeo) |
| 터치·포커스·대비·최소 폭 공통 규칙 (3-5) | 화면별 섹션 순서·와이어 (docs/layouts/*) |
| 섹션 구성 규칙 R-TXT1~6, 화면별 첫 화면 배분·필수 요소 (3-6) | 정적 export·성능 구현, 스크립트 수정 (70-engineering) |
| 컴포넌트 카탈로그 18종 × 6상태, 클라이언트 JS 여부, 추적 자리 (3-7) | 금지 표현 사전·라벨 법적 문구·동의 항목 (95-legal-ops) |
| 모션 duration·easing·reduced-motion (3-8) | 광고 소재 문구·캠페인 (60-growth) |
| 일러스트 프롬프트·선택 기준·파일·광고 소재 시각 규격 (3-9) | 생성 스크립트 구현 (`scripts/gen-image.mjs`, 70) |
| 아이콘 세트·의미별 대응 (3-10) | 측정 스크립트 옵션 추가 (80·70, DQ-12) |
| 금지 패턴 18종·검출 방법 (3-11) | 속도 측정 방법 자체 (BENCHMARK 1절·80) |
| BENCHMARK 디자인 관련 39행 목표 (3-12) | 제출물 목록·내용·기한 (90-deliverables) |
| 제출물 A4 PDF·GIF·QR·도표 시각 양식 (3-13) | — |
| Tailwind v4 토큰 매핑·`@utility` 이름 (3-14) | — |

**범위 밖 (v2)**: 다크 모드 0, 다국어 글꼴 0, A-01 표 세부(행 높이 48px·상태 아이콘 24px·스켈레톤만 정함).

### 가정 (무인 모드, 2026-10-25)
- 가정 1: 대비비는 WCAG 2.x 상대 휘도 식 손계산(소수 둘째 자리). spec-tech-lead r1이 13쌍 재계산 일치 확인.
- 가정 2: 워드마크 수치는 `public/brand/logo-a.svg`(가로:세로 3.38:1). b안 3.77:1·c안 2.43:1이면 3-1 폭만 다시 계산.
- 가정 3: 밀도 셈 = `bench-measure.mjs` 93~94행 고정 구간(375 667px, 1280 800px, 시작 y = 0, 667, 1334 …). 마지막 부분 구간 처리는 DQ-12 결정 전까지 R-TXT6의 "마지막 창"으로 대신 지킨다.
- 가정 4: 한글 14px 1자 폭 14px, 16px 1자 16px, 숫자·공백 0.55em으로 글자 수 상한을 계산한다(Pretendard 메트릭 근사). 375 안쪽 폭 335px.
- 가정 5: lucide-react `^1.61.0` export 기준. 이 문서에서 v2에 새로 쓴 아이콘 10개(`ListChecks`·`ShieldAlert`·`BadgeCheck`·`ListOrdered`·`ClipboardList`·`Cookie`·`ListTree`·`Activity`·`House`·`ChartColumn`)는 T-100c에서 export 확인, 없으면 24px 그리드 SVG를 `components/icons/`에 그린다.

## 2. 원칙

1. **숫자는 그림으로 보인다**: 가격 = 분포 바, 회복 = 일 단위 타임라인, 병원 = 비교 막대, 출처 = 뱃지·각주. 숫자 ≥ 3개를 표로만 보여 주는 블록 0(QUALITY 2절). 예: P-03 가격 = CH-1 1개 + 하한·중앙값·상한 + "병원 공개 가격 n곳 · 조사일".
2. **경쟁 최고값 이상, 개수로 판정**: 3-12 39행은 최고값과 같거나 넘는다. 같은 값은 한계값(0·0px·0.00)이거나 넘으려면 뜻 없는 요소를 끼워야 하는 행만. 개수 채우기용 아이콘·아코디언 금지(3-11 #14).
3. **신뢰는 표시로 만든다**: 평점·할인율·전후 사진·얼굴 0(95 원칙 2). 대신 조사일·출처 n건·"예시 데이터"·"의료 자문 검토 전"을 BDG·MET 규격으로 같은 자리에 둔다.
4. **모든 카드는 링크, 모든 상태는 그려져 있다**: 3-7 표에 빈 칸 0 — 해당 없으면 "해당 없음 + 사유".
5. **접근성·속도가 장식보다 먼저다**: 대비 ≥ 4.5:1, 터치 ≥ 44px, 확대 허용, 모션 끔 존중, CLS 중앙값 ≤ 0.004. 장식이 이 숫자 하나라도 깨면 장식을 뺀다.

## 3. 규칙

### 3-1 브랜드·워드마크·파비콘

| 항목 | 규칙 | 예 / 확인 |
| --- | --- | --- |
| 상호 표기 | "리얼성형" 4글자 한 덩어리. "리얼" 단독·"리얼"+후기·사례·경험·전후 조합 0(00 3-1) | 정규식 `리얼(?!성형)` 이용자 화면 0건 |
| 파일 | 사람이 고른 1안 3변형(color·inverse·mono)만 `public/brand/`. 미선택 6개는 `design/brand/`로 이동, `out/`에 0개 | `out/brand/*.svg` = 3개 (DQ-11 check-out 검사) |
| 변형 3종 | color = canvas·surface 배경 / inverse(흰 단색) = brand 배경 / mono(ink 단색) = OG·PDF 흑백 | ConsultCta 안 로고 = inverse |
| 헤더 높이 | 375 28px(a안 폭 95px), 1280 32px(108px) | `site-logo` 안 `<svg>` |
| 최소 크기 | 높이 ≥ 24px(a안 폭 ≥ 81px) | 24px 미만 0회 |
| 여백 | 로고 높이 × 0.5 사방(28px → 14px) | 헤더 좌측 20px ≥ 14 |
| 금지 | 늘이기·기울이기·회전·그림자·외곽선·그라디언트·3변형 밖 색·자간 조정·사진 위 배치 0 | `<svg>`에 `transform`·`filter` 0 |
| 접근성 | `<svg role="img">` + `<title>리얼성형 로고</title>`, 링크 이름 "리얼성형 홈" | axe 0 |
| 파비콘 | 32px = `app/icon.svg`(심볼 SVG). 180px `apple-icon.png`·512px `icon-512.png` = PNG(iOS·PWA가 SVG 미지원) → check-out PNG 예외 2개(DQ-11, DC-33) | `out/`에 PNG 2개만 예외 |
| OG 이미지 | 1200×630, 배경 canvas, 좌상단 워드마크 48px(여백 64px), 제목 56px/700 ink ≤ 2줄(≤ 36자), 하단 brand 띠 8px | `scripts/og.mjs` 산출 1장 열람 |

### 3-2 색 토큰 (8개, 원본 `styles/tokens.css`)

| 토큰 | hex | 허용 용도 | 금지 용도 |
| --- | --- | --- | --- |
| `canvas` | #F7F3EF | 페이지 배경, 아이콘 원형 바탕(span), hover 배경 | `<a>`·`<button>` 기본 배경(채운 CTA로 셈) |
| `surface` | #FFFFFF | 카드·입력·시트·배너·차트 컨테이너, brand·accent-strong 위 글자 | — |
| `line` | #E4DDD5 | 구분선 1px, 카드 테두리, 차트 트랙, 스켈레톤 | 입력·버튼·체크박스 경계(1.35:1 < 3:1), 글자 배경 |
| `ink` | #1F2A2E | 본문·제목·값, 툴팁 배경, 코드 문자열 | — |
| `ink-muted` | #5B6468 | 보조 글자 14px, 입력·Secondary 버튼 경계, 축 글자, 차트 2계열 | `line` 위 글자(4.499:1) |
| `brand` | #2F6F6B | 링크·강조, 선택, 포커스 링, 차트 주 계열, CTA 블록 배경, 코드 키 | `line` 위 글자(4.33:1) |
| `accent` | #D97B66 | 장식 면(≥ 24px), 차트 3계열(surface 위만), 다이어그램 영역 | 글자 전부(3.01:1), canvas 위 그래픽(2.73:1) |
| `accent-strong` | #B4553F | 주 CTA 배경(흰 글자), 오류 글자·아이콘(surface 위), 절개선, 코드 숫자 | canvas 위 글자(4.41:1) |

**대비비 표** (글자 ≥ 4.5:1 / 그래픽·경계·포커스 ≥ 3:1, "금지" = 그 조합 글자 0회)
| 앞색 ↓ / 배경 → | surface | canvas | line | brand | accent-strong |
| --- | --- | --- | --- | --- | --- |
| ink | 14.70 | 13.31 | 10.92 | — | — |
| ink-muted | 6.06 | 5.49 | 4.50 (4.499, 금지) | — | — |
| brand | 5.82 | 5.27 | 4.33 (금지) | — | — |
| accent-strong | 4.87 | 4.41 (금지) | — | — | — |
| accent | 3.01 (글자 금지, 그래픽 허용) | 2.73 (그래픽도 금지) | — | — | — |
| surface | — | — | — | 5.82 | 4.87 |
| line (경계) | 1.35 (장식 구분선만) | 1.22 (장식 구분선만) | — | — | — |

- 상태색 신규 토큰 0. 오류 = accent-strong + `CircleAlert` + 문장, 성공 = brand + `CircleCheck` + 문장. 색만으로 상태를 전하는 요소 0.
- **투명도 규칙**: 금지 = 상태 접두 투명도(정규식 `(hover|focus|focus-visible|active|group-hover|disabled):opacity-\d+`)와 토큰색 알파(`(bg|text|border|fill|stroke|ring)-[a-z-]+/\d+`). 허용 = 등장·퇴장 전환의 opacity 0 → 1(툴팁·스켈레톤 교체·폼 단계), 다이어그램 영역 `fill-opacity` 0.22. 렌더된 글자색 알파 = 1. 근거: `hover:opacity-90`이면 accent-strong 위 흰 글자 4.08:1(DC-06). 검출은 check-tokens 규칙 추가(DQ-13).
- 그라디언트 0(배경·글자·버튼·SVG).

### 3-3 타이포 스케일

글꼴: Pretendard Variable(FCP 뒤 로드, `app/layout.tsx` 20~22행) + 메트릭 맞춘 대체 글꼴. 굵기 3종 400·600·700. 코드 글꼴 `--font-mono` = `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`(CODE 전용). `word-break: keep-all`. 숫자 값은 `tabular-nums`.

| 단계 | 토큰 | 375 크기 / 줄높이 | 1280 | 굵기 | 용도 |
| --- | --- | --- | --- | --- | --- |
| h1 | `text-h1` | 28px / 36.4px | 40px / 52px | 700 | 페이지 제목, 화면당 1 (B-25) |
| h2 | `text-h2` | 24px / 33.6px | 같음 | 700 | 섹션 제목 |
| num | `text-num` | 24px / 31.2px, `tabular-nums` | 같음 | 700 | 숫자 강조 HTML 값(P-05 신뢰 수치, /insights 지표) |
| h3 | `text-h3` | 20px / 29px | 같음 | 700 | 카드 묶음 제목, CTA 블록 제목 |
| base | `text-base` | 16px / 27.2px | 같음 | 400·600·700 | 본문, 버튼 lg, 입력값, FAQ 질문(600), 직답 문장(600) |
| sm | `text-sm` | 14px / 22.4px | 같음 | 400·600·700 | 메타·뱃지·칩·캡션·버튼 md·SUM 본문 |
| chip | (CHP-D 전용 줄높이) | 값 16px/20px 700 · 라벨 14px/18px 400 | 같음 | — | CHP-D 2줄 = 38px + 위아래 5px = 48px |
| xs | `text-xs` | 12px / 16px | 같음 | 400·700 | 각주 위첨자, "AI 생성" 캡션, PDF 꼬리말만 |
| svg | SVG `fontSize` | 렌더 ≥ 12px(축)·≥ 13px(라벨·값) | 같음 | 400·700 | `fontSize × getScreenCTM().a`로 판정(360·375·1280) |

**글자 수 물리 상한** (자 = 공백 포함, 가정 4)
| 대상 | 상한 | 계산 |
| --- | --- | --- |
| H1 (공통) | ≤ 24자, 375에서 ≤ 3줄 | 335 ÷ 28 ≈ 12자/줄 |
| H1 (P-03, 일러스트 옆) | ≤ 18자, ≤ 2줄 = 73px | (335 − 56 − 12) ÷ 28 ≈ 9자/줄 |
| H2 | ≤ 26자, 375 ≤ 2줄 | 335 ÷ 24 ≈ 14자/줄 |
| 목차 라벨 `toc_label` | ≤ 8자 | 375 칩 1개 ≤ 160px |
| OG 제목 | ≤ 36자 | 56px × 2줄 ÷ 1072px |
| 버튼·상태 라벨 | 명사형 ≤ 10자(예외: BAR 주 CTA 3-7-11) | BTN md 44px 줄바꿈 0 |
| 안내·오류 문장 | 1문장 ≤ 40자, 합쇼체, "원인 + 해결" | 375 14px 2줄 |
| 대시(—) | 0개. 예외 = 00·90·95 원문 인용("예시 병원입니다 — …", "데이터 수집 중 — …") | 문자열 검사 |

- 본문 한 줄 ≤ 680px(약 42자), 375 335px(약 20자). 문단 ≤ 5줄(375), 문단 간격 16px, 가운데 정렬 본문 3줄 이상 0.
- H2 아래 첫 문장과 FAQ 답변 첫 문장(직답) = 16px/600 ink, 나머지 16px/400.
- 입력 글자 16px 미만 0. 12px 미만 HTML 글자 0. 확대 200%에서 가로 스크롤·잘린 글자 0(B-26).

### 3-4 그리드·간격·브레이크포인트

| 항목 | 기본 (< 768px, 기준 375) | md (768~1023px) | lg (≥ 1024px, 기준 1280) |
| --- | --- | --- | --- |
| 컨테이너 | 폭 100%, 좌우 20px | 폭 100%, 좌우 40px | `max-w-page` 1200px + 좌우 40px → 1280에서 안쪽 **1120px**(A1) |
| 안쪽 폭 | 335px(360 → 320px) | 688~943px | 944~1120px |
| 열 / 거터 | 4열 / 16px | 8열 / 24px | 12열 / 24px (1280 열 71.3px) |
| 본문 열 | 335px | 680px, 목차 = 본문 위 가로 칩(CHP-L) | 목차 216px + 간격 48px + 본문 680px = 944px, 1280에서 가운데 정렬 |
| 섹션 간 세로 간격 | 48px | 64px | 80px |
| 카드 간격 | 12px | 16px | 24px |
| 컴포넌트 안쪽 여백 | 16px | 20px | 24px |

- **간격 11단계**(padding·margin·gap·inset): 4·8·12·16·20·24·32·40·48·64·80px. 그 밖 0(예 28px `py-7` 금지, DC-23).
- **4px 배수 적용 범위**: HTML 요소의 간격·높이·너비. 예외 = 테두리 1·2px, outline 2px, SVG 내부 좌표·선 두께(DG-1 절개선 3.5px, CRD-P 미니 바 6px, CH-2 막대 10·12px). PRG는 HTML이라 4px.
- **모서리 2종**: `radius-sm` 8px = 버튼·입력·뱃지·칩·툴팁·코드 블록 / `radius-lg` 16px = 카드·시트·배너 블록·차트 컨테이너·스위치 트랙(높이 28px → 알약 모양). `rounded-full` = 아이콘 원형 바탕·DG-3 번호 원만(`data-shape="circle"`).
- **그림자 2종**: `shadow-sm` = 스크롤된 헤더·하단 바 / `shadow-lg` = 카드 hover·툴팁·시트·쿠키 배너.
- **쌓임 순서**: header 30 < popover 35 < bottom-bar 40 < banner 50 < skip-link 60 (`:root --z-*`).

### 3-5 터치 타깃·포커스·접근성 공통

| 항목 | 규칙 | 확인 |
| --- | --- | --- |
| 터치 타깃 | `a`·`button`·`input`·`select`·`[role=switch]`·`[role=button]` 클릭 영역 ≥ 44×44px | Playwright `getBoundingClientRect` |
| 인라인 링크 예외 | `<p>`·`<li>`·`<td>` 안에서 같은 줄 상자에 다른 글자가 있는 `<a>`. 각주 위첨자 링크는 히트 영역 ≥ 24×24px(WCAG 2.5.8 최소) | 예외 목록 = 이 두 종류뿐 |
| 체크박스 | 상자 24px, 감싸는 `<label>` 높이 ≥ 44px → 측정은 label | P-06 동의 행 |
| 타깃 간격 | ≥ 44px 타깃끼리 맞닿음 허용(겹침 0px). 44 미만 타깃(인라인 예외)은 이웃 타깃과 ≥ 8px | 헤더 GNB 링크 `gap-1` 허용 |
| 포커스 | `:focus-visible` outline 2px brand offset 2px. brand·accent-strong 배경 안 = outline 2px surface | Tab 순회, 링 안 보이는 요소 0 |
| 포커스 순서 | DOM 순서 = 시각 순서, 양수 `tabindex` 0, `SkipLink` 1 | Tab 1회째 = "본문 바로가기" |
| 확대 | `maximum-scale`·`user-scalable=no` 0 (B-26) | `<head>` |
| 최소 폭 | 360px에서 가로 스크롤 0, 잘린 글자 0. 375 레이아웃이 360까지 같음 | 360×800 캡처 1장/화면 |
| 상태 전달 | 색 + (아이콘 또는 글자). 선택 칩 = `Check` 16 + `aria-checked` | 흑백 캡처 |
| 이미지 대체 | 정보 SVG = `role="img"` + `<title>` + `<desc>`, 장식 = `aria-hidden`, 카드 안 썸네일 `alt=""`, 단독 일러스트 alt = 매니페스트 alt(≤ 40자, 결과·효과 서술 0) | axe critical·serious 0 |
| 모션 끔 | 3-8 오른쪽 열 | 에뮬레이션 캡처 |

### 3-6 섹션 구성 규칙 — "텍스트만 있는 구간" 0

**비텍스트 요소** = `img`·`svg`(바깥 svg)·`picture`·`canvas`·`video`·`[data-visual]`·CSS 배경 이미지 요소 중 렌더 ≥ 24×24px이고 보이는 것(`bench-measure.mjs` 86~88행). 16·20px 아이콘은 세지 않는다.

| ID | 규칙 | 숫자 | 예 |
| --- | --- | --- | --- |
| R-TXT1 | 페이지 첫 비텍스트 윗변 y 상한 + 인접 두 비텍스트 윗변 간격 상한 | 첫 y ≤ 320(1280 ≤ 380), 간격 375 ≤ 320px·1280 ≤ 380px | 375에서 H2 아이콘 y = 1200 → 다음 윗변 ≤ 1520 |
| R-TXT2 | 비텍스트 없이 이어지는 텍스트 블록 높이 | 375 ≤ 296px(본문 약 10줄), 1280 ≤ 356px | 296px 넘는 해설은 중간 콜아웃(아이콘 24) 1개 |
| R-TXT3 | 섹션(H2)마다 머리 아이콘 24 + 비주얼 블록 ≥ 1 | 섹션당 비텍스트 ≥ 2 | "회복은 며칠" = `CalendarDays` + DG-2 |
| R-TXT4 | 비텍스트 1개 높이 상한(넘으면 2개로) | 375 ≤ 320px, 1280 ≤ 380px | 회복 6단계 400px → "0~7일"·"8일 이후" 2개 |
| R-TXT5 | 텍스트 우세 섹션(S6) 연속 | ≤ 1 | S6 다음 = S1~S5 |
| R-TXT6 | 페이지 **마지막 창** [H − 667, H) (1280 [H − 800, H)) 안 비텍스트 윗변 | ≥ 2 = 푸터 워드마크 SVG + 구조화 데이터 토글 `Braces` 24 (+ "쿠키 설정" `Cookie` 24) | 푸터 300px 안 3개 |

- **유도식**: 간격 d ≤ 333px(667 ÷ 2)이고 첫 윗변 ≤ 333이면 길이 667인 모든 고정 구간에 윗변 ≥ 2. 375는 13px 여유로 320, 1280은 400에서 20px 여유로 380.
- **마지막 부분 구간**: 스크립트는 마지막 구간을 [k·667, H)로 잘라 센다(94행). 그 높이가 320px 미만이면 설계로 ≥ 2를 보장할 수 없어 `--tail window`(마지막 창) 옵션을 80에 요청(DQ-12). 결정 전 판정 = R-TXT6 창 기준 + 스크립트 출력에서 마지막 구간 미달은 "부분 구간 높이 n px" 주석과 함께 비차단.
- **측정 보조**: 윗변 간격 목록 = `--gaps` 옵션(DQ-12), 결정 전에는 Playwright로 같은 선택자(86~88행)의 top 목록을 정렬해 차이를 낸다.
- **적용 화면**: P-01·P-03·P-05·P-06·P-07·P-12·A-01·C-01·`/insights`·404. C-01은 조항 H2마다 아이콘 24 + 조항 요약 칩 1줄.

**섹션 유형 7종** (레이아웃 명세는 섹션마다 유형 ID를 적는다)
| 유형 | 필수 요소 | 375 높이 예산 | 예 |
| --- | --- | --- | --- |
| S1 데이터 | H2 + 아이콘 24 + 차트 1 + 해설 ≤ 3문단 + 출처 캡션 1줄 | ≤ 640px | P-03 "비용은 얼마인가요" = CH-1 + CH-2 |
| S2 카드 그리드 | H2 + 아이콘 24 + 카드 ≥ 2(전부 링크) + "전체 보기" 링크 1 | 2열 × 2행 ≈ 560px | P-01 "시술 가이드" 4장 |
| S3 단계 | H2 + 아이콘 24 + DG-2 또는 DG-3 × n | ≤ 640px | P-07 다음 단계 3줄 |
| S4 FAQ | H2 + 아이콘 24 + ACC 7~8 | 접힘 질문 1줄 59px·2줄 86px(16/600, 위아래 16) → 7개 ≤ 602px | P-03 FAQ 7개 |
| S5 CTA | CTA 블록(BTN Inverse 1 + 아이콘 24) | ≤ 200px | 본문 중간·하단 2회 |
| S6 해설 | H2 + 아이콘 24 + 문단 + 296px마다 콜아웃 1 | ≤ 640px | "누가 받나요" |
| S7 첫 화면 | 아래 표 | 375 ≤ 684px(바 없는 화면 748px) | P-03 상단 |

- P-03 본문 H2 5개 = 누가 받나요(`ClipboardList`, S6) / 비용은 얼마인가요(`Wallet`, S1) / 회복은 며칠인가요(`CalendarDays`, S3) / 부작용은 무엇인가요(`ShieldAlert`, S6) / 과정은 어떻게 되나요(`ListOrdered`, S3). 문구 원문은 20. FAQ(S4)는 이 5개와 별개.

**첫 화면 공통** (QUALITY 2절 3초 규칙 + BENCHMARK 6절)
| 항목 | 375×812 | 1280×800 |
| --- | --- | --- |
| 가치 제안 또는 3줄 요약 | 1 | 1 |
| 실데이터 카드·차트 | ≥ 2 | ≥ 2 |
| 신뢰 수치(숫자) | ≥ 1 (P-03·P-05 ≥ 3, B-04) | 같음 |
| 채운 배경 CTA | 정확히 1 (하단 바가 있으면 바의 주 CTA) | 정확히 1 |
| 필수 요소 하단 y | 812 − 바 64 − 쿠키 배너 64 = **684px**(바 없는 화면 748px) | 800 − 배너 64 = 736px |
| 확인 | 필수 요소에 `data-fold="required"`, Playwright가 하단 y ≤ 상한 검사 | 같음 |
| 래스터 이미지 | P-03·P-05·P-06·P-07 ≤ 1장, 표시 ≤ 64px. P-01은 CRD-P 썸네일 허용(3-9) | 같음 |
| 앱·쿠폰·로그인 유도 | 0 (B-06·B-07) | 0 |

**P-03 첫 화면 배분 — 375×812** (요약 박스 줄 수 상한 방식, 헤더 2번째 줄 0)
| 순서 | 블록 | 높이 | y 범위 | 비고 |
| --- | --- | --- | --- | --- |
| 1 | HDR 1줄(로고 · 검색 아이콘 44 · 헤더 CTA Secondary md) | 56 | 0–56 | 2번째 줄 0, 검색은 아이콘 탭 → 헤더 아래 덮개 행(본문 밀림 0) |
| 2 | 간격 | 12 | 56–68 | — |
| 3 | H1(≤ 18자, ≤ 2줄 73px) + 오른쪽 일러스트 56×56 + "AI 생성" 캡션 12/16 | 76 | 68–144 | 행 높이 = max(73, 56 + 4 + 16) |
| 4 | 간격 | 8 | 144–152 | — |
| 5 | 메타 묶음: MET 2줄(아이콘 `FileSearch` 24) + 4 + S0 고지 2줄(아이콘 `Info` 24, BNR-2 inline) | 94 | 152–246 | 22.4 × 4 + 4 + 아래 0 |
| 6 | 간격 | 8 | 246–254 | — |
| 7 | CH-1 블록: SVG 64(라벨 2줄 + 트랙) + 8 + 캡션 행 24(`Wallet` 24 + 14px 1줄) | 96 | 254–350 | 라벨 = 이름 13px + 값 14/700 |
| 8 | 간격 | 8 | 350–358 | — |
| 9 | CHP-D 3열 × 2행(칩 106.3 × 48, 간격 8) | 104 | 358–462 | — |
| 10 | 간격 | 8 | 462–470 | — |
| 11 | SUM 머리 행(`ListChecks` 24 + "3줄 요약" + CPY 44) | 44 | 470–514 | — |
| 12 | SUM 목록 ≤ 7줄(14/22.4, 번호 원 DG-3 24) + 위 4 | 161 | 514–675 | 문장마다 ≤ 3줄, 합계 ≤ 7줄 → DQ-07 |
| 13 | 여유 | 9 | 675–684 | SUM 칩 행(같은 문장 칩·llms.txt)은 684 아래 허용(필수 아님) |
| — | 브레드크럼 | 0 | — | 375 P-03은 본문 끝(다른 시술 가이드 위)으로 이동(DC-38) |

**P-03 첫 화면 배분 — 1280×800**
| 블록 | 높이 | y 범위 |
| --- | --- | --- |
| HDR(로고 · GNB 4 · 검색 입력 288px · 헤더 CTA Secondary) | 64 | 0–64 |
| 간격 16 → BRD 44 | 60 | 64–124 |
| 간격 8 → H1 1줄 52 + 일러스트 64×64 + 캡션(일러스트 아래 겹침 0, 행 84) | 92 | 124–216 |
| 간격 8 → MET 1줄 24(아이콘 3) + 8 + S0 고지 BNR-2 inline 1줄 24 | 64 | 216–280 |
| 간격 16 → CH-1 블록(SVG 80 + 8 + 캡션 24) | 128 | 280–408 |
| 간격 16 → CHP-D 6열 × 1행(106.7 × 48) | 64 | 408–472 |
| 간격 16 → SUM(머리 행 44에 CPY·같은 문장 칩·llms.txt 칩 + 8 + 목록 ≤ 6줄 134 + 아래 16) | 218 | 472–690 |
| 왼쪽 목차 열(216px, sticky top 88): `ListTree` 24 머리 + 항목 5 × 44 + 16 + 주 CTA BTN Primary lg | — | 88–416 |
| 합계 | 690 ≤ 736 | — |

**B-05 첫 화면 비텍스트 집계 (P-03)**
| 요소 | 375 | 1280 |
| --- | --- | --- |
| 로고 SVG · 헤더 검색 아이콘 24 | 2 | 2 |
| 목차 머리 `ListTree` 24 · 목차 열 주 CTA 아이콘 24 | 0 | 2 |
| 시술 일러스트 | 1 | 1 |
| MET 아이콘 24(375 1개 · 1280 3개) + S0 고지 `Info` 24 | 2 | 4 |
| CH-1 SVG + 캡션 `Wallet` 24 | 2 | 2 |
| CHP-D 아이콘 24 × 6 | 6 | 6 |
| SUM 머리 `ListChecks` 24 + CPY `Copy` 24 + 번호 원 DG-3 × 3 | 5 | 5 |
| 하단 바 주 CTA 아이콘 24 | 1 | 0 |
| 쿠키 배너 `Cookie` 24 (1280 1층만) | 0 | 1 |
| **합계** | **19** (목표 ≥ 18) | **23** (목표 ≥ 22) |

**B-03 첫 화면 실데이터 숫자 집계 (P-03 375)**: CH-1 하한·중앙값·상한·"병원 공개 가격 n곳" 4 + CHP-D 수술 시간 범위 2·일상 복귀 범위 2·실밥 제거 1~2·붓기 감소 범위 2·병원 수 1(마취 0) 8~9 + MET "출처 n건" 1 = **13~14**. 날짜·요약 문장 속 반복은 셈 0. CHP-D 값은 출처의 "하한~상한"을 그대로 쓴다(단일 값으로 줄이면 13 미만).

**화면별 첫 화면 필수 요소** (`data-fold="required"` 대상, 375 하단 y 상한)
| 화면 | 필수 요소 | 375 상한 |
| --- | --- | --- |
| P-01 | H1 + 가치 제안 1문장(≤ 70자) · 검색 입력(윗변 y ≤ 70, HDR 2번째 줄) · CRD-A 6 · 신뢰 수치 1("가이드 n편 · 출처 n건") · 주 CTA 1 | 748 (바 없음) |
| P-03 | 위 배분표 1~12행 | 684 |
| P-05 | H1 병원명 · BDG-1 · 고지 1줄(00 3-1) · 신뢰 수치 3종(B-04) · CH-2 첫 행 · 바 주 CTA | 684 |
| P-06 | 진행 표시 "1/2" + 바 · 시술 칩(자동 채움) · 지역 CHP-S · 시기 CHP-S · 다음 버튼 | 748 |
| P-07 | 완료 체크(640ms) · 다음 단계 DG-3 × 3 · TRK 머리 행 | 748 |
| P-12 | H1(= 소재 헤드라인) · 소재와 같은 일러스트 · 신뢰 요소 1 · 폼 첫 칸 또는 첫 칩 · 주 CTA | 684 |

### 3-7 컴포넌트 카탈로그 (18종)

#### 3-7-0 상태 공통 정의
| 상태 | 트리거 | 공통 규칙 |
| --- | --- | --- |
| default | 렌더 직후 | 3-2 대비 표 통과 |
| hover | `@media (hover: hover) and (pointer: fine)` | 터치 기기 hover 스타일 0. 120ms 또는 200ms |
| active | `:active`. 선택 상태(`aria-pressed`·`aria-checked`·`aria-selected`·`aria-expanded="true"`)는 "선택" 행 | 120ms |
| focus | `:focus-visible` | 3-5 포커스 |
| disabled | `disabled`(버튼·입력) 또는 `aria-disabled="true"`(링크) | 글자 ink-muted on surface 6.06:1, 포인터 이벤트 0, 위 또는 아래에 사유 1줄 |
| loading | `aria-busy="true"` | 폭·높이 변화 0px, 중복 클릭 0, 1,000ms 넘으면 `role="status"` 문장 1줄 |

- **2px 상태 테두리**(선택 칩·입력 active·오류)는 1px 테두리 + `ring-1 ring-inset` 같은 색으로 만든다. 테두리 두께를 바꾸지 않아 크기 변화 0px.
- **클라이언트 JS 여부**(정적 export, 70이 번들 상한을 정함 — DQ-11)
| JS 0 | JS 필요 |
| --- | --- |
| CRD · BDG · CHP-D · CHP-L(앵커) · DG-1~5 · CH-4 · PRG(`animation-timeline: scroll()`, 미지원 브라우저는 PRG 미표시) · FNH(`:target`) · BRD · BNR-2 · EMP · SUM 본문 · TRK 표 | ACC(토글·`beforematch`) · TOC 현재 위치 · TIP · CPY · BNR-1(동의 저장·`<dialog>` 시트) · FRM · CH-1~3·CH-5~8 툴팁 · HDR 검색 펼침·자동완성 · BAR 키보드 숨김 · SKL(A-01) |

#### 3-7-1 버튼 `BTN`

크기: lg = 높이 48px·좌우 24px·16px/600·아이콘 24px / md = 높이 44px·좌우 16px·14px/600·아이콘 20px. 모서리 8px, 아이콘 간격 8px, 라벨 1줄.

| 상태 | Primary (주 CTA) | Secondary (외곽선) | Text (링크형) | Inverse (brand 배경 위) | Icon (44×44) |
| --- | --- | --- | --- | --- | --- |
| default | 배경 accent-strong, 글자 surface 4.87:1 | 배경 surface, 테두리 1px ink-muted, 글자 ink | 글자 brand 5.82:1, 밑줄 1px offset 4px | 배경 surface, 글자 brand | 아이콘 24 ink-muted, 배경 투명, `aria-label` |
| hover | shadow-lg + translateY(−1px), 120ms | 배경 canvas | 밑줄 2px | shadow-lg + translateY(−1px) | 배경 canvas 원 44px |
| active | translateY(0) + scale 0.98 + 그림자 0 | 배경 line(ink 10.92:1) | 글자 ink | scale 0.98 | 배경 line |
| focus | outline 2px brand offset 2px | 같음 | 같음 | outline 2px surface | 같음 |
| disabled | 배경 surface + 테두리 1px line + 글자 ink-muted 6.06:1 | 테두리 line, 글자 ink-muted | 글자 ink-muted, 밑줄 0 | 해당 없음(brand 블록 안은 항상 이동 링크) | 아이콘 ink-muted |
| loading | 라벨 앞 `LoaderCircle` 회전 800ms + 라벨 "보내는 중", 폭 고정 | 같음 | 해당 없음(이동만) | 해당 없음(이동만) | 회전 아이콘 24 |

- **채운 배경 CTA 셈**(`bench-measure.mjs` 100행): 배경이 투명·흰색이 아닌 `a`·`button`·`[role=button]` 중 높이 ≥ 36·폭 ≥ 80·라벨 1~29자. 그래서 첫 화면 Primary = 1, 헤더 CTA·쿠키 배너 버튼·CPY = Secondary, 선택 칩 = 외곽선, canvas 배경 `a`·`button` 0.
- Primary는 뷰포트당 1개. 375 하단 바가 있는 화면의 본문 CTA = S5 Inverse. 1280 P-03 = 목차 열 sticky Primary.
- 라벨 끝 `ArrowRight`는 화면 이동 버튼만. 제출 버튼은 화살표 0.

#### 3-7-2 카드 `CRD` — 모든 카드는 링크

공통: 루트 `<a href data-card>` 1개(카드 전체 영역), 같은 탭, 안쪽 `a`·`button` 0, 배경 surface, 테두리 1px line, 모서리 16px. 링크 대상이 빌드에 없으면 렌더 0(`isPathBuilt`). 이미지 `width`·`height` 고정. 카드 안 썸네일 `alt=""`. 링크 이름 = 카드 글자(시술명 + 가격 범위 + 일상 복귀), `aria-label` 덮어쓰기 0.

| 카드 | 375 | 1280 | 구성 (위→아래) | 링크 |
| --- | --- | --- | --- | --- |
| CRD-A 부위 | 3열 103.7×96px | 6열 166.7×120px | canvas 원 56px 안 부위 아이콘 32 + 이름 14/600 | P-02 있으면 `/procedures/` 안 부위 앵커, 없으면 대표 시술 P-03 (URL 최종 50, DQ-14) |
| CRD-P 시술 | 2열 161.5px, 높이 ≤ 260px | 4열 262px | 썸네일 3:2 위 꽉 참(108px) → 본문 여백 12 → 시술명 16/600 줄높이 20 ≤ 2줄 40 → 4 → 가격 "120만~250만 원" 14/700 20 → 4 → 미니 바 SVG 6 → 4 → "일상 복귀 3~7일" 14 20(아이콘 0) → 4 → "조사일 2026-10-25" 또는 BDG-2 20~24 → 12 | `/procedures/{slug}` |
| CRD-C 병원 | 1열 335×≈140px | 3열 357.3px | 커버 패턴 SVG 72 → 병원명 16/600(≤ 10자, 넘으면 말줄임) → 지역 14 → 대표 시술 칩 3 → BDG-1 | `/clinics/{slug}` |
| CRD-R 관련 | 1열 가로형 335×96(썸네일 96×64) | 4열 세로형 | 썸네일 → 제목 16/600 2줄 → 날짜 또는 "일상 복귀 n일" | `/procedures/{slug}`·`/blog/{slug}` |

375 CRD-P 합계 = 108 + 12 + 40 + 4 + 20 + 4 + 6 + 4 + 20 + 4 + 24 + 12 = 258px ≤ 260.

| 상태 | 값 |
| --- | --- |
| default | 그림자 0, 테두리 1px line |
| hover | `motion-safe:` translateY(−2px) + shadow-lg + 테두리 brand, 200ms. 썸네일 scale 0, 글자색 변화 0 |
| active | translateY(0) + 그림자 0 + 테두리 brand, 120ms |
| focus | 카드 `<a>`에 outline 2px brand offset 2px |
| disabled | 금지 — 렌더 0 |
| loading | `SkeletonCard` 같은 치수(높이 차 0px) — 비동기 목록(A-01)만 |

- 카드 1장 비텍스트 ≥ 1(썸네일 또는 아이콘 ≥ 24). 가격 카드는 조사일 또는 BDG-2 1개. 평점·할인율·"인기"·"추천"·"TOP"·"BEST" 0.

#### 3-7-3 뱃지 `BDG`·칩 `CHP`

**뱃지 = 클릭 요소 아님**(hover·active·focus·disabled·loading 전부 해당 없음). 링크가 필요하면 CHP-L. 공통: 높이 24px, 좌우 8px, 14/600, 모서리 8px, 아이콘 16.
| 뱃지 | 색 | 아이콘 | 조건 (원본) |
| --- | --- | --- | --- |
| BDG-1 예시 데이터 | 배경 line, 글자 ink 10.92:1 | `FlaskConical` | `is_demo` 병원 카드·상세 상단 1개씩, 가상 병원 가격 인용 문장 뒤 "(예시 데이터)" 글자(95 3-7) |
| BDG-2 예시 가격 | 같음 | `Tag` | F6 미달·만료(00 3-8-4) |
| BDG-3 광고 | 배경 surface, 테두리 ink-muted, 글자 ink | 0 | 제휴·프리미엄 영역마다 1개. 오른쪽 8px에 "심의번호 {ad_review_no}" 14px ink-muted 슬롯(null이면 영역 렌더 0, 95 3-9). 제휴 링크 영역은 아래 줄에 수수료 문장 1개(95 3-11 표, 원문 95) |
| BDG-4 n개 교차검증 | 배경 surface, 테두리 brand, 글자 brand | `CheckCheck` | 수치 1개의 출처 ≥ 2(95 S3), 그 수치 각주 바로 뒤 인라인(줄높이 27.2 안 24px) |
| BDG-5 검토 상태 | 배경 canvas, 글자 ink-muted 5.49:1 | S0 `FileSearch` / S4 `BadgeCheck` | 아래 MET 표 |
| BDG-6 작성 중 | 배경 canvas, 글자 ink-muted | `PencilLine` | 미완본 P-03 첫 화면 "가이드 작성 중 · 가격은 예시 가격"(00 3-2) |
| BDG-7 예시 리포트 | 배경 line, 글자 ink | `FileText` | 양식 시연용 숫자가 든 리포트·PDF 블록(95 3-7 허용 라벨 3종) |

**칩**: CHP-S·CHP-L 높이 44px, 좌우 16px, 14/600, 모서리 8px. CHP-D 높이 48px(3-3 chip 줄높이).
| 상태 | CHP-S 선택 칩 (P-06) | CHP-L 칩 링크 (목차·출처·같은 문장) | CHP-D 데이터 칩 (P-03 6개) |
| --- | --- | --- | --- |
| default | 배경 surface, 테두리 1px ink-muted, 글자 ink | 배경 surface, 테두리 1px line, 글자 brand | 배경 surface, 테두리 1px line, 아이콘 24 brand 왼쪽 + 값 16/700 ink + 라벨 14 ink-muted |
| 선택 | 테두리 1px + `ring-1 ring-inset` brand, 글자 brand, `Check` 16, `aria-checked="true"` | 해당 없음 | 해당 없음 |
| hover | 배경 canvas | 밑줄 1px | 해당 없음(정보 표시) |
| active | 배경 line | 배경 line | 해당 없음 |
| focus | outline 2px brand | outline 2px brand | 해당 없음(포커스 대상 아님) |
| disabled | 테두리 line, 글자 ink-muted, `aria-disabled` | 해당 없음(갈 곳 없으면 렌더 0) | 해당 없음 |
| loading | 해당 없음(즉시 반영) | 해당 없음 | 해당 없음 |

**CHP-D 6개 라벨·아이콘 확정**: 수술 시간 `Clock` · 일상 복귀 `Briefcase`(= 회복기간, 00 F4 T-013) · 실밥 제거 `CalendarCheck` · 붓기 감소 `TrendingDown` · 마취 `HeartPulse` · 병원 수 `Building2`. 값 표기: 범위 "3~7일"·"30~60분"·"2~4주", 14일 넘는 일수는 "28일(약 4주)", 가격은 "n만~m만 원". 375 3열 × 2행(칩 폭 106.3px, 간격 8) = 104px, 1280 6열 × 1행 = 48px.

**MET 메타 줄 (B-23·B-32 (a), 95 3-8)**
| 상태 | 문자열 (순서 고정) | 375 | 1280 |
| --- | --- | --- | --- |
| S0 자문 전 | "의료 자문 검토 전 · 출처 n건 · 최종 수정 YYYY-MM-DD" + 고지 "이 가이드는 의료진 검토 전입니다. 진단·치료는 의료진 상담이 필요합니다." | 2줄 45px, 아이콘 `FileSearch` 24 1개 + 고지 2줄 `Info` 24 | 1줄, 아이콘 3개(`FileSearch`·`BookOpen`·`CalendarClock`) + 고지 1줄 |
| S4 자문 완료 | "의료 자문 ○○○ (전문 과목) · 검토 YYYY-MM-DD" + 둘째 줄 "출처 n건 · 최종 수정 YYYY-MM-DD"(B-23), 고지 0 | 2줄, `BadgeCheck` 24 | 1줄 + 1줄, 아이콘 3개(`BadgeCheck`·`BookOpen`·`CalendarClock`) |
- "출처 n건"은 CHP-L이 아니라 본문 출처 목록으로 가는 앵커 링크 = 같은 줄에 다른 글자가 있는 인라인 링크(3-5 예외, 이웃 타깃과 ≥ 8px). 바이라인 "작성 리얼성형 운영팀" 1줄은 첫 화면 밖(출처 목록 위, P-03 레이아웃 명세).

#### 3-7-4 차트 `CH`

공통: 컨테이너 surface, `<figure>` + `<figcaption>`(캡션) + 같은 값의 `sr-only` 표 1개. 정적 차트(툴팁 없음) = `<svg role="img">` + `<title>` + `<desc>`. 상호작용 차트 = `<svg role="group" aria-labelledby>` + 막대·점마다 `<g role="button" tabindex="0" aria-label="{이름} {값}">`(axe 0). **계열 ≤ 3**: 1 brand 실선 / 2 ink-muted 파선 6-4 / 3 accent 점선 2-4(surface 위만) + 선 끝 직접 라벨(범례 상자 0). 4계열 이상 = 작은 배수(small multiples) 칸 나눔. 막대 비교 차트는 축 0 시작. 원형·도넛·3D·그라디언트 0. SVG는 폭별 2벌(viewBox 폭 320 = 768 미만, 640 = 768 이상) 또는 viewBox 폭 ≤ 최소 표시 폭 — 글자 렌더 ≥ 12px 보장.

| 차트 | 용도 | 375 | 1280 | 데이터 규칙 |
| --- | --- | --- | --- | --- |
| CH-1 가격 분포 바 | P-03 가격 (B-42) | SVG 335×64 + 캡션 행 24 = 블록 96 | SVG 640×80 + 캡션 = 블록 112 | 트랙 = 공개 가격 최저~최고, 병원마다 점 r 5(n ≥ 5), 중앙값 눈금 2×16, 라벨 3개 각 2줄(이름 13px ink-muted / 값 14/700 ink, 375 라벨 1개 폭 ≤ 96px·합 ≤ 300px). 캡션 2종: 정상 "병원 공개 가격 n곳 · 조사일 YYYY-MM-DD", 미달 "병원 공개 가격 조사 중(기한 YYYY-MM-DD)" + BDG-2 + 점 0 |
| CH-2 가격 범위 막대 | P-03 병원 비교, P-05 가격표 | 행 56(라벨 줄 22 + 막대 줄 34), 막대 10, ≤ 5행 | 행 44, 막대 12 | 병원명 ≤ 10자(넘으면 말줄임 + `title`), 가상 병원 이름 뒤 "(예시 데이터)" 별도 줄 14px. 값 1개 = 점 r 7.5, 값 0 = 점선 트랙 + "가격 미정". 6행 이상 = 5행 + "더 보기" |
| CH-3 퍼널 | `/insights#funnel`, D4 | 335×≤ 200 | 640×≤ 220 | 3단(view_procedure → form_start → generate_lead), 막대 + 값 + 전환율 %. 1~4건 칸 "5건 미만"(95 3-6) |
| CH-4 스파크라인 | `/insights` 지표 카드 | 120×32 | 160×40 | 주간 점 ≤ 8, 마지막 점 r 3, 축 0, 옆 값 `text-num`. 정적(`role="img"`) |
| CH-5 채널×시술 매트릭스 | `/insights#channels`, D5 | 행 = 시술 ≤ 10, 열 = 채널 ≤ 4, 칸 32 | 칸 48 | 점 면적 ∝ 리드 수(r 4~16), 색 brand 1계열, 칸마다 값 글자, 0 = 빈 원 테두리 |
| CH-6 키워드 순위 기울기 | `/insights#keywords`, D2 | 2열(구글·네이버) 기울기선, 키워드 20, 높이 ≤ 320(넘으면 10개씩 2개, R-TXT4) | 1열 20개 | 1위 = 위, 100위 밖 = 아래 띠 "100위 밖", 주간 전후 2점 |
| CH-7 AEO 인용률 3선 | `/insights#aeo`, D3 | 335×≤ 200 | 640×≤ 240 | 우리 brand 실선 · 강남언니 ink-muted 파선 · 바비톡 accent 점선, 주 4점, y축 0~100% |
| CH-8 CPL 막대 | `/insights#cpl`, D5·D6 | 335×≤ 160 | 640×≤ 180 | 채널별 가로 막대, 리드 < 5 = 막대 0 + "표본 부족" 글자 |

| 상태 | 값 |
| --- | --- |
| default | 위 표 |
| hover | 막대·점 테두리 2px ink + TIP 200ms |
| active (탭) | 375 탭 1회 = TIP 고정, 바깥 탭 또는 Esc = 닫힘 |
| focus | `<g role="button">`마다 outline 2px brand + TIP |
| disabled | 해당 없음 → 데이터 0 상태 = 점선 트랙 + "데이터 수집 중 — 시작일 YYYY-MM-DD · 예정일 YYYY-MM-DD"(90 D7 원문) 또는 CH-1 미달 캡션. 빈 SVG 0 |
| loading | 해당 없음 — `/insights`·P-03·P-05는 빌드 시 `reports/metrics.json`로 그리는 정적 HTML(90 원칙 4), 스켈레톤 0 |

- `/insights` 섹션마다 캡션 1줄 "기간 YYYY-MM-DD~YYYY-MM-DD · 출처 {GA4·네이버 검색광고 CSV 등} · 갱신일 YYYY-MM-DD", 페이지 상단 BNR-2 정보 "운영 지표(채용 심사용)" 1줄. 성과 숫자 칸 status는 00 3-4 표기("미달"·"표본 부족"·"해당 없음"·"키 대기").

#### 3-7-5 다이어그램 `DG`

공통: `components/diagrams/*` SVG 직접 작성, 토큰 색만, 글자는 `<text>`(렌더 ≥ 13px), `role="img"` + `<title>` + `<desc>`. 얼굴 전체·눈코입 조합·신체 노출·도구·피 0(IMAGES, 95 B12).

| 다이어그램 | 용도 | 크기 | 규칙 |
| --- | --- | --- | --- |
| DG-1 시술 위치 | P-03 "누가 받나요"·"부작용" | 그림 320×180 + 범례, 375 335 · 1280 448 | 부위 윤곽 1개, 표식 ≤ 4(절개선 3.5px accent-strong / 지점 r 5 / 범위 r 18 점선), 번호 원 r 10 |
| DG-2 회복 타임라인 | P-03 "회복은 며칠인가요" (B-43) | 375 세로형 335 × ≤ 320(넘으면 2개), 1280 가로형 640 | 일 단위 눈금 축 1개(라벨 "0일·1일·7일·14일·28일(약 4주)" 중 데이터 범위, 12px), 단계 ≤ 6, 점 r 8, 값마다 각주 번호 |
| DG-3 번호 원 | SUM 문장 번호, P-06 진행, P-07 다음 단계, C-01 조항 | 원 24px, 번호 14/700 surface on brand | 단계 ≤ 5, 번호 = 실제 순서 |
| DG-4 구조화 데이터 노드 | ACC jsonld 패널, D2 | 375 335 × ≤ 320, 1280 640 × ≤ 300 | 노드 = `@type` 1개(상자 radius 8, 글자 13px), 선 = 속성 이름 라벨, 노드 ≤ 12(넘으면 2개) |
| DG-5 3중 일치 | SUM 칩 대상 설명, D3 구조 1쪽 | 640 × 200 | 상자 3개(요약 박스 / `MedicalWebPage.abstract` / FAQ 1번 답변) + "=" 2개 + 같은 문자열 앞 20자 인용 |

상태: hover·active·focus = 해당 없음(정적 그림, DG-2 각주 링크는 BTN Text), disabled = 해당 없음(값 없는 단계는 그리지 않음), loading = 해당 없음(빌드 시 정적).

#### 3-7-6 폼 `FRM` (P-06·P-12 인라인 폼)

| 요소 | 규격 |
| --- | --- |
| 레이블 | 입력 위 14/600 ink, 간격 8px, 필수 = "(필수)" 글자(별표·색만 0) |
| 텍스트 입력 | 높이 48px, 좌우 16px, 16px, 배경 surface, 테두리 1px ink-muted(6.06:1), 모서리 8px. 전화 `inputmode="tel"` `autocomplete="tel"`, 이름 `autocomplete="name"` |
| 도움말 | 입력 아래 14px ink-muted, 간격 4px, `aria-describedby` |
| 체크박스 | 상자 24px(테두리 2px ink-muted), label 행 ≥ 44px, 기본 체크 0(95 3-6) |
| **동의 블록 (95 3-6)** | 개별 체크박스 A1 개인정보 수집·이용(필수) · A2 민감정보(관심 시술) 처리(필수) · A4 마케팅 정보 수신(선택)은 **항상 표시**, A3 병원 제3자 제공(필수)은 제휴 병원 ≥ 1일 때만 표시. 맨 위 "필수 동의 전체" 체크박스 1개 = 표시된 필수 항목(A1·A2·A3)만 켬, A4 제외. A2 바로 위 14px ink 고정 1줄 "민감정보는 다른 동의와 별도로 받습니다"(원문 95). 항목마다 오른쪽 "보기" 버튼 44px → 고지 항목 표 ACC(`data-accordion="accordion-consent"`, A1·A2·A4 4항목, A3 5항목) |
| 진행 표시 | "1/2"·"2/2" 14/600 + 바 4px(트랙 line, 채움 brand, 50%·100%), 320ms (B-37) |
| 단계 전환 | `motion-safe:` translateX(16px → 0) + opacity 0 → 1, 320ms, 이전 값 유지 |
| 키보드 입력 | 필수 키보드 입력 ≤ 2(이름·연락처). 시술 = 쿼리 자동 채움 칩, 지역·시기·연락 시간 = CHP-S, 연락 시간 기본 선택 1 (B-36·B-38) |
| 제출 버튼 | BTN Primary lg, 375 폭 100%, 키보드에 가려지면 스크롤 1회로 보이게(고정 위치 0) |
| 오류 문장 | 1문장 ≤ 40자 합쇼체 "원인 + 해결"(원문 20). 예: "이름 칸이 비어 있으니 이름을 입력해 주십시오." · "전화번호 자릿수가 맞지 않으니 10~11자리로 입력해 주십시오." · "필수 동의 2개가 빠져 있으니 체크해 주십시오." · "희망 지역이 비어 있으니 1곳을 골라 주십시오." · "연결이 끊겨 접수되지 않았으니 다시 보내 주십시오." · "접수가 몰려 저장되지 않았으니 1분 뒤 다시 보내 주십시오." |

| 상태 | 입력창 | 제출 버튼 |
| --- | --- | --- |
| default | 위 표 | Primary |
| hover | 테두리 1px ink | BTN Primary hover |
| active (입력 중) | 테두리 1px + `ring-1 ring-inset` brand | BTN Primary active |
| focus | outline 2px brand offset 2px | 같음 |
| disabled | 배경 canvas, 글자 ink-muted 5.49:1, 테두리 line | (a) 필수 미충족: BTN disabled + 사유 "필수 항목 n개 남음". (b) 키 4종 중 1개라도 없는 배포: 00 S8대로 BTN disabled + 사유 "상담 접수 준비 중" + 그 아래 BNR-2 정보 1줄 + BTN Text "시술 가이드 보기"(막힌 화면 0). 화면 문자열 "mock"·"테스트" 0 (DQ-09) |
| loading (제출 중) | 전 입력 `readonly`, 값 보존 | BTN loading, 중복 제출 0 |
| 오류 | 테두리 1px + ring 1px accent-strong, `CircleAlert` 20 + 문장 14px accent-strong(4.87:1), `aria-invalid`, 검사 = 칸 벗어날 때 + 제출 시, 실패 시 값 보존 + 첫 오류 칸 포커스 | BNR-2 오류 1줄 + "다시 보내기" BTN Secondary |

#### 3-7-7 배너 `BNR`

**BNR-1 쿠키 배너** (QUALITY 2절 "하단 1줄 ≤ 64px", 95 3-6)
| 층 | 규격 |
| --- | --- |
| 1층 바 (CSS 폭 ≥ 360) | 하단 고정, 높이 ≤ 64px(안전 영역 제외), 1줄, 배경 surface, 위 테두리 1px line + shadow-lg, 좌우 16px. 문구 14px ≤ 8자(예 "통계·광고 쿠키") + BTN Secondary md 3개 [설정]·[거부]·[동의] 각 `px-3 min-w-14`(56px)·간격 8px. 계산: 375 → 343 − 56×3 − 8×3 = 151px ≥ 8자 × 14 = 112px, 360 → 136px ≥ 112px |
| 1층 바 (1280) | 콘텐츠 안쪽 폭 1120 안: `Cookie` 24 + 문구 ≤ 40자 + "개인정보처리방침" 링크 + 같은 버튼 3개 |
| 1층 (CSS 폭 < 360, 확대 200% 포함) | 2줄: 문구 줄 22.4 + 8 + 버튼 줄 44 + 위아래 8 = 90px ≤ 104px |
| 개인정보처리방침 링크 | 1280 1층 문구 뒤, 375 = 2층 시트 안(1층 폭 부족) |
| 버튼 무게 | [거부]·[동의] 같은 크기·같은 스타일. 채운 배경 0 |
| 2층 시트 | [설정] 탭 → `<dialog>` 하단 시트(`aria-modal`), 높이 ≤ 60dvh(`max-h-sheet`), 위 모서리 16px, 스위치 2개(라벨 "방문 통계" + 14px ink-muted "Google Analytics 4" / "광고 성과 측정" + "Meta 픽셀·네이버", DQ-17), 스위치 트랙 48×28 radius-lg·손잡이 20, 클릭 영역 44×56 + [선택 저장] + 개인정보처리방침 링크 + 닫기 `X` 44. 포커스 가둠, Esc 닫힘, 320ms 위로 열림. [설정] 버튼 `aria-haspopup="dialog"`(aria-expanded 0) |
| 위치 | 하단 바가 있는 화면: bottom = `var(--bar-h)`. 배너가 떠 있는 동안 `body` 아래 여백 + 64px |
| 금지 | 화면 덮는 어둡게 처리·스크롤 잠금·첫 방문 모달 0, X로 동의 처리 0 |
| 재오픈 | 푸터 "쿠키 설정" = `<button>`(BTN Text 모양) 1클릭 → 2층 시트(95 철회 진입점) |
| 검증 폭 | 360·375·390 각각 1층 높이 ≤ 64·문구 1줄 |

상태: default = 동의 기록 없을 때만 표시(기록 있으면 첫 페인트부터 `display:none`) / hover·active·focus = BTN Secondary / disabled = 해당 없음(세 버튼 항상 동작) / loading = 해당 없음(localStorage 동기 저장).

**BNR-2 고지 배너**: 변형 2종. block = 최소 높이 48px, 안쪽 12·16px, surface + 테두리 1px line. inline = 테두리·여백 0(P-03 S0 고지, 1280 MET 아래). 왼쪽 아이콘 24: 정보 `Info` brand / 주의 `TriangleAlert` accent-strong / 오류 `CircleAlert` accent-strong. 글자 14px ink. 닫기 0(법적 고지). 대상: "예시 병원입니다 — …"(00 3-1), S0 고지(95), 제출 실패, "운영 지표(채용 심사용)", mock 제출 안내. 상태: 전부 해당 없음 — 클릭 요소 아님(안의 링크·버튼은 BTN).

**금지 배너**: 앱 설치·쿠폰·프로모션·상단 고정 띠 0(B-06·B-07 = 0px).

#### 3-7-8 스켈레톤 `SKL`

| 항목 | 규칙 |
| --- | --- |
| 쓰는 곳 | **런타임에 데이터를 받는 블록만** = A-01 리드 목록·A-01 상태 집계(Supabase RLS 읽기). `/insights`·P-01·P-03·P-05는 빌드 시 정적 → 스켈레톤 0(90 원칙 4, B-46, DC-28) |
| P-06 제출 대기 | 스켈레톤 아님 → BTN loading |
| 개수 | 비동기 블록 1개당 1개 → A-01 = 2 (B-46 ≥ 2) |
| 측정 가능화 | 묶음 루트 `class` 값에 `skeleton` 포함(예 `skeleton grid gap-4`), `bench-measure.mjs` 114행 셈 대상(DC-25) |
| 치수 | 최종 콘텐츠와 폭·높이 차 0px. 카드형 = `SkeletonCard`, 문단형 = 줄 16px·간격 8px·마지막 줄 66% |
| 색·모양 | 배경 line, 모서리 8px, 맥박 2,000ms `animate-pulse` |
| 접근성 | 루트 `role="status"` + `aria-busy="true"` + 숨김 문장 1("목록을 불러오는 중입니다"), 막대 `aria-hidden` |
| 끝 | 도착 즉시 교체 + opacity 0 → 1, 200ms. 인위 지연 0ms |
| 실패 | 5,000ms 초과·오류 → BNR-2 오류 + "다시 불러오기" BTN Secondary |
| 상태 | hover·active·focus·disabled 해당 없음, loading = 이 컴포넌트 자체 |

#### 3-7-9 빈 상태 `EMP`·404

| 항목 | 빈 상태 (검색 결과 0·목록 0) | 404 (`out/404.html`) |
| --- | --- | --- |
| 일러스트 | `placeholder/empty.svg` 375 160×107 / 1280 240×160 | 같음 (B-45) |
| 제목·문장 | 안내 1문장 ≤ 40자. 검색어 에코 ≤ 12자(넘으면 12자 + "…"), 검색어가 95 금지어 사전에 걸리면 에코 0 → "찾으시는 시술 가이드가 아직 없습니다" | h1 "페이지를 찾을 수 없습니다" + 안내 1문장(원문 20) |
| 행동 | 검색어 유지 입력창 1 + "전체 시술 목록" 링크 1 + 섹션 제목 "시술 가이드 전체 보기" + 다른 시술 10개 CRD-R(시드 10/10, BENCHMARK 7-2 E2) | 링크 ≥ 2(홈·시술 목록) + 시술 검색 입력 1 |
| 비텍스트 | ≥ 2(일러스트 + CRD-R 썸네일) | 375×667 구간 ≥ 2 |
| 금지 | 빈 화면·회색 상자·"데이터 없음" 1단어 0 | `alert()` 0, 앱 유도 0, Next 기본 영문 404 0 |
| 상태 | hover·active·focus = 안의 BTN·CRD, disabled·loading 해당 없음 | 같음 |

#### 3-7-10 아코디언 `ACC` (B-44)

| 항목 | 규칙 |
| --- | --- |
| 마크업 | `<h2>`(본문 섹션)·`<h3>`(FAQ·출처·jsonld) 안(예외: `accordion-consent`는 P-06 동의 행 안 "보기" 버튼, 제목 요소 0) `<button type="button" aria-expanded aria-controls data-accordion="accordion-section·accordion-faq·accordion-sources·accordion-jsonld·accordion-consent">` + 패널 `role="region" aria-labelledby` |
| 패널 구조 | `div.acc-closed`(또는 `.acc-open`) > `div.overflow-hidden` > `div[hidden="until-found"]` 안 내용. `beforematch` 이벤트로 열림 상태 동기화. React 19 출력 HTML에 `hidden="until-found"` 문자열이 있는지 단위 테스트 1개 |
| 위치 금지 | 트리거 조상 `<header>`·`<nav>` 0. P-03 `<article>` 제목 영역은 `<div>`. jsonld 토글은 푸터 안이되 `<nav>` 밖 |
| 아코디언 밖 `aria-expanded` | 0개. 예외 = `<header>` 안 검색 combobox·검색 펼침 버튼(375·1280 각 ≤ 2). 시트·대화상자 열기 버튼은 `aria-haspopup="dialog"` |
| 개수 (P-03) | ≥ 14 = FAQ 7(~8) + 본문 섹션 5 + 출처 1 + jsonld 1 (B-44 최고 14와 같음, 원칙 2) |
| 기본값 (T-027) | 본문 섹션 5개 `aria-expanded="true"`, FAQ·출처·jsonld `false` |
| 접힌 내용 | 정적 HTML에 그대로, 조건부 렌더 0 |
| 크기 | 트리거 최소 56px, 안쪽 16px, 오른쪽 `ChevronDown` 24. FAQ 질문 = `<h3>` 태그 + 16/600(1줄 59px·2줄 86px), 질문 앞 "Q."·번호 0(JSON-LD `name` 문자열과 같게). 섹션 = 24/700 |
| 열림 | 패널 `grid-template-rows` 0fr → 1fr 200ms + 셰브론 180° 200ms(사용자 입력 뒤 → CLS 셈 0) |

**jsonld 토글 패널 (B-27, 00 V 구조화 데이터 공개)**: 트리거 = `<h3>` 고정, 라벨 "이 페이지의 구조화 데이터" + `Braces` 24. 패널 = DG-4 노드 다이어그램 1 + `@type` 칩 줄(BDG 모양, 24px) + CODE 블록 1 + "리치 결과 테스트" 외부 링크(BTN Text, `ExternalLink` 16, `target="_blank" rel="noopener"`, 이름에 "(새 탭)") + "검사 오류 0" 줄(빌드 시 JSON 파싱·필수 속성 검사 결과, 0이 아니면 빌드 실패).

| 상태 | 값 |
| --- | --- |
| default | 배경 surface, 아래 테두리 1px line |
| hover | 배경 canvas |
| active | 배경 line, 열림 = 셰브론 180° |
| focus | outline 2px brand offset −2px(안쪽) |
| disabled | 해당 없음(빈 패널 아코디언 렌더 0) |
| loading | 해당 없음(정적 HTML) |

#### 3-7-11 하단 고정 바 `BAR` (P-03·P-05·P-12, 768px 미만)

| 항목 | 규칙 |
| --- | --- |
| 높이 | `@utility h-bar` = `box-sizing: border-box; height: calc(64px + env(safe-area-inset-bottom))`, 위 테두리 1px line 포함. 버튼 48px를 남은 63px 안 세로 가운데(위 7.5·아래 7.5, 패딩 값 아님). `--bar-h: 64px`를 body 아래 여백·쿠키 배너 bottom에 쓴다 (B-08, DC-04) |
| 좌우 | 16px, 버튼 간격 8px |
| 구성 | 주 CTA(BTN Primary lg, 아이콘 24) 1 + 보조(BTN Secondary, 아이콘 20 위 + 14px 라벨 아래, 폭 88px) 0~2. 보조는 `is_partner = true`이고 전화·카톡 값이 있을 때만. 가상 병원·P-03 = 보조 0(00 3-1) |
| 주 CTA 라벨 | 보조 0개 ≤ 16자(343 − 48 − 32 = 263px ÷ 16) — 예 "이 시술 상담 가이드 받기" 14자(00 3-1) / 보조 1개 ≤ 10자 / 보조 2개 ≤ 6자(주 CTA 좌우 16·아이콘 0: 151 − 32 = 119px) |
| 보조 라벨 | ≤ 5자(88 − 16 = 72px ÷ 14). "카카오톡 상담" 7자 → "카카오톡"(DQ-03) |
| 가림 방지 | body 아래 여백 = `--bar-h` + 안전 영역, 마지막 콘텐츠 가림 0px. 쿠키 배너는 바 위 |
| 배경 | surface, shadow-sm |
| 숨김 | 768px 이상 0, P-06·P-07 0, 소프트 키보드 열림(`visualViewport.height < innerHeight × 0.75`) 때 숨김 |
| 상태 | 버튼마다 BTN. 바 자체 해당 없음(컨테이너) |

#### 3-7-12 보조 컴포넌트

| ID | 컴포넌트 | 규격 | 상태 |
| --- | --- | --- | --- |
| HDR | 헤더 | 1줄 375 56px·1280 64px, sticky, surface, 아래 테두리 1px line, 스크롤 64px 뒤 shadow-sm. **375 2번째 줄**(스크롤과 함께 사라짐): P-01 = 검색 입력 44 + GNB 44, P-02·`/insights`·C-01·404 = GNB 44, P-03·P-05·P-06·P-07·P-12 = 0(검색 = 1줄 아이콘 44 → 헤더 아래 덮개 행 60px). 햄버거 0 | 링크 BTN Text, 헤더 자체 해당 없음 |
| BRD | 브레드크럼 | `<nav aria-label="현재 위치">` 행 높이 44, 14px ink-muted, 링크 히트 44×44, 구분 `ChevronRight` 16, 홈 `House` 16. 375에서 단계 ≥ 4면 "홈 › … › 상위 › 현재"(… 는 링크 아님). 위치: 1280 HDR 아래, 375 P-03 본문 끝 | 링크 BTN Text / 현재 단계 `aria-current` |
| PRG | 스크롤 진행 (B-41) | 헤더 아래 높이 4px, 채움 brand, 트랙 투명, `transform: scaleX()`, `aria-hidden` | default만. 모션 끔에도 위치 갱신, 전환 0ms |
| TOC | 목차 | lg: 왼쪽 sticky 216px, top 88, `ListTree` 24 머리, 항목 44px 14/600 ≤ 8자, 현재 = 글자 brand + 왼쪽 2px brand 막대, 아래 주 CTA. md 이하: 첫 화면 아래 가로 스크롤 CHP-L 5개(현재 = ring brand) | hover 밑줄 / active 배경 line / focus outline / disabled·loading 해당 없음 |
| SUM | 3줄 요약 (AEO, 00 V4·F4) | `<section aria-labelledby>` 배경 surface + 테두리 1px line + 모서리 16 + 안쪽 좌우 16·위 0(머리 행이 위 여백 겸함)·아래 16. 375 문장 폭 = 335 − 2 − 32 − 번호 원 24 − 8 = 269px(약 21자/줄, 가정 4). 머리 행 44: `ListChecks` 24 + 라벨 "3줄 요약"(00 V4, 00 C23) 14/700 + 오른쪽 CPY. 목록 `<ol>` 3항목, 항목마다 DG-3 24 + 문장 14/22.4 ink. 칩 행 44: CHP-L "같은 문장" 칩(라벨 ≤ 15자, 예 "FAQ·JSON-LD와 같음" ≈ 172px, 탭 → FAQ 1번 위치로 이동 + jsonld 토글 열림) + CHP-L "llms.txt" ≈ 94px(도메인 연결 뒤, 00 S13) = 274px ≤ 303px, 1줄. 높이 375 ≤ 7줄 → 머리 44 + 4 + 161 + 8 + 칩 행 44 + 16 = 277px, 1280 ≤ 218px. 복사 대상 = 문장 3개 + 줄바꿈 + 페이지 URL + "최종 수정 YYYY-MM-DD" | 컨테이너 해당 없음, CPY·CHP-L 각자 |
| CPY | 복사 버튼 | BTN Secondary md, `Copy` 24 + "복사". 성공 → `Check` 24 + "복사됨" 2,000ms 뒤 복귀, `aria-live="polite"` 1문장. 실패 → "복사 안 됨, 길게 눌러 복사" | BTN Secondary / loading 해당 없음(동기) |
| TIP | 툴팁 | 배경 ink, 글자 surface 14px, 최대 폭 240, 안쪽 8·12, 모서리 8, shadow-lg, 대상 위 8px, opacity 200ms. 화면 밖 넘침 0px | 표시 = hover·focus·탭 / 그 밖 해당 없음 |
| FNH | 각주 점프 강조 | 각주 번호 → 출처 항목 `:target` 배경 canvas 1,600ms 뒤 surface + "본문으로" 링크 | BTN Text |
| FN | 각주·참고문헌 | 본문 각주 `<sup><a>` 12px/700 brand, 히트 24×24(3-5 예외), 대괄호 0. 참고문헌 항목 행 ≥ 44, 번호 + 제목 16 + 칩 줄(기관 · 연도 BDG 모양 24px, DOI·PMID = CHP-L 외부 링크 새 탭) + "본문으로" | 링크 BTN Text·CHP-L |
| TRK | 전환 기록 투명성 블록 (90 R5) | P-07 "이 전환은 이렇게 기록됩니다"와 `/insights#tracking` 같은 컴포넌트. 머리 `Activity` 24 + h2. 표 4행: 이벤트 이름(generate_lead) · 파라미터(lead_id 마스킹 "L-••••4821", value, currency) · GTM 태그 이름 · 메타 Lead event_id(= lead_id 마스킹). 동의 상태 줄 = 분석·광고 각각 "허용"·"거부" BDG(현재 Consent Mode 값 실시간) + CODE 블록(dataLayer.push 실제 객체, 마스킹). `/insights` 사본 = BDG-7 "예시 리포트" + is_demo 리드 값. 이름·파라미터 원문은 40 | 컨테이너 해당 없음, CODE·CPY 각자 |
| CODE | 코드 블록 | `<pre>` `--font-mono` 13px/20px, `white-space: pre-wrap`, 배경 canvas(ink 13.31·brand 5.27 ✓, accent-strong 금지 → 숫자는 ink 700), 모서리 8, 안쪽 16, 최대 높이 320px 안쪽 스크롤(`tabindex="0"`, `aria-label`), 오른쪽 위 CPY. 문법 색: 키 brand · 문자열 ink · 숫자 ink 700 · 기호 ink-muted | focus = outline 2px brand / hover·active·disabled·loading 해당 없음 |
| MET | 메타 줄 | 3-7-3 MET 표 | 비상호작용, "출처 n건" 앵커만 BTN Text |

**B-40 인터랙션 유형** (유형마다 트리거·결과가 다름)
| # | 유형 | 트리거 → 결과 | 375 | 1280 |
| --- | --- | --- | --- | --- |
| 1 | ACC 펼침 | 탭 → 패널 열림·셰브론 회전 | ○ | ○ |
| 2 | PRG | 스크롤 → 진행 바 길이 | ○ | ○ |
| 3 | TOC 점프 | 칩·항목 탭 → 해당 H2로 이동 | ○ (가로 칩) | ○ (sticky) |
| 4 | 스크롤 위치 강조 | 스크롤 → 현재 섹션 칩·항목 표시 변경(입력 없음) | ○ | ○ |
| 5 | BAR 고정 CTA | 스크롤 중 고정 표시, 키보드 열림 → 숨김 | ○ | — |
| 6 | TIP | 탭(375)·hover/focus(1280) → 값 표시 | ○ | ○ |
| 7 | CPY | 탭 → 클립보드 + "복사됨" | ○ | ○ |
| 8 | FNH | 각주 탭 → 출처 이동 + 1,600ms 강조 | ○ | ○ |
| 9 | 헤더 검색 | 아이콘 탭 → 입력 행(375), 입력 → 자동완성 목록 | ○ | ○ |
| 10 | CRD hover | 포인터 → 카드 상승 | — | ○ |
| 합 | — | — | **9** (≥ 8) | **9** (≥ 8), 합집합 10 |

#### 3-7-13 추적 자리 (이벤트 이름·파라미터는 40, DQ-16)
| 컴포넌트 | 속성 | 값 예 |
| --- | --- | --- |
| BTN Primary·Inverse·헤더 CTA·BAR | `data-track-cta` | `header`·`bar`·`toc`·`inline-mid`·`inline-end` |
| CRD | `data-track-select` | `procedure:{slug}`·`clinic:{slug}`·`area:{id}` |
| CPY | `data-track-copy` | `summary`·`jsonld`·`tracking` |
| BNR-1 버튼 | `data-track-consent` | `settings`·`deny`·`accept`·`save` |
| ACC | `data-accordion` 값 그대로 | `accordion-faq` |
| CH 툴팁 | `data-track-chart` | `ch-1`·`ch-2` |
| FRM 단계 | `data-track-step` | `1`·`2`·`submit` |

### 3-8 모션

| 토큰 | 값 | 용도 |
| --- | --- | --- |
| `--motion-fast` | 120ms | 버튼·칩·입력 hover/active, 스위치 손잡이 |
| `--motion-base` | 200ms | 카드 상승, 아코디언·셰브론, 툴팁, 복사 아이콘, 스켈레톤 → 콘텐츠 |
| `--motion-slow` | 320ms | 폼 단계 전환, 진행 바, 시트, 앵커 스크롤 |
| `--motion-celebrate` | 640ms | P-07 완료 체크 그리기 1회(`stroke-dashoffset`) (B-39) |
| `--ease-standard` | cubic-bezier(0.2, 0, 0, 1) | 들어옴·양방향 |
| `--ease-exit` | cubic-bezier(0.4, 0, 1, 1) | 나감(시트 닫힘·툴팁 사라짐) |
| linear | — | 진행 바, 회전 아이콘 800ms, 스켈레톤 2,000ms |

| 규칙 | 값 |
| --- | --- |
| 움직이는 속성 | 위치·크기 = `transform`만(예외: 아코디언 `grid-template-rows`). 색·배경·그림자·`opacity`·`stroke-dashoffset` 전환 허용. `width`·`height`·`top`·`margin` 애니메이션 0 |
| 이동 클래스 | `translate-*`·`scale-*`·`rotate-*` 전환은 `motion-safe:` 접두 |
| 이동 거리 | translate ≤ 16px, scale 0.98~1.00, 회전 = 셰브론 180°·회전 아이콘만 |
| 로드 시 자동 재생 | 0(예외: A-01 스켈레톤, P-07 완료 체크 1회) |
| 무한 반복 | 스켈레톤·회전 아이콘만 |
| 한 뷰포트 동시 움직임 | ≤ 3 |
| 자동 넘김 캐러셀·패럴랙스·스크롤 연동 등장 효과 | 0(PRG·헤더 그림자는 등장 효과 아님) |

**`prefers-reduced-motion: reduce`**
| 대상 | 기본 | 모션 끔 |
| --- | --- | --- |
| 전 애니메이션·전환 | 위 값 | 0.01ms(`globals.css` 현행), 이동 0px, scale 1.00 |
| P-07 완료 체크 | 640ms 그리기 | 완성 프레임 즉시 |
| 스켈레톤 | 맥박 2,000ms | 정지(line) |
| 회전 아이콘 | 800ms | 정지 + "보내는 중" |
| 앵커 스크롤 | 320ms | 즉시(`scroll-behavior: auto`) |
| PRG | 갱신 | 갱신, 전환 0ms |

### 3-9 일러스트 (Gemini)·광고 소재 시각

**프롬프트 = 고정 접두사 + `Subject: {주제}.` + 고정 접미사** (`scripts/gen-image.mjs` `buildPrompt`)
```
접두사: Flat vector illustration, soft pastel palette (#F7F3EF background, accent #D97B66 and #2F6F6B), clean geometric shapes, no people, no faces, no text, no photorealism, medical-information mood, generous whitespace, centered composition, 3:2 aspect.
접미사: Single abstract line contour only. Do not draw: eyelashes, irises, pupils, two eyes together, closed face outlines, letters, numbers, logos, people, skin texture, medical instruments, needles, blood, arrows, sparkles, before-and-after layouts.
```
- 접두사 hex 3개 = 토큰 canvas·accent·brand. 토큰이 바뀌면 같은 커밋에서 바꾼다. 주제에 결과·효과(위로 향함·반짝임·매끈함·확대) 단어 0(IMAGES 29행, DC-32).

| 시술 (slug) | 주제 (Subject) | alt (≤ 40자, 결과 서술 0) |
| --- | --- | --- |
| 쌍꺼풀 수술 (double-eyelid) | one almond-shaped line contour with a second thin curved line above it | 쌍꺼풀 수술 부위를 나타낸 선 일러스트 |
| 앞트임 (epicanthoplasty) | one almond-shaped line contour with a short curved mark at its inner corner | 앞트임 부위를 나타낸 선 일러스트 |
| 눈매교정 (ptosis-correction) | one almond-shaped line contour with a thin horizontal band along its upper edge | 눈매교정 부위를 나타낸 선 일러스트 |
| 눈밑지방재배치 (lower-fat-repositioning) | one almond-shaped line contour with a dotted crescent line beneath it | 눈밑지방재배치 부위를 나타낸 선 일러스트 |
| 코 성형 (rhinoplasty) | one vertical curved line with a dotted guide line beside it | 코 성형 부위를 나타낸 곡선 일러스트 |
| 사각턱 (square-jaw-reduction) | one U-shaped curve with a dotted guide at its lower corners | 사각턱 수술 부위를 나타낸 곡선 일러스트 |
| 광대 축소 (zygoma-reduction) | an open oval arc with two short dotted marks at mid height | 광대 축소술 부위를 나타낸 곡선 일러스트 |
| 실리프팅 (thread-lift) | three parallel thin wavy lines on a plain background | 실리프팅을 나타낸 세 가닥 선 일러스트 |
| 레이저 토닝 (laser-toning) | three concentric circles drawn with thin lines | 레이저 토닝을 나타낸 동심원 일러스트 |
| 가슴 확대 (breast-augmentation) | two mirrored thin curves around a dotted vertical axis | 가슴 확대 수술을 나타낸 대칭 곡선 일러스트 |

| 항목 | 규칙 |
| --- | --- |
| 후보·선택 | 시술당 3장 → Read로 열어 1장. 통과 7조건 전부: 사람·얼굴·손·피부 질감 0 / 눈동자·홍채·속눈썹·콧구멍·입 0 / 눈 윤곽 2개 이상 0 / 닫힌 얼굴형 0 / 글자·숫자·로고·화살표·반짝임 0 / 도구·바늘·피 0 / 배경 모서리 4점이 #F7F3EF와 채널별 차 ≤ 16. 3장 모두 탈락 → 플레이스홀더 + 로그 1줄 |
| 파일 | WebP 1200×800 ≤ 80KB · 600×400 ≤ 30KB · 300×200 ≤ 12KB (`{slug}.webp`·`-sm`·`-xs`), 매니페스트(slug·파일·프롬프트·생성일·모델·alt) |
| 마크업 (`images.unoptimized`) | `<img srcset="…-xs.webp 300w, …-sm.webp 600w, ….webp 1200w" sizes="(min-width:1024px) 262px, 50vw" width height alt>`. 첫 화면 밖 `loading="lazy"` |
| 첫 화면 | P-03·P-05·P-06·P-07 래스터 ≤ 1장·표시 ≤ 64px → LCP 요소 = H1 또는 P. P-01 = CRD-P 썸네일 `-sm` 600w ≤ 30KB, `loading="eager"` `fetchpriority="low"`, 첫 화면 이미지 합 ≤ 120KB. `fetchpriority="high"` 0 |
| AI 생성 표시 | 단독 일러스트(P-03 H1 옆·P-12·히어로) 아래 "AI 생성" 12px ink-muted 1줄. 카드 썸네일(장식 `alt=""`)은 표시 0, 푸터에 "시술 일러스트는 AI로 생성했습니다" 1줄. 법적 의무 여부 DQ-10 |
| 키 없음 | API 호출 0 → `placeholder/{slug}.svg`(브랜드색 기하 도형 + 시술명 SVG `<text>` ≥ 12px) + `needs-key`. 카드 안 플레이스홀더 `aria-hidden`. 글자 허용은 플레이스홀더만. 회색 "이미지 준비 중" 상자 0 |
| 슬롯 플레이스홀더 7종 | 메인 히어로·광고 랜딩 히어로·병원 커버 패턴·지도 썸네일·칼럼 커버·상담 완료·빈 상태 |
| 한도 | 하루 60장(KST), 결제·쿼터·권한 오류 즉시 중단 |

**메타 광고 소재 시각 규격** (문구·캠페인은 60, 금지는 95 3-2)
| 항목 | 규칙 |
| --- | --- |
| 크기 | 1080×1080 · 1080×1350 · 1080×1920(9:16) |
| 주제 | 소재 전용 Subject = 기하 도형만(원·호·점선·띠 조합). 시술 일러스트의 신체 윤곽 주제 재사용 0 |
| 9:16 안전 영역 | 위 14%(269px)·아래 35%(672px)에 글자·로고 0 |
| 글자 | 생성 이미지에 그리지 않고 템플릿에서 얹음(Pretendard 700, 헤드라인 ≤ 2줄), 글자 면적 ≤ 이미지 20% |
| 워드마크 | 좌상단, 높이 48px, 여백 64px(9:16은 안전 영역 아래 y ≥ 285) |
| 랜딩 일치 (P-12) | 같은 일러스트 파일 · 소재 헤드라인 = P-12 H1 문자열 · P-12 첫 화면 안에서 폼 시작 |

### 3-10 아이콘 세트

| 항목 | 규칙 |
| --- | --- |
| 라이브러리 | `lucide-react` 선 아이콘, stroke 2, 둥근 끝. 채운 아이콘·다른 세트 0 |
| 직접 작성 | Lucide에 없는 뜻만 24px 그리드 SVG(`components/icons/`, stroke 2, `currentColor`) |
| 크기 4단계 | 16(뱃지·칩·인라인, 밀도 셈 0) · 20(BTN md) · **24(섹션 머리·데이터 칩·메타·콜아웃·BTN lg·CPY, 밀도 셈 1)** · 32(부위 카드) |
| 색 | `currentColor`. brand·ink·ink-muted·accent-strong(≥ 3:1). accent는 surface 위 ≥ 24px만 |
| 접근성 | 글자와 함께면 `aria-hidden`, 단독이면 `role="img"` + 이름 또는 버튼 `aria-label` |
| 금지 | 이모지 0, 수술 도구 아이콘 0, `Star` 0, 같은 아이콘 라벨 없이 3개 이상 나란히 0 |

| 뜻 | 아이콘 | 뜻 | 아이콘 | 뜻 | 아이콘 |
| --- | --- | --- | --- | --- | --- |
| 수술 시간 | `Clock` | 가격 | `Wallet` | 검색 | `Search` |
| 일상 복귀(회복기간) | `Briefcase` | 병원 수 | `Building2` | 펼침 | `ChevronDown` |
| 실밥 제거 | `CalendarCheck` | 출처 n건 | `BookOpen` | 외부 링크 | `ExternalLink` |
| 붓기 감소 | `TrendingDown` | 교차검증 | `CheckCheck` | 복사 → 완료 | `Copy` → `Check` |
| 마취 | `HeartPulse` | 최종 수정일 | `CalendarClock` | 전화 | `Phone` |
| 회복 섹션 | `CalendarDays` | 검토 상태 S0 / S4 | `FileSearch` / `BadgeCheck` | 카카오톡 | `MessageCircle` |
| 부작용 섹션 | `ShieldAlert` | 오류 | `CircleAlert` | 지도 | `MapPin` |
| 주의 고지(BNR-2 전용) | `TriangleAlert` | 완료 | `CircleCheck` | 구조화 데이터 | `Braces` |
| 정보 고지 | `Info` | 예시 가격 | `Tag` | 작성 중 | `PencilLine` |
| 예시 데이터 | `FlaskConical` | 예시 리포트 | `FileText` | 3줄 요약 | `ListChecks` |
| 누가 받나요 | `ClipboardList` | 과정 | `ListOrdered` | 목차 | `ListTree` |
| 쿠키 | `Cookie` | 전환 기록 | `Activity` | 홈 | `House` |
| 부위 6종 | 눈 `Eye`·피부 `Sparkles`·코·윤곽·리프팅·가슴 = 직접 작성 4종 | 닫기 | `X` | 다음 | `ArrowRight` |

### 3-11 금지 패턴 (18종)

검출 대상 = `out/**/*.html`의 렌더 텍스트 + `aria-label`·`alt`·`title` 속성(스크립트·JSON-LD 제외). `/terms`·`/privacy`는 부정 문맥 허용 목록(예 "평점을 생성하지 않습니다")만 통과.

| # | 패턴 | 근거 | 검출 |
| --- | --- | --- | --- |
| 1 | 평점·별점·후기 수 UI, `AggregateRating` | 95 원칙 2 | `svg.lucide-star` 0, 문자열 "평점"·"별점" 0 |
| 2 | 전후 비교·얼굴·신체 실사·병원 사진 | IMAGES, 95 B05·B12 | `public/images/` = 매니페스트·플레이스홀더만 |
| 3 | 할인율·정가 취소선·"최저가" 강조 | 95 B13 | `line-through` 0, "원"·"만 원" 앞뒤 40자 안 "%" 0 |
| 4 | 카운트다운·"오늘만"·"n명이 보는 중" | 95 3-1 | 문자열 0 |
| 5 | "인기"·"추천"·"TOP n"·"BEST" 뱃지·정렬·제목 | 00 3-8-4, 95 L12 | "인기"·"추천" 0, 정규식 `\bTOP\b`·`\bBEST\b` 0 |
| 6 | 자동 넘김 캐러셀 | 3-8 | `components/**`·`app/**` 소스에 `setInterval` 0 |
| 7 | 앱 설치·쿠폰·로그인 유도 배너·앱 QR | B-06·B-07 | 첫 화면·푸터 0(제출물 PDF 서비스 QR은 3-13) |
| 8 | 첫 방문 모달·전면 팝업·스크롤 잠금 | BNR-1 | 로드 후 `dialog[open]` 0 |
| 9 | 그라디언트 | QUALITY 6절 | `gradient`·`linear-gradient` 0 |
| 10 | Tailwind 기본 팔레트·토큰 밖 hex | QUALITY 6절 | `check-tokens.mjs` 0 |
| 11 | 이모지 | QUALITY 6절 | 아래 정규식 0(©®™ 오탐 제외) |
| 12 | lorem·더미 표기 | CLAUDE.md, 95 3-7 | 정규식 `lorem`·`테스트 ?(병원\|데이터\|계정\|리드\|사용자)`·`샘플 ?(병원\|데이터)` 0. "리치 결과 테스트"·"A/B 테스트" 허용 |
| 13 | 클릭 안 되는 카드·JS 클릭 전용·내부 새 탭 | QUALITY 1절, B-24 | `check-links.mjs` 0, `[data-card]`가 `a[href]` 아님 0, 내부 `target=_blank` 0 |
| 14 | 개수 채우기 장식(라벨 없는 아이콘 3개 나열, 빈 아코디언) | 원칙 2 | 같은 아이콘 연속 3개 이상 0 + 리뷰어 열람 |
| 15 | 표만 있는 숫자 블록 | QUALITY 2절 | 숫자 ≥ 3개 표마다 차트 또는 CHP-D |
| 16 | 상태 접두 투명도·토큰색 알파 | 3-2 | 3-2 정규식 0 |
| 17 | 확대 제한 viewport, `alert()` | B-26·B-45 | 0 |
| 18 | 회색 플레이스홀더 상자·깨진 이미지 | IMAGES | 이미지 404 0 |

- #11 정규식(u 플래그): `\p{Emoji_Presentation}|\p{Extended_Pictographic}️` — `lib/site.ts` 17행 "©"은 통과.

### 3-12 BENCHMARK 목표 대조표 (디자인 관련 39행)

규칙: 최고값보다 나쁜 목표 0. "같음" = 한계값이거나 넘으려면 뜻 없는 요소가 필요한 행. 표에서 뺀 행: B-21·B-22(JSON-LD 구조, 50), B-28~B-30(참고문헌 수·DOI, 20·50), B-32(95 S0·E1, 표시 규격만 MET), B-33·B-34(로그인·본인인증 0, 00). 속도 B-15~B-20 도구 = `bench-measure.mjs` cold 3회 중앙값·무쓰로틀(BENCHMARK 4-3), Lighthouse 값과 직접 비교 0.
| B-ID | 항목 | 최고값 | BENCHMARK 목표 | **10 목표** | 비교 | 수단 |
| --- | --- | --- | --- | --- | --- | --- |
| B-01 | 메인 가치 제안 문장 | 0 | 1 | 1 (≤ 70자) | 넘음 | 3-6 P-01 |
| B-02 | 메인 첫 화면 이미지 카드 | 4 / 7 | ≥ 5 / ≥ 7 | **≥ 6 / ≥ 8**, 전부 a[href] | 넘음 | CRD-A 6 + CRD-P |
| B-03 | P-03 첫 화면 실데이터 숫자 | 13 | ≥ 13 | ≥ 13 (집계 13~14) | 같음(14번째는 반복) | 3-6 B-03 집계 |
| B-04 | 첫 화면 신뢰 수치 종류 | 3 | ≥ 3 | ≥ 3, 평점 0 | 같음 | MET·CH-1 캡션 |
| B-05 | P-03 첫 화면 비텍스트 | 16 / 20 | ≥ 16 / ≥ 20 | **≥ 18 / ≥ 22** (집계 19 / 23) | 넘음 | 3-6 B-05 집계 |
| B-06 | 앱·로그인 유도 | 0 / 1 | 0 / 0 | 0 / 0 | 넘음 | #7 |
| B-07 | 앱 유도 배너 높이 | 0px | 0px | 0px | 같음(한계) | #7 |
| B-08 | 하단 고정 바 높이 | 72px | ≤ 72px | **64px**(border-box), 주 CTA 1 | 넘음 | BAR |
| B-09 | 375 0개 구간 | 0 | 0 | 0 | 같음(한계) | R-TXT1~6 |
| B-10 | 375 구간 최소 — 메인 | 3 | ≥ 3 | **≥ 4** | 넘음 | CRD-P 썸네일 + CRD-A |
| B-11 | 375 구간 최소 — 시술 상세 | 2 | ≥ 2 | ≥ 2 | 같음(3은 222px 간격 = 장식 증가) | R-TXT1 |
| B-12 | 375 구간 최소 — 병원·폼 | 0 / 1 | ≥ 2 | ≥ 2 | 넘음 | R-TXT1, DG-3 |
| B-13 | 1280 구간 최소 — 메인 | 3 | ≥ 3 | **≥ 4** | 넘음 | CRD-P 4열 |
| B-14 | 1280 0개 구간 — 시술 상세 | 0 | 0 | 0 | 같음(한계) | R-TXT1 |
| B-15 | LCP 375 메인 | 592ms | ≤ 592 | ≤ 592 | 같음(측정 80) | LCP 요소 = H1·P |
| B-16 | LCP 375 시술 상세 | 888ms | ≤ 888 | ≤ 888 | 같음 | 래스터 ≤ 1·≤ 64px |
| B-17 | LCP 375 병원 상세 | 452ms | ≤ 452 | ≤ 452 | 같음 | 커버 = SVG |
| B-18 | LCP 375 상담 폼 | 568ms | ≤ 568 | ≤ 568 | 같음 | 래스터 0 |
| B-19 | LCP 1280 시술 상세 | 268ms | ≤ 268 | ≤ 268 | 같음 | 같음 |
| B-20 | CLS | 0.000 | 0.00 | clsMedian ≤ 0.004(둘째 자리 0.00) + 글꼴 교체 외 이동 0 + Lighthouse 모바일 ≤ 0.05 | 같음(한계) | 치수 고정·`ring-inset`·transform만 (DC-34) |
| B-23 | dateModified ↔ 화면 갱신일 | 1 | 1 | 1 | 같음 | MET |
| B-24 | JS 클릭 전용 카드 | 0% | 0% | 0% | 같음(한계) | CRD |
| B-25 | 페이지당 h1 | 1 | 1 | 1 | 같음(한계) | 3-3 |
| B-26 | 확대 제한 | 없음 | 0 | 0 | 같음(한계) | 3-5 |
| B-27 | 구조화 데이터 화면 노출 | 0 | 토글 1 | 토글 1 + DG-4 + CODE + 검사 오류 0 줄 | 넘음 | ACC jsonld |
| B-31 | 가격 옆 출처·조사일 | 0 | 100% | 100% | 넘음 | CH-1 캡션·CRD-P |
| B-35 | CTA → 제출 클릭 | ≥ 6 | ≤ 5 | ≤ 5 | 넘음 | 필수 동의 전체·CHP-S |
| B-36 | 키보드 입력 값 수 | 3 | ≤ 2 | ≤ 2 | 넘음 | FRM |
| B-37 | 진행 표시 | 0 | 1 | 1 | 넘음 | FRM |
| B-38 | 연락 시간 기본 선택 | 1 | 1 | 1 | 같음 | CHP-S |
| B-39 | 완료 화면 | 측정 불가 | 애니메이션 1 + 3줄 + 블록 1 | 같음 + 체크 640ms + TRK | 넘음 | 3-8·DG-3·TRK |
| B-40 | P-03 인터랙션 유형 | 7 | ≥ 8 | **폭마다 ≥ 8(9), 합집합 10** | 넘음 | 3-7-12 유형표 (스켈레톤 제외, DC-11) |
| B-41 | 스크롤 진행 표시 | 0 | 1 | 1 | 넘음 | PRG |
| B-42 | 가격 시각화 | 0 | ≥ 1 | CH-1 + CH-2 | 넘음 | CH |
| B-43 | 회복 시각화 | 0 | 1 | 1 (일 단위 눈금) | 넘음 | DG-2 |
| B-44 | P-03 아코디언 | 14 | ≥ 14 | ≥ 14 | 같음(원칙 2) | ACC |
| B-45 | 404 구성 | 이미지 1 + 링크 1 | 일러스트 1 + 링크 ≥ 2 | 같음 + 검색 입력 1 | 넘음 | EMP |
| B-46 | 450ms 스켈레톤 | 2 | ≥ 2 | ≥ 2 — **측정 화면 A-01**(`/insights` 0, DC-28) | 같음 | SKL |
| 요약 | P-03 요약 블록(직답) | 강남언니 최신 콘텐츠 "세 문장 요약" 3항목·복사 0·3중 일치 0(hiring r1 관찰 2026-10-25; BENCHMARK 2-2는 0, DC-27) | — | 3항목 + 복사 1 + 3중 일치 1 + 첫 화면 0클릭 | 넘음 | SUM·CPY·DG-5 |

### 3-13 제출물 시각 양식 (90 D1~D8, 생성 `scripts/deliverable-pdf.mjs`)

| 항목 | 규칙 |
| --- | --- |
| 쪽 | A4 210×297mm, 여백 사방 16mm, 1쪽(D2 상세 md 제외) |
| 글자 | 본문 10.5pt / 1.5, 제목 18pt/700, 소제목 13pt/700, 표 9.5pt, 꼬리말 8.5pt. 8pt 미만 0 |
| 색 | 3-2 토큰, 배경 surface, 표 머리 canvas, 강조 brand. 흑백 인쇄에서 구분 = 선 모양(3-7-4 계열 규칙) |
| 머리말 | 왼쪽 워드마크 color 8mm 높이, 오른쪽 "D# 제목" 9pt ink-muted |
| 꼬리말 | 서비스 URL · 쪽 n/n · 생성일 YYYY-MM-DD |
| 인쇄 CSS | `@media print`: HDR·BAR·BNR-1·PRG·TOC·SKL `display:none`, 링크 뒤 URL 글자 0(표 안 URL 열로 대신), 차트 SVG 그대로 |
| 양식 시연 숫자 | BDG-7 "예시 리포트"(95 3-7) |

| 제출물 | 시각 규격 |
| --- | --- |
| D8 커버 | 위→아래: 서비스 소개 ≤ 120자 → 숫자 6칸 3열 × 2행(칸 56×28mm, 값 24pt/700 tabular + 3요소 8.5pt: 기준일·원본 링크·상태 "미달/표본 부족") → 요건 매핑표 8행 → 경쟁 대비 표 7행(우리 열 brand 700) → 링크 ≤ 9 + QR |
| QR | 서비스 URL 1개, ≥ 25mm, ink on surface, 여백 4모듈, 가운데 로고 0, 오류 정정 M |
| D1 GIF | 375×812·1280×800 각 7단계(메인 → 가이드 → 병원 → 상담 1/2 → 2/2 → 제출 → 완료), 첫 동작 = 쿠키 배너 [거부], 커서 강조 원 32px accent 테두리 2px, 단계당 ≥ 2s, 10fps, ≤ 30s, ≤ 5MB |
| D3 | CH-7 3선 + DG-5 3중 일치 다이어그램 + 주간 표 |
| D4 | mermaid → SVG, `themeVariables`: primaryColor #FFFFFF · primaryBorderColor #2F6F6B · primaryTextColor #1F2A2E · lineColor #5B6468 · secondaryColor #F7F3EF · tertiaryColor #F7F3EF · fontFamily Pretendard · fontSize 14px + CH-3 퍼널 + TRK 캡처 |
| D5·D6 | 지표 12개 표 + CH-8 CPL 막대 + CH-5(D5) 또는 주간 추이 CH-4 확대(D6) |

### 3-14 구현 매핑 (Tailwind v4 `@theme`·`@utility`, 70 우선)

| 대상 | 값 |
| --- | --- |
| `@theme` 추가·변경 | `--container-text: 680px`(DC-01), `--container-page: 1200px`(1120 + 40 × 2, DC-02), `--breakpoint-*: initial` 뒤 `--breakpoint-md: 48rem`·`--breakpoint-lg: 64rem`, `--font-weight-*: initial` 뒤 normal 400·semibold 600·bold 700, `--text-num: 24px`(줄높이 1.3), `--text-xs: 12px`(16px), `--font-mono`, `--ease-standard`·`--ease-exit`, `--animate-pulse`(2s)·`--animate-spin`(800ms) |
| `:root` | `--motion-fast/base/slow/celebrate`, `--bar-h: 64px`, `--z-*` 5개 |
| `@utility` | `h-bar`(3-7-11) · `acc-closed`·`acc-open`(grid-template-rows 0fr·1fr) · `max-h-sheet`(60dvh) · `pb-safe-2`·`pb-safe-4`(현행) |
| check-tokens 추가 규칙 (DQ-13) | 간격 11단계 밖 값(예 `py-7`), `sm:`·`xl:`·`2xl:` 접두, 상태 접두 opacity·토큰 알파(3-2), `rounded-full`이 `data-shape="circle"` 밖, 임의값 `[…]` |

## 4. 다른 정의서와의 접점

### 4-1 접점 표
| 정의서 | 10이 주는 것 | 10이 받는 것 | 충돌 시 |
| --- | --- | --- | --- |
| 95-legal-ops | BDG-1~7·MET·BNR-1·FRM 동의 블록 시각 규격 | 금지 표현·이미지 금지, 라벨 문구, 동의 A1~A4 표시 조건, 토글 2개·기본 denied | 95 우선 |
| 00-product | V1~V7 화면 컴포넌트(CH-1·SUM·MET·ACC jsonld·TRK) | 상호 표기, 가상 병원 동선·고지, "3줄 요약" 라벨, S8 mock 제출 비활성, F4·F5 | 00 우선 |
| 70-engineering | 토큰·`@utility` 이름(3-14), 모션 토큰, 치수 고정, JS 여부 표 | 정적 export 제약, 번들·아이콘 상한, 스크립트 수정 | 70 우선 |
| 40-tracking | 추적 자리 `data-track-*`(3-7-13) | 이벤트 21개·파라미터, TRK 표 문구 | 40 우선 |
| 50-seo-aeo | h1 1개, 접힌 내용 정적 HTML, jsonld 토글 UI·DG-4 | JSON-LD 구조, URL 형식, FAQ 수 | 50 우선 |
| 80-quality | QUALITY 6절 디자인 규칙의 원본, 측정 규칙 R-TXT | 게이트·측정 도구 옵션 | 80 우선(QUALITY "디자인 규칙 원본 = 10") |
| 90-deliverables | 3-13 PDF·GIF·QR·도표 시각 양식 | D1~D8 목록·내용·기한 | 90 우선(내용), 10 우선(시각) |
| 20-content | 글자 수 **물리 상한**(px 폭 계산) | 문구 원문·톤·종결 어미, H2 질문 문구 | 상한은 10, 문구는 20 |
| 60-growth | 소재 시각 규격(3-9) | 소재 문구·캠페인 | 시각은 10 |
| docs/layouts/* | 섹션 유형 S1~S7, 컴포넌트 ID, 첫 화면 배분 | 화면별 배치 | 10 우선(파생물) |
| BENCHMARK | — | 최고값·측정 도구 | 입력 데이터, 목표는 3-12 |

### 4-2 충돌 기록 (T-088 일괄 정리용)
1. **DC-01** — `tokens.css` `--container-text: 640px`(SiteFooter `max-w-text`) ↔ 본문 680px. 10 = 680px.
2. **DC-02** — BENCHMARK A1 "1280 안쪽 1120px" ↔ 코드 `max-w-content` 1120 + `md:px-10` → 안쪽 1040px(SiteHeader·ConsentBanner·SiteFooter). 10 = `max-w-page` 1200 + px-10.
3. **DC-03** — QUALITY 2절·BNR-1 1줄 ≤ 64px ↔ `ConsentBanner.tsx` 375 **실측 284px**(hiring-reviewer r1, 2026-10-25), 1층에 토글 노출, "모두 동의" 채운 배경. 10 = 1층 바 + 2층 시트(DQ-02).
4. **DC-04** — B-08·BAR 64px ↔ `BottomBar.tsx` pt-2 8 + h-14 56 + pb-safe-2 8 + 위 테두리 1 = **73px**, 보조가 주 CTA와 같은 폭(`basis-0 grow`), `globals.css` 오프셋 `spacing * 18` 2곳.
5. **DC-05** — screen-spec 3절 하단 바 3버튼 ↔ B-08 주 CTA 1 + 00 3-1 가상 병원 전화·카톡 0. 10 = 주 1 + 보조 ≤ 2(is_partner만), 보조 라벨 ≤ 5자(DQ-03).
6. **DC-06** — 3-2 투명도 ↔ `SiteHeader.tsx` 62행 `bg-accent-strong hover:opacity-90`(4.08:1), `ConsentBanner` 110행 `bg-brand hover:opacity-90`, `ConsultCta` 46행 `hover:opacity-90`.
7. **DC-07** — 첫 화면 채운 CTA 1 ↔ 헤더 CTA `bg-accent-strong` + 배너 "모두 동의" `bg-brand` → 첫 화면 2~3개.
8. **DC-08** — brand 배경 위 포커스 = surface ↔ `globals.css` `:focus-visible` brand 1종 → ConsultCta 안 1:1.
9. **DC-09** — SVG 글자 렌더 ≥ 12px ↔ `PriceRangeChart.tsx` viewBox 폭 640·축 `fontSize={11}` → 1280 표시도 11.3~11.7px·375는 더 작음, `ProcedureLocationDiagram.tsx` 번호 `fontSize={11}`.
10. **DC-10** — DG-2 일 단위 눈금 ↔ `RecoveryTimeline.tsx` 일 단위 축 0, 320px 분할 0.
11. **DC-11** — BENCHMARK B-40 목표 구성(8번째 = 스켈레톤) ↔ B-46 정적 블록 스켈레톤 0. 10 = 3-7-12 유형표.
12. **DC-12** — QUALITY "워드마크 SVG" ↔ `SiteHeader.tsx` 로고 글자(`SITE.name`).
13. **DC-13** — screen-spec P-03 요약 "가격·소요시간·회복기간·마취 4칸" ↔ BENCHMARK 칩 6개(회복 하한·상한 분리, 마취 없음). 10 = CHP-D 6개(수술 시간·일상 복귀·실밥 제거·붓기 감소·마취·병원 수) + 가격은 CH-1(DQ-04).
14. **DC-14** — screen-spec 아코디언 = FAQ만 ↔ B-44 ≥ 14(T-027 기본값).
15. **DC-15** — QUALITY "n개 교차검증 뱃지" ↔ 95 S2 1건이면 0. BDG-4는 95.
16. **DC-16** — BENCHMARK 6절 P-03 배분 "≤ 678px, 바 72 위(740)" ↔ 3-6 배분표 680 ≤ 684(바 64 + 배너 64). 코드 바 73px면 812 − 73 − 64 = **675** < 678.
17. **DC-17** — BENCHMARK B-44 2-2 "정규식 구간 추정" 문구 ↔ reviewer r4 "원인 미확인". 10은 ACC 위치 규칙으로 셈 고정.
18. **DC-18** — `tokens.css` 모션 토큰 0 ↔ 3-8, 컴포넌트 `transition-colors`(150ms)·`animate-pulse` 기본값.
19. **DC-19** — line 위 ink-muted 글자 금지 ↔ 코드 사용처 0(선제 기록).
20. **DC-20** — R-TXT6 푸터 워드마크 SVG ↔ `SiteFooter.tsx` 25행 글자 워드마크, 푸터 svg 0.
21. **DC-21** — FRM 입력 테두리 ink-muted·배경 surface ↔ `HeaderSearch.tsx` 90행 `border-line`(1.35:1)·`bg-canvas`.
22. **DC-22** — BTN Secondary 테두리 ink-muted ↔ `BottomBar.tsx` 27행·`ConsentBanner.tsx` 98행 `border-line`.
23. **DC-23** — 간격 11단계 ↔ `ConsultCta.tsx` 34행 `py-7`(28px).
24. **DC-24** — 브레이크포인트 md·lg 2개 ↔ `SiteFooter.tsx` 28·32행 `sm:`, `Skeleton.tsx` 25행 `sm:grid-cols-2`.
25. **DC-25** — SKL 루트 `skeleton` 클래스 ↔ `Skeleton.tsx` 클래스에 `skeleton` 0 → bench-measure 114행 셈 0(B-46 측정 불가).
26. **DC-26** — HDR 375 2번째 줄 화면별 ↔ `SiteHeader.tsx` 71행 전 화면 2번째 줄(검색 + GNB 약 100px).
27. **DC-27** — BENCHMARK 2-2 "요약 박스(직답) 0" ↔ hiring-reviewer r1 관찰(2026-10-25) 강남언니 최신 콘텐츠 "세 문장 요약" 3항목·목차 5·각주 3. 3-12 "요약" 행은 관찰값 사용, BENCHMARK 정정은 benchmark lane(DQ-15).
28. **DC-28** — BENCHMARK B-46·6절 "로딩 상태: `/insights`" ↔ 90 원칙 4(`/insights` = metrics.json 빌드 시 정적). 10 = 측정 화면 A-01, `/insights` 스켈레톤 0(DQ-15, E3 후보).
29. **DC-29** — 00 S8·체크리스트 "mock 배포 P-06 제출 disabled + '상담 접수 준비 중'" ↔ spec-content-lead r1 C10 "mock에서도 활성 + 더미 접수번호" ↔ CLAUDE.md M1 "완료까지 클릭". 10 = 00(우선순위 2위) 따름 + 막힘 방지 링크(DQ-09).
30. **DC-30** — 00 F4 "문장당 40~60자" ↔ 3-6 SUM 375 ≤ 7줄(약 20자/줄): 60자 문장 3개 = 9줄 → 첫 화면 684 초과(DQ-07).
31. **DC-31** — 00 F5 FAQ 5~8 ↔ B-44 ≥ 14가 FAQ ≥ 7 전제(DQ-08).
32. **DC-32** — `IMAGES.md` 22행 주제 예("small sparkle"·"abstract profile curve") ↔ 같은 문서 29행 효과 암시 금지·3-9 주제표.
33. **DC-33** — `check-out.mjs` 88~92행 PNG 실패 ↔ 파비콘 180·512 PNG(DQ-11).
34. **DC-34** — B-20 "CLS 0.00" ↔ `app/layout.tsx` 20~22행 FCP 뒤 웹폰트 교체(메트릭 근사 대체 글꼴). 10 = clsMedian ≤ 0.004 정의.
35. **DC-35** — v1·screen-spec 부위 카드 `/procedures?cat=` ↔ 정적 export(쿼리별 HTML 0, 필터 시 CLS). 10 = 앵커 또는 경로형(DQ-14).
36. **DC-36** — BENCHMARK 6절 P-03 비텍스트 구성 예(헤더 메뉴 1·하단 바 아이콘 3) ↔ 10(햄버거 0, P-03 보조 버튼 0) → 3-6 집계 19로 대체.
37. **DC-37** — 90 3-1 R4·BENCHMARK 6절 "AI 답변용 요약" ↔ 00 V4 "3줄 요약"(00 C23 기존). 10 = 00 라벨.
38. **DC-38** — screen-spec 3절 브레드크럼 공통 상단 ↔ 375 P-03 본문 끝(첫 화면 684 예산).

### 4-3 spec-question 후보 (TASKS 등록은 오케스트레이터, 기본값으로 진행)
| # | 질문 | 기본값 | 영향 | 대상 |
| --- | --- | --- | --- | --- |
| DQ-01 | P-03 본문 섹션 접기 + 이벤트 | 본문 5개 기본 펼침, 이벤트 추가 0 | B-44 | 기존 T-027 |
| DQ-02 | 95 "배너 토글 2개"를 1층 바 + 2층 시트로 | 1층 ≤ 64px, 토글은 [설정] 뒤 시트 | 배너 64px | 95 |
| DQ-03 | 하단 바 보조 라벨 ≤ 5자("카카오톡") | 88px 안 14px 5자 | screen-spec 3절 | 20·screen-spec |
| DQ-04 | P-03 요약 4칸 → CHP-D 6개 + CH-1 | CHP-D 6개(마취 포함) | B-03 | screen-spec |
| DQ-05 | QUALITY 6절을 10 링크 1줄로 | 10 승인 시점부터 10이 원본 | 규칙 중복 | 80 |
| DQ-06 | 로고 최종 안 | a안 기준 | 헤더·OG·파비콘 | 사람(T-112) |
| DQ-07 | 3줄 요약 문장 길이: 375 첫 화면 ≤ 7줄 → 문장 2개 ≤ 42자 + 1개 ≤ 60자(합 ≤ 147자) | 이 상한으로 진행 | DC-30, B-03·B-05 | 00·20 |
| DQ-08 | F5 FAQ 하한 5 → 7 | 7~8 | B-44 | 00 |
| DQ-09 | mock 배포 P-06 제출: 비활성(00 S8) vs 활성 + 더미 접수번호(content C10) | 00대로 비활성 + "시술 가이드 보기" 링크 | M1 흐름 클릭 | 00 |
| DQ-10 | 생성 일러스트 "AI 생성" 표시 법적 의무 | 단독 일러스트 캡션 + 푸터 1줄 | 3-9 | 95 |
| DQ-11 | 파비콘 PNG 2개 check-out 예외, 미선택 로고 `design/brand/` 이동 + `out/brand` 검사, lucide 아이콘 수·HTML 크기 상한 | 예외 2개, 이동, 상한은 70이 정함 | 3-1·3-7-0 | 70 |
| DQ-12 | bench-measure `--tail window`(마지막 창)·`--gaps`(윗변 간격), check-density 실행 불가 → 판정 도구 = `--rule bench` 하나 | 결정 전 R-TXT6 창 기준·Playwright 보조 | R-TXT1·6 | 80 |
| DQ-13 | check-tokens 규칙 추가(3-14 목록) | 추가 | 3-2·3-4 | 70 |
| DQ-14 | 부위 카드 URL `/procedures/c/{cat}/` vs `/procedures/#cat-{id}` | 앵커형(새 HTML 0) | CRD-A | 50 |
| DQ-15 | BENCHMARK B-46 측정 화면 A-01 + 7-2 E3, 2-2 요약 박스 값 정정 | 3-12 값으로 진행 | B-46·요약 행 | benchmark lane |
| DQ-16 | 추적 속성 이름 `data-track-*` 7종 | 3-7-13 | GTM 트리거 | 40 |
| DQ-17 | 쿠키 2층 토글에 업체명(Google Analytics 4·Meta 픽셀·네이버) 표기 | 표기 | BNR-1 | 95 |
| DQ-18 | noindex 페이지(미완본 P-03)의 jsonld 토글 표시 | 표시(실제 출력 JSON-LD 그대로) | B-27 | 50 |

## 5. 검수 체크리스트

리뷰어가 배포 URL(또는 `pnpm dev`)을 Playwright로 360×800·375×812·1280×800에서 열어 직접 센다.
- [ ] P0 전 화면 + `/insights` + 404에서 `bench-measure.mjs --rule bench --widths 375,1280 --min 2` 종료 코드 0(마지막 부분 구간 미달은 DQ-12 결정 전 "부분 구간 n px" 주석 시 비차단), 375 0개 구간 0(B-09)
- [ ] 첫 비텍스트 윗변 y ≤ 320(1280 ≤ 380), 인접 윗변 간격 375 ≤ 320·1280 ≤ 380 초과 0곳, 마지막 창 비텍스트 ≥ 2(R-TXT1·6)
- [ ] P-01 구간 최소 375 ≥ 4·1280 ≥ 4(B-10·B-13), P-05·P-06 375 ≥ 2(B-12)
- [ ] 모든 H2 섹션에 아이콘 24 + 비주얼 블록 ≥ 1, S6 연속 0(R-TXT3·5)
- [ ] P-03 375: `data-fold="required"` 요소 하단 y ≤ 684, 순서 H1 → MET 묶음 → CH-1 → CHP-D → SUM, 헤더 2번째 줄 0, SUM 목록 ≤ 7줄
- [ ] P-03 첫 화면 비텍스트 375 ≥ 18·1280 ≥ 22(B-05), 실데이터 숫자 ≥ 13(B-03), P-01 이미지 카드 375 ≥ 6·1280 ≥ 8(B-02)
- [ ] 첫 화면마다 채운 배경 CTA 정확히 1(`first.filledCta`), 헤더 CTA·배너 버튼·CPY 외곽선
- [ ] 모든 카드 `<a href data-card>` 1개·안쪽 a·button 0·내부 새 탭 0, `check-links.mjs` 0(B-24)
- [ ] 쿠키 배너 1층 360·375·390에서 1줄·≤ 64px, 문구 ≤ 8자, [거부]·[동의] 같은 스타일, 2층 시트 스위치 2개 + 업체명, 푸터 "쿠키 설정" `<button>` 1클릭 재오픈
- [ ] P-03·P-05 375 하단 바 높이 = 64px(테두리 포함, 안전 영역 제외), 주 CTA 1, 가상 병원 보조 0, 스크롤 끝 푸터 가림 0px
- [ ] 360px에서 가로 스크롤 0, 잘린 글자 0(화면마다 캡처 1)
- [ ] `a`·`button`·입력 높이 ≥ 44(인라인 링크·각주 24 예외), 44 미만 타깃 이웃 간격 ≥ 8
- [ ] Tab 순회 시 2px 링이 모든 요소에서 보임(brand 블록 안 흰 링)
- [ ] `check-tokens.mjs` 0, 3-2 금지 조합 0, 상태 접두 opacity·토큰 알파 0
- [ ] 375 h1 28px·본문 16/27.2·1280 h1 40px·입력 16px, HTML 12px 미만 0, SVG `<text>` 렌더(`fontSize × getScreenCTM().a`) ≥ 12 at 360·375·1280
- [ ] P-03 `ax=` 두 번째 수 ≥ 14(B-44), 본문 섹션 5개 펼침, 접힌 FAQ 답변 `out/` HTML에 존재, `hidden="until-found"` 출력, `<header>` 요소 0, 아코디언 밖 `aria-expanded` 0(헤더 검색 제외)
- [ ] FAQ 질문 16/600·"Q."·번호 0, jsonld 토글 `<h3>` + DG-4 + CODE(최대 320px 안쪽 스크롤) + 리치 결과 테스트 링크 + 검사 오류 0 줄
- [ ] SUM: 라벨 "3줄 요약", 3항목·번호 원, CPY 복사 결과 = 문장 3 + URL + 수정일, "같은 문장" 칩 → jsonld 토글 열림
- [ ] 버튼·카드·칩·아코디언·입력 hover(1280)·active·focus·disabled가 3-7 표와 같음(1280 캡처 4 + 375 캡처 2), 상태 전환 시 크기 변화 0px
- [ ] P-06: 진행 "1/2"·"2/2" + 4px 바, 키보드 입력 ≤ 2, 연락 시간 기본 1, 동의 A1·A2·A4 개별 표시(제휴 ≥ 1이면 A3)·기본 체크 0·"필수 동의 전체"가 A4 미포함·A2 위 별도 문구, A4만 해제 상태로 제출 가능
- [ ] P-06 키 없는 배포: 제출 버튼 disabled + "상담 접수 준비 중" + "시술 가이드 보기" 링크, 화면에 "mock"·"테스트" 0
- [ ] P-03 CH-1 + 캡션(정상 또는 "병원 공개 가격 조사 중(기한 …)")(B-31·B-42), DG-2 일 단위 눈금 ≥ 3(B-43), PRG 1(B-41)
- [ ] 차트 계열 ≤ 3 + 선 모양 구분 + 직접 라벨, 상호작용 차트 `role="group"`·`g[role=button][tabindex=0]`, axe 0
- [ ] P-03 인터랙션 유형 375 ≥ 8·1280 ≥ 8(3-7-12 표대로 하나씩 조작)
- [ ] 모션 끔: 카드 이동 0px, P-07 체크 완성 즉시, 스켈레톤 정지. 로드 직후 자동 재생은 A-01 스켈레톤·P-07 체크만
- [ ] A-01 로드 450ms 시점 `[class*=skeleton]` ≥ 2(B-46), `/insights`·P-01·P-03·P-05 스켈레톤 0, clsMedian ≤ 0.004(B-20)
- [ ] 404 h1 "페이지를 찾을 수 없습니다" + 일러스트 + 링크 ≥ 2 + 검색 입력(B-45), 빈 상태 다른 시술 10개, "추천" 글자 0
- [ ] 생성 일러스트·플레이스홀더: 사람·눈동자·속눈썹·눈 윤곽 2개 이상·글자(플레이스홀더 시술명 제외)·화살표·반짝임 0(Read 열람), 단독 일러스트 "AI 생성" 캡션, 첫 화면 래스터 규칙(P-03·05·06·07 ≤ 1, P-01 합 ≤ 120KB), LCP 요소 = H1 또는 P
- [ ] 3-11 정규식 전부 0(별 아이콘·"%"·`\bTOP\b`·이모지·더미 표기), "리치 결과 테스트"는 통과
- [ ] 아이콘 전부 lucide 선 아이콘 또는 `components/icons/`, 섹션·칩 24px, 수술 도구 0
- [ ] 제출물 PDF 1부 열람: A4 1쪽·여백 16mm·본문 10.5pt·머리말 워드마크·꼬리말 URL·쪽·생성일, HDR·BAR·배너 인쇄 0, D8 QR ≥ 25mm

## 6. 변경 이력
- 2026-10-25 v1 (T-081): 첫 작성. 원칙 5, 규칙 12절, 컴포넌트 13종 × 6상태, BENCHMARK 대조 37행(실제 38행), 충돌 DC-01~19, 질문 DQ-01~06.
- 2026-10-25 v2 완본 (T-081 r1 반영: content-lead 32건·tech-lead 34건·hiring-reviewer 28건, 반영표 = 로그 3절): P-03 첫 화면 375·1280 배분표(합 680·690)·B-05 집계(19·23)·B-03 집계·화면별 필수 요소, HDR 화면별 2번째 줄, 컴포넌트 18종(SUM·TRK·CODE·BRD·FN 추가)·CH-5~8·DG-4·5·BDG-7, B-40 유형표, 추적 자리, 동의 블록 95 기준(A1·A2·A4 항상 + A3 조건부, 필수 동의 전체 A4 제외), mock 제출 00 S8 기준, BAR 64px border-box·라벨 상한 3단, 쿠키 배너 ≤ 8자·360 이하 2줄, R-TXT1 첫 요소·R-TXT6 마지막 창, 투명도 규칙 정밀화, 이모지 정규식, 차트 계열 ≤ 3·SVG role, 터치 간격 WCAG 2.5.8, 최소 폭 360, 브레이크포인트 2개, 일러스트 접미사·주제 교체, 광고 소재 규격, 3-13 제출물 양식, 3-14 구현 매핑, BENCHMARK 대조 39행(요약 행 추가, B-46 A-01, B-20 정의). 충돌 DC-20~38, 질문 DQ-07~18.
