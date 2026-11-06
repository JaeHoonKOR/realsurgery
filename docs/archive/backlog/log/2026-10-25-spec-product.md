# 2026-10-25 spec-product (T-080) — 00-product

## 1. 초안
- spec-product-lead v1 작성: `docs/specs/00-product.md` (297줄), lint-spec 0. 결정 3건(3-8), 충돌 기록 C1~C13, spec-question 후보 Q1~Q7.

## 3. hiring-reviewer r2 (v2 대상) — request-changes, 채용 아니오
HR 반영 확인: 13 확인, HR2·HR11 미흡. 신규 지적:
- R2-1 [충돌] V3·V4 경쟁 관찰이 강남언니 구형 O1에만 기댐. 신형 `unni.app/contents/3f9d9338-d3d4-80da-916a-f41425fe332d`(2026-10-23)엔 논문 각주 3·FAQ 2. 수정: O1b 추가, V3 "숫자 문장 100% 각주 vs O1b 문서 단위 각주 3", V4 "FAQ 5~8 + FAQPage JSON-LD vs O1b FAQ 2".
- R2-2 [충돌] 3-10 `by_source.naver_organic` vs 3-5 agg 스키마 `{naver,meta,organic,referral,direct}`. 수정: `{naver_ads, naver_organic, meta, other_organic, referral, direct}`.
- R2-3 [충돌] F6(가격 조사일 ≤30일)이 완본=색인 조건 → 12-03 만료 시 AEO 대상 4편 noindex. 체크리스트 3번과도 모순. 수정: F6을 색인 조건에서 빼고 미달·만료 시 "예시 가격" 라벨만.
- R2-4 [모호] 메타 R1(≈3건) 표본 부족 → R2 목표 미정, KPI-01 "168,000÷9≈18,700"이 암묵 CPL 목표(원칙 4 충돌). 수정: R1·R2 비교 = CTR·CPC·랜딩 조회당 비용, CPL은 21일 누적 1개, 메타 9건은 "CPL 목표 아님" 또는 "리드 ≥5(D6 하한)".
- R2-5 [충돌] 3-4 C "D8 숫자 6개"인데 목록 7개, 90은 6×3=18칸. 수정: 02a·02b 한 칸 병합 또는 7칸으로 고치고 C18 기록.
- R2-6 [누락] flight 중 실이용자가 is_demo 병원 P-05 상담 CTA 클릭 가능(기만 소지). 수정: S8 조건에 "is_demo 병원 상세 상담 CTA 0 또는 '예시 병원 — 상담 대상 아님' 고지".
- R2-7 [누락] D8 SEO 증거가 색인률 하나(분모 7~13). 수정: KPI-06 칸에 서치콘솔 노출·클릭 4주 합계 병기 또는 KPI-09와 교체.
- HR15 범위 축소(form_start→generate_lead) 지적: U1 Job 전체(가격 확인→상담) 아님.

## 2. 지적 목록 (r1, 병렬)
ID 규칙: TL = spec-tech-lead, CL = spec-content-lead, HR = hiring-reviewer. 분류 [충돌/누락/모호].

### spec-tech-lead (20)
- TL1 [충돌] S8 flight 시작 조건에 실 Supabase 연결 없음 → mock 모드 배포에서 광고 시 실리드 소실. 수정: flight 시작 = hasKey(SUPABASE·SUPABASE_ADMIN·LEAD_ENCRYPTION·RESEND) true + is_demo 리드 왕복 1건. mock 배포는 P-06 제출 비활성 + "상담 접수 준비 중".
- TL2 [충돌] K1 원천 `reports/leads/leads.csv`(마스킹) — 공개 저장소·gitignore 없음·admin-leads/열람 로그 우회. 수정: Edge Function `metrics-agg`가 건수만 반환 → `reports/leads/agg.json`, 행 단위 CSV는 gitignore.
- TL3 [충돌] K5 원천 lead_status_logs는 A-01(T-107, M2)이 기록 → R1(11-10~16) SLA 측정 불가. 수정: M1 종료 조건에 A-01 최소판(목록+상태 변경+로그).
- TL4 [충돌] M0 종료 조건 `/robots.txt`·`/llms.txt` 200 — github.io 하위 경로에선 불가. 수정: 도메인 전 `/realsurgery/sitemap.xml` 200 + 서치콘솔 제출 캡처, 루트 3파일은 도메인 연결일+1일.
- TL5 [충돌] "타사명 비교 문장 0개"·"경쟁 표 D8에만" vs 90 `/insights#aeo` 타사 인용률·`public/deliverables/` → out 검사 항상 실패. B07은 타 병원만. 수정: 검사 대상 P-*·광고 소재로 한정, `out/insights/**`·`out/deliverables/**` 제외, 타사명 규칙은 95 spec-question.
- TL6 [충돌] `utm_source=internal` → is_demo는 누구나 위조 가능, e2e는 실리드·CAPI 오염. 수정: Edge Function이 비밀 헤더 `x-internal-token` 검증, is_demo는 Resend·CAPI·generate_lead 0. 95 3-7 spec-question.
- TL7 [충돌] M0 지연 → M1 지연 규칙 없음, 순차 /loop로 7일+8일 체인. 수정: 빌드 작업은 자기 선행 정의서만 승인되면 시작(T-109=30·70, T-112=10), M0 n일 지연 → M1 = 11-09+n.
- TL8 [누락] `kpi.K*` 값 스키마 없음(복합 KPI, mock 값 유입). 수정: `{value|null, unit, status: ok|below|insufficient|na|needs-key, period, source, captured_at}`, 복합은 하위 키, mock은 null+needs-key, zod 검증.
- TL9 [누락] "매주 월 10:00 집계" 실행 장치 없음(pages.yml schedule은 build 건너뜀). 수정: Actions cron `0 1 * * 1` → metrics-agg → build-metrics → build → deploy, 70 위임, 담당 builder(T-141).
- TL10 [누락] 결정 1 referrer 수집 시점 미정의(P-06 referrer는 자사, strict-origin), blog.naver.com 혼입. 수정: 세션 첫 페이지뷰에서 landing_referrer·utm_* sessionStorage → P-06 숨김 필드, 네이버 오가닉 = search.naver.com·m.search.naver.com, blog.naver.com은 referral.
- TL11 [누락] 도메인 연결일·M1 통과일 저장 위치 없음. 수정: `reports/ops/milestones.json {domain_connected_at, m1_passed_at, t500_decision}`.
- TL12 [누락] 제휴 링크 기술 제약 없음. 수정: 텍스트 링크만, 위젯·외부 스크립트 0, `rel="sponsored nofollow noopener"`, beacon, 표시 조건 = affiliate_items.json 행 ≥1.
- TL13 [누락] K4 GA4 탐색 퍼널은 자동 수집 불가. 수정: eventCount(generate_lead) ÷ eventCount(form_start), Data API runReport(T-205), 모수 = 분석 동의, 키 없으면 needs-key.
- TL14 [누락] 리드 데이터 흐름 문장만. 수정: P-06→submit-lead→admin-leads→A-01→metrics-agg mermaid 1개 + 단계별 키 이름.
- TL15 [모호] K5 ID가 95 충돌 ID K1~K18과 겹침. 수정: KPI-01~KPI-13 또는 "95-K5" 표기.
- TL16 [모호] V2 "의료 사실 문장" 기계 판정 불가. 수정: 숫자+단위 포함 문장에 각주 0이면 빌드 실패 + 예외 해시.
- TL17 [모호] V3 일치 비교 대상 미정. 수정: frontmatter `summary` 단일 원본 → 박스·`MedicalWebPage.abstract`·`FAQPage.mainEntity[0].acceptedAnswer.text`, 단위 테스트.
- TL18 [모호] K1 "형식 오류 제외" 판정 주체 없음. 수정: submit-lead 검증 실패 400·insert 0, K1에서 문구 삭제.
- TL19 [모호] 체크리스트 사람 판정 4개: (a) tagline 문자열 존재 (b) TASKS `기한:YYYY-MM-DD` 토큰 (c) 로그인 0개는 `/admin/**` 제외+검사 문자열 목록 (d) "건당 수수료(?!\s*0원)".
- TL20 [모호] Q3·S2 github.io 속성 "4일 앞당김"은 K6에 무효(basePath 변경). 수정: K6 경과일 기준 = 도메인 속성 사이트맵 제출일.

### spec-content-lead (18)
- CL1 [충돌] 3-8 결정 2 허용 4 "이용료는 0원" — 95 B08 허용 문구("무료 상담 예약"·"상담 연결 무료") 밖. 수정: "…첫 연락을 드립니다. 상담 연결 무료", 0원 예문 삭제.
- CL2 [충돌] RM2 "목록 상단 고정+'광고'" vs 제외 "노출 순서 판매". 수정: 제외 = "'광고' 라벨·심의번호 없는 순서 변경, '추천'·'인기' 표기 순서".
- CL3 [충돌] 미완본 시술 페이지 sitemap·색인 규정 없음, K6 저하, URL 25~33 산식 없음. 수정: 색인 = 완본만, 미완본 noindex+sitemap 제외, URL 수 산식.
- CL4 [충돌] P-10 M2 허용 vs S12 블로그 11-10·11-17 게시 → 원문 없음. 수정: P-10 M1로 또는 canonical·게시 순서 명시.
- CL5 [충돌] 경쟁 표의 타사 사실 주장(홈 1장 관찰), D8 공개 범위 미정 → 95 B07·L1. 수정: D8 비공개, 사실 주장 칸마다 관찰일·캡처 경로.
- CL6 [누락] "완본 가이드" 합격 조건 없음, 교차검증 출처 종류 제한 없음. 수정: 각주 100%+출처 ≥3+FAQ 5~8+요약+수정일, 교차검증 = 서로 다른 기관 2곳·'기타' 등급만 불가.
- CL7 [누락] 자문의 미정(T-009/T-012)이 마일스톤에 없음. 수정: S13 자문의 섭외(사람, 기한), 미확보 시 M4까지 '검토 전' + D8 1줄, 3-6에 "기본값 = 95 S0".
- CL8 [누락] B13 미탐: "89만부터", "만 원대부터/이상부터", "억", 한글 숫자, ₩·KRW, 전각 틸데. 수정: 금지 예문 6종 추가 + 정규식 반영.
- CL9 [누락] B13 오탐·범위: "~약", 소수점 "1.5만 원", 허용 문맥 면제, 표 셀·JSON-LD·meta·alt·SVG. 수정: 허용 9~11 + 문장 경계·검사 대상 1줄.
- CL10 [누락] "상담 가이드 제공" 범위 — 95 3-11 경계. 수정: 응대 = 접수 확인·본인 확인·정보 출처 안내, 시술 권유·병원 추천·가격 협상 0, 스크립트는 20-content.
- CL11 [누락] `/insights` 공개 상담 건수·CPL이 이용자에게 B06 취지와 닿음. 수정: 상단 "운영 지표(채용 심사용)·시술 선택 기준 아님", 이용자 동선 링크 0.
- CL12 [누락] RM1 "회복기 추천템" 효능 문구 규칙 없음. 수정: "회복기 관리 용품(광고)", 제조사 사실만, 효능·'추천' 0.
- CL13 [누락] V5 날짜만 갱신 방지 없음. 수정: updated_at은 수치·출처·권고 문장 변경 커밋에서만, MDX `changelog`.
- CL14 [모호] AEO 질문·네이버 키워드 20개 ↔ 가이드 매핑 없음, U2 성공 기준 외부 통제. 수정: 질문·키워드별 slug·완본 마일스톤 표(S10·S11 전), U1·U2 시술은 M2 6편 포함.
- CL15 [모호] V7 "클릭 ≤3 (입력 조작 제외)" 동의 체크 포함 여부. 수정: 동의 클릭 포함, 사전 체크 0, 일괄 동의는 95 3-6.
- CL16 [모호] 상호 "리얼"과 B06. 수정: "리얼성형" 전체 표기 허용, "리얼" 단독·"리얼+후기·사례·경험" 위반.
- CL17 [모호] V3 "AI 답변용" 라벨, 문장당 40~60자, 회복기간 정의. 수정: 라벨 "3줄 요약", 문장당 40~60자, 회복기간 = 일상 복귀(20-content).
- CL18 [모호] 허용 예문 "병원 3곳이 안내"는 가상 병원 인용 조작. 수정: 학회·공공 자료 예문, fixture 머리에 "콘텐츠 복사 금지".

### hiring-reviewer (15) — 판정 request-changes, 채용 "아니오"
사유: ① 경쟁 비교가 홈 화면 대비(V2·V4·V5 실제 차별점 아님) ② 광고 숫자 설계(검색 CPL 설계상 표본 부족, 메타 제한 분기 없음) ③ 데이터 정합성(눈 4개+타 부위 6개, 가상 병원 색인·JSON-LD, view_count 4820) ④ AEO에 '느린 신호 먼저' 미적용.
- HR1 [충돌] "눈 1개 카테고리 완본, 시드 10개" — 시드 중 눈은 4개. 수정: 눈 4편 완본 + 나머지 6개 noindex·sitemap 제외, URL 수 재계산, C14.
- HR2 [충돌] V2·V4·V5 잠정값이 경쟁사 홈 대비 — 강남언니 콘텐츠 상세엔 업데이트일·각주·논문·FAQ 있음, 우리 출처는 루트 URL. 수정: 비교 대상 `unni.app/contents/{id}`·`babitalk.com/search?keyword=쌍꺼풀` 고정, V5 제외, V2 = 페이지 단위 URL·DOI·PMID·루트 도메인 0, V7(로그인 게이트·앱 설치) 1순위.
- HR3 [충돌] 경쟁 표 D8 전용 vs 90 R4·D3 공개, 00 8행 vs 90 3-9 7행. 수정: D8 경쟁 표 = 00 3-3 단일 원본, `/insights#aeo` 타사 열 익명화 또는 평가어 0, C15.
- HR4 [충돌] K2 검색 CPL 목표 달성해도 표본 부족 + 95 3-6 숨김 → D8 빈칸. 수정: 예산 증액 needs-approval 또는 D8 칸을 검색광고 운영 지표(유지/제외 판정 수, CTR·CPC)로, K2는 D5만.
- HR5 [충돌] S9 메타 랜딩 `/procedures/쌍꺼풀-수술` vs 95 3-6(메타 URL 시술명 0, 픽셀 P-12·06·07만). 수정: 랜딩 = ASCII P-12 `/lp/c2611a`, C16.
- HR6 [누락] AEO 측정(11-10)이 가이드(M2 6편)보다 먼저. 수정: S13 질문↔가이드 매핑, 매핑 가이드 배포 11-03, T-300~305를 느린 신호 목록에.
- HR7 [누락] 가상 병원 색인·MedicalClinic JSON-LD. 수정: is_demo = noindex+sitemap 제외+JSON-LD 0, P-05 validator는 T-306 병원 또는 "해당 없음".
- HR8 [누락] D8 숫자에 GA4·GTM·JSON-LD 0. 수정: K14 전환 대조율(GA4÷leads ≥50%·초과 0), K15 이벤트 수신 n/21·validator 오류 0, D8 1칸 = K14.
- HR9 [누락] "상담 가이드" 정의 없음, 95 3-11 밖. 수정: 시술별 문자·PDF 1건(확인 질문+가격 범위+공개 병원 목록), 진단·추천 0, 95 3-11에 영역 추가 선행.
- HR10 [누락] 가격 조사 계획 없음, view_count 4820 지어낸 숫자. 수정: 시술당 공개 가격 ≥5곳·페이지 URL·조사일 ≤30일·M1까지 쌍꺼풀, 미달 동안 "예시 가격" 라벨 수 공개, view_count 시드 삭제.
- HR11 [누락] 메타 Lead 제한 분기 목표 없음, CPL↔리드 수 순환 산식. 수정: CPL 외부 근거 1개, "랜딩 조회 최적화" 분기 K1·K3 행.
- HR12 [모호] 원칙 2 공식 vs S2 기한(10-26 vs 10-28), K6 판정일 불명. 수정: K6 판정일 1개, S2 재계산.
- HR13 [모호] github.io robots·llms.txt 미적용(=TL4).
- HR14 [모호] K12·K13 포트폴리오 전용·자기 판정을 D8에. 수정: 5절 게이트로 이동, D8 연결 삭제.
- HR15 [모호] U1 "≤90초" 측정 방법 없음, 체크리스트 1 글자 단위 비교 vs 요일 표기. 수정: GA4 view_procedure→generate_lead 같은 세션 중앙값(40 위임), "날짜 값 5개 일치(요일 제외)".

## 반영 표
spec-product-lead, 00-product v2 (2026-10-25). 53건 중 반영 50, 부분 반영 3(HR2·HR11·CL5, 사유 기재), 미반영 0. 다른 문서 수정이 필요한 항목은 00에 기본값 + 7절 충돌(C14~C27) + 8절 Q(Q8~Q15).

| ID | 반영/사유 | 위치(절) |
| --- | --- | --- |
| TL1 | 반영 — flight 시작 조건 = T-500 + 실 키 4종 hasKey + x-internal-token is_demo 리드 왕복 1건, mock 배포는 P-06 제출 비활성 + "상담 접수 준비 중". 키 이름은 70 위임 | 3-9-1 S8, 3-9-2 M1, 5절 |
| TL2 | 반영 — `metrics-agg` 건수만 → `reports/leads/agg.json`, `reports/leads/*.csv` gitignore, 90 leads.csv 대조 대체 | 3-4 KPI-01, 3-5, 5절, C19 |
| TL3 | 반영 — A-01 최소판(목록·상태 변경·로그)을 M1 종료 조건·S16으로 | 3-9-1 S16, 3-9-2 M1, C26 |
| TL4 | 반영 — M0 = `/realsurgery/sitemap.xml` 200 + 제출 캡처, 루트 3파일은 도메인 연결일 + 1일 | 3-9-2 M0, S2b, C20 |
| TL5 | 반영 — 타사명 검사 대상 = 이용자 화면 + 광고 소재, `out/insights/**`·`out/deliverables/**` 제외, 95 규칙 추가는 Q9 | 3-3 타사명 규칙, 5절, Q9 |
| TL6 | 반영 — `x-internal-token` 검증 시에만 is_demo, is_demo는 Resend·CAPI·generate_lead 0, `utm_source=internal` 단독 무효 | 3-4 공통 규칙, 3-5, 5절, C17, Q10 |
| TL7 | 반영 — 빌드 작업은 자기 선행 정의서만 승인되면 시작, M0 n일 지연 → M1 = 11-09 + n | 3-9-1 하단, 3-9-3, C26 |
| TL8 | 반영 — metrics.json 값 스키마(value·unit·status·period·source·captured_at), 복합은 `.sub`, mock = null + needs-key, zod 검증 실패 시 빌드 실패 | 3-4 공통 규칙, 5절 |
| TL9 | 반영 — Actions cron `0 1 * * 1` → metrics-agg → build-metrics → build → deploy, 70 위임, builder(T-141) | 3-4 공통 규칙, 4절 |
| TL10 | 반영 — 세션 첫 페이지뷰에서 landing_referrer·utm_* sessionStorage → P-06 숨김 필드, 네이버 오가닉 = search.naver.com·m.search.naver.com, blog.naver.com = referral | 3-5, 3-10 결정 1 |
| TL11 | 반영 — `reports/ops/milestones.json` 키 8개 | 3-5, 3-9-3, 5절 |
| TL12 | 반영 — 텍스트 링크만, 위젯·외부 스크립트 0, rel sponsored·nofollow·noopener, beacon, 표시 조건 행 ≥ 1 | 3-6 RM1 기술 제약, 5절 |
| TL13 | 반영 — KPI-04 = Data API runReport eventCount 비율, 모수 = 분석 동의, 키 없으면 needs-key | 3-4 KPI-04 |
| TL14 | 반영 — mermaid 1개 + 단계별 키 이름 표 | 3-5 |
| TL15 | 반영 — KPI-01~KPI-13, 게이트 G1·G2, 충돌 C, 질문 Q로 ID 분리 | 머리말, 3-4 |
| TL16 | 반영 — 숫자+단위 문장 각주 0 = 빌드 실패, 예외는 문장 해시 | 3-8-1 F1, 3-3 V3 |
| TL17 | 반영 — frontmatter `summary` 단일 원본 → 박스·abstract·FAQ[0] 답변, 단위 테스트 | 3-8-1 F4, 5절 |
| TL18 | 반영 — 형식 오류는 submit-lead 400·insert 0, KPI-01에서 문구 삭제 | 3-4 KPI-01, 3-5 |
| TL19 | 반영 — (a) `가입 없이 2단계` 문자열 (b) TASKS `기한:YYYY-MM-DD` 토큰 (c) `/admin/**` 제외 + 문자열 목록 (d) `건당\s*수수료(?!\s*0\s*원)` | 5절 |
| TL20 | 반영 — KPI-06 경과일 기준 = 도메인 속성 사이트맵 제출일, github.io 속성은 집계 0(S2b 점검용), Q3 종결 | 3-4 KPI-06, 3-9-1 S2·S2b, Q3 |
| CL1 | 반영 — 허용 4를 "…상담 연결 무료입니다"로 교체, 0원 예문 삭제 | 3-10 결정 2 |
| CL2 | 반영 — 제외 = "'광고' 라벨·심의번호 없는 노출 순서 변경, '추천'·'인기' 표기 순서" | 3-6 |
| CL3 | 반영 — 색인 = 완본만, 미완본 noindex + sitemap 제외, sitemap URL 수 산식 | 3-1, 3-8-1, 5절 |
| CL4 | 반영(대안) — P-10을 범위 밖으로 빼고 블로그 원문 링크 = P-03 완본(90 3-8-1 "시술 가이드 요약 + 원문 링크"와 일치) | 1절 범위 밖, 3-9-1 S12 |
| CL5 | 부분 반영 — 경쟁 사실 칸마다 관찰일·URL(O1~O3), 평가어 0, `/deliverables/` noindex + 이용자 화면 링크 0. 사유: GitHub Pages 공개 저장소라 D8 PDF 완전 비공개는 불가 | 3-1, 3-3, Q9 |
| CL6 | 반영 — 완본 조건 F1~F8(각주 100%, 출처 ≥ 3·서로 다른 기관, FAQ 5~8, 요약, 가격 ≥ 5곳, 갱신 규칙), 교차검증 = 서로 다른 기관 2곳 | 3-8-1 |
| CL7 | 반영 — S15 자문의 섭외(사람, 11-16), 미확보 시 M4까지 95 S0 + D8 1줄 | 3-9-1 S15, 3-7, Q15 |
| CL8 | 반영 — 금지 예문 7~14 추가(만부터·원대부터·이상부터·억·한글 숫자·₩·KRW·전각 틸데), 정규식 반영 | 3-10 결정 2 |
| CL9 | 반영 — 허용 9~11(~약, 소수점, 표 셀), 검사 대상·문장 경계 1줄 | 3-10 결정 2 |
| CL10 | 반영 — 응대 = 접수 확인·본인 확인·안내 문자, 진단·권유·병원 추천·가격 협상 0, 원고 20-content | 3-1 상담 가이드, 3-7, C27, Q13 |
| CL11 | 반영 — `/insights` 상단 "운영 지표(채용 심사용) — 시술·병원 선택 기준이 아닙니다", noindex, 이용자 동선 링크 0 | 3-1, 5절 |
| CL12 | 반영 — 영역 이름 "회복기 관리 용품(광고)", 제조사 사실만, 효능·"추천" 0 | 3-6 RM1, C22 |
| CL13 | 반영 — updated_at은 수치·출처·권고 문장 변경 커밋에서만, MDX `changelog[]` | 3-8-1 F7 |
| CL14 | 반영 — AEO 질문 20개·순위 키워드 20개 ↔ 눈 4개 slug 매핑 표, U1·U2 시술은 11-03 완본에 포함 | 3-8-2, 3-8-3, 3-2 |
| CL15 | 반영 — 동의 클릭 포함: 화면 전환 3 + 필수 동의 2 = ≤ 5(전체 동의 시 4), 사전 체크 0 | 3-3 V6 |
| CL16 | 반영 — "리얼성형" 전체 표기만, "리얼" 단독·조합 0, 검사 정규식 `리얼(?!성형)` | 3-1, 5절 |
| CL17 | 반영 — 라벨 "3줄 요약", 문장 3개·문장당 40~60자, 회복기간 = 일상 복귀 | 3-3 V4, 3-8-1 F4, C23 |
| CL18 | 반영 — 가상 병원 안내 인용 예문을 학회·공공 자료 원문 예문으로 교체, fixture 첫 줄 "콘텐츠로 복사 금지" | 3-10 결정 2 |
| HR1 | 반영 — 시드 눈 4개 명시, 눈 4편 완본 11-03 + 비눈 6편 11-17(완본 통과분만 색인), 나머지 noindex, URL 수 재계산 | 1절 가정, 3-1, C14 |
| HR2 | 부분 반영 — 비교 대상을 O1 `unni.app/contents/{id}`·O2 `unni.app/events/85230`·O3 `babitalk.com/search?keyword=쌍꺼풀`로 고정, 홈 비교 삭제, 갱신일 차별점 삭제, V3 = 페이지 단위 URL·DOI·PMID·루트 도메인 0, V1 = 로그인·앱 설치 1순위. 사유: 2026-10-25 O1 렌더 텍스트에서 업데이트일은 확인, 학술 각주·FAQ는 0으로 관찰 → "잠정" 표기 후 T-090 스크린샷으로 확정 | 3-3, C15 |
| HR3 | 반영 — D8 경쟁 표 단일 원본 = 00 3-3(7행), `/insights#aeo` 타사명 + 측정값만·평가어 0 | 3-3, C15, Q9 |
| HR4 | 반영 — 검색 CPL은 설계상 표본 부족임을 명시하고 D8에서 제외, D8 칸 = 검색어 판정 수·CTR(KPI-02 a·b), 예산 증액은 Q11 needs-approval 후보(+68,300원 산식) | 3-4 KPI-02·C, Q11, C18 |
| HR5 | 반영 — 메타 랜딩 = P-12 `/lp/c2611a` 11-10부터, M1에 P-12 1안 | 3-9-1 S7·S9, 3-9-2 M1, C16 |
| HR6 | 반영 — S13 AEO 대상 가이드 눈 4편 11-03 배포(T-300~T-303), 질문↔가이드 매핑, 원칙 2에 AEO 순서 명시 | 2절 원칙 2, 3-8-2, 3-9-1 S13 |
| HR7 | 반영 — is_demo 병원 noindex + sitemap 제외 + MedicalClinic 0, P-05 검사는 T-306 병원 또는 "해당 없음" | 3-1, 5절, C21 |
| HR8 | 반영 — KPI-12 전환 대조율(≥ 50%·초과 0), KPI-13 이벤트 수신 n/21·validator 오류 0, D8 1칸 = KPI-12 | 3-4 A·B·C, Q12 |
| HR9 | 반영 — 상담 가이드 = 시술별 안내 문자 1건(확인 질문 5 + 가격 범위·출처 + 공개 병원 이름순), 진단·추천 0, 95 3-11 영역 추가 선행 | 3-1, 3-7, C27, Q13 |
| HR10 | 반영 — 시술당 공개 가격 ≥ 5곳·페이지 URL·조사일 ≤ 30일·쌍꺼풀 M1, "예시 가격" 라벨 수 공개, view_count 표시·정렬 0(시드 삭제는 Q14) | 3-8-4, 3-8-1 F6, C24, Q14 |
| HR11 | 부분 반영 — 메타 제한 분기(랜딩 조회 최적화 → 랜딩 조회당 비용 + 리드 수) KPI-01·03 행에 추가, 순환 산식 제거(R2 목표 = R1 실측). 사유: CPL 외부 근거를 2026-10-25 검색에서 확보하지 못해 사전 목표 CPL은 두지 않음 | 3-4 KPI-01·03 |
| HR12 | 반영 — KPI-06 판정일 2026-12-08 1개, S2 한도 11-10(= 12-08 − 28일), 원칙 2 예시 일치 | 2절, 3-4 KPI-06, 3-9-1 S2 |
| HR13 | TL4와 동일 반영 | 3-9-2 M0, C20 |
| HR14 | 반영 — K12·K13을 게이트 G1·G2로 이동, D8 숫자에서 제외 | 3-4 D, 2절 원칙 1 |
| HR15 | 반영 — U1 소요 시간 = form_start → generate_lead 같은 세션 중앙값(40 측정 방법 확정), 체크리스트 1 = 날짜 값 5개(요일 제외) | 3-2 U1, 5절 |

### r2 반영 (00-product v3, 2026-10-25)
8건 전부 반영, 미반영 0. HR2·HR11 잔여분은 R2-1·R2-4 행으로 처리.

| ID | 반영/사유 | 위치(절) |
| --- | --- | --- |
| R2-1 | 반영 — O1b `unni.app/contents/3f9d9338-d3d4-80da-916a-f41425fe332d`를 WebFetch로 열어 확인(업데이트 2026.10.23, 문장 부착 각주 3 + "인용한 자료" 3건·Europe PMC 링크·DOI 0, FAQ 2, 의료 검토 표기 0, 시술 가격 0). 비교 기준 = 가장 최근 형식(O1b), O1은 참고로 강등. V3 = "숫자+단위 문장 100% 각주(빌드 실패) vs O1b 문서당 3개", V4 = "FAQ 5~8 + FAQPage JSON-LD vs O1b FAQ 2(JSON-LD 유무는 T-090)". HR2 잔여분 해소 | 3-3 비교 대상 표·V1·V3·V4, 3-2 U2, C15 |
| R2-2 | 반영 — agg `by_source` = `{naver_ads, naver_organic, meta, other_organic, referral, direct}` + 분류 순서 6단계, 결정 1과 키 이름 일치 | 3-5 집계 행, 3-10 결정 1, 5절 |
| R2-3 | 반영 — F6을 색인 조건에서 빼고 라벨 조건으로(미달·만료 = "예시 가격" 라벨만, robots·sitemap 변경 0, 예 12-03 만료 → 재조사 기한 12-02). 3-1·3-8-4·체크리스트 3번과 일치 | 3-1 시술 행, 3-8-1 머리·F6, 3-8-4, 5절 |
| R2-4 | 반영 — 메타 CPL = flight 21일 누적 1개, 주간·R1·R2 CPL 산출 0, R1·R2 비교 = CTR·CPC·랜딩 조회당 비용(3개 중 2개 개선 = "개선" 기록, 목표 아님). KPI-01 메타 몫 9 → 5(90 D6 하한, "CPL 목표 아님" 명시), 목표 15 → 11. "168,000÷9" 산식 삭제. HR11 잔여분(외부 근거 없는 목표) 해소: 목표 CPL 0개 | 3-4 KPI-01·KPI-03·산식 주석, Q2, C5, C29 |
| R2-5 | 반영 — D8 = 6칸 × 3요소 = 18칸(90과 칸 수 동일). 칸 3 = KPI-02 (a)+(b), 칸 4 = KPI-06 (a)+(b) 병합, 칸별 표기 예 표. 90과의 내용 차이 3칸은 C18에 기록 | 3-4 C, 5절, C18, Q12 |
| R2-6 | 반영 — 가상 병원 P-05 상담 CTA = 병원 지정 없음(`/consult?procedure={id}`, clinic_id 0) + 고지 "예시 병원입니다 — 실제 병원이 아니며 이 병원으로 상담이 연결되지 않습니다". M1 흐름 유지를 위해 CTA 삭제 대신 고지 방식 선택. S8 flight 조건에 포함 | 3-1 가상 병원 상담 동선, 3-9-1 S8, 5절, C28 |
| R2-7 | 반영 — KPI-06에 (b) 서치콘솔 노출·클릭 2026-11-10~12-07 4주 합계 병기(목표 없음, 실측), D8 칸 4 = 색인률 · 노출 · 클릭 | 3-4 KPI-06·C |
| HR15 | 반영 — 구간 2개 정의: (b) Job 전체 view_procedure → generate_lead 중앙값 ≤ 300초(잠정), (c) 폼 form_start → generate_lead 중앙값 ≤ 90초. 측정 방법은 40 | 3-2 U1 |

### r3 후속 반영 (00-product v3.1, 2026-10-25, hiring-reviewer approve·채용 예)
5건 전부 반영, 미반영 0.

| ID | 반영/사유 | 위치(절) |
| --- | --- | --- |
| R3-1 | 반영 — "예시 가격" 상태 페이지는 FAQ 가격 답변(3-8-2 질문 3·8·13·17)·3줄 요약·JSON-LD 문자열에 금액 0개, 대신 "병원 공개 가격 조사 중(기한 YYYY-MM-DD)" | 2절 원칙 5, 3-8-1 F5, 3-8-4 미달 표시 |
| R3-2 | 반영 — by_source 8키(naver_ads·meta·ai_referral·naver_organic·google_organic·other_organic·referral·direct), 분류 순서 ①~⑧ 고정(gemini.google.com이 google_organic보다 먼저 ai_referral로), 체크리스트 "키 8개" | 3-5 집계 행, 3-10 결정 1, 5절 |
| R3-3 | 반영 — KPI-13 (c) GTM 컨테이너 버전·태그 수·Preview 캡처, 제출물 D4(a·c) | 3-4 KPI-13 |
| R3-4 | 반영 — KPI-02 (d) 분모 = agg.json `by_source.naver_ads` | 3-4 KPI-02 |
| R3-5 | 반영 — V2 "n ≥ 5, 미달·만료 시 '예시 가격' 라벨" | 3-3 V2 |

## 4. 승인
- hiring-reviewer r3: **approve, 채용 예** (v3 대상, R2-1~R2-7·HR15 본문 확인). 후속 5건(R3-1~R3-5) → v3.1 반영.
- VERIFY: README 6개 절 존재 / `node scripts/lint-spec.mjs docs/specs/00-product.md` exit 0 / 지적 66건(r1 53 + r2 8 + r3 5) 전부 반영 또는 사유 / 검수 체크리스트 ≥ 10 / 타 문서 충돌 C1~C29는 기록만(08-specs ACT 6, T-088에서 수정).
- 남은 리스크: ① M1(11-09) 범위 증가(P-12·A-01 최소판·실키 flight 조건) — 지연 규칙으로 flight 이동 ② 눈 4편 완본 + 가격 조사 11-03까지 9일 ③ 90·95 수정(T-088) 전까지 문서 간 불일치, 95 우선.
