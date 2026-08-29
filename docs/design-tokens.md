# 디자인 토큰 — Figma Variables ↔ CSS 매핑

> Figma 파일: [Sempre Design System](https://www.figma.com/design/1S1bLNifrZti4TiQSOP0al) (병현 팀)
> 소스 오브 트루스: 컬러 팔레트는 **바이올렛 `#8B5CF6` 기준**(2026-07-09 확정), CSS 변수 이름은 `src/app/globals.css`의 `:root`/`@theme` 기준.
> Figma 쪽 구조: `Primitives`(raw 값, 피커 숨김) → `Color`(시맨틱, 알리아스) / `Layout`(radius·spacing) + Text Styles 19종 + Effect Styles 3종. (2026-08-30 보강 내역은 문서 하단 참조)

## 시맨틱 컬러 (Color 컬렉션, Light 모드)

| CSS 변수 | Figma 변수 | 알리아스 → 프리미티브 | 값 | 비고 |
|---|---|---|---|---|
| `--background` | `background` | `neutral/0` | `#FFFFFF` | |
| `--foreground` | `foreground` | `neutral/1000` | `#000000` | |
| `--card` | `card` | `neutral/0` | `#FFFFFF` | |
| `--card-foreground` | `card-foreground` | `neutral/1000` | `#000000` | |
| `--popover` | `popover` | `neutral/0` | `#FFFFFF` | |
| `--popover-foreground` | `popover-foreground` | `neutral/1000` | `#000000` | |
| `--primary` | `primary` | `violet/500` | `#8B5CF6` | **검정→바이올렛 전환됨** |
| `--primary-foreground` | `primary-foreground` | `neutral/0` | `#FFFFFF` | |
| `--secondary` | `secondary` | `neutral/100` | `#F5F5F5` | |
| `--secondary-foreground` | `secondary-foreground` | `neutral/900` | `#171717` | |
| `--muted` | `muted` | `neutral/100` | `#F5F5F5` | |
| `--muted-foreground` | `muted-foreground` | `neutral/500` | `#737373` | |
| `--accent` | `accent` | `neutral/100` | `#F5F5F5` | |
| `--accent-foreground` | `accent-foreground` | `neutral/1000` | `#000000` | |
| `--destructive` | `destructive` | `red/500` | `#EF4444` | ⚠️ CSS는 아직 `#dc2626` |
| `--destructive-foreground` | `destructive-foreground` | `neutral/0` | `#FFFFFF` | |
| `--border` | `border` | `neutral/200` | `#E5E5E5` | |
| `--input` | `input` | `neutral/200` | `#E5E5E5` | |
| `--ring` | `ring` | `violet/500` | `#8B5CF6` | **검정→바이올렛 전환됨** |
| `--success` | `status/success` | `green/500` | `#10B981` | ⚠️ CSS는 아직 `#16a34a` |
| `--warning` | `status/warning` | `orange/500` | `#F97316` | ⚠️ CSS는 아직 `#ca8a04` |
| `--error` | `status/error` | `red/500` | `#EF4444` | ⚠️ CSS는 아직 `#dc2626` |
| `--highlight-yellow` | `highlight/yellow` | `yellow/200` | `#FEF08A` | |
| `--highlight-orange` | `highlight/orange` | `orange/200` | `#FED7AA` | |
| `--focus-high` | `focus/high` | `orange/500` | `#F97316` | |
| `--focus-mid` | `focus/mid` | `yellow/500` | `#EAB308` | |
| `--focus-low` | `focus/low` | `blue/500` | `#3B82F6` | |

⚠️ = Figma 토큰은 CLAUDE.md 타깃 값, CSS는 구값 유지 중. 상태색 전환은 별도 PR로 진행(전 앱 시각 영향).

## 프리미티브 (Primitives 컬렉션 — 피커에서 숨김, scopes `[]`)

| 패밀리 | 스텝 | 값 |
|---|---|---|
| violet | 50~900 (Tailwind 램프) | `#F5F3FF` `#EDE9FE` `#DDD6FE` `#C4B5FD` `#A78BFA` **`#8B5CF6`** `#7C3AED` `#6D28D9` `#5B21B6` `#4C1D95` |
| neutral | 0/100/200/500/900/1000 | `#FFFFFF` `#F5F5F5` `#E5E5E5` `#737373` `#171717` `#000000` |
| green | 500/600 | `#10B981`(타깃) / `#16A34A`(현 CSS) |
| orange | 200/500 | `#FED7AA` / `#F97316` |
| yellow | 200/500/600 | `#FEF08A` / `#EAB308` / `#CA8A04`(현 CSS warning) |
| red | 500/600 | `#EF4444`(타깃) / `#DC2626`(현 CSS) |
| blue | 500 | `#3B82F6` |

### 네비게이션 시맨틱 (2026-07-12 추가)

| CSS(예정) | Figma 변수 | 알리아스 | 값 |
|---|---|---|---|
| `--nav-bg` | `nav/bg` | `neutral/0` | `#FFFFFF` |
| `--nav-border` | `nav/border` | `gray/100` | `#F3F4F6` |
| `--nav-active` | `nav/active` | `neutral/1000` | `#000000` |
| `--nav-inactive` | `nav/inactive` | `gray/400` | `#99A1AF` |

### 추가 프리미티브 (2026-07-12 — 화면/Badge 실사용 Tailwind 값)

| 패밀리 | 스텝 | 값 |
|---|---|---|
| gray (Tailwind gray, neutral과 별도) | 50/100/200/300/400/500/600/700/900 | `#F9FAFB` `#F3F4F6` `#E5E7EB` `#D1D5DB` `#99A1AF` `#6B7280` `#4B5563` `#374151` `#111827` |
| green | +50/200/400/700 | `#F0FDF4` `#BBF7D0` `#4ADE80` `#15803D` |
| yellow | +50/700 | `#FEFCE8` `#A16207` |
| red | +50/200/400/700 | `#FEF2F2` `#FECACA` `#F87171` `#B91C1C` |
| blue | +50/200/700 | `#EFF6FF` `#BFDBFE` `#1D4ED8` |

이로써 Badge 24변형·Input 4상태·BottomNavigation 11변형의 모든 색이 변수 바인딩됨(하드코딩 0).

## 레이아웃 (Layout 컬렉션)

| CSS | Figma | 값(px) |
|---|---|---|
| `--radius-sm` | `radius/sm` | 12 |
| `--radius-md` | `radius/md` | 14 |
| `--radius-lg` (`--radius`) | `radius/lg` | 16 |
| `--radius-xl` | `radius/xl` | 24 |
| — | `radius/full` | 9999 |
| — | `spacing/xs~2xl` | 4 / 8 / 12 / 16 / 24 / 32 |

## 텍스트 스타일

코드는 **Pretendard Variable**을 쓰지만 Figma에서 사용 불가 → **Noto Sans KR로 대체**(Figma 한정, 코드는 그대로 Pretendard). Noto Sans KR에는 SemiBold가 없어 헤딩=Bold, 라벨=Medium. 숫자는 코드의 `.font-number`(Montserrat, tabular-nums)와 동일하게 Montserrat SemiBold.

| 스타일 | 폰트 | 크기/행간 | 자간 |
|---|---|---|---|
| Heading/H1~H3 | Noto Sans KR Bold | 24/32 · 20/28 · 18/26 | -1.5% |
| Body/Large~Small | Noto Sans KR Regular | 16/26 · 14/22 · 12/18 | -1.5% |
| Label/Large·Small | Noto Sans KR Medium | 14/20 · 12/16 | -1.5% |
| Caption | Noto Sans KR Regular | 11/14 | 0 |
| Number/Timer·Stat | Montserrat SemiBold | 48/56 · 24/28 | -2% |

## 이펙트 스타일 (globals.css 그대로)

| CSS | Figma | 값 |
|---|---|---|
| `--shadow-soft` | `Shadow/Soft` | 0 2 8 -2 rgba(0,0,0,.08) |
| `--shadow-card` | `Shadow/Card` | 0 1 3 0 rgba(0,0,0,.1) + 0 1 2 -1 rgba(0,0,0,.1) |
| `--shadow-elevated` | `Shadow/Elevated` | 0 4 12 -2 rgba(0,0,0,.12) |

## Figma 화면 현황 (📱 Screen 페이지, 2026-08-30 기준)

주요 앱 라우트 38개 화면 완료 (행별 배치, x 간격 450):
- y=0 Onboarding 01 Welcome · 02 Login · 03 Profile-Setup 1/5~5/5
- y=1013 Home/Dashboard · y=2065 Practice Idle/Recording/Complete · y=3051 Ranking/Main · Stats/Weekly · y=4016 Feedback List/Inbox/New/Submit
- y=5000 AI Analysis List/Detail/Section Detail · Song/AI Analysis
- y=6000 Rooms List/Detail/Upload · Teachers List/Detail · Teacher Students/Student Detail(오렌지, 선생님 네비)
- y=7000 Profile/Main · Credits · Plans/Weekly · Notifications
- y=8000 Records/Calendar · Goals/History · Routines/List · Metronome · Music Terms/Search · Help/Board

미작성(우선순위 낮음): feedback/[id] 상세·view, help/new·[id]·submit, profile/teacher-profile·teacher-register, admin/*, (landing)/landing·privacy·terms·support, invite/[token], 모달/바텀시트 상태들.

화면 제작 패턴: 390×844 프레임(`#faf8ff` + 블롭 2개) → `content`(VERTICAL, pad 24/16, h 780, clip) → 하단 `BottomNavigation` 인스턴스(컴포넌트 셋 `65:334`, 학생 Active=None `65:175`, AI `65:88`, Profile `65:146`, 선생님 Students `65:256`). 폰트 Noto Sans KR, 아이콘은 lucide SVG path를 `createNodeFromSvg`로 삽입.


## 2026-08-30 디자인 시스템 보강 (Figma 적용 완료)

### 신규 시맨틱 토큰 (Color 컬렉션, 전부 Primitives 알리아스 · WEB `var(--*)` 코드신택스)

| Figma 변수 | 알리아스 | 값 | 용도 |
|---|---|---|---|
| `surface/app-bg` | `violet/25` | `#FAF8FF` | 앱 배경(`.bg-blob-violet`) |
| `surface/card` · `surface/glass-bg` · `surface/glass-border` | `neutral/0` | `#FFFFFF` | 글래스 카드는 fill@40~60%, 테두리@50~60% opacity로 사용 |
| `surface/dark` · `surface/dark-raised` | `gray/950` · `gray/850` | `#1A1A1A` · `#2A2A2A` | 메트로놈 다크 패널 |
| `tint/violet-subtle` · `tint/violet` · `tint/violet-strong` | `violet/50·100·200` | | 선택 상태·pill 배경 |
| `text/primary` · `text/secondary` · `text/tertiary` · `text/brand` · `text/on-brand` | `gray/900·500·400`, `violet/600`, `neutral/0` | | 본문 텍스트 4색 |
| `border/subtle` · `border/default` | `gray/100·200` | | 구분선·카드 테두리 |
| `blob/violet` | `violet/300` | | 배경 블롭 |
| `theme/teacher/bg·accent·tint·text·blob` | `cream/50`, `orange/600·100·800·300` | | 선생님 모드(`.bg-blob-orange`) |
| `status/{success,warning,error,info}-tint` · `-text`, `status/warning-bg` | green/100·700, amber/50·100·700, red/50·700, blue/100·700 | | 상태 뱃지 배경/글자 |

### 신규 프리미티브
`violet/25`, `cream/50`, `orange/50·100·300·400·600·700·800`, `amber/50~800`, `slate/100·400·500·600·900`, `green/100·800`, `emerald/50·200·600·700`, `blue/100·600`, `purple/100·500·600·700`, `pink/100·700`, `gray/800·850·950` — Primitives 87개 / Color 62개 / Layout 11개.

### 신규 텍스트 스타일
`Heading/H4`(Bold 16/24), `Strong/Large·Small·Tiny`(Bold 14/12/10), `Label/Tiny`(Medium 10), `Number/Hero·Medium·Small`(Montserrat SemiBold 72/32/14) — 총 19종.

### 컴포넌트 (🧩 페이지, 변수·스타일 100% 바인딩, description에 코드 경로)

| 컴포넌트 | 변형 | 코드 근거 |
|---|---|---|
| Button | Variant 6 × Size 4 = 24 | `ui/button.tsx` |
| IconButton | Style(Glass/Solid) × Size(32/36/40) | 원형 뒤로가기 버튼 패턴 |
| Chip | State × Style = 4 | 필터 pill 패턴 |
| GlassCard | Radius(2xl/3xl) × Padding(16/20) | `bg-white/40 backdrop-blur-xl` 94회 |
| StatGroup | Style(Glass/Solid), Card/Stat ×3 | `stats-card.tsx` + divide-x 래퍼 |
| Toggle · Checkbox | On/Off · Checked/Unchecked × Square/Round | profile, profile-setup |
| ProgressBar | Tone 3 × Size 2 | records/goals/plans |
| Avatar | Type(Emoji/Initial) × Size(40/56/64/80) | teachers, profile |
| BlobBackground | Theme(Violet/Orange) 390×844 | `.bg-blob-*` |
| Badge · Card · Input · BottomSheet · Toast · BottomNavigation | 기존 | — |

### 화면 바인딩 커버리지 (📱 Screen 38개)
페인트 2,684 중 2,679 변수 바인딩(99.8%, 미바인딩 5개는 Google 로그인 브랜드색) · 텍스트 1,099 중 1,057 스타일 적용(96%, 나머지는 이모지·히어로 숫자) · radius 390 · gap 320 바인딩.
값 스냅: `#9ca3af`→`gray/400 #99A1AF`, `#22c55e`→`green/500 #10B981`, 블롭 `#c4a7ff/#b794ff`→`violet/300·400` (시각 차이 미미, 회귀 스크린샷 확인).

### 코드 반영 필요 (별도 PR)
`globals.css`에 위 시맨틱 변수(`--surface-*`, `--tint-*`, `--text-*`, `--border-*`, `--theme-teacher-*`, `--status-*-tint/text`)를 추가하고 `.bg-blob-*`·글래스 카드 클래스가 이를 참조하도록 교체.

## 미결/후속 작업

1. **상태색 CSS 전환**: `--success/--warning/--error/--destructive`를 Figma 타깃 값(#10B981/#F97316/#EF4444)으로 바꾸는 별도 PR — 뱃지·알림 등 전 앱 시각 영향이라 스크린샷 회귀 확인 필요.
2. **하드코딩 `#8B5CF6` 9곳 토큰화**: `onboarding/page.tsx`, `profile-setup/page.tsx`, `SplashScreen.tsx`, `progress-ring.tsx`, `auth/*/callback` 등에서 `bg-[#8B5CF6]`/inline style → `bg-primary`/`var(--primary)`로 교체 (이제 `--primary`가 바이올렛이므로 안전).
3. 모든 Figma 변수에 WEB 코드신택스(`var(--*)`) 설정 완료 — Dev Mode에서 CSS 변수명이 그대로 표시됨.
