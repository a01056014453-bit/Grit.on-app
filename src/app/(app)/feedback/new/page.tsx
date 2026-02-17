"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Video,
  Music,
  Coins,
  Shield,
  Eye,
  EyeOff,
  Info,
  AlertCircle,
  CheckCircle,
  BadgeCheck,
  Star,
  Lock,
} from "lucide-react";
import { getTeacherById, saveFeedbackRequest, updateRequestStatus } from "@/lib/feedback-store";
import { Teacher, ProblemType, PROBLEM_TYPE_LABELS } from "@/types";

const problemTypes: { value: ProblemType; label: string; description: string }[] = [
  { value: "rhythm", label: "리듬", description: "박자, 점음표, 싱코페이션 등" },
  { value: "tempo", label: "템포", description: "속도 유지, 루바토, 점진적 변화" },
  { value: "hands", label: "양손 합", description: "왼손/오른손 조화, 타이밍" },
  { value: "pedal", label: "페달", description: "페달링, 잔향, 소리 혼탁" },
  { value: "voicing", label: "보이싱", description: "성부 분리, 멜로디 강조" },
  { value: "technique", label: "테크닉", description: "트릴, 옥타브, 아르페지오 등" },
  { value: "expression", label: "표현", description: "다이나믹, 프레이징, 감정" },
  { value: "other", label: "기타", description: "위 항목에 해당하지 않는 문제" },
];

export default function NewFeedbackRequestPage() {
  return (
    <Suspense fallback={
      <div className="px-4 py-6 max-w-lg mx-auto min-h-screen bg-blob-violet">
        <div className="bg-blob-extra" />
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    }>
      <NewFeedbackRequestContent />
    </Suspense>
  );
}

function NewFeedbackRequestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teacherId = searchParams.get("teacherId");

  // Teacher data
  const [teacher, setTeacher] = useState<Teacher | null>(null);

  // Form states
  const [composer, setComposer] = useState("");
  const [piece, setPiece] = useState("");
  const [measureStart, setMeasureStart] = useState("");
  const [measureEnd, setMeasureEnd] = useState("");
  const [problemType, setProblemType] = useState<ProblemType | "">("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [faceBlur, setFaceBlur] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: 선생님 확인, 2: 곡 정보, 3: 영상 업로드, 4: 결제 확인

  useEffect(() => {
    if (teacherId) {
      const t = getTeacherById(teacherId);
      setTeacher(t || null);
    }
  }, [teacherId]);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!teacher || !problemType) return;

    setIsSubmitting(true);

    // Save the feedback request
    const request = saveFeedbackRequest({
      studentId: "student1", // Current user ID
      teacherId: teacher.id,
      teacher,
      composer,
      piece,
      measureStart: parseInt(measureStart),
      measureEnd: parseInt(measureEnd),
      problemType: problemType as ProblemType,
      description,
      videoUrl: "/videos/sample.mp4", // Mock video URL
      faceBlurred: faceBlur,
      status: "DRAFT",
      creditAmount: teacher.priceCredits,
      paymentStatus: "pending",
    });

    // Simulate payment and send
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Update to SENT status
    updateRequestStatus(request.id, "SENT");

    router.push(`/feedback/${request.id}`);
  };

  const canProceed = () => {
    if (step === 1) return teacher !== null;
    if (step === 2) {
      return composer && piece && measureStart && measureEnd && problemType && description;
    }
    if (step === 3) return videoFile !== null;
    return true;
  };

  // No teacher selected
  if (!teacherId) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">피드백 요청</h1>
        </div>
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">선생님을 먼저 선택해주세요</p>
          <Link
            href="/teachers"
            className="inline-block px-6 py-3 rounded-xl bg-primary text-white font-semibold"
          >
            선생님 찾기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => (step > 1 ? setStep(step - 1) : router.back())}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">피드백 요청</h1>
          <p className="text-xs text-muted-foreground">단계 {step}/4</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`flex-1 h-1.5 rounded-full ${
              s <= step ? "bg-primary" : "bg-secondary"
            }`}
          />
        ))}
      </div>

      {/* Step 1: 선생님 확인 */}
      {step === 1 && teacher && (
        <div className="space-y-5">
          <h2 className="text-sm font-semibold text-foreground">선생님 확인</h2>

          <div className="bg-card rounded-xl p-4 border border-primary/30">
            <div className="flex gap-4 mb-3">
              <div className="relative w-16 h-16 shrink-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-violet-200 flex items-center justify-center text-xl font-bold text-primary">
                  {teacher.name.charAt(0)}
                </div>
                {teacher.verified && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                    <BadgeCheck className="w-4 h-4 text-primary" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">{teacher.name}</h3>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-xs font-bold">{teacher.rating}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{teacher.title}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {teacher.specialty.map((s) => (
                <span
                  key={s}
                  className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-medium"
                >
                  {s}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-sm text-muted-foreground">피드백 비용</span>
              <div className="flex items-center gap-1 text-primary">
                <Coins className="w-4 h-4" />
                <span className="font-bold">{teacher.priceCredits}</span>
                <span className="text-sm">크레딧</span>
              </div>
            </div>
          </div>

          <Link
            href="/teachers"
            className="block text-center text-sm text-primary hover:underline"
          >
            다른 선생님 선택하기
          </Link>

          <button
            onClick={() => setStep(2)}
            className="w-full py-4 rounded-xl bg-primary text-white font-semibold"
          >
            다음: 곡 정보 입력
          </button>
        </div>
      )}

      {/* Step 2: 곡 정보 입력 */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Composer & Piece */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Music className="w-4 h-4 text-primary" />
              곡 정보
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">작곡가</label>
                <input
                  type="text"
                  placeholder="F. Chopin"
                  value={composer}
                  onChange={(e) => setComposer(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">곡 제목</label>
                <input
                  type="text"
                  placeholder="Ballade No.1"
                  value={piece}
                  onChange={(e) => setPiece(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
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

          <button
            onClick={() => setStep(3)}
            disabled={!canProceed()}
            className="w-full py-4 rounded-xl bg-primary text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음: 영상 업로드
          </button>
        </div>
      )}

      {/* Step 3: 영상 업로드 */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <Video className="w-4 h-4 text-primary" />
              문제 영상 업로드
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
                {faceBlur ? (
                  <Eye className="w-5 h-5 text-primary" />
                ) : (
                  <EyeOff className="w-5 h-5 text-muted-foreground" />
                )}
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">얼굴 자동 블러</p>
                  <p className="text-xs text-muted-foreground">AI가 얼굴을 자동으로 블러 처리</p>
                </div>
              </div>
              <div
                className={`w-12 h-6 rounded-full transition-colors ${
                  faceBlur ? "bg-primary" : "bg-secondary"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow transition-transform mt-0.5 ${
                    faceBlur ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </div>
            </button>
          </div>

          <button
            onClick={() => setStep(4)}
            disabled={!canProceed()}
            className="w-full py-4 rounded-xl bg-primary text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음: 결제 확인
          </button>
        </div>
      )}

      {/* Step 4: 결제 확인 */}
      {step === 4 && teacher && (
        <div className="space-y-5">
          {/* Summary */}
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">요청 요약</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">선생님</span>
                <span className="text-foreground font-medium">{teacher.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">곡</span>
                <span className="text-foreground font-medium">
                  {composer} - {piece}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">구간</span>
                <span className="text-foreground font-medium">
                  {measureStart}-{measureEnd} 마디
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">문제 유형</span>
                <span className="text-foreground font-medium">
                  {problemType && PROBLEM_TYPE_LABELS[problemType as ProblemType]}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-gradient-to-br from-primary/5 to-violet-500/5 rounded-xl p-4 border border-primary/10">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              에스크로 결제
            </h3>

            <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg mb-3">
              <span className="text-sm text-muted-foreground">결제 금액</span>
              <div className="flex items-center gap-1 text-primary">
                <Coins className="w-5 h-5" />
                <span className="text-xl font-bold">{teacher.priceCredits}</span>
                <span className="text-sm">크레딧</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                <span>선생님 수락 시까지 크레딧이 안전하게 보관됩니다</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                <span>선생님이 거절하거나 12시간 내 응답이 없으면 자동 환불됩니다</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                <span>피드백 완료 확인 후 선생님에게 크레딧이 지급됩니다</span>
              </div>
            </div>
          </div>

          {/* SLA Info */}
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-xs text-blue-800 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              선생님은 요청 수신 후 12시간 내에 수락/거절하며, 수락 시 48시간 내에 피드백을 제출합니다.
            </p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-violet-600 text-white font-semibold disabled:opacity-50"
          >
            {isSubmitting ? "요청 전송 중..." : `${teacher.priceCredits} 크레딧으로 요청 보내기`}
          </button>
        </div>
      )}
    </div>
  );
}
