# Sempre 개발자 온보딩 가이드

## 1. 환경 준비

```bash
# Node.js 20 LTS 설치 (nvm 사용 권장)
nvm install 20
nvm use 20

# 레포 클론
git clone https://github.com/a01056014453-bit/Grit.on-app.git
cd Grit.on-app

# 의존성 설치
npm install
```

## 2. 환경변수 설정

`.env.local` 파일을 프로젝트 루트에 생성하세요.
**팀 리드에게 Slack DM으로 파일을 요청하세요.**

필요한 환경변수 목록:
```
NEXT_PUBLIC_SUPABASE_URL=        # Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase 공개 키
SUPABASE_SERVICE_ROLE_KEY=       # Supabase 서비스 키 (서버 전용)
OPENAI_API_KEY=                  # GPT-4o API 키
PERPLEXITY_API_KEY=              # Perplexity 검색 API
ANTHROPIC_API_KEY=               # Claude API 키
ADMIN_USER_IDS=                  # 어드민 유저 UUID (쉼표 구분)
CRON_SECRET=                     # Cron 인증 토큰
RESEND_API_KEY=                  # 이메일 발송
SLACK_WEBHOOK_URL=               # Slack 알림
```

## 3. 로컬 개발 서버 실행

```bash
npm run dev
# http://localhost:3000 에서 확인
```

## 4. 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── (app)/              # 인증 필요 페이지 (AuthGuard)
│   │   ├── ai-analysis/    # AI 곡 분석
│   │   ├── practice/       # 연습 세션
│   │   ├── teacher/        # 선생님 학생 관리
│   │   └── profile/        # 프로필
│   ├── (landing)/          # 비인증 페이지 (온보딩, 약관)
│   ├── admin/              # 관리자 페이지
│   ├── api/                # API Routes (30+)
│   └── auth/               # OAuth 콜백
├── components/             # 재사용 컴포넌트
├── lib/                    # 비즈니스 로직
│   ├── queries/            # Supabase 쿼리
│   ├── services/           # 초대 등 서비스
│   ├── analysis-prompts.ts # AI 분석 프롬프트 (핵심)
│   ├── analysis-agents/    # 악기별 에이전트 20종
│   └── data/               # 작곡가 DB, 인기곡 목록
├── hooks/                  # React 훅
├── types/                  # TypeScript 타입
└── sw.ts                   # 서비스 워커 (PWA + 웹 푸시)
```

## 5. 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) + React 19 |
| 언어 | TypeScript 5 |
| 스타일링 | Tailwind CSS 4 |
| DB / Auth | Supabase (PostgreSQL + Auth + Storage) |
| AI | OpenAI GPT-4o, Perplexity, Claude |
| PWA | Serwist (서비스 워커, 웹 푸시) |
| 배포 | Vercel |

## 6. 브랜치 & 배포

```
main   → Production 배포 (withsempre.com)
dev    → 개발용 (Preview 배포 추후 세팅)
```

- `main`에 직접 푸시하면 **즉시 프로덕션 배포**됩니다
- 새 기능은 **브랜치 → PR → 리뷰 → 머지** 권장

## 7. 주요 명령어

```bash
npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드
npm run lint         # ESLint
```

## 8. 어드민 페이지

```
URL: https://withsempre.com/admin
```
어드민 접근 권한은 `ADMIN_USER_IDS`에 본인 Supabase user ID가 등록되어야 합니다.
테스트용 어드민 계정이 필요하면 팀 리드에게 요청하세요.

## 9. AI 곡 분석 파이프라인

```
Phase 0: Perplexity + 학술논문 DB + IMSLP Vision (병렬)
Phase 1: 곡 개요 (GPT-4o)
Phase 2-A: 사고 단계 (GPT-4o-mini)
Phase 2-B: 콘텐츠 생성 (GPT-4o)
Phase 3: 구조/화성 분석 (GPT-4o)
Phase 4a: 연습법 + 추천 연주 (GPT-4o) + YouTube API
Phase 4b: 4주 루틴 (GPT-4o)
```

프롬프트 수정: `src/lib/analysis-prompts.ts`
악기 에이전트: `src/lib/analysis-agents/`

## 10. 문의

- 기술 문의: Slack #dev 채널
- 긴급: support@withsempre.com
