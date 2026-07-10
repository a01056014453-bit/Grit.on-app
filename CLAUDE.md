# 셈프레 (Sempre) — GRIT.ON App

> 클래식 음악 전공생을 위한 AI 순연습시간 측정 & 연습 관리 · 레슨 연결 플랫폼

---

## 서비스 개요

- **서비스명**: 셈프레 (Sempre) / GRIT.ON
- **타겟**: 클래식 음대 입시생 + 재학생, 담당 레슨 선생님
- **핵심 가치**: 실제 악기를 연주한 시간(순연습시간)만 자동 측정
- **웹사이트**: https://griton-app.vercel.app

### 주요 기능
1. **순연습시간 자동 측정** — Web Audio API + YAMNet VAD, 소리 나는 시간만 누적
2. **원포인트 레슨** — 학생 연습 영상 업로드 → 선생님 비동기 음성 피드백 (크레딧 기반)
3. **입시룸(rooms)** — 학교별 연습실, 같은 곡 연습 학생끼리 영상 비교
4. **AI 곡 분석** — 악보 분석, 마디별 취약 구간, 연습 추천 (Claude + OpenAI)
5. **랭킹** — 순연습시간 기반 일일 랭킹 (daily_rankings)
6. **선생님 모드** — 학생 관리, 초대(토큰), 피드백 인박스

---

## 기술 스택

```
프레임워크:  Next.js 15 (App Router) + React 19 + TypeScript 5
스타일링:    Tailwind CSS 4 + tw-animate-css
애니메이션:  Framer Motion 12
UI:          Radix UI (Dialog, Select, Label) + Lucide Icons
폼:          React Hook Form + Zod
차트:        Recharts 3

DB / Auth:   Supabase (PostgreSQL + Auth + Storage)
AI:          Anthropic Claude SDK + OpenAI SDK
오디오 분석: TensorFlow.js + Speech Commands (YAMNet)
PWA:         Serwist 9 (Service Worker + 웹 푸시 VAPID)
이메일:      Resend
모니터링:    Sentry
배포:        Vercel
테스트:      Vitest (unit/api/e2e), E2E는 Puppeteer 기반
```

---

## 프로젝트 파일 구조

```
src/
├── app/
│   ├── (app)/                    # 인증 필요 페이지 (AuthGuard) — 폴더명 = 기능명, 20여개 라우트
│   ├── (landing)/                # 비인증 페이지 (onboarding, privacy, terms 등)
│   ├── admin/                    # 관리자 페이지
│   ├── api/                      # API Routes (30+ 엔드포인트)
│   ├── auth/                     # OAuth 콜백 페이지
│   └── invite/[token]/           # 학생 초대 수락
├── components/                   # teacher/, practice/, feedback/, ui/, AuthGuard.tsx
├── lib/                          # queries/, services/, supabase*.ts, db-mutate.ts, teacher-store.ts, push-*.ts
├── hooks/                        # useTeacherMode, useAudioRecorder(핵심: VAD+순연습시간), usePracticeSessions
├── types/                        # database.ts(Supabase 자동생성, 직접 수정 금지), feedback.ts 등
└── sw.ts                         # Service Worker (PWA + 웹 푸시)
```

세부 하위 폴더는 자주 바뀌므로 여기 나열하지 않는다 — 필요하면 직접 탐색할 것.

---

## Supabase DB 구조

테이블: `profiles, teachers, teacher_students, invitations, feedback_requests, feedbacks, practice_sessions, daily_rankings, songs, song_analyses, pieces, piece_analyses, schools, rooms, room_memberships, drill_cards, practice_todos, push_subscriptions`

전체 컬럼·Enum 상세: @docs/db-schema.md

---

## 비즈니스 모델

| 플랜 | 가격 | 내용 |
|------|------|------|
| Free | 무료 | 기본 타이머, 순연습시간 측정, 기본 통계 |
| Pro | ₩15,900/월 | 무제한 AI 분석, 상세 리포트, 클라우드 백업, 광고 제거 |

- **원포인트 레슨 크레딧 수익배분**: 플랫폼 70% / 선생님 30%
- **파트너**: Wonart, Leanup, Piu

---

## 오디오 감지 핵심 로직 (useAudioRecorder.ts)

- 적응형 노이즈 플로어(30초마다 재캘리브레이션) + 3dB를 넘으면 소리 감지
- 소리가 800ms 이상 지속되어야 카운팅 시작, 끊긴 후 7000ms 지나야 중단 (히스테리시스)
- 3초마다 YAMNet으로 클립 분류(악기 vs 잡음/목소리), 목소리 감지 시 2.5초 카운팅 억제
- 집중도(%) = 순연습시간 / 전체 경과시간

정확한 상수값·전체 흐름: @docs/audio-detection.md

---

## 디자인 시스템

메인 컬러: `#8B5CF6` (바이올렛) · 폰트: Pretendard Variable · 기본 모서리: 16px

전체 컬러 팔레트·타이포·이펙트 토큰(Figma ↔ CSS 매핑 소스 오브 트루스): @docs/design-tokens.md

---

## 코드 컨벤션

- TypeScript strict 모드 (tsconfig `strict: true`), path alias `@/*` → `./src/*`
- **모든 타입은 `src/types/database.ts` 기준**
- 컴포넌트: 함수형 + Hooks
- 파일명: kebab-case
- API Route: `/app/api/[기능명]/route.ts`
- **DB 쓰기: 반드시 `lib/db-mutate.ts` 경유** (서버 경유 원칙)
- Supabase 클라이언트: 브라우저 → `supabase-browser.ts`, 서버 → `supabase-server.ts`
- 스타일: Tailwind CSS 클래스만, 인라인 스타일 지양
- 에러 처리: try/catch 필수, 한국어 에러 메시지
- 폼: React Hook Form + Zod 스키마 필수
- ESLint(`eslint.config.mjs`, flat config)는 `no-explicit-any`/`no-unused-vars`/`rules-of-hooks` 등 대부분 `"warn"`이라 자동으로 빌드를 막지 않는다 — 직접 신경 써서 피할 것

---

## 절대 하지 말 것

1. `types/database.ts` 직접 수정 금지 — Supabase CLI로만 갱신
2. Supabase 테이블에 RLS 없이 접근 금지
3. `teacher-store.ts` 우회하여 선생님 모드 직접 구현 금지
4. 클라이언트에서 직접 DB 쓰기 금지 → `db-mutate.ts` 경유
5. Pro 기능 구독 확인 없이 노출 금지
6. `.env.local` 등 환경변수 파일 내용을 응답·커밋·로그에 노출 금지 (Supabase/OpenAI 키 등 포함)
7. `main` 브랜치 직접 push 금지 — push 즉시 Vercel이 프로덕션에 자동 배포함

---

## 자주 쓰는 명령어

```bash
npm run dev          # 개발 서버
npm run dev:clean    # 캐시/서비스워커 초기화 후 개발 서버 (로컬 이슈 발생 시)
npm run build        # 프로덕션 빌드
npm run lint         # 린트 (eslint)

npm test              # 유닛 테스트 (vitest run tests/unit)
npm run test:api      # API 테스트
npm run test:e2e      # E2E 테스트 (puppeteer) — TEST_BASE_URL 환경변수 없으면 조용히 스킵됨
npm run test:all      # 전체 테스트
npm run test:ci       # CI 실행 조합 (unit + api)
```

**배포**: 별도 배포 스크립트 없음. `main`에 push하면 Vercel이 자동으로 프로덕션에 배포한다. GitHub Actions(`test.yml`)가 `main`/`develop` push와 `main` 대상 PR에서 `npm ci && npm test`를 실행해 게이트 역할을 한다.

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
1. 지구야 요청 → 오케스트레이터 분배
2. 각 에이전트 작업
3. 감사 에이전트 검토 (최대 3회 수정 루프)
4. 오케스트레이터 취합 → 지구야 보고

---

## CLAUDE.md 관리 원칙

- 작업 중 새 컨벤션이나 함정을 발견하면 그 자리에서 이 파일에 반영한다 (몰아서 하지 않는다)
- PR 리뷰에서 지적된 규칙은 여기에 업데이트한다
- 파일 개수·서브폴더 목록처럼 자주 바뀌는 수치/목록은 적지 않는다 — 금방 stale해진다
- 정기적으로 코드와 불일치하는 내용이 없는지 점검한다
