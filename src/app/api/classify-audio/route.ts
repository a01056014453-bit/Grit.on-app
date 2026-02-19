import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    // 무음 사전 필터 - API 호출 없이 즉시 반환
    if (avgDecibel > 0 && avgDecibel < noiseFloor + 4) {
      console.log(`[Classify] SILENCE (pre-filter) avgDb=${avgDecibel} floor=${noiseFloor} delta=${(avgDecibel - noiseFloor).toFixed(1)} < 4 threshold`);
      return NextResponse.json({
        label: "SILENCE",
        confidence: 0.95,
        reason: `below noise floor (${avgDecibel.toFixed(1)}dB vs ${noiseFloor.toFixed(1)}dB floor)`,
      });
    }

    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    console.log(`[Classify] GPT-4o 호출 avgDb=${avgDecibel} floor=${noiseFloor} size=${audioBlob.size}B`);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-audio-preview",
      modalities: ["text"],
      messages: [
        {
          role: "system",
          content: `You are a precise audio classifier for a piano practice app.

Classify the audio into EXACTLY ONE category:

PIANO_PLAYING — You hear piano instrument sounds: notes, chords, scales, arpeggios, or melodies played on a piano. Even single notes or quiet playing counts.

VOICE — You hear human speech or conversation. Someone is talking, even quietly.

SILENCE — The audio is silent or contains only quiet room/background noise with no clear sound source.

NOISE — Non-piano, non-voice sounds: metronome clicks, tapping, rustling, etc.

CRITICAL RULES:
- If you hear BOTH piano AND voice → classify as VOICE
- Piano sustain/reverb after a note = still PIANO_PLAYING
- Be strict: do NOT classify as PIANO_PLAYING unless you clearly hear piano notes
- Background hum, air conditioning, faint room noise = SILENCE

Respond with ONLY valid JSON, nothing else:
{"label": "PIANO_PLAYING", "confidence": 0.95, "reason": "clear piano notes heard"}`,
        },
        {
          role: "user",
          content: [
            {
              type: "input_audio",
              input_audio: {
                data: base64Audio,
                format: "wav",
              },
            },
            {
              type: "text",
              text: `Classify this ${Math.round(audioBlob.size / 1000)}KB audio clip. Average volume: ${avgDecibel.toFixed(1)}dB, noise floor: ${noiseFloor.toFixed(1)}dB.`,
            },
          ] as any,
        },
      ],
      max_tokens: 80,
      temperature: 0,
    });

    const content = response.choices[0]?.message?.content ?? "";
    console.log("[GPT-4o-audio] 원본 응답:", content);

    let result: { label: string; confidence: number; reason: string };
    try {
      const cleaned = content.replace(/```json|```/g, "").trim();
      result = JSON.parse(cleaned);
    } catch {
      console.error("[GPT-4o-audio] JSON 파싱 실패:", content);
      result = { label: "SILENCE", confidence: 0.5, reason: "parse failed" };
    }

    const validLabels = ["PIANO_PLAYING", "VOICE", "SILENCE", "NOISE"];
    if (!validLabels.includes(result.label)) result.label = "SILENCE";

    console.log(`[GPT-4o-audio] 결과: ${result.label} (${(result.confidence * 100).toFixed(0)}%) - ${result.reason}`);

    return NextResponse.json({
      label: result.label,
      confidence: result.confidence ?? 0.7,
      reason: result.reason ?? "",
    });

  } catch (error) {
    console.error("[classify-audio] 상세 오류:", error);
    return NextResponse.json(
      { label: "SILENCE", confidence: 0.5, reason: "API error fallback" },
      { status: 200 }
    );
  }
}
