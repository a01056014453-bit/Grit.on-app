"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { safeBack } from "@/lib/navigation";
import { getUserId } from "@/lib/user-id";
import {
  ArrowLeft,
  Upload,
  Video,
  MessageSquare,
  Target,
  Plus,
  Trash2,
  CheckCircle,
  Info,
} from "lucide-react";
import type { HelpRequest } from "@/types/help";
import { HELP_PROBLEM_TYPE_LABELS } from "@/types/help";

export default function SubmitProposalPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const [request, setRequest] = useState<HelpRequest | null>(null);
  const [isLoadingRequest, setIsLoadingRequest] = useState(true);

  // Form states
  const [comments, setComments] = useState([
    { measure: "", text: "" },
    { measure: "", text: "" },
  ]);
  const [demoVideo, setDemoVideo] = useState<File | null>(null);
  const [practiceCard, setPracticeCard] = useState({
    tempo: "",
    steps: ["", ""],
    dailyTime: "15",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 요청 정보 로드
  useEffect(() => {
    async function loadRequest() {
      try {
        const res = await fetch(`/api/help-requests/${requestId}`);
        if (!res.ok) throw new Error("요청을 불러올 수 없습니다.");
        const data = await res.json();
        setRequest(data.request);
      } catch (err) {
        console.error("[help/submit] 요청 로드 실패:", err);
      } finally {
        setIsLoadingRequest(false);
      }
    }
    loadRequest();
  }, [requestId]);

  const addComment = () => {
    if (comments.length < 5) {
      setComments([...comments, { measure: "", text: "" }]);
    }
  };

  const removeComment = (index: number) => {
    if (comments.length > 2) {
      setComments(comments.filter((_, i) => i !== index));
    }
  };

  const updateComment = (index: number, field: "measure" | "text", value: string) => {
    setComments(
      comments.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  const addStep = () => {
    if (practiceCard.steps.length < 4) {
      setPracticeCard({
        ...practiceCard,
        steps: [...practiceCard.steps, ""],
      });
    }
  };

  const updateStep = (index: number, value: string) => {
    setPracticeCard({
      ...practiceCard,
      steps: practiceCard.steps.map((s, i) => (i === index ? value : s)),
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const userId = getUserId();
      const validComments = comments.filter((c) => c.measure && c.text);

      if (validComments.length < 2) {
        throw new Error("마디별 코멘트가 최소 2개 필요합니다.");
      }

      // TODO: 시연 비디오 스토리지 업로드
      const demoVideoUrl: string | undefined = undefined;
      const demoVideoLength: number | undefined = undefined;

      const res = await fetch("/api/help-proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          expertId: userId,
          comments: validComments,
          demoVideoUrl,
          demoVideoLength,
          practiceCard: {
            section: request
              ? `${request.measureStart}-${request.measureEnd}마디`
              : "",
            tempo: practiceCard.tempo,
            steps: practiceCard.steps.filter(Boolean),
            dailyTime: `${practiceCard.dailyTime}분`,
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? "제안 제출에 실패했습니다.");
      }

      router.push(`/help/${requestId}`);
    } catch (err) {
      console.error("[help/submit] 제출 실패:", err);
      setSubmitError(err instanceof Error ? err.message : "제안 제출에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = comments.filter((c) => c.measure && c.text).length >= 2;

  const typeLabel = request
    ? HELP_PROBLEM_TYPE_LABELS[request.problemType] ?? request.problemType
    : "";

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => safeBack(router)}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">해결 제안 제출</h1>
          <p className="text-xs text-muted-foreground">전문가 답변을 작성하세요</p>
        </div>
      </div>

      {/* Request Summary */}
      <div className="bg-secondary/50 rounded-xl p-4 mb-6">
        {isLoadingRequest ? (
          <p className="text-sm text-muted-foreground">요청 정보 로딩 중...</p>
        ) : request ? (
          <>
            <p className="text-sm font-medium text-foreground">
              {request.composer} - {request.piece}
            </p>
            <p className="text-xs text-muted-foreground">
              {request.measureStart}-{request.measureEnd} 마디 · {typeLabel} 문제
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">요청 정보를 불러올 수 없습니다.</p>
        )}
      </div>

      {/* Error Banner */}
      {submitError && (
        <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-200">
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}

      {/* Comments Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            마디별 코멘트
            <span className="text-xs text-muted-foreground">(최소 2개)</span>
          </h2>
          {comments.length < 5 && (
            <button
              onClick={addComment}
              className="text-xs text-primary flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              추가
            </button>
          )}
        </div>

        <div className="space-y-3">
          {comments.map((comment, index) => (
            <div key={index} className="bg-card rounded-xl border border-border p-3">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  placeholder="마디 (예: 33-34)"
                  value={comment.measure}
                  onChange={(e) => updateComment(index, "measure", e.target.value)}
                  className="w-24 px-2 py-1.5 rounded-lg border border-border bg-secondary text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {comments.length > 2 && (
                  <button
                    onClick={() => removeComment(index)}
                    className="ml-auto text-muted-foreground hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <textarea
                placeholder="이 구간에 대한 해결 방법을 설명하세요..."
                value={comment.text}
                onChange={(e) => updateComment(index, "text", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Demo Video */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
          <Video className="w-4 h-4 text-primary" />
          시연 영상
          <span className="text-xs text-muted-foreground">(최대 90초, 선택)</span>
        </h2>

        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
            demoVideo ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
        >
          {demoVideo ? (
            <div>
              <CheckCircle className="w-10 h-10 text-primary mx-auto mb-2" />
              <p className="font-medium text-foreground text-sm">{demoVideo.name}</p>
              <button
                onClick={() => setDemoVideo(null)}
                className="text-xs text-primary mt-2 hover:underline"
              >
                다른 영상 선택
              </button>
            </div>
          ) : (
            <label className="cursor-pointer block">
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-foreground">시연 영상 업로드</p>
              <p className="text-xs text-muted-foreground">해결 방법을 직접 보여주세요</p>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setDemoVideo(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* Practice Card */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-primary" />
          연습 처방 카드
        </h2>

        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          {/* Tempo */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">목표 템포</label>
            <input
              type="text"
              placeholder="예: ♩= 40 → 60 → 목표템포"
              value={practiceCard.tempo}
              onChange={(e) => setPracticeCard({ ...practiceCard, tempo: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted-foreground">연습 단계</label>
              {practiceCard.steps.length < 4 && (
                <button onClick={addStep} className="text-xs text-primary">
                  + 추가
                </button>
              )}
            </div>
            <div className="space-y-2">
              {practiceCard.steps.map((step, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-xs text-primary font-medium w-5">{index + 1}.</span>
                  <input
                    type="text"
                    placeholder={`${index + 1}단계 설명`}
                    value={step}
                    onChange={(e) => updateStep(index, e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Daily Time */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">일일 권장 시간</label>
            <div className="flex gap-2">
              {["10", "15", "20", "30"].map((time) => (
                <button
                  key={time}
                  onClick={() => setPracticeCard({ ...practiceCard, dailyTime: time })}
                  className={`flex-1 py-2 rounded-lg border text-sm transition-colors ${
                    practiceCard.dailyTime === time
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {time}분
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 mb-6">
        <p className="text-xs text-blue-800 flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          제출한 제안은 마감 전까지 수정할 수 있습니다. 마감 후 학생이 채택하면 보상이 지급됩니다.
        </p>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!isValid || isSubmitting}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-primary text-white font-semibold disabled:opacity-50"
      >
        {isSubmitting ? "제출 중..." : "제안 제출하기"}
      </button>
    </div>
  );
}
