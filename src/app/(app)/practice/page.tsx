"use client";

import { useState, useEffect } from "react";
import { Play, Pause, Square, Music, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock songs library
const mockSongs = [
  {
    id: "1",
    title: "발라드 1번 G단조",
    composer: "F. Chopin",
    opus: "Op. 23",
    difficulty: "고급",
    duration: "9분",
    lastPracticed: "오늘",
  },
  {
    id: "2",
    title: "피아노 소나타 8번 '비창'",
    composer: "L. v. Beethoven",
    opus: "Op. 13",
    difficulty: "중급",
    duration: "18분",
    lastPracticed: "어제",
  },
  {
    id: "3",
    title: "달빛 (Clair de lune)",
    composer: "C. Debussy",
    opus: "Suite bergamasque",
    difficulty: "중급",
    duration: "5분",
    lastPracticed: "3일 전",
  },
  {
    id: "4",
    title: "라 캄파넬라",
    composer: "F. Liszt",
    opus: "S. 141",
    difficulty: "고급",
    duration: "5분",
    lastPracticed: "1주일 전",
  },
  {
    id: "5",
    title: "환상즉흥곡",
    composer: "F. Chopin",
    opus: "Op. 66",
    difficulty: "고급",
    duration: "5분",
    lastPracticed: "2주일 전",
  },
];

const PRACTICE_TIPS = [
  "천천히 연습하는 것이 가장 빠른 길입니다.",
  "어려운 부분은 리듬을 바꿔서 연습해보세요.",
  "한 손씩 따로 연습하면 더 명확해집니다.",
  "녹음해서 자신의 연주를 객관적으로 들어보세요.",
  "긴장을 풀고 호흡에 집중하세요.",
  "메트로놈을 활용하여 정확한 템포를 유지하세요.",
  "같은 구간을 5번 연속 완벽하게 치면 다음으로 넘어가세요.",
  "손목과 팔의 힘을 빼고 자연스럽게 연주하세요.",
  "어려운 패시지는 점점 빠르게 연습해보세요.",
  "눈을 감고 연주해보면 청각에 더 집중할 수 있어요.",
  "프레이징을 노래하듯이 연주해보세요.",
  "페달 없이 먼저 완벽하게 연습하세요.",
];

export default function PracticePage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime] = useState(0);
  const [tip, setTip] = useState("");
  const [selectedSong] = useState(mockSongs[0]);

  useEffect(() => {
    setTip(PRACTICE_TIPS[Math.floor(Math.random() * PRACTICE_TIPS.length)]);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900">연습 세션</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          녹음 버튼을 눌러 연습을 시작하세요
        </p>
      </div>

      {/* Piece Selection */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-6 active:scale-[0.99] transition-transform cursor-pointer">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Music className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">{selectedSong.title}</p>
            <p className="text-xs text-gray-500">{selectedSong.composer} · {selectedSong.opus}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
              {selectedSong.difficulty}
            </span>
          </div>
        </div>
      </div>

      {/* Timer Display */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mb-12 relative overflow-hidden">
        <div className="text-center relative z-10">
          <div className="text-6xl font-bold text-gray-900 font-mono mb-2 tracking-tighter">
            {formatTime(elapsedTime)}
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-8">
            <Clock className="w-4 h-4" />
            <span>순연습시간</span>
          </div>

          {/* Dynamic Content Area */}
          <div className="h-24 flex items-center justify-center">
            {isRecording ? (
              <div className="flex items-end gap-1.5 h-16 w-full justify-center px-4">
                {[...Array(24)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-primary rounded-full transition-all duration-150"
                    style={{
                      height: !isPaused ? `${20 + Math.random() * 80}%` : "20%",
                      opacity: !isPaused ? 0.6 + Math.random() * 0.4 : 0.3,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl p-4 w-full flex items-center gap-3 animate-fade-in">
                <div className="shrink-0 w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-yellow-600" />
                </div>
                <p className="text-sm text-slate-600 font-medium text-left leading-snug">
                  "{tip}"
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        {!isRecording ? (
          <Button
            onClick={() => setIsRecording(true)}
            className="w-20 h-20 rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
          >
            <Play className="w-8 h-8 text-white" fill="white" />
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={() => setIsPaused(!isPaused)}
              className="w-16 h-16 rounded-full"
            >
              {isPaused ? (
                <Play className="w-6 h-6" fill="currentColor" />
              ) : (
                <Pause className="w-6 h-6" />
              )}
            </Button>
            <Button
              onClick={() => {
                setIsRecording(false);
                setIsPaused(false);
              }}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600"
            >
              <Square className="w-6 h-6 text-white" fill="white" />
            </Button>
          </>
        )}
      </div>

      {isRecording && (
        <p className="text-center text-sm text-gray-500 mt-4">
          {isPaused ? "일시정지됨" : "녹음 중..."}
        </p>
      )}
    </div>
  );
}
