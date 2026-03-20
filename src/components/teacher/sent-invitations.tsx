"use client";

import { useState } from "react";
import { Clock, XCircle, CheckCircle, AlertCircle, Loader2, Share2, Copy, Link } from "lucide-react";
import type { Invitation, InvitationStatus } from "@/types/invitation";

interface SentInvitationsProps {
  invitations: Invitation[];
  onCancel: (id: string) => Promise<void>;
  baseUrl: string;
}

const STATUS_CONFIG: Record<InvitationStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "대기 중", color: "bg-amber-100 text-amber-700", icon: Clock },
  accepted: { label: "수락됨", color: "bg-green-100 text-green-700", icon: CheckCircle },
  expired: { label: "만료됨", color: "bg-gray-100 text-gray-500", icon: AlertCircle },
  canceled: { label: "취소됨", color: "bg-red-100 text-red-600", icon: XCircle },
};

export function SentInvitations({ invitations, onCancel, baseUrl }: SentInvitationsProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (invitations.length === 0) return null;

  const handleCancel = async (id: string) => {
    setLoadingId(id);
    try {
      await onCancel(id);
    } finally {
      setLoadingId(null);
    }
  };

  const getInviteUrl = (token: string) => `${baseUrl}/invite/${token}`;

  const handleCopy = async (inv: Invitation) => {
    try {
      await navigator.clipboard.writeText(getInviteUrl(inv.token));
      setCopiedId(inv.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback 없음
    }
  };

  const handleShare = async (inv: Invitation) => {
    const url = getInviteUrl(inv.token);
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Sempre - 학생 초대",
          text: inv.studentName
            ? `${inv.studentName}님, Sempre에서 함께 연습해요!`
            : "Sempre에서 함께 연습해요!",
          url,
        });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    await handleCopy(inv);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const getDaysLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="mt-6">
      <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
        <Link className="w-4 h-4 text-orange-600" />
        보낸 초대
        <span className="text-xs text-gray-400 font-normal">
          {invitations.length}건
        </span>
      </h3>
      <div className="space-y-2">
        {invitations.map((inv) => {
          const config = STATUS_CONFIG[inv.status];
          const StatusIcon = config.icon;
          const isPending = inv.status === "pending";
          const daysLeft = isPending ? getDaysLeft(inv.expiresAt) : 0;
          const isLoading = loadingId === inv.id;
          const isCopied = copiedId === inv.id;

          return (
            <div
              key={inv.id}
              className="bg-white/60 backdrop-blur-sm rounded-xl p-3.5 border border-white/60"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {inv.studentName || "이름 미입력"}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${config.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {config.label}
                    </span>
                  </div>
                </div>
                {inv.category && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ml-2 ${
                    inv.category === "전공" ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"
                  }`}>
                    {inv.category}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">
                  {formatDate(inv.createdAt)} 생성
                  {isPending && daysLeft > 0 && ` · ${daysLeft}일 후 만료`}
                  {isPending && daysLeft <= 0 && " · 곧 만료"}
                </span>

                {isPending && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleShare(inv)}
                      disabled={isLoading}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 disabled:opacity-50"
                      aria-label="링크 공유"
                    >
                      {isCopied ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          복사됨
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3 h-3" />
                          공유
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleCopy(inv)}
                      disabled={isLoading}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                      aria-label="링크 복사"
                    >
                      <Copy className="w-3 h-3" />
                      복사
                    </button>
                    <button
                      onClick={() => handleCancel(inv.id)}
                      disabled={isLoading}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                      aria-label="취소"
                    >
                      {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                      취소
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
