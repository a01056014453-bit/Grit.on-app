/**
 * classify-audio/route.ts
 */

import { NextRequest, NextResponse } from "next/server";

const YAMNET_TARGETS: Record<string, string> = {
  Speech: "VOICE",
  "Male speech, man speaking": "VOICE",
  "Female speech, woman speaking": "VOICE",
  Narration: "VOICE",
  Conversation: "VOICE",
  Whispering: "VOICE",
  Shout: "VOICE",
  Singing: "VOICE",
  Choir: "VOICE",
  Opera: "VOICE",
  Chant: "VOICE",
  Piano: "PIANO_PLAYING",
  "Piano solo": "PIANO_PLAYING",
  "Keyboard (musical)": "PIANO_PLAYING",
  "Electric piano": "PIANO_PLAYING",
  Silence: "SILENCE",
  "White noise": "SILENCE",
  "Background noise": "SILENCE",
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioBlob = formData.get("audio") as Blob;
    const avgDecibelStr = formData.get("avgDecibel") as string;
    const noiseFloorStr = formData.get("noiseFloor") as string;

    if (!audioBlob || audioBlob.size < 500) {
      return NextResponse.json(
        { label: "SILENCE", confidence: 0.9, reason: "no audio data" },
        { status: 200 }
      );
    }

    const avgDecibel = parseFloat(avgDecibelStr ?? "0");
    const noiseFloor = parseFloat(noiseFloorStr ?? "42");

    if (avgDecibel > 0 && avgDecibel < noiseFloor + 4) {
      return NextResponse.json({
        label: "SILENCE",
        confidence: 0.95,
        reason: `below noise floor (${avgDecibel.toFixed(1)}dB vs ${noiseFloor.toFixed(1)}dB floor)`,
      });
    }

    const rawType = audioBlob.type || "";
    const format = rawType.includes("mp4") ? "mp4" : "webm";

    const yamnetUrl = process.env.YAMNET_SERVER_URL;

    if (yamnetUrl) {
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

      return NextResponse.json({ label, confidence, reason });
    }

    return NextResponse.json({
      label: "CLIENT_SIDE",
      confidence: 0,
      reason: "use client-side yamnet",
      format,
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

function mapToAudioLabel(raw: string): string {
  const upper = raw.toUpperCase();
  if (upper === "PIANO_PLAYING" || upper === "PIANO") return "PIANO_PLAYING";
  if (upper === "VOICE" || upper === "SPEECH" || upper === "SINGING") return "VOICE";
  if (upper === "SILENCE") return "SILENCE";
  if (upper === "INSTRUMENT") return "PIANO_PLAYING";
  return "SILENCE";
}

function yamnetClassToLabel(className: string): string {
  return YAMNET_TARGETS[className] ?? "SILENCE";
}
