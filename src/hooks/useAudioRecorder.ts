"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// Types for audio classification (inline to avoid import issues)
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
  // New: Audio classification label
  audioLabel: AudioLabel | null;
  classificationConfidence: number;
  // Frequency band levels for waveform visualization (0-100)
  frequencyBands: number[];
}

interface UseAudioRecorderOptions {
  decibelThreshold?: number;
  minSoundDuration?: number;
  calibrationDuration?: number;
  // New: Metronome integration options
  metronomeActive?: boolean;
  getBeatTimestamps?: () => BeatTimestamp[];
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}) {
  const {
    decibelThreshold = 50,
    minSoundDuration = 200,
    calibrationDuration = 1000,
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

  // Store metronome options in refs to avoid closure issues
  const metronomeActiveRef = useRef(metronomeActive);
  const getBeatTimestampsRef = useRef(getBeatTimestamps);

  // Update refs when options change
  useEffect(() => {
    metronomeActiveRef.current = metronomeActive;
    getBeatTimestampsRef.current = getBeatTimestamps;
  }, [metronomeActive, getBeatTimestamps]);

  // Refs for audio handling
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Refs for state tracking
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

  // Time-based hysteresis refs
  const lastPianoDetectedTimeRef = useRef<number>(0);
  const lastSilenceDetectedTimeRef = useRef<number>(0);
  const debugCounterRef = useRef<number>(0);
  const PIANO_ON_DELAY_MS = 30;
  const PIANO_OFF_DELAY_MS = 1000;

  // Practice time tracking with hysteresis
  const cumulativePianoMsRef = useRef(0);
  const lastVoiceTimeRef = useRef(0);
  const PIANO_ON_THRESHOLD_MS = 1500; // 1.5s of piano to start counting
  const VOICE_STOP_THRESHOLD_MS = 2000; // 2s of voice stops counting
  const MIN_CONFIDENCE = 0.70;

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

  // Calculate RMS and convert to decibel
  const calculateDecibel = useCallback((dataArray: Uint8Array): number => {
    let sumSquares = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const amplitude = (dataArray[i] - 128) / 128;
      sumSquares += amplitude * amplitude;
    }
    const rms = Math.sqrt(sumSquares / dataArray.length);

    if (rms === 0) return 0;
    const decibel = 20 * Math.log10(rms) + 90;
    return Math.max(0, Math.min(120, decibel));
  }, []);

  // Analyze audio with metronome-aware classification
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !isRecordingRef.current || isPausedRef.current) {
      if (isRecordingRef.current && !isPausedRef.current) {
        animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      }
      return;
    }

    const analyser = analyserRef.current;
    const sampleRate = audioContextRef.current?.sampleRate || 44100;

    // Get audio data
    const timeData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(timeData);

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

    // Noise floor calibration phase
    if (!isCalibrationCompleteRef.current) {
      calibrationSamplesRef.current.push(decibel);

      if (calibrationSamplesRef.current.length >= 60) {
        const sortedSamples = [...calibrationSamplesRef.current].sort((a, b) => a - b);
        // Use median (50th percentile) instead of 90th to avoid inflating noise floor
        // Phone AGC compresses dynamic range, so we need a tighter baseline
        const medianIndex = Math.floor(sortedSamples.length * 0.5);
        noiseFloorDecibelRef.current = sortedSamples[medianIndex] + 2;
        console.log('[AudioClassifier] Calibration complete:', {
          median: sortedSamples[medianIndex],
          p90: sortedSamples[Math.floor(sortedSamples.length * 0.9)],
          noiseFloor: noiseFloorDecibelRef.current,
          samples: sortedSamples.slice(0, 5).concat(['...'] as any, sortedSamples.slice(-5)),
        });
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

    // Get beat timestamps if metronome is active
    const beatTimestamps = metronomeActiveRef.current
      ? getBeatTimestampsRef.current()
      : [];

    // Simple inline audio classification
    // Check if near a metronome beat (mask it)
    const isNearBeat = beatTimestamps.some(
      (bt) => Math.abs(bt.wallTime - currentTime) <= 30
    );

    // Calculate frequency band energies for classification
    // Voice: 85-300 Hz fundamental, 300-3400 Hz formants
    // Piano: Wide range 27-4200 Hz with strong harmonics extending higher
    const binCount = frequencyData.length;
    const nyquist = sampleRate / 2;
    const binWidth = nyquist / binCount;

    let subBassEnergy = 0;    // < 100 Hz (piano low notes)
    let bassEnergy = 0;       // 100-300 Hz (voice fundamental, piano)
    let lowMidEnergy = 0;     // 300-1000 Hz (voice formants)
    let midEnergy = 0;        // 1000-2500 Hz (voice clarity, piano harmonics)
    let highMidEnergy = 0;    // 2500-4000 Hz (piano brightness)
    let highEnergy = 0;       // 4000-8000 Hz (piano attack, overtones)
    let veryHighEnergy = 0;   // > 8000 Hz (piano shimmer)

    for (let i = 0; i < binCount; i++) {
      const freq = i * binWidth;
      const val = frequencyData[i];
      if (freq < 100) subBassEnergy += val;
      else if (freq < 300) bassEnergy += val;
      else if (freq < 1000) lowMidEnergy += val;
      else if (freq < 2500) midEnergy += val;
      else if (freq < 4000) highMidEnergy += val;
      else if (freq < 8000) highEnergy += val;
      else veryHighEnergy += val;
    }

    const totalEnergy = subBassEnergy + bassEnergy + lowMidEnergy + midEnergy + highMidEnergy + highEnergy + veryHighEnergy;

    // Voice characteristics:
    // - Most energy in 300-3400 Hz range (formants)
    // - Less energy in very high frequencies (>4000 Hz)
    const voiceRange = lowMidEnergy + midEnergy;
    const voiceRatio = totalEnergy > 0 ? voiceRange / totalEnergy : 0;

    // Piano characteristics:
    // - Significant energy in higher frequencies (>2500 Hz)
    // - Broader spectral distribution
    // - More energy in sub-bass and very high simultaneously
    const pianoHighRange = highMidEnergy + highEnergy + veryHighEnergy;
    const pianoHighRatio = totalEnergy > 0 ? pianoHighRange / totalEnergy : 0;
    const hasSubBass = subBassEnergy > 30;
    const hasBrightness = (highEnergy + veryHighEnergy) > 50;

    // Spectral spread (piano has wider spread)
    const spectralCentroid = totalEnergy > 0
      ? (subBassEnergy * 50 + bassEnergy * 200 + lowMidEnergy * 650 + midEnergy * 1750 +
         highMidEnergy * 3250 + highEnergy * 6000 + veryHighEnergy * 10000) / totalEnergy
      : 0;

    // Classify based on features
    // Use calibrated noise floor for silence detection (decibel-based, not raw energy)
    const noiseFloorDb = noiseFloorDecibelRef.current;
    const silenceMargin = 1; // dB above noise floor still counts as silence
    const soundMargin = 4;   // dB above noise floor needed for confident classification

    let label: AudioLabel = "SILENCE";
    let confidence = 0.5;

    // Debug: log every 30 frames (~1 per second)
    if (!debugCounterRef.current) debugCounterRef.current = 0;
    debugCounterRef.current++;
    const shouldLog = debugCounterRef.current % 30 === 0;

    if (!isCalibrationCompleteRef.current || decibel <= noiseFloorDb + silenceMargin) {
      // Below or near noise floor → silence
      label = "SILENCE";
      confidence = 0.95;
    } else if (metronomeActiveRef.current && isNearBeat && decibel < noiseFloorDb + soundMargin) {
      label = "METRONOME_ONLY";
      confidence = 0.85;
    } else if (decibel < noiseFloorDb + soundMargin) {
      // Slightly above noise floor — check if it looks like quiet speech
      // Quiet speech still has energy concentrated in voice range
      if (voiceRatio > 0.45 && pianoHighRatio < 0.30 && spectralCentroid < 2500) {
        label = "VOICE";
        confidence = 0.65;
      } else {
        label = "NOISE";
        confidence = 0.6;
      }
    } else {
      // Clearly above noise floor → classify based on spectral features
      // Voice detection (relaxed):
      // - Energy concentrated in voice range (300-2500 Hz)
      // - Limited but not zero high frequency energy (speech has sibilants)
      // - Spectral centroid typically 300-2500 Hz
      const isVoiceLike = voiceRatio > 0.45 && pianoHighRatio < 0.30 && spectralCentroid < 2500;

      // Piano detection:
      // - Significant high frequency content
      // - Broader spectral spread (higher centroid)
      // - Requires substantial energy above noise floor
      const isLoud = decibel > noiseFloorDb + 15;
      const isPianoLike = isLoud && (
        (pianoHighRatio > 0.22 && spectralCentroid > 1800) ||
        (hasSubBass && hasBrightness && totalEnergy > 500) ||
        (spectralCentroid > 3000 && totalEnergy > 300)
      );

      if (isVoiceLike && !isPianoLike) {
        label = "VOICE";
        confidence = 0.80;
      } else if (isPianoLike && !isVoiceLike) {
        label = "PIANO_PLAYING";
        confidence = 0.85;
      } else if (isPianoLike && isVoiceLike) {
        // Ambiguous - use spectral centroid as tiebreaker
        if (spectralCentroid > 2200 || pianoHighRatio > 0.28) {
          label = "PIANO_PLAYING";
          confidence = 0.65;
        } else {
          label = "VOICE";
          confidence = 0.65;
        }
      } else {
        // Neither clearly voice nor piano
        label = "NOISE";
        confidence = 0.6;
      }
    }

    if (shouldLog) {
      console.log('[AudioClassifier]', {
        label, confidence: confidence.toFixed(2),
        dB: decibel.toFixed(1), noiseFloor: noiseFloorDb.toFixed(1),
        delta: (decibel - noiseFloorDb).toFixed(1),
        voiceRatio: voiceRatio.toFixed(2), pianoHighRatio: pianoHighRatio.toFixed(2),
        centroid: spectralCentroid.toFixed(0), totalEnergy: totalEnergy.toFixed(0),
      });
    }

    // Update piano detection state based on classification
    const isPianoSound = label === "PIANO_PLAYING" && confidence >= MIN_CONFIDENCE;

    // Time-based hysteresis for smooth transitions
    if (isPianoSound) {
      lastPianoDetectedTimeRef.current = currentTime;
      cumulativePianoMsRef.current += 16; // Approximate frame time
    } else if (label === "VOICE" && confidence >= MIN_CONFIDENCE) {
      lastVoiceTimeRef.current = currentTime;
    }

    const timeSinceLastPiano = currentTime - lastPianoDetectedTimeRef.current;

    // State machine for piano detection
    if (!isActuallyPlayingRef.current) {
      // Turn ON after sufficient cumulative piano time
      if (isPianoSound && cumulativePianoMsRef.current >= PIANO_ON_THRESHOLD_MS) {
        isActuallyPlayingRef.current = true;
        soundStartTimeRef.current = currentTime;
      }
    } else {
      // Turn OFF conditions:
      // 1. No piano for too long
      // 2. Voice detected for too long
      const shouldTurnOff =
        (!isPianoSound && timeSinceLastPiano >= PIANO_OFF_DELAY_MS) ||
        (label === "VOICE" && currentTime - lastPianoDetectedTimeRef.current > VOICE_STOP_THRESHOLD_MS);

      if (shouldTurnOff) {
        isActuallyPlayingRef.current = false;
        soundStartTimeRef.current = null;
        cumulativePianoMsRef.current = 0;
      }
    }

    // Determine if sound is detected (for UI)
    const isSoundDetected = decibel > noiseFloorDecibelRef.current;
    const isPianoPlaying = isActuallyPlayingRef.current;

    // Calculate frequency bands for waveform visualization (20 bands)
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
      const avg = sum / binsPerBand;
      bands.push(Math.min(100, (avg / 255) * 150));
    }

    setState((prev) => ({
      ...prev,
      currentVolume: peakVolume,
      currentDecibel: Math.round(decibel),
      isSoundDetected,
      isPianoDetected: isPianoPlaying,
      audioLabel: label,
      classificationConfidence: confidence,
      frequencyBands: bands,
    }));

    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  }, [calculateDecibel]);

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

      // Reset state
      isRecordingRef.current = true;
      isPausedRef.current = false;
      isActuallyPlayingRef.current = false;
      soundStartTimeRef.current = null;
      lastSoundTimeRef.current = 0;
      cumulativePianoMsRef.current = 0;
      lastVoiceTimeRef.current = 0;

      // Reset calibration
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
        // Only count time when actually playing
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

      // Start audio analysis
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "녹음을 시작할 수 없습니다";
      setState((prev) => ({ ...prev, error: errorMessage }));
    }
  }, [requestPermission, analyzeAudio]);

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

      // Reset hysteresis refs
      lastSilenceDetectedTimeRef.current = Date.now();
      lastPianoDetectedTimeRef.current = 0;
      cumulativePianoMsRef.current = 0;

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
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
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
        audioLabel: null,
        classificationConfidence: 0,
      };
    });
    chunksRef.current = [];
    calibrationSamplesRef.current = [];
    isCalibrationCompleteRef.current = false;
    cumulativePianoMsRef.current = 0;
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
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
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
