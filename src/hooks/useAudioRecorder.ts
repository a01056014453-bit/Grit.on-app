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

  // 주파수 대역 정의 (Hz)
  // 피아노: 넓은 범위에 에너지 분포, 특히 고주파 성분이 풍부
  // 목소리: 기본 주파수 85-255Hz, 주요 에너지 300Hz~3kHz에 집중
  const LOW_FREQ = 100; // Hz - 저주파 시작
  const MID_FREQ = 500; // Hz - 중주파 시작
  const HIGH_FREQ = 2000; // Hz - 고주파 시작
  const VERY_HIGH_FREQ = 4000; // Hz - 초고주파 시작

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

  // 피아노 소리인지 판별 (주파수 분석 기반)
  // 피아노 특성: 1) 매우 넓은 주파수 분포 2) 강한 고주파 성분 3) 급격한 onset
  // 목소리 특성: 1) 100-1000Hz에 에너지 집중 2) 고주파 약함 3) 지속적인 소리
  const isPianoLikeSound = useCallback(
    (frequencyData: Uint8Array, sampleRate: number): boolean => {
      // 각 주파수 대역의 에너지 계산
      const veryLowEnergy = getFrequencyBandEnergy(frequencyData, sampleRate, 50, LOW_FREQ); // 50-100Hz
      const lowEnergy = getFrequencyBandEnergy(frequencyData, sampleRate, LOW_FREQ, MID_FREQ); // 100-500Hz (목소리 기본 주파수)
      const midEnergy = getFrequencyBandEnergy(frequencyData, sampleRate, MID_FREQ, HIGH_FREQ); // 500-2000Hz
      const highEnergy = getFrequencyBandEnergy(frequencyData, sampleRate, HIGH_FREQ, VERY_HIGH_FREQ); // 2000-4000Hz
      const veryHighEnergy = getFrequencyBandEnergy(frequencyData, sampleRate, VERY_HIGH_FREQ, 8000); // 4000-8000Hz

      // 전체 에너지
      const totalEnergy = veryLowEnergy + lowEnergy + midEnergy + highEnergy + veryHighEnergy;
      if (totalEnergy < 80) return false; // 에너지가 너무 낮으면 무시 (임계값 높임)

      // 각 대역 비율 계산
      const lowMidRatio = (lowEnergy + midEnergy) / totalEnergy; // 목소리 주 대역 (100-2000Hz)
      const highFreqRatio = (highEnergy + veryHighEnergy) / totalEnergy; // 고주파 (2000Hz+)
      const veryHighRatio = veryHighEnergy / totalEnergy; // 초고주파 (4000Hz+)

      // 목소리 패턴 감지 (매우 엄격하게)
      // 목소리: 100-2000Hz 대역에 에너지 집중 (70%+), 고주파 부족 (<20%)
      const isVoiceLike = lowMidRatio > 0.65 && highFreqRatio < 0.25;

      // 피아노 판별 조건 (더 엄격하게):
      // 1. 고주파 비율이 충분히 높음 (>25%) AND
      // 2. 초고주파도 존재 (>8%) - 피아노의 특징적인 배음
      const hasPianoCharacteristics = highFreqRatio > 0.25 && veryHighRatio > 0.08;

      // 스펙트럼 분포 균일성 체크 (피아노는 더 균등하게 분포)
      const energyValues = [veryLowEnergy, lowEnergy, midEnergy, highEnergy, veryHighEnergy];
      const maxEnergy = Math.max(...energyValues);
      const minEnergy = Math.min(...energyValues.filter(e => e > 10)); // 10 이상인 것만
      const spreadRatio = minEnergy / maxEnergy; // 균등할수록 1에 가까움

      // 피아노: 균등 분포 (spreadRatio > 0.15) 또는 강한 고주파 특성
      const hasEvenSpread = spreadRatio > 0.15;

      // 최종 판별: 피아노 특성이 있고 목소리 패턴이 아님
      return (hasPianoCharacteristics || hasEvenSpread) && !isVoiceLike;
    },
    [getFrequencyBandEnergy]
  );

  // 단순화된 소리 감지: 노이즈 플로어보다 높으면 연습으로 카운트
  const isSoundPlaying = useCallback(
    (decibel: number): boolean => {
      // 캘리브레이션 전에는 기본 임계값 사용
      const noiseFloor = isCalibrationCompleteRef.current
        ? noiseFloorDecibelRef.current
        : 35; // 기본 노이즈 플로어

      // 노이즈 플로어 + 마진보다 높으면 소리로 인식
      // 마진을 3dB로 줄여서 더 민감하게
      const threshold = noiseFloor + 3;

      return decibel > threshold;
    },
    []
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

    // 1단계: 소리가 노이즈 플로어보다 높은지 확인
    const soundDetected = isSoundPlaying(decibel);

    // 2단계: 주파수 분석으로 피아노 소리인지 확인
    const isPianoSound = soundDetected && isPianoLikeSound(frequencyData, sampleRate);

    // Time-based hysteresis for piano detection
    if (isPianoSound) {
      lastPianoDetectedTimeRef.current = currentTime;
    } else {
      lastSilenceDetectedTimeRef.current = currentTime;
    }

    // State transitions based on time
    const timeSinceLastPiano = currentTime - lastPianoDetectedTimeRef.current;

    if (!isActuallyPlayingRef.current) {
      // Turn ON: 피아노 소리가 감지되면 즉시
      if (isPianoSound) {
        isActuallyPlayingRef.current = true;
        soundStartTimeRef.current = currentTime;
      }
    } else {
      // Turn OFF: 피아노 소리가 없어진 지 충분히 오래됨 (800ms - 피아노 서스테인 고려)
      if (!isPianoSound && timeSinceLastPiano >= 800) {
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
  }, [calculateDecibel, isSoundPlaying, isPianoLikeSound]);

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
