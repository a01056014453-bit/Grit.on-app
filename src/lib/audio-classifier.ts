/**
 * AudioClassifier - Sophisticated audio classification for practice time detection
 *
 * Classifies audio into:
 * - PIANO_PLAYING: Piano sound detected
 * - VOICE: Human voice/speech detected
 * - METRONOME_ONLY: Only metronome clicks (no piano)
 * - SILENCE: No significant sound
 * - NOISE: Non-musical noise (tapping, ambient)
 *
 * Uses FFT features + heuristics to distinguish sounds:
 * - Spectral flatness
 * - Spectral centroid
 * - Harmonic ratio
 * - Zero crossing rate (approximated)
 * - Periodic click detection for metronome
 */

import type { BeatTimestamp } from "./metronome-engine";

export type AudioLabel =
  | "PIANO_PLAYING"
  | "VOICE"
  | "METRONOME_ONLY"
  | "SILENCE"
  | "NOISE";

export interface ClassificationResult {
  label: AudioLabel;
  confidence: number;
  features: AudioFeatures;
}

export interface AudioFeatures {
  spectralFlatness: number; // 0-1, higher = more noise-like
  spectralCentroid: number; // Hz, center of mass of spectrum
  harmonicRatio: number; // 0-1, higher = more harmonic/tonal
  energy: number; // Total energy
  lowMidRatio: number; // Energy ratio in voice range
  highFreqRatio: number; // Energy ratio in high frequencies
  veryHighRatio: number; // Energy ratio in very high frequencies
  isPeriodic: boolean; // Detected periodic clicks
}

// Frequency band boundaries (Hz)
const BANDS = {
  VERY_LOW: [20, 100],
  LOW: [100, 500],
  MID: [500, 2000],
  HIGH: [2000, 4000],
  VERY_HIGH: [4000, 8000],
} as const;

/**
 * Calculate energy in a frequency band
 */
function getBandEnergy(
  frequencyData: Uint8Array,
  sampleRate: number,
  lowFreq: number,
  highFreq: number
): number {
  const nyquist = sampleRate / 2;
  const binCount = frequencyData.length;
  const binWidth = nyquist / binCount;

  const lowBin = Math.floor(lowFreq / binWidth);
  const highBin = Math.min(Math.ceil(highFreq / binWidth), binCount - 1);

  let sum = 0;
  let count = 0;
  for (let i = lowBin; i <= highBin; i++) {
    sum += frequencyData[i];
    count++;
  }
  return count > 0 ? sum / count : 0;
}

/**
 * Calculate spectral flatness (Wiener entropy)
 * Higher values indicate noise-like, lower values indicate tonal
 */
function calculateSpectralFlatness(frequencyData: Uint8Array): number {
  // Use bins from 100Hz to 8000Hz
  const startBin = 5;
  const endBin = Math.min(frequencyData.length - 1, 200);

  let geometricSum = 0;
  let arithmeticSum = 0;
  let count = 0;

  for (let i = startBin; i <= endBin; i++) {
    const value = Math.max(frequencyData[i], 1); // Avoid log(0)
    geometricSum += Math.log(value);
    arithmeticSum += value;
    count++;
  }

  if (count === 0 || arithmeticSum === 0) return 0;

  const geometricMean = Math.exp(geometricSum / count);
  const arithmeticMean = arithmeticSum / count;

  return geometricMean / arithmeticMean;
}

/**
 * Calculate spectral centroid (center of mass of spectrum)
 */
function calculateSpectralCentroid(
  frequencyData: Uint8Array,
  sampleRate: number
): number {
  const nyquist = sampleRate / 2;
  const binWidth = nyquist / frequencyData.length;

  let weightedSum = 0;
  let totalEnergy = 0;

  for (let i = 0; i < frequencyData.length; i++) {
    const freq = i * binWidth;
    const magnitude = frequencyData[i];
    weightedSum += freq * magnitude;
    totalEnergy += magnitude;
  }

  return totalEnergy > 0 ? weightedSum / totalEnergy : 0;
}

/**
 * Estimate harmonic ratio based on peak-to-average ratio in spectrum
 * Harmonic sounds have distinct peaks, noise is more flat
 */
function estimateHarmonicRatio(frequencyData: Uint8Array): number {
  const startBin = 5;
  const endBin = Math.min(frequencyData.length - 1, 200);

  let sum = 0;
  let maxVal = 0;
  let count = 0;

  for (let i = startBin; i <= endBin; i++) {
    sum += frequencyData[i];
    maxVal = Math.max(maxVal, frequencyData[i]);
    count++;
  }

  const avg = count > 0 ? sum / count : 0;
  if (avg === 0) return 0;

  // Peak to average ratio, normalized
  const ratio = maxVal / avg;
  // Normalize to 0-1 range (typical values 1-10)
  return Math.min(1, (ratio - 1) / 9);
}

/**
 * Detect if audio has periodic impulses (metronome clicks)
 * by analyzing the time-domain autocorrelation characteristics
 */
function detectPeriodicClicks(
  frequencyData: Uint8Array,
  recentBeatTimestamps: BeatTimestamp[],
  currentTime: number,
  toleranceMs: number = 30
): boolean {
  // Check if current time is near a metronome beat
  const isNearBeat = recentBeatTimestamps.some(
    (bt) => Math.abs(bt.wallTime - currentTime) <= toleranceMs
  );

  if (!isNearBeat) return false;

  // Check for impulse-like spectrum (wide frequency spread, short duration)
  // Metronome clicks have a very flat, wide spectrum
  const flatness = calculateSpectralFlatness(frequencyData);

  // High spectral flatness during beat time suggests metronome click
  return flatness > 0.3;
}

/**
 * Mask metronome beat windows from analysis
 * Returns a copy of frequency data with beat windows zeroed
 */
function maskBeatWindows(
  frequencyData: Uint8Array,
  recentBeatTimestamps: BeatTimestamp[],
  currentTime: number,
  maskWindowMs: number = 25
): Uint8Array {
  const isNearBeat = recentBeatTimestamps.some(
    (bt) => Math.abs(bt.wallTime - currentTime) <= maskWindowMs
  );

  if (isNearBeat) {
    // Return heavily attenuated data during beat windows
    const masked = new Uint8Array(frequencyData.length);
    for (let i = 0; i < frequencyData.length; i++) {
      masked[i] = Math.floor(frequencyData[i] * 0.1); // 90% attenuation
    }
    return masked;
  }

  return frequencyData;
}

/**
 * Main classification function
 */
export function classifyAudio(
  frequencyData: Uint8Array,
  timeData: Uint8Array,
  sampleRate: number,
  options: {
    recentBeatTimestamps?: BeatTimestamp[];
    metronomeActive?: boolean;
    noiseFloor?: number;
  } = {}
): ClassificationResult {
  const {
    recentBeatTimestamps = [],
    metronomeActive = false,
    noiseFloor = 35,
  } = options;

  const currentTime = Date.now();

  // Apply beat masking if metronome is active
  const processedFreqData = metronomeActive
    ? maskBeatWindows(frequencyData, recentBeatTimestamps, currentTime)
    : frequencyData;

  // Calculate features
  const veryLowEnergy = getBandEnergy(processedFreqData, sampleRate, ...BANDS.VERY_LOW);
  const lowEnergy = getBandEnergy(processedFreqData, sampleRate, ...BANDS.LOW);
  const midEnergy = getBandEnergy(processedFreqData, sampleRate, ...BANDS.MID);
  const highEnergy = getBandEnergy(processedFreqData, sampleRate, ...BANDS.HIGH);
  const veryHighEnergy = getBandEnergy(processedFreqData, sampleRate, ...BANDS.VERY_HIGH);

  const totalEnergy = veryLowEnergy + lowEnergy + midEnergy + highEnergy + veryHighEnergy;
  const spectralFlatness = calculateSpectralFlatness(processedFreqData);
  const spectralCentroid = calculateSpectralCentroid(processedFreqData, sampleRate);
  const harmonicRatio = estimateHarmonicRatio(processedFreqData);

  const lowMidRatio = totalEnergy > 0 ? (lowEnergy + midEnergy) / totalEnergy : 0;
  const highFreqRatio = totalEnergy > 0 ? (highEnergy + veryHighEnergy) / totalEnergy : 0;
  const veryHighRatio = totalEnergy > 0 ? veryHighEnergy / totalEnergy : 0;

  // Detect periodic clicks (metronome)
  const isPeriodic = metronomeActive
    ? detectPeriodicClicks(frequencyData, recentBeatTimestamps, currentTime)
    : false;

  const features: AudioFeatures = {
    spectralFlatness,
    spectralCentroid,
    harmonicRatio,
    energy: totalEnergy,
    lowMidRatio,
    highFreqRatio,
    veryHighRatio,
    isPeriodic,
  };

  // Classification logic

  // 1. Check for silence
  if (totalEnergy < 80) {
    return {
      label: "SILENCE",
      confidence: 0.95,
      features,
    };
  }

  // 2. Check for metronome-only (high flatness, near beat time, low sustained energy)
  if (metronomeActive && isPeriodic && totalEnergy < 150) {
    return {
      label: "METRONOME_ONLY",
      confidence: 0.85,
      features,
    };
  }

  // 3. Check for voice
  // Voice characteristics:
  // - Energy concentrated in 100-2000Hz (lowMidRatio > 0.65)
  // - Weak high frequencies (highFreqRatio < 0.25)
  // - Moderate harmonic ratio (formants)
  // - Spectral centroid typically 300-2000Hz
  const isVoiceLike =
    lowMidRatio > 0.65 &&
    highFreqRatio < 0.25 &&
    spectralCentroid < 2500 &&
    spectralCentroid > 200 &&
    harmonicRatio > 0.2 &&
    harmonicRatio < 0.7;

  if (isVoiceLike) {
    const voiceConfidence = Math.min(0.9, 0.5 + lowMidRatio * 0.3 + (0.25 - highFreqRatio));
    return {
      label: "VOICE",
      confidence: voiceConfidence,
      features,
    };
  }

  // 4. Check for piano
  // Piano characteristics:
  // - Wide frequency distribution
  // - Strong high-frequency content (highFreqRatio > 0.25)
  // - Very high frequency presence (veryHighRatio > 0.08) - piano harmonics
  // - High harmonic ratio (clean tonal sound)
  // - Higher spectral centroid
  const hasPianoCharacteristics =
    highFreqRatio > 0.25 &&
    veryHighRatio > 0.08 &&
    harmonicRatio > 0.3;

  // Check for even energy spread (piano has wide distribution)
  const energyValues = [veryLowEnergy, lowEnergy, midEnergy, highEnergy, veryHighEnergy];
  const maxEnergy = Math.max(...energyValues);
  const minEnergy = Math.min(...energyValues.filter((e) => e > 10));
  const spreadRatio = minEnergy / maxEnergy;
  const hasEvenSpread = spreadRatio > 0.15;

  if ((hasPianoCharacteristics || hasEvenSpread) && !isVoiceLike) {
    const pianoConfidence = Math.min(
      0.95,
      0.5 + highFreqRatio * 0.5 + veryHighRatio * 1.0 + harmonicRatio * 0.3
    );
    return {
      label: "PIANO_PLAYING",
      confidence: pianoConfidence,
      features,
    };
  }

  // 5. Default to noise if nothing else matches
  return {
    label: "NOISE",
    confidence: 0.6,
    features,
  };
}

/**
 * PracticeTimeTracker - Tracks cumulative practice time with hysteresis
 */
export class PracticeTimeTracker {
  private cumulativePianoMs = 0;
  private lastPianoTime = 0;
  private lastVoiceTime = 0;
  private isCurrentlyCounting = false;
  private practiceTimeSeconds = 0;

  // Thresholds
  private readonly pianoOnThresholdMs = 1500; // 1.5s of piano to start counting
  private readonly pianoOffThresholdMs = 1000; // 1s gap allowed
  private readonly voiceStopThresholdMs = 2000; // 2s of voice stops counting
  private readonly minConfidence = 0.70;

  /**
   * Update tracker with new classification result
   * @returns Current practice time in seconds
   */
  update(result: ClassificationResult, deltaMs: number = 100): number {
    const now = Date.now();

    if (result.label === "PIANO_PLAYING" && result.confidence >= this.minConfidence) {
      this.cumulativePianoMs += deltaMs;
      this.lastPianoTime = now;

      // Start counting after threshold
      if (!this.isCurrentlyCounting && this.cumulativePianoMs >= this.pianoOnThresholdMs) {
        this.isCurrentlyCounting = true;
      }

      // Increment practice time if counting
      if (this.isCurrentlyCounting) {
        this.practiceTimeSeconds += deltaMs / 1000;
      }
    } else if (result.label === "VOICE" && result.confidence >= this.minConfidence) {
      this.lastVoiceTime = now;

      // Stop counting if voice persists
      if (now - this.lastPianoTime > this.voiceStopThresholdMs) {
        this.isCurrentlyCounting = false;
        this.cumulativePianoMs = 0;
      }
    } else {
      // Silence, noise, or metronome only
      // Allow short gaps without stopping
      if (this.isCurrentlyCounting) {
        if (now - this.lastPianoTime > this.pianoOffThresholdMs) {
          this.isCurrentlyCounting = false;
          this.cumulativePianoMs = 0;
        }
      }
    }

    return Math.floor(this.practiceTimeSeconds);
  }

  /**
   * Check if currently counting practice time
   */
  isCounting(): boolean {
    return this.isCurrentlyCounting;
  }

  /**
   * Get current practice time in seconds
   */
  getPracticeTime(): number {
    return Math.floor(this.practiceTimeSeconds);
  }

  /**
   * Reset tracker
   */
  reset(): void {
    this.cumulativePianoMs = 0;
    this.lastPianoTime = 0;
    this.lastVoiceTime = 0;
    this.isCurrentlyCounting = false;
    this.practiceTimeSeconds = 0;
  }
}

// Singleton tracker instance
export const practiceTimeTracker = new PracticeTimeTracker();
