"use client";

import { motion, type Variants } from "framer-motion";
import { GraduationCap, User, BarChart3, MessageSquare, Activity } from "lucide-react";
import { StarBorder } from "@/components/ui/star-border";

interface CoachingStepProps {
  onComplete: () => void;
}

const featureCards = [
  {
    icon: BarChart3,
    title: "AI 분석 리포트",
    desc: "연습 데이터를 기반으로 한 상세 분석",
  },
  {
    icon: MessageSquare,
    title: "개인화된 피드백",
    desc: "선생님의 맞춤 코칭 메시지",
  },
  {
    icon: Activity,
    title: "연습 패턴 추적",
    desc: "장기적인 성장 추이를 한눈에",
  },
];

const cardContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.8,
    },
  },
};

const cardItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 250 },
  },
};

export function CoachingStep({ onComplete }: CoachingStepProps) {
  const handleComplete = () => {
    localStorage.setItem("grit-on-onboarding-complete", "true");
    onComplete();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-lg font-bold text-white mb-2"
      >
        전문가의 코칭 연결
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-violet-300/70 text-sm mb-8 leading-relaxed"
      >
        기록된 연습 데이터를 바탕으로
        <br />
        선생님에게 더 정교한 피드백을 받을 수 있습니다.
      </motion.p>

      {/* Teacher-Student Connection Illustration */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
        className="flex items-center gap-6 mb-8"
      >
        {/* Student */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full bg-violet-500/20 border border-violet-400/30 flex items-center justify-center">
            <User className="w-8 h-8 text-violet-300" />
          </div>
          <span className="text-violet-300/60 text-xs">학생</span>
        </div>

        {/* Connection line */}
        <motion.div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-violet-400/40"
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>

        {/* Teacher */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full bg-violet-500/20 border border-violet-400/30 flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-violet-300" />
          </div>
          <span className="text-violet-300/60 text-xs">선생님</span>
        </div>
      </motion.div>

      {/* Feature cards */}
      <motion.div
        variants={cardContainer}
        initial="hidden"
        animate="show"
        className="w-full max-w-sm space-y-3 mb-8"
      >
        {featureCards.map((card) => (
          <motion.div
            key={card.title}
            variants={cardItem}
            className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl px-5 py-4 flex items-center gap-4 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-600/30 flex items-center justify-center flex-shrink-0">
              <card.icon className="w-5 h-5 text-violet-300" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{card.title}</p>
              <p className="text-violet-300/60 text-xs">{card.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA Button with StarBorder */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
      >
        <StarBorder
          onClick={handleComplete}
          color="rgba(139, 92, 246, 0.7)"
          speed="3s"
          className="w-full"
        >
          <span className="bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-2xl px-10 py-3.5 flex items-center gap-2 transition-colors">
            대시보드로 이동
          </span>
        </StarBorder>
      </motion.div>
    </div>
  );
}
