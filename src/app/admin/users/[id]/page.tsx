'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Music, Clock, Trophy, Flame } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartCard } from '@/components/admin/chart-card';
import { StatusBadge } from '@/components/admin/status-badge';
import { getUserDetail } from '@/lib/admin/queries';

interface UserDetailData {
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
  currentPiece: string | null;
  dailyGoal: number | null;
  weeklyGoal: number | null;
  practiceSessionCount: number;
  rankingHistory: { date: string; rank: number; gritScore: number }[];
}

export default function UserDetailPage() {
  const params = useParams();
  const [user, setUser] = useState<UserDetailData | null>(null);

  useEffect(() => {
    if (params.id) {
      getUserDetail(params.id as string).then((data) => {
        if (data) setUser(data as unknown as UserDetailData);
      });
    }
  }, [params.id]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">사용자 상세</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center text-violet-600 text-xl font-bold">
              {user.nickname.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{user.nickname}</h2>
              {user.name && <p className="text-sm text-gray-500">{user.name}</p>}
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge label={user.instrument} variant="purple" />
                {user.level && <StatusBadge label={user.level} variant="info" />}
                <StatusBadge
                  label={user.subscription === 'free' ? '무료' : user.subscription === 'premium' ? '프리미엄' : '프로'}
                  variant={user.subscription === 'free' ? 'neutral' : 'purple'}
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400">가입일: {new Date(user.createdAt).toLocaleDateString('ko-KR')}</p>
        </div>

        <div className="grid grid-cols-5 gap-4 mt-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Trophy className="w-5 h-5 text-violet-500 mx-auto mb-1" />
            <p className="text-xs text-gray-500">그릿 점수</p>
            <p className="font-number text-lg font-bold text-gray-900">{user.gritScore?.toLocaleString() ?? '-'}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-xs text-gray-500">총 연습</p>
            <p className="font-number text-lg font-bold text-gray-900">{user.totalPracticeHours?.toFixed(1) ?? '0'}h</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-xs text-gray-500">연속일</p>
            <p className="font-number text-lg font-bold text-gray-900">{user.streakDays ?? 0}일</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Music className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-xs text-gray-500">현재 곡</p>
            <p className="text-sm font-medium text-gray-900 truncate">{user.currentPiece ?? '-'}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Clock className="w-5 h-5 text-gray-500 mx-auto mb-1" />
            <p className="text-xs text-gray-500">세션 수</p>
            <p className="font-number text-lg font-bold text-gray-900">{user.practiceSessionCount}</p>
          </div>
        </div>
      </div>

      {user.rankingHistory.length > 0 && (
        <ChartCard title="랭킹 히스토리" description="최근 30일">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={user.rankingHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis reversed tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip />
                <Line type="monotone" dataKey="rank" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">목표 설정</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">일일 목표</span>
              <span className="font-number font-medium">{user.dailyGoal ? `${user.dailyGoal}분` : '미설정'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">주간 목표</span>
              <span className="font-number font-medium">{user.weeklyGoal ? `${user.weeklyGoal}분` : '미설정'}</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">계정 정보</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">마지막 접속</span>
              <span>{user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString('ko-KR') : '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ID</span>
              <span className="text-xs text-gray-400 font-mono">{user.id.slice(0, 8)}...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
