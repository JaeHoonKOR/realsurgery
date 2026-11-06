# T-083 교차 검토 — spec-tech-lead → `docs/specs/30-data.md` v1 (118줄)

- 2026-10-25 · 검토 역할 · 정의서 파일 수정 0
- 대조: 70 v1.2 (3-5 EF-1~5, 3-5b, 3-8), 95 v3 (3-5, 3-6, 3-12 DR1~DR10), 00 (3-5, Q10, Q14), screen-spec 8절, TASKS(T-011·T-016·T-017·T-028·T-033), `supabase/migrations/20261025000000_content_tables.sql`, `data/seed/clinics.json`
- lint: Bash 도구 없음 → `scripts/lint-spec.mjs` 3규칙을 Grep으로 재현(형용사 표 행 0건, 필수 헤딩 6개 존재, 118줄 ≤ 120). 실제 스크립트는 실행하지 않았으므로 오케스트레이터가 1회 실행해 확인할 것.
- 확인된 일치: leads 컬럼 목록·null 허용·UNIQUE·인덱스(70 3-5b 전 행), DR1~DR10, 보존 4단계 순서, rate_limits 24시간 조건·최대 48시간, RLS 정책 0 + revoke, 가상 병원 3곳 seed가 추가 check를 통과(phone·kakao_url·ad_review_no null, is_partner·is_premium false).

## 충돌 / 누락 (차단 6건)

1. **[충돌] attribution check가 70 EF-1 검증보다 엄격** — 30 3-2 "leads — 신호·유입" 행(42줄: utm_* `~ '^[ -~]*$'`, `landing_referrer_host !~ '[/:?#]'`) → 70 3-5 EF-1 `attribution` 행(181줄: 길이 ≤ 100/255/512만 검증, ASCII·포트 규칙 0), 3-10 유입 기록 → 외부 링크의 한글 `utm_campaign`, 또는 `localhost:3000`처럼 포트가 붙은 referrer 호스트는 EF 검증을 통과한 뒤 DB check에서 실패해 500 INTERNAL, 리드 유실 → 고칠 것: 70 쪽 검증(비ASCII utm은 null 저장, host는 hostname만)을 SC-09로 올리거나 DB check를 EF-1 검증 규칙과 같게 낮춘다.
2. **[누락] 메모 전용·철회 로그 행의 상태값 미정의** — 30 3-2 lead_status_logs 행(44줄 `to_status text not null`) → 70 EF-2 `withdraw`(226줄 "둘 다 lead_status_logs 1행", 상태 불변), 95 3-5 연락 시도 "lead_status_logs 메모 '시도 n/3'" (149~150줄), 70 허용 전이 5개(229줄, 연락중→연락중은 400 TRANSITION) → 30이 `to_status` 값 집합과 `from_status = to_status` 허용 여부를 정하지 않아 withdraw 행과 시도 기록 행을 INSERT할 수 없다 → 고칠 것: `from_status`·`to_status` check in 5종, 상태 불변 행은 `from_status = to_status`로 기록한다고 명시하고 전이 검증은 EF-2 `status_change`에만 둔다고 적는다.
3. **[누락] retention_runs 실패 행과 pg_cron 등록 위치** — 30 3-2 retention_runs(46줄 `deleted_*  int not null` 기본값 0 없음, `run_at` not null 없음)과 3-3 삭제 실행(58줄 "실패 시 status `error` 행 별도 insert") → 같은 문서 안에서 error 행이 not null 3열을 채울 값이 없어 INSERT 실패, 95 3-5 "실패 경보"·70 EF-5 `last_status` 입력이 비어버린다. 또 `create extension pg_cron`·`cron.schedule('retention-daily','0 18 * * *', ...)`을 어느 마이그레이션이 하는지(70 3-4 `supabase/migrations/`)도 없다 → 고칠 것: `deleted_*` default 0, `run_at not null default now()`, extension·schedule·`run_retention()`을 `*_retention.sql` 1개 파일에 둔다고 한 줄 추가.
4. **[누락] 시드에서 빠진 id의 삭제 규칙** — 30 3-5 S1(71줄) + 3-1 ERD(`procedures → leads restrict`, `clinics → leads set null`, `cascade`들) → 70 3-1 "seed·DB id 1개라도 다르면 빌드 실패", TASKS T-011 "`pnpm data:sql`(seed.sql upsert)" → upsert만 있으면 seed에서 지운 id가 DB에 남아 id 비교가 영구 실패하고, `truncate … cascade` 또는 delete-all 후 재삽입으로 풀면 leads가 같이 지워지거나(truncate cascade) clinic_id가 set null로 소실된다 → 고칠 것: S1에 "seed.sql = upsert + 시드에 없는 id만 delete, `truncate`·전체 delete 0, leads가 참조 중인 procedures 삭제는 restrict 오류로 빌드 중단" 1줄 추가.
5. **[충돌] 30 내부 — 복호화 주체** — 30 3-3 암호화 행(55줄 "복호화는 `admin-leads`만", 95 DR6)과 SQ-05(102줄 "EF에서 복호화 후 즉시 SHA-256") → Schedule 이벤트는 EF-3(`qualify-lead`)에서 나가는데 EF-3는 복호화 권한이 없다(70 EF-2 `decrypt_phone`만 lead_access_logs 1행을 남김). EF-3가 복호화하면 열람 로그 없는 복호화 경로가 생겨 DR6·DR8과 충돌한다 → 고칠 것: SQ-05 기본값을 "해시 전화는 EF-1 제출 시점 1회만 계산·전송, EF-3 Schedule은 해시 0(fbc·fbp·UA만)"으로 바꾸고 T-033과 연결한다.
6. **[누락·95 법무] 신규 저장 항목의 처리방침 등재가 30 충돌 기록에 없음** — 30 4절 충돌 기록 SC-01~08(88~95줄) → 95 3-6 수집 항목 표(171~181줄에 `phone_hash`·IP 해시·`ga_client_id`·`age_confirmed`·`consent_version` 행 없음), 70 EC-19 → 30이 컬럼을 확정하면서 개인(가명) 등급으로 분류했으나(47줄 rate_limits, 40줄 phone_hash) 95 수집 항목·보유 기간 행 추가를 T-088 대상으로 올리지 않아 처리방침(제30조 제1항 항목)에서 빠질 위험 → 고칠 것: SC-09 추가 "95 3-6 수집 항목에 phone_hash·ip_hash(보유 최대 48시간)·ga_client_id·age_confirmed·consent_version 행 추가 필요(70 EC-19 동일)".

## 비차단

- N1 EF-2 "관리자 복호화 10분 30회"(70 218줄)의 카운터 저장 위치가 30에 없음. `lead_access_logs (admin_id, action, at)` 인덱스 1개를 추가하거나 rate_limits `fn='admin-decrypt'`로 쓴다고 1줄.
- N2 3-2b enum·`status`가 check인지 불명(40줄 "enum 3-2b", 49줄 "5종"). 권장: `status`·`from/to_status`는 check, region·timing·contact_time은 SQ-04 확정 전까지 check 대신 EF 검증만. `name` `char_length between 1 and 20` 명시.
- N3 체크리스트 110줄 `phone !~ '^v1\.'`는 키 교체(70 3-8, `v2`) 뒤 오탐. `^v[0-9]+\.`로.
- N4 receipt_no·idempotency_key 중복 UNIQUE를 EF-1이 구분해야 함(70 190~191줄). 제약명 `leads_receipt_no_key`·`leads_idempotency_key_key`를 기본 이름 그대로 쓴다고 명시.
- N5 procedures 행(37줄)에 `name`·`content_mdx` 언급이 없어 "현행 + 아래 변경"으로 읽히지 않음. 첫머리에 "현행 컬럼 유지 + 굵은 변경"을 적는다.
- N6 SQ-05는 TASKS T-033(spec-question)과 같은 주제. SQ-05 항목에 "= T-033" 병기. T-017은 `[done]` 사람 결정이므로 30의 "기본값 해시 컬럼 0"이 결정과 다른 점을 SC-03에 한 번 더 명시.
- N7 procedure-stats의 "오늘 − 30일"(50줄)은 빌드 날짜 기준. 재빌드가 없으면 만료 라벨이 늦게 바뀌므로 `daily` 재빌드 또는 빌드 시각 표기 1줄.
- N8 `price_source_url` "경로 길이 > 1"(39줄)이 DB check인지 build-data 검사인지 불명. 후자면 S5에 옮긴다.

## 판정

request-changes (차단 6건: 1·2·3·4·5·6)
