"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  hasPermission: boolean | null;
  error: string | null;
  totalTime: number;
  practiceTime: number;
  currentVolume: number;
  currentDecibel: number; // 현재 데시벨
  isSoundDetected: boolean;
  isPianoDetected: boolean; // 피아노 소리 감지 여부
  audioBlob: Blob | null;
  audioUrl: string | null;
  noiseFloor: number; // 환경 소음 기준선
  isCalibrating: boolean; // 노이즈 플로어 측정 중
}

interface UseAudioRecorderOptions {
  decibelThreshold?: number; // dB - minimum decibel to count as piano sound
  minSoundDuration?: number; // ms - minimum duration to count as practice
  calibrationDuration?: number; // ms - noise floor calibration time
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}) {
  // 피아노 소리 감지에 최적화된 기본값
  const {
    decibelThreshold = 50, // 50dB 이상이면 피아노 연주로 인식 (더 민감하게)
    minSoundDuration = 200, // 200ms 이상 지속되어야 연습으로 카운트
    calibrationDuration = 1000, // 1초간 환경 소음 측정
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
  });

  // Refs for audio handling
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Refs for state tracking (to avoid closure issues)
  const isRecordingRef = useRef(false);
  const isPausedRef = useRef(false);

  // Refs for time tracking
  const totalTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const practiceTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const soundStartTimeRef = useRef<number | null>(null);
  const lastSoundTimeRef = useRef<number>(0);
  const isActuallyPlayingRef = useRef<boolean>(false);

  // Noise floor calibration refs
  const noiseFloorRef = useRef<number>(0);
  const noiseFloorDecibelRef = useRef<number>(0);
  const calibrationSamplesRef = useRef<number[]>([]);
  const isCalibrationCompleteRef = useRef<boolean>(false);

  // Time-based hysteresis refs (ms instead of frames)
  const lastPianoDetectedTimeRef = useRef<number>(0);
  const lastSilenceDetectedTimeRef = useRef<number>(0);
  const PIANO_ON_DELAY_MS = 30; // 30ms 이상 피아노 소리나야 ON (더 빠른 반응)
  const PIANO_OFF_DELAY_MS = 1000; // 1초 이상 조용해야 OFF (피아노 서스테인/페달 고려)

  // 피아노 주파수 대역 (Hz)
  // 피아노: A0(27.5Hz) ~ C8(4186Hz), 주요 대역 200Hz ~ 4000Hz
  // 말소리: 기본 주파수 85-255Hz, 주요 에너지 300Hz ~ 3000Hz
  const PIANO_LOW_FREQ = 200; // Hz
  const PIANO_HIGH_FREQ = 4000; // Hz
  const VOICE_LOW_FREQ = 100; // Hz
  const VOICE_HIGH_FREQ = 400; // Hz (기본 주파수 대역)

  // Request microphone permission
  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      mediaStreamRef.current = stream;
      setState((prev) => ({ ...prev, hasPermission: true, error: null }));
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "마이크 접근 권한이 필요합니다";
      setState((prev) => ({
        ...prev,
        hasPermission: false,
        error: errorMessage,
      }));
      return false;
    }
  }, []);

  // Calculate RMS (Root Mean Square) and convert to decibel
  const calculateDecibel = useCallback((dataArray: Uint8Array): number => {
    let sumSquares = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const amplitude = (dataArray[i] - 128) / 128; // Normalize to -1 to 1
      sumSquares += amplitude * amplitude;
    }
    const rms = Math.sqrt(sumSquares / dataArray.length);

    // Convert to decibel (dB SPL approximation)
    // Reference: typical microphone sensitivity and calibration
    // 0 dB = threshold of hearing, 60 dB = normal conversation, 80 dB = loud music
    if (rms === 0) return 0;
    const decibel = 20 * Math.log10(rms) + 90; // +90 offset for typical mic
    return Math.max(0, Math.min(120, decibel));
  }, []);

  // Calculate energy in specific frequency band
  const getFrequencyBandEnergy = useCallback(
    (frequencyData: Uint8Array, sampleRate: number, lowFreq: number, highFreq: number): number => {
      const nyquist = sampleRate / 2;
      const binCount = frequencyData.length;
      const binWidth = nyquist / binCount;

      const lowBin = Math.floor(lowFreq / binWidth);
      const highBin = Math.min(Math.ceil(highFreq / binWidth), binCount - 1);

      let sum = 0;
      let count = 0;
      for (let i = lowBin; i <= highBin; i++) {
        sum += frequencyData[i];
        count++;
      }
      return count > 0 ? sum / count : 0;
    },
    []
  );

  // Detect if sound is likely piano (vs voice/noise)
  const isPianoSound = useCallback(
    (frequencyData: Uint8Array, sampleRate: number, decibel: number): boolean => {
      // 1. 데시벨 기준: 노이즈 플로어보다 높은 소리만
      const effectiveThreshold = Math.max(decibelThreshold, noiseFloorDecibelRef.current + 5);
      if (decibel < effectiveThreshold) return false;

      // 2. 주파수 대역 에너지 분석
      const pianoEnergy = getFrequencyBandEnergy(frequencyData, sampleRate, PIANO_LOW_FREQ, PIANO_HIGH_FREQ);
      const voiceEnergy = getFrequencyBandEnergy(frequencyData, sampleRate, VOICE_LOW_FREQ, VOICE_HIGH_FREQ);
      const highFreqEnergy = getFrequencyBandEnergy(frequencyData, sampleRate, 2000, 4000); // 피아노 고음역
      const lowFreqEnergy = getFrequencyBandEnergy(frequencyData, sampleRate, 50, 200); // 저음역

      // 3. 피아노 특성 판별:
      // - 피아노는 넓은 주파수 대역에 에너지가 분포
      // - 말소리는 저주파(기본 주파수)에 에너지가 집중
      // - 피아노는 하모닉스로 인해 고주파 에너지가 높음

      // 피아노 대역 에너지가 최소한 있어야 함 (더 낮은 임계값)
      if (pianoEnergy < 10) return false;

      // 피아노 대역 vs 음성 기본 주파수 대역 비율
      const pianoToVoiceRatio = voiceEnergy > 0 ? pianoEnergy / voiceEnergy : pianoEnergy;

      // 고주파 에너지 비율 (피아노는 고음역 하모닉스가 있음)
      const highFreqRatio = pianoEnergy > 0 ? highFreqEnergy / pianoEnergy : 0;

      // 전체 스펙트럼 에너지 (피아노는 넓게 분포)
      const totalEnergy = pianoEnergy + lowFreqEnergy;

      // 피아노 판별 조건 (더 관대하게):
      // 1. 전체 피아노 대역 에너지가 음성 대역의 60% 이상
      // 2. 또는 고주파 에너지가 있음 (피아노 하모닉스)
      // 3. 또는 충분히 큰 소리 (60dB 이상이면 음악적 소리로 간주)
      // 4. 또는 넓은 주파수 대역에 에너지가 분포 (피아노 특성)
      const isPiano =
        (pianoToVoiceRatio >= 0.6) || // 피아노 대역 에너지가 우세
        (highFreqRatio >= 0.1 && pianoEnergy >= 15) || // 고음역 에너지 있음
        (decibel >= 60 && pianoEnergy >= 20) || // 충분히 큰 소리
        (totalEnergy >= 25 && pianoEnergy >= 12) || // 넓은 대역 분포
        (decibel >= 55 && highFreqEnergy >= 10); // 중간 크기 + 고음역

      return isPiano;
    },
    [decibelThreshold, getFrequencyBandEnergy]
  );

  // Analyze audio in real-time (uses refs to avoid closure issues)
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !isRecordingRef.current || isPausedRef.current) {
      if (isRecordingRef.current && !isPausedRef.current) {
        animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      }
      return;
    }

    const analyser = analyserRef.current;
    const sampleRate = audioContextRef.current?.sampleRate || 44100;

    // Time domain data for decibel calculation
    const timeData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(timeData);

    // Frequency data for piano detection
    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(frequencyData);

    // Calculate decibel
    const decibel = calculateDecibel(timeData);

    // Calculate peak volume for visual display
    let maxAmplitude = 0;
    for (let i = 0; i < timeData.length; i++) {
      const amplitude = Math.abs(timeData[i] - 128);
      if (amplitude > maxAmplitude) {
        maxAmplitude = amplitude;
      }
    }
    const peakVolume = Math.min(100, (maxAmplitude / 128) * 100 * 4);

    const currentTime = Date.now();

    // Noise floor calibration phase (first 1 second)
    if (!isCalibrationCompleteRef.current) {
      calibrationSamplesRef.current.push(decibel);

      if (calibrationSamplesRef.current.length >= 60) {
        // Calculate noise floor as 90th percentile
        const sortedSamples = [...calibrationSamplesRef.current].sort((a, b) => a - b);
        const percentile90Index = Math.floor(sortedSamples.length * 0.9);
        noiseFloorDecibelRef.current = sortedSamples[percentile90Index] + 3;
        noiseFloorRef.current = peakVolume;
        isCalibrationCompleteRef.current = true;

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

    // Check if it's piano sound (not just any sound)
    const pianoDetected = isPianoSound(frequencyData, sampleRate, decibel);

    // Time-based hysteresis for piano detection
    if (pianoDetected) {
      lastPianoDetectedTimeRef.current = currentTime;
    } else {
      lastSilenceDetectedTimeRef.current = currentTime;
    }

    // State transitions based on time
    const timeSinceLastPiano = currentTime - lastPianoDetectedTimeRef.current;
    const timeSinceLastSilence = currentTime - lastSilenceDetectedTimeRef.current;

    if (!isActuallyPlayingRef.current) {
      // Turn ON: 피아노 소리가 감지되고 충분히 지속됨
      if (pianoDetected && timeSinceLastSilence >= PIANO_ON_DELAY_MS) {
        isActuallyPlayingRef.current = true;
        soundStartTimeRef.current = currentTime;
      }
    } else {
      // Turn OFF: 피아노 소리가 없어진 지 충분히 오래됨
      if (!pianoDetected && timeSinceLastPiano >= PIANO_OFF_DELAY_MS) {
        isActuallyPlayingRef.current = false;
        soundStartTimeRef.current = null;
      }
    }

    const isSoundDetected = decibel > noiseFloorDecibelRef.current;
    const isPianoPlaying = isActuallyPlayingRef.current;

    setState((prev) => ({
      ...prev,
      currentVolume: peakVolume,
      currentDecibel: Math.round(decibel),
      isSoundDetected,
      isPianoDetected: isPianoPlaying,
    }));

    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  }, [calculateDecibel, isPianoSound]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!mediaStreamRef.current) {
      const hasPermission = await requestPermission();
      if (!hasPermission) return;
    }

    const stream = mediaStreamRef.current;
    if (!stream) return;

    try {
      // Set up AudioContext and Analyser
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.3;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Set up MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setState((prev) => ({ ...prev, audioBlob: blob, audioUrl: url }));
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);

      // Update refs
      isRecordingRef.current = true;
      isPausedRef.current = false;
      isActuallyPlayingRef.current = false;
      soundStartTimeRef.current = null;
      lastSoundTimeRef.current = 0;

      // Reset calibration for new recording
      noiseFloorRef.current = 0;
      calibrationSamplesRef.current = [];
      isCalibrationCompleteRef.current = false;
      lastPianoDetectedTimeRef.current = 0;
      lastSilenceDetectedTimeRef.current = Date.now();

      // Start time tracking
      const startTime = Date.now();
      let accumulatedPracticeTime = 0;

      totalTimeIntervalRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          totalTime: Math.floor((Date.now() - startTime) / 1000),
        }));
      }, 1000);

      practiceTimeIntervalRef.current = setInterval(() => {
        // Only count time when actually playing (confirmed by analyzeAudio)
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
        isCalibrating: true, // 시작 시 노이즈 플로어 측정 중
      }));

      // Start audio analysis
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "녹음을 시작할 수 없습니다";
      setState((prev) => ({ ...prev, error: errorMessage }));
    }
  }, [requestPermission, analyzeAudio, minSoundDuration]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecordingRef.current && !isPausedRef.current) {
      mediaRecorderRef.current.pause();
      isPausedRef.current = true;

      if (totalTimeIntervalRef.current) clearInterval(totalTimeIntervalRef.current);
      if (practiceTimeIntervalRef.current) clearInterval(practiceTimeIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

      setState((prev) => ({ ...prev, isPaused: true }));
    }
  }, []);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecordingRef.current && isPausedRef.current) {
      mediaRecorderRef.current.resume();
      isPausedRef.current = false;

      // Reset time-based hysteresis refs for resume
      lastSilenceDetectedTimeRef.current = Date.now();
      lastPianoDetectedTimeRef.current = 0;

      setState((prev) => {
        const resumeTime = Date.now();
        const previousTotal = prev.totalTime;
        let accumulatedPracticeTime = prev.practiceTime;

        totalTimeIntervalRef.current = setInterval(() => {
          setState((p) => ({
            ...p,
            totalTime: previousTotal + Math.floor((Date.now() - resumeTime) / 1000),
          }));
        }, 1000);

        practiceTimeIntervalRef.current = setInterval(() => {
          // Fixed: Use isActuallyPlayingRef instead of soundStartTimeRef
          if (isActuallyPlayingRef.current) {
            accumulatedPracticeTime += 0.1;
            setState((p) => ({
              ...p,
              practiceTime: Math.floor(accumulatedPracticeTime),
            }));
          }
        }, 100);

        return { ...prev, isPaused: false };
      });

      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    }
  }, [analyzeAudio]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecordingRef.current) {
      mediaRecorderRef.current.stop();
      isRecordingRef.current = false;
      isPausedRef.current = false;

      if (totalTimeIntervalRef.current) clearInterval(totalTimeIntervalRef.current);
      if (practiceTimeIntervalRef.current) clearInterval(practiceTimeIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      audioContextRef.current = null;

      setState((prev) => ({
        ...prev,
        isRecording: false,
        isPaused: false,
        isSoundDetected: false,
        currentVolume: 0,
      }));
    }
  }, []);

  // Reset state
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
      };
    });
    chunksRef.current = [];
    calibrationSamplesRef.current = [];
    isCalibrationCompleteRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (totalTimeIntervalRef.current) clearInterval(totalTimeIntervalRef.current);
      if (practiceTimeIntervalRef.current) clearInterval(practiceTimeIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
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
