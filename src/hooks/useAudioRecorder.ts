"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export type AudioLabel =
  | "PIANO_PLAYING"
  | "VOICE"
  | "METRONOME_ONLY"
  | "SILENCE"
  | "NOISE";

export interface BeatTimestamp {
  time: number;
  wallTime: number;
  isAccent: boolean;
}

export interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  hasPermission: boolean | null;
  error: string | null;
  totalTime: number;
  practiceTime: number;
  currentVolume: number;
  currentDecibel: number;
  isSoundDetected: boolean;
  isPianoDetected: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  noiseFloor: number;
  isCalibrating: boolean;
  audioLabel: AudioLabel | null;
  classificationConfidence: number;
  frequencyBands: number[];
}

interface UseAudioRecorderOptions {
  decibelThreshold?: number;
  minSoundDuration?: number;
  calibrationDuration?: number;
  metronomeActive?: boolean;
  getBeatTimestamps?: () => BeatTimestamp[];
}

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────
const CLASSIFY_INTERVAL_MS = 3000;       // 3초마다 서버 분류
const CALIBRATION_SAMPLES = 300;         // ~5초 (60fps × 5)
const CALIBRATION_SKIP = 60;             // 첫 1초 스킵 (마이크 초기화)
const PIANO_ON_THRESHOLD_MS = 800;       // 피아노 0.8초 이상 → 카운팅 시작
const PIANO_OFF_DELAY_MS = 1500;         // 피아노 안 들린 후 1.5초 → 중단
const VOICE_SUPPRESS_MS = 2500;          // 목소리 감지 후 2.5초간 카운팅 중단
const MIN_CONFIDENCE = 0.55;

// ─────────────────────────────────────────────
// 메인 훅
// ─────────────────────────────────────────────
export function useAudioRecorder(options: UseAudioRecorderOptions = {}) {
  const {
    metronomeActive = false,
    getBeatTimestamps = () => [],
  } = options;

  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    hasPermission: null,
    error: null,
    totalTime: 0,
    practiceTime: 0,
    currentVolume: 0,
    currentDecibel: 0,
    isSoundDetected: false,
    isPianoDetected: false,
    audioBlob: null,
    audioUrl: null,
    noiseFloor: 0,
    isCalibrating: false,
    audioLabel: null,
    classificationConfidence: 0,
    frequencyBands: Array(20).fill(0),
  });

  // ── Metronome refs ──
  const metronomeActiveRef = useRef(metronomeActive);
  const getBeatTimestampsRef = useRef(getBeatTimestamps);
  useEffect(() => {
    metronomeActiveRef.current = metronomeActive;
    getBeatTimestampsRef.current = getBeatTimestamps;
  }, [metronomeActive, getBeatTimestamps]);

  // ── Audio refs ──
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // ── 분류용 별도 MediaRecorder (3초 클립 캡처) ──
  const classifyRecorderRef = useRef<MediaRecorder | null>(null);
  const classifyChunksRef = useRef<Blob[]>([]);
  const classifyIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isClassifyingRef = useRef<boolean>(false);

  // ── 3초 클립 동안 dB 샘플 수집 (100ms마다) ──
  const clipDbSamplesRef = useRef<number[]>([]);
  const clipDbIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ── State tracking refs ──
  const isRecordingRef = useRef(false);
  const isPausedRef = useRef(false);

  // ── Time tracking refs ──
  const totalTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const practiceTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isActuallyPlayingRef = useRef<boolean>(false);
  const pausedTotalTimeRef = useRef<number>(0);
  const pausedPracticeTimeRef = useRef<number>(0);

  // ── Calibration refs ──
  const noiseFloorDecibelRef = useRef<number>(0);
  const calibrationSamplesRef = useRef<number[]>([]);
  const isCalibrationCompleteRef = useRef<boolean>(false);

  // ── Piano detection hysteresis refs ──
  const lastPianoDetectedTimeRef = useRef<number>(0);
  const lastVoiceDetectedTimeRef = useRef<number>(0);
  const cumulativePianoMsRef = useRef<number>(0);

  // ─────────────────────────────────────────────
  // 데시벨 계산
  // ─────────────────────────────────────────────
  const calculateDecibel = useCallback((dataArray: Uint8Array): number => {
    let sumSquares = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const amplitude = (dataArray[i] - 128) / 128;
      sumSquares += amplitude * amplitude;
    }
    const rms = Math.sqrt(sumSquares / dataArray.length);
    if (rms === 0) return 0;
    return Math.max(0, Math.min(120, 20 * Math.log10(rms) + 90));
  }, []);

  // ─────────────────────────────────────────────
  // 연습 시간 상태 업데이트
  // ─────────────────────────────────────────────
  const updatePracticeState = useCallback(
    (label: AudioLabel, confidence: number) => {
      const currentTime = Date.now();
      const isPianoSound = label === "PIANO_PLAYING" && confidence >= MIN_CONFIDENCE;
      const isVoiceSound = label === "VOICE" && confidence >= MIN_CONFIDENCE;

      if (isVoiceSound) {
        lastVoiceDetectedTimeRef.current = currentTime;
        cumulativePianoMsRef.current = Math.max(0, cumulativePianoMsRef.current - 500);
      }

      if (isPianoSound) {
        lastPianoDetectedTimeRef.current = currentTime;
        // 3초 인터벌이므로 3000ms 누적
        cumulativePianoMsRef.current += CLASSIFY_INTERVAL_MS;
      }

      const timeSinceLastPiano = currentTime - lastPianoDetectedTimeRef.current;
      const timeSinceVoice = currentTime - lastVoiceDetectedTimeRef.current;
      const voiceRecentlyDetected = timeSinceVoice < VOICE_SUPPRESS_MS;

      if (!isActuallyPlayingRef.current) {
        if (
          isPianoSound &&
          cumulativePianoMsRef.current >= PIANO_ON_THRESHOLD_MS &&
          !voiceRecentlyDetected
        ) {
          isActuallyPlayingRef.current = true;
          console.log("[Practice] 피아노 감지 → 카운팅 시작 ▶");
        }
      } else {
        const shouldTurnOff =
          timeSinceLastPiano >= PIANO_OFF_DELAY_MS || voiceRecentlyDetected;

        if (shouldTurnOff) {
          isActuallyPlayingRef.current = false;
          cumulativePianoMsRef.current = 0;
          console.log(
            voiceRecentlyDetected
              ? "[Practice] 목소리 감지 → 카운팅 중단 ⏸"
              : "[Practice] 피아노 종료 → 카운팅 중단 ⏸"
          );
        }
      }
    },
    []
  );

  // ─────────────────────────────────────────────
  // 서버 API로 오디오 분류 요청 (dB 정보 포함)
  // ─────────────────────────────────────────────
  const classifyAudioClip = useCallback(
    async (audioBlob: Blob, dbSamples: number[]) => {
      if (isClassifyingRef.current) return;
      isClassifyingRef.current = true;

      try {
        // 평균 dB 계산
        const avgDb = dbSamples.length > 0
          ? dbSamples.reduce((a, b) => a + b, 0) / dbSamples.length
          : 0;
        const noiseFloor = noiseFloorDecibelRef.current;

        const formData = new FormData();
        formData.append("audio", audioBlob);
        formData.append("avgDecibel", avgDb.toFixed(1));
        formData.append("noiseFloor", noiseFloor.toFixed(1));

        const res = await fetch("/api/classify-audio", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          console.warn("[Classify] API 오류:", res.status);
          return;
        }

        const data = await res.json();
        const label = data.label as AudioLabel;
        const confidence = data.confidence as number;

        console.log(
          `[Classify] ${label} (${(confidence * 100).toFixed(0)}%) avgDb=${avgDb.toFixed(1)} floor=${noiseFloor.toFixed(1)} ${data.reason ?? ""}`
        );

        updatePracticeState(label, confidence);

        setState((prev) => ({
          ...prev,
          audioLabel: label,
          classificationConfidence: confidence,
          isPianoDetected: isActuallyPlayingRef.current,
        }));
      } catch (err) {
        console.error("[Classify] 요청 실패:", err);
      } finally {
        isClassifyingRef.current = false;
      }
    },
    [updatePracticeState]
  );

  // ─────────────────────────────────────────────
  // 3초마다 오디오 클립 캡처 + dB 수집 → 서버 분류
  // ─────────────────────────────────────────────
  const startClassifyLoop = useCallback(
    (stream: MediaStream) => {
      if (classifyIntervalRef.current) clearInterval(classifyIntervalRef.current);

      const startClipCapture = () => {
        if (!isRecordingRef.current || isPausedRef.current) return;
        if (!isCalibrationCompleteRef.current) return;

        const mimeType = MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

        classifyChunksRef.current = [];
        clipDbSamplesRef.current = [];
        const recorder = new MediaRecorder(stream, { mimeType });

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) classifyChunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          // dB 수집 중지
          if (clipDbIntervalRef.current) {
            clearInterval(clipDbIntervalRef.current);
            clipDbIntervalRef.current = null;
          }

          if (classifyChunksRef.current.length > 0) {
            const blob = new Blob(classifyChunksRef.current, { type: mimeType });
            const samples = [...clipDbSamplesRef.current];
            classifyAudioClip(blob, samples);
          }
        };

        classifyRecorderRef.current = recorder;
        recorder.start();

        // 100ms마다 현재 dB 샘플 수집
        clipDbIntervalRef.current = setInterval(() => {
          if (!analyserRef.current) return;
          const timeData = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteTimeDomainData(timeData);
          const db = calculateDecibel(timeData);
          clipDbSamplesRef.current.push(db);
        }, 100);

        // 3초 후 중지 → onstop에서 분류 호출
        setTimeout(() => {
          if (recorder.state === "recording") {
            recorder.stop();
          }
        }, CLASSIFY_INTERVAL_MS);
      };

      classifyIntervalRef.current = setInterval(startClipCapture, CLASSIFY_INTERVAL_MS);
    },
    [classifyAudioClip, calculateDecibel]
  );

  // ─────────────────────────────────────────────
  // 오디오 분석 루프 (시각화 + 캘리브레이션)
  // ─────────────────────────────────────────────
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !isRecordingRef.current || isPausedRef.current) {
      if (isRecordingRef.current && !isPausedRef.current) {
        animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      }
      return;
    }

    const analyser = analyserRef.current;
    const sampleRate = audioContextRef.current?.sampleRate ?? 44100;

    const timeData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(timeData);

    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(frequencyData);

    const decibel = calculateDecibel(timeData);

    let maxAmplitude = 0;
    for (let i = 0; i < timeData.length; i++) {
      const amplitude = Math.abs(timeData[i] - 128);
      if (amplitude > maxAmplitude) maxAmplitude = amplitude;
    }
    const peakVolume = Math.min(100, (maxAmplitude / 128) * 100 * 4);

    // ── 5초 캘리브레이션 ──
    if (!isCalibrationCompleteRef.current) {
      calibrationSamplesRef.current.push(decibel);
      if (calibrationSamplesRef.current.length >= CALIBRATION_SAMPLES) {
        const stable = calibrationSamplesRef.current.slice(CALIBRATION_SKIP);
        const sorted = [...stable].sort((a, b) => a - b);
        const p75 = sorted[Math.floor(sorted.length * 0.75)];
        noiseFloorDecibelRef.current = Math.max(42, p75 + 3);
        isCalibrationCompleteRef.current = true;
        console.log("[Calibration] 완료 (5초). 노이즈 플로어:", noiseFloorDecibelRef.current);
        setState((prev) => ({
          ...prev,
          noiseFloor: noiseFloorDecibelRef.current,
          isCalibrating: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          currentVolume: peakVolume,
          currentDecibel: decibel,
          isCalibrating: true,
        }));
        animationFrameRef.current = requestAnimationFrame(analyzeAudio);
        return;
      }
    }

    // ── 시각화 밴드 계산 ──
    const binCount = frequencyData.length;
    const binWidth = (sampleRate / 2) / binCount;
    const bands: number[] = [];
    const bandCount = 20;
    const usableBins = Math.min(binCount, Math.floor(8000 / binWidth));
    const binsPerBand = Math.max(1, Math.floor(usableBins / bandCount));
    for (let b = 0; b < bandCount; b++) {
      let sum = 0;
      const start = b * binsPerBand;
      for (let j = start; j < start + binsPerBand && j < binCount; j++) {
        sum += frequencyData[j];
      }
      bands.push(Math.min(100, (sum / binsPerBand / 255) * 150));
    }

    const isSoundDetected = decibel > noiseFloorDecibelRef.current + 3;

    setState((prev) => ({
      ...prev,
      currentVolume: peakVolume,
      currentDecibel: Math.round(decibel),
      isSoundDetected,
      isPianoDetected: isActuallyPlayingRef.current,
      frequencyBands: bands,
    }));

    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  }, [calculateDecibel]);

  // ─────────────────────────────────────────────
  // 마이크 권한 요청
  // ─────────────────────────────────────────────
  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100,
        },
      });
      mediaStreamRef.current = stream;
      setState((prev) => ({ ...prev, hasPermission: true, error: null }));
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "마이크 접근 권한이 필요합니다";
      setState((prev) => ({ ...prev, hasPermission: false, error: msg }));
      return false;
    }
  }, []);

  // ─────────────────────────────────────────────
  // 녹음 시작
  // ─────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (!mediaStreamRef.current) {
      const ok = await requestPermission();
      if (!ok) return;
    }

    const stream = mediaStreamRef.current;
    if (!stream) return;

    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.5;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // MediaRecorder 설정 (전체 녹음용)
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setState((prev) => ({ ...prev, audioBlob: blob, audioUrl: url }));
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);

      // ── 상태 초기화 ──
      isRecordingRef.current = true;
      isPausedRef.current = false;
      isActuallyPlayingRef.current = false;
      cumulativePianoMsRef.current = 0;
      lastPianoDetectedTimeRef.current = 0;
      lastVoiceDetectedTimeRef.current = 0;
      noiseFloorDecibelRef.current = 0;
      calibrationSamplesRef.current = [];
      isCalibrationCompleteRef.current = false;
      isClassifyingRef.current = false;

      // ── 타이머 시작 ──
      const startTime = Date.now();
      let accumulatedPracticeTime = 0;

      totalTimeIntervalRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          totalTime: Math.floor((Date.now() - startTime) / 1000),
        }));
      }, 1000);

      practiceTimeIntervalRef.current = setInterval(() => {
        if (isActuallyPlayingRef.current) {
          accumulatedPracticeTime += 0.1;
          setState((prev) => ({
            ...prev,
            practiceTime: Math.floor(accumulatedPracticeTime),
          }));
        }
      }, 100);

      setState((prev) => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        error: null,
        totalTime: 0,
        practiceTime: 0,
        currentDecibel: 0,
        isPianoDetected: false,
        audioBlob: null,
        audioUrl: null,
        noiseFloor: 0,
        isCalibrating: true,
        audioLabel: null,
        classificationConfidence: 0,
      }));

      // ── 분석 루프 시작 (시각화 + 캘리브레이션) ──
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);

      // ── 3초마다 서버 분류 시작 ──
      startClassifyLoop(stream);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "녹음을 시작할 수 없습니다";
      setState((prev) => ({ ...prev, error: msg }));
    }
  }, [requestPermission, analyzeAudio, startClassifyLoop]);

  // ─────────────────────────────────────────────
  // 일시정지
  // ─────────────────────────────────────────────
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecordingRef.current && !isPausedRef.current) {
      mediaRecorderRef.current.pause();
      isPausedRef.current = true;

      if (totalTimeIntervalRef.current) clearInterval(totalTimeIntervalRef.current);
      if (practiceTimeIntervalRef.current) clearInterval(practiceTimeIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (classifyIntervalRef.current) clearInterval(classifyIntervalRef.current);
      if (clipDbIntervalRef.current) clearInterval(clipDbIntervalRef.current);
      if (classifyRecorderRef.current?.state === "recording") {
        classifyRecorderRef.current.stop();
      }

      // 현재 시간 값 ref에 저장 (resume에서 사용)
      setState((prev) => {
        pausedTotalTimeRef.current = prev.totalTime;
        pausedPracticeTimeRef.current = prev.practiceTime;
        return { ...prev, isPaused: true };
      });
    }
  }, []);

  // ─────────────────────────────────────────────
  // 재개
  // ─────────────────────────────────────────────
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecordingRef.current && isPausedRef.current) {
      mediaRecorderRef.current.resume();
      isPausedRef.current = false;

      // 하이스테리시스 초기화
      lastPianoDetectedTimeRef.current = 0;
      lastVoiceDetectedTimeRef.current = 0;
      cumulativePianoMsRef.current = 0;

      // 기존 인터벌 확실히 정리
      if (totalTimeIntervalRef.current) clearInterval(totalTimeIntervalRef.current);
      if (practiceTimeIntervalRef.current) clearInterval(practiceTimeIntervalRef.current);

      // setState 밖에서 인터벌 생성 (Strict Mode 중복 방지)
      const resumeTime = Date.now();
      const previousTotal = pausedTotalTimeRef.current;
      let accumulatedPracticeTime = pausedPracticeTimeRef.current;

      totalTimeIntervalRef.current = setInterval(() => {
        setState((p) => ({
          ...p,
          totalTime: previousTotal + Math.floor((Date.now() - resumeTime) / 1000),
        }));
      }, 1000);

      practiceTimeIntervalRef.current = setInterval(() => {
        if (isActuallyPlayingRef.current) {
          accumulatedPracticeTime += 0.1;
          setState((p) => ({
            ...p,
            practiceTime: Math.floor(accumulatedPracticeTime),
          }));
        }
      }, 100);

      setState((prev) => ({ ...prev, isPaused: false }));

      animationFrameRef.current = requestAnimationFrame(analyzeAudio);

      // 분류 루프 재개
      if (mediaStreamRef.current) {
        startClassifyLoop(mediaStreamRef.current);
      }
    }
  }, [analyzeAudio, startClassifyLoop]);

  // ─────────────────────────────────────────────
  // 중지
  // ─────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecordingRef.current) {
      mediaRecorderRef.current.stop();
      isRecordingRef.current = false;
      isPausedRef.current = false;

      if (totalTimeIntervalRef.current) clearInterval(totalTimeIntervalRef.current);
      if (practiceTimeIntervalRef.current) clearInterval(practiceTimeIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (classifyIntervalRef.current) clearInterval(classifyIntervalRef.current);
      if (clipDbIntervalRef.current) clearInterval(clipDbIntervalRef.current);
      if (classifyRecorderRef.current?.state === "recording") {
        classifyRecorderRef.current.stop();
      }

      if (audioContextRef.current?.state !== "closed") {
        audioContextRef.current?.close();
      }
      audioContextRef.current = null;

      setState((prev) => ({
        ...prev,
        isRecording: false,
        isPaused: false,
        isSoundDetected: false,
        currentVolume: 0,
        audioLabel: null,
        classificationConfidence: 0,
      }));
    }
  }, []);

  // ─────────────────────────────────────────────
  // 리셋
  // ─────────────────────────────────────────────
  const reset = useCallback(() => {
    setState((prev) => {
      if (prev.audioUrl) URL.revokeObjectURL(prev.audioUrl);
      return {
        ...prev,
        totalTime: 0,
        practiceTime: 0,
        currentDecibel: 0,
        isPianoDetected: false,
        audioBlob: null,
        audioUrl: null,
        noiseFloor: 0,
        isCalibrating: false,
        audioLabel: null,
        classificationConfidence: 0,
      };
    });
    chunksRef.current = [];
    calibrationSamplesRef.current = [];
    isCalibrationCompleteRef.current = false;
    cumulativePianoMsRef.current = 0;
  }, []);

  // ─────────────────────────────────────────────
  // 언마운트 클린업
  // ─────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (totalTimeIntervalRef.current) clearInterval(totalTimeIntervalRef.current);
      if (practiceTimeIntervalRef.current) clearInterval(practiceTimeIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (classifyIntervalRef.current) clearInterval(classifyIntervalRef.current);
      if (clipDbIntervalRef.current) clearInterval(clipDbIntervalRef.current);
      if (classifyRecorderRef.current?.state === "recording") {
        classifyRecorderRef.current.stop();
      }
      if (audioContextRef.current?.state !== "closed") {
        audioContextRef.current?.close();
      }
      audioContextRef.current = null;
    };
  }, []);

  return {
    ...state,
    requestPermission,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    reset,
  };
}
