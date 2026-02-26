/**
 * YAMNet TF.js 브라우저 기반 오디오 분류기
 *
 * Python 서버(analyze_server.py) 없이 브라우저에서 직접 오디오를 분류합니다.
 * 키워드 분류 로직은 analyze_server.py에서 이식.
 */
import * as tf from "@tensorflow/tfjs";
import { YAMNET_CLASSES } from "./yamnet-classes";

import type { BeatTimestamp } from "./metronome-engine";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export type AudioLabel =
  | "PIANO_PLAYING"
  | "VOICE"
  | "METRONOME_ONLY"
  | "SILENCE"
  | "NOISE";

export interface ClassificationResult {
  label: AudioLabel;
  confidence: number;
  reason: string;
  topClass: string;
}

// ─────────────────────────────────────────────
// 키워드 분류 (analyze_server.py에서 이식)
// ─────────────────────────────────────────────
const INSTRUMENT_KEYWORDS = [
  "Music",
  "Piano",
  "Guitar",
  "Violin",
  "Cello",
  "Flute",
  "Drum",
  "Keyboard",
  "Organ",
  "Harp",
  "Accordion",
  "Harmonica",
  "Banjo",
  "Mandolin",
  "Ukulele",
  "Bass",
  "Synthesizer",
  "Electric piano",
  "Plucked string instrument",
  "Bowed string instrument",
  "Brass instrument",
  "Wind instrument",
  "Percussion",
  "Orchestra",
  "Classical music",
  "Jazz",
  "String section",
  "Pizzicato",
  "Strum",
  "Harpsichord",
  "Trumpet",
  "Trombone",
  "French horn",
  "Saxophone",
  "Clarinet",
  "Timpani",
] as const;

const SPEECH_KEYWORDS = [
  "Speech",
  "Conversation",
  "Narration",
  "Singing",
  "Chant",
  "Child speech",
  "Babbling",
  "Whispering",
  "Shout",
  "Yell",
  "Laughter",
  "Rapping",
  "Humming",
] as const;

const METRONOME_KEYWORDS = [
  "Click",
  "Clicking",
  "Tick",
  "Ticking",
  "Wood block",
  "Claves",
  "Tick-tock",
] as const;

const SILENCE_KEYWORDS = [
  "Silence",
  "White noise",
  "Pink noise",
  "Static",
] as const;

// ─────────────────────────────────────────────
// 모델 싱글톤
// ─────────────────────────────────────────────
const YAMNET_MODEL_URL =
  "https://tfhub.dev/google/tfjs-model/yamnet/tfjs/1";

let modelInstance: tf.GraphModel | null = null;
let modelLoadPromise: Promise<tf.GraphModel> | null = null;

export type ModelStatus = "idle" | "loading" | "ready" | "error";
let currentModelStatus: ModelStatus = "idle";
const statusListeners: Set<(status: ModelStatus) => void> = new Set();

function setModelStatus(status: ModelStatus): void {
  currentModelStatus = status;
  for (const listener of statusListeners) {
    listener(status);
  }
}

/** 모델 로딩 상태 변경 콜백 등록 */
export function onModelStatusChange(
  listener: (status: ModelStatus) => void
): () => void {
  statusListeners.add(listener);
  // 현재 상태 즉시 전달
  listener(currentModelStatus);
  return () => statusListeners.delete(listener);
}

/** 현재 모델 로딩 상태 조회 */
export function getModelStatus(): ModelStatus {
  return currentModelStatus;
}

async function getModel(): Promise<tf.GraphModel> {
  if (modelInstance) return modelInstance;

  if (!modelLoadPromise) {
    setModelStatus("loading");
    modelLoadPromise = tf
      .loadGraphModel(YAMNET_MODEL_URL, { fromTFHub: true })
      .then((model) => {
        modelInstance = model;
        setModelStatus("ready");
        console.log("[YAMNet] TF.js 모델 로드 완료");
        return model;
      })
      .catch((err) => {
        modelLoadPromise = null;
        setModelStatus("error");
        throw err;
      });
  }

  return modelLoadPromise;
}

/** 모델 사전 로드 (선택사항, UI 시작 시 호출 가능) */
export function preloadModel(): void {
  getModel().catch((err) =>
    console.warn("[YAMNet] 모델 사전 로드 실패:", err)
  );
}

// ─────────────────────────────────────────────
// 유틸리티
// ─────────────────────────────────────────────
function matchesKeywords(
  className: string,
  keywords: readonly string[]
): boolean {
  const lower = className.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

function categorize(className: string, metronomeOn: boolean): AudioLabel {
  const isMetronome = matchesKeywords(className, METRONOME_KEYWORDS);
  if (isMetronome && metronomeOn) return "METRONOME_ONLY";
  if (matchesKeywords(className, INSTRUMENT_KEYWORDS)) return "PIANO_PLAYING";
  if (matchesKeywords(className, SPEECH_KEYWORDS)) return "VOICE";
  if (matchesKeywords(className, SILENCE_KEYWORDS)) return "SILENCE";
  return "NOISE";
}

function resampleTo16kHz(
  audioData: Float32Array,
  sourceSampleRate: number
): Float32Array {
  if (sourceSampleRate === 16000) return audioData;

  const ratio = sourceSampleRate / 16000;
  const newLength = Math.round(audioData.length / ratio);
  const resampled = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const low = Math.floor(srcIndex);
    const high = Math.min(low + 1, audioData.length - 1);
    const frac = srcIndex - low;
    resampled[i] = audioData[low] * (1 - frac) + audioData[high] * frac;
  }

  return resampled;
}

// ─────────────────────────────────────────────
// Blob → Float32Array (16kHz mono)
// ─────────────────────────────────────────────
async function decodeAudioBlob(
  blob: Blob
): Promise<Float32Array> {
  const arrayBuffer = await blob.arrayBuffer();
  // OfflineAudioContext으로 디코딩 후 리샘플링
  const tempCtx = new OfflineAudioContext(1, 1, 44100);
  const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
  const channelData = audioBuffer.getChannelData(0);
  return resampleTo16kHz(channelData, audioBuffer.sampleRate);
}

// ─────────────────────────────────────────────
// 메인 분류 함수 (3초 클립 Blob → 라벨)
// ─────────────────────────────────────────────
export async function classifyAudioClip(
  audioBlob: Blob,
  options: { metronomeOn?: boolean } = {}
): Promise<ClassificationResult> {
  const { metronomeOn = false } = options;

  try {
    const model = await getModel();
    const samples = await decodeAudioBlob(audioBlob);

    // RMS 기반 무음 감지
    let sumSq = 0;
    for (let i = 0; i < samples.length; i++) {
      sumSq += samples[i] * samples[i];
    }
    const rms = Math.sqrt(sumSq / samples.length);
    if (rms < 0.001) {
      return {
        label: "SILENCE",
        confidence: 0.95,
        reason: `near-silent (rms=${rms.toFixed(6)})`,
        topClass: "Silence",
      };
    }

    // YAMNet 추론
    const inputTensor = tf.tensor1d(samples);
    const output = model.execute(inputTensor);

    let scoresTensor: tf.Tensor;
    if (Array.isArray(output)) {
      scoresTensor = output[0];
      for (let i = 1; i < output.length; i++) output[i].dispose();
    } else {
      scoresTensor = output;
    }

    const scores = (await scoresTensor.array()) as number[][];
    scoresTensor.dispose();
    inputTensor.dispose();

    // 프레임별 투표
    const votes: Record<AudioLabel, number> = {
      PIANO_PLAYING: 0,
      VOICE: 0,
      METRONOME_ONLY: 0,
      SILENCE: 0,
      NOISE: 0,
    };
    let bestConfidence = 0;
    let bestClassName = "";

    for (const frameScores of scores) {
      let maxIdx = 0;
      let maxScore = frameScores[0];
      for (let j = 1; j < frameScores.length; j++) {
        if (frameScores[j] > maxScore) {
          maxScore = frameScores[j];
          maxIdx = j;
        }
      }

      const className = YAMNET_CLASSES[maxIdx] ?? "Unknown";
      votes[categorize(className, metronomeOn)] += 1;

      if (maxScore > bestConfidence) {
        bestConfidence = maxScore;
        bestClassName = className;
      }
    }

    // 투표 결과 → 최종 라벨
    const totalFrames = scores.length;
    let winnerLabel: AudioLabel = "SILENCE";
    let winnerVotes = 0;
    for (const [label, count] of Object.entries(votes)) {
      if (count > winnerVotes) {
        winnerVotes = count;
        winnerLabel = label as AudioLabel;
      }
    }

    const confidence = totalFrames > 0 ? winnerVotes / totalFrames : 0;

    return {
      label: winnerLabel,
      confidence,
      reason: `${bestClassName} (${(bestConfidence * 100).toFixed(0)}%)`,
      topClass: bestClassName,
    };
  } catch (err) {
    console.error("[YAMNet] 분류 실패:", err);
    return {
      label: "SILENCE",
      confidence: 0.5,
      reason: `error: ${err instanceof Error ? err.message : String(err)}`,
      topClass: "Unknown",
    };
  }
}

// ─────────────────────────────────────────────
// 세션 분석 (실시간 라벨 축적 → 사후 요약)
// ─────────────────────────────────────────────
export interface SessionAnalysisResult {
  totalDuration: number;
  netPracticeTime: number;
  restTime: number;
  summary: {
    instrumentPercent: number;
    voicePercent: number;
    silencePercent: number;
    noisePercent: number;
    metronomePercent: number;
  };
}

export function aggregateSessionFromLabels(
  labels: Array<{ label: AudioLabel; durationMs: number }>
): SessionAnalysisResult {
  const totals: Record<string, number> = {
    instrument: 0,
    voice: 0,
    silence: 0,
    noise: 0,
    metronome: 0,
  };

  let totalMs = 0;
  for (const entry of labels) {
    totalMs += entry.durationMs;
    switch (entry.label) {
      case "PIANO_PLAYING":
        totals.instrument += entry.durationMs;
        break;
      case "VOICE":
        totals.voice += entry.durationMs;
        break;
      case "SILENCE":
        totals.silence += entry.durationMs;
        break;
      case "METRONOME_ONLY":
        totals.metronome += entry.durationMs;
        break;
      default:
        totals.noise += entry.durationMs;
        break;
    }
  }

  const totalSec = totalMs / 1000;
  const practiceMs = totals.instrument;

  return {
    totalDuration: totalSec,
    netPracticeTime: practiceMs / 1000,
    restTime: (totalMs - practiceMs) / 1000,
    summary: {
      instrumentPercent:
        totalMs > 0
          ? Math.round((totals.instrument / totalMs) * 1000) / 10
          : 0,
      voicePercent:
        totalMs > 0 ? Math.round((totals.voice / totalMs) * 1000) / 10 : 0,
      silencePercent:
        totalMs > 0
          ? Math.round((totals.silence / totalMs) * 1000) / 10
          : 0,
      noisePercent:
        totalMs > 0 ? Math.round((totals.noise / totalMs) * 1000) / 10 : 0,
      metronomePercent:
        totalMs > 0
          ? Math.round((totals.metronome / totalMs) * 1000) / 10
          : 0,
    },
  };
}

// ─────────────────────────────────────────────
// 하위호환: 기존 FFT 기반 분류 인터페이스 유지
// (metronome-engine 등에서 import할 수 있으므로)
// ─────────────────────────────────────────────
export interface AudioFeatures {
  spectralFlatness: number;
  spectralCentroid: number;
  harmonicRatio: number;
  energy: number;
  lowMidRatio: number;
  highFreqRatio: number;
  veryHighRatio: number;
  isPeriodic: boolean;
}
