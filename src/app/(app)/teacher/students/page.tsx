"use client";

import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { StudentList } from "@/components/teacher";
import { getManagedStudents, initManagedStudents } from "@/lib/teacher-store";
import { mockTeacherStudents } from "@/data/mock-teacher-students";
import { ManagedStudent } from "@/types";

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<ManagedStudent[]>([]);

  useEffect(() => {
    initManagedStudents(mockTeacherStudents);
    setStudents(getManagedStudents());
  }, []);

  return (
    <div className="px-4 py-6 max-w-lg mx-auto bg-slate-50 min-h-screen pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-violet-600" />
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
