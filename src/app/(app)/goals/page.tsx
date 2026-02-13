"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, Pause, ChevronLeft, ChevronRight, Check, X, Clock, Music, Volume2 } from "lucide-react";
import { StatsCard } from "@/components/app";
import { getAllSessions, getPracticeStats, savePracticeSession, type PracticeSession } from "@/lib/db";
import { mockDrillCards, groupDrillsBySong } from "@/data";

interface Drill {
  id: string;
  song: string;
  measures: string;
  title: string;
  mode?: "duration" | "recurrence";
  duration?: number;
  recurrence?: number;
  tempo?: number;
}

interface CompletedDrillsData {
  date: string;
  completedDrillIds: string[];
}

export default function GoalsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Stats
  const [totalHours, setTotalHours] = useState(0);
  const [weekSessions, setWeekSessions] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [allSessions, setAllSessions] = useState<PracticeSession[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Audio player state
  const [playingSession, setPlayingSession] = useState<PracticeSession | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  // Calculate streak
  function calculateStreak(sessions: { startTime: Date }[]): number {
    if (sessions.length === 0) return 0;

    const dateSet = new Set<string>();
    sessions.forEach((s) => {
      const date = new Date(s.startTime);
      date.setHours(0, 0, 0, 0);
      dateSet.add(date.toISOString());
    });

    if (dateSet.size === 0) return 0;

    let streak = 0;
    const checkDate = new Date(today);
    const todayStr = today.toISOString();

    if (!dateSet.has(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
      if (!dateSet.has(checkDate.toISOString())) {
        return 0;
      }
    }

    while (dateSet.has(checkDate.toISOString())) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
  }

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Total hours
        const stats = await getPracticeStats();
        setTotalHours(Math.round(stats.totalPracticeTime / 3600));

        // Week sessions
        const sessions = await getAllSessions();
        setAllSessions(sessions);
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const thisWeekSessions = sessions.filter((s) => {
          const sessionDate = new Date(s.startTime);
          return sessionDate >= weekStart;
        });
        setWeekSessions(thisWeekSessions.length);

        // Streak
        const streak = calculateStreak(sessions);
        setStreakDays(streak);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Generate calendar data for a month
  const getMonthCalendarData = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay();

    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Create calendar grid
    const calendar: Array<{
      date: Date | null;
      sessionCount: number;
      isToday: boolean;
      dayOfWeek: number;
    }> = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < startDayOfWeek; i++) {
      calendar.push({ date: null, sessionCount: 0, isToday: false, dayOfWeek: i });
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);

      // Count sessions for this day
      const daySessions = allSessions.filter((s) => {
        const sessionDate = new Date(s.startTime);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === date.getTime();
      });

      calendar.push({
        date,
        sessionCount: daySessions.length,
        isToday: date.getTime() === today.getTime(),
        dayOfWeek: date.getDay(),
      });
    }

    return calendar;
  };

  const calendarData = getMonthCalendarData();
  const monthYear = `${calendarMonth.getFullYear()}년 ${calendarMonth.getMonth() + 1}월`;

  // Count total practice days in the month
  const practiceDaysCount = calendarData.filter((c) => c.sessionCount > 0).length;

  // Get sessions for selected date
  const getSessionsForDate = (date: Date) => {
    return allSessions.filter((s) => {
      const sessionDate = new Date(s.startTime);
      sessionDate.setHours(0, 0, 0, 0);
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === targetDate.getTime();
    });
  };

  const selectedDateSessions = selectedDate ? getSessionsForDate(selectedDate) : [];

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Format date for display
  const formatDateDisplay = (date: Date) => {
    return `${date.getMonth() + 1}월 ${date.getDate()}일 ${dayNames[date.getDay()]}요일`;
  };


  // Helper: Format date to YYYY-MM-DD
  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Get completed drills for a specific date
  const getCompletedDrillsForDate = (date: Date): Drill[] => {
    const dateKey = formatDateKey(date);

    // Get completed drill IDs
    const completedData = localStorage.getItem(`grit-on-completed-${dateKey}`);
    if (!completedData) return [];

    const parsed: CompletedDrillsData = JSON.parse(completedData);
    const completedIds = new Set(parsed.completedDrillIds || []);

    if (completedIds.size === 0) return [];

    // Get all available drills (mock + custom)
    const mockDrills = groupDrillsBySong(mockDrillCards).flatMap(g => g.drills);
    const customDrillsData = localStorage.getItem("grit-on-custom-drills");
    const customDrills: Drill[] = customDrillsData ? JSON.parse(customDrillsData) : [];

    // Also check for drills saved on that specific date
    const dateDrillsData = localStorage.getItem(`grit-on-drills-${dateKey}`);
    const dateDrills: Drill[] = dateDrillsData ? JSON.parse(dateDrillsData) : [];

    const allDrills = [...mockDrills, ...customDrills, ...dateDrills];

    // Filter to only completed drills
    return allDrills.filter(d => completedIds.has(d.id));
  };

  // Group drills by song name
  const groupDrillsBySongName = (drills: Drill[]) => {
    const grouped: Record<string, Drill[]> = {};
    drills.forEach(drill => {
      if (!grouped[drill.song]) {
        grouped[drill.song] = [];
      }
      grouped[drill.song].push(drill);
    });
    return Object.entries(grouped);
  };

  const selectedDateDrills = selectedDate ? getCompletedDrillsForDate(selectedDate) : [];
  const groupedSelectedDrills = groupDrillsBySongName(selectedDateDrills);

  // Audio player handlers
  const handlePlaySession = (session: PracticeSession) => {
    if (session.audioBlob) {
      // Clean up previous audio URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      const url = URL.createObjectURL(session.audioBlob);
      setAudioUrl(url);
      setPlayingSession(session);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleClosePlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setPlayingSession(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
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

  const handleAudioEnded = () => {
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

  const formatSeconds = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Generate a simple audio blob for testing
  const generateSampleAudio = async (): Promise<Blob> => {
    const audioContext = new AudioContext();
    const sampleRate = audioContext.sampleRate;
    const duration = 3; // 3 seconds
    const numSamples = sampleRate * duration;

    // Create audio buffer
    const audioBuffer = audioContext.createBuffer(1, numSamples, sampleRate);
    const channelData = audioBuffer.getChannelData(0);

    // Generate a simple piano-like tone (C4 = 261.63 Hz)
    const frequencies = [261.63, 329.63, 392.00]; // C4, E4, G4 (C major chord)
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;
      for (const freq of frequencies) {
        // Add harmonics for richer sound
        sample += Math.sin(2 * Math.PI * freq * t) * 0.3;
        sample += Math.sin(2 * Math.PI * freq * 2 * t) * 0.15;
        sample += Math.sin(2 * Math.PI * freq * 3 * t) * 0.1;
      }
      // Apply envelope (attack-decay)
      const envelope = Math.exp(-t * 2) * (1 - Math.exp(-t * 50));
      channelData[i] = sample * envelope * 0.5;
    }

    // Convert to WAV blob
    const wavBuffer = audioBufferToWav(audioBuffer);
    await audioContext.close();
    return new Blob([wavBuffer], { type: 'audio/wav' });
  };

  // Convert AudioBuffer to WAV format
  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = buffer.length * blockAlign;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;

    const arrayBuffer = new ArrayBuffer(totalSize);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, totalSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Write audio data
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }

    return arrayBuffer;
  };

  // Create sample sessions for testing
  const createSampleSessions = async () => {
    const samplePieces = [
      { id: "1", name: "F. Chopin Ballade Op.23 No.1" },
      { id: "2", name: "L. v. Beethoven Sonata Op.13 No.8" },
      { id: "3", name: "J.S. Bach Prelude in C Major" },
    ];

    // Generate sample audio
    const sampleAudio = await generateSampleAudio();

    // Sample drills for each piece
    const sampleDrills: Record<string, Drill[]> = {
      "F. Chopin Ballade Op.23 No.1": [
        { id: "sample-drill-1", song: "F. Chopin Ballade Op.23 No.1", measures: "57-60마디", title: "오른손 암보, 왼손 포지셔닝 확실하게", tempo: 76, recurrence: 4 },
        { id: "sample-drill-2", song: "F. Chopin Ballade Op.23 No.1", measures: "23-26마디", title: "왼손 레가토 연결, 손목 유연하게", tempo: 72, recurrence: 3 },
        { id: "sample-drill-3", song: "F. Chopin Ballade Op.23 No.1", measures: "81-84마디", title: "페달 타이밍 정확하게, 소리 겹침 주의", tempo: 80, recurrence: 2 },
      ],
      "L. v. Beethoven Sonata Op.13 No.8": [
        { id: "sample-drill-4", song: "L. v. Beethoven Sonata Op.13 No.8", measures: "33-38마디", title: "크레센도 표현, pp에서 ff까지 다이나믹", tempo: 84, recurrence: 2 },
        { id: "sample-drill-5", song: "L. v. Beethoven Sonata Op.13 No.8", measures: "1-8마디", title: "서주 Grave 템포 유지, 무게감 있게", tempo: 60, recurrence: 3 },
      ],
      "J.S. Bach Prelude in C Major": [
        { id: "sample-drill-6", song: "J.S. Bach Prelude in C Major", measures: "1-16마디", title: "아르페지오 균일하게, 손가락 독립성 연습", tempo: 72, recurrence: 5 },
      ],
    };

    // Helper to get date key from Date
    const getDateKeyFromDate = (date: Date) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    // Get all existing sessions to add drills to their dates
    const existingSessions = await getAllSessions();
    const existingDates = new Set<string>();
    existingSessions.forEach(s => {
      const d = new Date(s.startTime);
      d.setHours(0, 0, 0, 0);
      existingDates.add(getDateKeyFromDate(d));
    });

    // Add drills for all existing session dates
    const allDrills = [
      ...sampleDrills["F. Chopin Ballade Op.23 No.1"],
      ...sampleDrills["L. v. Beethoven Sonata Op.13 No.8"],
      ...sampleDrills["J.S. Bach Prelude in C Major"],
    ];

    existingDates.forEach(dateKey => {
      // Create unique drill IDs for each date
      const dateDrills = allDrills.map((d, idx) => ({
        ...d,
        id: `${d.id}-${dateKey}`,
      }));
      localStorage.setItem(`grit-on-drills-${dateKey}`, JSON.stringify(dateDrills));
      localStorage.setItem(`grit-on-completed-${dateKey}`, JSON.stringify({
        date: dateKey,
        completedDrillIds: dateDrills.map(d => d.id),
      }));
    });

    // Also add for today if not already
    const todayKey = getDateKeyFromDate(new Date());
    if (!existingDates.has(todayKey)) {
      const todayDrills = allDrills.map((d, idx) => ({
        ...d,
        id: `${d.id}-${todayKey}`,
      }));
      localStorage.setItem(`grit-on-drills-${todayKey}`, JSON.stringify(todayDrills));
      localStorage.setItem(`grit-on-completed-${todayKey}`, JSON.stringify({
        date: todayKey,
        completedDrillIds: todayDrills.map(d => d.id),
      }));
    }

    const sessions = [
      // 3일 전 (with audio)
      {
        pieceId: "1",
        pieceName: samplePieces[0].name,
        startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000),
        totalTime: 3600,
        practiceTime: 3000,
        synced: false,
        label: "연습",
        audioBlob: sampleAudio,
      },
      // 어제 (with audio)
      {
        pieceId: "2",
        pieceName: samplePieces[1].name,
        startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 20 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 20.75 * 60 * 60 * 1000),
        totalTime: 2700,
        practiceTime: 2400,
        synced: false,
        label: "연습",
        audioBlob: sampleAudio,
      },
      // 오늘 (with audio)
      {
        pieceId: "1",
        pieceName: samplePieces[0].name,
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
        totalTime: 3600,
        practiceTime: 3000,
        synced: false,
        label: "연습",
        audioBlob: sampleAudio,
      },
    ];

    // Add drills for new session dates too
    for (const session of sessions) {
      const sessionDateKey = getDateKeyFromDate(session.startTime);
      if (!localStorage.getItem(`grit-on-drills-${sessionDateKey}`)) {
        const dateDrills = allDrills.map((d, idx) => ({
          ...d,
          id: `${d.id}-${sessionDateKey}`,
        }));
        localStorage.setItem(`grit-on-drills-${sessionDateKey}`, JSON.stringify(dateDrills));
        localStorage.setItem(`grit-on-completed-${sessionDateKey}`, JSON.stringify({
          date: sessionDateKey,
          completedDrillIds: dateDrills.map(d => d.id),
        }));
      }
    }

    for (const session of sessions) {
      await savePracticeSession(session);
    }

    // Reload data
    const newSessions = await getAllSessions();
    setAllSessions(newSessions);

    const stats = await getPracticeStats();
    setTotalHours(Math.round(stats.totalPracticeTime / 3600));

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const thisWeekSessions = newSessions.filter((s) => {
      const sessionDate = new Date(s.startTime);
      return sessionDate >= weekStart;
    });
    setWeekSessions(thisWeekSessions.length);
    setStreakDays(calculateStreak(newSessions));
  };

  const goToPrevMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCalendarMonth(new Date());
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto bg-gray-50 min-h-screen">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-gray-200 rounded-2xl h-48 mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-black">연습 기록</h1>
        </div>
        <button
          onClick={createSampleSessions}
          className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200"
        >
          샘플 추가
        </button>
      </div>

      {/* Stats Grid */}
      <div className="bg-white rounded-2xl border border-gray-200 mb-4 divide-x divide-gray-100 grid grid-cols-3">
        <StatsCard value={totalHours} unit="시간" label="총 연습" />
        <StatsCard value={weekSessions} unit="세션" label="이번 주" />
        <StatsCard value={streakDays} unit="일" label="연속" />
      </div>

      {/* Monthly Calendar */}
      <div className="bg-white rounded-xl border border-gray-200 p-3">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-black text-sm">{monthYear}</span>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-amber-500">✓</span>
              <span className="text-black font-medium">{practiceDaysCount}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrevMonth}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={goToNextMonth}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
            {(calendarMonth.getMonth() !== today.getMonth() || calendarMonth.getFullYear() !== today.getFullYear()) && (
              <button
                onClick={goToToday}
                className="px-2 py-1 bg-black text-white text-[10px] font-medium rounded-full hover:bg-gray-800"
              >
                오늘
              </button>
            )}
          </div>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map((name, idx) => (
            <div
              key={name}
              className={`text-center text-[10px] font-medium ${
                idx === 0 ? "text-red-500" : idx === 6 ? "text-blue-500" : "text-gray-500"
              }`}
            >
              {name}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarData.map((cell, idx) => {
            const isPastOrToday = cell.date && cell.date.getTime() <= today.getTime();
            const isSelected = selectedDate && cell.date && selectedDate.getTime() === cell.date.getTime();
            return (
              <button
                key={idx}
                className="flex flex-col items-center"
                onClick={() => cell.date && isPastOrToday && setSelectedDate(
                  isSelected ? null : cell.date
                )}
                disabled={!cell.date || !isPastOrToday}
              >
                {cell.date ? (
                  <>
                    {/* Clover Shape Cell */}
                    <div
                      className={`w-8 h-8 rounded-[10px] flex items-center justify-center transition-all ${
                        cell.sessionCount > 0
                          ? "bg-amber-200 hover:scale-105 cursor-pointer"
                          : isPastOrToday
                          ? "bg-gray-100 hover:bg-gray-200 cursor-pointer"
                          : "bg-gray-50"
                      }`}
                    >
                      {cell.sessionCount > 0 ? (
                        cell.sessionCount === 1 ? (
                          <Check className="w-4 h-4 text-white" strokeWidth={3} />
                        ) : (
                          <span className="text-gray-800 font-bold text-xs">{cell.sessionCount}</span>
                        )
                      ) : null}
                    </div>
                    {/* Date Number - 선택된 날짜는 검은 원형 배경 */}
                    <span
                      className={`text-[10px] mt-0.5 font-medium transition-all ${
                        isSelected
                          ? "bg-black text-white rounded-full w-5 h-5 flex items-center justify-center"
                          : cell.isToday
                          ? "bg-violet-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                          : cell.dayOfWeek === 0
                          ? "text-red-500"
                          : cell.dayOfWeek === 6
                          ? "text-blue-500"
                          : "text-gray-600"
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>
                  </>
                ) : (
                  <div className="w-8 h-8" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Inline Detail List - 캘린더 아래에 자연스럽게 표시 */}
      {selectedDate && (
        <div className="mt-4 animate-in fade-in duration-200">
          {/* 구분선 */}
          <div className="border-t border-gray-200 mb-4" />

          {/* Header */}
          <div className="mb-4">
            <p className="font-bold text-black text-lg">{formatDateDisplay(selectedDate)}</p>
            <p className="text-sm text-gray-500">
              {selectedDateDrills.length > 0 && `${selectedDateDrills.length}개 연습`}
              {selectedDateDrills.length > 0 && selectedDateSessions.length > 0 && " · "}
              {selectedDateSessions.length > 0 && `${selectedDateSessions.length}개 녹음`}
              {selectedDateDrills.length === 0 && selectedDateSessions.length === 0 && "기록 없음"}
            </p>
          </div>

          {/* Completed Drills - Grouped by Song */}
          {groupedSelectedDrills.length > 0 && (
            <div className="space-y-3 mb-4">
              {groupedSelectedDrills.map(([songName, drills]) => (
                <div key={songName} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Song Header */}
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <p className="font-semibold text-black text-sm">{songName}</p>
                  </div>
                  {/* Drills */}
                  <div className="divide-y divide-gray-100">
                    {drills.map((drill) => (
                      <div
                        key={drill.id}
                        className="px-4 py-3 flex items-center gap-3"
                      >
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-green-600" strokeWidth={3} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 font-medium">{drill.measures}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {drill.title}
                            {drill.tempo && ` · 템포 ${drill.tempo}`}
                            {drill.recurrence ? ` · ${drill.recurrence}회` : drill.duration ? ` · ${drill.duration}분` : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sessions List */}
          {selectedDateSessions.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-2">연습 세션</p>
              <div className="space-y-2">
                {selectedDateSessions.map((session) => {
                  const hasAudio = !!session.audioBlob;
                  return (
                    <button
                      key={session.id}
                      onClick={() => hasAudio && handlePlaySession(session)}
                      disabled={!hasAudio}
                      className={`w-full text-left bg-gray-50 rounded-xl p-3 border border-gray-100 ${
                        hasAudio ? "hover:bg-gray-100 active:bg-gray-200 cursor-pointer" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          hasAudio ? "bg-black" : "bg-gray-300"
                        }`}>
                          {hasAudio ? (
                            <Volume2 className="w-5 h-5 text-white" />
                          ) : (
                            <Music className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-black text-sm">{session.pieceName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(session.practiceTime)}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(session.startTime).toLocaleTimeString("ko-KR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {groupedSelectedDrills.length === 0 && selectedDateSessions.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100">
              <Music className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">이 날 연습 기록이 없습니다</p>
            </div>
          )}

          {/* Total Stats */}
          {selectedDateSessions.length > 0 && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">총 연습 시간</span>
                <span className="font-bold text-black">
                  {formatTime(selectedDateSessions.reduce((sum, s) => sum + s.practiceTime, 0))}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Audio Player Modal */}
      {playingSession && audioUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[60]">
          <div className="bg-white rounded-t-3xl p-6 w-full max-w-lg animate-in slide-in-from-bottom duration-300">
            {/* Hidden Audio Element */}
            <audio
              ref={audioRef}
              src={audioUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleAudioEnded}
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1">
                <p className="font-semibold text-black">{playingSession.pieceName}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(playingSession.startTime).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={handleClosePlayer}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500">{formatSeconds(currentTime)}</span>
                <span className="text-xs text-gray-500">{formatSeconds(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-violet-500 to-violet-900 flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/30"
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 text-white" />
                ) : (
                  <Play className="w-7 h-7 text-white ml-1" />
                )}
              </button>
            </div>

            {/* Session Info */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-black">{formatTime(playingSession.practiceTime)}</p>
                  <p className="text-[10px] text-gray-500">연습 시간</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-black">{formatTime(playingSession.totalTime)}</p>
                  <p className="text-[10px] text-gray-500">총 시간</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600">
                    {playingSession.totalTime > 0
                      ? `${Math.round((playingSession.practiceTime / playingSession.totalTime) * 100)}%`
                      : "0%"}
                  </p>
                  <p className="text-[10px] text-gray-500">효율</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Start Practice Button */}
      <button
        onClick={() => router.push("/practice")}
        className="fixed bottom-24 left-4 right-4 max-w-lg mx-auto py-4 bg-gradient-to-r from-violet-500 to-violet-900 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
      >
        <Play className="w-5 h-5 fill-white" />
        연습 시작하기
      </button>
    </div>
  );
}
