# 30-data v1 교차 검토 (spec-analytics-lead) — T-083

- 대상: `docs/specs/30-data.md` v1(118줄). 대조: 70 v1.2 3-5·3-5b·3-10·EC-12/13/23/24, 00 v3.1 3-4·3-5·KPI-01/02/12, 90 v3 원칙 4·3-6·3-8-2, 95 v3 3-5·3-6·3-12, screen-spec 5·7절, TASKS T-016·T-017·T-025·T-033·T-083·T-084.
- 관점: UTM 귀속, fbc/fbp/event_id 중복 제거, generate_lead ↔ leads, lead_qualified 서버 전용, is_demo 제외, aeo_checks, 동의 저장. 정의서 수정 0.
- 확인된 일치(지적 아님): `event_id = lead_id = leads.id`(uuid pk)로 Lead 중복 제거 키 성립 / generate_lead 파라미터 `lead_id·procedure_id·clinic_id`가 leads 컬럼과 1:1 / `ad_consent or (fbc is null and fbp is null)`·`analytics_consent or ga_client_id is null`이 70 EF-1 signals 규칙과 같음 / `age_confirmed`·`phone_hash` 인덱스·`receipt_no`·`idempotency_key` UNIQUE가 70 3-5b와 같음 / S7 컬럼 3개 + `is_demo`·`created_at`으로 00 3-5 분류 ①~⑧ 입력 충족.

## 충돌 / 누락 (7건)

1. **[차단] 충돌 — is_demo의 CAPI 전면 제외 vs 메타 중복 제거 테스트 예외**
   - 30 위치: 3-5 S6(76행) "is_demo 행은 … CAPI·GA4 MP에서 제외". 4절 충돌 기록에 EC-24 없음.
   - 근거: 70 3-5 EF-1 ⑧ 예외(201–209행) — `x-internal-token` + `x-meta-test: 1` + `ad_consent = true` + `META_TEST_EVENT_CODE`이면 is_demo 리드에서 CAPI `Lead` 1건(`event_id = lead_id`, `test_event_code`) 전송. 70 EC-24. 90 D4 "중복 제거" 캡처가 이 경로에 의존.
   - 차이: 30대로 구현하면 is_demo CAPI = 0 → 서버 Lead 1건이 없어 D4 중복 제거 캡처 불가.
   - 고칠 것: S6를 "is_demo는 metrics-agg·KPI·Resend·GA4 MP 0, CAPI 0. 단 70 ⑧ 예외 조건 충족 시 CAPI Lead 1건(test_event_code)만 허용"으로 쓰고 충돌 SC-09(EC-24)로 등재.

2. **[차단] 충돌 — SQ-05 기본값(해시 전화 전송)이 95·T-033 기본값·30 자신의 복호화 규칙과 모순**
   - 30 위치: 4절 SC-03(90행)·SQ-05(102행) "EF에서 복호화 후 즉시 SHA-256, 저장 0", 3-3 암호화(55행) "복호화는 `admin-leads`만".
   - 근거: 95 3-6 CAPI 식별자(215행, 우선순위 1위) "fbc·fbp만, 해시 전화·이름 0". 70 EC-12·EQ-05. TASKS T-033 기본값 "fbc·fbp·UA만, 해시 전화 0". 95 DR6 "복호화는 admin-leads만".
   - 차이: SQ-05 기본값을 따르면 EF-1(⑧ waitUntil)·EF-3가 전화 평문을 복호화해야 하고, 95 3-6과 95 DR6을 동시에 어긴다. 40이 CAPI `user_data` 필드를 확정하지 못한다.
   - 고칠 것: SQ-05 기본값을 "해시 전화 전송 0·컬럼 0·EF의 phone 복호화 0"으로 바꾸고, T-017 안(해시 전화 포함)은 "T-033 승인 시 변경 범위: EF-1·EF-3 복호화 권한, A3 동의 문구"로 분리. SC-03의 "전송 시점 계산" 문장 삭제.

3. **[차단] 누락 — 리드 원장 귀속(퍼스트/라스트 클릭) 결정과 확장 경로**
   - 30 위치: 3-2 leads 신호·유입(42행), S8(77행). 충돌 기록 SC-01~08에 해당 항목 없음.
   - 근거: 90 원칙 4·3-6 #8 "리드 원본 = UTM 마지막 클릭 귀속". screen-spec 3·5절 `_utm` 쿠키 "첫 유입 90일". 70 3-10 유입 기록(383행) "EF-1 attribution은 세션 첫 터치 1세트, last-click 추가 저장은 40 결정 후 30이 컬럼 확장(EC-23)", 70 4절(506행). TASKS T-084 "퍼스트·라스트클릭 UTM 둘 다 저장 여부".
   - 차이: 30은 8열 1세트만 두고 그 세트의 의미를 쓰지 않았다. 실제 의미는 "제출 세션의 랜딩 1세트"이고, 광고 클릭 → 이탈 → 다른 세션에서 직접 제출하면 utm null·referrer null → `direct`로 분류된다(네이버 광고 리드가 CPL 분자에서 빠짐). 40이 "둘 다 저장"을 택해도 30에 받는 컬럼 이름·null 규칙이 없다.
   - 고칠 것: S8에 "leads.utm_* 외 7열 = 제출 세션 랜딩 1세트 = CPL 원장 귀속. 퍼스트터치 컬럼 0(기본값)"을 명시하고 SC-09로 등재. SQ-06 신설: 40이 퍼스트터치 저장을 택하면 `first_utm_source/medium/campaign` + `first_landing_page` null 허용 4열 추가(마이그레이션 1건, `_utm` 쿠키 90일은 95 3-6 수집 항목 추가 필요).

4. **[차단] 누락 — 90 3-6 #10 유효 리드율·95 응대 기록률을 만들 데이터 경로가 없음**
   - 30 위치: lead_status_logs `note text ≤ 200`(44행), status 5종(3-2b, 49행), S7 출력(76행) "by_source 8키·total·is_demo_excluded·sla 건수뿐".
   - 근거: 90 3-6 #10(121행) 유효 = 중복(같은 전화 7일)·internal·형식 오류·연락 3회 무응답 제외, "30-data 확정 시 갱신". 95 3-5(149–153행) 3회 실패 → 상태 "취소"·사유 "연락 불가"를 lead_status_logs 메모 "시도 n/3"에 기록, 주간 응대 기록률.
   - 차이: "연락 3회 무응답"은 자유문 note에서만 구분 가능(파싱 의존). 중복(7일)·무응답·응대 기록 건수를 내보내는 출력이 agg.json(00 3-5)·EF-4(70)에 없어 D5·D6 지표 #10과 60-growth 주간 지표를 작성할 수 없다.
   - 고칠 것: (a) `lead_status_logs.reason text null check in ('unreachable','user_cancel','other')`(to_status = 취소일 때만 not null) 추가, (b) S7에 정수 3개 산출 규칙 `dup_7d`(같은 phone_hash가 7일 안에 먼저 있는 행)·`unreachable`·`contacted_logged`를 쓰고 00 3-5·70 EF-4 키 추가 요청을 SC-09로 등재. 대안: 90 #10에서 두 요소 삭제를 spec-question으로.

5. **[차단: 40 입력] 누락 — EF-3 Schedule·GA4 MP 재전송에 필요한 식별자 저장 없음**
   - 30 위치: leads 신호·유입(42행). `client_user_agent`·`ga_session_id` 열 0.
   - 근거: 70 EF-1(200행)·EC-13 CAPI `user_data` = fbc·fbp·client_user_agent, UA 필수. 70 EF-3(237–238행) Schedule·GA4 MP는 EF-2(관리자 요청) 시점에 실행되어 요청 UA는 관리자 것. 70 3-5b도 UA·session 열 없음.
   - 차이: Schedule을 `website` 계열로 보내려면 접수 시점 UA가 필요한데 저장처가 없다. GA4 MP `lead_qualified`는 `ga_client_id`만 있고 세션 식별자가 없어 웹 세션의 소스/매체에 붙지 않을 수 있다(GA4 문서상 `session_id` 미지정 시 새 세션 생성 — 40이 확인할 것). D4 퍼널의 lead_qualified 단계를 채널별로 쪼갤 수 없게 된다.
   - 고칠 것: 기본값 1개 택일 후 SQ-07 — (a) 40이 Schedule `action_source`를 UA 불필요 값으로 정하고 컬럼 0, 또는 (b) `client_user_agent text ≤ 512 null`(`ad_consent` false면 null check) + `ga_session_id bigint null`(`analytics_consent` false면 null check) 추가. 30은 (b)를 기본값으로 쓰고 40 확정 시 철회 가능하게 기록.

6. **[차단: 90 계약] 누락 — aeo_checks.csv 헤더와 T-025 결정 미반영**
   - 30 위치: SC-04(91행) "3개는 JSON·CSV"만 쓰고 소유 문서·헤더 없음.
   - 근거: 90 3-8-2(200행)·체크리스트(304행) "3열(1·0·NA) 결측 0, 모델명·측정 일시 열 결측 0". TASKS T-025 결정 "보조 지표 열 3개(`rank_ours`·`rank_unni`·`rank_babitalk`) 추가 허용". 어느 문서에도 전체 헤더 목록이 없고, 90은 아직 3열 기준.
   - 차이: ① 헤더 정의 문서 없음(build-metrics KPI-08 파서 입력 계약 불가) ② 90 "3열 결측 0" ↔ 순위 열은 값 0·NA 칸에서 값이 없다. 결측 규칙과 충돌.
   - 고칠 것: 4절 접점에 "aeo_checks.csv 헤더 정본 = 90 3-8-2, 30은 소유 안 함"을 쓰고 SC-09로 "T-025 열 3개 미반영(90 3-8-2·체크리스트 304행), `rank_*` 센티널(1~10 정수 또는 `NA`, 결측 0 규칙 예외)"을 T-088에 등재. 또는 30이 헤더 9열(week·engine·qid·model·measured_at·ours·unni·babitalk + rank 3)을 확정.

7. **[비차단 성격이나 KPI-12 판정에 영향] 누락 — 집계 기간의 일 경계 시간대**
   - 30 위치: S7(76행) `created_at` timestamptz 만 명시.
   - 근거: 70 EF-4 `from/to YYYY-MM-DD`(243행)·00 3-4(110행) 월 10:00 KST 집계, "직전 월~일". 00 KPI-12 "GA4 > leads인 주 0". GA4 Data API 날짜는 속성 시간대 기준.
   - 차이: 일 경계가 UTC면 월요일 00:00~09:00 KST 접수분이 전주/당주로 갈려 GA4(KST 속성)와 어긋나 "초과 0" 판정이 가짜로 깨질 수 있다.
   - 고칠 것: S7에 "일 경계 = Asia/Seoul 00:00(`created_at at time zone 'Asia/Seoul'`)" 한 줄, 40 인계 항목에 "GA4 속성 시간대 Asia/Seoul".

## 비차단 (제안)

- `ad_consent`·`analytics_consent` ↔ Consent Mode 4신호 매핑 1줄(`ad_consent` = ad_storage = ad_user_data, `analytics_consent` = analytics_storage, `ad_personalization` 항상 denied·저장 0)을 3-2 신호 행에 두면 40이 그대로 인용 가능.
- GA4 ↔ leads 대조(KPI-12)를 동의 기준으로 읽으려면 `analytics_consent = true` 리드 수가 필요하다. agg.json 형식 변경이라 T-088에서 00·70과 함께 `consented` 정수 1개 추가 검토.
- `fbc ~ '^fb\.1\.[0-9]{10,13}\.'` check와 `utm_source`·`utm_medium` 소문자 정규화(분류 ①②가 `naver`·`meta` 정확 일치) 규칙을 EF-1 검증 또는 컬럼 check로.
- `lead_qualified`는 예약확정 전이가 1회뿐이라 정상 경로 중복은 없지만 EF-3 재시도 시 GA4 MP는 중복 제거 키가 없다(CAPI는 `<lead_id>:schedule`로 제거). 전송 결과를 lead_status_logs `note`에 남기는 규약 1줄 권장.
- `fbclid`·`gclid`는 광고 동의와 무관하게 저장된다(95 3-6 "자동 수집" 항목에는 등재됨). 광고 동의 false일 때 null로 하려면 check 추가, 유지하면 처리방침 문구만 확인.
- 체크리스트 11항목에 측정 항목이 0개: ① `by_source` 8키 합 + `is_demo_excluded` = 기간 전체 행 수 ② 응답 `lead_id` = P-07 `generate_lead.event_id` ③ `ad_consent = false` 행의 fbc·fbp null을 추가 권장.
- TASKS T-083 비고 "attribution 9키"는 70 3-5b·EF-1·30 모두 8키. TASKS 쪽 표기 정정(30은 맞음).
- 가상 병원만 있는 동안 `leads.clinic_id`는 항상 null(00 C28)이라 generate_lead `clinic_id`도 null. 40은 병원별 전환 보고서를 만들지 말 것(30 접점 표에 1줄).

## 판정

request-changes (차단 6건: 1·2·3·4·5·6). 1·2는 문구 수정, 3·5는 기본값 확정 + SQ 추가, 4·6은 컬럼 1개와 충돌 기록 추가로 해소 가능.
