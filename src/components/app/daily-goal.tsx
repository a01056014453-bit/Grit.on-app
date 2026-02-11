"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Target, Check, BarChart3 } from "lucide-react";
import { ProgressRing } from "./progress-ring";

interface DailyGoalProps {
  completed: number;
  target: number;
  onTargetChange?: (newTarget: number) => void;
}

const GOAL_OPTIONS = [30, 45, 60, 90, 120];

export function DailyGoal({ completed, target, onTargetChange }: DailyGoalProps) {
  const progress = Math.min((completed / target) * 100, 100);
  const remaining = Math.max(target - completed, 0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSelectGoal = (minutes: number) => {
    localStorage.setItem('grit-on-daily-goal', minutes.toString());
    onTargetChange?.(minutes);
    setIsOpen(false);
  };

  return (
    <div className="block bg-white rounded-2xl p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="font-bold text-black text-lg">오늘의 목표</h4>
          <p className="text-xs text-gray-500 mt-1">매일 조금씩 성장하는 습관</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 bg-gray-100 rounded-full hover:bg-violet-100 transition-colors"
            >
              <Target className="w-5 h-5 text-gray-600 hover:text-violet-600" />
            </button>

            {isOpen && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 min-w-[140px]">
                <p className="text-xs text-gray-500 px-4 py-1 border-b border-gray-100 mb-1">
                  목표 시간 설정
                </p>
                {GOAL_OPTIONS.map((minutes) => (
                  <button
                    key={minutes}
                    onClick={() => handleSelectGoal(minutes)}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between hover:bg-gray-50 transition-colors ${
                      target === minutes ? "text-violet-600 font-semibold" : "text-gray-700"
                    }`}
                  >
                    <span>{minutes}분</span>
                    {target === minutes && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Link
            href="/stats"
            className="p-2 bg-gray-100 rounded-full hover:bg-violet-100 transition-colors"
          >
            <BarChart3 className="w-5 h-5 text-gray-600 hover:text-violet-600" />
          </Link>
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
    </div>
  );
}
