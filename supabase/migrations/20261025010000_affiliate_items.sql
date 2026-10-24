-- P-03 회복기 추천템 (screen-spec 4절 P-03, 8절 affiliate_items) — T-103
-- 쿠팡파트너스 제휴 링크. 화면은 시술마다 order 순 최대 3개를 "광고" 표기와 함께 보여 준다.
-- 파트너스 가입 전에는 행이 없고 화면은 영역을 숨긴다(needs-key: T-001 쿠팡 파트너스).
-- 브라우저(anon)는 읽기만, 쓰기는 service role 만. 재실행해도 실패하지 않게 if not exists / drop policy if exists.

create table if not exists public.affiliate_items (
  "id" text primary key,
  "procedure_id" text not null references public.procedures ("id") on update cascade on delete cascade,
  "name" text not null,
  "url" text not null check ("url" like 'https://%'),
  "image" text,
  "order" integer not null default 0
);
create index if not exists affiliate_items_procedure_id_idx on public.affiliate_items ("procedure_id");

alter table public.affiliate_items enable row level security;

drop policy if exists "affiliate_items are publicly readable" on public.affiliate_items;
create policy "affiliate_items are publicly readable" on public.affiliate_items for select to anon, authenticated using (true);
