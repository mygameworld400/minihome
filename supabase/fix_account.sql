-- ===========================================================
--  MINI HOME — 입장 계정 복구
--
--  증상: 로그인 시 500 "Database error querying schema"
--  원인: auth.users 의 토큰 계열 컬럼이 NULL 이면 GoTrue(인증 서버)가
--        문자열로 읽다가 실패한다. 대시보드로 만든 계정은 이 값들이
--        빈 문자열('')로 채워져 있는데, SQL 로 직접 넣으면 NULL 로 남는다.
--
--  SQL Editor 에 붙여넣고 Run.
-- ===========================================================
do $$
declare
  v_email text := 'minihome@minihome.local';
  c       text;
  n       int;
begin
  -- 빈 문자열이어야 하는 컬럼들을 전부 '' 로 채운다
  -- (버전에 따라 없는 컬럼이 있으므로 존재하는 것만 처리)
  foreach c in array array[
    'confirmation_token',
    'recovery_token',
    'email_change',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change',
    'phone_change_token',
    'reauthentication_token'
  ] loop
    if exists (
      select 1 from information_schema.columns
       where table_schema = 'auth' and table_name = 'users' and column_name = c
    ) then
      execute format(
        'update auth.users set %I = coalesce(%I, '''') where email = $1', c, c
      ) using v_email;
    end if;
  end loop;

  -- 이메일 확인 처리 + 필수 값 보정
  update auth.users
     set email_confirmed_at = coalesce(email_confirmed_at, now()),
         aud                = coalesce(nullif(aud, ''), 'authenticated'),
         role               = coalesce(nullif(role, ''), 'authenticated'),
         raw_app_meta_data  = coalesce(raw_app_meta_data,
                                '{"provider":"email","providers":["email"]}'::jsonb),
         raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb),
         updated_at         = now()
   where email = v_email;

  get diagnostics n = row_count;
  if n = 0 then
    raise exception '계정(%)이 없습니다. create_account.sql 을 먼저 실행하세요.', v_email;
  end if;

  raise notice '복구 완료 — 이제 로그인이 됩니다.';
end $$;

-- 결과 확인 (아래 값이 모두 채워져 있어야 정상)
select
  email,
  (encrypted_password is not null)              as 비밀번호있음,
  (email_confirmed_at is not null)              as 이메일확인됨,
  (confirmation_token is not null)              as 토큰정상,
  aud, role,
  (select count(*) from auth.identities i where i.user_id = u.id) as identity수
from auth.users u
where email = 'minihome@minihome.local';
