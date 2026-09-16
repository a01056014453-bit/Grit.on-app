# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# 셈프레 (Sempre) — GRIT.ON App

> 클래식 음악 전공생을 위한 AI 순연습시간 측정 & 연습 관리 · 레슨 연결 PWA

---

## 서비스 개요

- **서비스명**: 셈프레 (Sempre) / GRIT.ON
- **타겟**: 클래식 음대 입시생 + 재학생, 담당 레슨 선생님
- **핵심 가치**: 실제 악기를 연주한 시간(순연습시간)만 자동 측정
- **프로덕션**: https://withsempre.com (Vercel, `main` push 시 자동 배포). `NEXT_PUBLIC_APP_URL` 기본값도 이 도메인
- **리포**: https://github.com/a01056014453-bit/Grit.on-app

### 주요 기능
1. **순연습시간 자동 측정** — Web Audio API + YAMNet VAD, 소리 나는 시간만 누적
2. **원포인트 레슨** — 학생 연습 영상 업로드 → 선생님 비동기 음성 피드백 (크레딧 기반)
3. **입시룸(rooms)** — 학교별 연습실, 같은 곡 연습 학생끼리 영상 비교
4. **AI 곡 분석** — 곡 개요·구조·연습법·4주 루틴 생성 (OpenAI + Perplexity, 아래 파이프라인 참조)
5. **랭킹** — 순연습시간 기반 일일 랭킹 (daily_rankings)
6. **선생님 모드** — 학생 관리, 초대(토큰), 피드백 인박스

---

## 기술 스택

```
프레임워크:  Next.js 15 (App Router) + React 19 + TypeScript 5 (strict)
스타일링:    Tailwind CSS 4 + tw-animate-css · Framer Motion 12 · Radix UI · Lucide
폼 / 차트:   React Hook Form + Zod · Recharts 3

DB / Auth:   Supabase (PostgreSQL + Auth + Storage, RLS)
AI(곡 분석): OpenAI SDK (gpt-4o / gpt-4o-mini) + Perplexity (OpenAI SDK + baseURL)
AI(운영):    Anthropic Claude SDK — Slack 봇(api/slack/events)과 scripts/agents 전용. 곡 분석에는 쓰이지 않음
오디오 분석: TensorFlow.js + Speech Commands (YAMNet)
악보 OMR:    omr-server/ (Python·Audiveris, Railway 배포) ← /api/convert-pdf 가 OMR_SERVER_URL 로 호출
PWA:         Serwist 9 (Service Worker + 웹 푸시 VAPID) — 개발 모드에서는 SW 비활성
이메일:      Resend · 모니터링: Sentry · 배포: Vercel
테스트:      Vitest 4 (unit/api/e2e), E2E는 Puppeteer
```

환경변수 정본은 `.env.example`. Vercel 권한이 있으면 `npx vercel link && npx vercel env pull .env.local`.

---

## 자주 쓰는 명령어

```bash
npm run dev          # 개발 서버
npm run dev:clean    # 캐시/서비스워커 초기화 후 개발 서버 — POSIX rm 사용, Windows는 Git Bash에서 실행
npm run dev:debug    # 개발 서버 + 에러 감지·분류·Slack 알림 래퍼 (scripts/dev-debugger)
npm run build        # 프로덕션 빌드
npm run lint         # eslint (flat config)

npm test              # 유닛 테스트 (vitest run tests/unit)
npm run test:watch    # 유닛 watch
npm run test:api      # API 테스트 (tests/api) — TEST_BASE_URL 없으면 describe.skipIf 로 통째 스킵
npm run test:e2e      # E2E (puppeteer) — 동일하게 TEST_BASE_URL 필요
npm run test:all      # 전체
npm run test:ci       # CI 조합 (unit + api)
npm run test:coverage # 커버리지 (src/lib/** 만 측정)

# 단일 테스트
npx vitest run tests/unit/format.test.ts
npx vitest run tests/unit/format.test.ts -t "formatDuration"
TEST_BASE_URL=http://localhost:3000 npx vitest run tests/api   # 로컬 dev 서버 띄운 뒤
```

- 테스트는 `tests/**/*.test.ts` 만 수집, `environment: node`, `@` alias 사용 가능, timeout 30초
- API 헬스체크 규약: 공개 GET `<500`, 인증 GET `[200,401,403]`, **cron 엔드포인트는 인증 없이 정확히 401** 이어야 함
- Node는 `.nvmrc`의 20. 새 PC 셋업(도구·`.env.local`·Claude 설정 이전)은 `docs/new-pc-setup.md`

### CI · 배포

- **배포**: 별도 스크립트 없음. `main`에 push하면 Vercel이 즉시 프로덕션 배포 → **`main` 직접 push 금지**, 브랜치 → PR → 머지
- **CI 게이트**: `.github/workflows/test.yml`이 `main`/`develop` push와 `main` 대상 PR에서 `npm ci → lint → test:ci → build`. 그 외 브랜치 push는 CI가 돌지 않으므로 push 전 로컬에서 같은 3종을 돌릴 것. (원격에는 `develop`이 아니라 `dev` 브랜치가 있어 실질적으로 `main`과 PR에서만 돈다)
- **에이전트 워크플로**(`agent-review/issue/autofix/daily.yml`): `scripts/agents/runner.ts <review-pr|review-push|classify-issue|daily-summary|auto-fix>` 를 Anthropic SDK로 실행해 GitHub/Slack에 보고
- **크론**: `vercel.json`에 정의, 전부 `/api/cron/*` + `/api/feedback/expire-check`. 프로덕션 유일 트리거이므로 경로를 옮기면 `vercel.json`도 같이 수정

### 빌드 함정

`lib/supabase-server.ts`처럼 **모듈 최상위에서 SDK 클라이언트를 생성**하는 서버 코드는 `next build`의 page data 수집 단계에서 import되므로, 키가 없으면 빌드가 실패한다. 로컬은 `.env.local` 덕분에 가려지니 CI 조건 재현은 `.env.local` 없이 `test.yml`의 placeholder env로 빌드할 것. 모듈 레벨 클라이언트를 새로 만들면 `test.yml` env에 placeholder를 추가하거나, 함수 안에서 지연 생성할 것.

---

## 아키텍처 핵심 흐름

### 인증·인가
- `src/middleware.ts` → `lib/supabase-middleware.ts`의 `updateSession()`: 매 요청 세션 쿠키 갱신. `/admin`은 로그인 상태에서 `ADMIN_USER_IDS`(쉼표 구분)에 없으면 `/`로 리다이렉트
- 페이지 보호는 `components/AuthGuard.tsx`(`(app)` 라우트 그룹). 세션 확인 → 온보딩 여부 → `pullUserData()` → 푸시 구독 순
- `/admin` 미들웨어는 fail-closed: `ADMIN_USER_IDS`가 비어 있으면 로그인 유저도 전부 `/`로 리다이렉트. `/mockups`(개발용 화면 클론)는 `mockups/layout.tsx`가 프로덕션에서 404 처리
- 소셜 로그인은 provider별 커스텀 콜백(`app/auth/{google,kakao,apple}/callback` → `/api/auth/*`에서 code→id_token 교환 → `signInWithIdToken`). `app/auth/callback`은 Supabase PKCE. `/api/auth/kakao`는 로그인이 아니라 **선생님 본인인증 전용**
- API Route 유저 식별은 `lib/api-auth.ts`의 `getRequestUserId(request)`(쿠키 → Bearer 순)가 정식 헬퍼. 기존 라우트 다수가 `createServerClient().auth.getUser()`를 인라인으로 복붙했지만 **신규 코드는 헬퍼를 쓸 것**
- 서버 전용 시크릿: `CRON_SECRET`(`Authorization: Bearer`), `INTERNAL_CALL_SECRET`(`x-internal-call` 헤더, **16자 이상일 때만 유효**). 통과 시 rate limit 무제한 + 캐시 무시. cron 라우트 가드는 전부 `if (!cronSecret || ...)`(fail-closed) — 시크릿 미설정이면 401. **신규 cron도 같은 패턴**으로

### DB 접근 3계층
| 용도 | 클라이언트 | 파일 |
|---|---|---|
| 브라우저 읽기 (RLS 적용) | anon 싱글턴 `supabase` / 팩토리 `createClient()` | `lib/supabase.ts` / `lib/supabase-browser.ts` |
| 브라우저 쓰기 | `dbMutate()` → `POST /api/db/mutate` | `lib/db-mutate.ts` |
| 서버 (RLS 우회, service role) | `supabaseServer` | `lib/supabase-server.ts` — API Route 전용 |

- `lib/queries/*`는 도메인별 Supabase 접근 레이어(profiles, feedback, rooms, teachers…). 패턴: **읽기는 anon 클라이언트 직접, 쓰기는 `dbMutate()`**
- `/api/db/mutate`는 테이블 allowlist(`TABLE_USER_COLUMN`) + **insert/upsert 시에만** 소유자 컬럼을 세션 user.id로 강제 주입. **update/delete는 클라이언트가 보낸 `filters`만 적용**하므로 호출부에서 소유자 컬럼을 filters에 반드시 포함할 것. 새 테이블을 쓰려면 allowlist에 추가
- `/api/db/query`는 읽기 전용 allowlist(rooms, schools, song_analyses, composers 등) + `filter=column.op.value`
- ⚠️ `lib/db.ts`는 Supabase가 아니라 **IndexedDB 래퍼**(DB명 `griton_db`, store `practice_sessions`) — 연습 세션의 1차 저장소. DB 이름을 바꾸면 기존 유저 데이터가 사라진다

### 로컬 우선 저장 + 서버 동기화
- 앱은 **localStorage / IndexedDB-first**. 키 프리픽스는 `sempre-*`(레거시 `grit-on-*`/`griton_*`는 `lib/storage-migration.ts`의 `runStorageMigration()`이 AuthGuard 진입 시 이관). 신규 키는 `sempre-` 프리픽스로
- `lib/storage-keys.ts`의 상수는 3개뿐이고 나머지 키는 각 `*-store.ts`에 흩어져 있음 — 새 키를 만들면 여기 등록
- 연습 세션: IndexedDB(`synced=false`) → `lib/sync-practice.ts` → `POST /api/sync-practice` → 오디오 Blob Storage 업로드 → `markSessionSynced()`
- 그 외 유저 데이터: `lib/sync-user-data.ts`가 지정 키들을 모아 `POST /api/sync-user-data` → **Supabase Storage `recordings` 버킷의 `sync/{userId}.json`**(테이블 아님). 쓰기는 `pushUserDataDebounced(key)`(1.5초), 로그인 시 `pullUserData()`
- `hooks/usePracticeSessions.ts`는 IndexedDB + 모듈 전역 캐시(3초) + `visibilitychange` 재로드. `lib/page-cache.ts`는 SWR식 localStorage 캐시(stale 5분)
- 로그인 전 유저 ID: `lib/user-id.ts`의 `getUserId()`가 로컬 UUID 발급, `getAuthUserId()`는 Supabase user.id 우선
- 선생님 모드 상태는 `lib/teacher-store.ts` + `hooks/useTeacherMode.ts` 한 경로(localStorage + dbMutate + pushUserDataDebounced 혼합)

### AI 곡 분석 파이프라인 (v2, 현재 UI 경로)
1. `POST /api/analyze-song-v2/start`: 인증(비로그인 허용) → Zod 검증 → `song_analyses` 공유 캐시 조회(`schema_version >= 2`면 즉시 반환) → 10분 내 진행 중 `analysis_jobs` 중복 확인 → job insert → `waitUntil()`(`@vercel/functions`)로 백그라운드 실행
2. 백그라운드는 `${NEXT_PUBLIC_APP_URL}/api/analyze-song-v2`를 `x-internal-call` 헤더로 **self-fetch** (`maxDuration = 300`)
3. 클라이언트는 `GET /api/analyze-song-v2/status?job_id=`를 3초 폴링 → done이면 `/ai-analysis/{result_id}`
4. 본 분석(`api/analyze-song-v2/route.ts`): Phase 0 병렬(Perplexity 레퍼런스 · `lib/phase0-academic.ts` 학술 논문 · `lib/imslp-vision-pipeline.ts` — 이름과 달리 Vision 아님, IMSLP wikitext 파싱) → Phase 1 개요(gpt-4o) + Perplexity 메타 교차검증 → Phase 2 사고(gpt-4o-mini)/생성(gpt-4o) → Phase 3 구조·화성 → Phase 4a 연습법 + YouTube → Phase 4b 4주 루틴
5. 프롬프트는 전부 `lib/analysis-prompts.ts`. 악기별 전문가 페르소나는 `lib/analysis-agents/agent-{piano,strings,woodwinds,brass,percussion-harp}.ts`에서 `getInstrumentAgent()`로 선택(미인식 시 PIANO 폴백)
6. 저장 전 `lib/analysis-validation.ts`의 `validateAnalysisOutput()` — **실패해도 저장은 진행**(경고만). 결과는 `song_analyses.content` JSONB, 개인 이력은 `user_analysis_history`
- v1(`/api/analyze-song`)은 단일 gpt-4o 호출·캐시 없음, 레거시. 클라이언트 측 "분석한 곡" 목록은 `lib/user-analyses.ts`가 정본(`analyzed-songs-store.ts`, `song-analysis-store.ts`는 잔재 — 새로 참조하지 말 것)
- Rate limit: UI 경로의 일일 한도는 **`start/route.ts`의 `checkDailyQuota`**(로그인 유저는 `analysis_jobs` 24h 건수, 비로그인은 IP 인메모리)에서 건다. 본 분석 라우트의 `lib/rate-limiters.ts` 한도(Free 1·Pro 5/일, IP 기반)는 직접 호출에만 적용되고 내부 호출(start→v2)은 우회하므로 여기에 한도를 추가해도 UI에는 효과 없음. `lib/rate-limit.ts`는 **인메모리**라 서버리스 인스턴스마다 따로 센다
- 크론 `pre-analyze`/`analyze-designated`가 `lib/data/popular-pieces.ts` / `designated_pieces` 중 미분석 곡을 self-fetch로 채움

### 알림·이벤트
- 웹 푸시: 서버 `/api/push/send`(web-push VAPID), 클라이언트 래퍼 `lib/push-notify.ts`·`lib/push-subscribe.ts`, 인앱 알림은 `lib/notification-store.ts`(순수 로컬)
- 이벤트 트래킹: `lib/analytics.ts`의 `trackEvent()` → `/api/analytics/track` → `user_events` 테이블
- Slack: `lib/slack.ts`의 `sendSlackNotification(channel, msg)`(채널별 `SLACK_WEBHOOK_*` env). `/api/slack/events`는 서명 검증 후 Claude로 응답하는 봇

---

## Supabase DB 구조

주요 테이블: `profiles, teachers, teacher_students, invitations, feedback_requests, feedbacks, practice_sessions, daily_rankings, songs, song_analyses, pieces, piece_analyses, schools, rooms, room_memberships, drill_cards, practice_todos, push_subscriptions`
+ 운영 테이블: `analysis_jobs, user_analysis_history, user_events, composers, composer_resources, designated_pieces, teacher_reviews, credit_transactions, reward_definitions, reward_grants, help_requests, help_proposals`

전체 컬럼·Enum 상세: @docs/db-schema.md

⚠️ **타입 파일이 실제 DB보다 뒤처져 있다.** `src/types/database.ts`에는 `teacher_students, invitations, push_subscriptions, analysis_jobs, user_analysis_history, user_events, composers, teacher_reviews, credit_*, reward_*, help_*`가 없고, 코드는 `(supabaseServer as any).from("...")` 캐스트(약 57곳)로 우회한다. `supabase/migrations/`도 완전하지 않다(`analysis_jobs` 등은 대시보드에서 직접 생성). 타입은 Supabase CLI(`supabase gen types`)로만 재생성하고, 재생성 전까지는 기존 캐스트 패턴을 따르되 새 캐스트를 늘리지 말 것.

---

## 비즈니스 모델

| 플랜 | 가격 | 내용 |
|------|------|------|
| Free | 무료 | 기본 타이머, 순연습시간 측정, 기본 통계 |
| Pro | ₩23,900/월 | 매월 10크레딧 자동 지급, 무제한 AI 분석, 상세 리포트, 클라우드 백업 |

- **원포인트 레슨 크레딧 수익배분**: 플랫폼 70% / 선생님 30% (v2 예정 — v1은 플랫폼 100%, `docs/prd/feedback-credit-system.md` 참조)
- **파트너**: Wonart, Leanup, Piu
- ⚠️ **현재 무료 출시 상태**: PG(토스페이먼츠) 미연동. `/api/credits/charge`는 501 반환, 충전/Pro 버튼은 "준비 중" 안내만 표시

---

## 오디오 감지 핵심 로직 (useAudioRecorder.ts)

- 적응형 노이즈 플로어(30초마다 재캘리브레이션) + 3dB를 넘으면 소리 감지
- 소리가 800ms 이상 지속되어야 카운팅 시작, 끊긴 후 7000ms 지나야 중단 (히스테리시스)
- 3초마다 YAMNet으로 클립 분류(악기 vs 잡음/목소리), 목소리 감지 시 2.5초 카운팅 억제
- 집중도(%) = 순연습시간 / 전체 경과시간

정확한 상수값·전체 흐름: @docs/audio-detection.md (⚠️ `AGENTS.md`의 오디오 상수는 구버전이므로 이 문서를 따를 것)

---

## 디자인 시스템

메인 컬러: `#8B5CF6` (바이올렛) · 폰트: Pretendard Variable · 기본 모서리: 16px

전체 컬러 팔레트·타이포·이펙트 토큰(Figma ↔ CSS 매핑 소스 오브 트루스): @docs/design-tokens.md

- 텍스트/배경/테두리 색은 토큰 클래스 사용: `text-fg-primary|secondary|tertiary|brand`, `bg-surface-*`, `bg-tint-violet*`, `border-line-subtle|default`. 신규 코드에서 `text-gray-*`·`bg-white/40 backdrop-blur-*` 같은 raw 값 금지
- 반복 UI는 `src/components/ui/`의 공용 컴포넌트 사용: 원형 아이콘 버튼 `IconButton`, 필터 칩 `Chip`, 글래스 카드 `GlassCard`, 통계 분할 `StatGroup` (Figma 🧩 세트와 1:1)

---

## 코드 컨벤션

- TypeScript strict 모드, path alias `@/*` → `./src/*`
- **모든 타입은 `src/types/database.ts` 기준** (위 "타입 파일 뒤처짐" 주의)
- 파일명: kebab-case. 라우트: `app/(app)/<기능>/page.tsx`, API: `app/api/<기능>/route.ts`
- **DB 쓰기: 반드시 `lib/db-mutate.ts` 경유** (서버 경유 원칙)
- 에러 처리: try/catch 필수, 사용자 노출 에러 메시지는 한국어
- 폼: React Hook Form + Zod 스키마 필수. API 입력도 Zod로 검증
- 스타일: Tailwind CSS 클래스만, 인라인 스타일 지양
- ESLint(`eslint.config.mjs`, flat config)는 `no-explicit-any`/`no-unused-vars`/`rules-of-hooks` 등 대부분 `"warn"`이라 빌드를 막지 않는다 — 직접 신경 써서 피할 것

---

## 절대 하지 말 것

1. `types/database.ts` 직접 수정 금지 — Supabase CLI로만 갱신
2. Supabase 테이블에 RLS 없이 접근 금지 (service role은 API Route 안에서만)
3. `teacher-store.ts` 우회하여 선생님 모드 직접 구현 금지
4. 클라이언트에서 직접 DB 쓰기 금지 → `db-mutate.ts` 경유
5. Pro 기능 구독 확인 없이 노출 금지
6. `.env.local` 등 환경변수 파일 내용을 읽거나 응답·커밋·로그에 노출 금지 (키 이름 집계도 금지 — `.env.example`로 대신 확인)
7. `main` 브랜치 직접 push 금지 — push 즉시 Vercel이 프로덕션에 자동 배포함

---

## 문서 지도

| 문서 | 내용 |
|------|------|
| `README.md` | 시작하기·환경변수 표·문서 지도 (사람용 온보딩) |
| `AGENTS.md` | Codex 등 다른 에이전트용 지침 (오디오 상수 등 일부 stale) |
| `DEVELOPER_GUIDE.md` | 개발자 온보딩, 분석 파이프라인 개요 (Claude 사용 표기 등 일부 stale) |
| `docs/prd/*.md` | 기능별 PRD (곡 분석, 크레딧, 피드백 SLA·영상 업로드·선생님 리뷰, 랭킹) |
| `docs/launch-checklist.md` | 출시 전 결정·수정·확인 목록과 진행 상태 |
| `PROGRESS.md` | 초기 개발 기록 — stale, 참고만 |

---

## 멀티 에이전트 구조

`.claude/agents/` 폴더에 각 에이전트 역할 지시서가 있다.

| 에이전트 | 파일 | 역할 |
|----------|------|------|
| 오케스트레이터 | `orchestrator.md` | 총괄, 분배, 보고 |
| 클래식음악 전문 | `classical-music.md` | 음악 분석 기준 (핵심) |
| 기획 | `planner.md` | PRD, 유저 플로우 |
| 프론트엔드 | `frontend.md` | UI/UX 구현 |
| 백엔드 | `backend.md` | API, DB, Supabase |
| AI/ML | `ai-ml.md` | AI 분석 구현 |
| 테스트 | `tester.md` | E2E, 버그 리포트 |
| 감사 | `auditor.md` | 품질 검토, 3회 루프 |

### 작업 흐름
1. 사용자 요청 → 오케스트레이터 분배
2. 각 에이전트 작업
3. 감사 에이전트 검토 (최대 3회 수정 루프)
4. 오케스트레이터 취합 → 사용자 보고

---

## CLAUDE.md 관리 원칙

- 작업 중 새 컨벤션이나 함정을 발견하면 그 자리에서 이 파일에 반영한다 (몰아서 하지 않는다)
- PR 리뷰에서 지적된 규칙은 여기에 업데이트한다
- 파일 개수·서브폴더 목록처럼 자주 바뀌는 수치/목록은 적지 않는다 — 금방 stale해진다
- 정기적으로 코드와 불일치하는 내용이 없는지 점검한다
