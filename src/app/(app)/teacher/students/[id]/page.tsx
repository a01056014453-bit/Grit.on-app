"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Music,
  Clock,
  TrendingUp,
  Calendar,
  Target,
  Award,
  BookOpen,
} from "lucide-react";
import { getManagedStudentById, initManagedStudents } from "@/lib/teacher-store";
import { mockTeacherStudents } from "@/data/mock-teacher-students";
import { ManagedStudent } from "@/types";

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;
  const [student, setStudent] = useState<ManagedStudent | null>(null);

  useEffect(() => {
    initManagedStudents(mockTeacherStudents);
    const found = getManagedStudentById(studentId);
    if (found) setStudent(found);
  }, [studentId]);

  if (!student) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto min-h-screen bg-slate-50">
        <button onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="w-6 h-6 text-slate-700" />
        </button>
        <div className="text-center py-16">
          <p className="text-slate-400">학생을 찾을 수 없습니다</p>
        </div>
      </div>
    );
  }

  const weeklyHours = Math.round((student.weeklyPracticeMinutes / 60) * 10) / 10;
  const joinDate = new Date(student.joinedAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const lessonCompletion =
    student.totalLessons > 0
      ? Math.round((student.completedLessons / student.totalLessons) * 100)
      : 0;

  return (
    <div className="px-4 py-6 max-w-lg mx-auto min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()}>
          <ArrowLeft className="w-6 h-6 text-slate-700" />
        </button>
        <h1 className="text-lg font-bold text-slate-900">학생 상세</h1>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-100 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-slate-500">
              {student.nickname[0]}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-slate-900">{student.nickname}</h2>
              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                {student.grade}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  student.type === "전공"
                    ? "bg-violet-100 text-violet-600"
                    : "bg-green-100 text-green-600"
                }`}
              >
                {student.type}
              </span>
            </div>
            <p className="text-sm text-slate-500">{student.instrument}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-slate-500">주간 연습</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-900">{weeklyHours}</span>
            <span className="text-sm text-slate-400">시간</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs text-slate-500">일평균 연습</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-900">
              {Math.round(student.weeklyPracticeMinutes / 7)}
            </span>
            <span className="text-sm text-slate-400">분</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-violet-500" />
            <span className="text-xs text-slate-500">레슨 완료율</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-900">{lessonCompletion}</span>
            <span className="text-sm text-slate-400">%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div
              className="bg-violet-500 rounded-full h-1.5 transition-all"
              style={{ width: `${lessonCompletion}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-slate-500">총 레슨</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-900">
              {student.completedLessons}
            </span>
            <span className="text-sm text-slate-400">/ {student.totalLessons}</span>
          </div>
        </div>
      </div>

      {/* Current Pieces */}
      <div className="bg-white rounded-xl p-4 border border-slate-100 mb-4">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Music className="w-4 h-4 text-violet-600" />
          현재 연습곡
        </h3>
        <div className="space-y-2">
          {student.currentPieces.map((piece, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
            >
              <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 text-violet-600" />
              </div>
              <span className="text-sm text-slate-700 font-medium">{piece}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-white rounded-xl p-4 border border-slate-100">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-violet-600" />
          정보
        </h3>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">등록일</span>
            <span className="text-sm font-medium text-slate-700">{joinDate}</span>
          </div>
          {student.lastPracticeDate && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">마지막 연습</span>
              <span className="text-sm font-medium text-slate-700">
                {new Date(student.lastPracticeDate).toLocaleDateString("ko-KR", {
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
