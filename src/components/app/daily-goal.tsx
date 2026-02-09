import Link from "next/link";
import { Target } from "lucide-react";
import { ProgressRing } from "./progress-ring";

interface DailyGoalProps {
  completed: number;
  target: number;
}

export function DailyGoal({ completed, target }: DailyGoalProps) {
  const progress = Math.min((completed / target) * 100, 100);
  const remaining = Math.max(target - completed, 0);

  return (
    <Link
      href="/goals"
      className="block bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-colors">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="font-bold text-black text-lg">오늘의 목표</h4>
          <p className="text-xs text-gray-500 mt-1">매일 조금씩 성장하는 습관</p>
        </div>
        <div className="p-2 bg-gray-100 rounded-full">
          <Target className="w-5 h-5 text-gray-600" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-6">
        <div className="relative flex items-center justify-center">
          <ProgressRing
            progress={progress}
            size={100}
            strokeWidth={8}
            showValue={false}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs text-gray-500">달성률</span>
            <span className="text-xl font-bold bg-gradient-to-r from-black to-violet-500 bg-clip-text text-transparent">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-3">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Current</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold bg-gradient-to-r from-black to-violet-500 bg-clip-text text-transparent">
                {completed}
              </span>
              <span className="text-sm font-medium text-gray-500">/ {target}분</span>
            </div>
          </div>

          <div className="text-sm text-black bg-gray-50 rounded-lg p-2.5">
            {remaining > 0 ? (
              <span className="flex items-center gap-2">
                <span className="font-medium">{remaining}분</span> 더 힘내봐요!
              </span>
            ) : (
              <span className="flex items-center gap-2 font-medium">
                목표 달성! 대단해요
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
