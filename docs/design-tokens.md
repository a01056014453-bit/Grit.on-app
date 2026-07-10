# 디자인 토큰 — Figma Variables ↔ CSS 매핑

> Figma 파일: [Sempre Design System](https://www.figma.com/design/1S1bLNifrZti4TiQSOP0al) (병현 팀)
> 소스 오브 트루스: 컬러 팔레트는 **바이올렛 `#8B5CF6` 기준**(2026-07-09 확정), CSS 변수 이름은 `src/app/globals.css`의 `:root`/`@theme` 기준.
> Figma 쪽 구조: `Primitives`(raw 값, 피커 숨김) → `Color`(시맨틱, 알리아스) / `Layout`(radius·spacing) + Text Styles 11종 + Effect Styles 3종.

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

## 레이아웃 (Layout 컬렉션)

| CSS | Figma | 값(px) |
|---|---|---|
| `--radius-sm` | `radius/sm` | 12 |
| `--radius-md` | `radius/md` | 14 |
| `--radius-lg` (`--radius`) | `radius/lg` | 16 |
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

## 미결/후속 작업

1. **상태색 CSS 전환**: `--success/--warning/--error/--destructive`를 Figma 타깃 값(#10B981/#F97316/#EF4444)으로 바꾸는 별도 PR — 뱃지·알림 등 전 앱 시각 영향이라 스크린샷 회귀 확인 필요.
2. **하드코딩 `#8B5CF6` 9곳 토큰화**: `onboarding/page.tsx`, `profile-setup/page.tsx`, `SplashScreen.tsx`, `progress-ring.tsx`, `auth/*/callback` 등에서 `bg-[#8B5CF6]`/inline style → `bg-primary`/`var(--primary)`로 교체 (이제 `--primary`가 바이올렛이므로 안전).
3. 모든 Figma 변수에 WEB 코드신택스(`var(--*)`) 설정 완료 — Dev Mode에서 CSS 변수명이 그대로 표시됨.
