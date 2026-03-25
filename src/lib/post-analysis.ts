/**
 * 사후 오디오 분석 (Post-hoc Analysis)
 *
 * 연습 종료 후 전체 녹음을 한번에 분석.
 * 실시간보다 정확: 전체 컨텍스트 + 후처리(스무딩, 스파이크 제거)
 */
import {
  classifyAudioClip,
  type AudioLabel,
  type ClassificationResult,
} from "./audio-classifier";

export interface AnalysisSegment {
  startMs: number;
  endMs: number;
  label: AudioLabel;
  confidence: number;
}

export interface PostAnalysisResult {
  totalDuration: number;       // 초
  practiceTime: number;        // 순연습시간 (초)
  restTime: number;            // 무음+휴식 (초)
  voiceTime: number;           // 대화 (초)
  noiseTime: number;           // 소음 (초)
  focusPercent: number;        // 집중도 (0-100)
  segments: AnalysisSegment[]; // 타임라인 세그먼트
}

const CHUNK_DURATION_MS = 3000; // 3초 청크
const MIN_SEGMENT_MS = 2000;    // 2초 미만 세그먼트는 병합

/**
 * 녹음 Blob을 사후 분석
 * @param audioBlob 전체 녹음 파일
 * @param onProgress 진행률 콜백 (0-100)
 */
export async function analyzeRecording(
  audioBlob: Blob,
  onProgress?: (percent: number) => void,
): Promise<PostAnalysisResult> {
  // 1. Blob → AudioBuffer
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioCtx = new OfflineAudioContext(1, 1, 44100);
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  const totalDuration = audioBuffer.duration;
  const totalMs = totalDuration * 1000;

  // 2. 청크로 분할하여 분류
  const rawSegments: { startMs: number; endMs: number; label: AudioLabel; confidence: number }[] = [];
  const chunkCount = Math.ceil(totalMs / CHUNK_DURATION_MS);

  for (let i = 0; i < chunkCount; i++) {
    const startSample = Math.floor((i * CHUNK_DURATION_MS / 1000) * audioBuffer.sampleRate);
    const endSample = Math.min(
      Math.floor(((i + 1) * CHUNK_DURATION_MS / 1000) * audioBuffer.sampleRate),
      audioBuffer.length,
    );
    const chunkLength = endSample - startSample;

    if (chunkLength <= 0) continue;

    // 청크 AudioBuffer → Blob
    const chunkBuffer = audioCtx.createBuffer(1, chunkLength, audioBuffer.sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    chunkBuffer.getChannelData(0).set(channelData.subarray(startSample, endSample));

    // AudioBuffer → WAV Blob (간이 변환)
    const wavBlob = audioBufferToWavBlob(chunkBuffer);

    // YAMNet 분류
    const result = await classifyAudioClip(wavBlob);

    rawSegments.push({
      startMs: i * CHUNK_DURATION_MS,
      endMs: Math.min((i + 1) * CHUNK_DURATION_MS, totalMs),
      label: result.label,
      confidence: result.confidence,
    });

    if (onProgress) {
      onProgress(Math.round(((i + 1) / chunkCount) * 100));
    }
  }

  // 3. 후처리: 인접 동일 라벨 병합
  const merged = mergeSegments(rawSegments);

  // 4. 후처리: 2초 미만 스파이크 제거 (양쪽과 다른 짧은 세그먼트)
  const smoothed = removeSpikes(merged);

  // 5. 시간 집계
  let practiceMs = 0;
  let restMs = 0;
  let voiceMs = 0;
  let noiseMs = 0;

  for (const seg of smoothed) {
    const dur = seg.endMs - seg.startMs;
    switch (seg.label) {
      case "INSTRUMENT_PLAYING":
        practiceMs += dur;
        break;
      case "SILENCE":
      case "METRONOME_ONLY":
        restMs += dur;
        break;
      case "VOICE":
        voiceMs += dur;
        break;
      case "NOISE":
        noiseMs += dur;
        break;
    }
  }

  return {
    totalDuration: Math.round(totalDuration),
    practiceTime: Math.round(practiceMs / 1000),
    restTime: Math.round(restMs / 1000),
    voiceTime: Math.round(voiceMs / 1000),
    noiseTime: Math.round(noiseMs / 1000),
    focusPercent: totalMs > 0 ? Math.round((practiceMs / totalMs) * 100) : 0,
    segments: smoothed,
  };
}

/** 인접 동일 라벨 세그먼트 병합 */
function mergeSegments(segments: AnalysisSegment[]): AnalysisSegment[] {
  if (segments.length === 0) return [];

  const result: AnalysisSegment[] = [{ ...segments[0] }];

  for (let i = 1; i < segments.length; i++) {
    const last = result[result.length - 1];
    const curr = segments[i];

    if (curr.label === last.label) {
      // 병합: endMs 확장, confidence 평균
      last.endMs = curr.endMs;
      last.confidence = (last.confidence + curr.confidence) / 2;
    } else {
      result.push({ ...curr });
    }
  }

  return result;
}

/** 2초 미만 스파이크 제거 (양쪽과 다른 짧은 세그먼트 → 양쪽 라벨로 흡수) */
function removeSpikes(segments: AnalysisSegment[]): AnalysisSegment[] {
  if (segments.length <= 2) return segments;

  const result: AnalysisSegment[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const dur = seg.endMs - seg.startMs;

    if (dur < MIN_SEGMENT_MS && i > 0 && i < segments.length - 1) {
      const prev = result[result.length - 1];
      const next = segments[i + 1];

      // 양쪽이 같은 라벨이면 스파이크 흡수
      if (prev && prev.label === next.label) {
        prev.endMs = seg.endMs; // 이전 세그먼트가 흡수
        continue;
      }
    }

    result.push({ ...seg });
  }

  // 다시 병합 (흡수로 인해 인접 동일 라벨 발생 가능)
  return mergeSegments(result);
}

/** AudioBuffer → WAV Blob (간이 변환) */
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const samples = buffer.getChannelData(0);
  const dataLength = samples.length * 2; // 16-bit
  const headerLength = 44;
  const totalLength = headerLength + dataLength;

  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  // WAV 헤더
  writeString(view, 0, "RIFF");
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  // PCM 데이터
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
