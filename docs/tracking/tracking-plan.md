# 리얼성형 측정 설계서 (Tracking Plan)

- 버전: v1 · 2026-10-26 · 기준: `docs/spec/screen-spec.md` 5절·7절, `lib/track.ts`(이벤트 원본), `lib/consent.ts`
- 산출물: `docs/tracking/gtm-container.json`(GTM 가져오기용) · `docs/tracking/report-template.md`(주간 리포트)
- 원칙: 앱은 `dataLayer.push`만 한다. GA4·메타 픽셀은 GTM 안에서만 관리한다. 클릭도 앱이 커스텀 이벤트를 push하므로 GTM에 CSS 선택자·클릭 트리거는 없다.

## 1. 목적·KPI

목적: 검색·메타 광고 유입부터 상담 신청, 예약 확정까지를 한 줄로 측정해 **채널·시술별 CPL**과 **예약확정률**로 예산을 배분한다.

| KPI | 정의 | 계산식 | 원천 데이터 | 게이트(스펙 9절) |
| --- | --- | --- | --- | --- |
| 리드 수 | 상담 신청 접수 건 | `count(leads)` (주간, 접수일 기준) | Supabase `leads` (GA4는 동의자 표본) | 3단계: 리드 10건 |
| CPL | 리드 1건당 광고비 | 채널 광고비 ÷ 해당 채널 리드 | 광고 플랫폼 비용 + `leads.utm_source` | 4단계: CPL 20% 개선 |
| 예약확정률 | 리드 중 예약 확정 비율 | 예약확정·내원 ÷ 리드 (접수 주 코호트) | `leads.status`, `lead_status_logs` | — |
| 보조: CPQL | 예약 확정 1건당 광고비 | 광고비 ÷ 예약확정 | 위 두 원천 | — |
| 보조: 랜딩 전환율 | 랜딩 세션 중 리드 비율 | `generate_lead` 세션 ÷ 랜딩 세션 | GA4 | — |
| 보조: 폼 완료율 | 폼 시작 대비 제출 | `generate_lead` ÷ `form_start` | GA4 | — |

> Basic 동의 모드(5절)에서는 동의를 거부한 방문자가 GA4에 잡히지 않는다. 그래서 **리드 수·CPL은 DB 기준**으로 계산하고, GA4는 퍼널·랜딩 비교용 표본으로만 쓴다.

## 2. 퍼널

| 단계 | 이벤트 | 화면 | 비고 |
| --- | --- | --- | --- |
| 0 유입 | `page_view` + `_utm` 쿠키 | 전체 | 첫 유입 기록(9절) |
| 1 관심 | `view_procedure` 또는 `view_lp` | P-03 / P-12 | 콘텐츠 경로 / 광고 LP 경로 |
| 2 비교 | `view_clinic` | P-05 | 선택 단계(LP 경로는 건너뜀) |
| 3 폼 시작 | `form_start` | P-06·P-12 | 메타 InitiateCheckout |
| 4 연락처 단계 | `form_step2` | P-06·P-12 | 2단계 이탈 측정 |
| 5 리드 | `generate_lead` | P-07 | **주 전환**, 유일 발화 지점 |
| 6 예약 확정 | `lead_qualified` | A-01 → 서버 | 오프라인 전환(7절) |

## 3. 이벤트 사전 (`lib/track.ts` TRACK_EVENTS 21개)

GA4 열의 "주"·"보조"는 키 이벤트(전환)로 지정한다. "—"인 이벤트도 GA4로 보낸다. 모든 GA4 태그 이름은 `GA4 - Event - <이벤트>` 형식이다.

| 이벤트 | 발화 조건 | 파라미터 (dataLayer) | GA4 | Meta |
| --- | --- | --- | --- | --- |
| view_procedure | P-03 로드 | procedure_id, procedure_name, category | — | ViewContent |
| view_clinic | P-05 로드 | clinic_id, clinic_name, is_premium | — | ViewContent |
| view_lp | P-12 로드 | campaign, variant | — | ViewContent |
| click_cta | 상담 CTA 클릭 | location(header·hero·mid·bottom·footer·bottom_bar), procedure_id? | — | — |
| form_start | P-06 1단계 첫 입력 | procedure_id?, clinic_id?, source_page | — | InitiateCheckout |
| form_step2 | 2단계 진입 | procedure_id?, clinic_id?, source_page | — | — |
| generate_lead | P-07 로드(서버 검증 lead_id, 1회) | lead_id, procedure_id?, clinic_id?, value=50000, currency=KRW | **주** | Lead (eventID=lead_id) |
| phone_click | tel: 클릭 | clinic_id, page | 보조 | Contact |
| kakao_click | 카카오 채널 클릭 | clinic_id, page | 보조 | Contact |
| click_affiliate | 제휴 링크 클릭 | item_id, procedure_id | — | — |
| scroll_depth | 25·50·75·100% | percent, page_type | — | — |
| search | 메인 검색 | search_term | — | Search |
| lead_qualified | A-01 "예약확정" | lead_id, value=200000 | 보조(MP) | Schedule (CAPI) |
| select_category | 부위 바로가기 | category | — | — |
| select_procedure | 시술 카드 | procedure_id, from_page | — | — |
| select_clinic | 병원 카드·가격표 | clinic_id, from | — | — |
| select_post | 칼럼 카드 | post_id | — | — |
| expand_faq | FAQ 펼침 | procedure_id, question_index | — | — |
| click_map | 지도 클릭 | clinic_id | — | — |
| kakao_add | P-07 채널 추가 | (없음) | — | — |
| experiment_variant | P-12 A/B 배정 | campaign, variant | — | — |

- 아래쪽 8개(select_category~experiment_variant)는 스펙 4절에만 있다(T-005). 이 설계는 이 8개도 행동 분석용 GA4 태그를 둔다. T-005 가정("GTM 태그는 5절 13개만")과 다르므로 필요 없으면 해당 태그만 일시중지한다.
- dataLayer 키 `campaign`은 GA4로 `lp_campaign` 이름으로 보낸다. GA4의 트래픽 소스 파라미터 `campaign`과 겹치지 않게 하기 위해서다.
- `lead_qualified`의 GA4 태그는 **일시중지**한다. 관리자 브라우저에서 발화하면 관리자의 client_id로 귀속되므로 서버 MP로만 보낸다.

## 4. GTM 컨테이너 구성 (`gtm-container.json`)

| 구분 | 이름 규칙 | 개수 | 내용 |
| --- | --- | --- | --- |
| 태그 (폴더 GA4) | `GA4 - Config`, `GA4 - Event - <이벤트>` | 1 + 21 | Google 태그(초기화) + 이벤트별 파라미터 매핑. lead_qualified는 일시중지 |
| 태그 (폴더 Meta) | `Meta - Pixel Base`, `Meta - <픽셀 이벤트>` | 1 + 5 | ViewContent·InitiateCheckout·Lead·Contact·Search. 이벤트 태그는 설정 태그로 Pixel Base 선행 |
| 트리거 | `CE - <이벤트>`, `CE - consent_update - *`, `EX - Admin pages` | 21 + 2 + 1 | 커스텀 이벤트 기준. `/admin`(basePath 포함)은 모든 태그 차단 |
| 변수 (폴더 Variables) | `DLV - <param>` | 26 | track.ts 파라미터 22개 + 동의 상태 4개(현재·직전) |
| 변수 | `Cookie - _fbp`·`_fbc`·`_utm`, `CJS - *`, `CONST - *` | 10 | 첫 유입 파싱, 메타 eventID, 측정 ID 상수 |

가져오기: GTM 관리 → 컨테이너 가져오기 → 새 작업공간 `dev` → **병합**(충돌 시 덮어쓰기) → `CONST - GA4 Measurement ID`(G-XXXXXXXXXX)·`CONST - Meta Pixel ID`(000000000000000)를 실제 값으로 교체 → 미리보기 QA(11절) → 버전 생성 → 게시(사람 클릭 1회, 파이프라인 02).

## 5. Consent Mode v2 흐름

| 배너 토글 | 저장 (`localStorage.rs_consent`) | Consent 유형 | 필요한 태그 |
| --- | --- | --- | --- |
| 방문 통계 | `analytics` | `analytics_storage` | GA4 - Config, GA4 - Event - * |
| 광고 성과 측정 | `ads` | `ad_storage`, `ad_user_data`, `ad_personalization` | Meta - * (`ad_storage` 확인) |

```
<head> consentInitScript()        consent default: 4종 denied, wait_for_update=500ms
  └─ rs_consent(v=1) 있음?  ──yes→ consent update (저장값) + <html data-consent="set">
GTM 로드  ─ Initialization ─→ GA4 - Config      [analytics_storage 필요]
          ─ All Pages ──────→ Meta - Pixel Base [ad_storage 필요] → PageView
배너 선택 → saveConsent() → consent update → (R-1) {event:'consent_update', analytics_storage, ad_storage, prev_*}
          → CE - consent_update - analytics granted (prev ≠ granted) → GA4 - Config  (같은 페이지에서 즉시)
          → CE - consent_update - ads granted       (prev ≠ granted) → Meta - Pixel Base
```

- 모드: **Basic**. 동의 전에는 태그를 로드하지 않고 쿠키 없는 핑도 보내지 않는다. 시술 관심 정보가 민감정보 성격이라 보수적으로 운영한다. 대가: 동의 거부자의 GA4 데이터는 0이다(1절).
- 추가 동의 확인으로 차단된 태그는 나중에 동의해도 자동으로 다시 발화하지 않는다. 그래서 `consent_update` 트리거로 따로 로드한다(**R-1 필요**). 동의 전에 발생한 이벤트(예: 배너를 누르기 전의 `view_procedure`)는 재전송하지 않는다.
- 철회: 다음 페이지 로드부터 태그를 로드하지 않는다. Google 태그는 같은 페이지에서도 update(denied)를 따른다.

## 6. generate_lead 중복 방지 (3계층)

```
P-06/P-12 제출 → submit-lead(Edge) ─ 검증·암호화·insert → lead_id 반환 ─┬→ CAPI Lead (event_id=lead_id)
             └ track 호출 없음                                          └→ sessionStorage.rs_lead 저장 → P-07
P-07 로드 → 가드 통과 → track('generate_lead') → GTM → GA4 generate_lead / Pixel Lead (eventID=lead_id)
```

| 계층 | 위치 | 규칙 | 막는 경우 |
| --- | --- | --- | --- |
| 1 단일 발화 | P-06·P-12·submit-lead | 폼 화면에서는 track을 호출하지 않는다. P-07만 발화한다. submit-lead는 같은 번호 5분 내 재제출을 차단하고 기존 lead_id를 반환한다(제안) | 폼과 완료 화면 이중 발화, 더블클릭 |
| 2 세션 가드 (R-3) | P-07 (T-102) | `rs_lead`({lead_id, procedure_id, clinic_id})가 없으면 `/`로 replace한다. `rs_lead_sent === lead_id`면 발화를 생략하고, 발화 직후 `rs_lead_sent`를 기록한다. GTM `CE - generate_lead`는 lead_id가 빈 push를 무시한다 | 새로고침, 뒤로가기, 직접 접근, 북마크 |
| 3 CAPI dedupe | Meta | Pixel `Lead` eventID와 CAPI `Lead` event_id를 모두 lead_id로, event_name을 `Lead`로 맞춘다 → 48시간 안의 같은 쌍은 1건으로 집계된다 | 브라우저와 서버 이중 수신 |

GA4에는 `generate_lead` 중복 제거 기능이 없다(transaction_id는 purchase 전용). 그래서 1·2계층이 GA4 정확도를 책임진다.

CAPI `Lead` (submit-lead): `event_id`=lead_id · `action_source`=website · `event_source_url` · `user_data.ph`=sha256(E.164 숫자, 예: 8210…) · `fbc`=`_fbc`(없으면 `fb.1.<_utm.ts>.<fbclid>`) · `fbp`=`_fbp` · `client_ip_address`·`client_user_agent`(요청 헤더) · `custom_data`={value:50000, currency:KRW, content_ids:[procedure_id]}. **전송 조건: 브라우저가 보낸 `consent.ads === true`일 때만(R-4).**

## 7. 오프라인 전환 `lead_qualified`

발화: A-01에서 상태가 `예약확정`으로 **처음** 바뀔 때만 `qualify-lead`가 실행된다. `lead_status_logs`에 이전 예약확정 이력이 있으면 보내지 않는다. 시크릿은 Edge secret에만 둔다.

| 항목 | GA4 Measurement Protocol | Meta CAPI |
| --- | --- | --- |
| 엔드포인트 | `POST /mp/collect?measurement_id=G-…&api_secret=…` (검증: `/debug/mp/collect`) | `POST /{PIXEL_ID}/events` (QA 시 `test_event_code`) |
| 식별자 | `client_id` = `leads.ga_client_id` (`_ga`=GA1.1.**a.b** → `a.b`) | `user_data`: ph(sha256)·fbc·fbp (리드 저장값) |
| 이벤트 | `lead_qualified` {lead_id, value:200000, currency:KRW, procedure_id, clinic_id} | `Schedule` {value:200000, currency:KRW}, `event_id`=`<lead_id>:qualified`, `action_source`=system_generated |
| 시각 | `timestamp_micros` = 상태 변경 시각 (72시간 안까지만 소급) | `event_time` = 상태 변경 시각 (7일 안) |
| 생략 조건 | `ga_client_id` 없음(통계 비동의) | 접수 시 `consent_ads=false` |
| 활용 | 보조 키 이벤트, 예약확정률 | 유사 타겟 1% 소스(리드 100건 후, 7절) |

## 8. GA4 속성 설정

| 항목 | 설정 |
| --- | --- |
| 기본 | 시간대 Asia/Seoul, 통화 KRW, 데이터 보존 14개월, Google 신호 OFF(민감 업종) |
| 키 이벤트 | `generate_lead`(주), `phone_click`·`kakao_click`·`lead_qualified`(보조). 값은 이벤트 value 파라미터 |
| 향상된 측정 | 페이지 조회(브라우저 기록 변경 포함) ON(SPA 화면 전환) · 스크롤 OFF(`scroll_depth` 사용) · 사이트 검색 OFF(`search`) · 양식 상호작용 OFF(`form_start`) · 이탈 클릭 ON |
| 내부 트래픽 | 운영자 IP를 `traffic_type=internal`로 정의하고 데이터 필터를 활성화. `/admin`은 GTM에서 차단 |
| 연결 | Google Ads 연결(gclid 자동 태그, generate_lead 전환 가져오기), BigQuery 내보내기(lead_id로 DB 조인, 선택) |

맞춤 측정기준 (모두 이벤트 범위):

| 측정기준 이름 | 파라미터 | 출처 | 용도 |
| --- | --- | --- | --- |
| Procedure ID | procedure_id | 스펙 5절 | 시술별 퍼널·CPL |
| Clinic ID | clinic_id | 스펙 5절 | 병원별 리드 (B2B 리포트) |
| LP Campaign | lp_campaign | 스펙 5절 `campaign` | LP별 전환율 |
| Variant | variant | 스펙 5절 | A/B 비교 |
| CTA Location | location | 스펙 5절 | CTA 위치별 클릭 |
| Source Page | source_page | 추가 | 폼 진입 화면 |
| Page Type | page_type | 추가 | 스크롤 깊이 비교 |
| Category | category | 추가 | 부위별 관심 |
| First Touch Source / Medium / Campaign | first_touch_source·_medium·_campaign | 추가(`_utm`) | 동의 전 첫 유입 보존 |

`lead_id`는 등록하지 않는다. 고유값이라 (other) 행이 생기므로 BigQuery에서 조인한다.

## 9. UTM 규칙·첫 유입 쿠키 `_utm`

| 채널 | utm_source | utm_medium | utm_campaign | utm_content | utm_term | 비고 |
| --- | --- | --- | --- | --- | --- | --- |
| 네이버 검색광고 | naver | cpc | `{시술}_{YYYYMM}` | `{소재ID}` | 키워드(수동) | 스펙 5절 |
| 구글 검색광고 | google | cpc | `{시술}_{YYYYMM}` | `{소재ID}` | `{keyword}` | gclid 자동 태그 병행 |
| 메타 광고 | facebook | paid_social | `{시술}_{YYYYMM}` | `{소재ID}` | `{{placement}}` | 제안(스펙 미정의 → spec-question). GA4 Paid Social로 분류됨 |
| 인스타 오가닉 | instagram | social | `{시술}_{YYYYMM}` | 게시물ID | — | 메타 거부 시 폴백 채널 |

- 표기: 소문자 ASCII. 단어 안은 하이픈, `{시술}`과 `{월}` 사이만 밑줄을 쓴다. `{시술}`=procedure_id(`double-eyelid`)이고, 여러 시술 캠페인은 카테고리(`eye`)를 쓴다. 예: `eye_202611` ↔ LP `/lp/eye-2026-11`.
- `{소재ID}`=`cr{2자리}{안}`(예: `cr01a`)이며, 리포트 소재별 표의 키다. `utm_id`=광고 플랫폼 캠페인 ID(권장)이고, GA4 비용 데이터 가져오기에 쓴다(필수 조인 키는 source·medium·date).

`_utm` 쿠키 (기록 주체: 앱 R-2, 읽기: P-06 숨김 필드·GTM `CJS - first_touch.*`):

| 항목 | 규칙 |
| --- | --- |
| 기록 시점 | 쿠키가 없을 때 첫 방문에서 1회 기록(first-touch). utm_*는 덮어쓰지 않는다. 클릭 ID(gclid·fbclid)는 새 값이 오면 갱신(last-click, CAPI·Ads 매칭용) |
| 수명·범위 | `Max-Age=7776000`(90일), `Path=/`(basePath 배포 시 `/realsurgery`), `SameSite=Lax`, `Secure` |
| 값 | `encodeURIComponent(JSON)` — `{source, medium, campaign, content, term, id, gclid, fbclid, lp, ref, ts}` |
| 파라미터 없음 | 리퍼러가 있으면 source=리퍼러 호스트·medium=referral, 없으면 `(direct)`/`(none)` |
| 사용처 | P-06 → `leads.utm_*`·gclid·fbclid·landing_page·referrer / GA4 `generate_lead.first_touch_*` |
| 동의 | 유입 경로 기록은 서비스 기능 목적으로 개인정보처리방침에 명시한다. 광고 플랫폼으로 보내는 값(fbc·gclid)은 ads 동의 시에만 보낸다 |

## 10. GA4 탐색 보고서 3종

| 보고서 | 기법 | 구성 | 읽는 법 |
| --- | --- | --- | --- |
| ① 퍼널 | 유입경로 탐색 (닫힌 퍼널, 간접 연결) | A 콘텐츠: view_procedure → view_clinic → form_start → form_step2 → generate_lead / B 광고 LP: view_lp → form_start → form_step2 → generate_lead. 세분화: 세션 기본 채널 그룹, 경과 시간 ON, 기간 28일 | 단계별 이탈률이 가장 큰 구간을 다음 주 실험 대상으로 삼는다 |
| ② 유입경로별 CPL | 자유 형식 | 행: 세션 소스/매체 → 세션 캠페인 / 값: 세션, 키 이벤트(generate_lead), 세션 키 이벤트 비율 / 필터: 매체 = cpc·paid_social | GA4는 리드 수만 제공한다. CPL = 플랫폼 비용 ÷ 리드이며 리포트 템플릿에서 계산한다. 비용 데이터 가져오기 후에는 "광고 > 모든 채널"에서도 확인할 수 있다 |
| ③ 랜딩별 전환율 | 자유 형식 | 행: 방문 페이지 / 보조: LP Campaign·Variant·Procedure ID / 값: 세션, 참여율, 키 이벤트(generate_lead), 세션 키 이벤트 비율 / 필터: 방문 페이지가 `/lp/` 또는 `/procedures/`로 시작 | 한글 slug는 인코딩된 경로로 보이므로 Procedure ID로 집계한다. A/B 판정은 Variant 행 비교 |

## 11. QA 체크리스트 (배포 전 전수)

GTM 미리보기 (Tag Assistant)
- [ ] 21개 이벤트를 각각 재현해 `CE - <이벤트>` → `GA4 - Event - <이벤트>`가 1회 발화하는지, 변수 탭의 DLV 값이 파라미터와 일치하는지 확인 (lead_qualified 태그는 일시중지 확인)
- [ ] 동의 4조합(없음·통계만·광고만·모두) × 페이지 로드: 동의 탭에서 GA4·Meta 태그 차단/발화가 기대대로인지 확인
- [ ] 같은 페이지에서 동의 → `consent_update` → `GA4 - Config`·`Meta - Pixel Base` 각 1회 (R-1 이후)
- [ ] P-07 새로고침 2회, 뒤로가기: `generate_lead` 추가 0회 / 직접 접근: `/` 이동, 이벤트 없음
- [ ] `/admin/*`: 모든 태그가 `EX - Admin pages`로 차단

GA4 DebugView
- [ ] 미리보기 세션이 DebugView에 표시되고 이벤트·파라미터(`lp_campaign` 포함)가 보이는지 확인
- [ ] `generate_lead` 키 이벤트 표시, value 50000·KRW
- [ ] 네트워크 `g/collect`의 `gcs`가 모두 동의 시 `G111`인지, 통계 비동의 시 요청이 없는지 확인
- [ ] MP: `/debug/mp/collect`의 `validationMessages`가 빈 배열 → `debug_mode:1`로 실전송해 DebugView에서 확인

Meta 테스트 이벤트
- [ ] 브라우저: PageView·ViewContent·InitiateCheckout·Lead·Contact·Search 수신, 광고 비동의 시 0건
- [ ] `test_event_code`로 submit-lead 실행 → Lead가 "브라우저·서버" 모두 수신되고 **중복 제거됨** 표시, eventID = event_id = lead_id
- [ ] 이벤트 매칭 품질(EMQ) 확인: ph·fbc·fbp·IP·UA 포함 / qualify-lead → Schedule 수신

## 12. 앱 변경 요청 (이 설계가 의존하는 항목)

| ID | 대상 | 변경 | 미반영 시 영향 |
| --- | --- | --- | --- |
| R-1 | `lib/consent.ts` `saveConsent` | consent update 직후 `dataLayer.push({event:'consent_update', analytics_storage, ad_storage, prev_analytics_storage, prev_ad_storage})`. prev는 직전 저장값이고, 없으면 denied | 같은 페이지에서 동의해도 다음 페이지까지 태그가 로드되지 않는다 |
| R-2 | 신규 `lib/attribution.ts` + 레이아웃 | 9절 `_utm` 기록 | `first_touch_*`·`leads.utm_*`가 비어 채널별 CPL을 계산할 수 없다 |
| R-3 | P-07 (T-102) | 6절 sessionStorage `rs_lead`·`rs_lead_sent` 가드 | 새로고침할 때마다 전환이 중복된다 |
| R-4 | submit-lead·`leads` (T-109) | `consent_ads`·fbc·fbp·ga_client_id 전달·저장, `consent_ads=false`면 CAPI 생략 | 동의 위반 전송, 매칭 품질 저하, MP 불가 |
