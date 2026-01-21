"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Video,
  Music,
  Clock,
  Coins,
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
  const [credit, setCredit] = useState(3);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [faceBlur, setFaceBlur] = useState(true);
  const [anonymous, setAnonymous] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: 정보 입력, 2: 영상 업로드, 3: 결제 확인

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check video duration (would need actual implementation)
      setVideoFile(file);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // TODO: 실제 API 호출
    await new Promise((resolve) => setTimeout(resolve, 2000));
    router.push("/help/1"); // 생성된 요청 페이지로 이동
  };

  const canProceed = () => {
    if (step === 1) {
      return composer && piece && measureStart && measureEnd && problemType && description;
    }
    if (step === 2) {
      return videoFile !== null;
    }
    return true;
  };

  // 크레딧 분배 계산
  const participationReward = 0.3;
  const maxParticipants = Math.min(Math.floor((credit * 0.3) / participationReward), 5);
  const bonusReward = credit - (participationReward * maxParticipants);

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => step > 1 ? setStep(step - 1) : router.back()}
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
            disabled={!canProceed()}
            className="w-full py-4 rounded-xl bg-primary text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음: 크레딧 설정
          </button>
        </div>
      )}

      {/* Step 3: 결제 확인 */}
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

          {/* Credit */}
          <div>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <Coins className="w-4 h-4 text-amber-500" />
              예치 크레딧
            </h2>

            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-bold text-foreground">{credit}</span>
                <span className="text-sm text-muted-foreground">크레딧</span>
              </div>

              <input
                type="range"
                min={2}
                max={5}
                value={credit}
                onChange={(e) => setCredit(Number(e.target.value))}
                className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer accent-primary"
              />

              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>
            </div>

            {/* Credit Distribution */}
            <div className="mt-3 p-4 bg-secondary/50 rounded-xl">
              <p className="text-xs font-medium text-foreground mb-2">크레딧 분배 예상</p>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>참여 보상 (최대 {maxParticipants}명)</span>
                  <span>각 {participationReward} 크레딧</span>
                </div>
                <div className="flex justify-between">
                  <span>채택 보너스</span>
                  <span className="text-primary font-medium">{bonusReward.toFixed(1)} 크레딧</span>
                </div>
              </div>
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
              <div className="flex justify-between">
                <span className="text-muted-foreground">예치 크레딧</span>
                <span className="text-amber-600 font-bold">{credit} 크레딧</span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-xs text-blue-800 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              크레딧은 에스크로에 보관되며, 채택 완료 시 전문가에게 지급됩니다.
              마감 후 1건은 반드시 채택해야 합니다.
            </p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-violet-600 text-white font-semibold disabled:opacity-50"
          >
            {isSubmitting ? "요청 생성 중..." : `${credit} 크레딧으로 요청 생성`}
          </button>
        </div>
      )}
    </div>
  );
}
