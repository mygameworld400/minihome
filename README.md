# 🏠 MINI HOME

> 2000년대 미니홈피 감성으로 만든 나만의 업무 + 개인 관리 시스템

예쁜 목업이 아니라 **매일 실제로 쓰는 도구**를 목표로 만들었습니다.
모든 데이터는 Supabase에 저장되고, 새로고침해도 그대로 남습니다.

```
┌──────────┬────────────────────────────┐
│ 프로필   │   HOME / WORK / MY         │
│ 메뉴     │   CALENDAR / MEMO          │
│ 진행률   │   STATS / SETTINGS         │
└──────────┴────────────────────────────┘
```

---

## 기능

| 메뉴 | 하는 일 |
|---|---|
| 🏠 **HOME** | 프로필 · 오늘의 목표 · 오늘의 업무 · 진행률 · 미니 다이어리 · 최근 완료 |
| 💼 **WORK** | 트랙별 업무보드, 빠른 추가, 선행 업무 잠금, 검색·필터, 드래그 정렬 |
| 🌷 **MY** | 개인보드 — 카테고리 직접 추가/삭제, 지출은 금액 합계 자동 계산 |
| 📅 **CALENDAR** | 월 달력. 업무 마감일 + 개인 일정을 함께 표시 |
| 📝 **MEMO** | 메모지 카드, 카테고리·태그, 전문 검색 |
| 📊 **STATS** | 오늘/이번 주 완료, 트랙별·담당자별 업무량, 최근 7일 추이 |
| ⚙️ **SETTINGS** | 프로필, 트랙 관리, 담당자 관리 |

### 선행 업무 시스템

업무마다 **선행 업무**를 지정할 수 있습니다.

```
비실계 구매  ✓ 완료
   ↓
아이피 구매  🔒 선행 업무 미완료   ← 체크 버튼이 잠김
   ↓
비실계 일상글 발행  🔒
```

선행 업무를 완료하면 다음 업무가 **자동으로 활성화**됩니다.
순환 참조(A→B→A)는 선택지에서 자동으로 걸러집니다.

### 상태 표기

| 기존 방식 | 사이트 |
|---|---|
| ○ 미완료 | `○ 대기` / `◐ 진행중` |
| ✓ 완료 | `✓ 완료` |
| ⏳ 대기 | `⏳ 보류` |

---

## 기술 스택

React 19 · Vite 8 · React Router (Hash) · Supabase · 순수 CSS

라이브러리는 최소로 유지했습니다. 드래그 정렬은 브라우저 기본 HTML5
Drag & Drop을 써서 `dnd-kit` 없이 구현했고, 차트도 CSS 도트 바로 그렸습니다.

---

## 설치

```bash
git clone https://github.com/mygameworld400/minihome.git
cd minihome
npm install
```

### 1. 환경변수

`.env.example` 을 복사해 `.env.local` 을 만듭니다.

```bash
cp .env.example .env.local
```

```env
VITE_SUPABASE_URL=https://<프로젝트>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

> ⚠️ `service_role` 키는 **절대** 넣지 마세요. 프론트엔드 번들에 그대로 들어갑니다.
> publishable(anon) 키만 쓰고, 실제 접근 제어는 RLS가 담당합니다.

### 2. DB 만들기

Supabase 대시보드 → **SQL Editor** 에서 순서대로 실행합니다.

1. `supabase/schema.sql` — 테이블 · 트리거 · RLS 정책
2. 사이트를 켜서 **회원가입** (이메일 + 비밀번호)
3. `supabase/seed.sql` — 안의 `you@example.com` 을 **가입한 이메일로 바꾼 뒤** 실행

3번을 실행하면 트랙 10개와 예시 업무, 담당자 5명, 개인보드 카테고리가 들어갑니다.

> 기존 프로젝트와 같은 Supabase를 써도 됩니다.
> 이 앱의 테이블은 전부 `mh_` 접두사라 다른 테이블과 충돌하지 않습니다.

### 3. 로컬 실행

```bash
npm run dev      # http://localhost:5173/minihome/
npm run build    # 프로덕션 빌드
npm run check    # lint + build 한 번에
```

---

## 배포 (GitHub Pages)

`main` 브랜치에 push하면 GitHub Actions가 자동 배포합니다.

**최초 1회 설정:**

1. **Settings → Secrets and variables → Actions** 에 두 개 등록
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
2. **Settings → Pages → Source** 를 `GitHub Actions` 로 변경
3. `main` 에 push

배포 주소: `https://mygameworld400.github.io/minihome/`

> 저장소 이름을 바꾸면 `vite.config.js` 의 `base` 도 같이 바꿔야 합니다.
> 라우팅은 **HashRouter**를 써서 Pages 하위 경로에서도 새로고침·직접 진입이
> 전부 정상 동작합니다. (`404.html` 우회 트릭이 필요 없습니다)

---

## 구조

```
src/
├── components/
│   ├── layout/     Sidebar · Layout · MobileNav
│   ├── work/       TaskCard · TaskModal
│   └── common/     Modal · Confirm
├── pages/          Home · Work · Personal · Calendar · Memo · Stats · Settings · Login
├── services/       DB 접근 전담 (taskService · personalService · memoService · calendarService · profileService)
├── hooks/          useAuth (세션) · useStore (전역 데이터 + 낙관적 갱신)
├── lib/            supabase.js
└── styles/         globals.css (디자인 토큰) · login.css
```

**컴포넌트는 DB를 직접 부르지 않습니다.** 전부 `services/` 를 거치고,
상태는 `useStore` 한 곳에 모여 있습니다. 화면을 고칠 때 DB 로직을
건드릴 일이 없도록 분리했습니다.

### 낙관적 갱신

체크박스를 누르면 화면이 먼저 바뀌고 DB 쓰기는 뒤따릅니다.
실패하면 이전 상태로 자동 복구되고 상단에 에러 배너가 뜹니다.

---

## 데이터베이스

모든 테이블에 `owner` 컬럼이 있고, RLS 정책은 `owner = auth.uid()` 입니다.
**로그인한 본인 데이터만** 읽고 쓸 수 있습니다.

| 테이블 | 내용 |
|---|---|
| `mh_profiles` | 프로필 (사용자당 1행) |
| `mh_people` | 담당자 |
| `mh_tracks` | 업무 트랙 |
| `mh_tasks` | 업무 (`predecessor_id` 로 선행 업무 연결) |
| `mh_personal_categories` | 개인보드 카테고리 |
| `mh_personal_tasks` | 개인 할일 (`amount` 로 지출 기록) |
| `mh_events` | 캘린더 일정 |
| `mh_memos` | 메모 |
| `mh_diary` | 미니 다이어리 |

`updated_at` 자동 갱신과 완료 시각(`completed_at`) 기록은 트리거가 처리합니다.

---

## 반응형

- **860px 초과** — 왼쪽 사이드바 + 메인
- **860px 이하** — 하단 고정 네비게이션, 보드는 1열, 카드가 가로로 잘리지 않음

---

made with ☁️ + 🍓
