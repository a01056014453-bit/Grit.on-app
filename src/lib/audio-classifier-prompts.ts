// AI 기반 오디오 분류 프롬프트
// 악기별 동적 분류 지원

export type ClassifierInstrument = "piano" | "violin" | "cello" | "flute" | "clarinet" | "guitar" | "vocal";

/** 악기별 분류 설명 */
const INSTRUMENT_DESCRIPTIONS: Record<ClassifierInstrument, {
  label: string;
  definition: string;
  edgeCases: string[];
}> = {
  piano: {
    label: "instrument_playing",
    definition: "Acoustic or electronic piano sound with clear hammer-strike attack and harmonic decay. Includes single notes, chords, scales, arpeggios, or any intentional musical content.",
    edgeCases: [
      "**Very soft piano (pp/ppp)**: Still classify as \"instrument_playing\" if harmonic structure is detectable",
      "**Pedal noise only**: Classify as \"ambient_noise\" (no pitched content)",
      "**Electronic keyboard**: Classify as \"instrument_playing\" (acceptable for practice tracking)",
      "**Sustained piano decay**: Classify as \"instrument_playing\" even without new attacks",
    ],
  },
  violin: {
    label: "instrument_playing",
    definition: "Bowed string sound with continuous tone, vibrato, and characteristic overtone structure. Includes sustained notes, double stops, pizzicato, harmonics, and any intentional playing.",
    edgeCases: [
      "**Tuning/open strings**: Classify as \"instrument_playing\" if intentional",
      "**Pizzicato only**: Classify as \"instrument_playing\"",
      "**Rosin/bow noise**: Classify as \"ambient_noise\" if no pitched content",
      "**Very soft passages (pp)**: Still classify as \"instrument_playing\" if pitch is detectable",
    ],
  },
  cello: {
    label: "instrument_playing",
    definition: "Bowed string sound in the lower register with rich overtones. Includes sustained notes, thumb position passages, pizzicato, and any intentional playing.",
    edgeCases: [
      "**Very low notes**: May overlap with ambient noise frequencies — classify as \"instrument_playing\" if intentional bowing detected",
      "**Thumb position high register**: Still classify as \"instrument_playing\"",
      "**Endpin vibration**: Classify as \"ambient_noise\"",
    ],
  },
  flute: {
    label: "instrument_playing",
    definition: "Breathy wind instrument sound with clear pitched tone. Includes sustained notes, scales, trills, flutter tonguing, and any intentional playing.",
    edgeCases: [
      "**Breath sounds while playing**: Classify as \"instrument_playing\" (integral to flute sound)",
      "**Air noise without pitch**: Classify as \"ambient_noise\"",
      "**Very soft low register**: May be quiet — still classify as \"instrument_playing\" if pitch detected",
    ],
  },
  clarinet: {
    label: "instrument_playing",
    definition: "Single-reed wind instrument sound with characteristic overtone structure. Includes chalumeau, clarion, and altissimo registers.",
    edgeCases: [
      "**Reed squeak**: Classify as \"instrument_playing\" (common practice artifact)",
      "**Breath only through instrument**: Classify as \"ambient_noise\" if no pitch",
      "**Register break**: Still classify as \"instrument_playing\"",
    ],
  },
  guitar: {
    label: "instrument_playing",
    definition: "Plucked string sound with attack and decay. Includes single notes, chords, arpeggios, harmonics, and any intentional playing on nylon or steel strings.",
    edgeCases: [
      "**Fret noise/string squeak**: Classify as \"instrument_playing\" (integral to guitar)",
      "**Tuning**: Classify as \"instrument_playing\" if intentional",
      "**Tapping on body**: Classify as \"ambient_noise\"",
    ],
  },
  vocal: {
    label: "instrument_playing",
    definition: "Intentional singing: sustained vocal tones with pitch, melody, and musical expression. Includes opera, art song, vocalise, humming exercises, and any intentional vocal practice.",
    edgeCases: [
      "**Singing vs Speaking**: Singing has sustained pitch and melody — classify as \"instrument_playing\". Speaking has no sustained pitch — classify as \"human_voice\".",
      "**Vocal warm-up exercises (scales, arpeggios)**: Classify as \"instrument_playing\"",
      "**Humming with melody**: Classify as \"instrument_playing\"",
      "**Talking about the piece**: Classify as \"human_voice\"",
      "**Counting beats verbally**: Classify as \"human_voice\"",
    ],
  },
};

/** 악기별 동적 프롬프트 생성 */
export function getAudioClassifierPrompt(instrument: ClassifierInstrument = "piano"): string {
  const desc = INSTRUMENT_DESCRIPTIONS[instrument];
  const isVocal = instrument === "vocal";

  return `You are an audio classifier for a classical ${instrument} practice tracking system.

Analyze the audio segment and classify the PRIMARY sound source.

## CLASSIFICATION LABELS

| Label | Definition |
|-------|------------|
| instrument_playing | ${desc.definition} |
| human_voice | ${isVocal ? "Speaking, counting beats, verbal cues, or non-musical vocalization. NOT singing — singing is classified as instrument_playing." : "Speech, singing, humming, counting, breathing with vocalization, or verbal cues."} |
| silence | Signal amplitude below -50dB or near-zero energy across all frequencies. |
| ambient_noise | Non-musical sounds: page turning, chair movement, metronome clicks, tapping, room noise, recording artifacts. |

## EDGE CASES

${desc.edgeCases.map((c) => `- ${c}`).join("\n")}
- **Instrument + Voice together**: Classify as "instrument_playing" if instrument is the dominant sound
- **Metronome + Instrument**: Classify as "instrument_playing" (metronome is secondary)

## DECISION PRIORITY

1. If clear ${instrument} musical content exists → "instrument_playing"
2. If human vocalization is primary${isVocal ? " (speaking, not singing)" : ""} → "human_voice"
3. If signal energy is negligible → "silence"
4. Otherwise → "ambient_noise"

## OUTPUT FORMAT (JSON only, no markdown)

{
  "classification": "instrument_playing" | "human_voice" | "silence" | "ambient_noise",
  "confidence": 0.0-1.0,
  "secondary_sound": null | "human_voice" | "ambient_noise",
  "notes": "optional brief explanation"
}

CRITICAL: When uncertain between instrument_playing and other classes, choose the non-instrument option. False positives are worse than false negatives for practice time tracking accuracy.`;
}

/** 기존 호환: 기본 피아노 프롬프트 */
export const AUDIO_CLASSIFIER_SYSTEM_PROMPT = getAudioClassifierPrompt("piano");

export interface AudioFeatures {
  duration_seconds: number;
  avg_volume_db: number;
  pitch_detected: boolean;
  pitch_stability: number;
  spectral_centroid: number;
  zero_crossing_rate: number;
}

export interface AudioClassificationResult {
  classification: "instrument_playing" | "human_voice" | "silence" | "ambient_noise";
  confidence: number;
  secondary_sound: string | null;
  notes: string;
}
