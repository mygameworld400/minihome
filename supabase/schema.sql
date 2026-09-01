-- ===========================================================
--  MINI HOME — 스키마
--  기존 게임(cc_*)과 같은 Supabase 프로젝트를 쓰므로
--  모든 테이블에 mh_ 접두사를 붙여 충돌을 피한다.
--
--  Supabase 대시보드 → SQL Editor 에 통째로 붙여넣고 실행.
--  여러 번 실행해도 안전하다 (if not exists / drop policy if exists).
-- ===========================================================

-- ── 프로필 (사용자당 1행) ──────────────────────────────────
create table if not exists public.mh_profiles (
  owner       uuid primary key references auth.users(id) on delete cascade,
  nickname    text not null default 'MINJI',
  bio         text not null default '오늘도 하나씩 해내는 중 ☁️',
  avatar_url  text,
  avatar_emoji text not null default '🐰',
  status      text not null default '작업중',
  mood        text not null default '😊',
  today_goal  text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── 담당자 ────────────────────────────────────────────────
create table if not exists public.mh_people (
  id         bigserial primary key,
  owner      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null,
  emoji      text not null default '🙂',
  color      text not null default '#ffd9e6',
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists mh_people_owner_idx on public.mh_people (owner, sort_order);

-- ── 업무 트랙 ─────────────────────────────────────────────
create table if not exists public.mh_tracks (
  id          bigserial primary key,
  owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null,
  description text not null default '',
  emoji       text not null default '📁',
  color       text not null default '#ffd9e6',
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists mh_tracks_owner_idx on public.mh_tracks (owner, sort_order);

-- ── 업무 ──────────────────────────────────────────────────
--  status : todo(대기) / doing(진행중) / done(완료) / hold(보류)
--  predecessor_id 가 있고 그 업무가 done 이 아니면 화면에서 🔒 로 잠긴다.
create table if not exists public.mh_tasks (
  id             bigserial primary key,
  owner          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title          text not null,
  track_id       bigint references public.mh_tracks(id) on delete set null,
  assignee_id    bigint references public.mh_people(id) on delete set null,
  status         text not null default 'todo' check (status in ('todo','doing','done','hold')),
  priority       text not null default 'normal' check (priority in ('low','normal','high')),
  due_date       date,
  predecessor_id bigint references public.mh_tasks(id) on delete set null,
  description    text not null default '',
  memo           text not null default '',
  sort_order     int  not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  completed_at   timestamptz
);
create index if not exists mh_tasks_owner_idx  on public.mh_tasks (owner, track_id, sort_order);
create index if not exists mh_tasks_status_idx on public.mh_tasks (owner, status);
create index if not exists mh_tasks_due_idx    on public.mh_tasks (owner, due_date);

-- ── 개인보드 카테고리 ─────────────────────────────────────
create table if not exists public.mh_personal_categories (
  id         bigserial primary key,
  owner      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null,
  icon       text not null default '🌷',
  color      text not null default '#e8f4ff',
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists mh_pcat_owner_idx on public.mh_personal_categories (owner, sort_order);

-- ── 개인 할일 ─────────────────────────────────────────────
create table if not exists public.mh_personal_tasks (
  id           bigserial primary key,
  owner        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title        text not null,
  category_id  bigint references public.mh_personal_categories(id) on delete set null,
  status       text not null default 'todo' check (status in ('todo','doing','done','hold')),
  priority     text not null default 'normal' check (priority in ('low','normal','high')),
  due_date     date,
  amount       int,                    -- 지출 카테고리에서 금액 기록용
  memo         text not null default '',
  sort_order   int  not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists mh_ptask_owner_idx on public.mh_personal_tasks (owner, category_id, sort_order);

-- ── 캘린더 일정 ───────────────────────────────────────────
create table if not exists public.mh_events (
  id          bigserial primary key,
  owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title       text not null,
  description text not null default '',
  event_date  date not null,
  event_type  text not null default 'personal',  -- personal / work / sample / ad / upload
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists mh_events_owner_idx on public.mh_events (owner, event_date);

-- ── 메모 ──────────────────────────────────────────────────
create table if not exists public.mh_memos (
  id         bigserial primary key,
  owner      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title      text not null default '',
  content    text not null default '',
  category   text not null default '일상',
  tags       text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mh_memos_owner_idx on public.mh_memos (owner, created_at desc);

-- ── 미니 다이어리 (HOME) ──────────────────────────────────
create table if not exists public.mh_diary (
  id         bigserial primary key,
  owner      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entry_date date not null default current_date,
  mood       text not null default '😊',
  body       text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mh_diary_owner_idx on public.mh_diary (owner, entry_date desc);

-- ===========================================================
--  updated_at 자동 갱신
-- ===========================================================
create or replace function public.mh_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'mh_profiles','mh_tracks','mh_tasks','mh_personal_tasks',
    'mh_events','mh_memos','mh_diary'
  ] loop
    execute format('drop trigger if exists %I_touch on public.%I', t, t);
    execute format(
      'create trigger %I_touch before update on public.%I
       for each row execute function public.mh_touch()', t, t);
  end loop;
end $$;

-- 완료 시각 자동 기록
create or replace function public.mh_mark_completed()
returns trigger language plpgsql as $$
begin
  if new.status = 'done' and (old.status is distinct from 'done') then
    new.completed_at := now();
  elsif new.status <> 'done' then
    new.completed_at := null;
  end if;
  return new;
end $$;

drop trigger if exists mh_tasks_completed on public.mh_tasks;
create trigger mh_tasks_completed before update on public.mh_tasks
  for each row execute function public.mh_mark_completed();

drop trigger if exists mh_ptasks_completed on public.mh_personal_tasks;
create trigger mh_ptasks_completed before update on public.mh_personal_tasks
  for each row execute function public.mh_mark_completed();

-- ===========================================================
--  RLS — 로그인한 본인 데이터만 읽고 쓸 수 있다.
--  이 사이트는 GitHub Pages로 공개 배포되고 publishable key가
--  번들에 들어가므로, 로그인 없이 열어두면 누구나 업무 데이터를
--  볼 수 있다. 그래서 전 테이블을 auth 기준으로 잠근다.
-- ===========================================================
do $$
declare t text;
begin
  foreach t in array array[
    'mh_profiles','mh_people','mh_tracks','mh_tasks',
    'mh_personal_categories','mh_personal_tasks',
    'mh_events','mh_memos','mh_diary'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s 본인만" on public.%I', t, t);
    execute format(
      'create policy "%s 본인만" on public.%I
         for all
         using (owner = auth.uid())
         with check (owner = auth.uid())', t, t);
  end loop;
end $$;
