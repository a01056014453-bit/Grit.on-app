"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeBack } from "@/lib/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Video,
  Music,
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
import { getTeacherById, createFeedbackRequest, updateFeedbackRequestStatus } from "@/lib/queries";
import { addNotification } from "@/lib/notification-store";
import { sendPushToUser } from "@/lib/push-notify";
import { getUserId } from "@/lib/user-id";
import { useVideoUpload } from "@/hooks/useVideoUpload";
import { getCreditBalance } from "@/lib/queries/credits";
import { Teacher, ProblemType, PROBLEM_TYPE_LABELS } from "@/types";
import { ComposerAutocomplete, TitleAutocomplete } from "@/components/ui/composer-autocomplete";

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
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const FEEDBACK_COST = 2; // 피드백 1건 = 2크레딧

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
  const [submitError, setSubmitError] = useState("");
  const [step, setStep] = useState(1); // 1: 선생님 확인, 2: 곡 정보, 3: 영상 업로드

  const videoUpload = useVideoUpload({ type: "student" });

  useEffect(() => {
    if (teacherId) {
      getTeacherById(teacherId).then((t) => setTeacher(t));
    }
    // 크레딧 잔액 조회
    const userId = getUserId();
    if (userId) {
      getCreditBalance(userId).then((b) => setCreditBalance(b.balance));
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
    setSubmitError("");

    try {
      // 1. 먼저 요청을 DRAFT로 생성 (requestId 확보)
      const request = await createFeedbackRequest({
        studentId: getUserId(),
        teacherId: teacher.id,
        composer,
        piece,
        measureStart: parseInt(measureStart),
        measureEnd: parseInt(measureEnd),
        problemType: problemType as ProblemType,
        description,
        videoUrl: undefined,
        faceBlurred: faceBlur,
        status: "DRAFT",
        creditAmount: FEEDBACK_COST,
        paymentStatus: "pending",
      });

      if (!request) {
        setSubmitError("피드백 요청 생성에 실패했습니다. 다시 시도해주세요.");
        return;
      }

      // 2. 영상 업로드 (파일이 있으면)
      let videoUrl: string | undefined;
      if (videoFile) {
        const uploadedUrl = await videoUpload.upload(videoFile, request.id);
        if (!uploadedUrl) {
          setSubmitError(videoUpload.error || "영상 업로드에 실패했습니다. 다시 시도해주세요.");
          return;
        }
        videoUrl = uploadedUrl;
      }

      // 3. 영상 URL 업데이트 + SENT 전환
      await updateFeedbackRequestStatus(request.id, "SENT", {
        ...(videoUrl ? { video_url: videoUrl } : {}),
      });

      // 선생님에게 푸시 알림 발송
      sendPushToUser({
        teacherId: teacher.id,
        title: "새 피드백 요청",
        body: `${composer} - ${piece} 에 대한 피드백 요청이 도착했습니다.`,
        url: `/inbox/${request.id}`,
      }).catch(() => {}); // 푸시 실패해도 요청은 성공

      addNotification({
        type: "feedback_status",
        title: "피드백 요청 전송 완료",
        description: `${teacher?.name ?? "선생님"}에게 피드백 요청을 보냈습니다. 12시간 내 수락 여부가 결정됩니다.`,
        icon: "CheckCircle",
        actionUrl: `/feedback/${request.id}`,
      });
      router.push(`/feedback/${request.id}`);
    } catch (err) {
      console.error("Failed to create feedback request:", err);
      setSubmitError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
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
            onClick={() => safeBack(router)}
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
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet overflow-x-hidden">
      <div className="bg-blob-extra" />
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => (step > 1 ? setStep(step - 1) : safeBack(router))}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">피드백 요청</h1>
          <p className="text-xs text-muted-foreground">단계 {step}/3</p>
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
              <span className="text-xs text-violet-600 font-medium bg-violet-50 px-2 py-0.5 rounded-full">
                {FEEDBACK_COST}크레딧 필요
              </span>
              {creditBalance !== null && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  creditBalance >= FEEDBACK_COST
                    ? "text-green-600 bg-green-50"
                    : "text-red-600 bg-red-50"
                }`}>
                  잔액: {creditBalance}크레딧
                </span>
              )}
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
            <div className="space-y-3">
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
                  <p className="text-sm text-muted-foreground mt-1">문제 구간만 30초 이내 권장 (최대 50MB)</p>
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
                문제 구간만 짧게 촬영해주세요 (30초 이내 권장). 손과 악기가 잘 보여야 정확한 피드백이 가능합니다.
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

          {/* 업로드 진행률 */}
          {videoUpload.uploading && (
            <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-violet-700">영상 업로드 중...</p>
                <span className="text-sm font-bold text-violet-700">{videoUpload.progress}%</span>
              </div>
              <div className="w-full h-2 bg-violet-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-600 rounded-full transition-all duration-300"
                  style={{ width: `${videoUpload.progress}%` }}
                />
              </div>
            </div>
          )}

          {(submitError || videoUpload.error) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{submitError || videoUpload.error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || videoUpload.uploading || !canProceed()}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-violet-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {videoUpload.uploading
              ? "영상 업로드 중..."
              : isSubmitting
                ? "요청 전송 중..."
                : "피드백 요청 보내기"}
          </button>
        </div>
      )}
    </div>
  );
}
