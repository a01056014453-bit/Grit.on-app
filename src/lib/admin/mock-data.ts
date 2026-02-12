import type {
  WAUTrend,
  AIModelStats,
  ExpertVerification,
  UnregisteredSearch,
  RevenueData,
  Promotion,
  CopyrightItem,
  SupportTicket,
  FAQ,
  SecurityLog,
  BackupRecord,
  MarketingCampaign,
  ReferralCode,
} from './types';

// 1. 대시보드 - WAU 추이
export const mockWAUTrend: WAUTrend[] = [
  { week: '1월 1주', users: 342 },
  { week: '1월 2주', users: 389 },
  { week: '1월 3주', users: 421 },
  { week: '1월 4주', users: 458 },
  { week: '2월 1주', users: 512 },
  { week: '2월 2주', users: 548 },
  { week: '2월 3주', users: 601 },
  { week: '2월 4주', users: 634 },
];

// 1. 대시보드 - AI 모델 통계
export const mockAIModelStats: AIModelStats[] = [
  { model: 'Claude Sonnet 4.5', requests: 12450, avgLatency: 2.3, successRate: 99.2, cost: 1250.0 },
  { model: 'GPT-4o', requests: 8320, avgLatency: 1.8, successRate: 98.7, cost: 980.0 },
  { model: 'Claude Haiku 3.5', requests: 34200, avgLatency: 0.6, successRate: 99.8, cost: 420.0 },
];

// 2. 전문가 검증 - OCR/서류
export const mockExpertVerifications: ExpertVerification[] = [
  {
    id: 'ev-1',
    teacherName: '김서연',
    submittedAt: '2025-02-10T09:30:00',
    status: 'pending',
    specialty: ['피아노', '쇼팽 전문'],
    documents: [
      { type: '학위증', url: '/docs/degree-1.jpg', ocrResult: '서울대학교 음악대학 피아노과 졸업 | 2018년 2월' },
      { type: '경력증명서', url: '/docs/career-1.jpg', ocrResult: '예원학교 피아노 강사 | 2019.03 - 현재' },
    ],
    rating: null,
    completedCount: 0,
  },
  {
    id: 'ev-2',
    teacherName: '박지훈',
    submittedAt: '2025-02-09T14:20:00',
    status: 'review',
    specialty: ['바이올린', '실내악'],
    documents: [
      { type: '학위증', url: '/docs/degree-2.jpg', ocrResult: '한국예술종합학교 음악원 바이올린 전공 | 2020년 2월' },
    ],
    rating: null,
    completedCount: 0,
  },
  {
    id: 'ev-3',
    teacherName: '이하늘',
    submittedAt: '2025-02-08T11:00:00',
    status: 'approved',
    specialty: ['피아노', '리스트 전문', '콩쿨 지도'],
    documents: [
      { type: '학위증', url: '/docs/degree-3.jpg', ocrResult: '연세대학교 음악대학 피아노과 석사 | 2016년 8월' },
      { type: '수상경력', url: '/docs/award-3.jpg', ocrResult: '부산국제피아노콩쿠르 2위 | 2015년' },
    ],
    rating: 4.8,
    completedCount: 47,
  },
  {
    id: 'ev-4',
    teacherName: '정민수',
    submittedAt: '2025-02-07T16:45:00',
    status: 'rejected',
    specialty: ['첼로'],
    documents: [
      { type: '학위증', url: '/docs/degree-4.jpg', ocrResult: 'OCR 인식 실패 - 이미지 불량' },
    ],
    rating: null,
    completedCount: 0,
  },
];

// 4. 곡 DB - 미등록 곡 검색 로그
export const mockUnregisteredSearches: UnregisteredSearch[] = [
  { query: '리스트 라 캄파넬라', count: 87, lastSearchedAt: '2025-02-12T08:00:00' },
  { query: '드뷔시 달빛', count: 64, lastSearchedAt: '2025-02-12T07:30:00' },
  { query: '라흐마니노프 피아노 협주곡 2번', count: 52, lastSearchedAt: '2025-02-11T22:00:00' },
  { query: '슈만 어린이의 정경', count: 45, lastSearchedAt: '2025-02-11T20:00:00' },
  { query: '바흐 골드베르크 변주곡', count: 38, lastSearchedAt: '2025-02-11T19:00:00' },
  { query: '프로코피예프 소나타 7번', count: 31, lastSearchedAt: '2025-02-11T18:00:00' },
  { query: '스크리아빈 에튀드 Op.8', count: 27, lastSearchedAt: '2025-02-11T17:00:00' },
  { query: '그리그 피아노 협주곡', count: 24, lastSearchedAt: '2025-02-11T16:00:00' },
];

// 5. 랭킹/경제 - 수익 데이터
export const mockRevenueData: RevenueData[] = [
  { month: '2024.09', revenue: 3200000, subscriptions: 180, credits: 4500 },
  { month: '2024.10', revenue: 3800000, subscriptions: 210, credits: 5200 },
  { month: '2024.11', revenue: 4500000, subscriptions: 245, credits: 6100 },
  { month: '2024.12', revenue: 5100000, subscriptions: 278, credits: 6800 },
  { month: '2025.01', revenue: 5800000, subscriptions: 312, credits: 7500 },
  { month: '2025.02', revenue: 6200000, subscriptions: 340, credits: 8100 },
];

// 5. 프로모션
export const mockPromotions: Promotion[] = [
  { id: 'p-1', name: '신규 가입 30% 할인', type: 'discount', status: 'active', startDate: '2025-01-01', endDate: '2025-03-31', usageCount: 234 },
  { id: 'p-2', name: '프리미엄 7일 체험', type: 'trial', status: 'active', startDate: '2025-02-01', endDate: '2025-02-28', usageCount: 89 },
  { id: 'p-3', name: '설날 이벤트 크레딧', type: 'credit', status: 'expired', startDate: '2025-01-25', endDate: '2025-01-31', usageCount: 567 },
  { id: 'p-4', name: '봄학기 프로모션', type: 'discount', status: 'scheduled', startDate: '2025-03-01', endDate: '2025-03-31', usageCount: 0 },
];

// 6. 저작권
export const mockCopyrightItems: CopyrightItem[] = [
  { id: 'c-1', contentType: 'recording', title: '쇼팽 발라드 1번 연습', uploaderName: '김연습', uploadedAt: '2025-02-12T10:00:00', flagStatus: 'clean', matchRate: null, matchedWork: null },
  { id: 'c-2', contentType: 'video', title: '리스트 메피스토 왈츠 1악장', uploaderName: '이연주', uploadedAt: '2025-02-11T15:30:00', flagStatus: 'flagged', matchRate: 92, matchedWork: 'Universal Music - 기성 녹음본' },
  { id: 'c-3', contentType: 'recording', title: '베토벤 소나타 14번 3악장', uploaderName: '박피아노', uploadedAt: '2025-02-11T12:00:00', flagStatus: 'reviewing', matchRate: 78, matchedWork: 'Sony Classical - 백건우 연주' },
  { id: 'c-4', contentType: 'video', title: '드뷔시 아라베스크 1번', uploaderName: '최음악', uploadedAt: '2025-02-10T09:00:00', flagStatus: 'clean', matchRate: 12, matchedWork: null },
  { id: 'c-5', contentType: 'recording', title: '라흐마니노프 전주곡 Op.23-5', uploaderName: '정클래식', uploadedAt: '2025-02-10T08:00:00', flagStatus: 'removed', matchRate: 97, matchedWork: 'DG - 아르헤리치 연주' },
];

// 7. CS - 지원 티켓
export const mockSupportTickets: SupportTicket[] = [
  { id: 'st-1', userId: 'u-1', userName: '김연습', category: 'bug', subject: '타이머가 백그라운드에서 멈춤', status: 'open', priority: 'high', createdAt: '2025-02-12T09:00:00', updatedAt: '2025-02-12T09:00:00' },
  { id: 'st-2', userId: 'u-2', userName: '이연주', category: 'payment', subject: '크레딧 결제 실패', status: 'in_progress', priority: 'urgent', createdAt: '2025-02-11T20:00:00', updatedAt: '2025-02-12T08:30:00' },
  { id: 'st-3', userId: 'u-3', userName: '박피아노', category: 'feature', subject: '듀엣 연습 모드 요청', status: 'open', priority: 'low', createdAt: '2025-02-11T15:00:00', updatedAt: '2025-02-11T15:00:00' },
  { id: 'st-4', userId: 'u-4', userName: '최음악', category: 'account', subject: '프로필 변경 안됨', status: 'resolved', priority: 'medium', createdAt: '2025-02-10T10:00:00', updatedAt: '2025-02-11T14:00:00' },
  { id: 'st-5', userId: 'u-5', userName: '정클래식', category: 'bug', subject: 'AI 분석 결과 로딩 무한', status: 'in_progress', priority: 'high', createdAt: '2025-02-10T08:00:00', updatedAt: '2025-02-11T11:00:00' },
  { id: 'st-6', userId: 'u-6', userName: '한음대', category: 'other', subject: '학교 인증 문의', status: 'closed', priority: 'medium', createdAt: '2025-02-09T12:00:00', updatedAt: '2025-02-10T09:00:00' },
];

// 7. FAQ
export const mockFAQs: FAQ[] = [
  { id: 'f-1', category: '계정', question: '비밀번호를 잊어버렸어요', answer: '로그인 화면에서 "비밀번호 찾기"를 탭하면 이메일로 재설정 링크가 발송됩니다.', views: 1234, isPublished: true },
  { id: 'f-2', category: '연습', question: '연습 시간이 정확하지 않아요', answer: '앱이 백그라운드로 전환되면 타이머가 일시정지됩니다. 정확한 기록을 위해 앱을 포그라운드에서 사용해주세요.', views: 987, isPublished: true },
  { id: 'f-3', category: '결제', question: '구독을 해지하고 싶어요', answer: '설정 > 구독 관리에서 해지할 수 있습니다. 해지 후에도 결제 기간까지 서비스를 이용할 수 있습니다.', views: 876, isPublished: true },
  { id: 'f-4', category: 'AI', question: 'AI 분석이 정확하지 않아요', answer: '녹음 환경에 따라 분석 정확도가 달라질 수 있습니다. 조용한 환경에서 마이크 가까이 녹음해주세요.', views: 654, isPublished: true },
  { id: 'f-5', category: '전문가', question: '전문가 피드백은 얼마나 걸리나요?', answer: '전문가가 요청을 수락한 후 평균 24-48시간 내에 피드백이 전달됩니다.', views: 543, isPublished: true },
];

// 8. 보안 - 로그
export const mockSecurityLogs: SecurityLog[] = [
  { id: 'sl-1', event: '관리자 로그인 성공', userId: 'admin-1', ip: '211.234.56.78', timestamp: '2025-02-12T09:00:00', severity: 'info', details: '2FA 인증 완료' },
  { id: 'sl-2', event: '비정상 로그인 시도', userId: 'u-unknown', ip: '45.33.12.99', timestamp: '2025-02-12T03:24:00', severity: 'warning', details: '5회 연속 로그인 실패 - IP 차단' },
  { id: 'sl-3', event: 'API Rate Limit 초과', userId: null, ip: '103.22.45.67', timestamp: '2025-02-11T22:15:00', severity: 'warning', details: '1분 내 500회 요청 감지' },
  { id: 'sl-4', event: 'SQL Injection 시도 감지', userId: null, ip: '185.220.101.34', timestamp: '2025-02-11T18:42:00', severity: 'critical', details: 'WAF에서 차단됨 - /api/search 엔드포인트' },
  { id: 'sl-5', event: 'DB 백업 완료', userId: 'system', ip: '10.0.0.1', timestamp: '2025-02-11T04:00:00', severity: 'info', details: '전체 백업 3.2GB - S3 업로드 완료' },
  { id: 'sl-6', event: '비정상 데이터 접근', userId: 'u-123', ip: '121.134.56.78', timestamp: '2025-02-10T16:30:00', severity: 'critical', details: '타 사용자 프로필 대량 조회 시도' },
];

// 8. 백업
export const mockBackupRecords: BackupRecord[] = [
  { id: 'b-1', type: 'full', status: 'completed', size: '3.2 GB', createdAt: '2025-02-12T04:00:00', duration: '12분 34초' },
  { id: 'b-2', type: 'incremental', status: 'completed', size: '245 MB', createdAt: '2025-02-11T16:00:00', duration: '2분 18초' },
  { id: 'b-3', type: 'incremental', status: 'completed', size: '312 MB', createdAt: '2025-02-11T04:00:00', duration: '3분 05초' },
  { id: 'b-4', type: 'full', status: 'completed', size: '3.1 GB', createdAt: '2025-02-10T04:00:00', duration: '11분 52초' },
  { id: 'b-5', type: 'incremental', status: 'failed', size: '0 MB', createdAt: '2025-02-09T16:00:00', duration: '-' },
];

// 9. 마케팅 캠페인
export const mockMarketingCampaigns: MarketingCampaign[] = [
  { id: 'm-1', name: '인스타그램 광고 - 피아노', channel: 'utm', status: 'active', impressions: 125000, clicks: 3200, conversions: 245, startDate: '2025-02-01', endDate: '2025-02-28' },
  { id: 'm-2', name: '유튜브 프리롤 광고', channel: 'utm', status: 'active', impressions: 89000, clicks: 2100, conversions: 178, startDate: '2025-02-01', endDate: '2025-02-28' },
  { id: 'm-3', name: '추천인 프로그램', channel: 'referral', status: 'active', impressions: 0, clicks: 0, conversions: 567, startDate: '2025-01-01', endDate: null },
  { id: 'm-4', name: '겨울방학 이벤트 푸시', channel: 'push', status: 'completed', impressions: 15000, clicks: 4500, conversions: 890, startDate: '2025-01-15', endDate: '2025-02-05' },
  { id: 'm-5', name: '뉴스레터 2월호', channel: 'email', status: 'active', impressions: 8900, clicks: 1200, conversions: 89, startDate: '2025-02-10', endDate: '2025-02-10' },
];

// 9. 추천 코드
export const mockReferralCodes: ReferralCode[] = [
  { code: 'PIANO2025', ownerId: 'u-10', ownerName: '김피아노', usageCount: 45, conversionCount: 32, createdAt: '2025-01-15', isActive: true },
  { code: 'GRITON', ownerId: 'u-11', ownerName: '이그릿', usageCount: 128, conversionCount: 89, createdAt: '2025-01-01', isActive: true },
  { code: 'MUSIC123', ownerId: 'u-12', ownerName: '박음악', usageCount: 23, conversionCount: 15, createdAt: '2025-02-01', isActive: true },
  { code: 'CLASSIC', ownerId: 'u-13', ownerName: '최클래식', usageCount: 67, conversionCount: 41, createdAt: '2024-12-15', isActive: false },
];
