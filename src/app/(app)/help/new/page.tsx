"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { safeBack } from "@/lib/navigation";
import { getUserId } from "@/lib/user-id";
import { ComposerAutocomplete, TitleAutocomplete } from "@/components/ui/composer-autocomplete";
import {
  ArrowLeft,
  Upload,
  Video,
  Music,
  Clock,
  Shield,
  Eye,
  EyeOff,
  Info,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const problemTypes = [
  { value: "rhythm", label: "리듬", description: "박자, 점음표, 싱코페이션 등" },
  { value: "tempo", label: "템포", description: "속도 유지, 루바토, 점진적 변화" },
  { value: "hands", label: "양손 합", description: "왼손/오른손 조화, 타이밍" },
  { value: "pedal", label: "페달", description: "페달링, 잔향, 소리 혼탁" },
  { value: "voicing", label: "보이싱", description: "성부 분리, 멜로디 강조" },
  { value: "technique", label: "테크닉", description: "트릴, 옥타브, 아르페지오 등" },
  { value: "expression", label: "표현", description: "다이나믹, 프레이징, 감정" },
  { value: "other", label: "기타", description: "위 항목에 해당하지 않는 문제" },
];

const deadlineOptions = [
  { value: 24, label: "24시간", description: "빠른 응답" },
  { value: 48, label: "48시간", description: "권장" },
  { value: 72, label: "72시간", description: "여유있게" },
];

export default function NewHelpRequestPage() {
  const router = useRouter();

  // Form states
  const [composer, setComposer] = useState("");
  const [piece, setPiece] = useState("");
  const [measureStart, setMeasureStart] = useState("");
  const [measureEnd, setMeasureEnd] = useState("");
  const [problemType, setProblemType] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState(48);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [faceBlur, setFaceBlur] = useState(true);
  const [anonymous, setAnonymous] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1: 정보 입력, 2: 영상 업로드, 3: 확인

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const userId = getUserId();

      // 비디오 업로드
      let videoUrl: string | undefined;
      let videoLength: number | undefined;
      if (videoFile) {
        const formData = new FormData();
        formData.append("file", videoFile);
        formData.append("requestId", `help-${Date.now()}`);
        formData.append("type", "student");
        const uploadRes = await fetch("/api/feedback/upload-video", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.success) videoUrl = uploadData.url;
      }

      const res = await fetch("/api/help-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: userId,
          composer,
          piece,
          measureStart: Number(measureStart),
          measureEnd: Number(measureEnd),
          problemType,
          description,
          videoUrl,
          videoLength,
          faceBlurred: faceBlur,
          isAnonymous: anonymous,
          deadlineHours: deadline,
          credit: 0,
          maxProposals: 5,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? "요청 생성에 실패했습니다.");
      }

      const data = await res.json();
      router.push(`/help/${data.request.id}`);
    } catch (err) {
      console.error("[help/new] 제출 실패:", err);
      setSubmitError(err instanceof Error ? err.message : "요청 생성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 1) {
      return composer && piece && measureStart && measureEnd && problemType && description;
    }
    if (step === 2) {
      return true; // 영상은 선택사항으로 변경
    }
    return true;
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => step > 1 ? setStep(step - 1) : safeBack(router)}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">새 해결 요청</h1>
          <p className="text-xs text-muted-foreground">단계 {step}/3</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 h-1.5 rounded-full ${
              s <= step ? "bg-primary" : "bg-secondary"
            }`}
          />
        ))}
      </div>

      {/* Error Banner */}
      {submitError && (
        <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-200">
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}

      {/* Step 1: 정보 입력 */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Composer & Piece */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Music className="w-4 h-4 text-primary" />
              곡 정보
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <ComposerAutocomplete
                value={composer}
                onChange={setComposer}
                label="작곡가"
                placeholder="F. Chopin"
              />
              <TitleAutocomplete
                value={piece}
                onChange={setPiece}
                composer={composer}
                label="곡 제목"
                placeholder="Ballade No.1"
              />
            </div>
          </div>

          {/* Measures */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">문제 구간 (마디)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="시작"
                value={measureStart}
                onChange={(e) => setMeasureStart(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-muted-foreground">~</span>
              <input
                type="number"
                placeholder="끝"
                value={measureEnd}
                onChange={(e) => setMeasureEnd(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Problem Type */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-2">문제 유형</h2>
            <div className="grid grid-cols-2 gap-2">
              {problemTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setProblemType(type.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    problemType === type.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <span className="text-sm font-medium text-foreground">{type.label}</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              문제 설명 <span className="text-primary">*</span>
            </label>
            <textarea
              placeholder="어떤 부분이 어떻게 안 되는지 구체적으로 설명해주세요..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
            <p className="text-[10px] text-muted-foreground mt-1 text-right">
              {description.length}/200
            </p>
          </div>

          {/* Next Button */}
          <button
            onClick={() => setStep(2)}
            disabled={!canProceed()}
            className="w-full py-4 rounded-xl bg-primary text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음: 영상 업로드
          </button>
        </div>
      )}

      {/* Step 2: 영상 업로드 */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Video Upload */}
          <div>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <Video className="w-4 h-4 text-primary" />
              문제 영상 업로드
              <span className="text-xs text-muted-foreground font-normal">(선택)</span>
            </h2>

            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                videoFile ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              {videoFile ? (
                <div>
                  <CheckCircle className="w-12 h-12 text-primary mx-auto mb-3" />
                  <p className="font-medium text-foreground">{videoFile.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                  <button
                    onClick={() => setVideoFile(null)}
                    className="text-sm text-primary mt-3 hover:underline"
                  >
                    다른 영상 선택
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium text-foreground">영상을 업로드하세요</p>
                  <p className="text-sm text-muted-foreground mt-1">30-60초, 최대 100MB</p>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                영상에서 문제 구간을 연주하는 모습을 촬영해주세요. 손과 건반이 잘 보여야 합니다.
              </p>
            </div>
          </div>

          {/* Privacy Options */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              개인정보 보호
            </h2>

            <button
              onClick={() => setFaceBlur(!faceBlur)}
              className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
                faceBlur ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              <div className="flex items-center gap-3">
                {faceBlur ? <Eye className="w-5 h-5 text-primary" /> : <EyeOff className="w-5 h-5 text-muted-foreground" />}
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">얼굴 자동 블러</p>
                  <p className="text-xs text-muted-foreground">AI가 얼굴을 자동으로 블러 처리</p>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors ${faceBlur ? "bg-primary" : "bg-secondary"}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform mt-0.5 ${faceBlur ? "translate-x-6" : "translate-x-0.5"}`} />
              </div>
            </button>

            <button
              onClick={() => setAnonymous(!anonymous)}
              className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
                anonymous ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">익명으로 요청</p>
                  <p className="text-xs text-muted-foreground">이름과 프로필이 공개되지 않음</p>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors ${anonymous ? "bg-primary" : "bg-secondary"}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform mt-0.5 ${anonymous ? "translate-x-6" : "translate-x-0.5"}`} />
              </div>
            </button>
          </div>

          {/* Next Button */}
          <button
            onClick={() => setStep(3)}
            className="w-full py-4 rounded-xl bg-primary text-white font-semibold"
          >
            다음: 요청 확인
          </button>
        </div>
      )}

      {/* Step 3: 요청 확인 */}
      {step === 3 && (
        <div className="space-y-5">
          {/* Deadline */}
          <div>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-primary" />
              마감 시간
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {deadlineOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDeadline(option.value)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    deadline === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <span className="text-lg font-bold text-foreground">{option.label}</span>
                  <p className="text-[10px] text-muted-foreground">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">요청 요약</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">곡</span>
                <span className="text-foreground font-medium">{composer} - {piece}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">구간</span>
                <span className="text-foreground font-medium">{measureStart}-{measureEnd} 마디</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">문제 유형</span>
                <span className="text-foreground font-medium">
                  {problemTypes.find((t) => t.value === problemType)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">마감</span>
                <span className="text-foreground font-medium">{deadline}시간</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-violet-600 text-white font-semibold disabled:opacity-50"
          >
            {isSubmitting ? "요청 생성 중..." : "도움 요청 생성"}
          </button>
        </div>
      )}
    </div>
  );
}
