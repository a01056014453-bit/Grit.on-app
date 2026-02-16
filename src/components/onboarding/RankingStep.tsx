"use client";

import { motion, type Variants } from "framer-motion";
import { ChevronRight, Trophy } from "lucide-react";

interface RankingStepProps {
  onNext: () => void;
}

const mockRanking = [
  { rank: 1, name: "박지현", instrument: "바이올린", time: "4h 32m", badge: "gold", practicing: false },
  { rank: 2, name: "김민수", instrument: "첼로", time: "3h 48m", badge: "silver", practicing: true },
  { rank: 3, name: "이서연", instrument: "피아노", time: "3h 15m", badge: "bronze", practicing: false },
  { rank: 4, name: "정우진", instrument: "플루트", time: "2h 52m", badge: "", practicing: true },
  { rank: 5, name: "최예린", instrument: "클라리넷", time: "2h 30m", badge: "", practicing: false },
];

const badgeColors: Record<string, string> = {
  gold: "from-yellow-400 to-amber-500",
  silver: "from-gray-300 to-gray-400",
  bronze: "from-amber-600 to-orange-700",
};

const listContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.5,
    },
  },
};

const listItem: Variants = {
  hidden: { opacity: 0, x: 40 },
  show: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", damping: 25, stiffness: 250 },
  },
};

export function RankingStep({ onNext }: RankingStepProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-2"
      >
        <h2 className="text-lg font-bold text-white flex items-center gap-2 justify-center">
          <Trophy className="w-5 h-5 text-violet-400" />
          증명된 노력
        </h2>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-violet-300/70 text-sm mb-6 leading-relaxed"
      >
        당신의 진짜 연습 시간은 랭킹에 반영되어
        <br />전 세계 연주자들과 공유됩니다.
      </motion.p>

      {/* Ranking list */}
      <motion.div
        variants={listContainer}
        initial="hidden"
        animate="show"
        className="w-full max-w-sm space-y-2.5 mb-6"
      >
        {mockRanking.map((user) => (
          <motion.div
            key={user.rank}
            variants={listItem}
            className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl px-4 py-3 flex items-center gap-3"
          >
            {/* Rank badge */}
            <div className="w-8 flex-shrink-0 flex items-center justify-center">
              {user.badge ? (
                <div
                  className={`w-7 h-7 rounded-full bg-gradient-to-br ${badgeColors[user.badge]} flex items-center justify-center shadow-lg`}
                >
                  <span className="text-xs font-bold text-white">
                    {user.rank}
                  </span>
                </div>
              ) : (
                <span className="text-sm font-bold text-violet-300/50">
                  {user.rank}
                </span>
              )}
            </div>

            {/* User info */}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-semibold">
                  {user.name}
                </span>
                {user.practicing && (
                  <motion.div
                    className="w-2 h-2 rounded-full bg-violet-500"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [1, 0.5, 1],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </div>
              <span className="text-violet-300/50 text-xs">
                {user.instrument}
              </span>
            </div>

            {/* Practice time */}
            <span className="text-violet-300 text-sm font-number font-semibold">
              {user.time}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* Motivational text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="text-violet-400 text-sm font-medium mb-6"
      >
        나도 순위에 올라가기
      </motion.p>

      {/* Next button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        onClick={onNext}
        className="bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-2xl px-8 py-3 flex items-center gap-2 transition-colors active:scale-[0.97]"
      >
        다음
        <ChevronRight className="w-4 h-4" />
      </motion.button>
    </div>
  );
}
