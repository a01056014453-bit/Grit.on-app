import { NextRequest, NextResponse } from "next/server";

/**
 * 연습 세션 분석 API
 *
 * 기존: Python YAMNet 서버에 전체 녹음을 보내 사후 분석
 * 변경: 클라이언트에서 TF.js로 실시간 분류한 데이터를 받아 요약만 반환
 *
 * 클라이언트는 3초마다 분류 결과를 축적하여 세션 종료 시 이 API로 전달합니다.
 */

export interface PracticeSegment {
  startTime: number;
  endTime: number;
  type: "instrument" | "voice" | "silence" | "noise" | "metronome";
  confidence: number;
  className?: string;
}

export interface AnalysisResult {
  totalDuration: number;
  netPracticeTime: number;
  restTime: number;
  segments: PracticeSegment[];
  summary: {
    instrumentPercent: number;
    voicePercent: number;
    silencePercent: number;
    noisePercent: number;
    metronomePercent?: number;
  };
}

interface ClassificationEntry {
  label: string;
  confidence: number;
  timestampMs: number;
  durationMs: number;
}

const LABEL_TO_TYPE: Record<string, PracticeSegment["type"]> = {
  PIANO_PLAYING: "instrument",
  VOICE: "voice",
  SILENCE: "silence",
  NOISE: "noise",
  METRONOME_ONLY: "metronome",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const entries: ClassificationEntry[] = body.entries ?? [];
    const totalDuration: number = body.totalDuration ?? 0;

    if (entries.length === 0 && totalDuration <= 0) {
      return NextResponse.json(
        { success: false, error: "분류 데이터가 필요합니다." },
        { status: 400 }
      );
    }

    // 분류 항목 → 세그먼트 변환
    const segments: PracticeSegment[] = entries.map((entry) => ({
      startTime: entry.timestampMs / 1000,
      endTime: (entry.timestampMs + entry.durationMs) / 1000,
      type: LABEL_TO_TYPE[entry.label] ?? "noise",
      confidence: entry.confidence,
    }));

    // 카테고리별 시간 합산
    const totals: Record<string, number> = {
      instrument: 0,
      voice: 0,
      silence: 0,
      noise: 0,
      metronome: 0,
    };

    for (const entry of entries) {
      const type = LABEL_TO_TYPE[entry.label] ?? "noise";
      totals[type] += entry.durationMs;
    }

    const totalMs = Object.values(totals).reduce((a, b) => a + b, 0);
    const effectiveTotalMs = totalMs > 0 ? totalMs : totalDuration * 1000;

    const result: AnalysisResult = {
      totalDuration: effectiveTotalMs / 1000,
      netPracticeTime: totals.instrument / 1000,
      restTime: (effectiveTotalMs - totals.instrument) / 1000,
      segments,
      summary: {
        instrumentPercent:
          effectiveTotalMs > 0
            ? Math.round((totals.instrument / effectiveTotalMs) * 1000) / 10
            : 0,
        voicePercent:
          effectiveTotalMs > 0
            ? Math.round((totals.voice / effectiveTotalMs) * 1000) / 10
            : 0,
        silencePercent:
          effectiveTotalMs > 0
            ? Math.round((totals.silence / effectiveTotalMs) * 1000) / 10
            : 0,
        noisePercent:
          effectiveTotalMs > 0
            ? Math.round((totals.noise / effectiveTotalMs) * 1000) / 10
            : 0,
        metronomePercent:
          effectiveTotalMs > 0
            ? Math.round((totals.metronome / effectiveTotalMs) * 1000) / 10
            : 0,
      },
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Practice analysis error:", error);
    return NextResponse.json(
      { success: false, error: "분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
