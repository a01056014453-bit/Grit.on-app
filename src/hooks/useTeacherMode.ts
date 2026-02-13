"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getTeacherProfile,
  updateTeacherProfile,
  getVerification,
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
  }, [reload]);

  const toggleMode = useCallback(() => {
    const profile = getTeacherProfile();
    if (!profile.isTeacher) return false;
    const newMode = !profile.teacherMode;
    updateTeacherProfile({ teacherMode: newMode });
    setTeacherMode(newMode);
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
