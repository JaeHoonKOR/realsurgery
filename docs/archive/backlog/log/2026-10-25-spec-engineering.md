# 2026-10-25 spec-engineering — T-082 70-engineering 초안 (owner: spec-tech-lead)

## 1. 초안 요약
- 파일: `docs/specs/70-engineering.md` v1 완본, 505줄. README 공통 형식 6개 절 + 0절 1쪽 요약.
- lint: 이 에이전트에 Bash 도구가 없어 `node scripts/lint-spec.mjs`를 직접 실행하지 못했다. 스크립트 규칙 3개를 Grep으로 같은 정규식으로 재현해 확인 — (1) `|`로 시작 + 금지 어간 + 숫자 없음 행 0건(금지 어간 출현 자체 0건) (2) 필수 절 6개(목적·원칙·규칙·접점·체크리스트·변경 이력) 제목 전부 존재 (3) 70은 120줄 제한 대상 아님. 예상 종료 코드 0. **오케스트레이터가 `node scripts/lint-spec.mjs docs/specs/70-engineering.md`로 1회 재확인 필요.**
- 입력: README, 00 v3.1, 10 v2, 90 v3, 95 v3, BENCHMARK v1.3, QUALITY v2, screen-spec, 코드(next.config.ts·lib/env*·consent·track·scripts/check-*·lh·lint-spec·pages.yml·migration·playwright·vitest·flow.spec). 외부 문서: Next.js Static Exports 가이드, Supabase Edge Functions Secrets.

## 2. 주요 결정
1. 리드 제출 모드 3개(`live`·`closed`·`demo`)를 빌드 때 `submit-lead ?health=1`(키 4종 이름만 반환)로 정해 `data/generated/lead-mode.json`에 고정. T-029 결정 전 기본값 `closed`(00 S8). (가) 결정 시 GitHub Variable `LEAD_MOCK_MODE=demo` 1개만 바꾼다 — `lib/lead-client.ts` 인터페이스는 세 모드 공통.
2. 브라우저 → Supabase REST 요청 0. 콘텐츠는 빌드 때 굽고, 브라우저는 EF-1(P-06)·EF-2(A-01)·Auth(A-01)만 부른다. leads 계열 4테이블 RLS 켬 + 정책 0 + anon·authenticated 권한 회수. 전화·메모 AES-256-GCM(30 확정 전 기본값), `phone_hash`는 HKDF 파생 HMAC(추가 키 0).
3. Edge Function 5개 계약 확정: `submit-lead`(14개 입력, 오류 코드 10종, 응답 뒤 waitUntil로 Resend·CAPI), `admin-leads`(aal2 MFA, action 5종, 열람 로그 1행/호출), `qualify-lead`(EF-2만 호출), `metrics-agg`(00 3-5 형식 + SLA 건수), `retention-status`(26시간 감시). `x-internal-token`은 e2e가 Playwright `page.route`로 붙이고 불일치는 401(insert 0).
4. GitHub Pages 헤더 제약 → `<meta name="referrer" content="strict-origin">` + meta CSP(`'unsafe-inline'` + 호스트 허용 목록, frame-ancestors 불가 → A-01 JS 프레임 차단). GTM 로더는 쿠키 동의 뒤에만 삽입(95 "동의 전 Google 태그 로드 0").
5. 예산·게이트·CI: 이용자 경로 JS gzip ≤ 150KB(A-01 ≤ 220KB), HTML gzip ≤ 80KB, Lighthouse 모바일 LCP ≤ 2.0s·CLS ≤ 0.05 + BENCHMARK B-15~B-20. 게이트 QG-01~14. CI = build → e2e → deploy(main, needs build·e2e) → post-deploy(배포 URL e2e·밀도·Lighthouse·IndexNow), cron 매일 `0 0 * * *` 파기 감시·매주 `0 1 * * 1` 지표 집계.

## 3. 충돌·질문
- 충돌 17건 EC-01~EC-17(4-2절) → T-088. 핵심: consent.ts `ad_personalization`(EC-01), pages.yml cron·게이트 부재(EC-03·04), flow.spec 더미 값·토큰·generate_lead 기대(EC-08), check-density `playwright` import(EC-09), `.env.example` `SUPABASE_` 접두 시크릿(EC-11), T-017 결정 ↔ 95 CAPI 식별자(EC-12·13), T-017 연령 확인 ↔ 95 동의 표(EC-14).
- 질문 5건 EQ-01~EQ-05(4-3절): EQ-01 = 기존 T-029, EQ-02 metrics 봇 커밋, EQ-03 Supabase Pro(needs-approval 후보), EQ-04 Sentry, EQ-05 95 CAPI 식별자 갱신.
- TASKS 수정 0(지시대로). 3-16 구현 작업 후보 6행은 오케스트레이터가 TASKS에 반영.

## 4. 남은 리스크
- lint-spec 미실행(Bash 없음) — Grep 재현으로 0건 확인, 실제 실행 1회 필요.
- CSP `'unsafe-inline'`은 XSS 방어 효과가 호스트 제한에 그친다. 해시 방식은 M2 이후.
- Supabase Free 플랜 자동 백업 0 — 리드 유실 시 복구 0(EQ-03).

## 5. 다음 단계 (08-specs 3단계)
- 교차 검토 2명 병렬(sonnet): spec-data-architect, spec-analytics-lead. 충돌·누락 ≤ 10건씩.

## 6. 교차 검토 r1 지적 → 반영 표 (v1.1, 1라운드)
원문: `backlog/log/2026-10-25-spec-engineering-review-data.md`(D1~D5), `backlog/log/2026-10-25-spec-engineering-review-analytics.md`(A1~A9). 차단 14건 = 반영 14, 사유 0.

| # | 검토자 | 분류 | 반영 / 사유 |
| --- | --- | --- | --- |
| D1 | data-architect | 누락 | 반영 — 3-5 EF-2 action `withdraw {lead_id, scope: all\|marketing, channel}` 추가(all → withdrawn_at·retention_until = now(), marketing → consent_marketing = false, 둘 다 status_logs 1행). DR8 enum 추가는 EC-18 |
| D2 | data-architect | 충돌 | 반영 — EF-2 "is_demo 예외" 줄: is_demo 리드는 status_change에서 retention_until 갱신 0, withdraw는 now()로만 당김. 단위 테스트 retention_until 3케이스 |
| D3 | data-architect | 누락 | 반영 — 3-8 암호화 표 "파생값 삭제" 행: `retention-daily`가 rate_limits 24시간 초과 행 삭제 + retention_runs `deleted_rate_limits`, RLS 표에 rate_limits 명시. 95 수집 항목·DR9 추가는 EC-19. 체크리스트 2항목 추가 |
| D4 | data-architect | 누락 | 반영 — 3-5b "30-data에 넘기는 컬럼 요건" 표 16행(UNIQUE·인덱스·null·출처). receipt_no = 난수 6자리 hex + `UNIQUE` + 재생성 1회(4자리 lead_id 파생에서 변경, 3-5·3-6·체크리스트 정규식 `{6}` 동기화). lead_access_logs.lead_id null(view_list·export_csv) 명기 |
| D5 | data-architect | 충돌 | 반영 — 3-1 "콘텐츠 정본" 행: 정본 = seed, 빌드는 항상 seed, DB = `pnpm data:sql` → `npx supabase db push --include-seed` 동기화본(seed 변경 머지 전 로컬 1회), `build-data`가 seed·DB id 비교 → 차이 ≥ 1이면 빌드 실패. 3-9 Supabase 행 문구 정정. view_count·sources는 EC-20 |
| A1 | analytics-lead | 충돌 | 반영 — 3-10 "동의 전 큐" 행: 로더 직전 consent 외 제거 + 현재 페이지 view_* 1건 재push, 동의 전 form_start 전송 0(KPI-04 모수 = 동의 사용자). 95 확인은 EC-21, EC-02 문구 갱신 |
| A2 | analytics-lead | 누락 | 반영 — 3-10 "동의 철회" 행(denied push → 쿠키 `_ga`·`_ga_*`·`_gid`·`_fbp`·`_fbc` 삭제 → reload), QG-07에 "동의 → 철회 → 새로고침 뒤 철회 범주 요청 0" 추가 |
| A3 | analytics-lead | 충돌 | 반영 — 3-6 표에 "P-07 투명성 블록" 열(live·is_demo false = 실제 객체, 그 외 = BDG-7 "예시 리포트" + "전환으로 기록되지 않았습니다" 1문장), PB-11에 TRK 동의 줄 추가. 10 TRK JS 분류는 EC-22 |
| A4 | analytics-lead | 누락 | 반영 — 3-10 "유입 기록" 행 + 3-4 `lib/attribution.ts`: 세션 첫 PV 1회, 덮어쓰기 0, 쿼리 제거 전 `rs_fbc` 계산, `_fbc` 쿠키는 광고 동의 뒤, 순서 고정. first-touch 1세트, last-click은 40 → 30. 단위 테스트 3케이스. `_utm` 쿠키 불일치는 EC-23 |
| A5 | analytics-lead | 누락 | 반영 — EF-1 ⑧ 예외: 토큰 일치 + `x-meta-test: 1` + `META_TEST_EVENT_CODE` → test_event_code CAPI Lead 1건. CORS 허용 헤더·입력 표·체크리스트 추가. 00 3-4 예외는 EC-24 |
| A6 | analytics-lead | 누락 | 반영 — 3-14 `metrics` 잡 8단계(GCP 키 파일 → EF-4 → `ga4-report.mjs` → `gtm-export.mjs` → build-metrics → QG-15 → build → 커밋, 키 파일 always 삭제), "지표 입력 계약" 표 6행(입력 파일 → KPI), QG-15(zod + 13키), `lib/metrics/*.ts` 순수 함수로 커버리지 포함. 3-16 작업 후보 행 추가 |
| A7 | analytics-lead | 누락 | 반영 — 3-12: 동의 후·철회 e2e는 로컬 `out/` + 태그 도메인 7개 `page.route` 200 스텁(실요청 0, CSP "Refused to" 검출), 배포 URL e2e는 동의 클릭 0, 실수신은 사람 DebugView 1회 |
| A8 | analytics-lead | 누락 | 반영 — 3-8 CSP "GTM Preview 전용 목록"(`CSP_GTM_PREVIEW=1`일 때만 tagmanager.google.com·fonts.googleapis.com·ssl/www.gstatic.com·fonts.gstatic.com 추가, 배포 2회·≤ 24시간), 4-1 40 행에 "Custom JS 변수 0개 확정" |
| A9 | analytics-lead | 충돌 | 반영 — EF-3 아래 + 3-10 행: `lead_qualified` 서버 전용, 앱 `track("lead_qualified")` 0(rg 검사), 수신 확인은 GA4 Data API. track.ts 타입·screen-spec 5절은 EC-25 |

**비차단 처리**
| # | 처리 |
| --- | --- |
| D-N1 (fbc 순서·dl/rl 한글) | 반영 — A4와 함께 3-10 "유입 기록"·"픽셀 URL 한글" 행, QG-07 |
| D-N2 (consent.version 허용 목록) | 반영 — EF-1 consent 행 |
| D-N3 (공개 select 사유) | 반영 — 3-8 RLS 표 콘텐츠 행 |
| D-N4 (T-028 카운트 원천 2개 이름) | 넘김 — 30·P-03 레이아웃 몫(TASKS T-028 결정 "T-083에서 컬럼 분리") |
| D-N5 (curl 기대값 구분) | 반영 — 체크리스트 "401·403이 정상, 200 [] = 반려" |
| A-N1 (채널 그룹 매핑·utm_source AI 호스트) | 넘김 — 40·00 결정 사항, T-088에서 확인 |
| A-N2 (TRACK_EVENTS 21·undefined 제거 테스트) | 반영 — 3-12 단위 최소 케이스 |
| A-N3 (도메인 전환 트래킹 확인) | 반영 — 3-3 9단계 |
| A-N4 (CAPI `ph` 자리) | 넘김 — 95 갱신(EQ-05) 전에 해시 전화 자리를 계약에 열면 95 3-6 "해시 전화 0"과 충돌. 95 승인 뒤 v1.x에서 EF-1 ⑧에 추가 |
| A-N5 (sla 문구·공개 ID 용도) | 반영 — EF-4 문구 "+ sla"(EC-26), 3-7에 GA4·픽셀·네이버 ID "게이트 전용, 출력 0" |

- 새 충돌 EC-18~EC-26(9건), 새 질문 0건(EQ-01~05 그대로).
- lint: Grep 재현으로 금지 어간 0건, 필수 절 6개 확인(Bash 없음). 오케스트레이터가 `node scripts/lint-spec.mjs docs/specs/70-engineering.md` 1회 재확인 필요.
- 문서 줄 수 v1 505 → v1.1 580.

### r2 재확인 반영 (v1.2, 원문 `backlog/log/2026-10-25-spec-engineering-review-r2.md`)
| # | 분류 | 반영 / 사유 |
| --- | --- | --- |
| A5 (r2 미해소) | 누락 | 반영 — EF-1 ⑧ 예외를 2경로 표로 재정의: 서버 CAPI Lead(test_event_code, 201 응답 `meta_test: true`) + P-07 전용 이벤트 `meta_test_lead` → GTM 픽셀 Lead(eventID = lead_id). 조건 = 토큰 + `x-meta-test: 1` + ad_consent true + `META_TEST_EVENT_CODE`. generate_lead 0·GA4 트리거 0·KPI 제외. `scripts/meta-dedup-test.mjs` 1회(배포 URL 동의 클릭 유일 예외). 3-12 문장·체크리스트 "브라우저 1 + 서버 1, 중복 제거됨". EC-24 예외 2줄로 보강. `rs_lead`·`SubmitResult`에 meta_test, 3-16 작업 후보 1행 |
| N1 (r2 신규) | 충돌 | 반영 — rate_limits 보존 "≤ 24시간" → "최대 48시간"(1일 1회 배치 + 24시간 조건, 예시 포함) 3-1·3-5b·3-8 3곳, EC-19에 "처리방침 기재 = 최대 48시간", 체크리스트 "아무 시각에나 48시간 초과 행 0" |
| NB1 | 비차단 | 반영 — 헤더 v1.2, 0절 "5개 테이블"(목록 명시) |
| NB2 | 비차단 | 반영 — 3-1 DB 응답 없음(timeout 5,000ms·5xx·일시 정지) = 비교 건너뜀 + live 아님 + 빌드 계속, 업로드 키 = DB 비밀번호(`data:sql`은 키 0), 3-7 SERVICE_ROLE 행 정정 |
| NB3 | 비차단 | 반영 — `withdraw` channel을 status_logs 메모에 기록, `CSP_GTM_PREVIEW` 3-7 Variables 행, ad_consent false → CAPI 0·push 0(⑧ 표 2행) |

- 새 EC·EQ 0건(EC-19·EC-24 문구 보강만). lint Grep 재현 0건. 줄 수 590.
