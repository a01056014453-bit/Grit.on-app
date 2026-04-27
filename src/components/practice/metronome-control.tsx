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
    {/* Top beam */}
    <rect x="7" y="8" width="26" height="3" />
    {/* Second beam (right only - 16th note) */}
    <rect x="19" y="13" width="14" height="3" />
    {/* Left stem */}
    <rect x="8" y="8" width="2" height="17" />
    {/* Right stem */}
    <rect x="30" y="8" width="2" height="17" />
    {/* Left note head */}
    <ellipse cx="6" cy="27" rx="3" ry="2.2" transform="rotate(-20 6 27)" />
    {/* Dot */}
    <circle cx="12" cy="26" r="1.3" />
    {/* Right note head */}
    <ellipse cx="28" cy="27" rx="3" ry="2.2" transform="rotate(-20 28 27)" />
  </svg>
);

// 16분+점8분 아이콘 (Sixteenth + dotted eighth) - 역방향
const ReverseDottedIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 40 36" fill="currentColor" className={className}>
    {/* Top beam */}
    <rect x="7" y="8" width="26" height="3" />
    {/* Second beam (left only - 16th note) */}
    <rect x="7" y="13" width="14" height="3" />
    {/* Left stem */}
    <rect x="8" y="8" width="2" height="17" />
    {/* Right stem */}
    <rect x="30" y="8" width="2" height="17" />
    {/* Left note head */}
    <ellipse cx="6" cy="27" rx="3" ry="2.2" transform="rotate(-20 6 27)" />
    {/* Right note head */}
    <ellipse cx="28" cy="27" rx="3" ry="2.2" transform="rotate(-20 28 27)" />
    {/* Dot */}
    <circle cx="34" cy="26" r="1.3" />
  </svg>
);

// 16분음표 4개 묶음 아이콘 (1박 = 4개 stem 연결)
const SixteenthNoteIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 48 36" fill="currentColor" className={className}>
    {/* Top beam (전체 연결) */}
    <rect x="5" y="6" width="38" height="2.5" />
    {/* Second beam (전체 연결 — 16분음표 표시) */}
    <rect x="5" y="11" width="38" height="2.5" />
    {/* Stem 1 */}
    <rect x="5" y="6" width="2" height="19" />
    {/* Stem 2 */}
    <rect x="17" y="6" width="2" height="19" />
    {/* Stem 3 */}
    <rect x="29" y="6" width="2" height="19" />
    {/* Stem 4 */}
    <rect x="41" y="6" width="2" height="19" />
    {/* Note head 1 */}
    <ellipse cx="4" cy="27" rx="3" ry="2.2" transform="rotate(-20 4 27)" />
    {/* Note head 2 */}
    <ellipse cx="16" cy="27" rx="3" ry="2.2" transform="rotate(-20 16 27)" />
    {/* Note head 3 */}
    <ellipse cx="28" cy="27" rx="3" ry="2.2" transform="rotate(-20 28 27)" />
    {/* Note head 4 */}
    <ellipse cx="40" cy="27" rx="3" ry="2.2" transform="rotate(-20 40 27)" />
  </svg>
);

// 스윙/셔플 아이콘
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

// ─── Time Signatures (numerator/denominator 기반) ────────────────────────────
const TIME_SIGNATURES = [
  { numerator: 1, denominator: 4, label: "1/4", accentBeats: [0], isCompound: false },
  { numerator: 2, denominator: 4, label: "2/4", accentBeats: [0], isCompound: false },
  { numerator: 3, denominator: 4, label: "3/4", accentBeats: [0], isCompound: false },
  { numerator: 4, denominator: 4, label: "4/4", accentBeats: [0], isCompound: false },
  { numerator: 3, denominator: 8, label: "3/8", accentBeats: [0], isCompound: true },
  { numerator: 6, denominator: 8, label: "6/8", accentBeats: [0, 3], isCompound: true },
  { numerator: 9, denominator: 8, label: "9/8", accentBeats: [0, 3, 6], isCompound: true },
  { numerator: 12, denominator: 8, label: "12/8", accentBeats: [0, 3, 6, 9], isCompound: true },
];
type TimeSignature = typeof TIME_SIGNATURES[number];

// 복합박자: BPM = 점4분음표 기준 → 8분음표 간격 = (60/BPM) / 3
// 단순박자: BPM = 4분음표 기준 → (60/BPM) × (4/분모)
const getBeatInterval = (bpm: number, ts: TimeSignature): number => {
  if (ts.isCompound) {
    return (60.0 / bpm) / 3; // 점4분음표 BPM → 8분음표 간격
  }
  return (60.0 / bpm) * (4 / ts.denominator);
};

// 기준음표 기호
const BEAT_SYMBOL: Record<number, string> = { 2: "𝅗𝅥", 4: "♩", 8: "♪" };

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
  // mutedBeatMod: 복합박자에서 (beatIndex % 3)가 이 배열에 포함되면 음소거
  mutedBeatMod?: number[];
}

// Subdivisions with musical note icons
const SUBDIVISIONS: SubdivisionPattern[] = [
  { id: "1", icon: "♩", label: "4분음표", pattern: [1] },
  { id: "2", icon: "♫", label: "8분음표", pattern: [0.5, 0.5] },
  { id: "3", icon: "triplet", label: "셋잇단", pattern: [1/3, 1/3, 1/3] },
  { id: "4", icon: "sixteenth", label: "16분음표", pattern: [0.25, 0.25, 0.25, 0.25] },
  { id: "5", icon: "dotted", label: "점8분+16분", pattern: [0.75, 0.25] },
  { id: "6", icon: "reverse-dotted", label: "16분+점8분", pattern: [0.25, 0.75] },
];

// Compound meter subdivisions (3/8, 6/8, 9/8, 12/8)
// 각 beat = 8분음표 1개, 패턴은 [1]
const COMPOUND_SUBDIVISIONS: SubdivisionPattern[] = [
  { id: "c1", icon: "♩.", label: "점4분", pattern: [1] },           // 강박 위치만 소리
  { id: "c2", icon: "three-eighths", label: "8분×3", pattern: [1] }, // 모든 8분음표 소리
  { id: "c3", icon: "three-eighths-rest", label: "1-쉼-3", pattern: [1], mutedBeatMod: [1] }, // 가운데 쉼표
];

// Get subdivisions based on time signature
const getSubdivisionsForTimeSig = (ts: TimeSignature): SubdivisionPattern[] => {
  return ts.isCompound ? COMPOUND_SUBDIVISIONS : SUBDIVISIONS;
};

// c1: 강박 위치만 소리, c2: 전부, c3: 가운데 쉼표(mutedBeatMod)
const getMainBeatIndices = (ts: TimeSignature, patternId: string): Set<number> => {
  const mainBeats = new Set<number>();
  if (ts.isCompound && patternId === "c1") {
    ts.accentBeats.forEach(i => mainBeats.add(i));
  } else {
    for (let i = 0; i < ts.numerator; i++) mainBeats.add(i);
  }
  return mainBeats;
};

// 악센트: 항상 numerator 크기, accentBeats 위치
const getAutoAccents = (ts: TimeSignature): boolean[] => {
  const accents = Array(ts.numerator).fill(false) as boolean[];
  ts.accentBeats.forEach(i => { accents[i] = true; });
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

  // Main beat indices (compound c1: 강박만)
  const mainBeatIndices = getMainBeatIndices(timeSig, subdiv.id);

  // Check if a beat is muted (compound c3: 가운데 쉼표)
  const isBeatMuted = (beatIndex: number): boolean => {
    return (subdiv.mutedBeatMod || []).includes(beatIndex % 3);
  };

  // Check if a beat will make sound
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
    const newAccents = getAutoAccents(timeSig);
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
      timeSignature: timeSig.label,
      subdivision: subdiv.id,
    });
  }, [isPlaying, bpm, timeSig, subdiv, onStateChange]);

  // Schedule a single note with timbre-based sound differentiation
  const scheduleNote = useCallback((time: number, beatIndex: number, subIndex: number) => {
    if (!audioCtxRef.current) return;

    const currentSubdiv = subdivRef.current;
    const isMainBeat = subIndex === 0;
    const isSoundBeat = mainBeatIndicesRef.current.has(beatIndex);
    const isAccent = isMainBeat && (accentsRef.current[beatIndex] || false);

    // 쉼표/뮤트 체크
    const restIndices = currentSubdiv.restIndices || [];
    const isRestPosition = restIndices.includes(subIndex);
    const mutedBeatMod = currentSubdiv.mutedBeatMod || [];
    const isMutedBeat = mutedBeatMod.includes(beatIndex % 3);

    const shouldPlaySound = isMainBeat
      ? isSoundBeat && !isRestPosition && !isMutedBeat
      : !isRestPosition && !isMutedBeat;

    if (shouldPlaySound) {
      const osc = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();
      osc.connect(gain);
      gain.connect(audioCtxRef.current.destination);

      if (isAccent) {
        // 강박: triangle, 1500Hz, 짧고 날카로운 소리
        osc.type = "triangle";
        osc.frequency.value = 1500;
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
      } else if (isMainBeat) {
        // 약박: sine, 900Hz, 둥근 소리
        osc.type = "sine";
        osc.frequency.value = 900;
        gain.gain.setValueAtTime(0.45, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
      } else {
        // 세분화: sine, 600Hz, 부드러운 소리
        osc.type = "sine";
        osc.frequency.value = 600;
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);
      }

      osc.start(time);
      osc.stop(time + 0.08);
    }

    // Store scheduled beat for visual sync
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
    const beats = timeSigRef.current.numerator;
    const pattern = subdivRef.current.pattern;

    while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + scheduleAheadTime) {
      scheduleNote(
        nextNoteTimeRef.current,
        currentBeatIndexRef.current,
        currentSubIndexRef.current
      );

      const secondsPerBeat = getBeatInterval(bpmRef.current, timeSigRef.current);
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
              isPlaying ? "bg-violet-600" : "bg-white/40"
            }`}>
              <span className={`text-sm ${isPlaying ? "text-white" : "text-gray-500"}`}>♩</span>
            </div>
            <div className="text-left">
              <span className="font-semibold text-sm text-black">메트로놈</span>
              <p className={`text-[11px] ${isPlaying ? "text-black" : "text-gray-400"}`}>
                {isPlaying ? `${BEAT_SYMBOL[timeSig.denominator] || "♩"}=${bpm} · ${timeSig.label}` : "OFF"}
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
                  ? "bg-violet-600 text-white"
                  : "bg-white/40 text-gray-500 hover:bg-white/60"
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
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/30 transition-colors border-b border-white/30"
      >
        <span className="font-semibold text-black">메트로놈</span>
        <ChevronUp className="w-5 h-5 text-gray-400" />
      </button>

      {/* Beat Visualization - 터치하여 악센트 설정 */}
      <div className="px-3 py-3 mx-4">
        {(() => {
          const renderDot = (i: number) => {
            const isActive = isPlaying && currentBeat === i;
            const hasAccent = accents[i] || false;
            const isSoundBeat = willBeatSound(i);
            const dotSize = hasAccent ? "w-10 h-10" : "w-7 h-7";

            return (
              <button
                key={i}
                onClick={() => toggleAccent(i)}
                className={`rounded-full flex items-center justify-center transition-all duration-75 ${dotSize} ${
                  isActive
                    ? hasAccent ? "bg-white scale-125 shadow-lg" : "bg-white/90 scale-110"
                    : hasAccent
                    ? "bg-violet-500"
                    : isSoundBeat
                    ? "bg-gray-300"
                    : "bg-gray-200"
                }`}
              >
                {hasAccent && (
                  <span className={`font-bold text-[10px] ${isActive ? "text-black" : "text-white"}`}>
                    ^
                  </span>
                )}
              </button>
            );
          };

          if (timeSig.numerator > 6) {
            const firstRowCount = timeSig.numerator === 9 ? 6 : Math.ceil(timeSig.numerator / 2);
            return (
              <div className="flex flex-col items-center gap-2">
                <div className="flex justify-center gap-1.5">
                  {[...Array(firstRowCount)].map((_, i) => renderDot(i))}
                </div>
                <div className="flex justify-center gap-1.5">
                  {[...Array(timeSig.numerator - firstRowCount)].map((_, i) => renderDot(firstRowCount + i))}
                </div>
              </div>
            );
          }

          return (
            <div className="flex justify-center gap-2">
              {[...Array(timeSig.numerator)].map((_, i) => renderDot(i))}
            </div>
          );
        })()}
        <p className="text-[10px] text-violet-400 text-center mt-1.5">
          {BEAT_SYMBOL[timeSig.denominator] || "♩"} = {bpm} BPM
        </p>
        <p className="text-[10px] text-gray-400 text-center mt-1">
          터치하여 악센트 설정
        </p>
      </div>

      {/* BPM Control */}
      <div ref={bpmContainerRef} className="px-4 py-3 border-b border-white/30">
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
              value={timeSig.label}
              onChange={(e) => {
                const found = TIME_SIGNATURES.find(s => s.label === e.target.value);
                if (found) {
                  setTimeSig(found);
                  const newSubdivs = getSubdivisionsForTimeSig(found);
                  setSubdiv(newSubdivs[0]);
                }
              }}
              disabled={disabled}
              className="text-base font-light text-black bg-transparent border-none focus:outline-none cursor-pointer"
            >
              {TIME_SIGNATURES.map((ts) => (
                <option key={ts.label} value={ts.label}>{ts.label}</option>
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
              ) : subdiv.icon === "sixteenth" ? (
                <SixteenthNoteIcon className="w-7 h-6 text-gray-700" />
              ) : subdiv.icon === "dotted" ? (
                <DottedEighthIcon className="w-7 h-6 text-gray-700" />
              ) : subdiv.icon === "reverse-dotted" ? (
                <ReverseDottedIcon className="w-7 h-6 text-gray-700" />
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
                    {getSubdivisionsForTimeSig(timeSig).map((item) => (
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
                        ) : item.icon === "sixteenth" ? (
                          <SixteenthNoteIcon className="w-6 h-5" />
                        ) : item.icon === "dotted" ? (
                          <DottedEighthIcon className="w-6 h-5" />
                        ) : item.icon === "reverse-dotted" ? (
                          <ReverseDottedIcon className="w-6 h-5" />
                        ) : item.icon === "three-eighths" ? (
                          <ThreeEighthsIcon className="w-6 h-5" />
                        ) : item.icon === "three-eighths-rest" ? (
                          <ThreeEighthsRestMiddleIcon className="w-6 h-5" />
                        ) : (
                          <span className="text-base leading-none">{item.icon}</span>
                        )}
                        {null}
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
