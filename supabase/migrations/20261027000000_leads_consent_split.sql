-- 상담 신청 동의 분리 (개인정보 보호법 제22조 구분 동의) — 개인정보처리방침 「민감정보의 처리」·「개인정보의 제3자 제공」
--   1) 민감정보(관심 시술) 처리 동의(제23조)를 개인정보 수집·이용 동의와 따로 받는다 → consent_sensitive 컬럼
--   2) 병원 제3자 제공 동의는 선택으로 바꾼다(제휴 병원이 없으므로 필수로 받을 근거가 없다) → consent_3rd = true 강제 해제
-- submit-lead 함수가 새 신청마다 consent_sensitive = true 를 넣는다. 이 마이그레이션 전에 들어온 행은 null(당시 문구로 동의).

alter table public.leads add column if not exists "consent_sensitive" boolean;
alter table public.leads drop constraint if exists "leads_consent_sensitive_check";
-- null(이전 행)은 통과, false 는 거부 — 민감정보 동의 없이 저장되는 신청이 없게 한다
alter table public.leads add constraint "leads_consent_sensitive_check" check ("consent_sensitive" is distinct from false);

-- 제3자 제공: 선택 동의. 동의하지 않은 신청(false)도 저장하고, 병원에 넘길 때 이 값을 확인한다.
alter table public.leads drop constraint if exists "leads_consent_3rd_check";
alter table public.leads alter column "consent_3rd" set default false;

comment on column public.leads."consent_sensitive" is '[필수] 민감정보(관심 시술) 처리 동의 — 개인정보 보호법 제23조. null = 분리 전 신청';
comment on column public.leads."consent_3rd" is '[선택] 병원 연결을 위한 제3자 제공 동의 — false 면 병원에 제공하지 않는다';
