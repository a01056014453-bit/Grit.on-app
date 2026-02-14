"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { MessageSquare, Clock, CheckCircle, Plus, ChevronRight } from "lucide-react";
import { RequestStatusChip } from "@/components/feedback/request-status-chip";
import { getFeedbackRequestsByStudent, getRemainingTime } from "@/lib/feedback-store";
import { FeedbackRequestStatus } from "@/types";

type TabType = "active" | "completed";

const activeStatuses: FeedbackRequestStatus[] = ["DRAFT", "HELD", "SENT", "ACCEPTED", "SUBMITTED"];
const completedStatuses: FeedbackRequestStatus[] = ["COMPLETED", "DECLINED", "EXPIRED", "DISPUTED", "REFUNDED"];

export default function FeedbackListPage() {
  const [tab, setTab] = useState<TabType>("active");
  const requests = getFeedbackRequestsByStudent("student1");

  const filteredRequests = useMemo(() => {
    const statuses = tab === "active" ? activeStatuses : completedStatuses;
    return requests.filter((r) => statuses.includes(r.status));
  }, [requests, tab]);

  const activeCount = requests.filter((r) => activeStatuses.includes(r.status)).length;
  const completedCount = requests.filter((r) => completedStatuses.includes(r.status)).length;

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          내 피드백 요청
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          요청한 피드백의 진행 상황을 확인하세요
        </p>
      </div>

      {/* New Request Button */}
      <Link
        href="/teachers"
        className="block w-full mb-6 py-4 rounded-xl bg-gradient-to-r from-primary to-violet-600 text-white font-semibold text-center shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
      >
        <Plus className="w-5 h-5 inline mr-2" />
        새 피드백 요청하기
      </Link>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("active")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            tab === "active"
              ? "bg-primary text-white"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80"
          }`}
        >
          진행중 ({activeCount})
        </button>
        <button
          onClick={() => setTab("completed")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            tab === "completed"
              ? "bg-primary text-white"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80"
          }`}
        >
          완료 ({completedCount})
        </button>
      </div>

      {/* Request List */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {tab === "active" ? "진행중인 요청이 없습니다" : "완료된 요청이 없습니다"}
            </p>
            {tab === "active" && (
              <Link
                href="/teachers"
                className="inline-block mt-3 text-sm text-primary font-medium"
              >
                선생님 찾아보기
              </Link>
            )}
          </div>
        ) : (
          filteredRequests.map((request) => {
            const remainingTime =
              request.status === "SENT" && request.acceptDeadline
                ? getRemainingTime(request.acceptDeadline)
                : request.status === "ACCEPTED" && request.submitDeadline
                ? getRemainingTime(request.submitDeadline)
                : null;

            return (
              <Link
                key={request.id}
                href={
                  request.status === "SUBMITTED" || request.status === "COMPLETED"
                    ? `/feedback/${request.id}/view`
                    : `/feedback/${request.id}`
                }
                className="block bg-card rounded-xl p-4 border border-border hover:border-primary/30 hover:shadow-sm transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <RequestStatusChip status={request.status} />
                  {remainingTime && !remainingTime.isExpired && (
                    <div className="flex items-center gap-1 text-xs text-primary">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{remainingTime.text}</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <h3 className="font-semibold text-foreground mb-1">
                  {request.composer} - {request.piece}
                </h3>
                <p className="text-sm text-primary font-mono mb-2">
                  {request.measureStart}-{request.measureEnd} 마디
                </p>

                {/* Teacher Info */}
                {request.teacher && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-violet-200 flex items-center justify-center text-xs font-bold text-primary">
                      {request.teacher.name.charAt(0)}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {request.teacher.name} 선생님
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                  </div>
                )}

                {/* Status-specific messages */}
                {request.status === "DECLINED" && request.declineReason && (
                  <div className="mt-2 p-2 bg-red-50 rounded-lg">
                    <p className="text-xs text-red-700">{request.declineReason}</p>
                  </div>
                )}

                {request.status === "SUBMITTED" && (
                  <div className="mt-2 p-2 bg-emerald-50 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <p className="text-xs text-emerald-700">피드백이 도착했습니다!</p>
                  </div>
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
