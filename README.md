# SEMPRE (셈프레) — GRIT.ON App

클래식 음악 전공생을 위한 AI 순연습시간 측정 & 연습 관리 · 레슨 연결 PWA

- **프로덕션**: https://withsempre.com (Vercel, `main` push 시 자동 배포)
- **문서 지도**: [아래 참조](#문서-지도) — 프로젝트 규칙은 [CLAUDE.md](./CLAUDE.md), 온보딩은 [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)

## 주요 기능

- **순연습시간 자동 측정** — Web Audio API + YAMNet VAD로 실제 악기 소리가 나는 시간만 누적 ([docs/audio-detection.md](docs/audio-detection.md))
- **원포인트 레슨** — 학생 연습 영상 업로드 → 선생님 비동기 피드백 (크레딧 기반)
- **입시룸** — 학교별 연습실, 같은 곡 연습 학생끼리 영상 비교
- **AI 곡 분석** — 악보 분석, 마디별 취약 구간, 연습 추천 (Claude + OpenAI + Perplexity)
- **랭킹 / 선생님 모드 / 웹 푸시 알림 / 메트로놈 / 음악 용어 사전**

> 현재 **무료 출시 상태**입니다. PG(토스페이먼츠)는 미연동이라 크레딧 충전·Pro 구독 버튼은 "준비 중"만 표시합니다.

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) + React 19 + TypeScript 5 (strict) |
| 스타일링 | Tailwind CSS 4 · Framer Motion 12 · Radix UI · Lucide |
| 폼 / 차트 | React Hook Form + Zod · Recharts 3 |
| DB / Auth / Storage | Supabase (PostgreSQL + RLS) |
| AI | Anthropic Claude SDK · OpenAI SDK · Perplexity · TensorFlow.js (YAMNet) |
| PWA | Serwist 9 (Service Worker + 웹 푸시 VAPID) |
| 이메일 / 모니터링 | Resend · Sentry |
| 테스트 | Vitest (unit / api / e2e) · Puppeteer |
| 배포 | Vercel (앱) · Railway (OMR 서버) |

## 시작하기

**요구 사항**: Node.js 20 (`.nvmrc`), npm. Windows에서는 Git Bash 권장.

```bash
git clone https://github.com/a01056014453-bit/Grit.on-app.git
cd Grit.on-app
nvm use                      # Node 20
npm install
cp .env.example .env.local   # 아래 "환경변수" 참조
npm run dev                  # http://localhost:3000
```

새 PC에서 처음 셋업한다면 [docs/new-pc-setup.md](docs/new-pc-setup.md)를 따르세요 (도구 설치 · `.env.local` 받기 · Claude 설정 이전).

### 환경변수

정본은 [`.env.example`](./.env.example)입니다. 필수/선택 구분 요약:

| 구분 | 키 | 비고 |
|------|----|------|
| **필수** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | 서비스 롤 키는 서버 전용, `NEXT_PUBLIC_` 금지 |
| **필수** | `NEXT_PUBLIC_APP_URL` | OAuth 리다이렉트·링크 생성에 사용 |
| AI | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `PERPLEXITY_API_KEY` | 곡 분석. Perplexity 없으면 팩트 정확도 저하 |
| 로그인 | Google / Kakao / Apple 키 | 소셜 로그인 |
| 푸시 | `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | `npx web-push generate-vapid-keys` |
| 보호 시크릿 | `CRON_SECRET`, `INTERNAL_CALL_SECRET`, `CORE_API_KEY`, `ADMIN_USER_IDS` | 크론·내부 API·어드민 |
| 선택 | `OMR_SERVER_URL`, Sentry, GA, Slack, CoolSMS, YouTube, App Store Connect | 없으면 해당 기능만 비활성 |

Vercel 권한이 있으면 `npx vercel link && npx vercel env pull .env.local`로 받을 수 있습니다.
`.env.local` 내용은 절대 커밋·로그·응답에 노출하지 마세요.

## 명령어

```bash
npm run dev            # 개발 서버
npm run dev:clean      # .next / SW 캐시 초기화 후 개발 서버 (POSIX rm 사용 → Git Bash에서 실행)
npm run build          # 프로덕션 빌드
npm run start          # 빌드 결과 실행
npm run lint           # ESLint (flat config, 대부분 warn — 빌드를 막지 않으니 직접 확인)

npm test               # 유닛 테스트 (tests/unit)
npm run test:watch     # 유닛 테스트 watch
npm run test:api       # API 테스트 (tests/api)
npm run test:e2e       # E2E (puppeteer) — TEST_BASE_URL 없으면 조용히 스킵
npm run test:all       # 전체
npm run test:ci        # CI 조합 (unit + api)
npm run test:coverage  # 커버리지

npm run dev:debug      # 개발 중 에러 모니터 (scripts/dev-debugger)
```

## 프로젝트 구조

```
src/
├── app/
│   ├── (app)/           # 인증 필요 페이지 (AuthGuard) — practice, ranking, feedback, rooms, teacher …
│   ├── (landing)/       # 비인증 페이지 (onboarding, privacy, terms 등)
│   ├── admin/           # 관리자 대시보드 (ADMIN_USER_IDS)
│   ├── api/             # API Routes (analyze-song-v2, feedback, credits, cron, push …)
│   ├── auth/            # OAuth 콜백
│   └── invite/[token]/  # 학생 초대 수락
├── components/          # teacher/, practice/, feedback/, ui/ (IconButton·Chip·GlassCard·StatGroup)
├── hooks/               # useAudioRecorder(핵심: VAD + 순연습시간), useTeacherMode, usePracticeSessions
├── lib/                 # queries/, services/, supabase-*.ts, db-mutate.ts, teacher-store.ts, analysis-prompts.ts
├── types/               # database.ts (Supabase CLI 자동생성 — 직접 수정 금지)
└── sw.ts                # Service Worker (PWA + 웹 푸시)

supabase/migrations/     # DB 마이그레이션 SQL
omr-server/              # PDF → MusicXML 변환 서버 (Audiveris, Python, Railway 배포)
scripts/                 # 개발 디버거, 데이터 점검 스크립트, 에이전트 스크립트
tests/                   # unit / api / e2e
docs/                    # 스키마·오디오 감지·디자인 토큰·PRD
```

### 핵심 규칙 (자세히는 [CLAUDE.md](./CLAUDE.md))

- DB 쓰기는 반드시 `src/lib/db-mutate.ts` 경유 — 클라이언트에서 직접 쓰기 금지
- 모든 테이블은 RLS 적용, 타입은 `src/types/database.ts` 기준
- 선생님 모드는 `teacher-store.ts`를 통해서만
- 색상·텍스트는 디자인 토큰 클래스(`text-fg-*`, `bg-surface-*` …) 사용, raw `text-gray-*` 금지
- Pro 기능은 구독 확인 없이 노출 금지

## CI · 배포

- **CI**: [`.github/workflows/test.yml`](.github/workflows/test.yml)이 `main`/`develop` push와 `main` 대상 PR에서 `npm ci → lint → test:ci → build`를 실행합니다. 그 외 브랜치는 CI가 돌지 않으니 push 전 로컬에서 같은 3종을 돌리세요.
- **배포**: 별도 스크립트 없음. **`main`에 push하면 Vercel이 즉시 프로덕션 배포**합니다. `main` 직접 push 금지 — 브랜치 → PR → 머지.
- **크론**: [`vercel.json`](./vercel.json)에 일일/주간 리워드, 모닝 브리프, 피드백 만료·SLA 체크, 선생님 자동 승인, 리포트 크론이 정의되어 있고 `CRON_SECRET`으로 보호됩니다.
- **에이전트 워크플로**: `agent-review` (PR 자동 리뷰), `agent-issue` (이슈 분류), `agent-autofix`, `agent-daily` (매일 08:00 KST 요약).

### 빌드 함정

- 모듈 최상위에서 SDK 클라이언트를 만드는 서버 코드(`lib/supabase-server.ts` 등)는 `next build` 단계에서 import되므로, 키가 없으면 빌드가 실패합니다. CI 재현은 `.env.local` 없이 `test.yml`의 placeholder env로 빌드하세요. 새 모듈 레벨 클라이언트를 추가하면 `test.yml`에 placeholder를 추가하거나 함수 안에서 지연 생성하세요.
- 로컬에서 서비스 워커/캐시 문제가 나면 `npm run dev:clean` (Git Bash).

## 문서 지도

| 문서 | 내용 |
|------|------|
| [CLAUDE.md](./CLAUDE.md) | 프로젝트 규칙·컨벤션·금지 사항 (AI 에이전트 및 사람 공통) |
| [AGENTS.md](./AGENTS.md) | Codex 등 다른 에이전트용 작업 지침 |
| [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) | 개발자 온보딩, AI 곡 분석 파이프라인 개요 |
| [ABOUT.md](./ABOUT.md) | 서비스 소개 |
| [docs/db-schema.md](docs/db-schema.md) | Supabase 테이블·Enum |
| [docs/audio-detection.md](docs/audio-detection.md) | 순연습시간 측정 로직·상수 |
| [docs/design-tokens.md](docs/design-tokens.md) | Figma ↔ CSS 디자인 토큰 |
| [docs/new-pc-setup.md](docs/new-pc-setup.md) | 새 PC 셋업 |
| [docs/prd/](docs/prd/) | 기능별 PRD (곡 분석, 크레딧, 피드백 SLA, 랭킹 등) |
| [PROGRESS.md](./PROGRESS.md) | 초기 개발 기록 (stale — 최신 현황은 CLAUDE.md·git 기준) |

## 문의

- 기술 문의: Slack #dev
- 사용자 지원: support@withsempre.com

## 라이선스

Private
