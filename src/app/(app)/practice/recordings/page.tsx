"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Music, Clock, TrendingUp, ChevronRight, ArrowLeft } from "lucide-react";
import { formatDuration } from "@/lib/format";
import { mockRecordingsList, getRecordingsStats } from "@/data";

const { totalMinutes, avgScore } = getRecordingsStats(mockRecordingsList);

export default function PracticeRecordingsPage() {
  const router = useRouter();

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
          <h1 className="text-xl font-bold text-foreground">녹음 기록</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            연습 녹음과 AI 분석 결과를 확인하세요
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <div className="text-2xl font-bold text-foreground">
            {mockRecordingsList.length}
          </div>
          <div className="text-xs text-muted-foreground">총 녹음</div>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <div className="text-2xl font-bold text-primary">{avgScore}</div>
          <div className="text-xs text-muted-foreground">평균 점수</div>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <div className="text-2xl font-bold text-foreground">{totalMinutes}</div>
          <div className="text-xs text-muted-foreground">총 분</div>
        </div>
      </div>

      {/* Recordings List */}
      <div className="space-y-3">
        {mockRecordingsList.map((recording) => (
          <Link
            key={recording.id}
            href={`/practice/recordings/${recording.id}`}
            className="block bg-card rounded-xl p-4 border border-border shadow-sm hover:shadow-md hover:border-primary/20 transition-all active:scale-[0.99]"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <Music className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-foreground truncate">
                  {recording.pieceTitle}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                    <Clock className="w-3 h-3" />
                    {formatDuration(recording.duration)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-primary font-bold bg-primary/5 px-2 py-1 rounded-md">
                    <TrendingUp className="w-3 h-3" />
                    {recording.score}점
                  </div>
                  {recording.focusAreas > 0 && (
                    <div className="text-xs text-orange-500 font-medium bg-orange-50 px-2 py-1 rounded-md">
                      {recording.focusAreas}개 집중구간
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end justify-between h-full">
                <div className="text-xs text-muted-foreground">{recording.date}</div>
                <ChevronRight className="w-4 h-4 text-muted-foreground mt-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
