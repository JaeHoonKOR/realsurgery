-- 상담 신청(리드) 테이블 (screen-spec 8절 데이터 모델·보안, 4절 P-06·A-01) — T-101 / T-109
-- 원칙: 브라우저(anon)는 leads 를 읽지도 쓰지도 못한다. 쓰기 = Edge Function submit-lead(service role),
--       읽기 = 관리자(app_metadata.role = 'admin')만. service role 은 RLS 를 우회한다.
-- 스펙 대비 추가 컬럼(SPEC-GAP 기록):
--   phone_hash(HMAC-SHA256, 5분 중복 차단·동일인 조회용 — 암호문은 비교 불가), consent_version·consented_at(동의 증빙),
--   status_changed_at(보유 기간 기산점), page_url(CAPI event_source_url)

create table if not exists public.leads (
  "id" uuid primary key default gen_random_uuid(),
  "procedure_id" text references public.procedures ("id") on update cascade on delete set null,
  "clinic_id" text references public.clinics ("id") on update cascade on delete set null,
  "name" text not null check (char_length("name") between 2 and 20),
  -- AES-256-GCM 암호문 "v1:<iv base64>:<ciphertext base64>" — 평문 번호는 저장하지 않는다
  "phone" text not null check ("phone" like 'v1:%'),
  "phone_hash" text not null,
  "region" text not null check ("region" in ('gangnam-seocho', 'seoul-etc', 'gyeonggi-incheon', 'busan-gyeongnam', 'etc')),
  "timing" text not null check ("timing" in ('within_1m', 'within_3m', 'undecided')),
  "contact_time" text not null check ("contact_time" in ('morning', 'afternoon', 'evening', 'anytime')),
  "memo" text check (char_length("memo") <= 500),
  "consent_privacy" boolean not null check ("consent_privacy"),
  "consent_3rd" boolean not null check ("consent_3rd"),
  "consent_marketing" boolean not null default false,
  "consent_version" text not null,
  "consented_at" timestamptz not null default now(),
  "utm_source" text,
  "utm_medium" text,
  "utm_campaign" text,
  "utm_content" text,
  "gclid" text,
  "fbclid" text,
  "fbc" text,
  "fbp" text,
  "ga_client_id" text,
  "landing_page" text,
  "referrer" text,
  "page_url" text,
  -- 신규·연락중·예약확정·내원·취소 (A-01)
  "status" text not null default 'new' check ("status" in ('new', 'contacting', 'booked', 'visited', 'canceled')),
  "status_changed_at" timestamptz not null default now(),
  "created_at" timestamptz not null default now()
);

create index if not exists leads_created_at_idx on public.leads ("created_at" desc);
create index if not exists leads_phone_hash_created_at_idx on public.leads ("phone_hash", "created_at" desc);
create index if not exists leads_status_idx on public.leads ("status");

create table if not exists public.lead_status_logs (
  "id" bigint generated always as identity primary key,
  "lead_id" uuid not null references public.leads ("id") on delete cascade,
  "from_status" text,
  "to_status" text not null,
  "changed_by" uuid,
  "changed_at" timestamptz not null default now()
);
create index if not exists lead_status_logs_lead_id_idx on public.lead_status_logs ("lead_id", "changed_at" desc);

-- 관리자 판별: Supabase Auth 의 app_metadata(사용자가 직접 바꿀 수 없는 값). scripts/create-admin.ts 가 role=admin 을 넣는다.
create or replace function public.is_admin() returns boolean
  language sql stable
  set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

alter table public.leads enable row level security;
alter table public.lead_status_logs enable row level security;

-- insert/update/delete 정책 없음 → anon·authenticated 쓰기는 전부 거부(service role 만 씀). 읽기는 관리자만.
drop policy if exists "leads readable by admin" on public.leads;
create policy "leads readable by admin" on public.leads for select to authenticated using (public.is_admin());
drop policy if exists "lead logs readable by admin" on public.lead_status_logs;
create policy "lead logs readable by admin" on public.lead_status_logs for select to authenticated using (public.is_admin());

revoke all on public.leads from anon;
revoke all on public.lead_status_logs from anon;

-- 상태가 바뀌면 기산점 갱신 + 변경 로그(changed_by = 요청한 관리자). 상태 변경은 qualify-lead 등 Edge Function 이 한다.
create or replace function public.log_lead_status() returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  if new."status" is distinct from old."status" then
    new."status_changed_at" := now();
    insert into public.lead_status_logs ("lead_id", "from_status", "to_status", "changed_by")
    values (new."id", old."status", new."status", auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists leads_status_log on public.leads;
create trigger leads_status_log before update of "status" on public.leads
  for each row execute function public.log_lead_status();

-- 보유 기간 만료 파기(8절 보안, 개인정보처리방침 제4조): 상담 완료(내원·취소) 후 1년, 진행되지 않은 신청은 신청일로부터 1년.
create or replace function public.purge_expired_leads() returns integer
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  removed integer;
begin
  delete from public.leads
  where ("status" in ('visited', 'canceled') and "status_changed_at" < now() - interval '1 year')
     or ("status" not in ('visited', 'canceled') and "created_at" < now() - interval '1 year');
  get diagnostics removed = row_count;
  return removed;
end;
$$;
revoke all on function public.purge_expired_leads() from public, anon, authenticated;

-- 매일 03:10(UTC) 자동 파기. pg_cron 확장이 켜진 프로젝트에서만 등록한다(로컬·확장 미설치 환경에서는 건너뜀).
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'purge-expired-leads';
    perform cron.schedule('purge-expired-leads', '10 3 * * *', 'select public.purge_expired_leads()');
  end if;
end;
$$;
