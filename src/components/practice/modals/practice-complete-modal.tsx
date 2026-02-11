"use client";

import { Music, Trophy, Clock, Flame, Target, TrendingUp } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { formatTime } from "@/lib/format";
import type { PracticeType, Song } from "@/types";
import { useMemo } from "react";

interface CompletedSession {
  totalTime: number;
  practiceTime: number;
  practiceType: PracticeType;
  startTime?: Date;
  endTime?: Date;
}

interface PracticeCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSong: Song;
  completedSession: CompletedSession | null;
  onViewRecording: () => void;
}

// 연습 성과에 따른 멘트 생성
function getPracticeMessage(practiceTime: number, totalTime: number): {
  title: string;
  subtitle: string;
  message: string;
  icon: "trophy" | "flame" | "target" | "trending";
  messageType: "excellent" | "good" | "encourage" | "push";
} {
  const concentration = totalTime > 0 ? practiceTime / totalTime : 0;
  const practiceMinutes = practiceTime / 60;

  // 훌륭함: 30분 이상 + 집중도 70% 이상
  if (practiceMinutes >= 30 && concentration >= 0.7) {
    const messages = [
      { title: "완벽한 연습!", subtitle: "오늘 정말 대단했어요", message: "이 정도 집중력이면 프로 연주자도 부럽지 않아요! 오늘의 노력이 무대 위에서 빛날 거예요." },
      { title: "최고의 연습!", subtitle: "프로의 자세가 느껴져요", message: "집중력과 연습량 모두 완벽! 이런 연습이 실력을 만듭니다." },
      { title: "놀라운 집중력!", subtitle: "정말 잘하고 있어요", message: "오늘 같은 연습을 꾸준히 하면 어떤 곡도 정복할 수 있어요!" },
    ];
    const selected = messages[Math.floor(Math.random() * messages.length)];
    return { ...selected, icon: "trophy", messageType: "excellent" };
  }

  // 좋음: 15분 이상 + 집중도 50% 이상
  if (practiceMinutes >= 15 && concentration >= 0.5) {
    const messages = [
      { title: "좋은 연습이었어요!", subtitle: "오늘도 성장했어요", message: "꾸준함이 실력이 됩니다. 내일도 이 페이스를 유지해보세요!" },
      { title: "잘하고 있어요!", subtitle: "한 걸음씩 나아가는 중", message: "오늘의 연습이 내일의 실력이 돼요. 조금만 더 집중하면 완벽해질 거예요!" },
      { title: "수고했어요!", subtitle: "좋은 시작이에요", message: "연습은 배신하지 않아요. 다음엔 조금 더 몰입해볼까요?" },
    ];
    const selected = messages[Math.floor(Math.random() * messages.length)];
    return { ...selected, icon: "flame", messageType: "good" };
  }

  // 응원: 5분 이상 연습했지만 집중도가 낮음
  if (practiceMinutes >= 5) {
    const messages = [
      { title: "시작이 반이에요!", subtitle: "다음엔 더 집중해볼까요?", message: "연습대에 앉은 것만으로도 대단해요! 다음엔 핸드폰을 멀리 두고 시작해보세요." },
      { title: "괜찮아요!", subtitle: "누구나 그런 날이 있어요", message: "집중이 안 되는 날도 있죠. 내일은 타이머를 켜고 25분만 몰입해보는 건 어때요?" },
      { title: "아쉽지만 괜찮아요!", subtitle: "연습하려는 마음이 중요해요", message: "컨디션이 안 좋았나 봐요. 충분히 쉬고 내일 다시 도전해봐요!" },
    ];
    const selected = messages[Math.floor(Math.random() * messages.length)];
    return { ...selected, icon: "target", messageType: "encourage" };
  }

  // 자극: 5분 미만 연습 (부드러운 응원)
  const messages = [
    { title: "오늘은 여기까지!", subtitle: "내일 다시 만나요", message: "짧아도 괜찮아요. 내일은 5분만 더 해보는 건 어떨까요?" },
    { title: "다음에 더 해봐요!", subtitle: "시작이 중요해요", message: "피아노 앞에 앉은 것만으로도 첫 걸음이에요. 내일도 함께해요!" },
    { title: "조금 아쉬워요!", subtitle: "괜찮아요, 다음 기회가 있어요", message: "오늘은 컨디션이 안 좋았나 봐요. 내일 10분 목표로 도전해볼까요?" },
    { title: "내일 다시!", subtitle: "포기하지 마세요", message: "매일 조금씩이 실력이 됩니다. 내일은 꼭 해봐요!" },
  ];
  const selected = messages[Math.floor(Math.random() * messages.length)];
  return { ...selected, icon: "trending", messageType: "push" };
}

export function PracticeCompleteModal({
  isOpen,
  onClose,
  selectedSong,
  completedSession,
  onViewRecording,
}: PracticeCompleteModalProps) {
  const formatDateTime = (date: Date) => {
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const practiceResult = useMemo(() => {
    if (!completedSession) return null;
    return getPracticeMessage(completedSession.practiceTime, completedSession.totalTime);
  }, [completedSession]);

  const concentration = completedSession && completedSession.totalTime > 0
    ? Math.round((completedSession.practiceTime / completedSession.totalTime) * 100)
    : 0;

  const getConcentrationColor = (percent: number) => {
    if (percent >= 70) return "text-green-600";
    if (percent >= 50) return "text-yellow-600";
    if (percent >= 30) return "text-orange-500";
    return "text-red-500";
  };

  const IconComponent = practiceResult?.icon === "trophy" ? Trophy
    : practiceResult?.icon === "flame" ? Flame
    : practiceResult?.icon === "target" ? Target
    : TrendingUp;

  const iconBgColor = practiceResult?.messageType === "excellent" ? "bg-yellow-100"
    : practiceResult?.messageType === "good" ? "bg-green-100"
    : practiceResult?.messageType === "encourage" ? "bg-blue-100"
    : "bg-gray-100";

  const iconColor = practiceResult?.messageType === "excellent" ? "text-yellow-600"
    : practiceResult?.messageType === "good" ? "text-green-600"
    : practiceResult?.messageType === "encourage" ? "text-blue-600"
    : "text-gray-600";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      showClose={false}
    >
      <div className="p-6 text-center">
        {/* Icon */}
        <div className={`w-20 h-20 ${iconBgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <IconComponent className={`w-10 h-10 ${iconColor}`} />
        </div>

        <h3 className="text-xl font-bold text-black mb-1">
          {practiceResult?.title || "연습 완료!"}
        </h3>
        <p className="text-gray-500 mb-6">
          {practiceResult?.subtitle || "오늘도 수고하셨어요"}
        </p>

        {/* Session Time Info */}
        {completedSession?.startTime && completedSession?.endTime && (
          <div className="flex items-center justify-center gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">시작</span>
              <span className="font-semibold text-black">
                {formatDateTime(completedSession.startTime)}
              </span>
            </div>
            <span className="text-gray-300">→</span>
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
              <span className="text-gray-500">종료</span>
              <span className="font-semibold text-black">
                {formatDateTime(completedSession.endTime)}
              </span>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Music className="w-5 h-5 text-black" />
            <span className="font-medium text-black">
              {selectedSong.title}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-black">
                {completedSession ? formatTime(completedSession.totalTime) : "00:00"}
              </div>
              <div className="text-xs text-gray-500">총 시간</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-black">
                {completedSession ? formatTime(completedSession.practiceTime) : "00:00"}
              </div>
              <div className="text-xs text-gray-500">순연습</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${getConcentrationColor(concentration)} flex items-center justify-center gap-1`}>
                {concentration}%
              </div>
              <div className="text-xs text-gray-500">집중도</div>
            </div>
          </div>
        </div>

        {/* Dynamic Message */}
        {practiceResult && (
          <div className={`rounded-xl p-4 mb-6 ${
            practiceResult.messageType === "excellent" ? "bg-yellow-50 border border-yellow-200" :
            practiceResult.messageType === "good" ? "bg-green-50 border border-green-200" :
            practiceResult.messageType === "encourage" ? "bg-blue-50 border border-blue-200" :
            "bg-gray-100"
          }`}>
            <p className={`text-sm ${
              practiceResult.messageType === "excellent" ? "text-yellow-800" :
              practiceResult.messageType === "good" ? "text-green-800" :
              practiceResult.messageType === "encourage" ? "text-blue-800" :
              "text-gray-700"
            }`}>
              {practiceResult.message}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={onClose}
            className="w-full py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-900 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </Modal>
  );
}
