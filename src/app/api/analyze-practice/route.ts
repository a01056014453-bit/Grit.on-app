import { NextRequest, NextResponse } from "next/server";

/**
 * 연습 세션 오디오 분석 API
 *
 * YAMNet 기반 사후 분석 방식으로 전체 녹음에서:
 * 1. 악기 소리 구간 감지
 * 2. 비활성 구간 (잡담, 환경 소음, 무음) 분리
 * 3. 순수 연습 시간 계산
 * 4. 메트로놈 ON 상태시 메트로놈 소리 별도 처리
 */

// Python 분석 서버 URL
const ANALYSIS_SERVER_URL = process.env.ANALYSIS_SERVER_URL || "http://localhost:5001";

export interface PracticeSegment {
  startTime: number;  // seconds
  endTime: number;    // seconds
  type: "instrument" | "voice" | "silence" | "noise" | "metronome";
  confidence: number; // 0-1
  className?: string; // YAMNet 분류 클래스명
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
    metronomePercent?: number;
  };
}

// Python 서버 응답 타입
interface YAMNetResponse {
  instrument_time: number;
  voice_time: number;
  silence_time: number;
  noise_time: number;
  metronome_time: number;
  total_time: number;
  instrument_percent: number;
  voice_percent: number;
  silence_percent: number;
  noise_percent: number;
  metronome_percent: number;
  net_practice_time: number;
  segments: Array<{
    time: number;
    class: string;
    confidence: number;
    category: string;
  }>;
}

// YAMNet 분석 서버 호출
async function analyzeWithYAMNet(
  audioBlob: Blob,
  metronomeOn: boolean
): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");
  formData.append("metronome", metronomeOn.toString());

  const response = await fetch(`${ANALYSIS_SERVER_URL}/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "분석 서버 오류");
  }

  const data: YAMNetResponse = await response.json();

  // 세그먼트 변환 (0.48초 단위 -> PracticeSegment)
  const segments: PracticeSegment[] = data.segments.map((seg, index) => ({
    startTime: seg.time,
    endTime: seg.time + 0.48,
    type: seg.category as PracticeSegment["type"],
    confidence: seg.confidence,
    className: seg.class,
  }));

  return {
    totalDuration: data.total_time,
    netPracticeTime: data.net_practice_time,
    restTime: data.total_time - data.net_practice_time,
    segments,
    summary: {
      instrumentPercent: data.instrument_percent,
      voicePercent: data.voice_percent,
      silencePercent: data.silence_percent,
      noisePercent: data.noise_percent,
      metronomePercent: data.metronome_percent,
    },
  };
}


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob | null;
    const totalDuration = parseFloat(formData.get("totalDuration") as string) || 0;
    const metronomeOn = formData.get("metronome") === "true";

    if (!audioFile || totalDuration <= 0) {
      return NextResponse.json(
        { success: false, error: "오디오 파일과 총 시간이 필요합니다." },
        { status: 400 }
      );
    }

    try {
      // YAMNet 분석 서버로 요청
      const result = await analyzeWithYAMNet(audioFile, metronomeOn);
      console.log("YAMNet 분석 완료:", result.summary);
      return NextResponse.json({
        success: true,
        data: result,
      });
    } catch (yamnetError) {
      // Python 서버 연결 실패 - 프론트엔드에서 실시간 분류 데이터 사용하도록 에러 반환
      console.warn("YAMNet 서버 연결 실패:", yamnetError);
      return NextResponse.json(
        { success: false, error: "분석 서버에 연결할 수 없습니다. 실시간 분류 데이터를 사용합니다.", useRealtime: true },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Practice analysis error:", error);
    return NextResponse.json(
      { success: false, error: "분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
