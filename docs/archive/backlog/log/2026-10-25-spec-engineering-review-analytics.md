# 70-engineering v1 교차 검토 2 (트래킹·분석 관점) — spec-analytics-lead

- 대상: `docs/specs/70-engineering.md` v1 (T-082). 수정 0, 지적만.
- 대조: README, 00-product(KPI·by_source·3-5), 90-deliverables(R5·D3·D4·D7), 95-legal-ops(3-6 태그·동의), screen-spec 5·7절, CLAUDE.md, TASKS T-017·T-084, `lib/consent.ts`·`lib/track.ts`·`lib/env.public.ts`, `tests/e2e/flow.spec.ts`, 10-design TRK.
- 이미 70이 EC-01(ad_personalization 고정), EC-02(동의 뒤 로더), EC-12~13(CAPI 식별자), EC-08(e2e 리드)로 기록한 건은 제외.

## 충돌 / 누락 (차단 9건)

1. **3-10 GTM 로더 행(L336) + 4-2 EC-02(L448) — 동의 전 dataLayer 큐 처리가 40으로 위임됨.** 로더를 늦게 넣으면 동의 전 `track()` push(view_procedure, scroll_depth 등)가 큐에 쌓였다가 동의 직후 GTM이 한꺼번에 전송한다. 95 3-6 "동의 전 수집 0"과 충돌할 수 있고, 삽입 시점은 70이 40보다 우선(4-1)이라 40이 정할 수 없다. 차단: 큐 처리 방식이 없으면 `lib/track.ts`·`lib/gtm.ts` 구현이 둘 중 하나로 갈려 KPI-04 분모(form_start)가 달라진다. 고칠 방향: 3-10에 한 줄 고정(예: 로더 삽입 직전 `dataLayer`에서 consent 명령 외 항목 제거하고 현재 페이지의 view_* 1건만 재push, 또는 전량 유지 + 95 확인)하고 95 확인은 T-088 기록.

2. **3-10 · 5절 체크리스트(L482) · QG-07 — 동의 철회 경로의 규칙·검사가 없음.** 95 3-6 "철회 이후 해당 태그 발화 0회"·95 체크리스트 "철회 후 요청 0건"인데, 70은 "동의 전 0건"만 검사한다. 로더가 이미 삽입된 페이지는 언로드할 수 없고 `_ga*`·`_fbp`·`_fbc` 쿠키도 남는다. 차단: 95 체크리스트 항목을 70 게이트로 재현할 수 없다. 고칠 방향: 3-10에 "철회 = consent update denied push + 해당 쿠키 삭제 + 다음 내비게이션부터 로더 미삽입(또는 `location.reload()`)" 중 1안을 고정하고, QG-07에 "동의 → 철회 → 새 요청 0건" 단언 1개 추가.

3. **3-6 표(L232~236) · 3-8 TRK 사용처 — P-07 투명성 블록(90 R5·10 TRK)이 모드별로 거짓이 됨.** 10 TRK는 "dataLayer.push 실제 객체"와 "현재 Consent Mode 값 실시간"을 보여주는데, 70 3-6은 `closed`·`demo`·is_demo 리드에서 `generate_lead` push 0이다. 이 모드에서는 화면의 CODE 블록이 실제로 일어나지 않은 push를 보여준다(70 원칙 3 "가짜는 진짜로 섞이지 않는다" 위반). 또 10은 TRK 표를 "JS 0"으로 분류했는데 실시간 동의 줄은 클라이언트 JS가 필요해 PB-11 목록과 어긋난다. 차단: 90 R5 증거 화면이 가장 먼저 열리는 상태(mock 배포)에서 부정확하다. 고칠 방향: 3-6 표에 "P-07 투명성 블록" 열 추가(live·is_demo=false = 실제 push 객체 / 그 외 = "예시" 배지 + push 미발생 문구), 10의 TRK JS 분류 수정은 T-088 기록.

4. **3-5 EF-1 `attribution`(L176)·`signals`(L177) + 3-4 `lib/` 목록(L136) — 유입 기록 캡처 모듈이 없음.** 00 3-5는 세션 첫 페이지뷰에서 `rs_landing_referrer`·`rs_utm`·`rs_landing_page`를 sessionStorage에 1회 기록하라 하고 "구현은 70"이라 했으나, 70의 `lib/` 목록·테스트 최소 케이스에 이 코드가 없다. 또 95 3-6이 P-12·P-06에서 쿼리를 `history.replaceState`로 지운 뒤 픽셀을 로드하므로 `fbclid`로 `fbc`를 만드는 시점이 쿼리 제거 전이어야 하는데 누구도 맡지 않았다(T-083 비고 "쿼리 제거 전 fbc 생성 순서"). T-084 비고의 퍼스트·라스트클릭 UTM 중 무엇을 저장하는지도 EF-1 스키마(단일 세트)로는 정해지지 않았다. 차단: by_source 8분류(KPI-01·02·03 채널 몫)의 입력이 만들어지지 않는다. 고칠 방향: `lib/attribution.ts` 1개를 3-4·3-16에 추가(세션 첫 PV 1회 기록, 쿼리 제거 전 fbc 계산, 기록 키 3개), 단위 테스트 최소 케이스에 "기록 1회·덮어쓰기 0" 추가, first/last 선택은 40 결정 전 "first(세션 첫 PV) 1세트 + `utm_*` 컬럼은 30에서 확장 가능"으로 명시. screen-spec GTM 변수 `_utm` 쿠키(첫 유입 90일)와 00 sessionStorage 불일치는 T-088 기록.

5. **3-5 EF-1 부수 효과 ⑧(L194) + EF-3 — 메타 중복 제거 검증 경로가 막힘.** 90 D4는 "메타 이벤트 관리자 중복 제거 캡처(Lead event_id = lead_id)"를 요구하고 T-204도 "CAPI 연결·중복 제거 검증"인데, 70은 is_demo면 CAPI 0이고 "실리드를 만드는 자동 테스트 0건"이다. 토큰 리드로는 CAPI가 안 나가니 캡처를 만들 방법이 없다. `META_CAPI_TOKEN`과 함께 3-7에 있는 `META_TEST_EVENT_CODE`의 사용 조건도 EF-1 계약에 없다. 차단: D4 필수 증거 1개가 구현 불가. 고칠 방향: EF-1 ⑧에 "is_demo = true + 헤더 `x-meta-test: 1` + `META_TEST_EVENT_CODE` 있음 → CAPI Lead를 `test_event_code` 포함으로 1건 전송(광고 집계·KPI 제외)" 예외를 추가하고, 00 3-4 "is_demo CAPI 0"의 예외 1줄은 T-088 기록.

6. **3-14 `metrics` 잡(L402) · 3-9(L323) · 3-13 — GA4 Data API·GTM API 단계와 리포트 입력 계약이 없음.** 00 3-4는 KPI-04(폼 완료율)·10·12(전환 대조율)·13(이벤트 수신 n/21, GTM 컨테이너 버전)을 같은 주간 집계로 `metrics.json`에 넣는다. 그러나 70의 `metrics` 잡은 EF-4 → `agg.json` → `build-metrics.mjs`만 있고 GA4 Data API 호출(T-205), GTM API export(KPI-13c, D4 컨테이너 JSON), `GCP_SA_KEY_JSON` 파일 쓰기 단계, 네이버·메타 CSV 입력(KPI-02·03) 단계가 없다. `metrics.json` zod 검증(00 체크리스트)과 `build-metrics.mjs` 단위 테스트도 QG·3-12에 없다(커버리지 include가 `lib`·`_shared`뿐). 차단: KPI 13개 중 최소 5개가 영구 `needs-key`로 남을 수 있고 값 산출 책임 단계가 없다. 고칠 방향: `metrics` 잡 단계에 `scripts/ga4-report.mjs`(GA4 Data API: generate_lead·form_start·이벤트 21개 수신 수)·`scripts/gtm-export.mjs` 2개를 추가하고 입출력 계약 1표(입력 CSV 컬럼 → `reports/metrics.json` 키)를 40·60과 합의, QG에 "metrics.json zod 통과 + 키 KPI-01~13 13개" 게이트와 `scripts/build-metrics.mjs` 테스트 포함.

7. **3-12 e2e 행(L364)·3-14 `post-deploy`(L400) — 동의 후 경로 테스트가 없고, 배포 URL e2e가 실제 GA4·메타를 오염시킬 수 있음.** CSP 위반 검출을 "QG-06 콘솔 0"에 맡겼지만(L311) 태그는 동의 뒤에만 로드되므로 동의 없는 e2e는 CSP 호스트 누락을 영영 못 본다. 반대로 철회 검사(항목 2)나 동의 후 검사를 배포 URL에서 실제 `NEXT_PUBLIC_GTM_ID`로 돌리면 e2e의 view_procedure·form_start가 GA4 속성에 들어가 KPI-04·`/insights#funnel`을 흐린다. 내부 트래픽 제외 규칙이 70에 없다. 차단: 검사 공백과 지표 오염이 동시에 생긴다. 고칠 방향: 3-12에 "동의 후 e2e = 로컬 `out/` + GTM·GA·Meta·Naver 도메인을 `page.route`로 200 스텁(실요청 0), 배포 URL e2e는 동의 허용 클릭 0"을 고정하고, 실제 태그 수신 확인은 사람이 하는 DebugView 1회로 분리.

8. **3-8 CSP 표(L302~L309) — GTM Preview·Custom JS 변수가 막혀 90 D4·00 KPI-13(c) 증거 불가.** 00 KPI-13(c)·90 D4는 "GTM Preview 캡처 1장"을 요구한다. Google CSP 가이드는 Preview에 `script-src`·`style-src`에 `https://tagmanager.google.com`, `style-src`에 `fonts.googleapis.com`, `img-src`에 `ssl.gstatic.com`·`www.gstatic.com`, `font-src`에 `fonts.gstatic.com`을 요구하고 Custom JavaScript 변수는 `'unsafe-eval'`이 필요하다고 안내한다. 70 CSP는 모두 없고 `default-src 'self'`·`frame-src 'none'`이라 production 빌드(=Preview 대상)에서 디버그 패널이 뜨지 않을 수 있다. 차단: D4 필수 캡처 1개 불가. 고칠 방향: 3-8에 "Preview 전용 호스트 목록은 빌드 변수 `CSP_GTM_PREVIEW=1`일 때만 `lib/csp.ts`가 추가하고, 캡처 후 변수를 지워 재배포 1회"를 적고, Custom JS 변수 사용 여부(`'unsafe-eval'` 필요)는 40이 "0개"로 확정하도록 4-1에 한 줄 남긴다.

9. **3-5 EF-3(L218~220) · 3-10 — `lead_qualified`가 서버 전송인지 dataLayer push인지 미정(이중 집계 위험).** screen-spec 5절은 `lead_qualified`를 "A-01 예약확정 변경"에서 발화하는 GTM 이벤트로 적고(`lib/track.ts` `TrackEvents`에도 타입이 있음), 70 EF-3은 GA4 Measurement Protocol로 서버가 보낸다. A-01 브라우저에서 `track("lead_qualified")`도 호출하면 GA4 전환이 2건이 된다. 또 MP 이벤트는 DebugView·`dataLayer` 단언으로 검증할 수 없다(T-205 n/21 판정 방식 필요). 차단: KPI-13(a)와 보조 전환 값(200,000원)이 이중이거나 0이 된다. 고칠 방향: 3-10에 "`lead_qualified`는 서버 전용, 앱 코드 `track()` 호출 0(check-out/grep 대상)" 한 줄을 추가하고 `lib/track.ts` 타입 정리와 screen-spec 5절 발화 조건 수정은 T-088 기록.

## 비차단 (제안 5건)

1. **채널 그룹 정렬**: 70 `classify-source.ts` 8키와 40이 만들 GA4 채널 그룹(naver cpc·google cpc·organic·ai referral·meta paid·direct)의 매핑 표를 40에 두고, ChatGPT 링크는 `utm_source=chatgpt.com`을 붙이거나 referrer가 비는 경우가 있어 분류 ③에 `utm_source`가 AI 호스트인 경우를 추가할지 40·00에서 정한다(T-088 기록).
2. **단위 테스트 추가**: `TRACK_EVENTS.length === 21`, 이벤트별 파라미터 키가 40 표와 같음, `track()`의 undefined 제거, `pushConsent` 철회 케이스를 3-12 최소 케이스에 넣는다.
3. **3-3 도메인 전환 8단계에 트래킹 확인 추가**: GA4 데이터 스트림 URL·Meta 도메인 인증·GTM 컨테이너 도메인 확인 1행, 전환 전후로 `_ga` 쿠키가 이어지지 않아 퍼널 기간이 끊긴다는 사실을 D4 표기에 남긴다.
4. **EQ-05 방향**: TASKS T-017(사람 결정 완료)은 "CAPI 해시 전화 = 제3자 제공 동의 항목 포함"인데 70 기본값은 반대(해시 전화 0)다. 안전한 쪽이라 유지해도 되나, EF-1 `user_data`에 `consent.third = true`일 때만 `ph`를 넣을 수 있는 자리를 계약에 열어 두면 사람이 95 갱신을 승인할 때 코드 변경이 줄어든다.
5. **문구·용도 정리**: EF-4가 "00 3-5 그대로"라고 쓰면서 `sla` 키를 추가했다(00 형식에도 `sla`를 넣거나 문구를 "+ sla"로 정정, T-088 기록). `NEXT_PUBLIC_GA4_MEASUREMENT_ID`·`META_PIXEL_ID`·`NAVER_ANALYTICS_ID`가 3-7 `hasKey` 묶음에 있으나 GTM이 ID를 보유하는 구조에서 앱이 쓰는 곳이 없으면 "게이트 전용, HTML·번들 출력 0" 한 줄로 명시한다.

Sources:
- [Use Tag Manager with a Content Security Policy (Google)](https://developers.google.cn/tag-platform/security/guides/csp?hl=en)
- [Customer Information Parameters (Meta)](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters)

판정: request-changes
