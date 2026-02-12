// 관리자 대시보드 전용 타입 정의

export interface DashboardStats {
  totalUsers: number;
  activeUsersToday: number;
  weeklyActiveUsers: number;
  totalPracticeSessions: number;
  avgDailyPracticeMinutes: number;
  totalSongAnalyses: number;
  totalTeachers: number;
  pendingVerifications: number;
}

export interface WAUTrend {
  week: string;
  users: number;
}

export interface AIModelStats {
  model: string;
  requests: number;
  avgLatency: number;
  successRate: number;
  cost: number;
}

export interface ExpertVerification {
  id: string;
  teacherName: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'review';
  specialty: string[];
  documents: { type: string; url: string; ocrResult?: string }[];
  rating: number | null;
  completedCount: number;
}

export interface AdminUser {
  id: string;
  nickname: string;
  name: string | null;
  instrument: string;
  level: string | null;
  gritScore: number | null;
  totalPracticeHours: number | null;
  streakDays: number | null;
  createdAt: string;
  lastActiveAt: string | null;
  subscription: 'free' | 'premium' | 'pro';
  pushEnabled: boolean;
}

export interface UserDetail extends AdminUser {
  currentPiece: string | null;
  dailyGoal: number | null;
  weeklyGoal: number | null;
  practiceSessionCount: number;
  rankingHistory: { date: string; rank: number; gritScore: number }[];
}

export interface MusicDBItem {
  id: string;
  title: string;
  composer: string;
  key: string | null;
  opus: string | null;
  analysisStatus: 'completed' | 'pending' | 'failed';
  difficulty: string | null;
  practiceCount: number;
  createdAt: string;
}

export interface UnregisteredSearch {
  query: string;
  count: number;
  lastSearchedAt: string;
}

export interface RankingEntry {
  rank: number;
  userId: string;
  nickname: string;
  gritScore: number;
  practiceMinutes: number;
  streak: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  subscriptions: number;
  credits: number;
}

export interface Promotion {
  id: string;
  name: string;
  type: 'discount' | 'trial' | 'credit';
  status: 'active' | 'scheduled' | 'expired';
  startDate: string;
  endDate: string;
  usageCount: number;
}

export interface CopyrightItem {
  id: string;
  contentType: 'recording' | 'video';
  title: string;
  uploaderName: string;
  uploadedAt: string;
  flagStatus: 'clean' | 'flagged' | 'reviewing' | 'removed';
  matchRate: number | null;
  matchedWork: string | null;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  category: 'bug' | 'account' | 'payment' | 'feature' | 'other';
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
}

export interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  views: number;
  isPublished: boolean;
}

export interface SecurityLog {
  id: string;
  event: string;
  userId: string | null;
  ip: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
  details: string;
}

export interface BackupRecord {
  id: string;
  type: 'full' | 'incremental';
  status: 'completed' | 'in_progress' | 'failed';
  size: string;
  createdAt: string;
  duration: string;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  channel: 'utm' | 'referral' | 'push' | 'email';
  status: 'active' | 'paused' | 'completed';
  impressions: number;
  clicks: number;
  conversions: number;
  startDate: string;
  endDate: string | null;
}

export interface ReferralCode {
  code: string;
  ownerId: string;
  ownerName: string;
  usageCount: number;
  conversionCount: number;
  createdAt: string;
  isActive: boolean;
}

export type AdminNavItem = {
  label: string;
  href: string;
  icon: string;
  badge?: number;
};
