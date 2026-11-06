# T-082 재확인 r2 — 70-engineering v1.1 (spec-analytics-lead, 검토 역할)

- 대상: `docs/specs/70-engineering.md` v1.1 (581줄). 파일 수정 0(이 로그 제외).
- 대조: r1 지적 원문 `2026-10-25-spec-engineering-review-data.md`(D1~D5)·`...-review-analytics.md`(A1~A9), 반영 표 `2026-10-25-spec-engineering.md` 6절, 00-product 3-4·KPI-04, 90-deliverables D4.
- lint: Bash 도구가 없어 `node scripts/lint-spec.mjs`는 실행하지 못함. 스크립트 정규식(적절·충분·깔끔 등 13어간)을 Grep으로 재현 → 70 전체 0건, 필수 절 6개(목적·원칙·규칙·접점·체크리스트·변경 이력) 제목 존재. 오케스트레이터가 1회 재실행 필요.

## 1. r1 차단 14건 판정

| # | 판정 | 근거 (70 v1.1 위치) |
| --- | --- | --- |
| D1 | 해소 | 3-5 EF-2 `withdraw {scope, channel}` 행 + lead_access_logs `withdraw` 1행, DR8 enum 추가는 EC-18 |
| D2 | 해소 | EF-2 "is_demo 예외" 줄(status_change retention 갱신 0, withdraw는 now()만) + 3-12 retention_until 3케이스 + 체크리스트 |
| D3 | 해소 | 3-8 "파생값 삭제" 행(`retention-daily`가 rate_limits 24시간 초과 삭제, `deleted_rate_limits`), RLS 표에 rate_limits, 95 쪽은 EC-19. 단 보존 시한 수치는 아래 새 차단 N1 |
| D4 | 해소 | 3-5b 컬럼 요건 16행(UNIQUE·인덱스·null·출처), receipt_no 6자리 hex + `UNIQUE` + 재생성 1회, 3-5·3-6·체크리스트 정규식 `{6}` 일치, lead_access_logs.lead_id null 명기 |
| D5 | 해소 | 3-1 "콘텐츠 정본" 행(seed = 정본, DB = 동기화본, 머지 전 `pnpm data:sql` → `db push --include-seed`, seed·DB id 불일치 시 빌드 실패) + 3-9 문구 정정 + 체크리스트. view_count·sources는 EC-20 |
| A1 | 해소 | 3-10 "동의 전 큐" 행(로더 직전 consent 외 제거 + view 1건 재push, 동의 전 form_start 전송 0) + 단위 테스트 + 체크리스트. 95 확인은 EC-21 |
| A2 | 해소 | 3-10 "동의 철회" 행(denied push → 쿠키 삭제 → reload) + QG-07 "동의 → 철회 → 새로고침 뒤 철회 범주 요청 0" |
| A3 | 해소 | 3-6 표 "P-07 투명성 블록" 열(live·is_demo false만 실제 객체, 그 외 BDG-7 "예시 리포트"), PB-11에 TRK 동의 줄, 10 쪽은 EC-22 |
| A4 | 해소 | 3-4 `lib/attribution.ts` + 3-10 "유입 기록" 행(세션 첫 PV 1회, 덮어쓰기 0, 쿼리 제거 전 `rs_fbc`, 순서 고정) + 단위 테스트 3케이스. `_utm` 쿠키 불일치는 EC-23 |
| A5 | **미해소** | EF-1 ⑧ 예외는 서버 `Lead`(test_event_code) 1건만 보냄. 90 D4 필수 증거는 "중복 제거"(Lead event_id = lead_id)인데, 중복 제거 표시는 브라우저 Lead와 서버 Lead가 같은 event_id로 모두 들어와야 나온다. 00 3-4·70 3-6은 is_demo 리드의 `generate_lead` push를 0으로 고정하므로 브라우저 쪽 Lead가 없다 → 캡처가 "서버 Lead 1건"으로 끝나 D4 증거 불성립. 3-12 "CAPI 중복 제거 캡처는 ⑧ 예외로 만든다"는 문장이 사실과 다름. 체크리스트 해당 항목도 "Lead 1건 표시"만 확인 |
| A6 | 해소 | 3-14 `metrics` 잡 8단계(GA4 Data API·GTM export·키 파일 `if: always()` 삭제), "지표 입력 계약" 6행, QG-15(zod + KPI-01~13), `lib/metrics/*.ts` 커버리지 포함, 3-16 후보 행 |
| A7 | 해소 | 3-12 동의 후·철회 e2e = 로컬 `out/` + 태그 도메인 7개 `page.route` 스텁, 배포 URL e2e 동의 클릭 0, 실수신은 사람 DebugView 1회 |
| A8 | 해소 | 3-8 CSP "GTM Preview 전용 목록"(`CSP_GTM_PREVIEW=1`, 배포 2회·≤ 24시간) + 4-1 40 행 "Custom JS 변수 0개 확정" |
| A9 | 해소 | EF-3 아래 + 3-10 `lead_qualified` 행(서버 전용, `rg` 검사 0), 수신 확인은 GA4 Data API, track.ts 타입·screen-spec은 EC-25 |

집계: 해소 13 / 미해소 1(A5).

## 2. 이번 수정으로 새로 생긴 차단 (1건)

1. **N1 — 충돌: rate_limits "보존 ≤ 24시간"(3-5b rate_limits 행, 3-8 암호화 표 "중복 판정용" 행) ↔ 삭제 방식(3-8 "파생값 삭제" 행).** 삭제는 `retention-daily` 1일 1회(18:00 UTC)에 `at < now() - 24시간`만 지우므로 행은 최대 48시간 남는다(예: 17:59 UTC 삽입 → 다음 날 18:00 실행 때 24시간 미만이라 잔존 → 그다음 날 18:00 삭제 = 약 48시간). EC-19로 95 처리방침에 "24시간"이 등재될 예정이라 공지 수치와 실제 보존이 어긋난다. 체크리스트 "at < now() − 24시간 행 0"은 실행 직후에만 참이라 이 초과를 못 잡는다.
   - 고칠 방향(택1): 문서 수치를 "최대 48시간"으로 바꾸고 EC-19에 같은 수치 기록 / 삭제 조건을 `at < now() - interval '10 minutes'`(레이트 창과 같음)로 줄여 최대 보존 ≈ 24시간 10분으로 쓰고 수치를 "≤ 25시간"으로 정정.

## 3. 비차단 (3건)

- NB1. 헤더 1·3행은 "v1", 변경 이력은 "v1.1"로 버전 표기가 갈린다. 0절 3번 "leads 계열 4개 테이블"은 3-8 RLS 표(rate_limits 포함 5개)와 수가 다르다.
- NB2. 3-1 `build-data`의 seed·DB id 비교는 Supabase 일시 정지·네트워크 실패 시 동작(빌드 실패 vs 건너뜀)이 없다. 또 3-7은 SERVICE_ROLE_KEY를 "`pnpm data:sql` 시드 업로드"에 쓴다고 하고 3-1은 `db push`(DB 비밀번호)로 동기화한다고 해 사용 키가 두 가지로 읽힌다.
- NB3. EF-2 `withdraw`의 입력 `channel`을 쓰는 출력·로그가 없다. 빌드 변수 `CSP_GTM_PREVIEW`가 3-7 Variables 목록에 없다. EF-1 ⑧ 예외에서 `ad_consent` false 입력 처리(전송 여부)도 한 줄 필요(A5 수정 때 함께).

판정: request-changes
