import { NextRequest, NextResponse } from "next/server";

/**
 * 연습 세션 오디오 분석 API
 *
 * 사후 분석 방식으로 전체 녹음에서:
 * 1. 악기 소리 구간 감지
 * 2. 비활성 구간 (잡담, 환경 소음, 무음) 분리
 * 3. 순수 연습 시간 계산
 */

export interface PracticeSegment {
  startTime: number;  // seconds
  endTime: number;    // seconds
  type: "instrument" | "voice" | "silence" | "noise";
  confidence: number; // 0-1
}

export interface AnalysisResult {
  totalDuration: number;        // 전체 녹음 시간 (초)
  netPracticeTime: number;      // 순수 연습 시간 (초)
  restTime: number;             // 휴식/준비 시간 (초)
  segments: PracticeSegment[];  // 구간별 분류
  summary: {
    instrumentPercent: number;
    voicePercent: number;
    silencePercent: number;
    noisePercent: number;
  };
}

// 오디오 분석 함수 (현재는 시뮬레이션, 추후 실제 AI 분석으로 교체)
async function analyzeAudio(
  audioBlob: Blob,
  totalDuration: number
): Promise<AnalysisResult> {
  // TODO: 실제 구현 시 OpenAI Whisper API 또는 전용 오디오 ML 모델 사용
  // 현재는 시뮬레이션으로 현실적인 결과 생성

  const segments: PracticeSegment[] = [];
  let currentTime = 0;
  let instrumentTime = 0;
  let voiceTime = 0;
  let silenceTime = 0;
  let noiseTime = 0;

  // 현실적인 연습 패턴 시뮬레이션
  // 평균적으로 전체 시간의 60-80%가 실제 연습
  const practiceRatio = 0.6 + Math.random() * 0.2;

  while (currentTime < totalDuration) {
    // 연습 구간 (30초-5분)
    const practiceLength = Math.min(
      30 + Math.random() * 270,
      totalDuration - currentTime
    );

    if (practiceLength > 5) {
      segments.push({
        startTime: currentTime,
        endTime: currentTime + practiceLength,
        type: "instrument",
        confidence: 0.85 + Math.random() * 0.15,
      });
      instrumentTime += practiceLength;
      currentTime += practiceLength;
    }

    if (currentTime >= totalDuration) break;

    // 랜덤하게 휴식/대화/무음 구간 추가
    const breakType = Math.random();
    let breakLength = Math.min(
      10 + Math.random() * 60,
      totalDuration - currentTime
    );

    if (breakLength > 3) {
      if (breakType < 0.3) {
        // 무음 (휴식)
        segments.push({
          startTime: currentTime,
          endTime: currentTime + breakLength,
          type: "silence",
          confidence: 0.95,
        });
        silenceTime += breakLength;
      } else if (breakType < 0.5) {
        // 대화
        segments.push({
          startTime: currentTime,
          endTime: currentTime + breakLength,
          type: "voice",
          confidence: 0.8 + Math.random() * 0.15,
        });
        voiceTime += breakLength;
      } else {
        // 환경 소음
        segments.push({
          startTime: currentTime,
          endTime: currentTime + breakLength,
          type: "noise",
          confidence: 0.7 + Math.random() * 0.2,
        });
        noiseTime += breakLength;
      }
      currentTime += breakLength;
    } else {
      currentTime += breakLength;
    }
  }

  // 결과 조정 (practiceRatio에 맞게)
  const actualInstrumentTime = Math.round(totalDuration * practiceRatio);
  const scaleFactor = actualInstrumentTime / (instrumentTime || 1);

  // 세그먼트 시간 조정
  const adjustedSegments = segments.map(seg => ({
    ...seg,
    startTime: Math.round(seg.startTime),
    endTime: Math.round(seg.endTime),
  }));

  const restTime = totalDuration - actualInstrumentTime;

  return {
    totalDuration: Math.round(totalDuration),
    netPracticeTime: actualInstrumentTime,
    restTime,
    segments: adjustedSegments,
    summary: {
      instrumentPercent: Math.round((actualInstrumentTime / totalDuration) * 100),
      voicePercent: Math.round((voiceTime / totalDuration) * 100 * (1 - practiceRatio)),
      silencePercent: Math.round((silenceTime / totalDuration) * 100 * (1 - practiceRatio)),
      noisePercent: Math.round((noiseTime / totalDuration) * 100 * (1 - practiceRatio)),
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob | null;
    const totalDuration = parseFloat(formData.get("totalDuration") as string) || 0;

    if (!audioFile || totalDuration <= 0) {
      return NextResponse.json(
        { success: false, error: "오디오 파일과 총 시간이 필요합니다." },
        { status: 400 }
      );
    }

    // 분석 시간 시뮬레이션 (실제 분석은 더 오래 걸릴 수 있음)
    const analysisDelay = Math.min(2000, totalDuration * 10); // 최대 2초
    await new Promise(resolve => setTimeout(resolve, analysisDelay));

    const result = await analyzeAudio(audioFile, totalDuration);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Practice analysis error:", error);
    return NextResponse.json(
      { success: false, error: "분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
