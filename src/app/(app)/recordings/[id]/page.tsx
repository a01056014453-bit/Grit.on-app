"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Music, Clock, TrendingUp, Play, Pause, BarChart2, Target, AlertCircle } from "lucide-react";
import { useState } from "react";

// Mock recordings data (same as in recordings page)
const mockRecordings = [
  {
    id: "1",
    pieceTitle: "발라드 1번 G단조",
    composer: "F. Chopin",
    opus: "Op. 23",
    duration: 1845,
    score: 84,
    date: "2024-12-30",
    focusAreas: [
      { measure: "23-28", issue: "왼손 아르페지오 불안정", severity: "high" },
      { measure: "88-92", issue: "템포 과속 경향", severity: "high" },
    ],
    improvement: "+3",
    tempo: { average: 172, target: 168, stability: 78 },
    dynamics: { range: "mf-f", consistency: 82 },
    rhythm: { accuracy: 85, notes: "일부 16분음표 불균등" },
    waveform: Array(50).fill(0).map(() => Math.random() * 100),
  },
  {
    id: "2",
    pieceTitle: "발라드 1번 G단조",
    composer: "F. Chopin",
    opus: "Op. 23",
    duration: 1520,
    score: 81,
    date: "2024-12-29",
    focusAreas: [
      { measure: "23-28", issue: "왼손 아르페지오 불안정", severity: "high" },
      { measure: "56-60", issue: "다이나믹 부족", severity: "medium" },
      { measure: "88-92", issue: "템포 과속 경향", severity: "high" },
    ],
    improvement: "+2",
    tempo: { average: 175, target: 168, stability: 72 },
    dynamics: { range: "mf-f", consistency: 78 },
    rhythm: { accuracy: 82, notes: "16분음표 불균등" },
    waveform: Array(50).fill(0).map(() => Math.random() * 100),
  },
  {
    id: "3",
    pieceTitle: "피아노 소나타 8번 '비창'",
    composer: "L. v. Beethoven",
    opus: "Op. 13",
    duration: 2340,
    score: 86,
    date: "2024-12-28",
    focusAreas: [
      { measure: "1-8", issue: "그라베 템포 유지", severity: "medium" },
    ],
    improvement: "+5",
    tempo: { average: 66, target: 66, stability: 88 },
    dynamics: { range: "pp-ff", consistency: 85 },
    rhythm: { accuracy: 89, notes: "점음표 정확" },
    waveform: Array(50).fill(0).map(() => Math.random() * 100),
  },
  {
    id: "4",
    pieceTitle: "달빛 (Clair de lune)",
    composer: "C. Debussy",
    opus: "Suite bergamasque",
    duration: 980,
    score: 91,
    date: "2024-12-27",
    focusAreas: [],
    improvement: "+4",
    tempo: { average: 52, target: 52, stability: 92 },
    dynamics: { range: "pp-mp", consistency: 90 },
    rhythm: { accuracy: 93, notes: "루바토 자연스러움" },
    waveform: Array(50).fill(0).map(() => Math.random() * 100),
  },
];

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}분 ${secs}초`;
}

export default function RecordingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);

  const recording = mockRecordings.find((r) => r.id === params.id);

  if (!recording) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>뒤로</span>
        </button>
        <div className="text-center py-12">
          <p className="text-gray-500">녹음을 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      // Simulate playback progress
      const interval = setInterval(() => {
        setPlayProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, recording.duration / 100 * 10);
    }
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">녹음 상세</h1>
          <p className="text-xs text-gray-500">{recording.date}</p>
        </div>
      </div>

      {/* Piece Info */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
            <Music className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900">{recording.pieceTitle}</h2>
            <p className="text-sm text-gray-500">{recording.composer} · {recording.opus}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{recording.score}</div>
            <div className="text-xs text-gray-500">점수</div>
          </div>
        </div>
      </div>

      {/* Waveform Player */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handlePlayPause}
            className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
            )}
          </button>
          <div className="flex-1">
            <div className="flex items-end gap-0.5 h-12">
              {recording.waveform.map((height, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-colors ${
                    i < (playProgress / 100) * recording.waveform.length
                      ? "bg-primary"
                      : "bg-gray-200"
                  }`}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>{formatDuration(Math.floor(recording.duration * playProgress / 100))}</span>
              <span>{formatDuration(recording.duration)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-gray-900">{formatDuration(recording.duration).split(' ')[0]}</div>
          <div className="text-xs text-gray-500">연습 시간</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-green-600">{recording.improvement}</div>
          <div className="text-xs text-gray-500">점수 변화</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <Target className="w-5 h-5 text-orange-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-gray-900">{recording.focusAreas.length}</div>
          <div className="text-xs text-gray-500">집중 구간</div>
        </div>
      </div>

      {/* Analysis Details */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            AI 분석 결과
          </h3>
        </div>

        <div className="p-4 space-y-4">
          {/* Tempo */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">템포</span>
              <span className="text-sm text-gray-500">안정성 {recording.tempo.stability}%</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${recording.tempo.stability}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                평균 ♩={recording.tempo.average} (목표: {recording.tempo.target})
              </span>
            </div>
          </div>

          {/* Dynamics */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">다이나믹</span>
              <span className="text-sm text-gray-500">일관성 {recording.dynamics.consistency}%</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${recording.dynamics.consistency}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                범위: {recording.dynamics.range}
              </span>
            </div>
          </div>

          {/* Rhythm */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">리듬</span>
              <span className="text-sm text-gray-500">정확도 {recording.rhythm.accuracy}%</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${recording.rhythm.accuracy}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{recording.rhythm.notes}</p>
          </div>
        </div>
      </div>

      {/* Focus Areas */}
      {recording.focusAreas.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-orange-50 border-b border-orange-100">
            <h3 className="font-semibold text-orange-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              집중 연습 구간
            </h3>
          </div>

          <div className="divide-y divide-gray-50">
            {recording.focusAreas.map((area, index) => (
              <div key={index} className="p-4 flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  area.severity === "high" ? "bg-red-100" : "bg-yellow-100"
                }`}>
                  <span className="text-sm font-bold text-gray-700">{area.measure.split('-')[0]}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{area.measure} 마디</p>
                  <p className="text-sm text-gray-500">{area.issue}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ml-auto ${
                  area.severity === "high"
                    ? "bg-red-100 text-red-600"
                    : "bg-yellow-100 text-yellow-600"
                }`}>
                  {area.severity === "high" ? "집중" : "주의"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
