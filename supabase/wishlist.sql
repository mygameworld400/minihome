-- ===========================================================
--  MINI HOME — 위시리스트 추가
--
--  카테고리별로 갖고 싶은 것 / 가보고 싶은 곳을 모아둔다.
--  기본 카테고리: 옷 · 잡화 · 화장품 · 맛집 · 장소
--
--  SQL Editor 에 붙여넣고 Run. 여러 번 실행해도 안전하다.
-- ===========================================================

-- ── 위시 카테고리 ─────────────────────────────────────────
create table if not exists public.mh_wish_categories (
  id         bigserial primary key,
  owner      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null,
  icon       text not null default '💝',
  color      text not null default '#ffd9e6',
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists mh_wish_cat_idx on public.mh_wish_categories (owner, sort_order);

-- ── 위시 항목 ─────────────────────────────────────────────
--  price 는 옷·잡화·화장품에서, url 은 쇼핑몰·지도 링크로 쓴다.
--  got = 샀다 / 가봤다
create table if not exists public.mh_wishes (
  id          bigserial primary key,
  owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category_id bigint references public.mh_wish_categories(id) on delete cascade,
  title       text not null,
  url         text not null default '',
  price       bigint,
  memo        text not null default '',
  got         boolean not null default false,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  got_at      timestamptz
);
create index if not exists mh_wishes_idx on public.mh_wishes (owner, category_id, sort_order);

-- ── 트리거 ────────────────────────────────────────────────
drop trigger if exists mh_wishes_touch on public.mh_wishes;
create trigger mh_wishes_touch before update on public.mh_wishes
  for each row execute function public.mh_touch();

create or replace function public.mh_wish_got()
returns trigger language plpgsql as $$
begin
  if new.got and not coalesce(old.got, false) then
    new.got_at := now();
  elsif not new.got then
    new.got_at := null;
  end if;
  return new;
end $$;

drop trigger if exists mh_wishes_got on public.mh_wishes;
create trigger mh_wishes_got before update on public.mh_wishes
  for each row execute function public.mh_wish_got();

-- ── RLS ───────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['mh_wish_categories', 'mh_wishes'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s 본인만" on public.%I', t, t);
    execute format(
      'create policy "%s 본인만" on public.%I
         for all using (owner = auth.uid()) with check (owner = auth.uid())', t, t);
  end loop;
end $$;

-- ── 기본 카테고리 ─────────────────────────────────────────
do $$
declare v_owner uuid;
begin
  select id into v_owner from auth.users where email = 'minihome@minihome.local';
  if v_owner is null then
    raise notice '계정을 찾지 못해 기본 카테고리를 건너뜁니다.';
    return;
  end if;

  if exists (select 1 from public.mh_wish_categories where owner = v_owner) then
    raise notice '이미 위시 카테고리가 있습니다.';
    return;
  end if;

  insert into public.mh_wish_categories (owner, name, icon, color, sort_order) values
    (v_owner, '옷',     '👗', '#ffd9e6', 1),
    (v_owner, '잡화',   '👜', '#e6e2ff', 2),
    (v_owner, '화장품', '💄', '#ffe3f1', 3),
    (v_owner, '맛집',   '🍰', '#fff6c7', 4),
    (v_owner, '장소',   '🗺️', '#e8f4ff', 5);

  raise notice '위시리스트 준비 완료!';
end $$;
