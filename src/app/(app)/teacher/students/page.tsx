"use client";

import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { StudentList } from "@/components/teacher";
import { getTeacherStudents } from "@/lib/queries/teacher-students";
import { useTeacherMode } from "@/hooks/useTeacherMode";
import { ManagedStudent } from "@/types";

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<ManagedStudent[]>([]);
  const { teacherProfileId } = useTeacherMode();

  useEffect(() => {
    if (!teacherProfileId) return;
    getTeacherStudents(teacherProfileId).then((data) => {
      setStudents(data.map((s) => ({
        id: s.id,
        nickname: s.nickname,
        instrument: s.instrument,
        grade: s.grade,
        type: s.type,
        weeklyPracticeMinutes: s.weeklyPracticeMinutes,
        currentPieces: s.currentPieces,
        lastPracticeDate: s.lastPracticeDate,
        joinedAt: s.joinedAt,
        totalLessons: s.totalLessons,
        completedLessons: s.completedLessons,
      })));
    });
  }, [teacherProfileId]);

  return (
    <div className="px-4 py-6 max-w-lg mx-auto min-h-screen pb-24 bg-blob-orange">
      <div className="bg-blob-orange-extra" />
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-orange-600" />
          학생 관리
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          내 학생들의 연습 현황을 확인하세요
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-white rounded-xl p-3 border border-slate-100 text-center">
          <div className="text-lg font-bold text-slate-900">{students.length}</div>
          <div className="text-[10px] text-slate-500">전체</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-100 text-center">
          <div className="text-lg font-bold text-slate-900">
            {students.filter((s) => s.type === "전공").length}
          </div>
          <div className="text-[10px] text-slate-500">전공</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-100 text-center">
          <div className="text-lg font-bold text-slate-900">
            {students.filter((s) => s.type === "취미").length}
          </div>
          <div className="text-[10px] text-slate-500">취미</div>
        </div>
      </div>

      <StudentList students={students} />
    </div>
  );
}
