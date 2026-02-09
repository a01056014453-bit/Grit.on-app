"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Music,
  FileText,
  Clock,
  CheckCircle,
  Star,
  Sparkles,
} from "lucide-react";
import {
  getFeedbackRequestById,
  getFeedbackByRequestId,
  updateRequestStatus,
} from "@/lib/feedback-store";

export default function FeedbackViewPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const [isCompleting, setIsCompleting] = useState(false);

  const request = getFeedbackRequestById(requestId);
  const feedback = getFeedbackByRequestId(requestId);

  if (!request || !feedback) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto pb-24">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>뒤로</span>
        </button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">피드백을 찾을 수 없습니다</p>
        </div>
      </div>
    );
  }

  const handleComplete = async () => {
    setIsCompleting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    updateRequestStatus(requestId, "COMPLETED");
    router.push("/feedback");
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-32">
      {/* Header */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-muted-foreground mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>뒤로</span>
      </button>

      {/* Title */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">피드백 도착!</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {request.teacher?.name} 선생님의 피드백입니다
        </p>
      </div>

      {/* Piece Info */}
      <div className="bg-card rounded-xl p-4 border border-border mb-4">
        <h2 className="font-semibold text-foreground">
          {request.composer} - {request.piece}
        </h2>
        <p className="text-sm text-primary font-mono mt-1">
          {request.measureStart}-{request.measureEnd} 마디
        </p>
      </div>

      {/* Demo Video */}
      {feedback.demoVideoUrl && (
        <div className="bg-gradient-to-br from-primary/5 to-violet-500/5 rounded-xl p-4 border border-primary/10 mb-4">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Play className="w-4 h-4 text-primary" />
            시연 영상
          </h2>
          <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
                <Play className="w-8 h-8 text-white" />
              </div>
              <p className="text-white/70 text-sm">영상 재생</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            선생님이 직접 시연한 영상입니다
          </p>
        </div>
      )}

      {/* Comments by Measure */}
      <div className="bg-card rounded-xl p-4 border border-border mb-4">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          마디별 코멘트
        </h2>

        <div className="space-y-4">
          {feedback.comments.map((comment, index) => (
            <div key={index} className="relative pl-4 border-l-2 border-primary/30">
              <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
                {index + 1}
              </div>
              <div className="bg-secondary/30 rounded-lg p-3">
                <p className="text-xs text-primary font-mono mb-2">
                  마디 {comment.measureStart}
                  {comment.measureStart !== comment.measureEnd && `-${comment.measureEnd}`}
                </p>
                <p className="text-sm text-foreground leading-relaxed">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Practice Card */}
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200 mb-4">
        <h2 className="text-sm font-semibold text-emerald-800 mb-4 flex items-center gap-2">
          <Music className="w-4 h-4" />
          연습 처방 카드
        </h2>

        <div className="space-y-4">
          {/* Section */}
          <div>
            <span className="text-xs text-emerald-600">연습 구간</span>
            <p className="text-sm font-medium text-emerald-800 mt-0.5">
              {feedback.practiceCard.section}
            </p>
          </div>

          {/* Tempo Progression */}
          <div>
            <span className="text-xs text-emerald-600">템포 진행</span>
            <p className="text-sm font-medium text-emerald-800 mt-0.5">
              {feedback.practiceCard.tempoProgression}
            </p>
          </div>

          {/* Steps */}
          <div>
            <span className="text-xs text-emerald-600">연습 순서</span>
            <ol className="mt-2 space-y-2">
              {feedback.practiceCard.steps.map((step, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-emerald-800"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-700 text-xs flex items-center justify-center shrink-0 font-bold">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Daily Time */}
          <div className="flex items-center gap-2 pt-3 border-t border-emerald-200">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span className="text-sm text-emerald-700">
              하루 권장 연습 시간:{" "}
              <strong>{feedback.practiceCard.dailyMinutes}분</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Rating (if completed) */}
      {request.status === "COMPLETED" && (
        <div className="bg-card rounded-xl p-4 border border-border mb-4">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            내 평가
          </h2>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="w-8 h-8 text-amber-400 fill-current"
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            피드백이 도움이 되셨다면 평가를 남겨주세요
          </p>
        </div>
      )}

      {/* Fixed CTA */}
      {request.status === "SUBMITTED" && (
        <div className="fixed bottom-20 left-0 right-0 px-4 py-3 bg-background/80 backdrop-blur-lg border-t border-border">
          <div className="max-w-lg mx-auto">
            <button
              onClick={handleComplete}
              disabled={isCompleting}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-violet-600 text-white font-semibold shadow-lg shadow-primary/25 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isCompleting ? (
                "처리 중..."
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  피드백 확인 완료
                </>
              )}
            </button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              확인 완료 시 선생님에게 크레딧이 지급됩니다
            </p>
          </div>
        </div>
      )}

      {request.status === "COMPLETED" && (
        <div className="bg-green-50 rounded-xl p-4 border border-green-200 text-center">
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="font-medium text-green-700">피드백이 완료되었습니다</p>
          <p className="text-sm text-green-600 mt-1">
            선생님에게 {request.creditAmount} 크레딧이 지급되었습니다
          </p>
        </div>
      )}
    </div>
  );
}
