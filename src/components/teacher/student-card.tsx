"use client";

import Link from "next/link";
import { ChevronRight, Music, Clock, TrendingUp } from "lucide-react";
import { ManagedStudent } from "@/types";

interface StudentCardProps {
  student: ManagedStudent;
}

export function StudentCard({ student }: StudentCardProps) {
  const weeklyHours = Math.round(student.weeklyPracticeMinutes / 60 * 10) / 10;
  const lastPractice = student.lastPracticeDate
    ? new Date(student.lastPracticeDate).toLocaleDateString("ko-KR", {
        month: "short",
        day: "numeric",
      })
    : "없음";

  return (
    <Link
      href={`/teacher/students/${student.id}`}
      className="block bg-white rounded-xl p-4 border border-slate-100 hover:border-violet-200 hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
          {student.profileImage ? (
            <img src={student.profileImage} alt="" className="w-11 h-11 rounded-full object-cover" />
          ) : (
            <span className="text-base font-bold text-slate-500">
              {student.nickname[0]}
            </span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">{student.nickname}</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full">
              {student.grade}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              student.type === "전공"
                ? "bg-violet-100 text-violet-600"
                : "bg-green-100 text-green-600"
            }`}>
              {student.type}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {student.instrument}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
      </div>

      {/* Current Pieces */}
      <div className="flex items-center gap-1.5 mb-2.5">
        <Music className="w-3.5 h-3.5 text-violet-500 shrink-0" />
        <p className="text-xs text-slate-600 truncate">
          {student.currentPieces.join(", ")}
        </p>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 pt-2.5 border-t border-slate-50">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" />
          <span className="text-[11px] text-slate-500">
            주 {weeklyHours}시간
          </span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-slate-400" />
          <span className="text-[11px] text-slate-500">
            일평균 {Math.round(student.weeklyPracticeMinutes / 7)}분
          </span>
        </div>
        <span className="text-[11px] text-slate-400 ml-auto">
          마지막 연습: {lastPractice}
        </span>
      </div>
    </Link>
  );
}
