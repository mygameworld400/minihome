-- ===========================================================
--  MINI HOME — 초기 데이터
--
--  실행 순서
--    1) schema.sql 실행
--    2) Authentication → Users → Add user 로 계정 하나 생성
--         Email    : minihome@minihome.local
--         Password : 입장코드 (사이트에서 입력할 코드)
--         ✅ Auto Confirm User 체크
--    3) 이 파일 실행
--
--  이 계정의 비밀번호가 곧 입장코드다. 나중에 코드를 바꾸려면
--  같은 화면에서 비밀번호만 바꾸면 된다. 코드는 앱 코드 어디에도
--  저장돼 있지 않다.
-- ===========================================================
do $$
declare
  v_owner uuid;
  v_track_id bigint;
  v_prev bigint;
  v_cat bigint;
begin
  select id into v_owner from auth.users where email = 'minihome@minihome.local';
  if v_owner is null then
    raise exception '계정이 없습니다. Authentication → Users 에서 minihome@minihome.local 를 먼저 만들어 주세요 (Auto Confirm User 체크).';
  end if;

  -- 이미 넣었으면 건너뛴다
  if exists (select 1 from public.mh_tracks where owner = v_owner) then
    raise notice '이미 초기 데이터가 있습니다. 건너뜁니다.';
    return;
  end if;

  -- ── 프로필 ──────────────────────────────────────────────
  insert into public.mh_profiles (owner, nickname, bio, avatar_emoji, status, mood, today_goal)
  values (v_owner, 'MINJI', '오늘도 하나씩 해내는 중 ☁️', '🐰', '작업중', '😊', '오늘 업무 10개 끝내기')
  on conflict (owner) do nothing;

  -- ── 담당자 ──────────────────────────────────────────────
  insert into public.mh_people (owner, name, emoji, color, sort_order) values
    (v_owner, '민지', '🐰', '#ffd9e6', 1),
    (v_owner, '도희', '🐻', '#ffe9c7', 2),
    (v_owner, '의준', '🐼', '#e8f4ff', 3),
    (v_owner, '정인', '🐨', '#e6e2ff', 4),
    (v_owner, '희정', '🐤', '#fff6c7', 5);

  -- ── 트랙 + 업무 ─────────────────────────────────────────
  -- ① 카페
  insert into public.mh_tracks (owner, name, emoji, color, sort_order)
  values (v_owner, '카페', '☕', '#ffd9e6', 1) returning id into v_track_id;

  insert into public.mh_tasks (owner, title, track_id, sort_order) values
    (v_owner, '카페 수정발행', v_track_id, 1),
    (v_owner, '댓글 작업', v_track_id, 2),
    (v_owner, '키워드 추가', v_track_id, 3),
    (v_owner, '새 키워드 원고 작성', v_track_id, 4),
    (v_owner, '일상글 가능한 카페 발굴', v_track_id, 5);

  -- 선행 업무 체인: 비실계 구매 → 아이피 구매 → 비실계 일상글 발행
  insert into public.mh_tasks (owner, title, track_id, sort_order)
  values (v_owner, '비실계 구매', v_track_id, 6) returning id into v_prev;

  insert into public.mh_tasks (owner, title, track_id, sort_order, predecessor_id)
  values (v_owner, '아이피 구매', v_track_id, 7, v_prev) returning id into v_prev;

  insert into public.mh_tasks (owner, title, track_id, sort_order, predecessor_id)
  values (v_owner, '비실계 아이디 일상글 발행', v_track_id, 8, v_prev) returning id into v_prev;

  insert into public.mh_tasks (owner, title, track_id, sort_order, predecessor_id) values
    (v_owner, '몰발 일상글 템플릿 세팅', v_track_id, 9, v_prev);
  insert into public.mh_tasks (owner, title, track_id, sort_order) values
    (v_owner, '기타 카페 관련 업무', v_track_id, 10);

  -- ② 블로그
  insert into public.mh_tracks (owner, name, emoji, color, sort_order)
  values (v_owner, '블로그', '📝', '#e8f4ff', 2) returning id into v_track_id;
  insert into public.mh_tasks (owner, title, track_id, sort_order) values
    (v_owner, '정보성 블로그', v_track_id, 1),
    (v_owner, '매물 블로그', v_track_id, 2),
    (v_owner, '블로그 노출 원고', v_track_id, 3),
    (v_owner, '블로그 샘플 작업', v_track_id, 4),
    (v_owner, '블로그 작성', v_track_id, 5),
    (v_owner, '기타 블로그 업무', v_track_id, 6);

  -- ③ 마케팅 / 광고
  insert into public.mh_tracks (owner, name, emoji, color, sort_order)
  values (v_owner, '마케팅 / 광고', '📣', '#ffe9c7', 3) returning id into v_track_id;
  insert into public.mh_tasks (owner, title, track_id, sort_order) values
    (v_owner, '사업자 확인', v_track_id, 1),
    (v_owner, '파워링크', v_track_id, 2),
    (v_owner, '메타광고', v_track_id, 3),
    (v_owner, '키워드 광고', v_track_id, 4),
    (v_owner, '마케팅 원고', v_track_id, 5),
    (v_owner, '광고 등록', v_track_id, 6),
    (v_owner, '기타 마케팅 업무', v_track_id, 7);

  -- ④ 릴스 / 영상
  insert into public.mh_tracks (owner, name, emoji, color, sort_order)
  values (v_owner, '릴스 / 영상', '🎬', '#e6e2ff', 4) returning id into v_track_id;
  insert into public.mh_tasks (owner, title, track_id, sort_order)
  values (v_owner, '릴스 방향성', v_track_id, 1) returning id into v_prev;
  insert into public.mh_tasks (owner, title, track_id, sort_order, predecessor_id)
  values (v_owner, '레퍼런스 수집', v_track_id, 2, v_prev) returning id into v_prev;
  insert into public.mh_tasks (owner, title, track_id, sort_order, predecessor_id)
  values (v_owner, '기획', v_track_id, 3, v_prev) returning id into v_prev;
  insert into public.mh_tasks (owner, title, track_id, sort_order, predecessor_id)
  values (v_owner, '영상 제작', v_track_id, 4, v_prev) returning id into v_prev;
  insert into public.mh_tasks (owner, title, track_id, sort_order, predecessor_id)
  values (v_owner, '업로드', v_track_id, 5, v_prev);
  insert into public.mh_tasks (owner, title, track_id, sort_order) values
    (v_owner, '기타 영상 업무', v_track_id, 6);

  -- ⑤ 부동산
  insert into public.mh_tracks (owner, name, emoji, color, sort_order)
  values (v_owner, '부동산', '🏠', '#d9f2e6', 5) returning id into v_track_id;
  insert into public.mh_tasks (owner, title, track_id, sort_order) values
    (v_owner, '매물 정보', v_track_id, 1),
    (v_owner, '매물 릴스', v_track_id, 2),
    (v_owner, '매물 블로그', v_track_id, 3),
    (v_owner, '매물 카페', v_track_id, 4),
    (v_owner, '부동산 광고', v_track_id, 5),
    (v_owner, '부동산 마케팅 준비', v_track_id, 6),
    (v_owner, '기타 부동산 업무', v_track_id, 7);

  -- ⑥ 지식인
  insert into public.mh_tracks (owner, name, emoji, color, sort_order)
  values (v_owner, '지식인', '💬', '#fff6c7', 6) returning id into v_track_id;
  insert into public.mh_tasks (owner, title, track_id, sort_order) values
    (v_owner, '질문', v_track_id, 1),
    (v_owner, '답변', v_track_id, 2),
    (v_owner, '상위노출', v_track_id, 3),
    (v_owner, '마킹', v_track_id, 4),
    (v_owner, '키워드 관리', v_track_id, 5);

  -- ⑦ 자사몰 / 리뷰
  insert into public.mh_tracks (owner, name, emoji, color, sort_order)
  values (v_owner, '자사몰 / 리뷰', '⭐', '#ffe3f1', 7) returning id into v_track_id;
  insert into public.mh_tasks (owner, title, track_id, sort_order) values
    (v_owner, '리뷰 수집', v_track_id, 1),
    (v_owner, '리뷰 등록', v_track_id, 2),
    (v_owner, '포토리뷰', v_track_id, 3),
    (v_owner, '리뷰 요약', v_track_id, 4),
    (v_owner, 'AI 리뷰 요약', v_track_id, 5),
    (v_owner, '상단 리뷰', v_track_id, 6),
    (v_owner, '기타 리뷰 작업', v_track_id, 7);

  -- ⑧ 제품 / 판매 세팅
  insert into public.mh_tracks (owner, name, emoji, color, sort_order)
  values (v_owner, '제품 / 판매 세팅', '📦', '#e0f0ff', 8) returning id into v_track_id;
  insert into public.mh_tasks (owner, title, track_id, sort_order) values
    (v_owner, '네이버 스마트스토어', v_track_id, 1),
    (v_owner, '쿠팡', v_track_id, 2),
    (v_owner, '제품명 검색결과', v_track_id, 3),
    (v_owner, '파워링크', v_track_id, 4),
    (v_owner, '상품문의', v_track_id, 5),
    (v_owner, '판매가', v_track_id, 6),
    (v_owner, '샘플', v_track_id, 7),
    (v_owner, '제품 발주', v_track_id, 8);

  -- ⑨ 콘텐츠 / 채널
  insert into public.mh_tracks (owner, name, emoji, color, sort_order)
  values (v_owner, '콘텐츠 / 채널', '📱', '#f0e6ff', 9) returning id into v_track_id;
  insert into public.mh_tasks (owner, title, track_id, sort_order) values
    (v_owner, '인스타그램', v_track_id, 1),
    (v_owner, '페이스북', v_track_id, 2),
    (v_owner, '메타', v_track_id, 3),
    (v_owner, 'SNS', v_track_id, 4),
    (v_owner, 'CS 문구', v_track_id, 5),
    (v_owner, '기타 채널 관리', v_track_id, 6);

  -- ⑩ 새로운 제품 기획 — 항상 마지막
  insert into public.mh_tracks (owner, name, emoji, color, sort_order, description)
  values (v_owner, '새로운 제품 기획', '✨', '#ffeaea', 99,
          '기존 업무·판매 시스템이 구축된 뒤 사용하는 마지막 단계 트랙')
  returning id into v_track_id;
  insert into public.mh_tasks (owner, title, track_id, sort_order, status) values
    (v_owner, '아이디어 수집', v_track_id, 1, 'hold'),
    (v_owner, '시장 조사', v_track_id, 2, 'hold'),
    (v_owner, '제품 컨셉 정리', v_track_id, 3, 'hold');

  -- ── 개인보드 카테고리 ───────────────────────────────────
  insert into public.mh_personal_categories (owner, name, icon, color, sort_order)
  values (v_owner, '오늘 할 일', '🌷', '#ffd9e6', 1) returning id into v_cat;
  insert into public.mh_personal_tasks (owner, title, category_id, sort_order) values
    (v_owner, '운동', v_cat, 1),
    (v_owner, '공부', v_cat, 2),
    (v_owner, '장보기', v_cat, 3),
    (v_owner, '청소', v_cat, 4);

  insert into public.mh_personal_categories (owner, name, icon, color, sort_order)
  values (v_owner, '지출', '💰', '#fff6c7', 2) returning id into v_cat;
  insert into public.mh_personal_tasks (owner, title, category_id, sort_order) values
    (v_owner, '식비', v_cat, 1),
    (v_owner, '쇼핑', v_cat, 2),
    (v_owner, '교통', v_cat, 3);

  insert into public.mh_personal_categories (owner, name, icon, color, sort_order)
  values (v_owner, '공부', '📚', '#e8f4ff', 3) returning id into v_cat;
  insert into public.mh_personal_tasks (owner, title, category_id, sort_order) values
    (v_owner, '공부할 것 정리', v_cat, 1),
    (v_owner, '공부 기록', v_cat, 2);

  insert into public.mh_personal_categories (owner, name, icon, color, sort_order) values
    (v_owner, '개인 메모', '📝', '#e6e2ff', 4),
    (v_owner, '아이디어',  '💡', '#fff0d9', 5),
    (v_owner, '하고 싶은 것', '❤️', '#ffe3f1', 6);

  -- ── 메모 / 다이어리 예시 ────────────────────────────────
  insert into public.mh_memos (owner, title, content, category, tags) values
    (v_owner, '첫 메모', '여기에 자유롭게 기록해요 ✏️', '일상', array['시작']);

  insert into public.mh_diary (owner, mood, body) values
    (v_owner, '😊', '미니홈피 만든 날! 오늘부터 여기에 기록해야지 ☁️');

  raise notice '초기 데이터 생성 완료!';
end $$;
