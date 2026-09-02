-- ===========================================================
--  MINI HOME — 업무보드를 "매일 반복" 방식으로 전환
--
--  · 업무마다 ON/OFF 를 둔다. ON 이면 매일 하는 업무.
--  · 날짜가 바뀌면 ON 인 업무는 다시 대기 상태로 돌아온다.
--  · 지금 업무 목록 자체가 곧 기본값이다. 추가·수정·삭제가
--    그대로 다음날 목록에 반영된다. (별도 템플릿 테이블 없음)
--  · 리셋하면 status 가 초기화되므로 완료 이력은 따로 남긴다.
--
--  SQL Editor 에 붙여넣고 Run. 여러 번 실행해도 안전하다.
-- ===========================================================

-- ON/OFF — 기본은 ON (기존 업무 전부 매일 업무로 본다)
alter table public.mh_tasks
  add column if not exists is_daily boolean not null default true;

-- 마지막으로 리셋한 날짜 (사용자당 1개)
alter table public.mh_profiles
  add column if not exists last_daily_reset date;

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

-- ── 일일 리셋 ─────────────────────────────────────────────
--  ON 인 업무 중 완료/진행중인 것을 대기로 되돌린다.
--  보류(hold)는 일부러 멈춰둔 것이므로 건드리지 않는다.
--  이미 오늘 리셋했으면 아무것도 하지 않는다.
create or replace function public.mh_daily_reset()
returns int
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_last date;
  v_n int := 0;
begin
  select last_daily_reset into v_last
    from public.mh_profiles where owner = auth.uid();

  if v_last is not null and v_last >= current_date then
    return 0;                      -- 오늘은 이미 처리함
  end if;

  update public.mh_tasks
     set status = 'todo', completed_at = null
   where owner = auth.uid()
     and is_daily
     and status in ('done', 'doing');
  get diagnostics v_n = row_count;

  update public.mh_profiles
     set last_daily_reset = current_date
   where owner = auth.uid();

  return v_n;
end $$;

grant execute on function public.mh_daily_reset() to authenticated;
