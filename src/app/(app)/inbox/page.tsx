"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Inbox, Clock, CheckCircle, Bell, ChevronRight, AlertCircle } from "lucide-react";
import { RequestStatusChip } from "@/components/feedback/request-status-chip";
import { getFeedbackRequestsForTeacher, getRemainingTime } from "@/lib/feedback-store";
import { FeedbackRequestStatus, PROBLEM_TYPE_LABELS } from "@/types";
import { getTeacherProfile } from "@/lib/teacher-store";

type TabType = "pending" | "active" | "completed";

function getCurrentTeacherId(): string {
  if (typeof window === "undefined") return "t1";
  const profile = getTeacherProfile();
  return profile.teacherProfileId || "t1";
}

export default function InboxPage() {
  const [tab, setTab] = useState<TabType>("pending");
  const teacherId = getCurrentTeacherId();
  const requests = getFeedbackRequestsForTeacher(teacherId);

  const pendingRequests = requests.filter((r) => r.status === "SENT");
  const activeRequests = requests.filter((r) => r.status === "ACCEPTED");
  const completedRequests = requests.filter((r) =>
    ["SUBMITTED", "COMPLETED", "DECLINED", "EXPIRED"].includes(r.status)
  );

  const filteredRequests = useMemo(() => {
    switch (tab) {
      case "pending":
        return pendingRequests;
      case "active":
        return activeRequests;
      case "completed":
        return completedRequests;
      default:
        return [];
    }
  }, [tab, pendingRequests, activeRequests, completedRequests]);

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Inbox className="w-6 h-6 text-primary" />
          피드백 인박스
          {pendingRequests.length > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
              {pendingRequests.length}
            </span>
          )}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          학생들의 피드백 요청을 확인하세요
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <Bell className="w-5 h-5 text-red-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">{pendingRequests.length}</div>
          <div className="text-[10px] text-muted-foreground">대기중</div>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">{activeRequests.length}</div>
          <div className="text-[10px] text-muted-foreground">진행중</div>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">{completedRequests.length}</div>
          <div className="text-[10px] text-muted-foreground">완료</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("pending")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors relative ${
            tab === "pending"
              ? "bg-primary text-white"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80"
          }`}
        >
          대기중
          {pendingRequests.length > 0 && tab !== "pending" && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("active")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            tab === "active"
              ? "bg-primary text-white"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80"
          }`}
        >
          진행중
        </button>
        <button
          onClick={() => setTab("completed")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            tab === "completed"
              ? "bg-primary text-white"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80"
          }`}
        >
          완료
        </button>
      </div>

      {/* Request List */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {tab === "pending"
                ? "새로운 요청이 없습니다"
                : tab === "active"
                ? "진행중인 피드백이 없습니다"
                : "완료된 피드백이 없습니다"}
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => {
            const acceptDeadline =
              request.status === "SENT" && request.acceptDeadline
                ? getRemainingTime(request.acceptDeadline)
                : null;
            const submitDeadline =
              request.status === "ACCEPTED" && request.submitDeadline
                ? getRemainingTime(request.submitDeadline)
                : null;

            return (
              <Link
                key={request.id}
                href={`/inbox/${request.id}`}
                className="block bg-card rounded-xl p-4 border border-border hover:border-primary/30 hover:shadow-sm transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <RequestStatusChip status={request.status} />
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
                      {PROBLEM_TYPE_LABELS[request.problemType]}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {request.creditAmount} 크레딧
                  </span>
                </div>

                {/* Content */}
                <h3 className="font-semibold text-foreground mb-1">
                  {request.composer} - {request.piece}
                </h3>
                <p className="text-sm text-primary font-mono mb-2">
                  {request.measureStart}-{request.measureEnd} 마디
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {request.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  {/* SLA Countdown */}
                  {acceptDeadline && (
                    <div
                      className={`flex items-center gap-1 text-xs ${
                        acceptDeadline.isExpired
                          ? "text-red-600"
                          : acceptDeadline.hours < 3
                          ? "text-amber-600"
                          : "text-blue-600"
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>수락 마감: {acceptDeadline.text}</span>
                    </div>
                  )}

                  {submitDeadline && (
                    <div
                      className={`flex items-center gap-1 text-xs ${
                        submitDeadline.isExpired
                          ? "text-red-600"
                          : submitDeadline.hours < 12
                          ? "text-amber-600"
                          : "text-blue-600"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>제출 마감: {submitDeadline.text}</span>
                    </div>
                  )}

                  {!acceptDeadline && !submitDeadline && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(request.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  )}

                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
