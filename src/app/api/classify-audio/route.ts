/**
 * classify-audio/route.ts
 *
 * YAMNet (TensorFlow.js) 브라우저 분류 → Python 서버 불필요
 * - GPT-4o 완전 제거
 * - 실제 mimeType 사용 (webm / mp4)
 * - YAMNet 521 클래스 중 Speech / Singing / Piano / Silence 매핑
 */

import { NextRequest, NextResponse } from "next/server";

// ─── YAMNet 관련 클래스 인덱스 (AudioSet 521-class 기준) ───────────────────
// https://github.com/tensorflow/models/blob/master/research/audioset/yamnet/yamnet_class_map.csv
const YAMNET_TARGETS: Record<string, string> = {
  // VOICE
  Speech: "VOICE",
  "Male speech, man speaking": "VOICE",
  "Female speech, woman speaking": "VOICE",
  Narration: "VOICE",
  Conversation: "VOICE",
  Whispering: "VOICE",
  Shout: "VOICE",

  // SINGING → 현재는 VOICE로 통합 (추후 SINGING 라벨 분리 가능)
  Singing: "VOICE",
  "Choir": "VOICE",
  "Opera": "VOICE",
  "Chant": "VOICE",

  // PIANO_PLAYING
  Piano: "PIANO_PLAYING",
  "Piano solo": "PIANO_PLAYING",
  "Keyboard (musical)": "PIANO_PLAYING",
  "Electric piano": "PIANO_PLAYING",

  // SILENCE
  Silence: "SILENCE",
  "White noise": "SILENCE",
  "Background noise": "SILENCE",
};

// ─── POST /api/classify-audio ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioBlob = formData.get("audio") as Blob;
    const avgDecibelStr = formData.get("avgDecibel") as string;
    const noiseFloorStr = formData.get("noiseFloor") as string;

    // 빈 오디오 조기 반환
    if (!audioBlob || audioBlob.size < 500) {
      return NextResponse.json(
        { label: "SILENCE", confidence: 0.9, reason: "no audio data" },
        { status: 200 }
      );
    }

    const avgDecibel = parseFloat(avgDecibelStr ?? "0");
    const noiseFloor = parseFloat(noiseFloorStr ?? "42");

    // RMS 기반 무음 사전 필터 (서버리스 환경에서 모델 로드 없이 처리)
    if (avgDecibel > 0 && avgDecibel < noiseFloor + 4) {
      console.log(
        `[Classify] SILENCE (pre-filter) avgDb=${avgDecibel} floor=${noiseFloor}`
      );
      return NextResponse.json({
        label: "SILENCE",
        confidence: 0.95,
        reason: `below noise floor (${avgDecibel.toFixed(1)}dB vs ${noiseFloor.toFixed(1)}dB floor)`,
      });
    }

    // ── 실제 mimeType 감지 (webm / mp4) ──────────────────────────────────
    // audioBlob.type 예: "audio/webm;codecs=opus" | "audio/mp4" | ""
    const rawType = audioBlob.type || "";
    const format = rawType.includes("mp4") ? "mp4" : "webm";

    console.log(
      `[Classify] YAMNet 요청 avgDb=${avgDecibel} floor=${noiseFloor} size=${audioBlob.size}B format=${format}`
    );

    // ── Python YAMNet 서버 호출 (로컬 / Railway / Render 등) ──────────────
    //    YAMNET_SERVER_URL 환경변수가 없으면 클라이언트 사이드 YAMNet 폴백
    const yamnetUrl = process.env.YAMNET_SERVER_URL;

    if (yamnetUrl) {
      // 서버 배포 환경: Python FastAPI /predict 호출
      const proxyForm = new FormData();
      proxyForm.append("file", audioBlob, `audio.${format}`);

      const res = await fetch(`${yamnetUrl}/predict`, {
        method: "POST",
        body: proxyForm,
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) throw new Error(`YAMNet server error: ${res.status}`);

      const data = await res.json();
      const label = mapToAudioLabel(data.label ?? "SILENCE");
      const confidence: number = data.confidence ?? 0.7;
      const reason: string = data.reason ?? "";

      console.log(`[Classify] ${label} (${(confidence * 100).toFixed(0)}%) - ${reason}`);
      return NextResponse.json({ label, confidence, reason });
    }

    // ── 서버 없음: 클라이언트에 처리 위임 신호 반환 ──────────────────────
    // 프론트엔드에서 @tensorflow-models/yamnet 로 직접 처리하도록 유도
    console.log("[Classify] YAMNET_SERVER_URL 없음 → 클라이언트 YAMNet 모드");
    return NextResponse.json({
      label: "CLIENT_SIDE",
      confidence: 0,
      reason: "use client-side yamnet",
      format,           // 프론트엔드가 실제 포맷을 알 수 있도록 반환
      avgDecibel,
      noiseFloor,
    });
  } catch (error) {
    console.error("[classify-audio] 오류:", error);
    return NextResponse.json(
      { label: "SILENCE", confidence: 0.5, reason: "API error fallback" },
      { status: 200 }
    );
  }
}

// ─── 내부 레이블 → AudioLabel 정규화 ─────────────────────────────────────
function mapToAudioLabel(raw: string): string {
  const upper = raw.toUpperCase();
  if (upper === "PIANO_PLAYING" || upper === "PIANO") return "PIANO_PLAYING";
  if (upper === "VOICE" || upper === "SPEECH" || upper === "SINGING") return "VOICE";
  if (upper === "SILENCE") return "SILENCE";
  if (upper === "INSTRUMENT") return "PIANO_PLAYING"; // 기존 Python 서버 호환
  return "SILENCE";
}

// ─── YAMNet 클래스명 → AudioLabel (클라이언트 사이드 YAMNet 응답 처리용) ──
function yamnetClassToLabel(className: string): string {
  return YAMNET_TARGETS[className] ?? "SILENCE";
}
