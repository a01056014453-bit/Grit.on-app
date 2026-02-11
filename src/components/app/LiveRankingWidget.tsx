"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Trophy, ChevronRight, Flame, Play } from "lucide-react";
import { getTopRankers, currentUserRanking } from "@/data/mock-rankings";
import type { RankingUser } from "@/types";
import {
  INSTRUMENT_EMOJIS,
  getGritLevel,
  GRIT_LEVEL_COLORS,
} from "@/types/ranking";
import { cn } from "@/lib/utils";

// 시간을 HH:MM:SS 형식으로 포맷
function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

// 순위 메달 색상
function getRankColor(rank: number): string {
  if (rank === 1) return "bg-yellow-500 text-white";
  if (rank === 2) return "bg-gray-400 text-white";
  if (rank === 3) return "bg-amber-600 text-white";
  return "bg-gray-200 text-gray-600";
}

interface RankerCardProps {
  user: RankingUser;
  elapsedSeconds: number;
}

function RankerCard({ user, elapsedSeconds }: RankerCardProps) {
  const gritLevel = getGritLevel(user.gritScore);
  const displayTime = user.isPracticing
    ? user.netPracticeTime + elapsedSeconds
    : user.netPracticeTime;

  return (
    <div className="shrink-0 w-32 bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
      {/* Rank Badge */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={cn(
            "w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center",
            getRankColor(user.rank)
          )}
        >
          {user.rank}
        </span>
        {user.isPracticing && (
          <span className="flex items-center gap-0.5 text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            연습중
          </span>
        )}
      </div>

      {/* User Info */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-lg">{INSTRUMENT_EMOJIS[user.instrument]}</span>
        <span className="text-sm font-medium text-gray-900 truncate">
          {user.nickname}
        </span>
      </div>

      {/* Practice Time */}
      <div className="text-center mb-2">
        <span
          className={cn(
            "font-mono text-base font-bold",
            user.isPracticing ? "text-primary" : "text-gray-700"
          )}
        >
          {formatTime(displayTime)}
        </span>
      </div>

      {/* Grit Gauge */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-300", GRIT_LEVEL_COLORS[gritLevel])}
          style={{ width: `${user.gritScore}%` }}
        />
      </div>
    </div>
  );
}

export function LiveRankingWidget() {
  const [rankers, setRankers] = useState<RankingUser[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState(Date.now());

  // 데이터 가져오기
  const fetchRankers = useCallback(() => {
    const topRankers = getTopRankers(5);
    setRankers(topRankers);
    setLastFetchTime(Date.now());
    setElapsedSeconds(0);
  }, []);

  // 초기 데이터 로드 및 1분마다 폴링
  useEffect(() => {
    fetchRankers();

    const pollInterval = setInterval(() => {
      fetchRankers();
    }, 60000); // 1분마다 갱신

    return () => clearInterval(pollInterval);
  }, [fetchRankers]);

  // 1초마다 타이머 업데이트 (연습 중인 유저들의 시간 증가)
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  const practicingCount = rankers.filter((r) => r.isPracticing).length;

  return (
    <div className="bg-gradient-to-br from-violet-50 to-primary/5 rounded-2xl border border-violet-100 overflow-hidden">
      {/* Header */}
      <Link
        href="/ranking"
        className="flex items-center justify-between px-4 py-3 border-b border-violet-100"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">오늘의 랭킹</h3>
            <p className="text-[10px] text-gray-500">
              <Flame className="w-3 h-3 inline text-orange-500" />
              {" "}{practicingCount}명 연습 중
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          전체보기
          <ChevronRight className="w-4 h-4" />
        </div>
      </Link>

      {/* Rankers Carousel */}
      <div className="px-4 py-3">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {rankers.map((user) => (
            <RankerCard
              key={user.id}
              user={user}
              elapsedSeconds={elapsedSeconds}
            />
          ))}
        </div>
      </div>

      {/* My Ranking & CTA */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between bg-white/80 rounded-xl p-3 mb-3">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center",
                getRankColor(currentUserRanking.rank)
              )}
            >
              {currentUserRanking.rank}
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900">내 순위</p>
              <p className="text-xs text-gray-500">
                {formatTime(currentUserRanking.netPracticeTime)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">1위까지</p>
            <p className="text-sm font-bold text-primary">
              {formatTime(
                rankers[0]
                  ? rankers[0].netPracticeTime +
                      (rankers[0].isPracticing ? elapsedSeconds : 0) -
                      currentUserRanking.netPracticeTime
                  : 0
              )}
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <Link
          href="/practice"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-violet-900 text-white font-semibold text-sm transition-transform active:scale-[0.98]"
        >
          <Play className="w-4 h-4 fill-white" />
          지금 연습 시작하고 랭커 도전하기
        </Link>
      </div>
    </div>
  );
}
