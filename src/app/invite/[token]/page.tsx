"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Clock, AlertTriangle, UserPlus, Loader2, Music, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import type { InvitationDetail } from "@/types/invitation";

const PENDING_INVITE_KEY = "grit-on-pending-invite-token";

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<InvitationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    async function load() {
      // 인증 확인
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setIsLoggedIn(!!user);
      } catch {
        setIsLoggedIn(false);
      }

      // 초대 정보 조회
      try {
        const res = await fetch(`/api/invitations/${token}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "초대를 찾을 수 없습니다.");
          return;
        }
        const data = await res.json();
        setInvitation(data.invitation);
      } catch {
        setError("네트워크 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }

    load();

    // pending invite token 정리
    if (typeof window !== "undefined") {
      localStorage.removeItem(PENDING_INVITE_KEY);
    }
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    setError("");

    try {
      const res = await fetch(`/api/invitations/${token}/accept`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "수락에 실패했습니다.");
        return;
      }

      setAccepted(true);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setAccepting(false);
    }
  };

  const handleLoginRedirect = () => {
    // 토큰 저장 후 로그인 페이지로 이동
    localStorage.setItem(PENDING_INVITE_KEY, token);
    router.push("/onboarding/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-orange-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">초대 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">초대를 찾을 수 없습니다</h1>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold text-sm"
          >
            홈으로 가기
          </button>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">초대를 수락했습니다!</h1>
          <p className="text-sm text-gray-500 mb-6">
            {invitation?.teacherName} 선생님의 학생으로 등록되었습니다.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold text-sm"
          >
            홈으로 가기
          </button>
        </div>
      </div>
    );
  }

  if (!invitation) return null;

  const isExpired = invitation.status === "expired";
  const isCanceled = invitation.status === "canceled";
  const isAlreadyAccepted = invitation.status === "accepted";
  const isValid = invitation.status === "pending";

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white px-4 py-12">
      <div className="max-w-sm mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Music className="w-7 h-7 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sempre</h1>
        </div>

        {/* Invitation Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100 mb-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <UserPlus className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              학생 초대
            </h2>
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-orange-600">{invitation.teacherName}</span> 선생님이
              {invitation.studentName ? ` ${invitation.studentName}님을` : ""} 학생으로 초대했습니다.
            </p>
          </div>

          {/* Teacher Info */}
          <div className="bg-orange-50/50 rounded-xl p-4 mb-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-lg font-bold text-orange-700">
                  {invitation.teacherName[0]}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{invitation.teacherName} 선생님</p>
              {invitation.teacherSpecialty.length > 0 && (
                <div className="flex justify-center gap-1 mt-1.5">
                  {invitation.teacherSpecialty.map((s) => (
                    <span key={s} className="text-[10px] px-2 py-0.5 bg-white rounded-full text-orange-600">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {invitation.category && (
            <div className="flex justify-center mb-4">
              <span className={`text-xs px-3 py-1 rounded-full ${
                invitation.category === "전공" ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"
              }`}>
                {invitation.category}
              </span>
            </div>
          )}

          {/* Status Messages */}
          {isExpired && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl mb-4">
              <Clock className="w-5 h-5 text-gray-400 shrink-0" />
              <p className="text-sm text-gray-500">이 초대는 만료되었습니다. 선생님에게 새 초대를 요청하세요.</p>
            </div>
          )}
          {isCanceled && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl mb-4">
              <XCircle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-sm text-red-600">이 초대는 취소되었습니다.</p>
            </div>
          )}
          {isAlreadyAccepted && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl mb-4">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              <p className="text-sm text-green-700">이미 수락된 초대입니다.</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          {isValid && (
            <div className="space-y-3">
              {isLoggedIn ? (
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="w-full py-3.5 bg-orange-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {accepting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      수락 중...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      초대 수락하기
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleLoginRedirect}
                  className="w-full py-3.5 bg-orange-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  로그인하고 수락하기
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
