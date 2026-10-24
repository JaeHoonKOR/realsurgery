# 성형 정보·상담 예약 플랫폼 화면 정의서

- 작성일: 2026-10-24 · 작성자: JAE HOON LEE
- 원본 문서(편집용): https://claude.ai/artifact/JCAM4nxxbQzuhfLqpKxtnG
- 이 파일은 에이전트가 읽는 **단일 진실 소스(SSOT)** 다. 변경은 원본 문서 → 이 파일 순서로 동기화한다.

## 1. 서비스 개요

**가칭 "리얼성형"** — 성형 시술 정보·병원 비교·무료 상담 예약 플랫폼. 지원 기업(성형외과 개발팀)이 요구하는 전환 퍼널(검색 유입 → 시술 가이드 → 병원 → 상담 예약 → 광고 리타게팅)을 실서비스에서 직접 운영하고, 그 숫자를 포트폴리오에 넣는 것이 목표다.

| 항목 | 정의 |
| --- | --- |
| 핵심 가치 | 시술별 "가격·회복기간·부작용"을 한 화면에서 비교하고, 병원에 무료로 상담 예약 |
| 1차 타겟 | 20~34세 여성, 눈·코·안면윤곽·리프팅·피부 시술 검색자 (서울·경기) |
| 2차 타겟 | 일본·중국·동남아 의료관광 수요 (다국어는 2단계) |
| 경쟁 서비스 | 강남언니, 바비톡, 여신티켓 — 차별점은 "AI 검색(AEO) 노출 최적화된 시술 가이드"와 가격 투명성 |
| 핵심 KPI | 월 상담 예약(리드) 수, 리드당 비용(CPL), 시술 키워드 상위 10위 진입 수, AI 답변 인용 수 |

### 수익 모델 (우선순위순)

| 순위 | 모델 | 방식 | 비고 |
| --- | --- | --- | --- |
| 1 | 병원 프리미엄 노출 | 병원 상세·목록 상단 고정, 월 정액 | 의료광고 사전심의 대상 — 배너·문구는 심의 후 게시 |
| 2 | 뷰티·회복 제품 제휴 | 시술 상세 하단 "회복기 추천템" 쿠팡파트너스 링크 | 초기 현금흐름, 심의 불필요 |
| 3 | 병원 트렌드 리포트(B2B) | 시술 검색량·리드 전환 데이터 월간 리포트 판매 | 리드 100건 이상 쌓인 뒤 |
| 4 | 상담 예약 매칭 | 사용자↔병원 무료 연결 | **건당 수수료는 받지 않음** (법적 고려) |

### 법적 고려 (반드시 지킬 것)

- 의료법 제27조 3항: 영리 목적 환자 소개·알선 대가 금지 → 예약 건당 수수료 모델 사용 금지, 광고(노출) 모델만. 운영 전 변호사 검토 1회 권장.
- 네이버 서치어드바이저는 하위 경로(`user.github.io/realsurgery`) 등록 불가 → 네이버 SEO를 하려면 **커스텀 도메인 필수**(T-000). 구글 서치콘솔은 URL 접두어 속성으로 하위 경로 가능.
- 의료광고 사전심의: 병원 광고 배너·시술 효과 문구는 의료광고심의위원회 심의 필요. 플랫폼 자체 시술 정보는 "의료 정보 콘텐츠"로 분리하고 출처(학회·논문) 명시.
- 환자 후기: 치료 경험담 광고 제한 → 후기는 평점 광고가 아닌 "이용 후기" 성격, 병원 랭킹에 사용 금지.
- 개인정보: 상담 폼은 민감정보(시술 부위) 포함 → 수집·이용 동의 별도, 병원 제3자 제공 동의 별도, 보관 기간 명시.

## 2. 사이트맵 및 화면 목록

총 17개 화면. P0 8개로 MVP를 열고, P1·P2는 리드가 쌓이는 순서대로 붙인다.

| ID | 화면명 | URL | 우선순위 | 핵심 역할 |
| --- | --- | --- | --- | --- |
| P-01 | 메인 | / | P0 | 시술 검색 진입, 인기 시술·병원, CTA |
| P-03 | 시술 상세 가이드 | /procedures/{slug} | P0 | SEO·AEO 핵심 랜딩. 가격·회복·부작용·FAQ |
| P-05 | 병원 상세 | /clinics/{slug} | P0 | 병원 정보·시술 가격표·상담 예약 CTA |
| P-06 | 무료 상담 예약 폼 | /consult | P0 | 리드 수집. 전환 이벤트의 중심 |
| P-07 | 예약 완료 | /consult/done | P0 | generate_lead 전환 확정 페이지 |
| P-12 | 광고 랜딩 | /lp/{campaign} | P0 | 메타 광고 전용 단일 목적 랜딩 |
| A-01 | 관리자 리드 관리 | /admin/leads | P0 | 리드 상태·병원 전달·UTM 확인 |
| C-01 | 약관·개인정보처리방침 | /terms, /privacy | P0 | 법적 필수 |
| P-02 | 시술 카테고리 목록 | /procedures | P1 | 부위별 시술 탐색 |
| P-04 | 병원 목록·비교 | /clinics | P1 | 지역·시술 필터, 최대 3곳 비교 |
| P-08 | 가격 비교 | /prices/{procedure} | P1 | 시술별 병원 가격 범위 |
| P-10 | 칼럼·블로그 | /blog/{slug} | P1 | 롱테일 키워드 콘텐츠 |
| A-02 | 콘텐츠·병원 CMS | /admin/content | P1 | 시술·병원·칼럼 등록 |
| A-03 | 성과 대시보드 | /admin/dashboard | P1 | GA4·메타 광고·리드 통합 지표 |
| P-09 | 후기·Q&A | /qna | P2 | UGC, 질문형 롱테일 키워드 |
| P-11 | 로그인·마이페이지 | /my | P2 | 예약 내역, 관심 시술 |
| C-02 | 404·에러 | /404 | P2 | 인기 시술 링크로 복귀 유도 |

URL 규칙: 소문자·하이픈. slug는 **한글 URL 허용**(네이버 검색 가중치) — 예: /procedures/쌍꺼풀-수술. 영문 별칭은 301 리다이렉트.

## 3. 공통 요소

모든 화면은 모바일 우선(375px 기준). CTA "무료 상담 예약"은 어느 화면에서든 1탭 안.

| 요소 | 구성 | 동작·규칙 |
| --- | --- | --- |
| 헤더 | 로고, GNB(시술 가이드·병원 찾기·가격 비교·칼럼), 검색창, CTA 버튼 | 스크롤 시 축소 고정. 검색은 시술명 자동완성(최대 5개) |
| 모바일 하단 고정 바 | 전화 · 카카오톡 상담 · 무료 상담 예약 | P-03·P-05·P-12에서만 노출. 각 버튼은 별도 이벤트 |
| 푸터 | 사업자 정보, 이용약관, 개인정보처리방침, 의료 정보 면책 문구, 운영 시간 | 면책: "본 정보는 의료 조언이 아니며 진단·치료는 의료진 상담 필요" |
| 브레드크럼 | 홈 › 시술 가이드 › 눈 › 쌍꺼풀 수술 | BreadcrumbList JSON-LD 동시 출력 |
| 상담 예약 CTA 블록 | 제목, 1줄 혜택, 버튼 | 콘텐츠 페이지 본문 중간·하단 2회. location 파라미터로 구분 |
| 쿠키·동의 배너 | GA4·메타 픽셀 동의 토글 | Consent Mode 기본 denied, 동의 후 업데이트 |
| 공통 스크립트 | GTM 컨테이너 1개 → GA4, Meta Pixel, 네이버 애널리틱스, 네이버 서치어드바이저 메타태그 | 모든 태그는 GTM 안에서만 관리, 하드코딩 금지 |
| SEO 공통 | title·description 템플릿, canonical, OG·트위터 카드, hreflang(2단계) | 6절 |
| 로딩·에러 상태 | 스켈레톤 UI, 폼 제출 실패 시 재시도 안내 | LCP 2.5초 이내 |

## 4. 화면별 상세 정의 (P0)

### P-01 메인 (/)

| 영역 | 구성 요소 | 기능·규칙 | 데이터 | 이벤트 |
| --- | --- | --- | --- | --- |
| 히어로 | H1 "시술 가격·회복기간, 한 번에 비교", 시술 검색창, CTA | 검색 자동완성 → P-03 | procedures.name | search, click_cta(location=hero) |
| 부위별 바로가기 | 눈·코·윤곽·리프팅·피부·가슴 아이콘 6개 | P-02(또는 대표 시술 P-03) | categories | select_category |
| 인기 시술 TOP 6 | 카드(썸네일, 시술명, 가격 범위, 회복기간) | 주간 조회수 자동 정렬 | procedures + view_count | select_procedure |
| 추천 병원 | 카드(병원명, 지역, 대표 시술 3개, 프리미엄 뱃지) | 프리미엄 상단 고정, 심의번호 표기 | clinics(is_premium) | select_clinic |
| 최신 칼럼 3 | 제목·요약·날짜 | P-10 | posts | select_post |
| 하단 CTA | 상담 예약 블록 | P-06 | — | click_cta(location=footer) |

### P-03 시술 상세 가이드 (/procedures/{slug})

SEO·AEO 핵심 화면. 첫 문단에 직답 2~3문장, 본문은 질문형 H2.

| 영역 | 구성 요소 | 기능·규칙 | 데이터 | 이벤트 |
| --- | --- | --- | --- | --- |
| 상단 요약 박스 | 시술명(H1), 직답 요약, 가격 범위·소요시간·회복기간·마취 방식 4칸 | 요약 박스 = FAQPage·MedicalProcedure JSON-LD와 동일 값 | procedures.* | view_procedure |
| 목차 | H2 앵커 목록 | 스크롤 추적 | — | scroll_depth(25/50/75/100) |
| 본문 섹션 | "누가 받나", "비용은 얼마", "회복은 며칠", "부작용·주의", "비슷한 시술 비교" | 각 H2는 검색 질문 형태. 출처 각주 필수 | procedures.content(mdx) | — |
| 가격 비교 표 | 병원별 최저~최고가 5곳 | 병원명 클릭 → P-05 | clinic_procedures | select_clinic(from=procedure) |
| 중간 CTA | "이 시술 상담 가능한 병원 보기" | procedure_id 유지한 채 P-06 | — | click_cta(location=mid) |
| FAQ | 질문 5~8개 아코디언 | FAQPage JSON-LD | procedure_faqs | expand_faq |
| 회복기 추천템 | 제휴 상품 3개 | 쿠팡파트너스 링크, 광고 표기 | affiliate_items | click_affiliate |
| 관련 시술·칼럼 | 카드 4개 | 내부 링크 | — | select_procedure |
| 메타 | 작성자(의료 자문 포함)·최종 수정일 | E-E-A-T | authors, updated_at | — |

### P-05 병원 상세 (/clinics/{slug})

| 영역 | 구성 요소 | 기능·규칙 | 데이터 | 이벤트 |
| --- | --- | --- | --- | --- |
| 병원 헤더 | 병원명, 지역, 진료과목, 대표원장, 프리미엄 뱃지 | 의료광고 심의번호 표시 | clinics.* | view_clinic |
| 시술 가격표 | 시술명·가격·소요시간 | 병원 제공 값, 갱신일 표기 | clinic_procedures | — |
| 위치·운영시간 | 네이버 지도 임베드, 주소 복사, 운영시간 | 지도 클릭 → 길찾기 | clinics.address, hours | click_map |
| 연락 버튼 | 전화(tel:), 카카오톡 채널, 상담 예약 | 전화·카톡은 `is_partner=true`일 때만 노출(8절 폴백), 즉시 전환 | clinics.phone, kakao_url, is_partner | phone_click, kakao_click, click_cta |
| 병원 소개 | 텍스트, 장비·인증 | 심의 대상 문구 제외 | clinics.description | — |
| 다른 병원 비교 | 같은 시술 가능 병원 3곳 | 가격·거리 기준 | — | select_clinic |

### P-06 무료 상담 예약 폼 (/consult)

단일 페이지, 2단계 폼. 1단계 완료를 중간 전환으로 측정.

| 단계 | 필드 | 유효성·규칙 | 이벤트 |
| --- | --- | --- | --- |
| 1단계: 관심 시술 | 시술(선입력·변경 가능), 희망 지역, 희망 시기(1개월 내·3개월 내·미정) | procedure_id·clinic_id 쿼리 선입력 | form_start |
| 2단계: 연락처 | 이름, 연락처, 연락 가능 시간, 메모(선택) | 휴대폰 형식 검증, 중복 제출 5분 차단 | form_step2 |
| 동의 | 개인정보 수집·이용(필수), 병원 제3자 제공(필수), 마케팅 수신(선택) | 민감정보 안내 | — |
| 제출 | "상담 가이드 받기" | Edge Function `submit-lead` 호출 → lead_id를 sessionStorage에 → P-07 | generate_lead(P-07에서 발화) |
| 숨김 필드 | utm_*, gclid, fbclid, landing_page, referrer | 첫 방문 쿠키 저장 후 주입 | — |

### P-07 예약 완료 (/consult/done)

| 영역 | 구성 요소 | 기능·규칙 | 이벤트 |
| --- | --- | --- | --- |
| 확인 메시지 | "신청 완료. 영업일 1일 내 연락", 접수번호 | lead_id는 세션으로 전달 | generate_lead(value, procedure, clinic, lead_id) — 유일 발화 지점 |
| 다음 행동 | 준비 체크리스트, 관련 시술 2개, 카카오톡 채널 추가 | 재방문 유도 | kakao_add |
| 직접 접근 차단 | 세션 없으면 메인으로 | 전환 중복 방지 | — |

### P-12 광고 랜딩 (/lp/{campaign})

메타 광고 전용. GNB·푸터 링크 제거, 폼 하나. 캠페인마다 slug(예: /lp/eye-2026-11).

| 영역 | 구성 요소 | 기능·규칙 | 이벤트 |
| --- | --- | --- | --- |
| 히어로 | 광고 소재와 같은 헤드라인·이미지, 혜택 1줄 | 소재-랜딩 메시지 일치 | view_lp(campaign) |
| 신뢰 요소 | 제휴 병원 수, 상담 건수, 의료진 자문 | 실제 값만 | — |
| 인라인 폼 | P-06 2단계 폼 임베드 | 제출 후 P-07 | form_start, generate_lead |
| A/B | 헤드라인·CTA 2안 | GTM 실험 또는 Edge 분기 | experiment_variant |

### A-01 관리자 리드 관리 (/admin/leads)

| 영역 | 구성 요소 | 기능·규칙 |
| --- | --- | --- |
| 리드 목록 | 접수일, 이름, 연락처(마스킹), 시술, 병원, 상태, UTM | Edge Function `admin-leads`(JWT admin 검증)로 조회. 연락처는 마스킹, 클릭 시 복호화 값 1회 반환. 상태: 신규·연락중·예약확정·내원·취소. 필터·CSV |
| 리드 상세 | 전체 필드, 랜딩, 유입 경로, 메모 | 상태 변경 시 로그 |
| 오프라인 전환 업로드 | 예약확정·내원 → Edge Function `qualify-lead`가 GA4 MP·메타 CAPI 전송 | 시크릿은 서버에만 |
| 권한 | Supabase Auth 관리자 로그인 (계정은 `scripts/create-admin.ts`가 service role로 생성, 자격은 .env) | 2FA 권장 |

### C-01 약관·개인정보처리방침

- 개인정보처리방침: 수집 항목(이름·연락처·관심 시술=민감정보), 목적, 제3자 제공(병원명 목록), 보유 기간(상담 완료 후 1년), 처리 위탁(Supabase·Vercel), 책임자.
- 이용약관: 플랫폼은 의료 행위·진단 없음, 가격은 참고용, 병원 분쟁 책임 범위.
- 의료 정보 면책 고지를 모든 시술 페이지 하단에 동일 문구로 반복.

## 5. 전환 이벤트 및 GA4/GTM 트래킹 설계

전환은 **generate_lead 1개**로 통일, 전화·카카오톡은 보조 전환. 모든 이벤트는 dataLayer.push → GTM → GA4·메타 픽셀.

퍼널: 유입 → view_procedure → view_clinic → form_start → generate_lead → lead_qualified(오프라인).

| 이벤트명 | 발화 조건 | 파라미터 | GA4 전환 | 메타 픽셀 |
| --- | --- | --- | --- | --- |
| view_procedure | P-03 로드 | procedure_id, procedure_name, category | — | ViewContent |
| view_clinic | P-05 로드 | clinic_id, clinic_name, is_premium | — | ViewContent |
| view_lp | P-12 로드 | campaign, variant | — | ViewContent |
| click_cta | 상담 CTA 클릭 | location, procedure_id | — | — |
| form_start | P-06 1단계 첫 입력 | procedure_id, clinic_id, source_page | — | InitiateCheckout |
| form_step2 | 2단계 진입 | 동일 | — | — |
| generate_lead | P-07 로드(서버 검증 후 1회) | lead_id, procedure_id, clinic_id, value=50000, currency=KRW | **주 전환** | Lead (event_id=lead_id) |
| phone_click | tel: 클릭 | clinic_id, page | 보조 | Contact |
| kakao_click | 카카오 채널 클릭 | clinic_id, page | 보조 | Contact |
| click_affiliate | 제휴 링크 클릭 | item_id, procedure_id | — | — |
| scroll_depth | 25/50/75/100% | percent, page_type | — | — |
| search | 메인 검색 | search_term | — | Search |
| lead_qualified | A-01 "예약확정" 변경 | lead_id, value=200000 | 보조(오프라인) | Schedule (CAPI) |

### GTM 구성
- 컨테이너 1개, 작업공간 dev/live. 태그 명명: `GA4 - Event - generate_lead`, `Meta - Lead`.
- 변수: dataLayer 전체, 쿠키 `_utm`(첫 유입 UTM 90일), `_fbc`·`_fbp`.
- 트리거: 커스텀 이벤트명 기준. 클릭은 `data-track` 속성만, CSS 선택자 의존 금지.
- Consent Mode v2: 기본 denied → 동의 시 granted.
- 디버그: GA4 DebugView + 메타 테스트 이벤트 코드로 배포 전 전수 검증.

### GA4 설정
- 전환: generate_lead(주), phone_click·kakao_click·lead_qualified(보조). 값 KRW.
- 맞춤 측정기준: procedure_id, clinic_id, campaign, variant, location.
- 탐색 보고서 3종 고정: 퍼널, 유입 경로별 CPL, 랜딩별 전환율.
- 오프라인 전환: A-01 상태 변경 → Measurement Protocol lead_qualified(client_id 리드 저장 시 보관).

### 검색 광고 유입 분석
- UTM 규칙: `utm_source=naver|google`, `utm_medium=cpc`, `utm_campaign={시술}_{월}`, `utm_content={소재ID}`.
- gclid 자동 태그 + 구글 애즈 전환 연결. 네이버는 UTM만.
- 주간 리포트: 노출·클릭·CPC·리드·CPL·예약확정률, 채널×시술 매트릭스. A-03 자동 생성.

## 6. SEO/AEO 구조 설계

핵심: P-03의 "요약 박스 = JSON-LD = FAQ" 3중 일치.

### 테크니컬 SEO
| 항목 | 규칙 |
| --- | --- |
| 렌더링 | Next.js SSR/ISR — 콘텐츠 페이지는 서버 HTML |
| URL | 한글 slug 허용, 영문 별칭 301. 쿼리 파라미터는 canonical |
| title | P-03: `{시술명} 가격·회복기간·부작용 총정리 (2026) | 리얼성형` — 60자 이내 |
| description | 직답 1문장 + 가격 범위, 120~150자 |
| 사이트맵 | /sitemap.xml 자동 생성, lastmod. 서치콘솔·서치어드바이저 제출 |
| robots | /admin, /consult/done, /my 차단. llms.txt 제공 |
| 성능 | next/image·WebP, 폰트 서브셋, LCP 2.5초·CLS 0.1 |
| 네이버 | 사이트 메타태그 인증, OG 완비, 블로그·지식iN 외부 유입 |
| 내부 링크 | 시술↔병원↔칼럼 상호 링크, 고아 페이지 0 |

### JSON-LD (페이지별)
| 화면 | 스키마 | 핵심 속성 |
| --- | --- | --- |
| 전체 | Organization, WebSite(SearchAction) | name, url, logo, sameAs |
| P-03 | MedicalWebPage + MedicalProcedure + FAQPage + BreadcrumbList | name, bodyLocation, procedureType, howPerformed, preparation, followup, mainEntity |
| P-05 | MedicalClinic + BreadcrumbList | name, address, geo, telephone, openingHours, medicalSpecialty |
| P-08 | MedicalProcedure + Offer(priceRange) | priceCurrency=KRW, lowPrice/highPrice |
| P-10 | Article | headline, author(Person), datePublished, dateModified |
| P-09 | QAPage | 질문·답변 1쌍 |
| 주의 | AggregateRating **사용 금지** | 의료광고 심의·YMYL 리스크 |

### AEO
- 첫 문단 = 직답 2~3문장(40~60자). H2는 문장형 질문, 바로 아래 한 문단 직답.
- 수치는 표. 출처·작성자·최종 수정일(E-E-A-T). 의료 자문 의사 1인.
- llms.txt 제공. robots에서 GPTBot·ClaudeBot·PerplexityBot 허용.
- 측정: 주 1회 핵심 질문 20개를 ChatGPT·Perplexity·네이버 AI 브리핑·구글 AI 개요에 입력 → 인용 여부 기록(aeo_checks).

## 7. 메타 광고 랜딩 연계 및 Pixel/CAPI

| 항목 | 설계 |
| --- | --- |
| 캠페인 구조 | 캠페인=시술, 광고세트=타겟(관심사/리타게팅/유사), 광고=소재 2~3안 |
| 최적화 목표 | Lead. 리드 50건 미만은 InitiateCheckout으로 학습 |
| 랜딩 | P-12, 소재 헤드라인 = 랜딩 H1 |
| Pixel | GTM 경유 PageView·ViewContent·InitiateCheckout·Lead·Contact, event_id 부여 |
| CAPI | Route Handler에서 Lead·Schedule 전송, event_id 중복 제거, fbc·fbp·해시 전화번호 |
| 리타게팅 | view_procedure 7일 / form_start 미제출 3일 / 기존 리드 제외 |
| 유사 타겟 | lead_qualified 1% (리드 100건 후) |
| 소재 규칙 | 정보형만: "가격·회복기간 비교표" 식. 병원명·효과·전후 사진·신체 비하·개인 속성 언급 0. 첫 주는 트래픽 목표 소액(1만 원/일)으로 계정 워밍업 후 Lead 목표 전환. 거부 시 폴백: 네이버 검색광고 + 인스타 오가닉 |
| 리포트 | 주간: 노출·CTR·CPC·리드·CPL·랜딩 전환율·소재별 |
| 실험 | 2주 단위 A/B, 승자 기준 CPL 20% 개선 |

## 8. 기술 스택, 데이터 모델, 배포

**배포 방식 = GitHub Pages 정적 호스팅 (옵션 B)**. 서버 없이 Next.js `output: 'export'`로 빌드하고, 동적 기능(리드 저장·관리자)은 브라우저에서 Supabase를 직접 호출한다. 비용 0원, 유료는 도메인(선택, 연 2만 원 내외)만.

| 계층 | 선택 | 정적 배포 제약·대응 |
| --- | --- | --- |
| 프론트 | Next.js 15 (App Router, TypeScript, `output: 'export'`), Tailwind CSS | SSR 없음 → 모든 페이지는 빌드 시 생성(generateStaticParams). ISR 없음 → 콘텐츠 변경 시 재빌드·재배포 |
| DB·인증 | Supabase (Postgres, Auth) | leads 테이블: 브라우저는 **읽기·쓰기 모두 금지**. 쓰기 `submit-lead`, 읽기 `admin-leads`(JWT admin 검증) Edge Function만. 7일 미사용 정지 방지용 keep-alive ping을 Actions cron으로 |
| 서버 로직 | Supabase Edge Functions (Deno) | `submit-lead`: 검증 → 전화번호 암호화 → insert → Resend 알림 → 메타 CAPI → lead_id 반환. `qualify-lead`: 상태 변경 시 GA4 MP·CAPI Schedule |
| 콘텐츠 | MDX 파일 + 빌드 시 JSON 생성 | DB 메타는 빌드 스크립트가 Supabase에서 읽어 정적 JSON으로 포함 |
| 태그 | GTM → GA4, Meta Pixel, 네이버 애널리틱스 | 전부 클라이언트. GTM·GA4는 서비스 계정으로 API 관리 |
| 알림 | Resend (Edge Function 경유) | 카카오 알림톡은 2단계 |
| 배포 | GitHub Actions → GitHub Pages, 커스텀 도메인 CNAME(선택) | 도메인 없으면 `basePath: "/realsurgery"` + `.nojekyll`. PR마다 빌드 검증, main 머지 시 배포 |
| 모니터링 | GA4 + Sentry 무료 | Vercel Analytics 미사용 |
| 데모 | Playwright 스크린샷 프레임 + `gifenc`(순수 JS)로 GIF 생성 (`demo/*.gif`) | ffmpeg 불필요. 포트폴리오·SaaS형 홈 화면용 |

정적 배포 주의: 한글 URL은 빌드 시 퍼센트 인코딩된 경로로 생성되며 sitemap·canonical도 인코딩된 값으로 통일한다. `/consult/done`은 세션스토리지 플래그로 직접 접근을 막는다. A-01 관리자는 Supabase Auth 로그인 후 클라이언트에서 RLS로 읽는다.

### 병원 미확보 폴백 (제휴 전 MVP 규칙)
- P-05 병원 상세: 공개 정보(병원명·주소·진료과목·운영시간)만 표시. "제휴"·"추천" 표현 금지, 전화·카톡 버튼은 `clinics.is_partner=true`일 때만 노출.
- P-06 상담 폼: 제목 "시술 상담 가이드 받기". 수신처 = 운영자 이메일. clinic_id는 선택값.
- 리드 10건 누적 시 content lane이 병원 섭외 메일 초안·대상 목록을 생성(T-306).

### 데이터 모델
| 테이블 | 주요 컬럼 |
| --- | --- |
| categories | id, name, slug, order |
| procedures | id, category_id, name, slug, summary, price_low, price_high, duration_min, recovery_days, anesthesia, content_mdx, updated_at, view_count |
| procedure_faqs | id, procedure_id, question, answer, order |
| clinics | id, name, slug, region, address, lat, lng, phone, kakao_url, hours, description, is_premium, is_partner, ad_review_no |
| clinic_procedures | clinic_id, procedure_id, price_low, price_high, duration_min, price_updated_at |
| leads | id, procedure_id, clinic_id, name, phone(암호화), region, timing, contact_time, memo, consent_privacy, consent_3rd, consent_marketing, utm_source, utm_medium, utm_campaign, utm_content, gclid, fbclid, fbc, fbp, ga_client_id, landing_page, referrer, status, created_at |
| lead_status_logs | lead_id, from_status, to_status, changed_by, changed_at |
| campaigns | id, slug, name, channel, headline, variant_config, active |
| posts | id, slug, title, summary, content_mdx, author_id, published_at, updated_at |
| affiliate_items | id, procedure_id, name, url, image, order |
| aeo_checks | id, week, question, engine, cited, url |

### 보안
- leads.phone 앱 레벨 암호화, 관리자 화면 마스킹 기본.
- RLS: leads는 service role만 쓰기, 관리자 role만 읽기.
- 보유 기간 만료 자동 삭제(pg_cron).

## 9. MVP 로드맵

| 단계 | 기간 | 내용 | 게이트(다음 단계 조건) |
| --- | --- | --- | --- |
| 1. MVP 구축 | 10/27~11/9 | P0 8화면, GTM·GA4·Pixel, 도메인·Vercel, 약관·동의 배너 | generate_lead DebugView 검증 완료 |
| 2. 콘텐츠·병원 | 11/10~11/23 | 시술 가이드 20편, 병원 10곳, JSON-LD·사이트맵, 구글·네이버 제출 | 색인 20페이지 |
| 3. 광고 1차 집행 | 11/24~12/7 | 메타 10만 원, 네이버 검색 10만 원, P-12 2안, CAPI | 리드 10건 |
| 4. 최적화·리포트 | 12/8~12/21 | A/B 2라운드, AEO 측정, 오프라인 전환, 포트폴리오 리포트 | CPL 20% 개선 |

### 포트폴리오 산출물
1. 서비스 URL + 화면 정의서
2. GTM 구조도 + GA4 퍼널 탐색 보고서
3. 메타 광고 성과 리포트 2회분
4. 네이버·구글 순위 추적표(키워드 20개)
5. AEO 인용 측정 시트
6. JSON-LD 리치 결과 테스트 캡처

### 미결정 (사람이 결정)
- [ ] 서비스명·도메인
- [ ] 첫 시술 카테고리 1개 (추천: 눈)
- [ ] 제휴 병원 섭외 방식
- [ ] 의료 자문 의사 섭외 여부
