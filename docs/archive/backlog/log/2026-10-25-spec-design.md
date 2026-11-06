# 2026-10-25 spec 10-design (T-081)

## 1. 초안
- owner spec-designer → `docs/specs/10-design.md` v1. lint-spec 0 오류(오케스트레이터 실행, exit 0).
- 충돌 기록 DC-01~19, spec-question 후보 DQ-01~06.

## 2. 지적 목록 (r1, 병렬 3명)
판정: spec-content-lead 지적 32건(C12·M12·A8), spec-tech-lead 지적 49건(C12·M8·A14), hiring-reviewer **request-changes**(H-C10·H-M10·H-A8, 채용 아니오).
비고: hiring-reviewer가 unni.app 2페이지를 열람함 — T-026 기본값("추가 열람 0")과 어긋남. 다음부터 경쟁사 재열람은 benchmark lane만.

### 2-1. spec-content-lead (20-content 시각)
- C1 P-03 375 첫 화면 필수 요소 합 약 855~935px > 684. 배분표 추가(헤더56/H1≤73/요약≤200/고지≤69/CHP-D120/CH-1≤130), 요약 박스 14px/22.4, 헤더 2행이 검색44+GNB44인지 합 44인지 명시.
- C2 하단 바 주 CTA "≤10자" — 보조 0개 ≤16자, 1개 ≤10자, 2개 ≤4자. "자=공백 포함". M1(가상 병원)은 보조 0개.
- C3 쿠키 배너 문구 ≤11자는 360px에서 2줄 → ≤8자(예 "통계·광고 쿠키"), 360 폭 검증 추가.
- C4 FAQ 질문 폰트 3-3(h3 20px) vs 3-7-10(16/600) 불일치, S4 높이 "56px×n" → 2줄 86px×7=602. 16/600 통일, 질문 접두 "Q."·번호 금지(JSON-LD 문자열 동일).
- C5 CHP-D "회복기간 하한·상한"과 "일상 복귀"가 공존 → 칩 6개 라벨 확정(수술 시간/일상 복귀(=회복기간)/실밥 제거/붓기 감소/마취/병원 수), "회복기간 하한·상한" 문구 삭제.
- C6 MET 순서 95 S0("의료 자문 검토 전 · 출처 n건 · 최종 수정 {updatedAt}")로, 375 1줄 불가 → 아이콘 제거 또는 2줄+45px 예산.
- C7 371·646행 "추천" → "다른 시술 10개", 빈 상태 제목 "시술 가이드 전체 보기", `\bTOP\b`·`\bBEST\b` 단어 경계.
- C8 `\p{Extended_Pictographic}`가 ©®™ 포함 → 예외.
- C9 일러스트 접미사 "body parts" 금지 vs 주제 eye outline 모순 + 효과 암시(upward arrow, sparkle, smooth surface) IMAGES 29행 위반 → 접미사 교체("Do not draw: eyelashes, irises, pupils, two eyes together, closed face outlines, letters, numbers, logos, people, skin texture, medical instruments, needles, blood." + "single abstract line contour only"), 주제 수정, alt 결과 서술 0.
- C10 mock 모드에서 제출 버튼 disabled → M1 흐름 막힘. mock에서도 활성 + 더미 접수번호로 P-07. "준비 중"·"mock" 노출 금지.
- C11 전체 동의가 95 A2 민감정보 별도 동의와 충돌 → 전체 동의는 A1~A3만, A4 별도, 4개 체크박스 항상 표시, A2 위 고정 문구 1줄.
- C12 광고 소재에 신체 윤곽 주제 재사용 → 소재 전용 Subject = 기하 도형만.
- M1 AEO 3줄 요약 박스 컴포넌트(SUM) 없음: `<ol>` 3항목, 14/22.4, 라벨 "3줄 요약", surface+1px line, 16px 여백, 복사 대상(3문장+출처 URL·수정일), 높이 ≤200.
- M2 BDG-5/MET S0·S4 변형 2열.
- M3 오류 문구 사전: "원인+해결" 1문장 ≤40자 합쇼체, 6종 예시(물리 상한만 10, 원문은 20).
- M4 404 h1 "페이지를 찾을 수 없습니다" + 안내, 빈 상태 검색어 에코 ≤12자·95 금지어면 에코 안 함.
- M5 가격 표기 "n만~m만 원", CH-1 라벨 2줄(이름+값) 합 ≤300px.
- M6 범위 "3~7일", DG-2 일 단위 고정, 14일 초과 "28일(약 4주)", 카드 칩 아이콘 제외.
- M7 미달 문구 00 3-8-4 "병원 공개 가격 조사 중(기한 YYYY-MM-DD)", 캡션 정상/미달 2종, CRD-P 375 ≤260px + 조사일 줄.
- M8 CH-2 가상 병원 "(예시 데이터)" 병기, 라벨 줄 분리, 병원명 ≤10자 말줄임.
- M9 BDG-7 "예시 리포트", BDG-3 옆 심의번호 슬롯, 수수료 고지 줄.
- M10 H1 ≤24자, H2 ≤26자, 목차 `toc_label` ≤8자, OG 제목 ≤36자.
- M11 H2/FAQ 첫 문장(직답) 16/600 서식.
- M12 카드 안 썸네일 alt="" (장식), 링크 이름 = 시술명+가격 범위+일상 복귀.
- A1 "자 = 공백·문장부호 포함 글자 수" 정의.
- A2 10은 물리 상한(px·자)만, 문구 원본은 20 — 4-1에 명기.
- A3 본문 H2 5개 확정(누가/비용/회복/부작용/과정 질문형), FAQ는 별개, FAQ ≥7(00 F5 5~8 → 7~8 spec-question 후보).
- A4 버튼·상태 라벨 명사형 ≤10자, 안내·오류 문장 합쇼체 ≤40자, 대시(—) 금지(00 원문 인용 예외).
- A5 일러스트 합격: 눈동자·홍채·속눈썹·코구멍·입 0, 눈 윤곽 2개 이상 0, 닫힌 얼굴형 0, 코 alt "옆모습" 제거.
- A6 플레이스홀더 시술명 SVG text ≥12px, 카드 안 aria-hidden, 글자 예외는 플레이스홀더에만.
- A7 문자열 검출 대상 = `out/**/*.html` 렌더 텍스트 + aria-label·alt, /terms·/privacy 부정 문맥 허용 목록.
- A8 부작용 섹션 아이콘 `ShieldAlert`, `TriangleAlert`는 BNR-2 전용, S0 `FileSearch`·S4 `BadgeCheck`.

### 2-2. spec-tech-lead (70-engineering 시각)
검증: 대비비 13쌍 재계산 일치, lucide 아이콘 34개 1.61.0에 존재, bench-measure 인용 정확.
- C1 BAR 64px = 8+48+8+테두리1 = 65 → `h-16` border-box 또는 테두리 제거, `@utility h-bar`(calc+safe-area), 오프셋 `--bar-h:64px`.
- C2 CLS 0.00 vs 웹폰트 교체(layout.tsx:20-22) → B-20 = bench-measure clsMedian ≤0.004 + 폰트 외 shift 0 + Lighthouse 모바일 ≤0.05.
- C3 "첫 화면 래스터 ≤1장, LCP=H1" vs P-01 CRD-P 썸네일 → 래스터 ≤1은 P-03·05·06·07만, P-01 썸네일 600w ≤30KB eager fetchpriority=low, 첫 화면 이미지 합 ≤120KB, 체크리스트 "LCP el = H1 또는 P".
- C4 이모지 정규식 © 오탐(lib/site.ts:17) → `\p{Emoji_Presentation}|\p{Extended_Pictographic}️`.
- C5 `opacity-` 전면 금지 vs 문서 내 페이드 4곳 → `(hover|focus|active|group-hover):opacity-\d+`와 토큰색 `/\d+`만 금지, check-tokens 추가.
- C6 SVG role=img 안 tabindex → 상호작용 차트 `role="group"` + `<g role="button" tabindex=0 aria-label>`, CH-4만 img, axe 0.
- C7 터치 간격 8px vs 375 헤더 메뉴 → WCAG 2.5.8: 44 이상 타깃은 맞닿음 허용(겹침 0), 44 미만만 ≥8px.
- C8 배너 1줄 375 여유 −8~+3px → 배너 버튼 `px-3 min-w-14`(56), 문구 ≤9자, 360·375·390 폭 높이 ≤64·문구 1줄 검증.
- C9 하단 바 보조 2개면 라벨 ≤6자·좌우 16, 0개면 ≤10자, 바 좌우 여백 명시.
- C10 파비콘 PNG가 check-out(88-92) 실패 → 32 = app/icon.svg, 180·512 PNG 예외(spec-question 70).
- C11 `/procedures?cat=` 정적 export·CLS 충돌 → `/procedures/c/{cat}/` 또는 `#cat-{id}` 앵커, URL 최종은 50.
- C12 R-TXT 규칙 vs bench-measure 마지막 부분 구간 → "첫 비텍스트 윗변 y ≤320(1280 ≤380)" 추가, 스크립트 `--tail window` 제안.
- M1 Tailwind v4 `@theme` 매핑: `--container-text:680px`, `--container-page:1200px`(1120+40×2), breakpoint 초기화 후 md 48rem·lg 64rem, font-weight·leading 초기화, ease·duration·animate 토큰, 간격 11단계 check-tokens 규칙(현 위반 ConsultCta.tsx:34 py-7), rounded-full 검출.
- M2 임의값 금지라 `@utility` 이름: acc-closed·acc-open·max-h-sheet(60dvh)·h-bar.
- M3 측정 가능화: 스켈레톤 루트 `class="skeleton"` 필수, 카드 `<a>` 직속 자식 `data-card`·안쪽 a/button 0, `--gaps` 옵션, `data-fold` 하단 ≤684 Playwright, SVG 글자 `fontSize×getScreenCTM().a ≥12`, 인라인 링크·체크박스 label 예외 정의, 밀도 판정 = bench-measure `--rule bench` 하나(check-density는 playwright 미설치로 실행 불가 → 80 spec-question).
- M4 DC 추가 후보: SiteFooter 글자 워드마크·svg 0(R-TXT6), SiteFooter max-w-content px-10(1040), max-w-text 640, HeaderSearch border-line 입력 테두리, BottomBar/ConsentBanner 보조 버튼 border-line, SiteHeader gap 4/0, ConsultCta py-7, SiteFooter sm:, ConsentBanner 스위치 rounded-lg.
- M5 컴포넌트별 클라이언트 JS 여부(PRG `animation-timeline`, FNH `:target` = JS 0; 아코디언·TOC·툴팁·복사·`<dialog>` 시트·폼 = JS). lucide `"use client"` → 아이콘 수/HTML 크기 상한은 70.
- M6 `images.unoptimized` → srcSet/sizes 마크업 규칙, 300×200 ≤12KB, 첫 화면 fetchpriority=high 0.
- M7 최소 지원 폭 360px, 가로 스크롤 0, SVG viewBox 폭 ≤320, 360 캡처.
- M8 아코디언 외 aria-expanded 0(시트는 aria-haspopup="dialog"), `data-accordion` 값에 "accordion" 포함(예 `accordion-faq`).
- A1 브레이크포인트 2개(md 768·lg 1024), 1024~1279 max-w-page+px-10, 768~1023 목차 가로 칩.
- A2 3px·6px 두께 예외 목록 또는 4/8.
- A3 산술: 부위 카드 1280 = 166.7px, 칩 폭 106.3, 칩 높이 57.6 → 줄높이 지정.
- A4 아코디언 구조: `div.acc-closed > div.overflow-hidden > div[hidden=until-found]`, beforematch, React 19 출력 테스트.
- A5 FAQ 폰트 불일치(=content C4).
- A6 "위치·크기는 transform만, 색·그림자·dashoffset 허용".
- A7 테두리 1px 고정 + `ring-1 ring-inset`.
- A8 이동 클래스 `motion-safe:` 접두.
- A9 금지 검출: `svg.lucide-star`, "원·만 원 앞뒤 40자 안의 %", `테스트 (병원|데이터|계정)`, setInterval 검사 방법.
- A10 SVG 글자 = fontSize ≥12 + viewBox 폭 ≤ 최소 표시 폭(PriceRangeChart viewBox 640 → 1280도 11.3~11.7px).
- A11 DC 사실 정정: DC-03 ≈307px(실측값으로), DC-04 73px, DC-09 1280도 미달, DC-16 675px.
- A12 키보드 열림 판정 `visualViewport.height < innerHeight×0.75`, 쿠키 설정 재오픈은 `<button>`.
- A13 로고 미선택 6개 `design/brand/`로 이동 + check-out 검사.
- A14 B-15~19 측정 도구 열(bench-measure vs Lighthouse).

### 2-3. hiring-reviewer r1 — request-changes (채용 아니오)
실측(2026-10-25): 배포 메인 375 링크 2·SVG 0·이미지 0, `/procedures/쌍꺼풀-수술/` 404(Next 기본 영문), 쿠키 배너 실측 284px. 강남언니 최신 콘텐츠에 "세 문장 요약" H4+3항목·목차 5·각주 3·AI 일러스트("AI로 생성" 캡션) 존재 → BENCHMARK "요약 박스 0" 낡음.
- (c) 아니오 사유: ① 공고 요건 5개 중 4개(요약 박스, P-07 투명성 블록, /insights 차트 4종, 메타 소재 템플릿) 컴포넌트 ID 없음 ② D8 커버·D1~D6 A4 PDF 디자인 없음(인쇄 범위 밖 선언) ③ 자기 숫자 불일치(첫 화면 ~912px, B-05 계산상 12~14, /insights 스켈레톤 vs 정적, '테스트' 금지 vs 리치 결과 테스트) ④ 경쟁사 최신판 미반영.
- H-C1 첫 화면 높이 배분표(375·1280) — (가) P-03 HDR 둘째 줄 0·검색 아이콘 확장 또는 (나) 요약 줄 수 상한, 합계 ≤684 숫자로 증명.
- H-C2 B-05 요소 목록·크기 재계산, 부족분은 CPY 24px·출처 CHP-L 아이콘 24·요약 머리 아이콘 24·DG-2 미니 타임라인 중 선택.
- H-C3 SKL `/insights` 비동기 아님(90 원칙 4 정적) → B-46 측정 화면 A-01·P-06 제출 대기, /insights 스켈레톤 0, BENCHMARK 7-2 예외 E3 기록.
- H-C4 '테스트' 금지 → 더미 표기 패턴만, "리치 결과 테스트"·"A/B 테스트" 허용.
- H-C5 3-13 "제출물 A4 양식" 신설(210×297mm, 여백 16mm, 본문 10.5pt·제목 18pt, 머리말 워드마크, 꼬리말 URL·쪽·생성일, @media print에서 HDR·BAR·BNR-1·PRG 숨김).
- H-C6 차트 계열 ≤3(brand·ink-muted·accent) + 선 모양 + 직접 라벨, 4계열 이상 small multiples.
- H-C7 BNR-1 1줄은 375 이상 100%만, CSS 폭 360 미만(200% 확대 포함) 2줄 ≤104px, 개인정보처리방침 링크 위치.
- H-C8 3-12 "요약 블록" 행 추가(최고값 강남언니 3항목 목록·복사 0·3중 일치 0), BENCHMARK 정정은 4-2 기록.
- H-C9 DC-03 실측 284px(측정일 2026-10-25).
- H-C10 JSON-LD 토글 트리거 `<h3>` 고정, 패널 = @type 노드 다이어그램(DG-4) + 코드 블록 max-height 320 안쪽 스크롤.
- H-M1 AEO 요약 박스(ID·라벨·배경·머리 아이콘 24·CPY 위치·"FAQ 1번·구조화 데이터와 같은 문장" 칩(jsonld 토글로 점프)·llms.txt 링크·높이 상한).
- H-M2 JSON-LD 패널 규격: 코드 글꼴, 문법 색(키 brand·문자열 ink·숫자 accent-strong), pre-wrap, 최대 높이, 복사, "리치 결과 테스트" 외부 링크(새 탭), @type 칩, 검사기 오류 0 표시.
- H-M3 P-07 투명성 블록: generate_lead, 파라미터 표(lead_id 마스킹, value·currency), GTM 태그명, 메타 Lead event_id, 동의 상태 실시간, dataLayer.push 코드 블록, `/insights#tracking` 같은 컴포넌트.
- H-M4 /insights 차트 CH-5 채널×시술 매트릭스(점 크기), CH-6 키워드 순위(구글·네이버 기울기, 20개), CH-7 AEO 인용률 3선, CH-8 CPL 막대(표본 부족 표시), 섹션 캡션(기간·출처·갱신일), BNR-2 "운영 지표(채용 심사용)", 데이터 0 상태(점선 트랙 + "데이터 수집 중 — 시작일·예정일").
- H-M5 D8 커버 그리드(숫자 6×3요소, 경쟁 표 7행), D1 GIF 규칙(배너 [거부] 먼저, 커서 강조, 7프레임, ≤5MB), QR(ink on surface, 여백 4모듈, 로고 0), D3 3중 일치 다이어그램, D4 mermaid themeVariables 토큰 연결, D5·D6 표+차트.
- H-M6 메타 소재 1080×1080·1080×1350·1080×1920, 9:16 안전 영역(위 14%·아래 35% 글자 0), 워드마크 위치, 95 금지, P-12 메시지 일치(같은 일러스트·H1=헤드라인·첫 화면 폼 시작).
- H-M7 3-7 각 표에 "추적 자리" 열(BTN data-track-cta+위치, CRD data-track-select, CPY, BNR-1, CH 툴팁). 이벤트 이름은 40.
- H-M8 브레드크럼 컴포넌트(44, ChevronRight 16, 375 중간 생략, 홈 아이콘 크기).
- H-M9 "AI 생성 일러스트" 캡션 14px ink-muted, 법적 의무는 95 spec-question.
- H-M10 각주·참고문헌 규격(위첨자 ≥12px, 탭 영역, 기관·연도·DOI 칩, BDG-4 위치).
- H-A1 4px 배수가 SVG 내부에도 적용되는지(PRG 3·미니 바 6·CH-2 10).
- H-A2 숫자 강조 24px vs CH-1 14/700 → `text-num` 단계.
- H-A3 S7 화면별 "필수 요소" 목록(P-01·03·05·06·12).
- H-A4 "추천" 금지 vs "추천 카드" → "다른 시술 가이드".
- H-A5 noindex 페이지 JSON-LD 토글 여부, R-TXT6 "마지막 구간" 기준.
- H-A6 BNR-1 2층 토글 라벨 업체명(Google Analytics 4·Meta 픽셀) 포함 여부.
- H-A7 B-40 "스크롤 강조"·"TOC 칩" 별개 유형인지, 유형별 트리거·결과 1줄.
- H-A8 3-12 행 수 38(37 아님), B-28~30·B-32 제외 사유.

## 3. 반영 표
owner spec-designer, 2026-10-25. 대상 `docs/specs/10-design.md` v2 완본(제목 "완본" → 120줄 예외). 다른 문서 수정 0, 경쟁사 재열람 0(hiring r1 관찰값만 인용), git·TASKS 조작 0.
집계: 지적 94건(content 32 + tech 34 + hiring 28; 2절 머리의 "tech 49건"은 목록상 C12·M8·A14 = 34건) → **반영 90 · 부분 반영 + 사유 4 · 미반영 0**. 차단(C·H-C) 34건 전부 반영(CL-C10은 00 S8 기준으로 변형 반영).
ID 접두: CL = spec-content-lead, TL = spec-tech-lead, H = hiring-reviewer.

| 지적 ID | 반영/사유 | 10-design 절·행 |
| --- | --- | --- |
| CL-C1 | 반영: P-03 375 배분표(합 680 ≤ 684), 헤더 1줄 56·2번째 줄 0, SUM 14/22.4 ≤ 7줄, 1280 배분표(690 ≤ 736) | 3-6 "P-03 첫 화면 배분" 2표, 3-7-12 HDR |
| CL-C2 | 반영: 주 CTA 보조 0개 ≤ 16자·1개 ≤ 10자·2개 ≤ 6자(px 계산), 자 = 공백 포함, P-03·가상 병원 보조 0 | 3-7-11 주 CTA 라벨·구성, 머리말 "자" 정의 |
| CL-C3 | 반영: 375 문구 ≤ 8자, 360·375·390 검증, 계산식 | 3-7-7 BNR-1 1층·검증 폭, 5절 |
| CL-C4 | 반영: FAQ 질문 `<h3>` 태그 + 16/600, S4 1줄 59·2줄 86 × 7 = 602, "Q."·번호 0 | 3-3 base 행, 3-6 S4, 3-7-10 크기 |
| CL-C5 | 반영: CHP-D 6 라벨 확정(마취·병원 수 포함), "회복기간 하한·상한" 삭제 | 3-7-3 "CHP-D 6개 라벨", 3-10 표 |
| CL-C6 | 반영: 95 S0 순서 고정, 375 2줄 45px + 아이콘 1, 1280 1줄 아이콘 3 | 3-7-3 MET 표, 3-6 배분 5행 |
| CL-C7 | 반영: "다른 시술 10개"·"시술 가이드 전체 보기", `\bTOP\b`·`\bBEST\b` | 3-7-9 행동, 3-11 #5 |
| CL-C8 | 반영: 이모지 정규식 ©®™ 제외 | 3-11 #11 아래 줄 |
| CL-C9 | 반영: 접미사 교체("Single abstract line contour only" + 금지 목록), 주제 10개 효과 암시 제거, alt 결과 서술 0 | 3-9 프롬프트·주제표, DC-32 |
| CL-C10 | 반영(변형): 00 S8·체크리스트(우선순위 2위)가 "mock 배포 제출 disabled + '상담 접수 준비 중'"을 정함 → 비활성 유지 + 막힘 방지 "시술 가이드 보기" 링크, 화면 "mock"·"테스트" 0. 활성화 요구는 DQ-09 | 3-7-6 상태 disabled (b), DC-29, DQ-09 |
| CL-C11 | 반영(95 기준): A1·A2·A4 항상 개별 표시 + A3 제휴 ≥ 1일 때만, "필수 동의 전체" = A1~A3만(A4 제외), A2 위 고정 1줄, 기본 체크 0 | 3-7-6 동의 블록, 5절 P-06 |
| CL-C12 | 반영: 소재 Subject = 기하 도형만, 신체 윤곽 재사용 0 | 3-9 메타 광고 소재 주제 |
| CL-M1 | 반영: SUM 컴포넌트(`<ol>` 3항목, 14/22.4, 라벨, surface + line, 복사 대상, 높이 375 ≤ 277·1280 ≤ 218) | 3-7-12 SUM |
| CL-M2 | 반영: MET S0·S4 2열 표, BDG-5 아이콘 S0 `FileSearch`·S4 `BadgeCheck` | 3-7-3 BDG-5·MET 표 |
| CL-M3 | 반영: 오류 문장 형식(1문장 ≤ 40자 합쇼체 원인 + 해결) + 예 6개, 원문은 20 | 3-7-6 오류 문장 행, 3-3 상한표 |
| CL-M4 | 반영: 404 h1 문자열, 검색어 에코 ≤ 12자·금지어면 에코 0 | 3-7-9 |
| CL-M5 | 반영: "n만~m만 원", CH-1 라벨 2줄(이름 13 + 값 14/700), 375 라벨 1개 ≤ 96·합 ≤ 300px | 3-7-3 CHP-D 값 표기, 3-7-4 CH-1 |
| CL-M6 | 반영: 범위 "3~7일", DG-2 일 단위, 14일 초과 "28일(약 4주)", 카드 회복 줄 아이콘 0 | 3-7-3, 3-7-5 DG-2, 3-7-2 CRD-P |
| CL-M7 | 반영: 미달 문구, CH-1 캡션 정상·미달 2종, CRD-P 375 ≤ 260(합 258) + 조사일 줄 | 3-7-4 CH-1, 3-7-2 CRD-P |
| CL-M8 | 반영: CH-2 "(예시 데이터)" 별도 줄, 병원명 ≤ 10자 말줄임 | 3-7-4 CH-2, 3-7-2 CRD-C |
| CL-M9 | 반영: BDG-7 "예시 리포트", BDG-3 옆 심의번호 슬롯, 제휴 링크 수수료 문장 줄 | 3-7-3 BDG-3·BDG-7 |
| CL-M10 | 반영: H1 ≤ 24자(P-03 ≤ 18자), H2 ≤ 26자, `toc_label` ≤ 8자, OG ≤ 36자 | 3-3 글자 수 물리 상한, 3-1 OG |
| CL-M11 | 반영: H2·FAQ 첫 문장(직답) 16/600 | 3-3 아래 줄 |
| CL-M12 | 반영: 카드 썸네일 `alt=""`, 링크 이름 = 시술명 + 가격 + 일상 복귀 | 3-7-2 공통, 3-5 이미지 대체 |
| CL-A1 | 반영: 자 = 공백·문장부호 포함 | 머리말 |
| CL-A2 | 반영: 10의 글자 수 = 물리 상한, 원문은 20 | 머리말, 4-1 20-content 행 |
| CL-A3 | 반영: 본문 H2 5개 유형·아이콘 확정(문구 원문 20), FAQ 별개, FAQ 하한 7 → DQ-08 | 3-6 "P-03 본문 H2 5개", DC-31 |
| CL-A4 | 반영: 라벨 명사형 ≤ 10자, 문장 합쇼체 ≤ 40자, 대시 0(00·90·95 원문 예외) | 3-3 상한표 |
| CL-A5 | 반영: 통과 7조건(눈동자·속눈썹·눈 윤곽 2개·닫힌 얼굴형 0), 코 alt "옆모습" 삭제 | 3-9 후보·선택, 주제표 |
| CL-A6 | 반영: 플레이스홀더 SVG 글자 ≥ 12px, 카드 안 `aria-hidden`, 글자 허용 = 플레이스홀더만 | 3-9 키 없음 |
| CL-A7 | 반영: 검출 대상 = 렌더 텍스트 + aria-label·alt·title, /terms·/privacy 부정 문맥 허용 목록 | 3-11 머리 문단 |
| CL-A8 | 반영: 부작용 `ShieldAlert`, `TriangleAlert` = BNR-2 전용, S0·S4 아이콘 | 3-10 표, 3-6 H2 5개 |
| TL-C1 | 반영: `h-bar` border-box 64 = 테두리 포함, 버튼 세로 가운데, `--bar-h` | 3-7-11 높이, 3-14 |
| TL-C2 | 반영: B-20 = clsMedian ≤ 0.004 + 글꼴 외 이동 0 + Lighthouse 모바일 ≤ 0.05 | 3-12 B-20, DC-34 |
| TL-C3 | 반영: 래스터 ≤ 1은 P-03·05·06·07만, P-01 썸네일 600w ≤ 30KB eager·fetchpriority=low·합 ≤ 120KB, LCP el = H1 또는 P | 3-9 첫 화면 행, 3-6 공통 표, 5절 |
| TL-C4 | 반영: `\p{Emoji_Presentation}` 또는 `\p{Extended_Pictographic}️` (© 오탐 제거) | 3-11 #11 |
| TL-C5 | 반영: 금지 = 상태 접두 opacity·토큰 알파, 허용 = 전환 opacity, check-tokens 추가 DQ-13 | 3-2 투명도 규칙, 3-11 #16, 3-14 |
| TL-C6 | 반영: 상호작용 차트 `role="group"` + `g[role=button][tabindex=0]`, CH-4 등 정적 = img | 3-7-4 공통 |
| TL-C7 | 반영: ≥ 44 타깃 맞닿음 허용(겹침 0), 44 미만만 ≥ 8px | 3-5 타깃 간격, 0절 4 |
| TL-C8 | 반영: 버튼 `px-3 min-w-14`, 문구 ≤ 8자(제안 9자보다 엄격, CL-C3과 통일), 360·375·390 검증 | 3-7-7 BNR-1 |
| TL-C9 | 부분 반영: 2개 → ≤ 6자·좌우 16 반영. 0개 ≤ 10자는 사유: 00 3-1 문구 "이 시술 상담 가이드 받기" 14자가 들어가야 하고 263px ÷ 16 = 16자 → ≤ 16자. 바 좌우 16 명시 | 3-7-11 주 CTA 라벨·좌우 |
| TL-C10 | 반영: 32 = `app/icon.svg`, 180·512 PNG 예외 → DQ-11 | 3-1 파비콘, DC-33 |
| TL-C11 | 반영: 쿼리형 폐기, 앵커형 기본, URL 최종 50 | 3-7-2 CRD-A, DC-35, DQ-14 |
| TL-C12 | 반영: 첫 비텍스트 y ≤ 320(380), 마지막 창 규칙, `--tail window` 제안 | 3-6 R-TXT1·R-TXT6·마지막 부분 구간, DQ-12 |
| TL-M1 | 반영: `@theme` 매핑(container-text 680·page 1200, breakpoint md·lg, font-weight, ease·animate), check-tokens 간격 규칙, `py-7`, rounded-full | 3-14, DC-23 |
| TL-M2 | 반영: `@utility` h-bar·acc-closed·acc-open·max-h-sheet | 3-14, 3-7-10·3-7-7 |
| TL-M3 | 반영: `skeleton` 클래스, `data-card`, `--gaps`, `data-fold`, SVG 글자 판정식, 인라인·체크박스 예외 정의, 판정 도구 단일화 DQ-12 | 3-7-8, 3-7-2, 3-6, 3-3 svg, 3-5, DC-25 |
| TL-M4 | 부분 반영: DC-20~24 추가(푸터 워드마크, HeaderSearch 테두리, 보조 버튼 테두리, py-7, sm:). 사유 2: SiteHeader gap 4/0 = TL-C7 규칙상 44 타깃 맞닿음 허용이라 충돌 아님, ConsentBanner 스위치 rounded-lg = 트랙 28px에 16px → 알약 모양으로 3-4 허용 | 4-2 DC-20~24, 3-4 모서리 |
| TL-M5 | 반영: JS 0 / JS 필요 표, 아이콘 수·HTML 상한은 70(DQ-11) | 3-7-0 JS 표 |
| TL-M6 | 반영: srcset·sizes 마크업, 300×200 ≤ 12KB, fetchpriority=high 0 | 3-9 파일·마크업·첫 화면 |
| TL-M7 | 반영: 최소 폭 360, 가로 스크롤 0, SVG 폭별 2벌(viewBox 320/640), 360 캡처 | 3-5 최소 폭, 3-7-4 공통, 5절 |
| TL-M8 | 반영: 아코디언 밖 aria-expanded 0(헤더 검색 예외), 시트 `aria-haspopup="dialog"`, `data-accordion` 값 `accordion-*` | 3-7-10, 3-7-7 2층 시트 |
| TL-A1 | 반영: 브레이크포인트 2개, lg 1200 + px-10, md 목차 가로 칩, 목차 216px | 3-4 표 |
| TL-A2 | 반영: 4px 배수 적용 범위·예외 목록, PRG 4px | 3-4 "4px 배수 적용 범위", 3-7-12 PRG |
| TL-A3 | 반영: CRD-A 166.7, CHP-D 106.3×48 + 줄높이 20/18 | 3-7-2, 3-3 chip 행 |
| TL-A4 | 반영: `div.acc-closed > div.overflow-hidden > div[hidden=until-found]`, beforematch, React 19 출력 테스트 | 3-7-10 패널 구조 |
| TL-A5 | 반영(CL-C4와 같음) | 3-7-10 크기 |
| TL-A6 | 반영: 위치·크기 = transform만, 색·그림자·dashoffset 허용 | 3-8 움직이는 속성 |
| TL-A7 | 반영: 테두리 1px 고정 + `ring-1 ring-inset` | 3-7-0, 3-7-3 선택, 3-7-6 |
| TL-A8 | 반영: `motion-safe:` 접두 | 3-8 이동 클래스, 3-7-2 hover |
| TL-A9 | 반영: `svg.lucide-star`, "원·만 원" 앞뒤 40자 "%", `테스트 ?(병원\|데이터\|…)`, `setInterval` 소스 검사 | 3-11 #1·#3·#6·#12 |
| TL-A10 | 반영: 렌더 크기 = fontSize × getScreenCTM().a, viewBox ≤ 표시 폭 | 3-3 svg, 3-7-4 공통, DC-09 |
| TL-A11 | 반영: DC-03 → 실측 284px(H-C9 우선), DC-04 73px, DC-09 1280 미달, DC-16 675px | 4-2 DC-03·04·09·16 |
| TL-A12 | 반영: 키보드 판정식, 쿠키 설정 재오픈 `<button>` | 3-7-11 숨김, 3-7-7 재오픈 |
| TL-A13 | 반영: 미선택 6개 `design/brand/`, `out/brand` 3개 검사 → DQ-11 | 3-1 파일 |
| TL-A14 | 반영: B-15~B-20 도구 = bench-measure cold 3회 중앙값, Lighthouse 직접 비교 0 | 3-12 머리 문단 |
| H-C1 | 반영(CL-C1과 같음): (가) P-03 HDR 2번째 줄 0 + 검색 아이콘 + (나) SUM ≤ 7줄, 합계 680 | 3-6 배분표, 3-7-12 HDR, DQ-07 |
| H-C2 | 반영: B-05 요소별 집계 375 19·1280 23(CPY 24·SUM 머리 24·번호 원 3·Wallet·BAR 아이콘 24·목차 머리) | 3-6 B-05 집계, DC-36 |
| H-C3 | 반영: `/insights` 정적 → 스켈레톤 0, B-46 측정 화면 A-01, P-06 = BTN loading, E3 → DQ-15 | 3-7-8, 3-7-4 loading, 3-12 B-46, DC-28 |
| H-C4 | 반영: 더미 표기 패턴만 금지, "리치 결과 테스트"·"A/B 테스트" 허용 | 3-11 #12 |
| H-C5 | 반영: 3-13 신설(A4·16mm·10.5pt·18pt·머리말·꼬리말·print CSS), 범위 밖 "인쇄 0" 삭제 | 3-13, 1절 범위 밖 |
| H-C6 | 반영: 계열 ≤ 3(brand·ink-muted·accent) + 선 모양 + 직접 라벨, 4계열 이상 small multiples | 3-7-4 공통 |
| H-C7 | 반영: 1줄 = CSS 폭 ≥ 360, < 360(확대 포함) 2줄 90 ≤ 104px, 처리방침 링크 위치 | 3-7-7 BNR-1 |
| H-C8 | 반영: 3-12 "요약" 행(강남언니 3항목·복사 0·3중 일치 0 → 우리 3항목 + 복사 + 3중 일치), BENCHMARK 정정 DC-27·DQ-15 | 3-12 요약 행 |
| H-C9 | 반영: DC-03 실측 284px(2026-10-25) | 4-2 DC-03 |
| H-C10 | 반영: jsonld 트리거 `<h3>` 고정, 패널 = DG-4 + CODE 최대 320px 안쪽 스크롤 | 3-7-10 jsonld 패널, 3-7-5 DG-4, 3-7-12 CODE |
| H-M1 | 반영: SUM(ID·라벨·배경·머리 아이콘 24·CPY 위치·같은 문장 칩 → jsonld·llms.txt 칩·높이 상한) | 3-7-12 SUM |
| H-M2 | 부분 반영: 코드 글꼴·pre-wrap·최대 320·복사·리치 결과 테스트 새 탭·@type 칩·검사 오류 0 반영. 사유: 숫자 accent-strong은 CODE 배경 canvas 위 4.41:1(3-2 금지) → 숫자 = ink 700 | 3-7-12 CODE, 3-7-10 jsonld 패널 |
| H-M3 | 반영: TRK(이벤트·파라미터 표·lead_id 마스킹·GTM 태그·메타 event_id·동의 상태 실시간·dataLayer CODE·/insights#tracking 같은 컴포넌트) | 3-7-12 TRK |
| H-M4 | 반영: CH-5~8, 섹션 캡션, BNR-2 "운영 지표(채용 심사용)", 데이터 0 상태 | 3-7-4 표·아래 줄 |
| H-M5 | 반영: D8 커버 그리드, D1 GIF 규칙, QR, D3 DG-5, D4 mermaid themeVariables, D5·D6 표 + 차트 | 3-13 제출물 표, 3-7-5 DG-5 |
| H-M6 | 반영: 소재 3크기, 9:16 안전 영역 14%·35%, 워드마크 위치, P-12 일치 3조건 | 3-9 메타 광고 소재 |
| H-M7 | 반영: 추적 자리 표(컴포넌트별 열 대신 표 1개로 모음, 반복 줄이기), 이름은 40 | 3-7-13, DQ-16 |
| H-M8 | 반영: BRD(44, ChevronRight 16, 375 중간 생략, House 16, 위치) | 3-7-12 BRD, DC-38 |
| H-M9 | 반영: "AI 생성" 캡션 12px ink-muted(단독 일러스트) + 푸터 1줄, 법적 의무 DQ-10 | 3-9 AI 생성 표시 |
| H-M10 | 반영: 각주 위첨자 12px·히트 24×24, 참고문헌 행 ≥ 44·기관·연도·DOI 칩, BDG-4 위치 | 3-7-12 FN, 3-7-3 BDG-4 |
| H-A1 | 반영: 4px 배수 = HTML만, SVG 내부 예외, PRG 4px | 3-4 |
| H-A2 | 반영: `text-num` 24/700 tabular, CH-1 값은 SVG 14/700 | 3-3 num 행 |
| H-A3 | 반영: 화면별 필수 요소(P-01·03·05·06·07·12) | 3-6 "화면별 첫 화면 필수 요소" |
| H-A4 | 반영(CL-C7과 같음) | 3-7-9 |
| H-A5 | 반영: noindex jsonld 토글 기본 표시 → DQ-18, R-TXT6 마지막 창 정의 | 3-6 R-TXT6, DQ-18 |
| H-A6 | 반영: 업체명 표기 기본값 → DQ-17 | 3-7-7 2층 시트 |
| H-A7 | 반영: B-40 유형표(트리거 → 결과, 375·1280 각 9, 합집합 10) | 3-7-12 B-40 표, 3-12 B-40 |
| H-A8 | 반영: 행 수 정정(v1 38) → v2 39, 제외 행 사유(B-21·22·28~30·32·33·34) | 3-12 머리 문단 |

**신규 충돌 기록**: DC-20 푸터 워드마크 · DC-21 HeaderSearch 입력 테두리 · DC-22 보조 버튼 테두리 · DC-23 `py-7` · DC-24 `sm:` 접두 · DC-25 Skeleton 클래스 · DC-26 HDR 2번째 줄 · DC-27 BENCHMARK 요약 박스 값 · DC-28 B-46 `/insights` · DC-29 mock 제출(00·content·CLAUDE.md) · DC-30 00 F4 문장 길이 · DC-31 00 F5 FAQ 하한 · DC-32 IMAGES 주제 예 · DC-33 check-out PNG · DC-34 CLS 웹폰트 · DC-35 부위 카드 쿼리 URL · DC-36 BENCHMARK B-05 구성 예 · DC-37 "AI 답변용 요약" 라벨 · DC-38 브레드크럼 위치. 수정: DC-02·03·04·09·13·16.
**신규 spec-question 후보**: DQ-07(00·20 요약 문장 길이) · DQ-08(00 FAQ 하한 7) · DQ-09(00 mock 제출) · DQ-10(95 AI 생성 표시) · DQ-11(70 파비콘 PNG·로고 이동·아이콘 상한) · DQ-12(80 bench-measure `--tail window`·`--gaps`·도구 단일화) · DQ-13(70 check-tokens 규칙) · DQ-14(50 부위 카드 URL) · DQ-15(benchmark lane B-46 E3·요약 값) · DQ-16(40 추적 속성) · DQ-17(95 쿠키 토글 업체명) · DQ-18(50 noindex jsonld 토글).

**lint**: 이 에이전트에 셸 도구가 없어 `node scripts/lint-spec.mjs docs/specs/10-design.md`를 직접 실행하지 못함. 스크립트 규칙 3개를 Grep으로 재현: ① 금지 어간 13종 문서 전체 0건 ② 절 제목 6종(목적·원칙·규칙·접점·체크리스트·변경 이력) 모두 `#` 줄에 존재 ③ 1행 제목에 "완본" → 120줄 규칙 면제. 재현 결과 오류 0. 오케스트레이터가 실제 실행으로 확인 필요.
**남은 리스크**: ① P-03 375 첫 화면 여유 9px — SUM이 8줄이 되거나 H1이 3줄이 되면 684 초과(DQ-07·H1 ≤ 18자 지켜야 함). ② B-05 1280 집계 23 중 1개가 쿠키 배너 아이콘이라 동의 후 재측정 시 22(목표 하한). ③ R-TXT6 마지막 부분 구간은 스크립트 옵션(DQ-12) 전까지 `--min 2` 실패가 날 수 있음.

## 4. r2 재확인 (spec-content-lead)
검토일 2026-10-25, 대상 `docs/specs/10-design.md` v2 완본(884줄). 입력 = 2절 content·tech·hiring 지적 전체, 3절 반영 표, 00·95·90 근거 문구 대조. 경쟁사 열람 0, 10-design 수정 0.

**판정: approve** (차단 0건).

### 4-1 반영 표의 "반영" 차단 지적 대조 (C·H-C 34건)
표시만 하고 본문에 없는 건 **0건**. 숫자·예시가 본문에 있는 위치를 확인한 것:
| 지적 | 본문 확인 위치 |
| --- | --- |
| CL-C1·H-C1 | 3-6 P-03 375 배분표 13행(y 0~684), 1280 배분표(690 ≤ 736) |
| CL-C2·TL-C9 | 3-7-11 주 CTA 라벨 3단(16·10·6자)과 폭 계산 263 ÷ 16 |
| CL-C3·TL-C8·H-C7 | 3-7-7 BNR-1: 375 151px ≥ 8자 × 14 = 112, 360 136px, 360 미만 2줄 90 ≤ 104 |
| CL-C4·TL-A5 | 3-3 base 행, 3-7-10 크기(1줄 59·2줄 86, 7개 602, "Q."·번호 0) |
| CL-C5 | 3-7-3 CHP-D 6개 라벨. "회복기간 하한·상한"은 DC-13 설명에만 남음(지시문 아님) |
| CL-C6 | 3-7-3 MET 표(95 S0 문자열과 일치 확인), 375 2줄 45px |
| CL-C7·C8 | 3-7-9 "다른 시술 10개", 3-11 #5 `\bTOP\b`, #11 정규식 |
| CL-C9·C12 | 3-9 접미사 원문, 주제 표 10행(효과 단어 0), 소재 주제 기하 도형 |
| CL-C11 | 3-7-6 동의 블록(A1·A2·A4 상시, A3 조건부, 전체 동의 = A1~A3). 95 194행과 일치 |
| TL-C1~C12 | 3-7-11 h-bar, B-20, 3-9 첫 화면, 3-11 #11, 3-2 투명도, 3-7-4 role="group", 3-5 간격, 3-1 파비콘, 3-7-2 CRD-A, 3-6 R-TXT1·6 |
| H-C2~C10 | 3-6 B-05 집계(375 19·1280 23, 합산 재계산 일치), 3-7-8 SKL, 3-11 #12, 3-13, 3-7-4 계열 ≤ 3, 3-12 요약 행, 3-7-10 jsonld 패널 |

### 4-2 "사유" 4건 판정
| 건 | 근거 문서 대조 | 판정 |
| --- | --- | --- |
| CL-C10 (mock 제출 비활성 유지, DQ-09) | 00 S8 280행 "mock 배포의 P-06 제출 버튼 비활성 + '상담 접수 준비 중'", 00 체크리스트 401행 같은 문구, 00 M1 행 297행 "S8 조건 또는 P-06 제출 비활성". 00이 README 우선순위 2위. 막힘 방지 링크 추가는 00과 충돌 없음 | 타당, 비차단. DQ-09는 TASKS에 올려 00 소유자가 CLAUDE.md "M1 = 완료까지 클릭"과 맞출 것 |
| TL-C9 (0개 ≤ 16자) | 00 3-1 55행 문구 "이 시술 상담 가이드 받기" = 14자, 계산 343 − 48 − 32 = 263 ÷ 16 = 16.4 | 타당, 비차단 |
| TL-M4 일부 (gap 4/0, 스위치 radius) | 3-5가 44 이상 타깃 맞닿음 허용, 스위치 트랙 높이 28에 radius 16 = 알약 | 타당, 비차단 |
| H-M2 숫자 색 | 3-2 대비 표: accent-strong on canvas 4.41:1 < 4.5, CODE 배경 canvas | 타당, 비차단 |

### 4-3 차단 목록 (v2 신규 충돌·누락)
없음. 확인한 항목: 배분표 산술(375 합 684, 1280 합 690, 칸 폭 106.3·166.7·262·357.3), B-05 집계 합, B-40 유형표 375 9·1280 9, 3-12 행 수 39, 컴포넌트 18종, 95 S0·S4 문자열, 95 A1~A4 표시 조건, 00 F4·F5 범위, 90 D1·D8 수치(7단계 ≤ 30초 ≤ 5MB, 표 7행·8행, QR ≥ 25mm), lint 3규칙(형용사 행 0, 절 6종, 제목 "완본").

### 4-4 비차단 목록 (구현·T-088·layouts에서 처리, 반려 사유 아님)
1. **합계 숫자 680 ↔ 표 675**: 3-6 375 배분표는 필수 요소 y 끝 675 + 여유 9 = 684인데 0절 6번·DC-16·변경 이력은 "합계 680". 어느 쪽이든 ≤ 684. 680을 675로 통일.
2. **P-05 가상 병원 고지 위치**: 00 3-1 55행은 고지 1줄을 "버튼 바로 위"로 정함. 375 하단 바(64px, 버튼 48)에는 줄이 들어갈 자리가 없고 10은 고지를 본문 상단 필수 요소로만 둠. docs/layouts P-05에서 "바 바로 위 고지 띠(바 높이 64에 불포함)" 등으로 확정하고 B-08 측정 대상(바 요소)과 분리할 것.
3. **주 CTA 위치 미정**: 1280에서 BAR가 숨겨지므로(768 이상 0) P-05·P-12·P-01 첫 화면의 채운 CTA 1개 위치가 10에 없음(P-03만 목차 열). P-07은 첫 화면 필수 요소에 CTA가 없어 "정확히 1" 규칙과 어긋남. layouts에서 화면×폭 표로 확정.
4. **CHP-D 칩 안 글자 폭**: 칩 106.3px에서 아이콘 24 + 간격 8 + 패딩 16이면 값 칸 약 56px. "30~60분"(약 61px)과 "28일(약 4주)"(약 94px)가 2줄 높이 48을 깨뜨릴 수 있음. 값 글자 수 상한과 패딩 값을 3-3 상한 표에 추가. 또 칩 "위아래 5px"는 간격 11단계 밖이므로 `h-12` + 세로 가운데로 표기.
5. **SUM 높이 중복 합산**: 3-7-12의 277px는 "머리 44 + 4 + 161"인데 161에 위 4가 이미 포함(배분표 12행). 273이 맞음. 1280 SUM 218도 위 간격 16 포함값(컴포넌트 단독 202).
6. **"같은 문장" 칩 동작 이중**: 3-7-12는 "FAQ 1번 위치로 이동 + jsonld 토글 열림", 체크리스트는 "jsonld 토글 열림"만. 한 동작으로 통일(푸터 토글 점프 권장, B-40 유형표에는 없음).
7. **글자 단계 7개 ↔ CODE 13px**: 0절 2번은 7단계, CODE는 13px/20px(HTML). 3-14 `@theme`에 코드 글자 토큰이 없어 임의값 금지 규칙과 충돌. 토큰 1개 추가 또는 14px 사용.
8. **B-03 ≥ 13은 가격 조사 통과 시술만 성립**: CH-1 미달 상태(점 0)에서는 실데이터 숫자가 9~10개. 3-12 B-03 비고에 "F6 통과 시술 기준" 한 줄 필요(00 S14가 M1 전 가격 조사 완료로 잡혀 있어 M1 영향은 낮음).
9. **95 S4와 MET S4 둘째 줄**: 95 258행 S4 메타 줄은 "의료 자문 ○○○ · 검토 {reviewedAt}" 한 줄이고 "출처 n건·최종 수정"은 정하지 않음. 10이 둘째 줄을 추가(B-23 필요). 95 소유자 확인용으로 DQ 1건 추가 권장.
10. **그 밖**: Disabled Primary 테두리 line은 3-2 "버튼 경계 line 금지"와 문면 충돌(WCAG는 disabled 면제, 예외 문구 필요) · S4 FAQ 높이 예산 602는 H2·아이콘 제외 값 · PDF 꼬리말 8.5pt는 3-3 xs 12px와 다른 단위 · 정의서가 884줄이라 CLAUDE.md "1쪽 요약 ≤ 120줄"은 제목 "완본" 예외로만 통과(lint 통과, 오케스트레이터가 의도 확인).

### 4-5 반려 횟수
r2 판정 approve, 반려 누적 1회(r1 request-changes 기준). 4-4의 1~4번은 docs/layouts/P-03·P-05 작성 시 반영하고 TASKS `fix:` 후속으로 올릴 것을 권장.
