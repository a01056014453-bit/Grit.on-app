"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Music, Clock, Play, Pause, Trash2, Calendar, Timer } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { formatTime } from "@/lib/format";
import { getSession, deleteSession, PracticeSession } from "@/lib/db";

export default function RecordingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const id = parseInt(params.id as string, 10);
        if (isNaN(id)) {
          setIsLoading(false);
          return;
        }

        const data = await getSession(id);
        setSession(data);

        // Create audio URL from blob
        if (data?.audioBlob) {
          const url = URL.createObjectURL(data.audioBlob);
          setAudioUrl(url);
        }
      } catch (error) {
        console.error("Failed to load session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();

    // Cleanup audio URL on unmount
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [params.id]);

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleDelete = async () => {
    if (!session?.id) return;

    if (!confirm("이 녹음을 삭제하시겠습니까?")) return;

    setIsDeleting(true);
    try {
      await deleteSession(session.id);
      router.push("/recordings");
    } catch (error) {
      console.error("Failed to delete session:", error);
      alert("삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatAudioTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-gray-200 rounded-xl h-32 mb-4"></div>
          <div className="bg-gray-200 rounded-xl h-48 mb-4"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>뒤로</span>
        </button>
        <div className="text-center py-12">
          <p className="text-gray-500">녹음을 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-5 h-5 text-red-500" />
        </button>
      </div>

      {/* Piece Info */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
            <Music className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900 text-lg">{session.pieceName}</h2>
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
              <Calendar className="w-4 h-4" />
              {formatDate(session.startTime)}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {formatTime(session.practiceTime)}
          </div>
          <div className="text-xs text-gray-500">순 연습시간</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <Timer className="w-6 h-6 text-gray-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {formatTime(session.totalTime)}
          </div>
          <div className="text-xs text-gray-500">총 시간</div>
        </div>
      </div>

      {/* Practice Type */}
      {session.practiceType && (
        <div className="bg-primary/5 rounded-xl p-4 mb-4">
          <div className="text-sm text-primary font-medium">
            연습 타입: {" "}
            {session.practiceType === "runthrough"
              ? "런스루 (처음부터 끝까지)"
              : session.practiceType === "partial"
                ? "부분 연습"
                : "루틴 연습"}
          </div>
        </div>
      )}

      {/* Audio Player */}
      {audioUrl ? (
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-4">
          <h3 className="font-semibold text-gray-900 mb-4">녹음 재생</h3>

          {/* Hidden Audio Element */}
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
          />

          <div className="flex items-center gap-4">
            <button
              onClick={handlePlayPause}
              className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white ml-1" fill="white" />
              )}
            </button>

            <div className="flex-1">
              {/* Progress Bar */}
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />

              {/* Time Display */}
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>{formatAudioTime(currentTime)}</span>
                <span>{formatAudioTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-6 mb-4 text-center">
          <div className="text-gray-400 mb-2">
            <Music className="w-12 h-12 mx-auto opacity-50" />
          </div>
          <p className="text-gray-500">이 세션에는 녹음 파일이 없습니다</p>
        </div>
      )}

      {/* Practice Efficiency */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">연습 효율</h3>
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block text-primary">
                {session.totalTime > 0
                  ? Math.round((session.practiceTime / session.totalTime) * 100)
                  : 0}%
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-gray-500">
                실제 연주 비율
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-3 text-xs flex rounded-full bg-gray-200">
            <div
              style={{
                width: `${session.totalTime > 0 ? (session.practiceTime / session.totalTime) * 100 : 0}%`,
              }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary rounded-full transition-all duration-500"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          총 {formatTime(session.totalTime)} 중 {formatTime(session.practiceTime)}를 실제로 연습했습니다.
        </p>
      </div>
    </div>
  );
}
