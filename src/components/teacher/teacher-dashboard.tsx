"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  ChevronRight,
  Star,
  Zap,
  Users,
  Inbox,
} from "lucide-react";
import { TeacherStatsCards } from "./teacher-stats-cards";
import { LessonRequestCard } from "./lesson-request-card";
import { TeacherModeToggle } from "./teacher-mode-toggle";
import { getTeacherDashboardStats, getManagedStudents, initManagedStudents } from "@/lib/teacher-store";
import { getFeedbackRequestsForTeacher } from "@/lib/feedback-store";
import { mockTeacherStudents } from "@/data/mock-teacher-students";
import { FeedbackRequest, TeacherDashboardStats, ManagedStudent } from "@/types";

interface TeacherDashboardProps {
  teacherProfileId: string;
  onToggleMode: () => void;
}

export function TeacherDashboard({ teacherProfileId, onToggleMode }: TeacherDashboardProps) {
  const [stats, setStats] = useState<TeacherDashboardStats | null>(null);
  const [recentRequests, setRecentRequests] = useState<FeedbackRequest[]>([]);
  const [students, setStudents] = useState<ManagedStudent[]>([]);

  useEffect(() => {
    // Initialize mock students
    initManagedStudents(mockTeacherStudents);

    const dashStats = getTeacherDashboardStats(teacherProfileId);
    setStats(dashStats);

    const requests = getFeedbackRequestsForTeacher(teacherProfileId);
    // Show pending + active, sorted by newest
    const active = requests
      .filter((r) => ["SENT", "ACCEPTED"].includes(r.status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
    setRecentRequests(active);

    setStudents(getManagedStudents().slice(0, 4));
  }, [teacherProfileId]);

  // Get profile name
  const [userName, setUserName] = useState("선생님");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("grit-on-profile");
      if (saved) {
        const profile = JSON.parse(saved);
        if (profile.nickname) setUserName(profile.nickname);
      }
    } catch {}
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blob-orange">
        <div className="bg-blob-orange-extra" />
        <div className="animate-pulse text-gray-400">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto min-h-screen pb-24 bg-blob-orange">
      <div className="bg-blob-orange-extra" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="w-5 h-5 text-orange-600" />
            <h1 className="text-lg font-bold text-gray-900">선생님 대시보드</h1>
          </div>
          <p className="text-sm text-gray-500">
            안녕하세요, <span className="font-semibold text-gray-700">{userName}</span> 선생님
          </p>
        </div>
        <TeacherModeToggle enabled={true} onToggle={onToggleMode} />
      </div>

      {/* Quick Stats */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-1.5 bg-white/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/50">
          <Star className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-semibold text-gray-700">{stats.avgRating}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/50">
          <Zap className="w-3.5 h-3.5 text-green-500" />
          <span className="text-xs font-semibold text-gray-700">응답률 {stats.responseRate}%</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6">
        <TeacherStatsCards stats={stats} />
      </div>

      {/* Pending Requests */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Inbox className="w-4 h-4 text-orange-600" />
            피드백 요청
            {stats.pendingRequests > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                {stats.pendingRequests}
              </span>
            )}
          </h2>
          <Link
            href="/inbox"
            className="text-xs text-orange-600 font-medium flex items-center gap-0.5"
          >
            전체 보기
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentRequests.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-8 border border-white/60 text-center">
            <Inbox className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">새로운 요청이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentRequests.map((request) => (
              <LessonRequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </div>

      {/* My Students Preview */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-600" />
            내 학생
          </h2>
          <Link
            href="/teacher/students"
            className="text-xs text-orange-600 font-medium flex items-center gap-0.5"
          >
            전체 보기
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {students.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-8 border border-white/60 text-center">
            <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">등록된 학생이 없습니다</p>
          </div>
        ) : (
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/60 divide-y divide-white/40 overflow-hidden">
            {students.map((student) => (
              <Link
                key={student.id}
                href={`/teacher/students/${student.id}`}
                className="flex items-center gap-3 p-3.5 hover:bg-white/40 transition-colors"
              >
                <div className="w-10 h-10 bg-orange-100/60 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-orange-600">
                    {student.nickname[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {student.nickname}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-white/60 text-gray-500 rounded-full">
                      {student.grade}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      student.type === "전공"
                        ? "bg-orange-100/80 text-orange-600"
                        : "bg-green-100/80 text-green-600"
                    }`}>
                      {student.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {student.currentPieces.join(", ")}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
