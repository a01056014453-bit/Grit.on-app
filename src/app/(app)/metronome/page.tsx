"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, Pause, Minus, Plus, Timer, Volume2, VolumeX } from "lucide-react";

const TEMPO_PRESETS = [
  { label: "Largo", bpm: 50 },
  { label: "Adagio", bpm: 70 },
  { label: "Andante", bpm: 92 },
  { label: "Moderato", bpm: 114 },
  { label: "Allegro", bpm: 138 },
  { label: "Vivace", bpm: 168 },
  { label: "Presto", bpm: 188 },
];

const TIME_SIGNATURES = [
  { label: "2/4", beats: 2 },
  { label: "3/4", beats: 3 },
  { label: "4/4", beats: 4 },
  { label: "6/8", beats: 6 },
];

export default function MetronomePage() {
  const router = useRouter();
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [timeSignature, setTimeSignature] = useState(4);
  const [isMuted, setIsMuted] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const nextBeatTimeRef = useRef<number>(0);

  // Initialize AudioContext
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playClick = useCallback((isAccent: boolean) => {
    if (!audioContextRef.current || isMuted) return;

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Accent beat (first beat) is higher pitched
    oscillator.frequency.value = isAccent ? 1000 : 800;
    oscillator.type = "sine";

    // Short click sound
    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(isAccent ? 0.5 : 0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    oscillator.start(now);
    oscillator.stop(now + 0.05);
  }, [isMuted]);

  const startMetronome = useCallback(() => {
    if (!audioContextRef.current) return;

    // Resume audio context if suspended
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }

    setIsPlaying(true);
    let beat = 0;
    setCurrentBeat(1);

    const intervalMs = (60 / bpm) * 1000;

    // Play first beat immediately
    playClick(true);

    intervalRef.current = setInterval(() => {
      beat = (beat + 1) % timeSignature;
      setCurrentBeat(beat + 1);
      playClick(beat === 0);
    }, intervalMs);
  }, [bpm, timeSignature, playClick]);

  const stopMetronome = useCallback(() => {
    setIsPlaying(false);
    setCurrentBeat(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Restart metronome when BPM or time signature changes while playing
  useEffect(() => {
    if (isPlaying) {
      stopMetronome();
      startMetronome();
    }
  }, [bpm, timeSignature]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const adjustBpm = (delta: number) => {
    setBpm((prev) => Math.max(20, Math.min(300, prev + delta)));
  };

  const getTempoLabel = (bpm: number) => {
    if (bpm < 60) return "Largo";
    if (bpm < 80) return "Adagio";
    if (bpm < 100) return "Andante";
    if (bpm < 120) return "Moderato";
    if (bpm < 156) return "Allegro";
    if (bpm < 176) return "Vivace";
    return "Presto";
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
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

      {/* Main Display */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 mb-6">
        {/* Beat Indicators */}
        <div className="flex justify-center gap-2 mb-6">
          {Array.from({ length: timeSignature }, (_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-100 ${
                currentBeat === i + 1
                  ? i === 0
                    ? "bg-green-500 scale-125"
                    : "bg-emerald-400 scale-110"
                  : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* BPM Display */}
        <div className="text-center mb-6">
          <div className="text-6xl font-bold text-foreground mb-1">{bpm}</div>
          <div className="text-sm text-muted-foreground">BPM · {getTempoLabel(bpm)}</div>
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
            {isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8 ml-1" />
            )}
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

      {/* Time Signature */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">박자</h3>
        <div className="flex gap-2">
          {TIME_SIGNATURES.map((sig) => (
            <button
              key={sig.label}
              onClick={() => setTimeSignature(sig.beats)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                timeSignature === sig.beats
                  ? "bg-green-500 text-white"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {sig.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tempo Presets */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">빠르기 프리셋</h3>
        <div className="grid grid-cols-4 gap-2">
          {TEMPO_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => setBpm(preset.bpm)}
              className={`py-2 px-1 rounded-xl text-xs font-medium transition-colors ${
                bpm === preset.bpm
                  ? "bg-green-100 text-green-700 border-2 border-green-500"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              <div className="font-semibold">{preset.label}</div>
              <div className="text-[10px] opacity-70">{preset.bpm}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 bg-card rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">연습 팁</h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• 새로운 곡은 목표 템포의 50-60%로 시작하세요</li>
          <li>• 5 BPM씩 천천히 올려가며 연습하세요</li>
          <li>• 첫 박자(강박)에 집중하면 리듬감이 좋아집니다</li>
        </ul>
      </div>
    </div>
  );
}
