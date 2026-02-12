"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Square, Minus, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { VariableProximity } from "@/components/ui/variable-proximity";

// Triplet icon SVG component - 셋잇단음표
const TripletIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 40 36" fill="currentColor" className={className}>
    {/* Left bracket ┌─ */}
    <polyline points="5,1 5,5 14,5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    {/* Right bracket ─┐ (대칭) */}
    <polyline points="35,1 35,5 26,5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    {/* Number 3 */}
    <text x="20" y="6" textAnchor="middle" fontSize="9" fontWeight="bold">3</text>
    {/* Beam - thick horizontal bar */}
    <rect x="7" y="11" width="26" height="3" />
    {/* Stem 1 (left) */}
    <rect x="8" y="11" width="2" height="14" />
    {/* Stem 2 (center) */}
    <rect x="19" y="11" width="2" height="14" />
    {/* Stem 3 (right) */}
    <rect x="30" y="11" width="2" height="14" />
    {/* Note head 1 - 줄기보다 왼쪽으로 */}
    <ellipse cx="6" cy="27" rx="3" ry="2.2" transform="rotate(-20 6 27)" />
    {/* Note head 2 - 줄기보다 왼쪽으로 */}
    <ellipse cx="17" cy="27" rx="3" ry="2.2" transform="rotate(-20 17 27)" />
    {/* Note head 3 - 줄기보다 왼쪽으로 */}
    <ellipse cx="28" cy="27" rx="3" ry="2.2" transform="rotate(-20 28 27)" />
  </svg>
);

// 점8분+16분 아이콘 (Dotted eighth + sixteenth)
const DottedEighthIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 40 36" fill="currentColor" className={className}>
    {/* Beam */}
    <rect x="7" y="8" width="26" height="2.5" />
    {/* Stem 1 (left) */}
    <rect x="8" y="8" width="2" height="16" />
    {/* Stem 2 (right) */}
    <rect x="30" y="8" width="2" height="16" />
    {/* Note head 1 - dotted note (larger) */}
    <ellipse cx="6" cy="26" rx="4" ry="2.8" transform="rotate(-20 6 26)" />
    {/* Dot for dotted note */}
    <circle cx="13" cy="25" r="1.5" />
    {/* Note head 2 - sixteenth (smaller) */}
    <ellipse cx="28" cy="26" rx="3" ry="2.2" transform="rotate(-20 28 26)" />
  </svg>
);

// 16분+점8분 아이콘 (Sixteenth + dotted eighth) - 역방향
const ReverseDottedIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 40 36" fill="currentColor" className={className}>
    {/* Beam */}
    <rect x="7" y="8" width="26" height="2.5" />
    {/* Stem 1 (left) */}
    <rect x="8" y="8" width="2" height="16" />
    {/* Stem 2 (right) */}
    <rect x="30" y="8" width="2" height="16" />
    {/* Note head 1 - sixteenth (smaller) */}
    <ellipse cx="6" cy="26" rx="3" ry="2.2" transform="rotate(-20 6 26)" />
    {/* Note head 2 - dotted note (larger) */}
    <ellipse cx="28" cy="26" rx="4" ry="2.8" transform="rotate(-20 28 26)" />
    {/* Dot for dotted note */}
    <circle cx="35" cy="25" r="1.5" />
  </svg>
);

// 스윙/셔플 아이콘
const SwingIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 40 36" fill="currentColor" className={className}>
    {/* Left bracket ┌─ */}
    <polyline points="5,1 5,5 14,5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    {/* Right bracket ─┐ */}
    <polyline points="35,1 35,5 26,5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    {/* Number 3 with equals sign */}
    <text x="20" y="6" textAnchor="middle" fontSize="8" fontWeight="bold">♪=♪</text>
    {/* Beam */}
    <rect x="7" y="11" width="26" height="2.5" />
    {/* Stem 1 (left) - longer */}
    <rect x="8" y="11" width="2" height="16" />
    {/* Stem 2 (right) - shorter */}
    <rect x="30" y="11" width="2" height="12" />
    {/* Note head 1 (larger - long note) */}
    <ellipse cx="6" cy="29" rx="4" ry="2.8" transform="rotate(-20 6 29)" />
    {/* Note head 2 (smaller - short note) */}
    <ellipse cx="28" cy="25" rx="3" ry="2.2" transform="rotate(-20 28 25)" />
  </svg>
);

// 싱코페이션 아이콘 (8분+4분+8분)
const SyncopationIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 40 36" fill="currentColor" className={className}>
    {/* Upper beam for first and third */}
    <rect x="5" y="6" width="8" height="2" />
    <rect x="27" y="6" width="8" height="2" />
    {/* Stem 1 */}
    <rect x="6" y="6" width="1.5" height="14" />
    {/* Stem 2 (middle, taller) */}
    <rect x="19" y="10" width="2" height="14" />
    {/* Stem 3 */}
    <rect x="33" y="6" width="1.5" height="14" />
    {/* Note head 1 - eighth */}
    <ellipse cx="5" cy="22" rx="3" ry="2" transform="rotate(-20 5 22)" />
    {/* Note head 2 - quarter (larger, center) */}
    <ellipse cx="17" cy="26" rx="4" ry="2.8" transform="rotate(-20 17 26)" />
    {/* Note head 3 - eighth */}
    <ellipse cx="32" cy="22" rx="3" ry="2" transform="rotate(-20 32 22)" />
    {/* Tie arc */}
    <path d="M 8,23 Q 13,27 17,26" fill="none" stroke="currentColor" strokeWidth="1" />
    <path d="M 20,26 Q 25,27 30,23" fill="none" stroke="currentColor" strokeWidth="1" />
  </svg>
);

// 8분음표 3개 묶음 (복합박자용)
const ThreeEighthsIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 40 36" fill="currentColor" className={className}>
    {/* Beam */}
    <rect x="5" y="8" width="30" height="2.5" />
    {/* Stem 1 */}
    <rect x="6" y="8" width="2" height="14" />
    {/* Stem 2 */}
    <rect x="19" y="8" width="2" height="14" />
    {/* Stem 3 */}
    <rect x="32" y="8" width="2" height="14" />
    {/* Note head 1 */}
    <ellipse cx="5" cy="24" rx="3" ry="2.2" transform="rotate(-20 5 24)" />
    {/* Note head 2 */}
    <ellipse cx="18" cy="24" rx="3" ry="2.2" transform="rotate(-20 18 24)" />
    {/* Note head 3 */}
    <ellipse cx="31" cy="24" rx="3" ry="2.2" transform="rotate(-20 31 24)" />
  </svg>
);

// 8분음표 3개 묶음 - 가운데 쉼표 (1-쉼-3 패턴)
const ThreeEighthsRestMiddleIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 40 36" fill="currentColor" className={className}>
    {/* Beam */}
    <rect x="5" y="8" width="30" height="2.5" />
    {/* Stem 1 */}
    <rect x="6" y="8" width="2" height="14" />
    {/* Stem 2 (middle - shorter, no note) */}
    <rect x="19" y="8" width="2" height="10" />
    {/* Stem 3 */}
    <rect x="32" y="8" width="2" height="14" />
    {/* Note head 1 */}
    <ellipse cx="5" cy="24" rx="3" ry="2.2" transform="rotate(-20 5 24)" />
    {/* Rest symbol in middle (eighth rest simplified) */}
    <path d="M 17,20 L 21,24 L 19,26 L 21,28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    {/* Note head 3 */}
    <ellipse cx="31" cy="24" rx="3" ry="2.2" transform="rotate(-20 31 24)" />
  </svg>
);

// Time signatures
const TIME_SIGNATURES = [
  { name: "1/4", beats: 1 },
  { name: "2/4", beats: 2 },
  { name: "3/4", beats: 3 },
  { name: "4/4", beats: 4 },
  { name: "3/8", beats: 3 },
  { name: "6/8", beats: 6 },
  { name: "9/8", beats: 9 },
  { name: "12/8", beats: 12 },
];

// Subdivision pattern type
interface SubdivisionPattern {
  id: string;
  icon: string;
  label: string;
  // pattern: 한 박자 내의 각 음의 비율 (합이 1)
  // 예: [0.5, 0.5] = 8분음표 2개, [0.75, 0.25] = 점8분+16분
  pattern: number[];
  // restIndices: 쉼표 위치 (소리가 나지 않아야 하는 subIndex within pattern)
  restIndices?: number[];
  // mutedBeatMod: For compound meters, mute beats where (beatIndex % 3) is in this array
  // e.g., [1] means mute beats 1, 4, 7, 10... (middle of each group of 3)
  mutedBeatMod?: number[];
}

// Subdivisions with musical note icons
const SUBDIVISIONS: SubdivisionPattern[] = [
  { id: "1", icon: "♩", label: "4분음표", pattern: [1] },
  { id: "2", icon: "♫", label: "8분음표", pattern: [0.5, 0.5] },
  { id: "3", icon: "triplet", label: "셋잇단", pattern: [1/3, 1/3, 1/3] },
  { id: "4", icon: "♬", label: "16분음표", pattern: [0.25, 0.25, 0.25, 0.25] },
  { id: "5", icon: "dotted", label: "점8분+16분", pattern: [0.75, 0.25] },
  { id: "6", icon: "reverse-dotted", label: "16분+점8분", pattern: [0.25, 0.75] },
  { id: "7", icon: "swing", label: "스윙", pattern: [2/3, 1/3] },
  { id: "8", icon: "syncopation", label: "싱코페이션", pattern: [0.25, 0.5, 0.25] },
];

// Compound meter subdivisions (3/8, 6/8, 9/8, 12/8)
// Note: For compound meters, beats = eighth notes, so patterns are per eighth note
const COMPOUND_SUBDIVISIONS: SubdivisionPattern[] = [
  { id: "c1", icon: "♩.", label: "점4분", pattern: [1] },  // 1 sound per dotted quarter (handled via mainBeatIndices)
  { id: "c2", icon: "three-eighths", label: "8분×3", pattern: [1] },  // 1 sound per eighth note
  { id: "c3", icon: "three-eighths-rest", label: "1-쉼-3", pattern: [1], mutedBeatMod: [1] },  // Skip middle eighth (beat % 3 === 1)
];

// Get subdivisions based on time signature
const getSubdivisionsForTimeSig = (timeSigName: string): SubdivisionPattern[] => {
  if (timeSigName === "3/8" || timeSigName === "6/8" || timeSigName === "9/8" || timeSigName === "12/8") {
    return COMPOUND_SUBDIVISIONS;
  }
  return SUBDIVISIONS;
};

// Check if time signature is compound
const isCompoundMeter = (timeSigName: string): boolean => {
  return ["3/8", "6/8", "9/8", "12/8"].includes(timeSigName);
};

// Get main beat indices (which beats should make sound for given subdivision)
const getMainBeatIndices = (timeSig: { name: string; beats: number }, subdivId: string): Set<number> => {
  const mainBeats = new Set<number>();

  if (isCompoundMeter(timeSig.name) && subdivId === "c1") {
    // 점4분: only first beat of each group of 3 makes sound
    for (let i = 0; i < timeSig.beats; i += 3) {
      mainBeats.add(i);
    }
  } else {
    // All beats make sound
    for (let i = 0; i < timeSig.beats; i++) {
      mainBeats.add(i);
    }
  }

  return mainBeats;
};

// Get auto-accents based on time signature and subdivision
const getAutoAccents = (timeSig: { name: string; beats: number }, subdivId: string): boolean[] => {
  const accents = Array(timeSig.beats).fill(false);

  if (isCompoundMeter(timeSig.name)) {
    // Compound meters: accent every 3rd eighth note (1, 4, 7, 10...)
    for (let i = 0; i < timeSig.beats; i += 3) {
      accents[i] = true;
    }
  } else {
    // Simple meters: accent the first beat
    accents[0] = true;
  }

  return accents;
};

// Tempo markings
const getTempoMarking = (bpm: number): string => {
  if (bpm < 40) return "Grave";
  if (bpm < 55) return "Largo";
  if (bpm < 66) return "Larghetto";
  if (bpm < 76) return "Adagio";
  if (bpm < 92) return "Andante";
  if (bpm < 108) return "Moderato";
  if (bpm < 120) return "Allegretto";
  if (bpm < 140) return "Allegro";
  if (bpm < 168) return "Vivace";
  if (bpm < 200) return "Presto";
  return "Prestissimo";
};

// Tempo presets for quick selection
const TEMPO_PRESETS = [
  { name: "Grave", bpm: 35 },
  { name: "Largo", bpm: 50 },
  { name: "Adagio", bpm: 70 },
  { name: "Andante", bpm: 84 },
  { name: "Moderato", bpm: 100 },
  { name: "Allegretto", bpm: 112 },
  { name: "Allegro", bpm: 130 },
  { name: "Vivace", bpm: 152 },
  { name: "Presto", bpm: 180 },
  { name: "Prestissimo", bpm: 220 },
];

export interface MetronomeState {
  isPlaying: boolean;
  tempo: number;
  timeSignature: string;
  subdivision: string; // subdivision id
}

interface MetronomeControlProps {
  onStateChange?: (state: MetronomeState) => void;
  onBeat?: (beatNumber: number, isAccent: boolean, timestamp: number) => void;
  disabled?: boolean;
}

interface ScheduledBeat {
  time: number;
  beatIndex: number;
}

export function MetronomeControl({
  onStateChange,
  onBeat,
  disabled = false,
}: MetronomeControlProps) {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeSig, setTimeSig] = useState(TIME_SIGNATURES[3]); // Default 4/4
  const [subdiv, setSubdiv] = useState(SUBDIVISIONS[0]); // Default ♩
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSubdivDropdown, setShowSubdivDropdown] = useState(false);
  const [showTempoPresets, setShowTempoPresets] = useState(false);

  // 악센트 설정 (각 비트별로 악센트 on/off)
  const [accents, setAccents] = useState<boolean[]>([true, false, false, false]);

  // BPM drag/swipe control
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef(0);
  const dragStartBpmRef = useRef(bpm);

  // Audio refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef(false);
  const nextNoteTimeRef = useRef(0);
  const currentBeatIndexRef = useRef(0);
  const schedulerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scheduledBeatsRef = useRef<ScheduledBeat[]>([]);

  // Main beat indices (which beats make sound)
  const mainBeatIndices = getMainBeatIndices(timeSig, subdiv.id);

  // Check if a beat is muted (for c3 pattern etc.)
  const isBeatMuted = (beatIndex: number): boolean => {
    const mutedBeatMod = subdiv.mutedBeatMod || [];
    return mutedBeatMod.includes(beatIndex % 3);
  };

  // Check if a beat will make sound (considering mainBeatIndices and muted beats)
  const willBeatSound = (beatIndex: number): boolean => {
    return mainBeatIndices.has(beatIndex) && !isBeatMuted(beatIndex);
  };

  // Settings refs (to avoid stale closures)
  const bpmRef = useRef(bpm);
  const subdivRef = useRef(subdiv);
  const timeSigRef = useRef(timeSig);
  const accentsRef = useRef(accents);
  const mainBeatIndicesRef = useRef(mainBeatIndices);

  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { subdivRef.current = subdiv; }, [subdiv]);
  useEffect(() => { timeSigRef.current = timeSig; }, [timeSig]);
  useEffect(() => { accentsRef.current = accents; }, [accents]);
  useEffect(() => { mainBeatIndicesRef.current = mainBeatIndices; }, [mainBeatIndices]);

  // 박자 또는 세분 변경 시 악센트 자동 설정
  useEffect(() => {
    const newAccents = getAutoAccents(timeSig, subdiv.id);
    setAccents(newAccents);
  }, [timeSig, subdiv.id]);

  // 악센트 토글
  const toggleAccent = (index: number) => {
    setAccents(prev => {
      const newAccents = [...prev];
      newAccents[index] = !newAccents[index];
      return newAccents;
    });
  };

  // Notify state change
  useEffect(() => {
    onStateChange?.({
      isPlaying,
      tempo: bpm,
      timeSignature: timeSig.name,
      subdivision: subdiv.id,
    });
  }, [isPlaying, bpm, timeSig, subdiv, onStateChange]);

  // Schedule a single note
  // beatIndex: 0 ~ (beats-1), subIndex: 0 ~ (pattern.length-1)
  const scheduleNote = useCallback((time: number, beatIndex: number, subIndex: number) => {
    if (!audioCtxRef.current) return;

    const currentSubdiv = subdivRef.current;
    const isMainBeat = subIndex === 0;
    const isSoundBeat = mainBeatIndicesRef.current.has(beatIndex);
    const isAccent = isMainBeat && (accentsRef.current[beatIndex] || false);

    // Check if this is a rest position using restIndices from subdivision pattern
    const restIndices = currentSubdiv.restIndices || [];
    const isRestPosition = restIndices.includes(subIndex);

    // Check if this beat should be muted (for compound meter patterns like 1-쉼-3)
    const mutedBeatMod = currentSubdiv.mutedBeatMod || [];
    const isMutedBeat = mutedBeatMod.includes(beatIndex % 3);

    // Determine if sound should play
    // - For main beats (subIndex 0): play if beatIndex is in mainBeatIndices and not muted
    // - For subdivisions (subIndex > 0): play unless it's a rest position or beat is muted
    const shouldPlaySound = isMainBeat
      ? isSoundBeat && !isRestPosition && !isMutedBeat
      : !isRestPosition && !isMutedBeat;

    if (shouldPlaySound) {
      // Create oscillator for click sound
      const osc = audioCtxRef.current.createOscillator();
      const envelope = audioCtxRef.current.createGain();

      // Different frequencies for accent, main beat, subdivision
      osc.frequency.value = isAccent ? 880 : isMainBeat ? 660 : 440;
      osc.type = "sine";

      // Volume envelope
      const volume = isAccent ? 0.5 : isMainBeat ? 0.35 : 0.2;
      envelope.gain.setValueAtTime(volume, time);
      envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

      osc.connect(envelope);
      envelope.connect(audioCtxRef.current.destination);
      osc.start(time);
      osc.stop(time + 0.05);
    }

    // Store scheduled beat for visual sync (only main beats for display)
    if (isMainBeat) {
      scheduledBeatsRef.current.push({ time, beatIndex });
    }

    // Callback for beat
    if (isMainBeat && onBeat && isSoundBeat) {
      const delayMs = Math.max(0, (time - audioCtxRef.current.currentTime) * 1000);
      setTimeout(() => {
        onBeat(beatIndex + 1, isAccent, Date.now());
      }, delayMs);
    }
  }, [onBeat]);

  // Track current position: beat and sub-index within pattern
  const currentSubIndexRef = useRef(0);

  // Scheduler - runs ahead and schedules notes
  const scheduler = useCallback(() => {
    if (!audioCtxRef.current || !isPlayingRef.current) return;

    const scheduleAheadTime = 0.1; // Schedule 100ms ahead
    const beats = timeSigRef.current.beats; // Use total beats for cycling
    const pattern = subdivRef.current.pattern;

    while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + scheduleAheadTime) {
      scheduleNote(
        nextNoteTimeRef.current,
        currentBeatIndexRef.current,
        currentSubIndexRef.current
      );

      // Calculate next note time based on pattern
      const secondsPerBeat = 60.0 / bpmRef.current;
      const currentRatio = pattern[currentSubIndexRef.current];
      const noteLength = secondsPerBeat * currentRatio;
      nextNoteTimeRef.current += noteLength;

      // Advance to next sub-index or next beat
      currentSubIndexRef.current++;
      if (currentSubIndexRef.current >= pattern.length) {
        currentSubIndexRef.current = 0;
        currentBeatIndexRef.current = (currentBeatIndexRef.current + 1) % beats;
      }
    }

    // Schedule next scheduler call
    schedulerTimerRef.current = setTimeout(scheduler, 25);
  }, [scheduleNote]);

  // Visual update loop using requestAnimationFrame
  const updateVisual = useCallback(() => {
    if (!audioCtxRef.current || !isPlayingRef.current) return;

    const currentTime = audioCtxRef.current.currentTime;

    // Find the most recent beat that should be displayed
    let latestBeat = -1;
    const beatsToRemove: number[] = [];

    scheduledBeatsRef.current.forEach((beat, index) => {
      if (beat.time <= currentTime) {
        latestBeat = beat.beatIndex;
        beatsToRemove.push(index);
      }
    });

    // Remove old beats (keep only future ones)
    if (beatsToRemove.length > 0) {
      scheduledBeatsRef.current = scheduledBeatsRef.current.filter(
        (_, index) => !beatsToRemove.includes(index)
      );
    }

    // Update visual state only when beat changes
    if (latestBeat !== -1) {
      setCurrentBeat(latestBeat);
    }

    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(updateVisual);
  }, []);

  // Start metronome
  const startMetronome = useCallback(() => {
    if (disabled) return;

    // Initialize AudioContext
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }

    // Reset state
    isPlayingRef.current = true;
    currentBeatIndexRef.current = 0;
    currentSubIndexRef.current = 0;
    nextNoteTimeRef.current = audioCtxRef.current.currentTime;
    scheduledBeatsRef.current = [];
    setCurrentBeat(0);
    setIsPlaying(true);

    // Start scheduler and visual loop
    scheduler();
    animationFrameRef.current = requestAnimationFrame(updateVisual);
  }, [disabled, scheduler, updateVisual]);

  // Stop metronome
  const stopMetronome = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setCurrentBeat(-1);
    currentBeatIndexRef.current = 0;
    currentSubIndexRef.current = 0;

    if (schedulerTimerRef.current) {
      clearTimeout(schedulerTimerRef.current);
      schedulerTimerRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    scheduledBeatsRef.current = [];
  }, []);

  // Toggle metronome
  const toggleMetronome = useCallback(() => {
    if (isPlaying) {
      stopMetronome();
    } else {
      startMetronome();
    }
  }, [isPlaying, startMetronome, stopMetronome]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMetronome();
    };
  }, [stopMetronome]);

  // BPM drag handlers
  const handleDragStart = useCallback((clientX: number) => {
    if (disabled) return;
    setIsDragging(true);
    dragStartXRef.current = clientX;
    dragStartBpmRef.current = bpm;
  }, [disabled, bpm]);

  const handleDragMove = useCallback((clientX: number) => {
    if (!isDragging || disabled) return;

    const deltaX = clientX - dragStartXRef.current;
    // 10px = 1 BPM change
    const deltaBpm = Math.round(deltaX / 10);
    const newBpm = Math.max(20, Math.min(300, dragStartBpmRef.current + deltaBpm));
    setBpm(newBpm);
  }, [isDragging, disabled]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX);
  }, [handleDragMove]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    handleDragStart(e.clientX);
  }, [handleDragStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    handleDragMove(e.clientX);
  }, [handleDragMove]);

  const handleMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      handleDragEnd();
    }
  }, [isDragging, handleDragEnd]);

  const tempoMarking = getTempoMarking(bpm);

  // Container ref for VariableProximity
  const bpmContainerRef = useRef<HTMLDivElement>(null);

  // Collapsed view
  if (!isExpanded) {
    return (
      <div className="overflow-hidden">
        <div className="px-3 py-2 flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2.5 hover:opacity-70 transition-opacity"
            disabled={disabled}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isPlaying ? "bg-black" : "bg-gray-100"
            }`}>
              <span className={`text-sm ${isPlaying ? "text-white" : "text-gray-400"}`}>♩</span>
            </div>
            <div className="text-left">
              <span className="font-semibold text-sm text-black">메트로놈</span>
              <p className={`text-[11px] ${isPlaying ? "text-black" : "text-gray-400"}`}>
                {isPlaying ? `${bpm} BPM · ${timeSig.name}` : "OFF"}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-1.5">
            {/* ON/OFF Toggle Button */}
            <button
              onClick={toggleMetronome}
              disabled={disabled}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                isPlaying
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              } disabled:opacity-50`}
            >
              {isPlaying ? "ON" : "OFF"}
            </button>
            <button
              onClick={() => setIsExpanded(true)}
              className="p-0.5 hover:bg-gray-100 rounded-full transition-colors"
              disabled={disabled}
            >
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div className="overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(false)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100"
      >
        <span className="font-semibold text-black">메트로놈</span>
        <ChevronUp className="w-5 h-5 text-gray-400" />
      </button>

      {/* Beat Visualization - 터치하여 악센트 설정 */}
      <div className="px-3 py-3 mx-4">
        {timeSig.beats > 6 ? (
          // Two rows for beats > 6
          // 9/8: 6 + 3, 12/8: 6 + 6
          (() => {
            const firstRowCount = timeSig.name === "9/8" ? 6 : Math.ceil(timeSig.beats / 2);
            const secondRowCount = timeSig.beats - firstRowCount;
            return (
              <div className="flex flex-col items-center gap-2">
                <div className="flex justify-center gap-2">
                  {[...Array(firstRowCount)].map((_, i) => {
                    const isActive = isPlaying && currentBeat === i;
                    const hasAccent = accents[i] || false;
                    const isSoundBeat = willBeatSound(i);
                    return (
                      <button
                        key={i}
                        onClick={() => toggleAccent(i)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-50 ${
                          isActive
                            ? "bg-white scale-110"
                            : hasAccent
                            ? "bg-violet-500"
                            : isSoundBeat
                            ? "bg-gray-300"
                            : "bg-gray-200"
                        }`}
                      >
                        {hasAccent && (
                          <span className={`font-bold text-xs ${isActive ? "text-black" : isPlaying ? "text-white" : "text-white"}`}>
                            ^
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-center gap-2">
                  {[...Array(secondRowCount)].map((_, i) => {
                    const beatIndex = firstRowCount + i;
                    const isActive = isPlaying && currentBeat === beatIndex;
                    const hasAccent = accents[beatIndex] || false;
                    const isSoundBeat = willBeatSound(beatIndex);
                    return (
                      <button
                        key={beatIndex}
                        onClick={() => toggleAccent(beatIndex)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-50 ${
                          isActive
                            ? "bg-white scale-110"
                            : hasAccent
                            ? "bg-violet-500"
                            : isSoundBeat
                            ? "bg-gray-300"
                            : "bg-gray-200"
                        }`}
                      >
                        {hasAccent && (
                          <span className={`font-bold text-xs ${isActive ? "text-black" : isPlaying ? "text-white" : "text-white"}`}>
                            ^
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()
        ) : (
          // Single row for beats <= 6
          <div className="flex justify-center gap-2">
            {[...Array(timeSig.beats)].map((_, i) => {
              const isActive = isPlaying && currentBeat === i;
              const hasAccent = accents[i] || false;
              const isSoundBeat = willBeatSound(i);
              return (
                <button
                  key={i}
                  onClick={() => toggleAccent(i)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-50 ${
                    isActive
                      ? "bg-white scale-110"
                      : hasAccent
                      ? "bg-violet-500"
                      : isSoundBeat
                      ? "bg-gray-600"
                      : "bg-gray-700"
                  }`}
                >
                  {hasAccent && (
                    <span className={`font-bold text-xs ${isActive ? "text-black" : "text-white"}`}>
                      ^
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        <p className="text-[10px] text-gray-400 text-center mt-2">
          터치하여 악센트 설정
        </p>
      </div>

      {/* BPM Control */}
      <div ref={bpmContainerRef} className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-center gap-3 mb-2">
          <button
            onClick={() => setBpm(b => Math.max(20, b - 1))}
            disabled={disabled || bpm <= 20}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 disabled:opacity-30 transition-colors"
          >
            <Minus className="w-4 h-4 text-gray-600" />
          </button>

          {/* BPM Display - Swipeable with VariableProximity */}
          <div
            className={`text-center min-w-[110px] select-none touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleDragEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            <div className="flex items-baseline justify-center gap-1">
              <VariableProximity
                label={String(bpm)}
                fromFontVariationSettings="'wght' 300"
                toFontVariationSettings="'wght' 900"
                containerRef={bpmContainerRef}
                radius={100}
                falloff="gaussian"
                className={`text-4xl tabular-nums transition-colors ${isDragging ? 'text-violet-600' : 'text-black'}`}
              />
              <span className="text-xs text-gray-400 ml-1">BPM</span>
            </div>
          </div>

          <button
            onClick={() => setBpm(b => Math.min(300, b + 1))}
            disabled={disabled || bpm >= 300}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 disabled:opacity-30 transition-colors"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <button
          onClick={() => setShowTempoPresets(prev => !prev)}
          className="w-full text-center mb-1 hover:opacity-70 transition-opacity"
        >
          <VariableProximity
            label={tempoMarking}
            fromFontVariationSettings="'wght' 300"
            toFontVariationSettings="'wght' 800"
            containerRef={bpmContainerRef}
            radius={80}
            falloff="linear"
            className="text-sm text-gray-500 italic"
          />
          <ChevronDown className={`w-3 h-3 text-gray-400 inline-block ml-1 transition-transform ${showTempoPresets ? "rotate-180" : ""}`} />
        </button>
        <p className="text-center text-[10px] text-gray-400 mb-2">← 스와이프하여 BPM 조절 →</p>

        {/* Tempo Presets - Toggle */}
        {showTempoPresets && (
          <div className="flex flex-wrap justify-center gap-1.5 mb-4">
            {TEMPO_PRESETS.map((preset) => {
              const isActive = tempoMarking === preset.name;
              return (
                <button
                  key={preset.name}
                  onClick={() => setBpm(preset.bpm)}
                  disabled={disabled}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  } disabled:opacity-50`}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Play/Stop with Subdivision */}
        <div className="flex items-center justify-center gap-5">
          {/* Time Signature */}
          <div className="text-center">
            <select
              value={timeSig.name}
              onChange={(e) => {
                const found = TIME_SIGNATURES.find(s => s.name === e.target.value);
                if (found) {
                  setTimeSig(found);
                  const newSubdivs = getSubdivisionsForTimeSig(found.name);
                  setSubdiv(newSubdivs[0]);
                }
              }}
              disabled={disabled}
              className="text-base font-light text-black bg-transparent border-none focus:outline-none cursor-pointer"
            >
              {TIME_SIGNATURES.map((ts) => (
                <option key={ts.name} value={ts.name}>{ts.name}</option>
              ))}
            </select>
          </div>

          {/* Play Button */}
          <button
            onClick={toggleMetronome}
            disabled={disabled}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isPlaying
                ? "bg-gray-200 hover:bg-gray-300"
                : "bg-gradient-to-br from-violet-500 to-violet-700 hover:from-violet-600 hover:to-violet-800"
            } disabled:opacity-50`}
          >
            {isPlaying ? (
              <Square className="w-5 h-5 text-black" fill="currentColor" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
            )}
          </button>

          {/* Subdivision Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSubdivDropdown(!showSubdivDropdown)}
              disabled={disabled}
              className="w-11 h-11 rounded-xl bg-gray-100 flex flex-col items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {subdiv.icon === "triplet" ? (
                <TripletIcon className="w-7 h-6 text-gray-700" />
              ) : subdiv.icon === "dotted" ? (
                <DottedEighthIcon className="w-7 h-6 text-gray-700" />
              ) : subdiv.icon === "reverse-dotted" ? (
                <ReverseDottedIcon className="w-7 h-6 text-gray-700" />
              ) : subdiv.icon === "swing" ? (
                <SwingIcon className="w-7 h-6 text-gray-700" />
              ) : subdiv.icon === "syncopation" ? (
                <SyncopationIcon className="w-7 h-6 text-gray-700" />
              ) : subdiv.icon === "three-eighths" ? (
                <ThreeEighthsIcon className="w-7 h-6 text-gray-700" />
              ) : subdiv.icon === "three-eighths-rest" ? (
                <ThreeEighthsRestMiddleIcon className="w-7 h-6 text-gray-700" />
              ) : (
                <span className="text-lg text-gray-700">{subdiv.icon}</span>
              )}
              <ChevronDown className="w-3 h-3 text-gray-400 mt-0.5" />
            </button>

            {/* Dropdown Menu */}
            {showSubdivDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSubdivDropdown(false)}
                />
                <div className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-200 p-2 z-20 min-w-[200px]">
                  <p className="text-[10px] text-gray-400 px-2 mb-2">세분 (Subdivision)</p>
                  <div className="grid grid-cols-4 gap-1">
                    {getSubdivisionsForTimeSig(timeSig.name).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSubdiv(item);
                          setShowSubdivDropdown(false);
                        }}
                        className={`h-12 rounded-lg flex flex-col items-center justify-center transition-colors ${
                          subdiv.id === item.id
                            ? "bg-black text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {item.icon === "triplet" ? (
                          <TripletIcon className="w-6 h-5" />
                        ) : item.icon === "dotted" ? (
                          <DottedEighthIcon className="w-6 h-5" />
                        ) : item.icon === "reverse-dotted" ? (
                          <ReverseDottedIcon className="w-6 h-5" />
                        ) : item.icon === "swing" ? (
                          <SwingIcon className="w-6 h-5" />
                        ) : item.icon === "syncopation" ? (
                          <SyncopationIcon className="w-6 h-5" />
                        ) : item.icon === "three-eighths" ? (
                          <ThreeEighthsIcon className="w-6 h-5" />
                        ) : item.icon === "three-eighths-rest" ? (
                          <ThreeEighthsRestMiddleIcon className="w-6 h-5" />
                        ) : (
                          <span className="text-base leading-none">{item.icon}</span>
                        )}
                        <span className="text-[7px] mt-0.5 opacity-70">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
