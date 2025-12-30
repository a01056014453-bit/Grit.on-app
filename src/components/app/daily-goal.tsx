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
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="font-bold text-slate-900 text-lg">오늘의 목표</h4>
          <p className="text-xs text-slate-500 mt-1">매일 조금씩 성장하는 습관</p>
        </div>
        <div className="p-2 bg-primary/5 rounded-full">
          <Target className="w-5 h-5 text-primary" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-6">
        <div className="relative flex items-center justify-center">
          <ProgressRing 
            progress={progress} 
            size={100} 
            strokeWidth={8} 
            className="text-primary" 
            showValue={false}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-medium text-slate-400">달성률</span>
            <span className="text-xl font-bold text-slate-900">{Math.round(progress)}%</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-3">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Current</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-900">{completed}</span>
              <span className="text-sm font-medium text-slate-400">/ {target}분</span>
            </div>
          </div>
          
          <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-2.5">
            {remaining > 0 ? (
              <span className="flex items-center gap-2">
                🔥 <span className="font-medium">{remaining}분</span> 더 힘내봐요!
              </span>
            ) : (
              <span className="flex items-center gap-2 text-primary font-medium">
                🎉 목표 달성! 대단해요
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
