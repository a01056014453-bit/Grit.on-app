"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Trophy,
  Flame,
  Play,
  Crown,
  Medal,
  Award,
} from "lucide-react";
import type { RankingUser } from "@/types";
import { INSTRUMENT_EMOJIS, INSTRUMENT_LABELS } from "@/types/ranking";
import { fetchTodayRankings, fetchMyRanking } from "@/lib/ranking-queries";
import { mockRankingUsers, currentUserRanking } from "@/data/mock-rankings";
import { getUserId } from "@/lib/user-id";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const ShinyText = dynamic(
  () => import("@/components/ui/shiny-text").then((mod) => mod.ShinyText),
  { ssr: false, loading: () => <span className="text-sm font-bold text-amber-700">...</span> }
);

// 시간을 HH:MM:SS 형식으로 포맷
function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

// ─── PodiumCard ─────────────────────────────────────────────
interface PodiumCardProps {
  user: RankingUser;
  elapsedSeconds: number;
}

function PodiumCard({ user, elapsedSeconds }: PodiumCardProps) {
  const displayTime = user.isPracticing
    ? user.netPracticeTime + elapsedSeconds
    : user.netPracticeTime;

  const isFirst = user.rank === 1;
  const isSecond = user.rank === 2;
  const isThird = user.rank === 3;

  const RankIconComponent = isFirst ? Crown : isSecond ? Medal : Award;

  const iconGradient = isFirst
    ? "from-yellow-400 to-amber-500"
    : isSecond
      ? "from-gray-300 to-gray-400"
      : "from-amber-500 to-amber-700";

  const cardShadow = isFirst
    ? "shadow-[0_0_24px_rgba(251,191,36,0.35)]"
    : isSecond
      ? "shadow-[0_0_16px_rgba(156,163,175,0.3)]"
      : "shadow-[0_0_16px_rgba(217,119,6,0.25)]";

  return (
    <div
      className={cn(
        "flex flex-col items-center bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 p-3",
        cardShadow,
        isFirst ? "w-[130px] pb-4" : "w-[110px]"
      )}
    >
      {/* Rank Icon */}
      <div
        className={cn(
          "rounded-full bg-gradient-to-br flex items-center justify-center mb-2",
          iconGradient,
          isFirst ? "w-10 h-10" : "w-8 h-8"
        )}
      >
        <RankIconComponent
          className={cn("text-white", isFirst ? "w-5 h-5" : "w-4 h-4")}
        />
      </div>

      {/* Instrument Emoji */}
      <span className={cn("mb-1", isFirst ? "text-3xl" : "text-2xl")}>
        {INSTRUMENT_EMOJIS[user.instrument]}
      </span>

      {/* Nickname */}
      <div className="flex items-center gap-1 mb-1">
        {user.isPracticing && (
          <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse shrink-0" />
        )}
        {isFirst ? (
          <ShinyText
            text={user.nickname}
            color="#d4a017"
            shineColor="#fde68a"
            speed={2}
            className="text-sm font-bold truncate max-w-[100px]"
          />
        ) : (
          <span className="text-xs font-semibold text-gray-800 truncate max-w-[80px]">
            {user.nickname}
          </span>
        )}
      </div>

      {/* Practice Time */}
      <span
        className={cn(
          "font-mono font-bold",
          isFirst ? "text-sm" : "text-xs",
          user.isPracticing ? "text-violet-600" : "text-gray-600"
        )}
      >
        {formatTime(displayTime)}
      </span>
    </div>
  );
}

// ─── PodiumSection ──────────────────────────────────────────
interface PodiumSectionProps {
  rankers: RankingUser[];
  elapsedSeconds: number;
}

function PodiumSection({ rankers, elapsedSeconds }: PodiumSectionProps) {
  return (
    <div className="flex items-end justify-center gap-3 mb-6">
      {/* 2nd Place */}
      {rankers[1] && (
        <div className="pt-6">
          <PodiumCard user={rankers[1]} elapsedSeconds={elapsedSeconds} />
        </div>
      )}

      {/* 1st Place — tallest */}
      {rankers[0] && (
        <div className="pb-4">
          <PodiumCard user={rankers[0]} elapsedSeconds={elapsedSeconds} />
        </div>
      )}

      {/* 3rd Place */}
      {rankers[2] && (
        <div className="pt-6">
          <PodiumCard user={rankers[2]} elapsedSeconds={elapsedSeconds} />
        </div>
      )}
    </div>
  );
}

// ─── MyStatusCard ───────────────────────────────────────────
interface MyStatusCardProps {
  user: RankingUser;
  totalUsers: number;
}

function MyStatusCard({ user, totalUsers }: MyStatusCardProps) {
  const percentile = Math.round((user.rank / totalUsers) * 100);
  const progressWidth = Math.max(5, 100 - percentile);

  return (
    <div className="bg-white/40 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] p-3.5 mb-5">
      {/* Top row */}
      <div className="flex items-center gap-3 mb-3">
        {/* Rank badge */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/25">
          <span className="text-sm font-extrabold text-white">{user.rank}</span>
        </div>

        {/* Name + instrument */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-sm text-gray-900 truncate">{user.nickname}</p>
            <span className="text-[9px] px-1.5 py-px rounded-full bg-violet-100 text-violet-600 font-semibold shrink-0">나</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-sm">{INSTRUMENT_EMOJIS[user.instrument]}</span>
            <span className="text-[11px] text-gray-400">{INSTRUMENT_LABELS[user.instrument]}</span>
          </div>
        </div>

        {/* Practice time */}
        <span className="font-mono text-base font-bold bg-gradient-to-r from-violet-700 to-violet-400 bg-clip-text text-transparent">
          {formatTime(user.netPracticeTime)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-violet-100/80 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-violet-400 rounded-full transition-all"
            style={{ width: `${progressWidth}%` }}
          />
        </div>
        <span className="text-[11px] font-semibold text-violet-500 shrink-0">
          상위 {percentile}%
        </span>
      </div>
    </div>
  );
}

// ─── LiveRankItem ───────────────────────────────────────────
interface LiveRankItemProps {
  user: RankingUser;
  elapsedSeconds: number;
}

function LiveRankItem({ user, elapsedSeconds }: LiveRankItemProps) {
  const displayTime = user.isPracticing
    ? user.netPracticeTime + elapsedSeconds
    : user.netPracticeTime;

  return (
    <div className="bg-white/50 backdrop-blur-xl rounded-[24px] border border-white/60 shadow-sm p-4 flex items-center gap-3">
      {/* Left: rank + emoji */}
      <span className="w-6 text-sm font-bold text-gray-400 text-center">
        {user.rank}
      </span>
      <span className="text-lg">{INSTRUMENT_EMOJIS[user.instrument]}</span>

      {/* Center: name + practicing status */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 text-sm truncate">
            {user.nickname}
          </span>
          {user.isPracticing && (
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse shrink-0" />
          )}
        </div>
        {user.isPracticing && user.currentSong && (
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {user.currentSong}
          </p>
        )}
      </div>

      {/* Right: time */}
      <span
        className={cn(
          "font-mono text-sm font-semibold",
          user.isPracticing ? "text-violet-600" : "text-gray-600"
        )}
      >
        {formatTime(displayTime)}
      </span>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export default function RankingPage() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [rankers, setRankers] = useState<RankingUser[]>([]);
  const [myRanking, setMyRanking] = useState<RankingUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Supabase에서 랭킹 데이터 조회 (빈 결과 시 mock fallback)
  const loadRankings = async () => {
    try {
      const [rankings, my] = await Promise.all([
        fetchTodayRankings(),
        fetchMyRanking(getUserId()),
      ]);
      if (rankings.length > 0) {
        setRankers(rankings);
        setMyRanking(my);
      } else {
        setRankers(mockRankingUsers);
        setMyRanking(currentUserRanking);
      }
      setElapsedSeconds(0);
    } catch (err) {
      console.error("Failed to load rankings:", err);
      setRankers(mockRankingUsers);
      setMyRanking(currentUserRanking);
    } finally {
      setIsLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    loadRankings();
  }, []);

  // 1초마다 타이머 업데이트
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  // 60초마다 Supabase 재조회
  useEffect(() => {
    const pollInterval = setInterval(() => {
      loadRankings();
    }, 60000);

    return () => clearInterval(pollInterval);
  }, []);

  const practicingCount = rankers.filter((r) => r.isPracticing).length;
  const totalUsers = rankers.length;

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-sm border border-white/50 flex items-center justify-center hover:bg-white/60 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1 text-left">
          <h1 className="text-lg font-bold text-gray-900">오늘의 랭킹</h1>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <Flame className="w-3 h-3 text-orange-500" />
            {practicingCount}명 실시간 연습 중
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Loading / Empty State */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-3 border-violet-300 border-t-violet-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">랭킹을 불러오는 중...</p>
        </div>
      ) : rankers.length === 0 ? (
        <div className="text-center py-12 bg-white/40 backdrop-blur-xl rounded-2xl border border-white/50 mb-6">
          <Trophy className="w-12 h-12 text-violet-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-700">아직 오늘의 랭킹 데이터가 없어요</p>
          <p className="text-sm text-gray-500 mt-1">연습을 시작하면 랭킹에 표시됩니다</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          <PodiumSection rankers={rankers} elapsedSeconds={elapsedSeconds} />

          {/* My Ranking Card */}
          {myRanking && (
            <MyStatusCard user={myRanking} totalUsers={totalUsers} />
          )}
        </>
      )}

      {/* Full Ranking List - 4위부터 */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">
          전체 순위
        </p>
        <div className="flex flex-col gap-2">
          {rankers.slice(3).map((user) => (
            <LiveRankItem
              key={user.id}
              user={user}
              elapsedSeconds={elapsedSeconds}
            />
          ))}
        </div>
      </div>

      {/* CTA - sticky: 스크롤 따라다님 */}
      <div className="sticky bottom-20 z-30 mt-6">
        <div className="bg-gradient-to-t from-white/80 via-white/40 to-transparent pt-4 pb-2">
          <Link
            href="/practice"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-violet-900 text-white font-bold shadow-lg shadow-violet-500/20 transition-transform active:scale-[0.98]"
          >
            <Play className="w-5 h-5 fill-white" />
            연습 시작하고 순위 올리기
          </Link>
        </div>
      </div>
    </div>
  );
}
