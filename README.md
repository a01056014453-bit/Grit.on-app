# GRIT.ON App

AI 기반 클래식 음악 연습 지원 PWA 앱

## 개요

GRIT.ON은 클래식 음악가를 위한 연습 지원 앱입니다. 실시간 연습 녹음, AI 분석, 순연습시간 측정, 맞춤 연습 계획 생성 등의 기능을 제공합니다.

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI
- **Backend**: Supabase (예정)
- **PWA**: Serwist (Service Worker)

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

## 프로젝트 구조

```
src/
├── app/
│   ├── layout.tsx          # 루트 레이아웃
│   ├── globals.css         # 전역 스타일
│   └── (app)/              # 앱 라우트 그룹
│       ├── layout.tsx      # 앱 레이아웃 (하단 네비)
│       ├── page.tsx        # 홈 (대시보드)
│       ├── practice/       # 연습 세션
│       ├── recordings/     # 녹음 기록
│       │   └── [id]/       # 녹음 상세
│       ├── analysis/       # AI 분석 결과
│       ├── plans/          # 연습 계획
│       └── profile/        # 프로필/설정
├── components/
│   ├── app/                # 앱 전용 컴포넌트
│   └── ui/                 # 공통 UI 컴포넌트
├── lib/
│   └── utils.ts            # 유틸리티 함수
└── sw.ts                   # Service Worker
```

## 화면 구성

| 화면 | 경로 | 설명 |
|------|------|------|
| 홈 | `/` | 대시보드, 통계, 오늘의 목표 |
| 연습 | `/practice` | 연습 타이머, 녹음 |
| 녹음 | `/recordings` | 녹음 목록 |
| 녹음 상세 | `/recordings/[id]` | 개별 녹음 상세, 재생 |
| 분석 | `/analysis` | AI 분석 결과 |
| 계획 | `/plans` | 주간 계획, 오늘의 할 일 |
| 프로필 | `/profile` | 설정, 계정 관리 |

## 디자인 시스템

### 컬러

```css
--primary: #8B5CF6;    /* 바이올렛 - 메인 브랜드 컬러 */
--accent: #3B82F6;     /* 블루 - 보조 컬러 */
--background: #F9FAFB; /* 배경 */
--foreground: #111827; /* 텍스트 */
```

### 컴포넌트

**앱 컴포넌트 (`components/app/`)**
- `AppShell` - 앱 전체 레이아웃 쉘
- `BottomNavigation` - 하단 탭 바
- `StatsCard` - 통계 카드
- `ProgressRing` - 원형 프로그레스
- `QuoteCard` - 명언 카드
- `DailyGoal` - 오늘의 목표

**UI 컴포넌트 (`components/ui/`)**
- `Button` - 버튼
- `Modal` - 모달 다이얼로그

## PWA 지원

- iOS/Android 홈 화면 추가 지원
- 오프라인 캐싱
- 푸시 알림 (예정)

## 라이선스

Private
