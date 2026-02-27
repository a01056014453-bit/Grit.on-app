"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Repeat } from "lucide-react";
import { getSession, type PracticeSession } from "@/lib/db";
import { safeBack } from "@/lib/navigation";

const SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

export default function RecordingPlayerPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = Number(params.id);

  const [session, setSession] = useState<PracticeSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // AB repeat
  const [regionA, setRegionA] = useState<number | null>(null);
  const [regionB, setRegionB] = useState<number | null>(null);
  const [isLooping, setIsLooping] = useState(false);

  // Waveform
  const [waveformData, setWaveformData] = useState<number[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Load session from IndexedDB
  useEffect(() => {
    async function load() {
      try {
        const s = await getSession(sessionId);
        if (!s) {
          setLoading(false);
          return;
        }
        setSession(s);
        if (s.audioBlob) {
          const url = URL.createObjectURL(s.audioBlob);
          setAudioUrl(url);
          generateWaveform(s.audioBlob);
        }
      } catch (err) {
        console.error("Failed to load session:", err);
      } finally {
        setLoading(false);
      }
    }
    if (!isNaN(sessionId)) load();
  }, [sessionId]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [audioUrl]);

  // Generate waveform data from audio blob (also extracts accurate duration)
  const generateWaveform = useCallback(async (blob: Blob) => {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioCtx = new AudioContext();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      // AudioBuffer.duration is always accurate (unlike HTMLAudioElement for WebM blobs)
      setDuration(audioBuffer.duration);

      const channelData = audioBuffer.getChannelData(0);

      const bars = 200;
      const samplesPerBar = Math.floor(channelData.length / bars);
      const data: number[] = [];

      for (let i = 0; i < bars; i++) {
        let sum = 0;
        const start = i * samplesPerBar;
        for (let j = start; j < start + samplesPerBar && j < channelData.length; j++) {
          sum += Math.abs(channelData[j]);
        }
        data.push(sum / samplesPerBar);
      }

      // Normalize
      const max = Math.max(...data, 0.01);
      setWaveformData(data.map((v) => v / max));
      audioCtx.close();
    } catch (err) {
      console.error("Failed to generate waveform:", err);
    }
  }, []);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const barW = w / waveformData.length;
    const progress = duration > 0 ? currentTime / duration : 0;

    ctx.clearRect(0, 0, w, h);

    // AB region highlight
    if (regionA !== null && regionB !== null && duration > 0) {
      const aX = (regionA / duration) * w;
      const bX = (regionB / duration) * w;
      ctx.fillStyle = "rgba(139, 92, 246, 0.15)";
      ctx.fillRect(aX, 0, bX - aX, h);
    }

    // Bars
    waveformData.forEach((val, i) => {
      const x = i * barW;
      const barH = Math.max(2, val * h * 0.8);
      const y = (h - barH) / 2;
      const barProgress = i / waveformData.length;

      if (barProgress <= progress) {
        ctx.fillStyle = "rgba(139, 92, 246, 0.9)";
      } else {
        ctx.fillStyle = "rgba(139, 92, 246, 0.25)";
      }
      ctx.fillRect(x + 0.5, y, Math.max(1, barW - 1), barH);
    });

    // Playhead — thick red line with circle handle
    const playheadX = progress * w;
    // Glow
    ctx.strokeStyle = "rgba(239, 68, 68, 0.25)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, h);
    ctx.stroke();
    // Core line
    ctx.strokeStyle = "rgba(239, 68, 68, 0.9)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, h);
    ctx.stroke();
    // Handle circle at top
    ctx.fillStyle = "rgba(239, 68, 68, 0.95)";
    ctx.beginPath();
    ctx.arc(playheadX, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    // A/B markers
    if (regionA !== null && duration > 0) {
      const aX = (regionA / duration) * w;
      ctx.fillStyle = "#7c3aed";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("A", aX + 2, 14);
      ctx.strokeStyle = "#7c3aed";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(aX, 0);
      ctx.lineTo(aX, h);
      ctx.stroke();
    }
    if (regionB !== null && duration > 0) {
      const bX = (regionB / duration) * w;
      ctx.fillStyle = "#7c3aed";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("B", bX + 2, 14);
      ctx.strokeStyle = "#7c3aed";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bX, 0);
      ctx.lineTo(bX, h);
      ctx.stroke();
    }
  }, [waveformData, currentTime, duration, regionA, regionB]);

  // Audio time update loop
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);

      // AB loop
      if (isLooping && regionA !== null && regionB !== null) {
        if (audio.currentTime >= regionB) {
          audio.currentTime = regionA;
        }
      }
    };

    const onLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onDurationChange = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);

    // If already loaded (e.g. cached), read duration immediately
    if (audio.duration && isFinite(audio.duration)) {
      setDuration(audio.duration);
    }

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);
    };
  }, [isLooping, regionA, regionB]);

  // Playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Controls
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seek = (delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + delta));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const audio = audioRef.current;
    if (!canvas || !audio || duration <= 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const newTime = ratio * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime); // 즉시 state 업데이트 → canvas 다시 그리기
  };

  const setA = () => setRegionA(currentTime);
  const setB = () => setRegionB(currentTime);

  const clearRegion = () => {
    setRegionA(null);
    setRegionB(null);
    setIsLooping(false);
  };

  const toggleLoop = () => {
    if (regionA === null || regionB === null) return;
    setIsLooping(!isLooping);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const formatDateTime = (d: Date) => {
    const date = new Date(d);
    return `${date.getMonth() + 1}월 ${date.getDate()}일 ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-blob-violet">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session || !audioUrl) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-blob-violet px-6">
        <p className="text-gray-500 text-sm mb-4">녹음 데이터를 찾을 수 없습니다</p>
        <button
          onClick={() => safeBack(router)}
          className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium"
        >
          돌아가기
        </button>
      </div>
    );
  }

  const practiceDurationMin = Math.round(session.totalTime / 60);
  const recordingDurationStr = duration > 0 ? formatTime(duration) : "";

  return (
    <div className="min-h-[100dvh] bg-blob-violet relative flex flex-col items-center justify-center">
      <div className="bg-blob-extra" />

      {/* Header */}
      <div className="px-4 pt-5 pb-3 relative z-10 w-full max-w-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => safeBack(router)}
            className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center border border-white/40"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-gray-900 truncate">{session.pieceName}</h1>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {formatDateTime(session.startTime)}
              {session.todoNote ? ` · ${session.todoNote}` : ""}
              {practiceDurationMin > 0 ? ` · ${practiceDurationMin}분 연습` : ""}
              {recordingDurationStr ? ` · 녹음 ${recordingDurationStr}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Waveform */}
      <div className="px-4 relative z-10 w-full max-w-lg">
        <div
          className="rounded-2xl p-3"
          style={{
            background: "rgba(255,255,255,0.55)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.6)",
            boxShadow: "0 8px 32px rgba(124,58,237,0.08)",
          }}
        >
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="w-full h-28 cursor-pointer rounded-lg"
            style={{ touchAction: "none" }}
          />

          {/* Time display */}
          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-xs text-gray-500 font-mono">{formatTime(currentTime)}</span>
            <span className="text-xs text-gray-400 font-mono">{formatTime(duration)}</span>
          </div>
        </div>

        {/* AB Repeat Controls */}
        <div className="flex items-center justify-center gap-2.5 mt-3">
          <button
            onClick={setA}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
              regionA !== null
                ? "bg-violet-600 text-white"
                : "bg-white/40 text-gray-600 border border-white/50"
            }`}
          >
            A {regionA !== null ? formatTime(regionA) : ""}
          </button>
          <button
            onClick={setB}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
              regionB !== null
                ? "bg-violet-600 text-white"
                : "bg-white/40 text-gray-600 border border-white/50"
            }`}
          >
            B {regionB !== null ? formatTime(regionB) : ""}
          </button>
          <button
            onClick={toggleLoop}
            disabled={regionA === null || regionB === null}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
              isLooping
                ? "bg-violet-600 text-white"
                : "bg-white/40 text-gray-500 border border-white/50"
            } disabled:opacity-30`}
          >
            <Repeat className="w-3 h-3" />
          </button>
          {(regionA !== null || regionB !== null) && (
            <button
              onClick={clearRegion}
              className="px-2 py-1 rounded-lg text-[11px] text-gray-400 hover:text-gray-600"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* Playback Controls */}
      <div className="px-4 pb-8 pt-3 relative z-10 w-full max-w-lg">
        {/* Speed selector */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          {SPEEDS.map((speed) => (
            <button
              key={speed}
              onClick={() => setPlaybackRate(speed)}
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                playbackRate === speed
                  ? "bg-violet-600 text-white"
                  : "bg-white/40 text-gray-500 border border-white/40"
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* Transport controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => seek(-5)}
            className="w-9 h-9 rounded-full bg-white/40 border border-white/50 flex items-center justify-center active:bg-white/60 transition-colors"
          >
            <SkipBack className="w-3.5 h-3.5 text-gray-600" />
          </button>
          <button
            onClick={() => seek(-1)}
            className="w-9 h-9 rounded-full bg-white/40 border border-white/50 flex items-center justify-center active:bg-white/60 transition-colors"
          >
            <SkipBack className="w-2.5 h-2.5 text-gray-600" />
          </button>

          <button
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30 active:bg-violet-700 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
            )}
          </button>

          <button
            onClick={() => seek(1)}
            className="w-9 h-9 rounded-full bg-white/40 border border-white/50 flex items-center justify-center active:bg-white/60 transition-colors"
          >
            <SkipForward className="w-2.5 h-2.5 text-gray-600" />
          </button>
          <button
            onClick={() => seek(5)}
            className="w-9 h-9 rounded-full bg-white/40 border border-white/50 flex items-center justify-center active:bg-white/60 transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl} preload="auto" />
    </div>
  );
}
