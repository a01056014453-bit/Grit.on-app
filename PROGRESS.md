# GRIT.ON App 개발 진행 현황

## Phase 개요

| Phase | 내용 | 상태 |
|-------|------|------|
| **Phase 1** | PWA 기반 + 홈 화면 | ✅ 완료 |
| **Phase 2** | 나머지 화면 목업 | ✅ 완료 |
| **Phase 2.5** | 세부 페이지 및 인터랙션 | ✅ 완료 |
| **Phase 3** | 연습 타이머 핵심 기능 | ⏳ 대기 |
| **Phase 4** | 데이터 연동 및 분석 | ⏳ 대기 |

---

## Phase 1: PWA 기반 + 홈 화면 ✅

### 완료된 작업

- [x] 프로젝트 초기 설정
  - [x] Next.js 15 + TypeScript 설정
  - [x] Tailwind CSS 4 설정
  - [x] 디자인 시스템 (컬러, 타이포그래피)

- [x] PWA 설정
  - [x] manifest.json 생성
  - [x] Service Worker (Serwist) 설정
  - [x] 앱 아이콘 (SVG 플레이스홀더)
  - [x] iOS/Android 메타 태그

- [x] 앱 레이아웃
  - [x] 루트 레이아웃 (viewport, meta 태그)
  - [x] 앱 레이아웃 (safe area, padding)
  - [x] 하단 네비게이션 (BottomNavigation)
  - [x] 앱 쉘 (AppShell) - 통합 레이아웃 컴포넌트
    - [x] 스플래시 화면 - 앱 진입 시 로딩 화면
    - [x] 로그인 화면 - Apple/Google 로그인 버튼
    - [x] 로그인 상태 유지 (localStorage)

- [x] 홈 화면 구현
  - [x] 인사 헤더 (시간대별 인사말)
  - [x] 통계 카드 3열 (StatsCard)
  - [x] 명언 카드 (QuoteCard)
  - [x] 오늘의 목표 (DailyGoal + ProgressRing)
  - [x] 연습 시작 버튼
  - [x] 오늘의 집중 구간 (마디 그리드)

---

## Phase 2: 나머지 화면 목업 ✅

### 완료된 작업

- [x] 연습 세션 화면 (`/practice`)
  - [x] 연습곡 선택 UI
  - [x] 타이머 디스플레이
  - [x] 파형 시각화 (플레이스홀더)
  - [x] 시작/일시정지/종료 버튼

- [x] 녹음 기록 화면 (`/recordings`)
  - [x] 통계 요약 (총 녹음, 평균 점수, 총 분)
  - [x] 녹음 목록 (더미 데이터)
  - [x] 녹음 카드 (곡명, 시간, 점수, 집중구간)

- [x] 연습 계획 화면 (`/plans`)
  - [x] 주간 캘린더 (히트맵 스타일)
  - [x] 오늘의 계획 목록
  - [x] 체크박스 UI
  - [x] AI 추천 카드

- [x] 프로필/설정 화면 (`/profile`)
  - [x] 프로필 헤더 (아바타, 이름, 악기)
  - [x] 구독 카드 (Free/Pro)
  - [x] 설정 목록 (일일 목표, 알림, 언어)
  - [x] 연습 통계
  - [x] 로그아웃 버튼 (localStorage 초기화 + 로그인 화면 이동)

---

## Phase 2.5: 세부 페이지 및 인터랙션 ✅

### 완료된 작업

- [x] Mock 데이터 풍부화
  - [x] 홈 화면: 사용자 프로필 (지민), 실제적인 통계 데이터
  - [x] QuoteCard: 15개의 유명 음악가 명언
  - [x] 연습 화면: 5개 곡, 12개 연습 팁
  - [x] 녹음 화면: 8개 녹음 기록
  - [x] 계획 화면: 상세 연습 계획 및 AI 제안
  - [x] 프로필 화면: 사용자 통계

- [x] 공통 UI 컴포넌트
  - [x] Modal 컴포넌트 (바텀시트 스타일)
    - [x] 슬라이드 업 애니메이션
    - [x] 백드롭 블러 효과
    - [x] z-index 네비게이션 바 상위 처리

- [x] 연습 세션 화면 (`/practice`) 기능 강화
  - [x] 곡 선택 모달 (5개 곡 목록)
  - [x] 작동하는 타이머 (분:초 형식)
  - [x] 실시간 파형 애니메이션
  - [x] 시작/일시정지/종료 버튼 기능
  - [x] 연습 완료 모달 (커스텀 팝업)
    - [x] 연습 시간 표시
    - [x] 예상 점수 표시
    - [x] 분석 결과 보기 링크

- [x] 녹음 상세 화면 (`/recordings/[id]`)
  - [x] 동적 라우트 설정
  - [x] 녹음 정보 헤더 (곡명, 날짜, 시간)
  - [x] 파형 플레이어 UI (재생바)
  - [x] 통계 그리드 (점수, 정확도, 템포, 다이나믹)
  - [x] AI 분석 요약
  - [x] 집중 구간 상세 목록

- [x] 녹음 기록 화면 (`/recordings`) 기능 강화
  - [x] 녹음 카드 클릭 시 상세 페이지 이동
  - [x] 네비게이션 힌트 아이콘

- [x] AI 분석 화면 (`/analysis`)
  - [x] 홈 화면 "전체 분석" 링크 연결
  - [x] 현재 곡 정보 카드
  - [x] 통계 그리드 (평균 점수, 성장, 취약/강점 구간)
  - [x] 마디별 분석 그리드 (32마디)
  - [x] 집중 연습 구간 상세 목록
  - [x] AI 추천 연습 방법
  - [x] 최근 점수 추이 차트

- [x] 프로필/설정 화면 (`/profile`) 기능 강화
  - [x] 일일 목표 설정 모달 (15/30/45/60/90/120분)
  - [x] 알림 설정 모달 (켜기/끄기)
  - [x] 언어 설정 모달 (한국어/English/日本語/中文)
  - [x] Pro 업그레이드 모달
    - [x] 기능 목록
    - [x] 가격 표시 (₩9,900/월)

- [x] 연습 계획 화면 (`/plans`) 기능 강화
  - [x] 인터랙티브 체크박스 (클릭 시 완료 토글)
  - [x] 실시간 진행률 바
  - [x] 완료 시간/총 시간 표시

---

## Phase 3: 연습 타이머 핵심 기능 ⏳

### 예정된 작업

- [ ] Web Audio API 녹음 구현
  - [ ] MediaRecorder 설정
  - [ ] 오디오 스트림 처리
  - [ ] 파일 저장 (WebM/MP3)

- [ ] 소리 감지 알고리즘 (VAD)
  - [ ] AudioAnalyser 설정
  - [ ] dB 임계값 설정 (-50dB)
  - [ ] 연속 소리 감지 로직

- [ ] 순연습시간 측정
  - [ ] 소리 감지 시간 누적
  - [ ] 무음/대화 구간 제외
  - [ ] 실시간 타이머 업데이트

- [ ] 세션 저장
  - [ ] IndexedDB 로컬 저장
  - [ ] 오프라인 지원
  - [ ] 동기화 대기열

---

## Phase 4: 데이터 연동 및 분석 ⏳

### 예정된 작업

- [ ] Supabase 설정
  - [ ] 프로젝트 연결
  - [ ] 테이블 생성 (app_users, pieces, practice_sessions, etc.)
  - [ ] RLS 정책 설정

- [ ] 인증 구현
  - [ ] Apple 로그인
  - [ ] Google 로그인
  - [ ] 세션 관리

- [ ] 실제 데이터 연동
  - [ ] 사용자 프로필 저장/조회
  - [ ] 연습 세션 저장/조회
  - [ ] 통계 계산

- [ ] AI 분석 연동 (추후)
  - [ ] 분석 API 엔드포인트
  - [ ] 분석 결과 표시
  - [ ] 연습 추천 생성

---

## 파일 구조

```
Grit.on-app/
├── public/
│   ├── manifest.json
│   └── icons/
│       └── icon.svg
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── (app)/
│   │       ├── layout.tsx
│   │       ├── page.tsx              # 홈 화면
│   │       ├── practice/
│   │       │   └── page.tsx          # 연습 세션 (타이머, 곡선택)
│   │       ├── recordings/
│   │       │   ├── page.tsx          # 녹음 목록
│   │       │   └── [id]/
│   │       │       └── page.tsx      # 녹음 상세
│   │       ├── plans/
│   │       │   └── page.tsx          # 연습 계획
│   │       ├── analysis/
│   │       │   └── page.tsx          # AI 분석 리포트
│   │       └── profile/
│   │           └── page.tsx          # 프로필/설정
│   ├── components/
│   │   ├── app/
│   │   │   ├── app-shell.tsx         # 스플래시/로그인 래퍼
│   │   │   ├── bottom-navigation.tsx # 하단 네비게이션
│   │   │   ├── stats-card.tsx        # 통계 카드
│   │   │   ├── progress-ring.tsx     # 원형 진행 바
│   │   │   ├── quote-card.tsx        # 명언 카드
│   │   │   ├── daily-goal.tsx        # 일일 목표
│   │   │   └── index.ts
│   │   └── ui/
│   │       ├── button.tsx            # 버튼 컴포넌트
│   │       └── modal.tsx             # 바텀시트 모달
│   ├── lib/
│   │   └── utils.ts
│   └── sw.ts                         # Service Worker
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── README.md
├── PROGRESS.md
├── .env.example
└── .gitignore
```

---

## 참고 사항

- 현재 모든 데이터는 더미 데이터 (Mock Data)
- 실제 녹음/분석 기능은 Phase 3, 4에서 구현 예정
- 디자인은 기존 Grit.on 랜딩페이지의 AppMockup 기반
