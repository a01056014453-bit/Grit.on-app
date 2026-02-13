"use client";

import { Users, Inbox, CheckCircle, Coins } from "lucide-react";
import { TeacherDashboardStats } from "@/types";

interface TeacherStatsCardsProps {
  stats: TeacherDashboardStats;
}

export function TeacherStatsCards({ stats }: TeacherStatsCardsProps) {
  const cards = [
    {
      icon: Users,
      label: "내 학생",
      value: stats.totalStudents,
      unit: "명",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      icon: Inbox,
      label: "대기 요청",
      value: stats.pendingRequests,
      unit: "건",
      color: "text-red-600",
      bg: "bg-red-50",
      highlight: stats.pendingRequests > 0,
    },
    {
      icon: CheckCircle,
      label: "이번 달 완료",
      value: stats.completedThisMonth,
      unit: "건",
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      icon: Coins,
      label: "총 수익",
      value: stats.totalCreditsEarned,
      unit: "C",
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-white rounded-xl p-4 border ${
            card.highlight ? "border-red-200" : "border-slate-100"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.bg}`}
            >
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <span className="text-xs text-slate-500">{card.label}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900">
              {card.value}
            </span>
            <span className="text-sm text-slate-400">{card.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
