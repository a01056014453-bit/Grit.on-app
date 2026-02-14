"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Music, Clock, TrendingUp, Play, Pause, BarChart2, Target, AlertCircle } from "lucide-react";
import { useState } from "react";
import { formatDuration } from "@/lib/format";
import { findRecordingById } from "@/data";

export default function RecordingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);

  const recording = findRecordingById(params.id as string);

  if (!recording) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>뒤로</span>
        </button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">녹음을 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
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
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
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
          <h1 className="text-lg font-bold text-foreground">녹음 상세</h1>
          <p className="text-xs text-muted-foreground">{recording.date}</p>
        </div>
      </div>

      {/* Piece Info */}
      <div className="bg-card rounded-xl p-4 border border-border shadow-sm mb-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
            <Music className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-foreground">{recording.pieceTitle}</h2>
            <p className="text-sm text-muted-foreground">{recording.date}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{recording.score}</div>
            <div className="text-xs text-muted-foreground">점수</div>
          </div>
        </div>
      </div>

      {/* Waveform Player */}
      <div className="bg-card rounded-xl p-4 border border-border shadow-sm mb-4">
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
                      : "bg-secondary"
                  }`}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{formatDuration(Math.floor(recording.duration * playProgress / 100))}</span>
              <span>{formatDuration(recording.duration)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">{formatDuration(recording.duration).split(' ')[0]}</div>
          <div className="text-xs text-muted-foreground">연습 시간</div>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-green-600">{recording.improvement}</div>
          <div className="text-xs text-muted-foreground">점수 변화</div>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <Target className="w-5 h-5 text-orange-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">{recording.focusAreas.length}</div>
          <div className="text-xs text-muted-foreground">집중 구간</div>
        </div>
      </div>

      {/* Analysis Details */}
      <div className="bg-card rounded-xl border border-border shadow-sm mb-4 overflow-hidden">
        <div className="px-4 py-3 bg-muted/50 border-b border-border">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            AI 분석 결과
          </h3>
        </div>

        <div className="p-4 space-y-4">
          {/* Tempo */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-foreground">템포</span>
              <span className="text-sm text-muted-foreground">안정성 {recording.tempo.stability}%</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${recording.tempo.stability}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                평균 ♩={recording.tempo.average} (목표: {recording.tempo.target})
              </span>
            </div>
          </div>

          {/* Dynamics */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-foreground">다이나믹</span>
              <span className="text-sm text-muted-foreground">일관성 {recording.dynamics.consistency}%</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${recording.dynamics.consistency}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                범위: {recording.dynamics.range}
              </span>
            </div>
          </div>

          {/* Rhythm */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-foreground">리듬</span>
              <span className="text-sm text-muted-foreground">정확도 {recording.rhythm.accuracy}%</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${recording.rhythm.accuracy}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{recording.rhythm.notes}</p>
          </div>
        </div>
      </div>

      {/* Focus Areas */}
      {recording.focusAreas.length > 0 && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-orange-50 border-b border-orange-100">
            <h3 className="font-semibold text-orange-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              집중 연습 구간
            </h3>
          </div>

          <div className="divide-y divide-border">
            {recording.focusAreas.map((area, index) => (
              <div key={index} className="p-4 flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  area.severity === "high" ? "bg-red-100" : "bg-yellow-100"
                }`}>
                  <span className="text-sm font-bold text-foreground">{area.measure.split('-')[0]}</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{area.measure} 마디</p>
                  <p className="text-sm text-muted-foreground">{area.issue}</p>
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
