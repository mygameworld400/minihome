-- ===========================================================
--  MINI HOME — 입장 계정 만들기
--
--  Authentication → Users 에서 클릭으로 만드는 것과 같은 일을
--  SQL 로 한다. SQL Editor 에 붙여넣고 Run.
--
--  ▸ 입장코드를 바꾸려면 아래 v_code 값만 고쳐서 다시 실행하면 된다.
--    (이미 계정이 있으면 비밀번호만 갱신한다)
-- ===========================================================
do $$
declare
  v_email text := 'minihome@minihome.local';
  v_code  text := 'alswlchlrh';   -- ← 입장코드
  v_id    uuid;
  v_hash  text;
begin
  -- pgcrypto 가 어느 스키마에 있든 crypt() 를 찾을 수 있게 한다
  perform set_config(
    'search_path',
    current_setting('search_path') || ', extensions, public',
    true
  );

  v_hash := crypt(v_code, gen_salt('bf'));

  -- 이미 있으면 코드만 갱신하고 끝낸다
  if exists (select 1 from auth.users where email = v_email) then
    update auth.users
       set encrypted_password = v_hash,
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           updated_at         = now()
     where email = v_email;
    raise notice '기존 계정의 입장코드를 갱신했습니다. (%)', v_email;
    return;
  end if;

  v_id := gen_random_uuid();

  -- 토큰 계열 컬럼은 반드시 빈 문자열('')이어야 한다.
  -- NULL 로 두면 GoTrue 가 문자열로 읽다 실패해서 로그인 시
  -- 500 "Database error querying schema" 가 난다.
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change,
    email_change_token_new, email_change_token_current,
    phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_id, 'authenticated', 'authenticated', v_email, v_hash,
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    '', '', '', '', '', '', '', ''
  );

  -- 비밀번호 로그인에 필요한 identity 행
  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_id, v_id::text,
    jsonb_build_object(
      'sub', v_id::text,
      'email', v_email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email', now(), now(), now()
  );

  raise notice '입장 계정을 만들었습니다. 이제 seed.sql 을 실행하세요.';
end $$;
