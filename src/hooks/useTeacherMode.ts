"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getTeacherProfile,
  updateTeacherProfile,
  getVerification,
  syncVerificationFromSupabase,
} from "@/lib/teacher-store";
import { TeacherVerificationStatus } from "@/types";

export function useTeacherMode() {
  const [isTeacher, setIsTeacher] = useState(false);
  const [teacherMode, setTeacherMode] = useState(false);
  const [teacherProfileId, setTeacherProfileId] = useState<string | undefined>();
  const [verificationStatus, setVerificationStatus] = useState<TeacherVerificationStatus>("none");
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(() => {
    const profile = getTeacherProfile();
    setIsTeacher(profile.isTeacher);
    setTeacherMode(profile.teacherMode);
    setTeacherProfileId(profile.teacherProfileId);

    const verification = getVerification();
    setVerificationStatus(verification.status);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    reload();

    // Supabase에서 최신 인증 상태 동기화 (관리자 승인/반려 반영)
    syncVerificationFromSupabase().then(() => reload()).catch(() => {});

    // 다른 컴포넌트에서 토글했을 때 동기화
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "grit-on-profile" || e.key === "grit-on-teacher-verification") reload();
    };
    const handleCustom = () => reload();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("teacher-mode-changed", handleCustom);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("teacher-mode-changed", handleCustom);
    };
  }, [reload]);

  const toggleMode = useCallback(() => {
    const profile = getTeacherProfile();
    if (!profile.isTeacher) return false;
    const newMode = !profile.teacherMode;
    updateTeacherProfile({ teacherMode: newMode });
    setTeacherMode(newMode);
    // 같은 탭 내 다른 컴포넌트에 알림
    window.dispatchEvent(new Event("teacher-mode-changed"));
    return newMode;
  }, []);

  return {
    isTeacher,
    teacherMode,
    teacherProfileId,
    verificationStatus,
    isLoading,
    toggleMode,
    reload,
  };
}
