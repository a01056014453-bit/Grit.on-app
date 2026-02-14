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
import { mockRankingUsers, currentUserRanking } from "@/data/mock-rankings";
import type { RankingUser } from "@/types";
import {
  INSTRUMENT_EMOJIS,
  INSTRUMENT_LABELS,
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

// 순위 아이콘
function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
        <Crown className="w-4 h-4 text-white" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
        <Medal className="w-4 h-4 text-white" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
        <Award className="w-4 h-4 text-white" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
      <span className="text-sm font-bold text-gray-600">{rank}</span>
    </div>
  );
}

interface RankingRowProps {
  user: RankingUser;
  elapsedSeconds: number;
  isCurrentUser?: boolean;
}

function RankingRow({ user, elapsedSeconds, isCurrentUser }: RankingRowProps) {
  const gritLevel = getGritLevel(user.gritScore);
  const displayTime = user.isPracticing
    ? user.netPracticeTime + elapsedSeconds
    : user.netPracticeTime;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-xl border transition-all",
        isCurrentUser
          ? "bg-primary/5 border-primary/20"
          : "bg-white border-gray-100",
        user.isPracticing && "ring-2 ring-green-200"
      )}
    >
      {/* Rank */}
      <RankIcon rank={user.rank} />

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-lg">{INSTRUMENT_EMOJIS[user.instrument]}</span>
          <span className="font-semibold text-gray-900 truncate">
            {user.nickname}
            {isCurrentUser && (
              <span className="ml-1 text-xs text-primary">(나)</span>
            )}
          </span>
          {user.isPracticing && (
            <span className="flex items-center gap-0.5 text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              연습중
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {INSTRUMENT_LABELS[user.instrument]}
          </span>
          {/* Grit Gauge */}
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[80px]">
            <div
              className={cn("h-full transition-all", GRIT_LEVEL_COLORS[gritLevel])}
              style={{ width: `${user.gritScore}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400">{user.gritScore}%</span>
        </div>
      </div>

      {/* Practice Time */}
      <div className="text-right">
        <span
          className={cn(
            "font-mono text-lg font-bold",
            user.isPracticing ? "text-primary" : "text-gray-700"
          )}
        >
          {formatTime(displayTime)}
        </span>
      </div>
    </div>
  );
}

// 4위 이하 간단한 리스트 Row
function SimpleRankingRow({ user, elapsedSeconds }: { user: RankingUser; elapsedSeconds: number }) {
  const displayTime = user.isPracticing
    ? user.netPracticeTime + elapsedSeconds
    : user.netPracticeTime;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-b-0">
      {/* Rank */}
      <span className="w-6 text-sm font-bold text-gray-400 text-center">{user.rank}</span>

      {/* Instrument Emoji */}
      <span className="text-lg">{INSTRUMENT_EMOJIS[user.instrument]}</span>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 text-sm truncate">
            {user.nickname}
          </span>
          {user.isPracticing && (
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
          )}
        </div>
        {user.isPracticing && user.currentSong && (
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {user.currentSong}
          </p>
        )}
      </div>

      {/* Practice Time */}
      <span
        className={cn(
          "font-mono text-sm font-semibold",
          user.isPracticing ? "text-primary" : "text-gray-600"
        )}
      >
        {formatTime(displayTime)}
      </span>
    </div>
  );
}

export default function RankingPage() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [rankers, setRankers] = useState<RankingUser[]>(mockRankingUsers);

  // 1초마다 타이머 업데이트
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  // 1분마다 데이터 갱신 (mock에서는 동일한 데이터)
  useEffect(() => {
    const pollInterval = setInterval(() => {
      setRankers([...mockRankingUsers]);
      setElapsedSeconds(0);
    }, 60000);

    return () => clearInterval(pollInterval);
  }, []);

  const practicingCount = rankers.filter((r) => r.isPracticing).length;
  const myRank = currentUserRanking.rank;

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            오늘의 랭킹
          </h1>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Flame className="w-3 h-3 text-orange-500" />
            {practicingCount}명 실시간 연습 중
          </p>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="bg-gradient-to-br from-violet-50 to-amber-50 rounded-2xl p-4 mb-6">
        <div className="flex items-end justify-center gap-2 h-36">
          {/* 2nd Place */}
          {rankers[1] && (
            <div className="flex flex-col items-center">
              <span className="text-2xl mb-1">
                {INSTRUMENT_EMOJIS[rankers[1].instrument]}
              </span>
              <p className="text-xs font-medium text-gray-700 truncate max-w-[70px]">
                {rankers[1].nickname}
              </p>
              <p
                className={cn(
                  "text-xs font-mono font-bold mt-0.5",
                  rankers[1].isPracticing ? "text-primary" : "text-gray-600"
                )}
              >
                {formatTime(
                  rankers[1].isPracticing
                    ? rankers[1].netPracticeTime + elapsedSeconds
                    : rankers[1].netPracticeTime
                )}
              </p>
              <div className="w-16 h-16 bg-gradient-to-t from-gray-300 to-gray-400 rounded-t-lg mt-2 flex items-center justify-center">
                <span className="text-white font-bold text-lg">2</span>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {rankers[0] && (
            <div className="flex flex-col items-center -mb-4">
              <Crown className="w-6 h-6 text-yellow-500 mb-1" />
              <span className="text-3xl mb-1">
                {INSTRUMENT_EMOJIS[rankers[0].instrument]}
              </span>
              <p className="text-sm font-bold text-gray-900 truncate max-w-[80px]">
                {rankers[0].nickname}
              </p>
              <p
                className={cn(
                  "text-sm font-mono font-bold mt-0.5",
                  rankers[0].isPracticing ? "text-primary" : "text-gray-700"
                )}
              >
                {formatTime(
                  rankers[0].isPracticing
                    ? rankers[0].netPracticeTime + elapsedSeconds
                    : rankers[0].netPracticeTime
                )}
              </p>
              <div className="w-20 h-24 bg-gradient-to-t from-yellow-400 to-amber-500 rounded-t-lg mt-2 flex items-center justify-center">
                <span className="text-white font-bold text-xl">1</span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {rankers[2] && (
            <div className="flex flex-col items-center">
              <span className="text-2xl mb-1">
                {INSTRUMENT_EMOJIS[rankers[2].instrument]}
              </span>
              <p className="text-xs font-medium text-gray-700 truncate max-w-[70px]">
                {rankers[2].nickname}
              </p>
              <p
                className={cn(
                  "text-xs font-mono font-bold mt-0.5",
                  rankers[2].isPracticing ? "text-primary" : "text-gray-600"
                )}
              >
                {formatTime(
                  rankers[2].isPracticing
                    ? rankers[2].netPracticeTime + elapsedSeconds
                    : rankers[2].netPracticeTime
                )}
              </p>
              <div className="w-16 h-12 bg-gradient-to-t from-amber-500 to-amber-600 rounded-t-lg mt-2 flex items-center justify-center">
                <span className="text-white font-bold text-lg">3</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* My Ranking Card */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">내 순위</p>
        <RankingRow
          user={currentUserRanking}
          elapsedSeconds={0}
          isCurrentUser
        />
      </div>

      {/* Full Ranking List - 4위부터 */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">
          전체 순위 ({rankers.length}명)
        </p>
        <div className="bg-white rounded-xl border border-gray-100 px-3">
          {rankers.slice(3).map((user) => (
            <SimpleRankingRow
              key={user.id}
              user={user}
              elapsedSeconds={elapsedSeconds}
            />
          ))}
        </div>
      </div>

      {/* Floating CTA */}
      <div className="fixed bottom-20 left-0 right-0 px-4 max-w-lg mx-auto">
        <Link
          href="/practice"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-violet-900 text-white font-bold shadow-lg shadow-violet-500/20 transition-transform active:scale-[0.98]"
        >
          <Play className="w-5 h-5 fill-white" />
          연습 시작하고 순위 올리기
        </Link>
      </div>
    </div>
  );
}
