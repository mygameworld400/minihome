-- ===========================================================
--  MINI HOME — 업무보드를 "매일 반복" 방식으로 전환
--
--  · 업무 목록 자체가 곧 기본값이다. 별도 템플릿 테이블이 없으므로
--    추가·수정·삭제가 그대로 다음날 목록에 반영된다.
--  · 우측 상단 ON/OFF 버튼이 "다음날"의 기준이다.
--      ON  = 업무 상태
--      OFF = 업무 아닌 상태
--    OFF 에서 다시 ON 으로 켜면 하루가 새로 시작되고,
--    모든 업무가 대기 상태로 돌아온다.
--  · 리셋하면 status 가 초기화되므로 완료 이력은 따로 남긴다.
--
--  SQL Editor 에 붙여넣고 Run. 여러 번 실행해도 안전하다.
-- ===========================================================

-- 업무 상태 ON/OFF (사용자당 1개)
alter table public.mh_profiles
  add column if not exists work_mode boolean not null default true;

-- 마지막으로 하루를 넘긴 시각
alter table public.mh_profiles
  add column if not exists last_day_start timestamptz;

-- ── 완료 이력 ─────────────────────────────────────────────
--  하루에 같은 업무를 여러 번 체크해도 한 줄만 남는다.
create table if not exists public.mh_task_done_log (
  id         bigserial primary key,
  owner      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  task_id    bigint not null references public.mh_tasks(id) on delete cascade,
  done_date  date not null default current_date,
  title      text not null default '',   -- 업무가 지워져도 통계가 남도록 이름을 함께 보관
  track_id   bigint,
  created_at timestamptz not null default now(),
  unique (owner, task_id, done_date)
);
create index if not exists mh_done_log_idx on public.mh_task_done_log (owner, done_date desc);

alter table public.mh_task_done_log enable row level security;
drop policy if exists "mh_task_done_log 본인만" on public.mh_task_done_log;
create policy "mh_task_done_log 본인만" on public.mh_task_done_log
  for all using (owner = auth.uid()) with check (owner = auth.uid());

-- ── 하루 넘기기 ───────────────────────────────────────────
--  완료·진행중인 업무를 전부 대기로 되돌린다.
--  보류(hold)는 일부러 멈춰둔 것이므로 건드리지 않는다.
create or replace function public.mh_start_new_day()
returns int
language plpgsql
security invoker
set search_path = public
as $$
declare v_n int := 0;
begin
  update public.mh_tasks
     set status = 'todo', completed_at = null
   where owner = auth.uid()
     and status in ('done', 'doing');
  get diagnostics v_n = row_count;

  update public.mh_profiles
     set work_mode = true,
         last_day_start = now()
   where owner = auth.uid();

  return v_n;
end $$;

grant execute on function public.mh_start_new_day() to authenticated;

-- 예전 버전에서 만들었던 자동 리셋 함수는 더 이상 쓰지 않는다
drop function if exists public.mh_daily_reset();
