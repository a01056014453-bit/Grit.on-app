"use client";

import Link from "next/link";
import { Clock, ChevronRight, AlertCircle } from "lucide-react";
import { FeedbackRequest, PROBLEM_TYPE_LABELS } from "@/types";
import { getRemainingTime } from "@/lib/feedback-store";

interface LessonRequestCardProps {
  request: FeedbackRequest;
}

export function LessonRequestCard({ request }: LessonRequestCardProps) {
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
      href={`/inbox/${request.id}`}
      className="block bg-white/60 backdrop-blur-xl rounded-2xl p-4 border border-white/60 hover:border-orange-200/60 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              request.status === "SENT"
                ? "bg-red-100/80 text-red-700"
                : request.status === "ACCEPTED"
                ? "bg-orange-100/80 text-orange-700"
                : "bg-white/60 text-gray-600"
            }`}
          >
            {request.status === "SENT"
              ? "대기중"
              : request.status === "ACCEPTED"
              ? "진행중"
              : request.status}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/60 text-gray-600 font-medium">
            {PROBLEM_TYPE_LABELS[request.problemType]}
          </span>
        </div>
        <span className="text-xs text-gray-400 font-medium">
          {request.creditAmount}C
        </span>
      </div>

      <h4 className="font-semibold text-gray-900 text-sm mb-0.5">
        {request.composer} - {request.piece}
      </h4>
      <p className="text-xs text-orange-600 font-mono mb-1.5">
        {request.measureStart}-{request.measureEnd} 마디
      </p>
      <p className="text-xs text-gray-500 line-clamp-1 mb-2">
        {request.description}
      </p>

      <div className="flex items-center justify-between pt-2 border-t border-white/40">
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
            <AlertCircle className="w-3 h-3" />
            <span>{acceptDeadline.text}</span>
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
            <Clock className="w-3 h-3" />
            <span>{submitDeadline.text}</span>
          </div>
        )}
        {!acceptDeadline && !submitDeadline && (
          <span className="text-xs text-gray-400">
            {new Date(request.createdAt).toLocaleDateString("ko-KR")}
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-gray-300" />
      </div>
    </Link>
  );
}
