# 사이트 감사 20261027-0805

- 커밋 `09b0121` (worktree-agent-a486020b71681c3f5, 커밋 안 된 변경 있음) · 2026-10-26T23:05:44.049Z · 400초
- 대상 28개 경로 × 375·1280px (전체 감사) · basePath `/`
- 모바일 측정 조건: CPU 4×, RTT 150ms, 1.6Mbps (Lighthouse 모바일 근사 — 게이트는 `pnpm lh`)

## 요약

치명 0 · 주요 66 · 경미 79

| 영역 | 치명 | 주요 | 경미 |
| --- | --- | --- | --- |
| A 첫인상·비주얼 | 0 | 0 | 64 |
| B 핵심 흐름 | 0 | 0 | 0 |
| C 콘텐츠 밀도·신뢰 | 0 | 65 | 0 |
| D 기술 SEO | 0 | 0 | 12 |
| E AEO | 0 | 0 | 0 |
| F 측정 | 0 | 0 | 0 |
| G 성능·접근성 | 0 | 1 | 1 |
| H 법·의료광고 안전 | 0 | 0 | 2 |

## 주요 문제 (심각도 → 영향 경로 수)

1. **[major] C `text-wall`** — 45곳: /procedures/@375, /procedures/눈매교정/@375, /procedures/눈매교정/@1280, /procedures/눈밑지방재배치/@375 외 41
   - y=718–1661px (1.2화면, 189자)에 시각 요소 없음
   - y=1165–4874px (4.6화면, 1,074자)에 시각 요소 없음
   - y=5476–7440px (2.4화면, 637자)에 시각 요소 없음
2. **[major] G `cls`** — 1곳: /clinics/새솔결의원/@375
   - CLS 0.083 > 0.05
3. **[minor] A `no-content-image`** — 48곳: /@375, /@1280, /procedures/@375, /procedures/@1280 외 44
   - 콘텐츠 이미지(120×80 이상) 0장 — 아이콘·텍스트뿐
4. **[minor] A `fold-no-visual`** — 16곳: /procedures/눈매교정/@375, /procedures/눈밑지방재배치/@375, /procedures/쌍꺼풀-수술/@375, /procedures/앞트임/@375 외 12
   - 첫 화면에 시각 요소(40px 이상)가 없음
5. **[minor] D `description-length`** — 12곳: /clinics/@375, /clinics/@1280, /blog/@375, /blog/@1280 외 8
   - description 113자 (120~150자)
   - description 89자 (120~150자)
   - description 64자 (120~150자)
6. **[minor] H `ad-safety`** — 2곳: /terms/@375, /terms/@1280
   - 의료광고 표현 확인 필요: "나 시술을 추천하거나 효과를 보장하지 않습니다. 제 3"
7. **[minor] G `touch-target`** — 1곳: /blog/성형-견적서-읽는-법/@375
   - 44px 미만 1개: [post-article] a "눈밑지방재배치" 105×20

## 경로별

| 경로 | 키 | HTTP | H1 | title·desc | JSON-LD | LCP 375 | CLS 375/1280 | axe 375/1280 | 콘솔 | 첫 로드 KB JS·CSS·IMG·FONT(375) | 콘텐츠 이미지 | 시각 면적% | 텍스트 벽 375/1280 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | home | 200 | 1 | 23·123 | Organization, WebSite | 780ms | 0.000/0.000 | 0/0 | 0 | 122·27·34·337 | 0 | 3.5 | 0/0 |
| `/procedures/` | procedures | 200 | 1 | 33·121 | BreadcrumbList, CollectionPage, ItemList, ListItem, Organization, WebSite | 676ms | 0.000/0.000 | 0/0 | 0 | 126·27·28·377 | 0 | 1 | 1/0 |
| `/procedures/눈매교정/` | procedures-ptosis-correction | 200 | 1 | 34·138 | Answer, BreadcrumbList, CreativeWork, FAQPage, ListItem, MedicalAudience, MedicalWebPage, Organization, Question, SurgicalProcedure, WebSite | 784ms | 0.000/0.000 | 0/0 | 0 | 125·27·30·403 | 0 | 1 | 2/2 |
| `/procedures/눈밑지방재배치/` | procedures-lower-fat-repositioning | 200 | 1 | 37·136 | Answer, BreadcrumbList, CreativeWork, FAQPage, ListItem, MedicalAudience, MedicalWebPage, Organization, Question, SurgicalProcedure, WebSite | 616ms | 0.012/0.000 | 0/0 | 0 | 125·27·30·403 | 0 | 1 | 2/2 |
| `/procedures/쌍꺼풀-수술/` | procedures-double-eyelid | 200 | 1 | 36·148 | Answer, BreadcrumbList, CreativeWork, FAQPage, ListItem, MedicalAudience, MedicalWebPage, Organization, Question, SurgicalProcedure, WebSite | 640ms | 0.000/0.000 | 0/0 | 0 | 125·27·30·456 | 0 | 1 | 2/2 |
| `/procedures/앞트임/` | procedures-epicanthoplasty | 200 | 1 | 33·134 | Answer, BreadcrumbList, CreativeWork, FAQPage, ListItem, MedicalAudience, MedicalWebPage, Organization, Question, SurgicalProcedure, WebSite | 756ms | 0.000/0.000 | 0/0 | 0 | 125·27·30·403 | 0 | 1 | 2/2 |
| `/procedures/코-성형/` | procedures-rhinoplasty | 200 | 1 | 34·137 | Answer, BreadcrumbList, CreativeWork, FAQPage, ListItem, MedicalAudience, MedicalWebPage, Organization, Question, SurgicalProcedure, WebSite | 780ms | 0.000/0.000 | 0/0 | 0 | 125·27·28·426 | 0 | 1 | 2/2 |
| `/procedures/광대-축소술/` | procedures-zygoma-reduction | 200 | 1 | 36·131 | Answer, BreadcrumbList, CreativeWork, FAQPage, ListItem, MedicalAudience, MedicalWebPage, Organization, Question, SurgicalProcedure, WebSite | 680ms | 0.000/0.000 | 0/0 | 0 | 125·27·29·388 | 0 | 0.7 | 2/2 |
| `/procedures/사각턱-수술/` | procedures-square-jaw-reduction | 200 | 1 | 36·135 | Answer, BreadcrumbList, CreativeWork, FAQPage, ListItem, MedicalAudience, MedicalWebPage, Organization, Question, SurgicalProcedure, WebSite | 648ms | 0.000/0.000 | 0/0 | 0 | 125·27·29·388 | 0 | 0.8 | 2/2 |
| `/procedures/실리프팅/` | procedures-thread-lift | 200 | 1 | 34·142 | Answer, BreadcrumbList, CreativeWork, FAQPage, ListItem, MedicalAudience, MedicalProcedure, MedicalWebPage, Organization, Question, WebSite | 816ms | 0.000/0.000 | 0/0 | 0 | 125·27·31·403 | 0 | 0.8 | 2/2 |
| `/procedures/레이저-토닝/` | procedures-laser-toning | 200 | 1 | 36·135 | Answer, BreadcrumbList, CreativeWork, FAQPage, ListItem, MedicalAudience, MedicalProcedure, MedicalWebPage, Organization, Question, WebSite | 812ms | 0.000/0.000 | 0/0 | 0 | 125·27·31·448 | 0 | 0.8 | 2/2 |
| `/procedures/가슴-확대-수술/` | procedures-breast-augmentation | 200 | 1 | 38·150 | Answer, BreadcrumbList, CreativeWork, FAQPage, ListItem, MedicalAudience, MedicalWebPage, Organization, Question, SurgicalProcedure, WebSite | 784ms | 0.001/0.000 | 0/0 | 0 | 125·27·30·363 | 0 | 0.6 | 2/2 |
| `/clinics/` | clinics | 200 | 1 | 30·113 | BreadcrumbList, ListItem, Organization, WebSite | 628ms | 0.000/0.000 | 0/0 | 0 | 134·25·3·331 | 0 | 1.3 | 0/0 |
| `/clinics/단하늘성형외과/` | clinics-danhaneul | 200 | 1 | 34·126 | BreadcrumbList, GeoCoordinates, ListItem, MedicalClinic, MedicalProcedure, OpeningHoursSpecification, Organization, PostalAddress, WebSite | 704ms | 0.000/0.000 | 0/0 | 0 | 130·25·11·302 | 0 | 3.7 | 1/1 |
| `/clinics/로아빛의원/` | clinics-roabit | 200 | 1 | 32·123 | BreadcrumbList, GeoCoordinates, ListItem, MedicalClinic, MedicalProcedure, OpeningHoursSpecification, Organization, PostalAddress, WebSite | 756ms | 0.000/0.000 | 0/0 | 0 | 130·25·13·328 | 0 | 3.8 | 1/1 |
| `/clinics/새솔결의원/` | clinics-saesolgyeol | 200 | 1 | 36·127 | BreadcrumbList, GeoCoordinates, ListItem, MedicalClinic, MedicalProcedure, OpeningHoursSpecification, Organization, PostalAddress, WebSite | 664ms | 0.083/0.000 | 0/0 | 0 | 130·25·19·302 | 0 | 3.7 | 1/1 |
| `/clinics/온결담성형외과/` | clinics-onkyeoldam | 200 | 1 | 34·126 | BreadcrumbList, GeoCoordinates, ListItem, MedicalClinic, MedicalProcedure, OpeningHoursSpecification, Organization, PostalAddress, WebSite | 736ms | 0.000/0.000 | 0/0 | 0 | 130·25·11·330 | 0 | 3.8 | 1/1 |
| `/clinics/하결성형외과/` | clinics-hagyeol | 200 | 1 | 33·126 | BreadcrumbList, GeoCoordinates, ListItem, MedicalClinic, MedicalProcedure, OpeningHoursSpecification, Organization, PostalAddress, WebSite | 752ms | 0.000/0.000 | 0/0 | 0 | 130·25·21·330 | 0 | 3.8 | 1/1 |
| `/clinics/해름결성형외과/` | clinics-haereumgyeol | 200 | 1 | 35·124 | BreadcrumbList, GeoCoordinates, ListItem, MedicalClinic, MedicalProcedure, OpeningHoursSpecification, Organization, PostalAddress, WebSite | 804ms | 0.000/0.000 | 0/0 | 0 | 130·25·17·330 | 0 | 3.8 | 1/1 |
| `/clinics/휘담결성형외과/` | clinics-hwidamgyeol | 200 | 1 | 34·126 | BreadcrumbList, GeoCoordinates, ListItem, MedicalClinic, MedicalProcedure, OpeningHoursSpecification, Organization, PostalAddress, WebSite | 728ms | 0.000/0.000 | 0/0 | 0 | 130·25·21·330 | 0 | 3.8 | 1/1 |
| `/blog/` | blog | 200 | 1 | 27·89 | BreadcrumbList, ListItem, Organization, WebSite | 684ms | 0.000/0.000 | 0/0 | 0 | 123·27·16·281 | 0 | 3.2 | 0/0 |
| `/blog/쌍꺼풀-수술-상담-질문/` | blog-double-eyelid-consult-questions | 200 | 1 | 30·64 | Article, BreadcrumbList, ListItem, Organization, WebSite | 760ms | 0.013/0.000 | 0/0 | 0 | 123·27·3·363 | 0 | 1.3 | 1/1 |
| `/blog/눈밑지방재배치-하안검-차이/` | blog-lower-fat-vs-lower-blepharoplasty | 200 | 1 | 31·67 | Article, BreadcrumbList, ListItem, Organization, WebSite | 740ms | 0.000/0.000 | 0/0 | 0 | 123·27·5·468 | 0 | 1.2 | 1/1 |
| `/blog/성형-견적서-읽는-법/` | blog-reading-surgery-quotes | 200 | 1 | 34·76 | Article, BreadcrumbList, ListItem, Organization, WebSite | 796ms | 0.000/0.000 | 0/0 | 0 | 123·27·5·433 | 0 | 1.2 | 1/1 |
| `/terms/` | terms | 200 | 1 | 11·124 | Organization, WebSite | 676ms | 0.000/0.000 | 0/0 | 0 | 122·25·0·336 | 0 | 0.1 | 1/1 |
| `/privacy/` | privacy | 200 | 1 | 15·111 | Organization, WebSite | 668ms | 0.000/0.000 | 0/0 | 0 | 122·25·0·415 | 0 | 0.1 | 1/1 |
| `/consult/` | consult | 200 | 1 | 15·94 | Organization, WebSite | 644ms | 0.000/0.000 | 0/0 | 0 | 144·25·34·230 | 0 | 1.2 | 0/0 |
| `/__audit-not-found/` | 404 | 404 | 1 | 21·123 | Organization, WebSite | 628ms | 0.000/0.000 | 0/0 | 0 | 122·25·5·256 | 0 | 2.2 | 0/0 |

## 여정

| 여정 | 뷰포트 | 결과 | 단계 | 확인 | dataLayer 이벤트 |
| --- | --- | --- | --- | --- | --- |
| 검색→가이드→상담→완료 | 375 | 통과 | ✓ home → ✓ search-suggest → ✓ guide → ✓ guide-cta → ✓ consult-step1 → ✓ consult-step2 → ✓ done → ✓ reload | ✓ generate_lead 정확히 1회; ✓ value 50000 KRW; ✓ lead_id 형식; ✓ procedure_id 전달; ✓ 새로고침 후 재발화 0; ✓ form_start 1회; ✓ form_step2 1회; ✓ view_procedure 1회; ✓ click_cta(mid); ✓ search 이벤트 | consent_update → search → view_procedure → scroll_depth → scroll_depth → click_cta → form_start → form_step2 → generate_lead |
| 홈→병원 목록→병원→상담 | 375 | 통과 | ✓ home → ✓ clinics → ✓ clinic → ✓ clinic-cta → ✓ consult | ✓ select_clinic; ✓ view_clinic 1회; ✓ click_cta(mid); ✓ 폼 진입만으로 form_start 없음; ℹ 전화·카톡 버튼(전화 없음 · 카톡 없음(제휴 병원만 노출)) | consent_update → select_clinic → view_clinic → click_cta |
| 검색→가이드→상담→완료 | 1280 | 통과 | ✓ home → ✓ search-suggest → ✓ guide → ✓ guide-cta → ✓ consult-step1 → ✓ consult-step2 → ✓ done → ✓ reload | ✓ generate_lead 정확히 1회; ✓ value 50000 KRW; ✓ lead_id 형식; ✓ procedure_id 전달; ✓ 새로고침 후 재발화 0; ✓ form_start 1회; ✓ form_step2 1회; ✓ view_procedure 1회; ✓ click_cta(mid); ✓ search 이벤트 | consent_update → search → view_procedure → scroll_depth → scroll_depth → click_cta → form_start → form_step2 → generate_lead |
| 홈→병원 목록→병원→상담 | 1280 | 통과 | ✓ home → ✓ clinics → ✓ clinic → ✓ clinic-cta → ✓ consult | ✓ select_clinic; ✓ view_clinic 1회; ✓ click_cta(mid); ✓ 폼 진입만으로 form_start 없음; ℹ 전화·카톡 버튼(전화 없음 · 카톡 없음(제휴 병원만 노출)) | consent_update → select_clinic → view_clinic → click_cta |

## 스크린샷 (screens/, git 제외)

- `<키>-<폭>-fold.png` 첫 방문 첫 화면(동의 배너 포함) · `-full.jpg` 전체(배너 닫음) · `-sheet<N>.jpg` 화면 단위로 잘라 붙인 시트(번호 = 위에서부터 화면 순서)
- `-wall<N>.jpg` 텍스트 벽 구간 · `journey-<여정>-<폭>-<순번>-<단계>.jpg` 여정 단계별 화면
- 숫자는 자동 신호일 뿐이다. 채점(docs/loop/GOAL.md)은 스크린샷을 Read 로 열어 눈으로 확인한 뒤 한다.
