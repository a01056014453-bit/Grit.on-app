"use client";

import { useState, useEffect, useCallback } from "react";
import { Users } from "lucide-react";
import { StudentList, InviteStudentModal, SentInvitations } from "@/components/teacher";
import { getTeacherStudents } from "@/lib/queries/teacher-students";
import { useTeacherMode } from "@/hooks/useTeacherMode";
import type { ManagedStudent, Invitation } from "@/types";

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<ManagedStudent[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const { teacherProfileId } = useTeacherMode();

  const loadStudents = useCallback(async () => {
    if (!teacherProfileId) return;
    const data = await getTeacherStudents(teacherProfileId);
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
  }, [teacherProfileId]);

  const loadInvitations = useCallback(async () => {
    try {
      const res = await fetch("/api/teacher/invitations");
      if (res.ok) {
        const data = await res.json();
        setInvitations(data.invitations ?? []);
      }
    } catch (err) {
      console.error("[loadInvitations]", err);
    }
  }, []);

  useEffect(() => {
    loadStudents();
    loadInvitations();
  }, [loadStudents, loadInvitations]);

  const handleCancel = async (id: string) => {
    try {
      const res = await fetch(`/api/teacher/invitations/${id}/cancel`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "취소에 실패했습니다.");
        return;
      }
      await loadInvitations();
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    }
  };

  const handleInviteSuccess = () => {
    loadInvitations();
    loadStudents();
  };

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
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/60 text-center">
          <div className="text-lg font-bold text-slate-900">{students.length}</div>
          <div className="text-[10px] text-slate-500">전체</div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/60 text-center">
          <div className="text-lg font-bold text-slate-900">
            {students.filter((s) => s.type === "전공").length}
          </div>
          <div className="text-[10px] text-slate-500">전공</div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/60 text-center">
          <div className="text-lg font-bold text-slate-900">
            {students.filter((s) => s.type === "취미").length}
          </div>
          <div className="text-[10px] text-slate-500">취미</div>
        </div>
      </div>

      {/* Student List */}
      <StudentList
        students={students}
        onInvite={() => setIsInviteOpen(true)}
      />

      {/* Sent Invitations */}
      <SentInvitations
        invitations={invitations}
        onCancel={handleCancel}
        baseUrl={typeof window !== "undefined" ? window.location.origin : ""}
      />

      {/* Invite Modal */}
      <InviteStudentModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSuccess={handleInviteSuccess}
      />
    </div>
  );
}
