"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Music, Target, Play, Pause, SkipForward, Lightbulb, TrendingUp, Volume2, Activity } from "lucide-react";
import type { AnalysisResult, PracticeSegment } from "@/app/api/analyze-practice/route";

// 순 연습시간 게이지 컴포넌트
function PracticeGauge({ percent }: { percent: number }) {
  const clampedPercent = Math.min(100, Math.max(0, percent));
  // 색상: 80%+ 초록, 60%+ 보라, 그 이하 주황
  const gaugeColor =
    clampedPercent >= 80
      ? "from-green-400 to-emerald-500"
      : clampedPercent >= 60
      ? "from-violet-500 to-purple-600"
      : "from-amber-400 to-orange-500";

  return (
    <div className="text-center">
      <p className="text-3xl font-bold text-gray-900 mb-1">
        {clampedPercent}%
      </p>
      <p className="text-xs text-gray-500 mb-3">순 연습시간</p>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${gaugeColor} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
    </div>
  );
}

interface PracticeAnalysisModalProps {
  isOpen: boolean;
  isAnalyzing: boolean;
  analysisResult: AnalysisResult | null;
  audioUrl?: string;
  dailyGoal?: number;
  songName?: string;
  todoNote?: string;
  onClose: () => void;
  onSave: () => void;
  onDiscard: () => void;
}

// AI 코칭 피드백 생성
function generateCoachingFeedback(result: AnalysisResult): string[] {
  const feedbacks: string[] = [];
  const { summary, netPracticeTime, totalDuration } = result;
  const practiceRatio = totalDuration > 0 ? netPracticeTime / totalDuration : 0;

  // 연습 집중도 피드백
  if (practiceRatio >= 0.8) {
    feedbacks.push("집중력이 매우 훌륭합니다! 연습 시간의 대부분을 실제 연주에 활용했어요.");
  } else if (practiceRatio >= 0.6) {
    feedbacks.push("적절한 휴식을 취하며 연습하셨네요. 집중력 유지에 좋은 패턴입니다.");
  } else if (practiceRatio >= 0.4) {
    feedbacks.push("휴식 시간이 조금 길었습니다. 짧은 구간을 정해 집중 연습해보세요.");
  } else {
    feedbacks.push("연습보다 휴식이 더 많았어요. 타이머를 설정해 집중 시간을 늘려보세요.");
  }

  // 휴식 시간 피드백
  const restPercent = 100 - summary.instrumentPercent;
  if (restPercent > 50) {
    feedbacks.push("휴식이 많았습니다. 짧은 구간을 정해 집중 연습해보세요.");
  } else if (restPercent > 30) {
    feedbacks.push("적절한 휴식과 연주를 반복했네요. 좋은 연습 패턴입니다.");
  }

  // 연습 시간에 따른 피드백
  const practiceMinutes = netPracticeTime / 60;
  if (practiceMinutes >= 60) {
    feedbacks.push("1시간 이상 연습하셨네요! 꾸준함이 실력을 만듭니다.");
  } else if (practiceMinutes >= 30) {
    feedbacks.push("30분 이상 집중 연습, 좋은 시작입니다!");
  } else if (practiceMinutes < 10) {
    feedbacks.push("짧은 연습이었지만 꾸준히 하면 실력이 늘어요. 내일도 화이팅!");
  }

  return feedbacks.slice(0, 2); // 최대 2개만
}

export function PracticeAnalysisModal({
  isOpen,
  isAnalyzing,
  analysisResult,
  audioUrl,
  dailyGoal = 60,
  songName,
  todoNote,
  onClose,
  onSave,
  onDiscard,
}: PracticeAnalysisModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Handle time update for progress bar
  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  }, []);

  // Handle play/pause
  const handlePlayPause = useCallback(() => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying, audioUrl]);

  // Seek to specific time
  const handleSeek = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
    if (!isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Handle audio loaded
  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      const audioDuration = audioRef.current.duration;
      // Handle Infinity or NaN (common with blob URLs)
      if (isFinite(audioDuration) && !isNaN(audioDuration)) {
        setDuration(audioDuration);
      }
    }
  }, []);

  // Handle audio ended
  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    setCurrentTime(0);
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setCurrentTime(0);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTimeDisplay = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.round(seconds % 60);
    if (hrs > 0) {
      return `${hrs}시간 ${mins}분`;
    }
    return `${mins}분 ${secs}초`;
  };

  const formatTimeShort = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
      return "0:00";
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  // 분석 중 화면
  if (isAnalyzing) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
          </div>
          <h3 className="text-xl font-bold text-black mb-2">연습 분석 중...</h3>
          <p className="text-sm text-gray-500 mb-4">
            AI가 녹음을 스캔하고 있습니다
          </p>
          <div className="space-y-2 text-left bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              연주 구간 감지 중
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              휴식 구간 분리 중
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
              순수 연습 시간 계산 중
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 분석 결과 화면
  if (!analysisResult) return null;

  const { totalDuration, netPracticeTime, restTime, summary, segments } = analysisResult;
  const goalProgress = Math.min((netPracticeTime / 60 / dailyGoal) * 100, 100);
  const coachingFeedbacks = generateCoachingFeedback(analysisResult);

  // 타임라인 세그먼트 색상 (연주 vs 휴식)
  const getSegmentColor = (type: string) => {
    return type === "instrument" ? "bg-violet-500" : "bg-gray-300";
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="min-h-full flex items-start justify-center p-4 py-8">
      <div className="bg-white rounded-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
        {/* Header - 메인 결과 */}
        <div className="p-6 pb-4 text-center bg-gradient-to-br from-violet-500 to-purple-600 rounded-t-2xl">
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Music className="w-8 h-8 text-white" />
          </div>
          {songName && (
            <p className="text-white font-semibold mb-1">{songName}</p>
          )}
          {todoNote && (
            <p className="text-violet-200 text-xs mb-2 bg-white/10 rounded-full px-3 py-1 inline-block">
              {todoNote}
            </p>
          )}
          <p className="text-violet-100 text-sm mb-1">
            총 <span className="font-semibold text-white">{formatTimeDisplay(totalDuration)}</span> 중
          </p>
          <p className="text-white text-2xl font-bold">
            실제 연주 시간은 {formatTimeDisplay(netPracticeTime)}
          </p>
          <p className="text-violet-200 text-xs mt-2">
            나머지 {formatTimeDisplay(restTime)}은 휴식 및 준비 시간입니다
          </p>
        </div>

        {/* Main Content */}
        <div className="p-5 space-y-4">
          {/* 목표 달성률 */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-violet-500" />
                <span className="text-sm font-medium text-gray-700">Grit Gauge 반영</span>
              </div>
              <span className="text-sm font-bold text-violet-600">
                +{Math.floor(netPracticeTime / 60)}분
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-500"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              오늘의 목표 {Math.round(goalProgress)}% 달성 ({Math.floor(netPracticeTime / 60)}/{dailyGoal}분)
              {goalProgress >= 100 && " 🎉"}
            </p>
          </div>

          {/* 순 연습시간 게이지 */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-violet-500" />
              <span className="text-sm font-medium text-gray-700">AI 분석 결과</span>
            </div>
            <PracticeGauge percent={summary.instrumentPercent} />
          </div>

          {/* 타임라인 시각화 */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">연습 타임라인</span>
            </div>

            {/* 타임라인 바 */}
            <div className="relative h-8 bg-gray-200 rounded-lg overflow-hidden mb-2">
              {segments && segments.length > 0 ? (
                segments.map((seg, idx) => {
                  const startPercent = (seg.startTime / totalDuration) * 100;
                  const widthPercent = ((seg.endTime - seg.startTime) / totalDuration) * 100;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSeek(seg.startTime)}
                      className={`absolute top-0 h-full ${getSegmentColor(seg.type)} hover:opacity-80 transition-opacity`}
                      style={{
                        left: `${startPercent}%`,
                        width: `${Math.max(widthPercent, 0.5)}%`,
                      }}
                      title={`${seg.type}: ${formatTimeShort(seg.startTime)} - ${formatTimeShort(seg.endTime)}`}
                    />
                  );
                })
              ) : (
                // 세그먼트가 없을 때 summary 기반으로 표시 (연주/휴식)
                <>
                  <div
                    className="absolute top-0 h-full bg-violet-500"
                    style={{ left: 0, width: `${summary.instrumentPercent}%` }}
                  />
                </>
              )}

              {/* 재생 위치 표시 */}
              {audioUrl && duration > 0 && (
                <div
                  className="absolute top-0 w-0.5 h-full bg-black z-10"
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                />
              )}
            </div>

            {/* 범례 */}
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px]">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                <span className="text-gray-600">연주 {summary.instrumentPercent}%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                <span className="text-gray-600">휴식 {100 - summary.instrumentPercent}%</span>
              </div>
            </div>
          </div>

          {/* 다시 듣기 */}
          {audioUrl && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Volume2 className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">다시 듣기</span>
                <span className="text-xs text-gray-400 ml-auto">
                  {formatTimeShort(currentTime)} / {formatTimeShort(duration || totalDuration)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlayPause}
                  className="w-10 h-10 rounded-full bg-black flex items-center justify-center hover:bg-gray-800 shrink-0"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-white" fill="currentColor" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                  )}
                </button>
                <div
                  className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    handleSeek(percent * (duration || totalDuration));
                  }}
                >
                  <div
                    className="h-full bg-black rounded-full transition-all duration-100"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                타임라인의 구간을 클릭하면 해당 위치로 이동합니다
              </p>
              {/* Hidden audio element */}
              <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                preload="metadata"
              />
            </div>
          )}

          {/* AI 코칭 피드백 */}
          <div className="bg-violet-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-violet-500" />
              <span className="text-sm font-medium text-violet-700">AI 코칭</span>
            </div>
            <div className="space-y-2">
              {coachingFeedbacks.map((feedback, idx) => (
                <p key={idx} className="text-sm text-violet-800">
                  • {feedback}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onDiscard}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            저장 안함
          </button>
          <button
            onClick={onSave}
            className="flex-1 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            저장하기
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
