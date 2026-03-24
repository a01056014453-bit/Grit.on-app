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
Dev:         ESLint, Puppeteer (E2E), pg (DB 직접 접속)
```

---

## 프로젝트 파일 구조

```
src/
├── app/
│   ├── (app)/                    # 인증 필요 페이지 (AuthGuard)
│   │   ├── ai-analysis/          # AI 곡 분석 보관함
│   │   ├── feedback/             # 피드백 요청 (학생)
│   │   ├── inbox/                # 피드백 인박스 (선생님)
│   │   ├── practice/             # 연습 (녹음, 타이머)
│   │   ├── records/              # 연습 기록 캘린더
│   │   ├── ranking/              # 랭킹
│   │   ├── rooms/                # 연습실 (학교별)
│   │   ├── teacher/              # 선생님 학생 관리
│   │   ├── teachers/             # 선생님 목록 (학생용)
│   │   ├── profile/              # 프로필, 선생님 등록
│   │   ├── routines/             # 루틴 관리
│   │   └── stats, goals, songs 등
│   ├── (landing)/                # 비인증 페이지
│   │   ├── onboarding/           # 회원가입 (약관→닉네임→나이→악기→프로필)
│   │   └── privacy, terms, support
│   ├── admin/                    # 관리자 페이지
│   ├── api/                      # API Routes (30+ 엔드포인트)
│   │   ├── auth/                 # Google/Apple/Kakao OAuth, 중복체크
│   │   ├── push/                 # 웹 푸시 구독/발송
│   │   ├── teacher/              # 초대, 학생 목록
│   │   └── analyze-song/         # AI 곡 분석
│   ├── auth/                     # OAuth 콜백 페이지
│   └── invite/[token]/           # 학생 초대 수락
├── components/
│   ├── teacher/                  # 선생님 대시보드, 학생 카드, 초대
│   ├── practice/                 # 드릴, 녹음, 분석
│   ├── feedback/                 # 피드백 카드
│   ├── ui/                       # 공통 UI
│   └── AuthGuard.tsx             # 인증 + 푸시 구독
├── lib/
│   ├── queries/                  # Supabase 쿼리 (profiles, feedback, teachers 등)
│   ├── services/                 # 초대 서비스
│   ├── supabase*.ts              # Supabase 클라이언트 (browser/server/middleware)
│   ├── sync-user-data.ts         # localStorage ↔ Supabase 동기화
│   ├── teacher-store.ts          # 선생님 모드 localStorage 관리
│   ├── push-*.ts                 # 웹 푸시 구독/발송
│   └── db-mutate.ts              # 서버 경유 DB 쓰기
├── hooks/
│   ├── useTeacherMode.ts
│   ├── useAudioRecorder.ts       # 핵심: VAD + 순연습시간 측정
│   └── usePracticeSessions.ts
├── types/
│   ├── database.ts               # Supabase 자동생성 타입 ← source of truth
│   └── feedback.ts, teacher-mode.ts, invitation.ts 등
└── sw.ts                         # Service Worker (PWA + 웹 푸시)
```

총 264개 TypeScript/TSX 파일

---

## Supabase DB 구조

```
profiles              user_id, nickname, email, instrument, level
                      grit_score, daily_goal, streak_days

teachers              user_id(FK), name, specialty[], verified
                      career(JSON), rating, bio, badges[]

teacher_students      teacher_id, student_id, type(전공/취미), category

invitations           teacher_id(FK), token(UNIQUE), status, expires_at

feedback_requests     student_id(FK), teacher_id(FK)
                      composer, piece, problem_type
                      status(ENUM), video_url, credit_amount, payment_status

feedbacks             request_id(FK), comments(JSON), demo_video_url, practice_card

practice_sessions     user_id(FK), piece_name
                      practice_time(순연습), total_time(전체)
                      practice_type, audio_url

daily_rankings        user_id(FK), date, net_practice_time, grit_score

songs                 user_id(FK), title, composer, opus

song_analyses         composer, title, content(JSON), difficulty_level

pieces                id, title, composer_*, opus, key
piece_analyses        piece_id(FK), sections(JSON), total_measures

schools               id, name, type, year, deadline
rooms                 school_id(FK), member_count, video_count
room_memberships      room_id(FK), user_id(FK)

drill_cards           user_id(FK), song, measures, tempo
practice_todos        user_id(FK), song_title, technique, is_completed
push_subscriptions    user_id(UNIQUE), endpoint, keys(JSON)
```

### Enums
```
feedback_request_status  pending | accepted | completed | rejected
payment_status           unpaid | paid | refunded
instrument_type          piano | violin | cello | flute | ...
problem_type             technique | interpretation | tempo | ...
practice_type            focused | run_through | drill | ...
difficulty_level         beginner | intermediate | advanced | professional
```

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

```
FFT 크기:       2048
dB 임계값:      -45dB (이상만 연주로 인식)
최소 지속시간:  150ms (잡음 필터링)
소리 감지 시 → 순연습시간 누적
무음 구간 →    타이머 정지
집중도(%) =    순연습시간 / 전체 경과시간
YAMNet →       악기 소리 vs 잡음 분류
```

---

## 디자인 시스템

```
메인 컬러:  #8B5CF6 (바이올렛)
배경:       슬레이트 계열 (#F8FAFC ~ #0F172A)
성공/감지:  #10B981 (초록)
집중 필요:  #F97316 (주황)
오류:       #EF4444 (빨강)
폰트:       Noto Sans KR
모서리:     16px
아이콘:     Lucide Icons
모달:       바텀시트 + 슬라이드업 + 백드롭 블러
```

---

## 코드 컨벤션

- TypeScript 엄격 모드, **모든 타입은 `src/types/database.ts` 기준**
- 컴포넌트: 함수형 + Hooks
- 파일명: kebab-case
- API Route: `/app/api/[기능명]/route.ts`
- **DB 쓰기: 반드시 `lib/db-mutate.ts` 경유** (서버 경유 원칙)
- Supabase 클라이언트: 브라우저 → `supabase-browser.ts`, 서버 → `supabase-server.ts`
- 스타일: Tailwind CSS 클래스만, 인라인 스타일 지양
- 에러 처리: try/catch 필수, 한국어 에러 메시지
- 폼: React Hook Form + Zod 스키마 필수

---

## 절대 하지 말 것

1. `types/database.ts` 직접 수정 금지 — Supabase CLI로만 갱신
2. Supabase 테이블에 RLS 없이 접근 금지
3. `teacher-store.ts` 우회하여 선생님 모드 직접 구현 금지
4. 클라이언트에서 직접 DB 쓰기 금지 → `db-mutate.ts` 경유
5. Pro 기능 구독 확인 없이 노출 금지

---

## 자주 쓰는 명령어

```bash
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run lint     # 린트
```

---

*실제 프로젝트 기준 (264개 파일, Supabase ERD 전체 반영)*

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
