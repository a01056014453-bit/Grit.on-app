// AI 기반 오디오 분류 프롬프트
// OpenAI Whisper, Claude 등과 함께 사용

export const AUDIO_CLASSIFIER_SYSTEM_PROMPT = `You are an audio classifier for a classical piano practice tracking system.

Analyze the audio segment and classify the PRIMARY sound source.

## CLASSIFICATION LABELS

| Label | Definition |
|-------|------------|
| piano_playing | Acoustic piano sound with clear hammer-strike attack and harmonic decay. Includes single notes, chords, scales, arpeggios, or any intentional musical content. |
| human_voice | Speech, singing, humming, counting ("1, 2, 3..."), breathing with vocalization, or verbal cues. |
| silence | Signal amplitude below -50dB or near-zero energy across all frequencies. |
| ambient_noise | Non-musical sounds: page turning, chair movement, metronome clicks, tapping, room noise, recording artifacts. |

## EDGE CASES

- **Piano + Voice together**: Classify as "piano_playing" if piano is the dominant sound; otherwise "human_voice"
- **Very soft piano (pp/ppp)**: Still classify as "piano_playing" if harmonic structure is detectable
- **Pedal noise only**: Classify as "ambient_noise" (no pitched content)
- **Electronic keyboard**: Classify as "piano_playing" (acceptable for practice tracking)
- **Sustained piano decay**: Classify as "piano_playing" even without new attacks
- **Metronome + Piano**: Classify as "piano_playing" (metronome is secondary)

## DECISION PRIORITY

1. If clear piano harmonic content exists → "piano_playing"
2. If human vocalization is primary → "human_voice"
3. If signal energy is negligible → "silence"
4. Otherwise → "ambient_noise"

## OUTPUT FORMAT (JSON only, no markdown)

{
  "classification": "piano_playing" | "human_voice" | "silence" | "ambient_noise",
  "confidence": 0.0-1.0,
  "secondary_sound": null | "human_voice" | "ambient_noise",
  "notes": "optional brief explanation"
}

## EXAMPLES

Audio: Clear Chopin etude with occasional teacher comment
→ {"classification": "piano_playing", "confidence": 0.95, "secondary_sound": "human_voice", "notes": "piano dominant, brief speech detected"}

Audio: Student counting beats before playing
→ {"classification": "human_voice", "confidence": 0.9, "secondary_sound": null, "notes": "verbal counting, no piano"}

Audio: Room tone with distant traffic
→ {"classification": "silence", "confidence": 0.7, "secondary_sound": "ambient_noise", "notes": "very low energy, faint background noise"}

CRITICAL: When uncertain between piano_playing and other classes, choose the non-piano option. False positives are worse than false negatives for practice time tracking accuracy.`;

export interface AudioFeatures {
  duration_seconds: number;
  avg_volume_db: number;
  pitch_detected: boolean;
  pitch_stability: number;
  harmonic_ratio: number;
  transient_strength: number;
  spectral_flatness: number;
  voice_probability: number;
  polyphonic_probability: number;
}

export const createFeatureBasedPrompt = (features: AudioFeatures): string => {
  return `Analyze audio features and classify the sound source.

## INPUT FEATURES
- duration_seconds: ${features.duration_seconds}
- avg_volume_db: ${features.avg_volume_db}
- pitch_detected: ${features.pitch_detected}
- pitch_stability: ${features.pitch_stability}
- harmonic_ratio: ${features.harmonic_ratio}
- transient_strength: ${features.transient_strength}
- spectral_flatness: ${features.spectral_flatness}
- voice_probability: ${features.voice_probability}
- polyphonic_probability: ${features.polyphonic_probability}

## CLASSIFICATION RULES (evaluate in order, first match wins)

### 1. SILENCE (highest priority)
IF avg_volume_db < -55:
  → "silence" (confidence: 0.95)

### 2. HUMAN_VOICE
IF voice_probability > 0.7:
  → "human_voice" (confidence: voice_probability)
IF voice_probability > 0.5 AND harmonic_ratio > 0.5 AND polyphonic_probability < 0.3:
  → "human_voice" (confidence: voice_probability * 0.9)

### 3. PIANO_PLAYING
IF ALL conditions met:
  - pitch_detected == true
  - harmonic_ratio > 0.55
  - transient_strength > 0.4
  - pitch_stability > 0.5
  - voice_probability < 0.4
  - spectral_flatness < 0.5
THEN:
  score = (harmonic_ratio + transient_strength + pitch_stability) / 3
  → "piano_playing" (confidence: score)

IF polyphonic_probability > 0.6 AND harmonic_ratio > 0.5 AND voice_probability < 0.3:
  → "piano_playing" (confidence: polyphonic_probability * 0.85)
  // Chords or complex passages

### 4. AMBIENT_NOISE (fallback)
IF spectral_flatness > 0.6 OR harmonic_ratio < 0.35:
  → "ambient_noise" (confidence: 0.7)

### 5. UNCERTAIN (final fallback)
→ "ambient_noise" (confidence: 0.4)
// When no clear classification, default to non-piano

## CONFIDENCE ADJUSTMENTS

- IF duration_seconds < 1.0: confidence *= 0.8
- IF duration_seconds < 0.5: confidence *= 0.6
- IF avg_volume_db < -45: confidence *= 0.9

## OUTPUT FORMAT

{
  "classification": "piano_playing" | "human_voice" | "silence" | "ambient_noise",
  "confidence": 0.0-1.0,
  "primary_signal": {
    "harmonic_ratio": ${features.harmonic_ratio},
    "voice_probability": ${features.voice_probability},
    "transient_strength": ${features.transient_strength}
  },
  "rule_matched": "silence_check" | "voice_high" | "voice_medium" | "piano_standard" | "piano_polyphonic" | "noise_flat" | "fallback"
}`;
};

export type AudioClassification = "piano_playing" | "human_voice" | "silence" | "ambient_noise";

export interface ClassificationResult {
  classification: AudioClassification;
  confidence: number;
  secondary_sound?: AudioClassification | null;
  notes?: string;
  primary_signal?: {
    harmonic_ratio: number;
    voice_probability: number;
    transient_strength: number;
  };
  rule_matched?: string;
}

// 로컬 규칙 기반 분류 (AI API 없이 사용 가능)
export function classifyAudioFeatures(features: AudioFeatures): ClassificationResult {
  const {
    duration_seconds,
    avg_volume_db,
    pitch_detected,
    pitch_stability,
    harmonic_ratio,
    transient_strength,
    spectral_flatness,
    voice_probability,
    polyphonic_probability,
  } = features;

  let confidence: number;
  let classification: AudioClassification;
  let rule_matched: string;

  // 1. SILENCE (highest priority)
  if (avg_volume_db < -55) {
    return {
      classification: "silence",
      confidence: 0.95,
      rule_matched: "silence_check",
      primary_signal: { harmonic_ratio, voice_probability, transient_strength },
    };
  }

  // 2. HUMAN_VOICE
  if (voice_probability > 0.7) {
    confidence = voice_probability;
    classification = "human_voice";
    rule_matched = "voice_high";
  } else if (voice_probability > 0.5 && harmonic_ratio > 0.5 && polyphonic_probability < 0.3) {
    confidence = voice_probability * 0.9;
    classification = "human_voice";
    rule_matched = "voice_medium";
  }
  // 3. PIANO_PLAYING
  else if (
    pitch_detected &&
    harmonic_ratio > 0.55 &&
    transient_strength > 0.4 &&
    pitch_stability > 0.5 &&
    voice_probability < 0.4 &&
    spectral_flatness < 0.5
  ) {
    confidence = (harmonic_ratio + transient_strength + pitch_stability) / 3;
    classification = "piano_playing";
    rule_matched = "piano_standard";
  } else if (polyphonic_probability > 0.6 && harmonic_ratio > 0.5 && voice_probability < 0.3) {
    confidence = polyphonic_probability * 0.85;
    classification = "piano_playing";
    rule_matched = "piano_polyphonic";
  }
  // 4. AMBIENT_NOISE
  else if (spectral_flatness > 0.6 || harmonic_ratio < 0.35) {
    confidence = 0.7;
    classification = "ambient_noise";
    rule_matched = "noise_flat";
  }
  // 5. FALLBACK
  else {
    confidence = 0.4;
    classification = "ambient_noise";
    rule_matched = "fallback";
  }

  // Confidence adjustments based on duration
  if (duration_seconds < 0.5) {
    confidence *= 0.6;
  } else if (duration_seconds < 1.0) {
    confidence *= 0.8;
  }

  // Confidence adjustment based on volume
  if (avg_volume_db < -45) {
    confidence *= 0.9;
  }

  return {
    classification,
    confidence: Math.round(confidence * 100) / 100,
    rule_matched,
    primary_signal: { harmonic_ratio, voice_probability, transient_strength },
  };
}
