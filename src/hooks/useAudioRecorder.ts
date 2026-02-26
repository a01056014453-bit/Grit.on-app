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
// iOS WebView 네이티브 브릿지 타입 선언
// ─────────────────────────────────────────────
declare global {
  interface Window {
    /**
     * React Native WebView 브릿지 (iOS 네이티브 녹음)
     * RN 앱에서 window.ReactNativeWebView.postMessage()로 오디오 전달
     */
    ReactNativeWebView?: {
      postMessage: (msg: string) => void;
    };
    /**
     * iOS 네이티브 → 웹으로 오디오 청크 전달 콜백
     * RN 앱에서 window.onNativeAudioChunk(base64, mimeType) 호출
     */
    onNativeAudioChunk?: (base64: string, mimeType: string) => void;
    /**
     * iOS 네이티브 → 웹으로 녹음 완료 콜백
     * RN 앱에서 window.onNativeAudioStop(base64, mimeType) 호출
     */
    onNativeAudioStop?: (base64: string, mimeType: string) => void;
  }
}

/** React Native WebView 환경 여부 */
const isNativeApp = (): boolean =>
  typeof window !== "undefined" && !!window.ReactNativeWebView;

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────
const CLASSIFY_INTERVAL_MS = 3000;       // 3초마다 서버 분류
const CALIBRATION_SAMPLES = 300;         // ~5초 (60fps × 5)
const CALIBRATION_SKIP = 60;             // 첫 1초 스킵 (마이크 초기화)
const PIANO_ON_THRESHOLD_MS = 800;       // 피아노 0.8초 이상 → 카운팅 시작
const PIANO_OFF_DELAY_MS = 7000;         // 피아노 안 들린 후 7초 대기 → 중단 (3초 주기 기준 2~3회 SILENCE 허용)
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
  // 서버 API로 오디오 분류 요청
  // ─────────────────────────────────────────────
  const classifyAudioClip = useCallback(
    async (audioBlob: Blob, dbSamples: number[]) => {
      if (isClassifyingRef.current) return;
      isClassifyingRef.current = true;

      try {
        const avgDb =
          dbSamples.length > 0
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

        // CLIENT_SIDE 신호: YAMNET_SERVER_URL 없음 → 무음 필터만 적용
        if (data.label === "CLIENT_SIDE") {
          console.log("[Classify] 클라이언트 사이드 모드 (서버 없음)");
          return;
        }

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

        // ── iOS 네이티브 앱: MediaRecorder 대신 브릿지 사용 ──────────────
        if (isNativeApp()) {
          // RN 앱에 "3초 클립 달라"고 요청
          window.ReactNativeWebView!.postMessage(
            JSON.stringify({ type: "REQUEST_AUDIO_CLIP", durationMs: CLASSIFY_INTERVAL_MS })
          );
          // 응답은 window.onNativeAudioChunk 콜백으로 수신 (아래 등록)
          return;
        }

        // ── 웹 / Android WebView: 기존 MediaRecorder 방식 ────────────────
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

        clipDbIntervalRef.current = setInterval(() => {
          if (!analyserRef.current) return;
          const timeData = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteTimeDomainData(timeData);
          const db = calculateDecibel(timeData);
          clipDbSamplesRef.current.push(db);
        }, 100);

        setTimeout(() => {
          if (recorder.state === "recording") recorder.stop();
        }, CLASSIFY_INTERVAL_MS);
      };

      classifyIntervalRef.current = setInterval(startClipCapture, CLASSIFY_INTERVAL_MS);
    },
    [classifyAudioClip, calculateDecibel]
  );

  // ─────────────────────────────────────────────
  // iOS 네이티브 브릿지 콜백 등록
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!isNativeApp()) return;

    // RN 앱이 window.onNativeAudioChunk(base64, mimeType) 호출 → 분류
    window.onNativeAudioChunk = (base64: string, mimeType: string) => {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: mimeType });
      // dB 샘플은 analyser에서 별도 수집 중이므로 현재 캐시된 값 사용
      classifyAudioClip(blob, [...clipDbSamplesRef.current]);
      clipDbSamplesRef.current = [];
    };

    // 전체 녹음 완료 콜백
    window.onNativeAudioStop = (base64: string, mimeType: string) => {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);
      setState((prev) => ({ ...prev, audioBlob: blob, audioUrl: url }));
    };

    return () => {
      window.onNativeAudioChunk = undefined;
      window.onNativeAudioStop = undefined;
    };
  }, [classifyAudioClip]);

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
        console.log("[Calibration] 완료. 노이즈 플로어:", noiseFloorDecibelRef.current);
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
    // iOS 네이티브: RN 앱에 권한 요청 위임
    if (isNativeApp()) {
      window.ReactNativeWebView!.postMessage(
        JSON.stringify({ type: "REQUEST_MIC_PERMISSION" })
      );
      setState((prev) => ({ ...prev, hasPermission: true, error: null }));
      return true;
    }

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
      const msg =
        err instanceof Error ? err.message : "마이크 접근 권한이 필요합니다";
      setState((prev) => ({ ...prev, hasPermission: false, error: msg }));
      return false;
    }
  }, []);

  // ─────────────────────────────────────────────
  // 녹음 시작
  // ─────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (!mediaStreamRef.current && !isNativeApp()) {
      const ok = await requestPermission();
      if (!ok) return;
    }

    // ── iOS 네이티브: RN에 녹음 시작 명령 ──────────────────────────────
    if (isNativeApp()) {
      window.ReactNativeWebView!.postMessage(
        JSON.stringify({ type: "START_RECORDING" })
      );
      // AudioContext는 Web Audio API (FFT 시각화용) - 사용자 액션 후 생성 ✅
      try {
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        // 네이티브 스트림이 없으므로 analyser는 빈 노드로 초기화
        // (볼륨 시각화는 RN에서 별도 콜백으로 제공 가능)
      } catch {
        console.warn("[iOS] AudioContext 생성 실패 (시각화 비활성)");
      }

      _initRecordingState();
      return;
    }

    // ── 웹 / Android: 기존 방식 ──────────────────────────────────────
    const stream = mediaStreamRef.current;
    if (!stream) return;

    try {
      // AudioContext는 사용자 액션(startRecording 호출) 이후 생성 → iOS Safe ✅
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.5;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

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

      _initRecordingState();

      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      startClassifyLoop(stream);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "녹음을 시작할 수 없습니다";
      setState((prev) => ({ ...prev, error: msg }));
    }
  }, [requestPermission, analyzeAudio, startClassifyLoop]);

  /** 녹음 시작 시 공통 상태 초기화 */
  const _initRecordingState = useCallback(() => {
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

    const startTime = Date.now();
    let accumulatedPracticeTime = 0;

    if (totalTimeIntervalRef.current) clearInterval(totalTimeIntervalRef.current);
    if (practiceTimeIntervalRef.current) clearInterval(practiceTimeIntervalRef.current);

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
  }, []);

  // ─────────────────────────────────────────────
  // 일시정지
  // ─────────────────────────────────────────────
  const pauseRecording = useCallback(() => {
    if (isNativeApp()) {
      window.ReactNativeWebView!.postMessage(JSON.stringify({ type: "PAUSE_RECORDING" }));
    } else if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
    }

    isPausedRef.current = true;

    if (totalTimeIntervalRef.current) clearInterval(totalTimeIntervalRef.current);
    if (practiceTimeIntervalRef.current) clearInterval(practiceTimeIntervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (classifyIntervalRef.current) clearInterval(classifyIntervalRef.current);
    if (clipDbIntervalRef.current) clearInterval(clipDbIntervalRef.current);
    if (classifyRecorderRef.current?.state === "recording") {
      classifyRecorderRef.current.stop();
    }

    setState((prev) => {
      pausedTotalTimeRef.current = prev.totalTime;
      pausedPracticeTimeRef.current = prev.practiceTime;
      return { ...prev, isPaused: true };
    });
  }, []);

  // ─────────────────────────────────────────────
  // 재개
  // ─────────────────────────────────────────────
  const resumeRecording = useCallback(() => {
    if (isNativeApp()) {
      window.ReactNativeWebView!.postMessage(JSON.stringify({ type: "RESUME_RECORDING" }));
    } else if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
    }

    isPausedRef.current = false;
    lastPianoDetectedTimeRef.current = 0;
    lastVoiceDetectedTimeRef.current = 0;
    cumulativePianoMsRef.current = 0;

    if (totalTimeIntervalRef.current) clearInterval(totalTimeIntervalRef.current);
    if (practiceTimeIntervalRef.current) clearInterval(practiceTimeIntervalRef.current);

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

    if (mediaStreamRef.current) {
      startClassifyLoop(mediaStreamRef.current);
    } else if (isNativeApp()) {
      // iOS: 스트림 없이 분류 루프만 재시작 (빈 스트림 전달)
      startClassifyLoop(new MediaStream());
    }
  }, [analyzeAudio, startClassifyLoop]);

  // ─────────────────────────────────────────────
  // 중지
  // ─────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (isNativeApp()) {
      window.ReactNativeWebView!.postMessage(JSON.stringify({ type: "STOP_RECORDING" }));
    } else if (mediaRecorderRef.current && isRecordingRef.current) {
      mediaRecorderRef.current.stop();
    }

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
    isNativeApp: isNativeApp(),
  };
}
