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
  | "INSTRUMENT_PLAYING"
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
// 키워드 분류 (악기별 분기 + 환경 소음 블랙리스트)
// ─────────────────────────────────────────────

/** 사용자 악기 설정 (외부에서 주입) */
let _userInstrument: string = "piano";
export function setUserInstrument(instrument: string): void {
  _userInstrument = instrument;
}

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
  "Oboe",
  "Double bass",
  "Sitar",
  "Zither",
] as const;

/** 성악/노래 키워드 — SPEECH에서 분리, 사용자 악기에 따라 분류 결정 */
const VOCAL_PLAYING_KEYWORDS = [
  "Singing",
  "Choir",
  "Yodeling",
  "Chant",
  "Mantra",
  "Child singing",
  "Synthetic singing",
  "Humming",
  "Opera",
  "A capella",
  "Vocal music",
  "Gospel music",
] as const;

const SPEECH_KEYWORDS = [
  "Speech",
  "Conversation",
  "Narration",
  "Child speech",
  "Babbling",
  "Whispering",
  "Shout",
  "Yell",
  "Laughter",
  "Rapping",
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

/** 환경 소음 블랙리스트 — 절대 악기로 분류하면 안 되는 클래스 */
const ENVIRONMENT_NOISE_BLACKLIST = new Set([
  "Vehicle", "Car", "Truck", "Bus", "Motorcycle",
  "Traffic noise, roadway noise", "Aircraft", "Helicopter",
  "Train", "Subway, metro, underground",
  "Air conditioning", "Mechanical fan", "Vacuum cleaner", "Hair dryer",
  "Dog", "Bark", "Cat", "Meow", "Growling",
  "Bird", "Bird vocalization, bird call, bird song", "Crow",
  "Siren", "Alarm", "Telephone", "Ringtone", "Telephone bell ringing",
  "Door", "Doorbell", "Knock", "Slam",
  "Wind", "Rain", "Thunder", "Water", "Rain on surface",
  "Jackhammer", "Drill", "Chainsaw", "Power tool",
  "Microwave oven", "Blender", "Frying (food)", "Boiling",
  "Television", "Radio", "Video game music",
  "Engine", "Engine starting", "Idling",
  "Toilet flush", "Bathtub (filling or washing)",
  "Fireworks", "Gunshot, gunfire", "Explosion",
]);

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
  // 1. 환경 소음 블랙리스트 — 최우선 차단
  if (ENVIRONMENT_NOISE_BLACKLIST.has(className)) return "NOISE";

  // 2. 메트로놈
  const isMetronome = matchesKeywords(className, METRONOME_KEYWORDS);
  if (isMetronome && metronomeOn) return "METRONOME_ONLY";

  // 3. 악기 연주
  if (matchesKeywords(className, INSTRUMENT_KEYWORDS)) return "INSTRUMENT_PLAYING";

  // 4. 성악/노래 — 사용자 악기에 따라 분류
  if (matchesKeywords(className, VOCAL_PLAYING_KEYWORDS)) {
    return _userInstrument === "vocal" ? "INSTRUMENT_PLAYING" : "VOICE";
  }

  // 5. 대화/음성
  if (matchesKeywords(className, SPEECH_KEYWORDS)) return "VOICE";

  // 6. 무음
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

    // Top-3 가중 투표 (확률 합산)
    const weightedScores: Record<AudioLabel, number> = {
      INSTRUMENT_PLAYING: 0,
      VOICE: 0,
      METRONOME_ONLY: 0,
      SILENCE: 0,
      NOISE: 0,
    };
    let bestConfidence = 0;
    let bestClassName = "";

    for (const frameScores of scores) {
      // Top-3 인덱스 추출
      const indexed: { score: number; idx: number }[] = [];
      for (let j = 0; j < frameScores.length; j++) {
        indexed.push({ score: frameScores[j], idx: j });
      }
      indexed.sort((a, b) => b.score - a.score);
      const topK = indexed.slice(0, 3);

      for (const { score, idx } of topK) {
        const className = YAMNET_CLASSES[idx] ?? "Unknown";
        const label = categorize(className, metronomeOn);
        weightedScores[label] += score; // 확률값으로 가중 합산
      }

      if (indexed[0].score > bestConfidence) {
        bestConfidence = indexed[0].score;
        bestClassName = YAMNET_CLASSES[indexed[0].idx] ?? "Unknown";
      }
    }

    // 가중 합산 → 최종 라벨
    const totalWeight = Object.values(weightedScores).reduce((a, b) => a + b, 0);
    let winnerLabel: AudioLabel = "SILENCE";
    let winnerWeight = 0;
    for (const [label, weight] of Object.entries(weightedScores)) {
      if (weight > winnerWeight) {
        winnerWeight = weight;
        winnerLabel = label as AudioLabel;
      }
    }

    const confidence = totalWeight > 0 ? winnerWeight / totalWeight : 0;

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
      case "INSTRUMENT_PLAYING":
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
