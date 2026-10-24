-- 콘텐츠 테이블 (screen-spec 8절 데이터 모델) — T-100b
-- 브라우저(anon)는 읽기만 한다. 쓰기는 service role(관리자 CMS·시드)만.
-- leads·lead_status_logs·campaigns·affiliate_items·aeo_checks 는 해당 작업(T-109 등)의 마이그레이션에서 만든다.
-- 스펙 대비 추가 컬럼(로그 SPEC-GAP 참고):
--   procedures.price_note(가격 단위 "1회 기준" 등), procedures.sources(출처 필수 규칙),
--   clinics.specialties(진료과목, 8절 폴백 공개 정보), clinics.is_demo(QUALITY 3절 가상 병원 표시),
--   clinic_procedures.price_note, authors(posts.author_id 참조 대상)

create table if not exists public.categories (
  "id" text primary key,
  "name" text not null,
  "slug" text not null unique,
  "order" integer not null default 0
);

create table if not exists public.authors (
  "id" text primary key,
  "name" text not null,
  "role" text
);

create table if not exists public.procedures (
  "id" text primary key,
  "category_id" text not null references public.categories ("id") on update cascade,
  "name" text not null,
  "slug" text not null unique,
  "summary" text not null,
  "price_low" integer check ("price_low" >= 0),
  "price_high" integer check ("price_high" >= 0),
  "price_note" text,
  "duration_min" integer check ("duration_min" >= 0),
  "recovery_days" integer check ("recovery_days" >= 0),
  "anesthesia" text,
  "content_mdx" text,
  "sources" jsonb not null default '[]'::jsonb,
  "updated_at" date not null default current_date,
  "view_count" integer not null default 0,
  constraint procedures_price_range check ("price_low" is null or "price_high" is null or "price_low" <= "price_high")
);
create index if not exists procedures_category_id_idx on public.procedures ("category_id");

create table if not exists public.procedure_faqs (
  "id" text primary key,
  "procedure_id" text not null references public.procedures ("id") on update cascade on delete cascade,
  "question" text not null,
  "answer" text not null,
  "order" integer not null default 0
);
create index if not exists procedure_faqs_procedure_id_idx on public.procedure_faqs ("procedure_id");

create table if not exists public.clinics (
  "id" text primary key,
  "name" text not null,
  "slug" text not null unique,
  "region" text not null,
  "address" text not null,
  "lat" double precision,
  "lng" double precision,
  "phone" text,
  "kakao_url" text,
  "hours" jsonb not null default '[]'::jsonb,
  "description" text,
  "specialties" text[] not null default '{}'::text[],
  "is_premium" boolean not null default false,
  "is_partner" boolean not null default false,
  "is_demo" boolean not null default false,
  "ad_review_no" text,
  -- 8절 폴백: 프리미엄 노출은 제휴 병원만, 의료광고 심의번호 필수
  constraint clinics_premium_requires_partner check (not "is_premium" or ("is_partner" and "ad_review_no" is not null))
);

create table if not exists public.clinic_procedures (
  "clinic_id" text not null references public.clinics ("id") on update cascade on delete cascade,
  "procedure_id" text not null references public.procedures ("id") on update cascade on delete cascade,
  "price_low" integer check ("price_low" >= 0),
  "price_high" integer check ("price_high" >= 0),
  "price_note" text,
  "duration_min" integer check ("duration_min" >= 0),
  "price_updated_at" date not null default current_date,
  primary key ("clinic_id", "procedure_id"),
  constraint clinic_procedures_price_range check ("price_low" is null or "price_high" is null or "price_low" <= "price_high")
);
create index if not exists clinic_procedures_procedure_id_idx on public.clinic_procedures ("procedure_id");

create table if not exists public.posts (
  "id" text primary key,
  "slug" text not null unique,
  "title" text not null,
  "summary" text not null,
  "content_mdx" text,
  "author_id" text references public.authors ("id") on update cascade,
  "published_at" date not null,
  "updated_at" date not null,
  constraint posts_dates check ("updated_at" >= "published_at")
);

-- RLS: 콘텐츠는 공개 읽기 전용. insert/update/delete 정책이 없으므로 anon·authenticated 쓰기는 거부되고 service role 만 쓴다.
alter table public.categories enable row level security;
alter table public.authors enable row level security;
alter table public.procedures enable row level security;
alter table public.procedure_faqs enable row level security;
alter table public.clinics enable row level security;
alter table public.clinic_procedures enable row level security;
alter table public.posts enable row level security;

create policy "categories are publicly readable" on public.categories for select to anon, authenticated using (true);
create policy "authors are publicly readable" on public.authors for select to anon, authenticated using (true);
create policy "procedures are publicly readable" on public.procedures for select to anon, authenticated using (true);
create policy "procedure_faqs are publicly readable" on public.procedure_faqs for select to anon, authenticated using (true);
create policy "clinics are publicly readable" on public.clinics for select to anon, authenticated using (true);
create policy "clinic_procedures are publicly readable" on public.clinic_procedures for select to anon, authenticated using (true);
create policy "posts are publicly readable" on public.posts for select to anon, authenticated using (true);
