# SEMPRE (셈프레) — GRIT.ON App

클래식 음악 전공생을 위한 AI 순연습시간 측정 & 연습 관리 · 레슨 연결 PWA

- **프로덕션**: https://withsempre.com (Vercel, `main` push 시 자동 배포)
- **상세 문서**: 프로젝트 규칙·구조·DB 스키마는 [CLAUDE.md](./CLAUDE.md)와 [docs/](./docs/) 참조

## 주요 기능

- **순연습시간 자동 측정** — Web Audio API + YAMNet VAD로 실제 악기 소리가 나는 시간만 누적
- **원포인트 레슨** — 학생 연습 영상 업로드 → 선생님 비동기 피드백 (크레딧 기반)
- **입시룸** — 학교별 연습실, 같은 곡 연습 학생끼리 영상 비교
- **AI 곡 분석** — 악보 분석, 마디별 취약 구간, 연습 추천 (Claude + OpenAI)
- **랭킹 / 선생님 모드 / 웹 푸시 알림**

## 기술 스택

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript 5
- **Styling**: Tailwind CSS 4 · Framer Motion · Radix UI
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Anthropic Claude SDK + OpenAI SDK · TensorFlow.js(YAMNet)
- **PWA**: Serwist (Service Worker + 웹 푸시 VAPID)
- **모니터링**: Sentry · **배포**: Vercel

## 시작하기

```bash
npm install
cp .env.example .env.local   # 필요한 키 채우기 (.env.example의 주석 참조)
npm run dev                  # 개발 서버
npm run dev:clean            # 캐시/서비스워커 초기화 후 개발 서버 (Git Bash에서 실행)
```

새 PC에서 처음 셋업한다면 → [docs/new-pc-setup.md](docs/new-pc-setup.md) (도구 설치·`.env.local` 받기·Claude 설정 이전)

## 테스트 · 빌드

```bash
npm test              # 유닛 테스트 (vitest)
npm run test:api      # API 테스트
npm run test:e2e      # E2E (puppeteer, TEST_BASE_URL 필요)
npm run test:ci       # CI 조합 (unit + api)
npm run lint          # ESLint
npm run build         # 프로덕션 빌드
```

CI: `.github/workflows/test.yml`이 `main`/`develop` push와 `main` 대상 PR에서 lint + test + build를 실행한다.

## 배포

별도 배포 스크립트 없음. **`main`에 push하면 Vercel이 프로덕션에 자동 배포**된다.
`main` 직접 push 금지 — 브랜치에서 PR을 거쳐 머지할 것 (자세한 규칙: CLAUDE.md).

## 라이선스

Private
