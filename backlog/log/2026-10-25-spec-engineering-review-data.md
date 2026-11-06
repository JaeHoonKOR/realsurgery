# T-082 교차 검토 1 — 70-engineering v1 (spec-data-architect, 검토 역할)

대조: README, 00-product v3.1, 95-legal-ops v3(3-5·3-6·3-7·3-12 DR1~DR10), 90-deliverables, TASKS(T-016·T-028·T-083 비고), `supabase/migrations/20261025000000_content_tables.sql`. 파일 수정 0.

## 충돌 / 누락 (5건)

1. **누락 — 3-5 EF-2 action 표(205~211행) 철회 처리 없음.** 95 3-5 "철회·삭제 요청"(withdrawn_at 기록 → retention_until = now() → 다음 배치 삭제, 마케팅만 철회 시 consent_marketing = false + lead_status_logs 1행)과 DR3 withdrawn_at을 쓰는 action이 5개(list·decrypt_phone·decrypt_memo·status_change·export_csv) 중 0개.
   - 차단 이유: 영업일 1일 내 파기 의무를 운영자가 A-01로 수행할 경로가 없어 withdrawn_at이 영구 null.
   - 고칠 방향: action `withdraw {lead_id, scope: "all"|"marketing"}` 추가, lead_access_logs action enum에 `withdraw` 추가 → 이 enum 추가는 95 DR8 쪽 변경이므로 **T-088 기록**.

2. **충돌 — 3-5 EF-2 `status_change`(210행) "retention_until 갱신(95 3-5)" ↔ 95 3-5 보존 행 순서(is_demo → created_at + 7일이 상태 변경 + 365일보다 우선) · 3-7 QA 리드 "retention_until = created_at + 7일".** 70은 is_demo 리드 예외를 쓰지 않아 구현자가 예약확정 시 데모 리드를 +365일로 늘린다.
   - 차단 이유: 95 반려 조건(데모 데이터가 7일 넘게 잔존)을 70 계약대로 구현하면 위반.
   - 고칠 방향: "is_demo = true면 retention_until 갱신 0, 철회는 now()만"을 한 줄 추가.

3. **누락 — 3-8 RLS 표 "레이트 제한 테이블(30)"(280행)·암호화 표 IP 해시 "보존 ≤ 24시간"(290행)의 삭제 주체·수집 항목 등재 없음.** 95 3-5 파기 배치 대상은 leads·lead_access_logs 2종, DR9 retention_runs 컬럼도 2종 건수뿐이라 IP 해시 행은 아무도 지우지 않는다.
   - 차단 이유: 24시간 규칙이 실행되지 않고 개인정보(IP 파생값)가 무기한 쌓임.
   - 고칠 방향: 3-8에 "pg_cron `retention-daily`가 `rate_limits where at < now() - interval '24 hours'` 삭제, 건수는 retention_runs에 합산(컬럼 추가는 30)" 명시. 95 3-6 수집 항목 표에 `phone_hash`·IP 해시·`ga_client_id`가 없음 → **T-088 기록**(95 수집 항목·처리방침 반영).

4. **누락 — 4-1 접점 표 30-data 행 + 3-5 EF-1 입력 표: EF-1이 요구하는 leads 컬럼·제약 목록이 없다.** "컬럼 요건"이 문장 한 줄(`phone_hash`·`idempotency_key`·`receipt_no`)뿐이고 다음이 빠졌다: `age_confirmed`(EC-14, DR1~DR10에 없음), `signals` 6값(ad_consent·analytics_consent·fbc·fbp·ga_client_id) 저장 컬럼, attribution 9키, `consent_3rd`↔입력키 `third` 매핑, `idempotency_key` UNIQUE, `phone_hash` 인덱스(7일 중복 판정), `receipt_no` UNIQUE 여부, lead_access_logs.lead_id가 `view_list`·`export_csv`에서 null이어야 함(DR8은 null 허용 미기재). receipt_no = 날짜 + lead_id 끝 4hex이면 하루 65,536 조합이라 충돌 가능한데 95 철회 조회키로도 쓰인다.
   - 차단 이유: T-083(30-data)이 70에서 컬럼 요건을 받아 쓰는 구조인데 받을 표가 없어 30이 EF-1과 어긋난 DDL을 쓸 위험.
   - 고칠 방향: 3-5 뒤에 "30에 넘기는 컬럼 요건" 표(컬럼·타입 힌트·UNIQUE/INDEX·null 허용·출처 행) 1개 추가, receipt_no는 `UNIQUE` + 충돌 시 재생성 1회로 못 박기.

5. **충돌 — 3-1 아키텍처·3-9 Supabase 행 ↔ 콘텐츠 SSOT 불명확, 현행 마이그레이션과 Q14 불일치.** 3-1은 빌드 입력이 `data/seed/*.json`뿐, 3-9는 키가 있으면 다른 경로로 읽는 것처럼 읽히며(`build-data`는 "키 없으면 seed만"), EF-1은 `procedure_id`를 DB `procedures` 테이블에 대해 검증(169행)한다. DB 콘텐츠 테이블 적재는 로컬 `pnpm data:sql` 수동 1곳(257행). 또 현행 마이그레이션 `procedures.view_count integer not null default 0`(37행)은 00 Q14 "시드 `view_count` 삭제"와 T-083 비고와 어긋난다.
   - 차단 이유: seed JSON과 DB가 갈라지면 DB에 없는 procedure_id로 EF-1이 거부해 live 모드 제출이 막히고, 어느 쪽이 정본인지 30이 정할 근거가 없다.
   - 고칠 방향: "정본 = `data/seed/*.json`, DB = 배포 전 `pnpm data:sql` 동기화본, 빌드는 항상 seed 읽기, EF-1은 DB id 검증" 1문장 + `data:sql` 실행 시점을 3-14 post-deploy 전 단계에 명시. view_count 삭제·`sources` 루트 URL은 30 몫이므로 **T-088 기록**(마이그레이션 수정은 T-083 이후 새 마이그레이션).

## 비차단 (5건)

- N1. 3-10 메타 픽셀 행: T-083 비고 "P-12 쿼리 제거 전 fbc 생성 순서"가 없다. "fbclid를 읽어 `_fbc`를 만든 뒤 쿼리 제거, `signals.fbc`는 그 값" 1줄과 referrer·픽셀 `dl`·`rl` 디코딩 한글 0 검사(T-083 비고)를 Playwright 항목으로 추가 권장.
- N2. EF-1 `consent.version`: 서버에 허용 판본 목록(현재 1개)을 두고 불일치 시 VALIDATION으로 거부하면 95 "고지문 바꾸면 version 갱신"이 강제된다.
- N3. 3-8 공개 select 정책: `clinics.is_partner`·`ad_review_no`·`phone`이 anon 키 curl로 읽힌다. 화면에 그대로 보이는 값이라는 사유 1줄을 표에 적을 것(제휴 0곳이면 영향 0).
- N4. T-028(가격 조사 병원 ⊂ 등록 병원)은 70 범위 밖이나 `build-data`가 만드는 카운트(P-03 "병원 공개 가격 n곳" vs "이 시술 병원 n곳")의 원천 2개를 3-1 산출 목록에 이름만 적으면 30 구현 때 헷갈리지 않는다.
- N5. 5절 체크리스트 `curl .../rest/v1/leads` 기대값에 "revoke all이면 401·403, RLS만이면 200 `[]`"를 구분해 적으면 어느 쪽이 정상인지 판정이 흔들리지 않는다.

판정: request-changes (차단 5건)
