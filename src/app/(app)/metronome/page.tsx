"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, Pause, Minus, Plus, Volume2, VolumeX } from "lucide-react";
import { safeBack } from "@/lib/navigation";

// ─── Tempo Presets ───────────────────────────────────────────────────────────

const TEMPO_PRESETS = [
  { label: "Larghissimo", bpm: 20,  range: "~24",     symbol: "𝅜" },
  { label: "Grave",       bpm: 35,  range: "25~45",   symbol: "𝅗𝅥" },
  { label: "Largo",       bpm: 50,  range: "40~60",   symbol: "𝅗𝅥" },
  { label: "Larghetto",   bpm: 58,  range: "52~60",   symbol: "𝅗𝅥" },
  { label: "Adagio",      bpm: 66,  range: "56~76",   symbol: "♩" },
  { label: "Adagietto",   bpm: 74,  range: "70~80",   symbol: "♩" },
  { label: "Andante",     bpm: 92,  range: "76~108",  symbol: "♩" },
  { label: "Andantino",   bpm: 100, range: "80~108",  symbol: "♩" },
  { label: "Moderato",    bpm: 114, range: "98~120",  symbol: "♩" },
  { label: "Allegretto",  bpm: 116, range: "112~120", symbol: "♩" },
  { label: "Allegro",     bpm: 144, range: "120~168", symbol: "♩♩" },
  { label: "Vivace",      bpm: 164, range: "156~176", symbol: "♩♩" },
  { label: "Vivacissimo", bpm: 174, range: "172~176", symbol: "♩♩" },
  { label: "Presto",      bpm: 184, range: "168~200", symbol: "♩♩♩" },
  { label: "Prestissimo", bpm: 210, range: "200~",    symbol: "♩♩♩" },
];

// ─── Time Signatures ─────────────────────────────────────────────────────────

const TIME_SIGNATURES = [
  { numerator: 2,  denominator: 4, label: "2/4",  accentBeats: [0], isCompound: false },
  { numerator: 3,  denominator: 4, label: "3/4",  accentBeats: [0], isCompound: false },
  { numerator: 4,  denominator: 4, label: "4/4",  accentBeats: [0], isCompound: false },
  { numerator: 6,  denominator: 8, label: "6/8",  accentBeats: [0, 3], isCompound: true },
  { numerator: 9,  denominator: 8, label: "9/8",  accentBeats: [0, 3, 6], isCompound: true },
  { numerator: 12, denominator: 8, label: "12/8", accentBeats: [0, 3, 6, 9], isCompound: true },
];

// 복합박자: BPM = 점4분음표 기준 → 8분음표 간격 = (60/BPM) / 3
// 단순박자: BPM = 4분음표 기준 → (60/BPM) × (4/분모)
const getBeatInterval = (bpm: number, ts: typeof TIME_SIGNATURES[number]): number => {
  if (ts.isCompound) {
    return (60.0 / bpm) / 3; // 점4분음표 BPM → 8분음표 간격
  }
  return (60.0 / bpm) * (4 / ts.denominator);
};

const BEAT_SYMBOL: Record<number, string> = { 2: "𝅗𝅥", 4: "♩", 8: "♪" };

// ─── Subdivision Patterns ────────────────────────────────────────────────────

interface SubNote {
  offset: number;
  volume: number;
  pitch: number;
}

interface SubPattern {
  id: string;
  symbol: string;
  label: string;
  subdivisions: SubNote[];
}

const SIMPLE_SUBDIVISIONS: SubPattern[] = [
  {
    id: "quarter",
    symbol: "♩",
    label: "4분음표",
    subdivisions: [{ offset: 0, volume: 1.0, pitch: 1000 }],
  },
  {
    id: "eighth",
    symbol: "♪♪",
    label: "8분음표",
    subdivisions: [
      { offset: 0, volume: 1.0, pitch: 1000 },
      { offset: 0.5, volume: 0.5, pitch: 700 },
    ],
  },
  {
    id: "sixteenth",
    symbol: "♬♬",
    label: "16분음표",
    subdivisions: [
      { offset: 0, volume: 1.0, pitch: 1000 },
      { offset: 0.25, volume: 0.4, pitch: 650 },
      { offset: 0.5, volume: 0.6, pitch: 750 },
      { offset: 0.75, volume: 0.4, pitch: 650 },
    ],
  },
  {
    id: "dotted_long",
    symbol: "♩.♪",
    label: "붓점",
    subdivisions: [
      { offset: 0, volume: 1.0, pitch: 1000 },
      { offset: 0.75, volume: 0.6, pitch: 720 },
    ],
  },
  {
    id: "dotted_short",
    symbol: "♪♩.",
    label: "역붓점",
    subdivisions: [
      { offset: 0, volume: 0.6, pitch: 720 },
      { offset: 0.25, volume: 1.0, pitch: 1000 },
    ],
  },
  {
    id: "triplet",
    symbol: "³♪",
    label: "셋잇단",
    subdivisions: [
      { offset: 0, volume: 1.0, pitch: 1000 },
      { offset: 0.333, volume: 0.5, pitch: 680 },
      { offset: 0.667, volume: 0.5, pitch: 680 },
    ],
  },
];

const COMPOUND_SUBDIVISIONS: SubPattern[] = [
  {
    id: "compound_basic",
    symbol: "♩.",
    label: "기본박",
    subdivisions: [{ offset: 0, volume: 1.0, pitch: 1000 }],
  },
  {
    id: "compound_eighth",
    symbol: "♪♪♪",
    label: "8분음표",
    subdivisions: [{ offset: 0, volume: 1.0, pitch: 1000 }],
  },
  {
    id: "compound_dotted",
    symbol: "♪𝄾♪",
    label: "붓점 변형",
    subdivisions: [{ offset: 0, volume: 1.0, pitch: 1000 }],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function MetronomePage() {
  const router = useRouter();
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [timeSigIndex, setTimeSigIndex] = useState(2); // 4/4
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [patternId, setPatternId] = useState("quarter");

  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const timeSig = TIME_SIGNATURES[timeSigIndex];
  const isCompound = timeSig.isCompound;
  const subdivisions = isCompound ? COMPOUND_SUBDIVISIONS : SIMPLE_SUBDIVISIONS;
  const pattern = subdivisions.find((p) => p.id === patternId) || subdivisions[0];

  // 박자 타입 변경 시 세분화 리셋
  useEffect(() => {
    setPatternId(isCompound ? "compound_basic" : "quarter");
  }, [isCompound]);

  // AudioContext cleanup
  useEffect(() => {
    return () => {
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // 음색으로 강박/약박/세분화 구분
  const createClick = useCallback(
    (ctx: AudioContext, time: number, type: "accent" | "beat" | "sub", vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "accent") {
        // 강박: 높고 짧고 날카로운 목재 소리
        osc.type = "triangle";
        osc.frequency.value = 1500;
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
      } else if (type === "beat") {
        // 약박: 중간 높이, 둥근 소리
        osc.type = "sine";
        osc.frequency.value = 900;
        gain.gain.setValueAtTime(vol * 0.9, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
      } else {
        // 세분화(sub): 낮고 부드러운 소리
        osc.type = "sine";
        osc.frequency.value = 600;
        gain.gain.setValueAtTime(vol * 0.6, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);
      }

      osc.start(time);
      osc.stop(time + 0.08);
    },
    []
  );

  // 강박 여부 판단
  const isAccentBeat = useCallback((beatIndex: number) => {
    return timeSig.accentBeats.includes(beatIndex);
  }, [timeSig.accentBeats]);

  // playBeat을 ref로 관리 → 볼륨/음소거 변경 시 재시작 없이 즉시 반영
  const playBeat = useCallback(
    (beatIndex: number) => {
      if (!audioContextRef.current || isMuted) return;
      // compound_basic: 강박 위치만 소리
      if (patternId === "compound_basic" && !timeSig.accentBeats.includes(beatIndex)) return;
      // compound_dotted: 가운데 쉼표 (beatIndex % 3 === 1 → 소리 없음)
      if (patternId === "compound_dotted" && beatIndex % 3 === 1) return;
      const ctx = audioContextRef.current;
      const beatDur = getBeatInterval(bpm, timeSig);

      pattern.subdivisions.forEach((sub) => {
        const noteTime = ctx.currentTime + sub.offset * beatDur;

        if (sub.offset === 0) {
          createClick(ctx, noteTime, isAccentBeat(beatIndex) ? "accent" : "beat", volume);
        } else {
          createClick(ctx, noteTime, "sub", volume);
        }
      });
    },
    [bpm, isMuted, volume, pattern, timeSig.accentBeats, patternId, createClick, isAccentBeat]
  );

  const playBeatRef = useRef(playBeat);
  useEffect(() => {
    playBeatRef.current = playBeat;
  }, [playBeat]);

  const startMetronome = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }

    setIsPlaying(true);
    let beat = 0;
    setCurrentBeat(1);
    playBeatRef.current(0);

    const ms = getBeatInterval(bpm, timeSig) * 1000;
    intervalRef.current = setInterval(() => {
      beat = (beat + 1) % timeSig.numerator;
      setCurrentBeat(beat + 1);
      playBeatRef.current(beat);
    }, ms);
  }, [bpm, timeSig, patternId]);

  const stopMetronome = useCallback(() => {
    setIsPlaying(false);
    setCurrentBeat(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // BPM·박자·패턴 변경 시 재시작
  useEffect(() => {
    if (isPlaying) {
      stopMetronome();
      startMetronome();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bpm, timeSigIndex, patternId]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const adjustBpm = (delta: number) => {
    setBpm((prev) => Math.max(20, Math.min(300, prev + delta)));
  };

  const getTempoLabel = (v: number) => {
    if (v <= 24)  return "Larghissimo";
    if (v <= 45)  return "Grave";
    if (v <= 60)  return "Largo";
    if (v <= 66)  return "Larghetto";
    if (v <= 76)  return "Adagio";
    if (v <= 80)  return "Adagietto";
    if (v <= 108) return "Andante";
    if (v <= 120) return "Moderato";
    if (v <= 156) return "Allegro";
    if (v <= 176) return "Vivace";
    if (v <= 200) return "Presto";
    return "Prestissimo";
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => safeBack(router)}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">메트로놈</h1>
          <p className="text-xs text-muted-foreground">정확한 템포로 연습하기</p>
        </div>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            isMuted ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
          }`}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* ─── Main Display ─── */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 mb-6">
        {/* Beat Indicators */}
        {(() => {
          const renderDot = (i: number) => {
            const isActive = currentBeat === i + 1;
            const isAccent = timeSig.accentBeats.includes(i);
            const dotSize = isAccent ? "w-5 h-5" : "w-3 h-3";
            return (
              <div
                key={i}
                className={`rounded-full transition-all duration-75 ${dotSize} ${
                  isActive
                    ? isAccent ? "bg-green-500 scale-125" : "bg-emerald-400 scale-110"
                    : isAccent ? "bg-gray-400" : "bg-gray-200"
                }`}
              />
            );
          };

          if (timeSig.numerator > 6) {
            const firstRow = timeSig.numerator === 9 ? 6 : Math.ceil(timeSig.numerator / 2);
            return (
              <div className="flex flex-col items-center gap-1.5 mb-6">
                <div className="flex justify-center items-center gap-1.5">
                  {Array.from({ length: firstRow }, (_, i) => renderDot(i))}
                </div>
                <div className="flex justify-center items-center gap-1.5">
                  {Array.from({ length: timeSig.numerator - firstRow }, (_, i) => renderDot(firstRow + i))}
                </div>
              </div>
            );
          }

          return (
            <div className="flex justify-center items-center gap-2 mb-6">
              {Array.from({ length: timeSig.numerator }, (_, i) => renderDot(i))}
            </div>
          );
        })()}

        {/* BPM Display */}
        <div className="text-center mb-6">
          <div className="text-sm text-muted-foreground mb-1">
            {BEAT_SYMBOL[timeSig.denominator] || "♩"} =
          </div>
          <div className="text-6xl font-bold text-foreground mb-1">{bpm}</div>
          <div className="text-sm text-muted-foreground italic">{getTempoLabel(bpm)}</div>
        </div>

        {/* BPM Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => adjustBpm(-5)}
            className="w-14 h-14 rounded-full bg-white border border-gray-200 flex items-center justify-center text-foreground hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
          >
            <Minus className="w-6 h-6" />
          </button>
          <button
            onClick={() => (isPlaying ? stopMetronome() : startMetronome())}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 ${
              isPlaying
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-gradient-to-br from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white"
            }`}
          >
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
          </button>
          <button
            onClick={() => adjustBpm(5)}
            className="w-14 h-14 rounded-full bg-white border border-gray-200 flex items-center justify-center text-foreground hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* BPM Slider */}
        <input
          type="range"
          min="20"
          max="300"
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>20</span>
          <span>300</span>
        </div>
      </div>

      {/* ─── Volume ─── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">볼륨</h3>
          <span className="text-xs text-muted-foreground">{Math.round(volume * 100)}%</span>
        </div>
        <div className="flex items-center gap-3">
          <VolumeX className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(volume * 100)}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
          />
          <Volume2 className="w-4 h-4 text-gray-400 shrink-0" />
        </div>
      </div>

      {/* ─── Subdivision Patterns (dark area) ─── */}
      <div className="mb-6 bg-[#1a1a1a] rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-white/80 mb-3">리듬 세분화</h3>
        <div className="grid grid-cols-3 gap-2">
          {subdivisions.map((p) => (
            <button
              key={p.id}
              onClick={() => setPatternId(p.id)}
              className={`py-3 px-2 rounded-xl text-center transition-all ${
                patternId === p.id
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                  : "bg-white/10 text-white/70 hover:bg-white/15"
              }`}
            >
              <div className="text-lg font-bold leading-tight">{p.symbol}</div>
              <div className="text-[10px] mt-1 opacity-70">{p.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Time Signature ─── */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">박자</h3>
        <div className="space-y-2">
          <div className="flex gap-2">
            <span className="text-[10px] text-muted-foreground self-center w-8 shrink-0">단순</span>
            {TIME_SIGNATURES.map((sig, idx) =>
              sig.isCompound ? null : (
                <button
                  key={sig.label}
                  onClick={() => setTimeSigIndex(idx)}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                    timeSigIndex === idx
                      ? "bg-green-500 text-white"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  {sig.label}
                </button>
              )
            )}
          </div>
          <div className="flex gap-2">
            <span className="text-[10px] text-muted-foreground self-center w-8 shrink-0">복합</span>
            {TIME_SIGNATURES.map((sig, idx) =>
              !sig.isCompound ? null : (
                <button
                  key={sig.label}
                  onClick={() => setTimeSigIndex(idx)}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                    timeSigIndex === idx
                      ? "bg-green-500 text-white"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  {sig.label}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* ─── Tempo Presets ─── */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">빠르기 프리셋</h3>
        <div className="grid grid-cols-5 gap-1.5">
          {TEMPO_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => setBpm(preset.bpm)}
              className={`py-2 px-1 rounded-xl text-center transition-colors ${
                bpm === preset.bpm
                  ? "bg-green-100 text-green-700 border-2 border-green-500"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              <div className="text-base leading-tight">{preset.symbol}</div>
              <div className="text-[9px] font-medium italic leading-tight mt-0.5">{preset.label}</div>
              <div className="text-[8px] opacity-50 leading-tight">{preset.range}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Tips ─── */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">연습 팁</h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• 새로운 곡은 목표 템포의 50-60%로 시작하세요</li>
          <li>• 5 BPM씩 천천히 올려가며 연습하세요</li>
          <li>• 첫 박자(강박)에 집중하면 리듬감이 좋아집니다</li>
          <li>• 복합박자(6/8 등)는 큰 박 단위로 세어보세요</li>
        </ul>
      </div>
    </div>
  );
}
