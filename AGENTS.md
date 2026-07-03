# GRIT.ON / Sempre - Codex 작업 지침

이 저장소는 클래식 음악 전공생을 위한 AI 순연습시간 측정 및 연습 관리, 레슨 연결 플랫폼입니다. Claude Code로 개발해 온 프로젝트를 Codex에서도 이어서 다룰 수 있도록, 아래 규칙을 우선 적용합니다.

## 프로젝트 개요

- 서비스명: 셈프레(Sempre) / GRIT.ON
- 타겟: 클래식 음대 입시생, 재학생, 담당 레슨 선생님
- 핵심 가치: 실제 악기를 연주한 시간, 즉 순연습시간만 자동 측정
- 배포: https://griton-app.vercel.app

주요 기능:
- Web Audio API + YAMNet VAD 기반 순연습시간 측정
- 학생 연습 영상 업로드와 선생님 비동기 음성 피드백
- 학교별 입시룸, 같은 곡 연습 학생 영상 비교
- AI 곡 분석, 취약 구간, 연습 추천
- 순연습시간 기반 일일 랭킹
- 선생님 모드, 학생 관리, 초대, 피드백 인박스

## 기술 스택

- Framework: Next.js 15 App Router, React 19, TypeScript 5
- Styling: Tailwind CSS 4, tw-animate-css
- Animation: Framer Motion 12
- UI: Radix UI, Lucide Icons
- Forms: React Hook Form, Zod
- Charts: Recharts 3
- DB/Auth/Storage: Supabase
- AI: Anthropic Claude SDK, OpenAI SDK
- Audio: TensorFlow.js, Speech Commands(YAMNet)
- PWA: Serwist 9, Service Worker, Web Push VAPID
- Email/Monitoring/Deploy: Resend, Sentry, Vercel
- Tests/Tooling: Vitest, Puppeteer, pg, ESLint

## 중요한 경로

- `src/app/(app)/`: 인증 필요 앱 화면
- `src/app/(landing)/`: 비인증/랜딩/온보딩 화면
- `src/app/api/`: API Routes
- `src/components/`: 도메인별 컴포넌트와 공통 UI
- `src/hooks/useAudioRecorder.ts`: VAD와 순연습시간 측정 핵심 로직
- `src/lib/db-mutate.ts`: 클라이언트 DB 쓰기용 서버 경유 유틸
- `src/lib/supabase-browser.ts`: 브라우저 Supabase 클라이언트
- `src/lib/supabase-server.ts`: 서버 Supabase 클라이언트
- `src/lib/teacher-store.ts`: 선생님 모드 localStorage 관리
- `src/types/database.ts`: Supabase 자동 생성 타입, 타입 source of truth
- `src/sw.ts`: PWA와 웹 푸시 Service Worker
- `.claude/agents/`: 기존 Claude Code용 역할 지침 참고 자료

## 개발 명령

패키지 매니저는 `package-lock.json` 기준으로 npm을 사용합니다.

- Install: `npm install`
- Dev: `npm run dev`
- Clean dev: `npm run dev:clean`
- Build: `npm run build`
- Start: `npm run start`
- Lint: `npm run lint`
- Unit tests: `npm run test`
- API tests: `npm run test:api`
- E2E tests: `npm run test:e2e`
- All tests: `npm run test:all`
- CI tests: `npm run test:ci`

Windows에서 `dev:clean`은 shell 차이로 실패할 수 있습니다. 일반 개발 서버 확인은 먼저 `npm run dev`를 사용합니다.

## 작업 원칙

- 기존 프로젝트 패턴을 먼저 따르고, 새 추상화는 실제 중복이나 복잡도를 줄일 때만 추가합니다.
- 사용자가 만든 미커밋 변경을 되돌리지 않습니다. 작업 전후 `git diff --stat` 또는 관련 파일 diff를 확인합니다.
- 타입은 `src/types/database.ts`를 기준으로 사용하되, 이 파일은 직접 수정하지 않습니다. Supabase CLI 생성물을 수동 편집하지 않습니다.
- DB 쓰기는 클라이언트에서 직접 하지 않고 `src/lib/db-mutate.ts` 또는 서버 API Route를 경유합니다.
- Supabase 접근은 RLS 정책을 전제로 하며, RLS 우회 구현을 추가하지 않습니다.
- 선생님 모드는 `src/lib/teacher-store.ts`와 `useTeacherMode` 흐름을 우선합니다.
- Pro 기능은 구독 확인 없이 노출하지 않습니다.
- 에러 처리는 `try/catch`를 기본으로 하고, 사용자-facing 메시지는 한국어로 작성합니다.
- 폼은 React Hook Form + Zod 패턴을 우선합니다.
- 스타일은 Tailwind CSS 클래스를 우선하고, 인라인 스타일은 피합니다.

## 도메인 규칙

순연습시간 측정 기준:
- FFT 크기: 2048
- dB 임계값: -45dB 이상만 연주로 인식
- 최소 지속시간: 150ms
- 소리 감지 시 순연습시간 누적
- 무음 구간은 타이머 정지
- 집중도는 순연습시간 / 전체 경과시간
- YAMNet으로 악기 소리와 잡음을 분류

핵심 DB 테이블:
- `profiles`, `teachers`, `teacher_students`, `invitations`
- `feedback_requests`, `feedbacks`
- `practice_sessions`, `daily_rankings`
- `songs`, `song_analyses`, `pieces`, `piece_analyses`
- `schools`, `rooms`, `room_memberships`
- `drill_cards`, `practice_todos`, `push_subscriptions`

## 디자인 기준

- 메인 컬러: `#8B5CF6`
- 배경: slate 계열 `#F8FAFC` to `#0F172A`
- 성공/감지: `#10B981`
- 집중 필요: `#F97316`
- 오류: `#EF4444`
- 폰트: Noto Sans KR
- 모서리: 16px
- 아이콘: Lucide Icons
- 모달: 바텀시트, 슬라이드업, 백드롭 블러 패턴

기존 화면의 시각 언어를 우선합니다. 새 UI를 만들 때도 이 디자인 시스템과 모바일 PWA 사용성을 먼저 맞춥니다.

## Figma 작업

사용자는 Figma MCP를 연결했습니다. 앞으로 Figma 관련 작업은 `병현` 플랜을 사용합니다.

- Figma plan key: `team::1646353295441565367`

Figma 파일을 읽거나 쓰는 작업은 Codex의 Figma 도구/스킬 지침을 우선 적용하고, 디자인 시스템 재사용 여부를 먼저 확인합니다.

## Claude Code 자료 이식 기준

`CLAUDE.md`와 `.claude/agents/`는 기존 작업 맥락을 이해하기 위한 참고 자료입니다. Codex 작업 시에는 이 파일의 규칙을 우선하되, 클래식 음악 분석, 프론트엔드, 백엔드, 테스트 관점이 필요하면 `.claude/agents/*.md`를 참고합니다.

Claude 전용 오케스트레이션 문구나 역할 분배 흐름은 그대로 복제하지 않습니다. Codex는 필요한 파일을 직접 읽고, 작은 단위로 구현하고, 가능한 검증 명령을 실행한 뒤 변경 요약과 남은 리스크를 보고합니다.

## 검증 우선순위

변경 범위에 따라 다음 중 가장 적절한 검증을 실행합니다.

- 문서/설정만 변경: `git diff --stat`와 관련 파일 diff 확인
- 타입/컴포넌트 변경: `npm run lint`
- 빌드 영향 가능성: `npm run build`
- 로직 변경: 관련 `vitest` 명령
- API 변경: `npm run test:api`
- 사용자 플로우 변경: 가능하면 `npm run test:e2e`

검증을 실행하지 못했거나 실패하면, 실패한 명령과 이유를 최종 보고에 남깁니다.
