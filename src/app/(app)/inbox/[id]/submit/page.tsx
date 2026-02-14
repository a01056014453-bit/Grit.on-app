"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Video,
  Music,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { getFeedbackRequestById, saveFeedback, getRemainingTime } from "@/lib/feedback-store";
import { FeedbackComment, PracticeCard } from "@/types";

interface CommentDraft {
  measureStart: string;
  measureEnd: string;
  text: string;
}

export default function SubmitFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const request = getFeedbackRequestById(requestId);

  // Form states
  const [comments, setComments] = useState<CommentDraft[]>([
    { measureStart: "", measureEnd: "", text: "" },
    { measureStart: "", measureEnd: "", text: "" },
    { measureStart: "", measureEnd: "", text: "" },
  ]);
  const [demoVideo, setDemoVideo] = useState<File | null>(null);
  const [practiceSection, setPracticeSection] = useState("");
  const [practiceTempo, setPracticeTempo] = useState("");
  const [practiceSteps, setPracticeSteps] = useState(["", "", ""]);
  const [dailyMinutes, setDailyMinutes] = useState("15");

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const submitDeadline = request.submitDeadline
    ? getRemainingTime(request.submitDeadline)
    : null;

  const addComment = () => {
    setComments([...comments, { measureStart: "", measureEnd: "", text: "" }]);
  };

  const removeComment = (index: number) => {
    if (comments.length <= 3) return; // Minimum 3 comments
    setComments(comments.filter((_, i) => i !== index));
  };

  const updateComment = (index: number, field: keyof CommentDraft, value: string) => {
    const updated = [...comments];
    updated[index][field] = value;
    setComments(updated);
  };

  const addPracticeStep = () => {
    setPracticeSteps([...practiceSteps, ""]);
  };

  const removePracticeStep = (index: number) => {
    if (practiceSteps.length <= 2) return;
    setPracticeSteps(practiceSteps.filter((_, i) => i !== index));
  };

  const updatePracticeStep = (index: number, value: string) => {
    const updated = [...practiceSteps];
    updated[index] = value;
    setPracticeSteps(updated);
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDemoVideo(file);
    }
  };

  const isFormValid = () => {
    // At least 3 comments with content
    const validComments = comments.filter(
      (c) => c.measureStart && c.text.trim()
    );
    if (validComments.length < 3) return false;

    // Practice card required fields
    if (!practiceSection || !practiceTempo) return false;

    // At least 2 practice steps
    const validSteps = practiceSteps.filter((s) => s.trim());
    if (validSteps.length < 2) return false;

    return true;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;

    setIsSubmitting(true);

    const feedbackComments: FeedbackComment[] = comments
      .filter((c) => c.measureStart && c.text.trim())
      .map((c) => ({
        measureStart: parseInt(c.measureStart),
        measureEnd: c.measureEnd ? parseInt(c.measureEnd) : parseInt(c.measureStart),
        text: c.text.trim(),
      }));

    const practiceCard: PracticeCard = {
      section: practiceSection,
      tempoProgression: practiceTempo,
      steps: practiceSteps.filter((s) => s.trim()),
      dailyMinutes: parseInt(dailyMinutes) || 15,
    };

    saveFeedback({
      requestId,
      comments: feedbackComments,
      demoVideoUrl: demoVideo ? "/videos/demo.mp4" : undefined,
      practiceCard,
    });

    await new Promise((resolve) => setTimeout(resolve, 1500));
    router.push("/inbox");
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-32 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">피드백 작성</h1>
          <p className="text-xs text-muted-foreground">
            {request.composer} - {request.piece}
          </p>
        </div>
      </div>

      {/* SLA Warning */}
      {submitDeadline && (
        <div
          className={`rounded-xl p-3 mb-6 flex items-center gap-2 ${
            submitDeadline.isExpired
              ? "bg-red-50 border border-red-200"
              : submitDeadline.hours < 12
              ? "bg-amber-50 border border-amber-200"
              : "bg-blue-50 border border-blue-200"
          }`}
        >
          <Clock
            className={`w-4 h-4 ${
              submitDeadline.isExpired
                ? "text-red-500"
                : submitDeadline.hours < 12
                ? "text-amber-500"
                : "text-blue-500"
            }`}
          />
          <span
            className={`text-sm ${
              submitDeadline.isExpired
                ? "text-red-700"
                : submitDeadline.hours < 12
                ? "text-amber-700"
                : "text-blue-700"
            }`}
          >
            제출 마감: {submitDeadline.text}
          </span>
        </div>
      )}

      {/* Comments Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Music className="w-4 h-4 text-primary" />
            마디별 코멘트 (최소 3개)
          </h2>
          <button
            onClick={addComment}
            className="text-xs text-primary font-medium flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            추가
          </button>
        </div>

        <div className="space-y-4">
          {comments.map((comment, index) => (
            <div key={index} className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">
                  코멘트 {index + 1}
                </span>
                {comments.length > 3 && (
                  <button
                    onClick={() => removeComment(index)}
                    className="text-red-500 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex gap-2 mb-3">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground mb-1 block">
                    시작 마디
                  </label>
                  <input
                    type="number"
                    value={comment.measureStart}
                    onChange={(e) => updateComment(index, "measureStart", e.target.value)}
                    placeholder="1"
                    className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground mb-1 block">
                    끝 마디 (선택)
                  </label>
                  <input
                    type="number"
                    value={comment.measureEnd}
                    onChange={(e) => updateComment(index, "measureEnd", e.target.value)}
                    placeholder="4"
                    className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <textarea
                value={comment.text}
                onChange={(e) => updateComment(index, "text", e.target.value)}
                placeholder="이 구간에 대한 피드백을 작성하세요..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Demo Video */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Video className="w-4 h-4 text-primary" />
          시연 영상 (선택)
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
              <p className="text-xs text-muted-foreground mt-1">
                {(demoVideo.size / 1024 / 1024).toFixed(1)} MB
              </p>
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
              <p className="font-medium text-foreground text-sm">시연 영상 업로드</p>
              <p className="text-xs text-muted-foreground mt-1">2-3분 권장</p>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* Practice Card */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Music className="w-4 h-4 text-primary" />
          연습 처방 카드
        </h2>

        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200 space-y-4">
          {/* Section */}
          <div>
            <label className="text-xs text-emerald-700 mb-1 block">연습 구간 *</label>
            <input
              type="text"
              value={practiceSection}
              onChange={(e) => setPracticeSection(e.target.value)}
              placeholder="예: 마디 32-48"
              className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          {/* Tempo */}
          <div>
            <label className="text-xs text-emerald-700 mb-1 block">템포 진행 *</label>
            <input
              type="text"
              value={practiceTempo}
              onChange={(e) => setPracticeTempo(e.target.value)}
              placeholder="예: BPM 60 → 80 → 100"
              className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-emerald-700">연습 순서 (최소 2개) *</label>
              <button
                onClick={addPracticeStep}
                className="text-[10px] text-emerald-700 font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                추가
              </button>
            </div>
            <div className="space-y-2">
              {practiceSteps.map((step, index) => (
                <div key={index} className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-700 text-[10px] flex items-center justify-center shrink-0 font-bold mt-2">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={step}
                    onChange={(e) => updatePracticeStep(index, e.target.value)}
                    placeholder={`연습 단계 ${index + 1}`}
                    className="flex-1 px-3 py-2 rounded-lg border border-emerald-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                  {practiceSteps.length > 2 && (
                    <button
                      onClick={() => removePracticeStep(index)}
                      className="text-red-500 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Daily Minutes */}
          <div>
            <label className="text-xs text-emerald-700 mb-1 block">하루 권장 연습 시간</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={dailyMinutes}
                onChange={(e) => setDailyMinutes(e.target.value)}
                className="w-20 px-3 py-2 rounded-lg border border-emerald-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
              <span className="text-sm text-emerald-700">분</span>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Warning */}
      {!isFormValid() && (
        <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            최소 3개의 마디별 코멘트와 연습 처방 카드를 완성해 주세요.
          </p>
        </div>
      )}

      {/* Fixed Submit Button */}
      <div className="fixed bottom-20 left-0 right-0 px-4 py-3 bg-background/80 backdrop-blur-lg border-t border-border">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!isFormValid() || isSubmitting}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-violet-600 text-white font-semibold shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              "제출 중..."
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                피드백 제출하기
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
