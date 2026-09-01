-- ===========================================================
--  MINI HOME — 취미보드 + 가계부 추가
--
--  SQL Editor 에 붙여넣고 Run. 여러 번 실행해도 안전하다.
--  기존 테이블은 건드리지 않는다.
-- ===========================================================

-- ── 취미 ──────────────────────────────────────────────────
create table if not exists public.mh_hobbies (
  id         bigserial primary key,
  owner      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null,
  icon       text not null default '🎨',
  color      text not null default '#ffd9e6',
  memo       text not null default '',
  sort_order int  not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mh_hobbies_owner_idx on public.mh_hobbies (owner, sort_order);

-- ── 취미별 투두 ───────────────────────────────────────────
create table if not exists public.mh_hobby_tasks (
  id           bigserial primary key,
  owner        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  hobby_id     bigint not null references public.mh_hobbies(id) on delete cascade,
  title        text not null,
  done         boolean not null default false,
  sort_order   int  not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists mh_hobby_tasks_idx on public.mh_hobby_tasks (owner, hobby_id, sort_order);

-- ── 가계부 카테고리 ───────────────────────────────────────
--  kind : income(수입) / expense(지출)
create table if not exists public.mh_ledger_categories (
  id         bigserial primary key,
  owner      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null,
  kind       text not null default 'expense' check (kind in ('income','expense')),
  emoji      text not null default '💸',
  color      text not null default '#ffd9e6',
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists mh_ledger_cat_idx on public.mh_ledger_categories (owner, kind, sort_order);

-- ── 가계부 내역 ───────────────────────────────────────────
create table if not exists public.mh_ledger_entries (
  id          bigserial primary key,
  owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind        text not null check (kind in ('income','expense')),
  title       text not null,
  amount      bigint not null check (amount >= 0),
  category_id bigint references public.mh_ledger_categories(id) on delete set null,
  entry_date  date not null default current_date,
  memo        text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists mh_ledger_entry_idx on public.mh_ledger_entries (owner, entry_date desc, id desc);

-- ── updated_at 자동 갱신 ──────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['mh_hobbies','mh_hobby_tasks','mh_ledger_entries'] loop
    execute format('drop trigger if exists %I_touch on public.%I', t, t);
    execute format(
      'create trigger %I_touch before update on public.%I
       for each row execute function public.mh_touch()', t, t);
  end loop;
end $$;

-- 취미 투두 완료 시각
drop trigger if exists mh_hobby_tasks_completed on public.mh_hobby_tasks;
create or replace function public.mh_hobby_done()
returns trigger language plpgsql as $$
begin
  if new.done and not coalesce(old.done, false) then
    new.completed_at := now();
  elsif not new.done then
    new.completed_at := null;
  end if;
  return new;
end $$;
create trigger mh_hobby_tasks_completed before update on public.mh_hobby_tasks
  for each row execute function public.mh_hobby_done();

-- ── RLS ───────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'mh_hobbies','mh_hobby_tasks','mh_ledger_categories','mh_ledger_entries'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s 본인만" on public.%I', t, t);
    execute format(
      'create policy "%s 본인만" on public.%I
         for all using (owner = auth.uid()) with check (owner = auth.uid())', t, t);
  end loop;
end $$;

-- ===========================================================
--  초기 데이터
-- ===========================================================
do $$
declare
  v_owner uuid;
  v_h bigint;
begin
  select id into v_owner from auth.users where email = 'minihome@minihome.local';
  if v_owner is null then
    raise notice '계정을 찾지 못해 초기 데이터를 건너뜁니다.';
    return;
  end if;

  -- 취미 ----------------------------------------------------
  if not exists (select 1 from public.mh_hobbies where owner = v_owner) then
    insert into public.mh_hobbies (owner, name, icon, color, sort_order, memo)
    values (v_owner, '운동', '🏃', '#ffd9e6', 1, '주 3회 목표!') returning id into v_h;
    insert into public.mh_hobby_tasks (owner, hobby_id, title, sort_order) values
      (v_owner, v_h, '러닝 5km', 1),
      (v_owner, v_h, '스트레칭 10분', 2);

    insert into public.mh_hobbies (owner, name, icon, color, sort_order)
    values (v_owner, '영화', '🎬', '#e8f4ff', 2) returning id into v_h;
    insert into public.mh_hobby_tasks (owner, hobby_id, title, sort_order) values
      (v_owner, v_h, '보고싶은 영화 목록 정리', 1);

    insert into public.mh_hobbies (owner, name, icon, color, sort_order)
    values (v_owner, '뜨개질', '🧶', '#fff6c7', 3) returning id into v_h;
    insert into public.mh_hobby_tasks (owner, hobby_id, title, sort_order) values
      (v_owner, v_h, '실 사기', 1),
      (v_owner, v_h, '목도리 뜨기', 2);
  end if;

  -- 가계부 카테고리 -----------------------------------------
  if not exists (select 1 from public.mh_ledger_categories where owner = v_owner) then
    insert into public.mh_ledger_categories (owner, name, kind, emoji, color, sort_order) values
      (v_owner, '식비',   'expense', '🍚', '#ffb8d1', 1),
      (v_owner, '쇼핑',   'expense', '🛍️', '#c4b8f0', 2),
      (v_owner, '교통',   'expense', '🚌', '#a9d4f5', 3),
      (v_owner, '카페',   'expense', '☕', '#ffcb96', 4),
      (v_owner, '문화',   'expense', '🎬', '#9fd9be', 5),
      (v_owner, '고정비', 'expense', '🏠', '#f3a8a8', 6),
      (v_owner, '기타',   'expense', '📦', '#c9c2d4', 7),
      (v_owner, '월급',   'income',  '💰', '#9fd9be', 1),
      (v_owner, '용돈',   'income',  '🎁', '#ffe08a', 2),
      (v_owner, '부수입', 'income',  '✨', '#a9d4f5', 3);
  end if;

  raise notice '취미보드 + 가계부 준비 완료!';
end $$;
