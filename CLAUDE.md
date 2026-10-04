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
- **dev 확인 환경**: https://dev.withsempre.com 은 Vercel에서 `dev` 브랜치에 묶인 Preview 배포. 머지 전 작업을 올려 보려면 `git push origin <작업브랜치>:dev`(fast-forward만, force 금지). CI는 돌지 않고 Vercel 빌드가 유일한 게이트
  - Vercel 배포 보호(Vercel Authentication)가 걸려 있어 **팀 Vercel 계정 로그인 후에만 열린다**(비로그인 `curl`은 302). 서버 간 self-fetch는 로그인할 수 없으므로 `x-vercel-protection-bypass: VERCEL_AUTOMATION_BYPASS_SECRET`(Vercel이 자동 주입) 헤더를 붙여야 한다 — `analyze-song-v2/start`가 기준. dev에서 self-fetch를 새로 만들면 같은 헤더를 넣을 것
  - Preview env 제약: `ADMIN_USER_IDS`가 Production 전용이라 `/admin`은 전부 `/`로 리다이렉트, 크론은 실행되지 않고, YouTube·Resend·CoolSMS 키도 없다. `NEXT_PUBLIC_APP_URL`은 `dev` 브랜치 한정으로 `https://dev.withsempre.com`(곡 분석 self-fetch가 프로덕션으로 새지 않게). DB는 프로덕션과 분리돼 있다고 가정하지 말 것
- **CI 게이트**: `.github/workflows/test.yml`이 `main`/`develop` push와 `main` 대상 PR에서 `npm ci → lint → test:ci → build`. 그 외 브랜치 push는 CI가 돌지 않으므로 push 전 로컬에서 같은 3종을 돌릴 것. (원격에는 `develop`이 아니라 `dev` 브랜치가 있어 실질적으로 `main`과 PR에서만 돈다)
- **에이전트 워크플로**(`agent-review/issue/autofix/daily.yml`): `scripts/agents/runner.ts <review-pr|review-push|classify-issue|daily-summary|auto-fix>` 를 Anthropic SDK로 실행해 GitHub/Slack에 보고. 트리거는 review=`main` push·PR, issue=이슈 생성, daily=스케줄, autofix=수동(`workflow_dispatch`). 모델은 `scripts/agents/types.ts`의 `MODEL` 상수 한 곳에서 정한다
- **크론**: `vercel.json`에 정의, 전부 `/api/cron/*` + `/api/feedback/expire-check`. 프로덕션 유일 트리거이므로 경로를 옮기면 `vercel.json`도 같이 수정. 스케줄은 UTC
  - ⚠️ 라우트 파일이 있다고 실행되는 게 아니다. `cron/analyze-designated`는 `vercel.json`에 없고(수동 호출 전용), `cron/pre-analyze`는 스케줄이 `30 15 1 1 *`(연 1회)라 사실상 꺼져 있다 — 라우트 주석의 "매일 실행"은 stale

### 빌드 함정

`lib/supabase-server.ts`처럼 **모듈 최상위에서 SDK 클라이언트를 생성**하는 서버 코드는 `next build`의 page data 수집 단계에서 import되므로, 키가 없으면 빌드가 실패한다. 로컬은 `.env.local` 덕분에 가려지니 CI 조건 재현은 `.env.local` 없이 `test.yml`의 placeholder env로 빌드할 것. 모듈 레벨 클라이언트를 새로 만들면 `test.yml` env에 placeholder를 추가하거나, 함수 안에서 지연 생성할 것.

---

## 아키텍처 핵심 흐름

### 라우트 구조
- `app/(app)/*` — 로그인 필요한 본 앱. `(app)/layout.tsx`가 `AuthGuard` → `TrackPageView` → `AppShell`(하단 `BottomNavigation`)로 감싼다. 하단 탭은 `useTeacherMode()` 결과에 따라 학생용/선생님용 세트로 바뀐다
- `app/(landing)/*` — 비로그인 공개 페이지(랜딩, 온보딩·로그인·프로필 설정, 약관·개인정보·지원)
- `app/admin/*` — 운영 콘솔. 데이터는 anon 클라이언트가 아니라 `lib/admin/queries.ts` → `/api/admin/*`(service role)로만 읽는다
- `app/auth/*`(OAuth 콜백), `app/invite/[token]`(선생님 초대 수락), `app/mockups/*`(개발 전용)
- 루트 `layout.tsx`의 `components/SplashWrapper.tsx`는 스플래시 표시 외에 **전 유저 대상 1회성 정리**(`runDataMigration`)를 돌린다: `CURRENT_DATA_VERSION`이 로컬 값과 다르면 알림·구 온보딩 키 삭제 + IndexedDB `sempre_db` 삭제 + 서비스워커 unregister + 캐시 전체 삭제. 이 버전 숫자를 올리면 모든 기기에서 다시 실행되므로 함부로 올리지 말 것
- 녹음 중 탭 이동은 `hooks/usePracticeGuard.ts`(모듈 전역 상태)가 가로채 일시정지/종료 확인 모달을 띄운다

### 인증·인가
- `src/middleware.ts` → `lib/supabase-middleware.ts`의 `updateSession()`: 매 요청 세션 쿠키 갱신. `/admin`은 로그인 상태에서 `ADMIN_USER_IDS`(쉼표 구분)에 없으면 `/`로 리다이렉트
- 페이지 보호는 `components/AuthGuard.tsx`(`(app)` 라우트 그룹). `runStorageMigration()` → 세션 확인(없으면 `/onboarding/login`) → 로컬 `sempre-onboarding-done` 플래그 확인 → **플래그가 없을 때만** 서버 프로필 조회 후 `pullUserData()`(다른 기기에서 가입한 유저 복원), 프로필도 없으면 `/onboarding` → 푸시 구독
- `/admin` 미들웨어는 fail-closed: `ADMIN_USER_IDS`가 비어 있으면 로그인 유저도 전부 `/`로 리다이렉트. 비로그인 요청은 미들웨어가 통과시키고 `components/admin/AdminGuard.tsx`가 이메일/비밀번호 로그인 폼 + `/api/auth/check-admin`으로 검증한다. `/api/admin/*` 라우트는 각자 `ADMIN_USER_IDS`를 다시 확인한다(미들웨어만 믿지 않음). `/mockups`(개발용 화면 클론)는 `mockups/layout.tsx`가 프로덕션에서 404 처리
- 소셜 로그인은 provider별 커스텀 콜백(`app/auth/{google,kakao,apple}/callback` → `/api/auth/*`에서 code→id_token 교환 → `signInWithIdToken`). `app/auth/callback`은 Supabase PKCE. `/api/auth/kakao`는 로그인이 아니라 **선생님 본인인증 전용**
- API Route 유저 식별은 `lib/api-auth.ts`의 `getRequestUserId(request)`(쿠키 → Bearer 순)가 정식 헬퍼. 기존 라우트 다수가 `createServerClient().auth.getUser()`를 인라인으로 복붙했지만 **신규 코드는 헬퍼를 쓸 것**
- 유저 식별은 **반드시 세션에서** 얻는다. body·query로 받은 `userId`/`studentId`/`expertId`를 소유자로 신뢰하지 말 것(`/api/sync-practice`처럼 body 값을 무시하고 세션 id로 덮어쓰는 것이 기준 패턴). 이 원칙을 아직 따르지 않는 기존 라우트가 남아 있으니, 손대는 김에 세션 기반으로 바꿀 것
- 서버 전용 시크릿: `CRON_SECRET`(`Authorization: Bearer`), `INTERNAL_CALL_SECRET`(`x-internal-call` 헤더, **16자 이상일 때만 유효**). 통과 시 rate limit 무제한 + 캐시 무시. cron 라우트 가드는 전부 `if (!cronSecret || ...)`(fail-closed) — 시크릿 미설정이면 401. **신규 cron도 같은 패턴**으로

### DB 접근 3계층
| 용도 | 클라이언트 | 파일 |
|---|---|---|
| 브라우저 읽기 (RLS 적용) | anon 싱글턴 `supabase` / 팩토리 `createClient()` | `lib/supabase.ts` / `lib/supabase-browser.ts` |
| 브라우저 쓰기 | `dbMutate()` → `POST /api/db/mutate` | `lib/db-mutate.ts` |
| 서버 (RLS 우회, service role) | `supabaseServer` | `lib/supabase-server.ts` — API Route 전용 |

- `lib/queries/*`는 도메인별 Supabase 접근 레이어(profiles, feedback, rooms, teachers…). 패턴: **읽기는 anon 클라이언트 직접, 쓰기는 `dbMutate()`**
- `/api/db/mutate`는 테이블 allowlist(`TABLE_USER_COLUMN`) + **insert/upsert 시에만** 소유자 컬럼을 세션 user.id로 강제 주입. **update/delete는 클라이언트가 보낸 `filters`만 적용**하므로 호출부에서 소유자 컬럼을 filters에 반드시 포함할 것. 새 테이블을 쓰려면 allowlist에 추가. `feedbacks`는 소유자 주입이 없는 예외(`__skip__`), `profiles`는 닉네임 중복 시 409
- `/api/db/query`는 로그인 필수 + 읽기 전용 allowlist(rooms, schools, song_analyses, composers 등) + `filter=column.op.value`. 필터는 **1개**, 연산자는 `eq|neq|gt|lt`뿐이고 항상 `select("*")` — 그 이상이 필요하면 전용 라우트를 만들 것
- ⚠️ `lib/db.ts`는 Supabase가 아니라 **IndexedDB 래퍼**(DB명 `griton_db`, store `practice_sessions`) — 연습 세션의 1차 저장소. DB 이름을 바꾸면 기존 유저 데이터가 사라진다(`sempre_db`라는 이름은 `SplashWrapper`가 삭제 대상으로 쓰므로 더더욱 금지)

### 로컬 우선 저장 + 서버 동기화
- 앱은 **localStorage / IndexedDB-first**. 신규 키는 `sempre-` 프리픽스로
- ⚠️ **`grit-on-*` 키는 레거시가 아니라 현역이다.** 드릴·루틴·일일 목표·날짜별 완료/스케줄·`grit-on-profile`(선생님 모드 포함)은 지금도 `grit-on-*` 이름으로 읽고 쓰고 동기화한다. `lib/storage-migration.ts`의 `runStorageMigration()`은 AuthGuard 진입 시 `sempre-*`로 **1회 복사**만 하고(원본 유지, 이후 갱신 없음) 그 사본을 읽는 코드는 거의 없다. 기존 키 이름을 `sempre-*`로 "정리"하면 읽기·쓰기·동기화 목록이 어긋나 데이터가 사라진 것처럼 보이므로, 바꾸려면 모든 참조 + `sync-user-data.ts`의 키 목록 + 서버에 저장된 JSON까지 함께 옮겨야 한다
- `lib/storage-keys.ts`의 상수는 3개뿐이고 나머지 키는 각 `*-store.ts`·페이지에 문자열로 흩어져 있음 — 새 키를 만들면 여기 등록
- 연습 세션: IndexedDB(`synced=false`) → `lib/sync-practice.ts` → `POST /api/sync-practice` → 오디오 Blob Storage 업로드 → `markSessionSynced()`
- 그 외 유저 데이터: `lib/sync-user-data.ts`가 지정 키들을 모아 `POST /api/sync-user-data` → **Supabase Storage `recordings` 버킷의 `sync/{userId}.json`**(테이블 아님). 쓰기는 `pushUserDataDebounced(key)`(1.5초). pull은 OAuth 콜백 페이지와 AuthGuard(새 기기), 그리고 홈(`(app)/page.tsx`)이 마운트·탭 복귀 때마다 `syncUserData()`(pull → 전체 push) + `syncPracticeSessions()`를 돌린다
  - 전체 push 대상은 `sync-user-data.ts`의 `SINGLE_KEYS` + 날짜 프리픽스(최근 90일) **allowlist** — 새 키는 여기 추가해야 기기 간 동기화된다. 스토어가 실제로 쓰는 키 이름과 이 목록이 일치하는지 확인할 것(이름이 어긋나면 조용히 누락된다)
  - pull 병합 규칙은 키마다 다르다: 완료/스케줄/커스텀 드릴은 union, `grit-on-profile`은 로컬 우선, 나머지는 서버 값이 로컬을 덮어쓴다
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
- 본 분석 라우트를 **직접** 호출하는 화면도 있다: `songs/[id]`(POST)와 `admin/music-db`·`admin/composer-resources`(GET 목록 조회·POST 재분석). 라우트가 export하는 메서드는 GET·POST뿐이다. 이쪽은 job/폴링 없이 응답을 끝까지 기다린다
- 내부 호출 판정은 `x-internal-call: INTERNAL_CALL_SECRET` **또는** `Authorization: Bearer CRON_SECRET`이고, 둘 다 값이 16자 이상일 때만 인정된다. 내부 호출은 어드민 취급이라 캐시를 무시하고 항상 재분석한다
- `cron/pre-analyze`(`lib/data/popular-pieces.ts`) / `cron/analyze-designated`(`designated_pieces`)는 미분석 곡을 self-fetch로 채우는 배치지만 현재 스케줄에 걸려 있지 않다(위 "크론" 참조) — 필요하면 `CRON_SECRET` Bearer로 수동 호출

### 알림·이벤트
- 영상 업로드는 **signed URL 직접 업로드**(`hooks/useVideoUpload.ts` → `/api/feedback/upload-url`, type `student|demo|room`). Vercel 함수 body 한도(~4.5MB) 때문에 파일을 API Route로 보내면 안 된다. 용량·MIME 상한은 Storage 버킷 설정이 강제
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
- ⚠️ **현재 무료 출시 상태**: PG(토스페이먼츠) 미연동. `/api/credits/charge`는 501 반환. 크레딧·Pro UI는 숨김 — `/credits`는 `credits/layout.tsx`가 `/`로 리다이렉트하고 피드백 요청은 `credit_amount` 0으로 생성. 유료 전환 전까지 화면에 크레딧·가격 문구를 새로 넣지 말 것

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
| `ABOUT.md` | 서비스 소개 — 가격 등 일부 stale |

### 소스가 아닌 것 (검색 결과에 섞여도 근거로 쓰지 말 것)

- `ai-analysis-full-code.txt` — 2026-02 시점 분석 코드 덤프. 현재 코드와 다르다. 실제 코드는 `src/app/api/analyze-song-v2/`, `src/lib/analysis-*.ts`
- `data/song-analysis-cache.json` — 어디서도 import하지 않는 잔재
- `data_collection` — `.gitmodules` 없이 남은 gitlink(빈 디렉터리)
- `mockup-screenshots/` — `scripts/capture-mockups.mjs`가 `/mockups`를 찍은 산출물
- `scripts/*.py`, `scripts/check-*.mjs`, `scripts/test-*.mjs` — 일회성 수동 스크립트. 앱·CI 어디에서도 실행하지 않는다

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
