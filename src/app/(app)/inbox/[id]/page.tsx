"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Clock,
  Check,
  X,
  MessageSquare,
  Send,
  AlertCircle,
  Coins,
} from "lucide-react";
import { RequestStatusChip } from "@/components/feedback/request-status-chip";
import {
  getFeedbackRequestById,
  updateRequestStatus,
  getRemainingTime,
} from "@/lib/feedback-store";
import { PROBLEM_TYPE_LABELS } from "@/types";

const declineReasons = [
  "현재 일정이 많아 기한 내 피드백이 어렵습니다",
  "해당 곡/분야는 제 전문 분야가 아닙니다",
  "영상 품질이 좋지 않아 분석이 어렵습니다",
  "기타 (직접 입력)",
];

export default function InboxDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const request = getFeedbackRequestById(requestId);

  if (!request) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>뒤로</span>
        </button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">요청을 찾을 수 없습니다</p>
        </div>
      </div>
    );
  }

  const acceptDeadline = request.acceptDeadline
    ? getRemainingTime(request.acceptDeadline)
    : null;
  const submitDeadline = request.submitDeadline
    ? getRemainingTime(request.submitDeadline)
    : null;

  const handleAccept = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    updateRequestStatus(requestId, "ACCEPTED");
    router.push(`/inbox/${requestId}/submit`);
  };

  const handleDecline = async () => {
    if (!declineReason) return;
    setIsProcessing(true);
    const reason = declineReason === "기타 (직접 입력)" ? customReason : declineReason;
    await new Promise((resolve) => setTimeout(resolve, 1000));
    updateRequestStatus(requestId, "DECLINED", { declineReason: reason });
    router.push("/inbox");
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-32 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      {/* Header */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-muted-foreground mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>뒤로</span>
      </button>

      {/* Status & Title */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <RequestStatusChip status={request.status} size="md" />
          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
            {PROBLEM_TYPE_LABELS[request.problemType]}
          </span>
        </div>
        <h1 className="text-xl font-bold text-foreground">
          {request.composer} - {request.piece}
        </h1>
        <p className="text-primary font-mono mt-1">
          {request.measureStart}-{request.measureEnd} 마디
        </p>
      </div>

      {/* SLA Warning */}
      {request.status === "SENT" && acceptDeadline && (
        <div
          className={`rounded-xl p-4 mb-4 ${
            acceptDeadline.isExpired
              ? "bg-red-50 border border-red-200"
              : acceptDeadline.hours < 3
              ? "bg-amber-50 border border-amber-200"
              : "bg-blue-50 border border-blue-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle
              className={`w-5 h-5 ${
                acceptDeadline.isExpired
                  ? "text-red-500"
                  : acceptDeadline.hours < 3
                  ? "text-amber-500"
                  : "text-blue-500"
              }`}
            />
            <span
              className={`font-medium ${
                acceptDeadline.isExpired
                  ? "text-red-700"
                  : acceptDeadline.hours < 3
                  ? "text-amber-700"
                  : "text-blue-700"
              }`}
            >
              수락 마감: {acceptDeadline.text}
            </span>
          </div>
          <p
            className={`text-sm mt-1 ${
              acceptDeadline.isExpired
                ? "text-red-600"
                : acceptDeadline.hours < 3
                ? "text-amber-600"
                : "text-blue-600"
            }`}
          >
            {acceptDeadline.isExpired
              ? "마감 시간이 지났습니다"
              : "마감 전에 수락 또는 거절해 주세요"}
          </p>
        </div>
      )}

      {request.status === "ACCEPTED" && submitDeadline && (
        <div
          className={`rounded-xl p-4 mb-4 ${
            submitDeadline.isExpired
              ? "bg-red-50 border border-red-200"
              : submitDeadline.hours < 12
              ? "bg-amber-50 border border-amber-200"
              : "bg-blue-50 border border-blue-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock
              className={`w-5 h-5 ${
                submitDeadline.isExpired
                  ? "text-red-500"
                  : submitDeadline.hours < 12
                  ? "text-amber-500"
                  : "text-blue-500"
              }`}
            />
            <span
              className={`font-medium ${
                submitDeadline.isExpired
                  ? "text-red-700"
                  : submitDeadline.hours < 12
                  ? "text-amber-700"
                  : "text-blue-700"
              }`}
            >
              피드백 제출 마감: {submitDeadline.text}
            </span>
          </div>
        </div>
      )}

      {/* Student Video */}
      <div className="bg-card rounded-xl p-4 border border-border mb-4">
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Play className="w-4 h-4 text-primary" />
          학생 연주 영상
        </h2>
        <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
              <Play className="w-8 h-8 text-white" />
            </div>
            <p className="text-white/70 text-sm">영상 재생</p>
          </div>
        </div>
        {request.faceBlurred && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            얼굴 블러 처리됨
          </p>
        )}
      </div>

      {/* Problem Description */}
      <div className="bg-card rounded-xl p-4 border border-border mb-4">
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          문제 설명
        </h2>
        <p className="text-sm text-foreground leading-relaxed">{request.description}</p>
      </div>

      {/* Payment Info */}
      <div className="bg-gradient-to-br from-primary/5 to-violet-500/5 rounded-xl p-4 border border-primary/10 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">피드백 보상</span>
          <div className="flex items-center gap-1 text-primary">
            <Coins className="w-5 h-5" />
            <span className="text-xl font-bold">{request.creditAmount}</span>
            <span className="text-sm">크레딧</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          피드백 완료 확인 후 크레딧이 지급됩니다
        </p>
      </div>

      {/* Fixed CTAs */}
      {request.status === "SENT" && (
        <div className="fixed bottom-20 left-0 right-0 px-4 py-3 bg-background/80 backdrop-blur-lg border-t border-border">
          <div className="max-w-lg mx-auto flex gap-3">
            <button
              onClick={() => setShowDeclineModal(true)}
              disabled={isProcessing}
              className="flex-1 py-4 rounded-xl border border-red-200 bg-red-50 text-red-600 font-semibold flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              거절
            </button>
            <button
              onClick={handleAccept}
              disabled={isProcessing}
              className="flex-[2] py-4 rounded-xl bg-gradient-to-r from-primary to-violet-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
            >
              {isProcessing ? (
                "처리 중..."
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  수락하기
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {request.status === "ACCEPTED" && (
        <div className="fixed bottom-20 left-0 right-0 px-4 py-3 bg-background/80 backdrop-blur-lg border-t border-border">
          <div className="max-w-lg mx-auto">
            <Link
              href={`/inbox/${request.id}/submit`}
              className="block w-full py-4 rounded-xl bg-gradient-to-r from-primary to-violet-600 text-white font-semibold text-center shadow-lg shadow-primary/25"
            >
              피드백 작성하기
            </Link>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-background w-full max-w-lg rounded-t-2xl p-6 animate-in slide-in-from-bottom">
            <h3 className="text-lg font-bold text-foreground mb-4">거절 사유 선택</h3>

            <div className="space-y-2 mb-4">
              {declineReasons.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setDeclineReason(reason)}
                  className={`w-full p-3 rounded-xl border text-left transition-all ${
                    declineReason === reason
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <span className="text-sm text-foreground">{reason}</span>
                </button>
              ))}
            </div>

            {declineReason === "기타 (직접 입력)" && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="거절 사유를 입력해주세요..."
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none mb-4"
                rows={3}
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeclineModal(false)}
                className="flex-1 py-3 rounded-xl border border-border text-muted-foreground font-medium"
              >
                취소
              </button>
              <button
                onClick={handleDecline}
                disabled={
                  !declineReason ||
                  (declineReason === "기타 (직접 입력)" && !customReason) ||
                  isProcessing
                }
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold disabled:opacity-50"
              >
                {isProcessing ? "처리 중..." : "거절하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
