"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  MessageSquare,
  BadgeCheck,
  Star,
  Send,
  AlertCircle,
} from "lucide-react";
import { RequestStatusChip } from "@/components/feedback/request-status-chip";
import { getFeedbackRequestById, getRemainingTime } from "@/lib/feedback-store";
import { PROBLEM_TYPE_LABELS } from "@/types";

const statusSteps = [
  { status: "SENT", label: "전송됨", description: "선생님 수락 대기" },
  { status: "ACCEPTED", label: "수락됨", description: "피드백 작성중" },
  { status: "SUBMITTED", label: "피드백 완료", description: "확인 대기" },
  { status: "COMPLETED", label: "완료", description: "" },
];

export default function FeedbackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

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

  const acceptDeadlineTime = request.acceptDeadline
    ? getRemainingTime(request.acceptDeadline)
    : null;
  const submitDeadlineTime = request.submitDeadline
    ? getRemainingTime(request.submitDeadline)
    : null;

  const getCurrentStepIndex = () => {
    switch (request.status) {
      case "SENT":
        return 0;
      case "ACCEPTED":
        return 1;
      case "SUBMITTED":
        return 2;
      case "COMPLETED":
        return 3;
      default:
        return -1;
    }
  };

  const currentStep = getCurrentStepIndex();
  const isDeclinedOrExpired = ["DECLINED", "EXPIRED", "REFUNDED"].includes(request.status);

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
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
        <RequestStatusChip status={request.status} size="md" />
        <h1 className="text-xl font-bold text-foreground mt-3">
          {request.composer} - {request.piece}
        </h1>
        <p className="text-primary font-mono mt-1">
          {request.measureStart}-{request.measureEnd} 마디
        </p>
      </div>

      {/* Status Timeline (only for active requests) */}
      {currentStep >= 0 && (
        <div className="bg-card rounded-xl p-4 border border-border mb-4">
          <h2 className="text-sm font-semibold text-foreground mb-4">진행 상태</h2>
          <div className="relative">
            {/* Progress line */}
            <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-secondary" />
            <div
              className="absolute left-3 top-3 w-0.5 bg-primary transition-all"
              style={{ height: `${(currentStep / 3) * 100}%` }}
            />

            {/* Steps */}
            <div className="space-y-4">
              {statusSteps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                const isPending = index > currentStep;

                return (
                  <div key={step.status} className="flex items-start gap-3 pl-0">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                        isCompleted
                          ? "bg-primary text-white"
                          : isCurrent
                          ? "bg-primary text-white ring-4 ring-primary/20"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-bold">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p
                        className={`font-medium ${
                          isPending ? "text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {step.label}
                      </p>
                      {step.description && (
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      )}

                      {/* SLA countdown */}
                      {isCurrent && step.status === "SENT" && acceptDeadlineTime && (
                        <div
                          className={`mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${
                            acceptDeadlineTime.isExpired
                              ? "bg-red-100 text-red-700"
                              : acceptDeadlineTime.hours < 3
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          수락 마감: {acceptDeadlineTime.text}
                        </div>
                      )}

                      {isCurrent && step.status === "ACCEPTED" && submitDeadlineTime && (
                        <div
                          className={`mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${
                            submitDeadlineTime.isExpired
                              ? "bg-red-100 text-red-700"
                              : submitDeadlineTime.hours < 12
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          피드백 마감: {submitDeadlineTime.text}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Declined/Expired Message */}
      {isDeclinedOrExpired && (
        <div className="bg-red-50 rounded-xl p-4 border border-red-200 mb-4">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-700">
                {request.status === "DECLINED"
                  ? "선생님이 요청을 거절했습니다"
                  : "요청이 만료되었습니다"}
              </p>
              {request.declineReason && (
                <p className="text-sm text-red-600 mt-1">{request.declineReason}</p>
              )}
              <p className="text-sm text-red-600 mt-2">
                크레딧이 자동으로 환불되었습니다.
              </p>
            </div>
          </div>
          <Link
            href="/teachers"
            className="block mt-4 text-center py-2 bg-red-100 rounded-lg text-sm text-red-700 font-medium hover:bg-red-200 transition-colors"
          >
            다른 선생님 찾아보기
          </Link>
        </div>
      )}

      {/* Teacher Info */}
      {request.teacher && (
        <div className="bg-card rounded-xl p-4 border border-border mb-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">선생님</h2>
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-violet-200 flex items-center justify-center text-lg font-bold text-primary">
                {request.teacher.name.charAt(0)}
              </div>
              {request.teacher.verified && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                  <BadgeCheck className="w-3.5 h-3.5 text-primary" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground">{request.teacher.name}</span>
                <div className="flex items-center gap-0.5 text-amber-500">
                  <Star className="w-3 h-3 fill-current" />
                  <span className="text-xs font-bold">{request.teacher.rating}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{request.teacher.title}</p>
            </div>
          </div>
        </div>
      )}

      {/* Request Details */}
      <div className="bg-card rounded-xl p-4 border border-border mb-4">
        <h2 className="text-sm font-semibold text-foreground mb-3">요청 내용</h2>

        <div className="space-y-3">
          <div>
            <span className="text-xs text-muted-foreground">문제 유형</span>
            <p className="text-sm text-foreground font-medium mt-0.5">
              {PROBLEM_TYPE_LABELS[request.problemType]}
            </p>
          </div>

          <div>
            <span className="text-xs text-muted-foreground">문제 설명</span>
            <p className="text-sm text-foreground mt-0.5">{request.description}</p>
          </div>

          {request.videoUrl && (
            <div>
              <span className="text-xs text-muted-foreground">업로드 영상</span>
              <div className="mt-2 bg-secondary/50 rounded-lg p-4 flex items-center justify-center">
                <div className="text-center">
                  <Play className="w-8 h-8 text-primary mx-auto mb-2" />
                  <span className="text-xs text-muted-foreground">영상 재생</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clarification (if any) */}
      {request.clarificationRequest && (
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 mb-4">
          <div className="flex items-start gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-amber-600 mt-0.5" />
            <span className="text-sm font-medium text-amber-800">선생님의 추가 질문</span>
          </div>
          <p className="text-sm text-amber-700 mb-3">{request.clarificationRequest}</p>

          {request.clarificationResponse ? (
            <div className="bg-white/50 rounded-lg p-3">
              <span className="text-xs text-amber-600">나의 답변</span>
              <p className="text-sm text-amber-800 mt-1">{request.clarificationResponse}</p>
            </div>
          ) : (
            <div>
              <textarea
                placeholder="답변을 입력하세요..."
                className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 resize-none"
                rows={2}
              />
              <button className="mt-2 w-full py-2 bg-amber-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                답변 보내기
              </button>
            </div>
          )}
        </div>
      )}

      {/* Action Button (for SUBMITTED status) */}
      {request.status === "SUBMITTED" && (
        <Link
          href={`/feedback/${request.id}/view`}
          className="block w-full py-4 rounded-xl bg-gradient-to-r from-primary to-violet-600 text-white font-semibold text-center shadow-lg shadow-primary/25"
        >
          피드백 확인하기
        </Link>
      )}

      {/* Payment Info */}
      <div className="mt-4 p-3 bg-secondary/50 rounded-xl">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">결제 금액</span>
          <span className="font-bold text-foreground">{request.creditAmount} 크레딧</span>
        </div>
        <div className="flex items-center justify-between text-xs mt-1">
          <span className="text-muted-foreground">결제 상태</span>
          <span
            className={
              request.paymentStatus === "held"
                ? "text-amber-600"
                : request.paymentStatus === "released"
                ? "text-green-600"
                : request.paymentStatus === "refunded"
                ? "text-blue-600"
                : "text-muted-foreground"
            }
          >
            {request.paymentStatus === "held"
              ? "에스크로 보관중"
              : request.paymentStatus === "released"
              ? "지급 완료"
              : request.paymentStatus === "refunded"
              ? "환불 완료"
              : "대기중"}
          </span>
        </div>
      </div>
    </div>
  );
}
