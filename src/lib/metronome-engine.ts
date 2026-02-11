/**
 * MetronomeEngine - WebAudio-based precise metronome scheduler
 *
 * Features:
 * - High-precision timing using AudioContext scheduler
 * - Lookahead scheduling to prevent timing drift
 * - Soft sine wave tones to minimize mic interference
 * - Accent on first beat of each bar
 * - Time signature support (4/4, 3/4, 6/8, etc.)
 * - Subdivision support (1, 2, 3, 4)
 */

export type TimeSignature = "4/4" | "3/4" | "6/8" | "5/8" | "7/8" | "2/4";

export interface MetronomeState {
  isPlaying: boolean;
  tempo: number;
  timeSignature: TimeSignature;
  subdivision: number;
  currentBeat: number;
  volume: number;
}

export interface MetronomeCallbacks {
  onBeat?: (beatNumber: number, isAccent: boolean, timestamp: number) => void;
  onStateChange?: (state: MetronomeState) => void;
}

// Beat timestamps for audio masking in detection
export interface BeatTimestamp {
  time: number; // AudioContext time
  wallTime: number; // Date.now() time
  isAccent: boolean;
}

class MetronomeEngine {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;

  // Scheduler settings
  private readonly lookahead = 25.0; // ms - how often to call scheduler
  private readonly scheduleAheadTime = 0.1; // seconds - how far ahead to schedule

  // State
  private _state: MetronomeState = {
    isPlaying: false,
    tempo: 120,
    timeSignature: "4/4",
    subdivision: 1,
    currentBeat: 0,
    volume: 0.5,
  };

  // Timing
  private nextNoteTime = 0.0;
  private currentBeatInBar = 0;
  private currentSubdivision = 0;
  private timerID: number | null = null;

  // Beat timestamps for audio detection masking
  private _beatTimestamps: BeatTimestamp[] = [];
  private readonly maxBeatHistory = 50; // Keep last 50 beats

  // Callbacks
  private callbacks: MetronomeCallbacks = {};

  // Tone parameters - soft sine waves to minimize mic pickup
  private readonly accentFreq = 880; // A5 - higher pitch for accent
  private readonly normalFreq = 660; // E5 - lower pitch for regular beats
  private readonly subdivisionFreq = 440; // A4 - even lower for subdivisions
  private readonly accentDuration = 0.025; // 25ms
  private readonly normalDuration = 0.020; // 20ms
  private readonly subdivisionDuration = 0.015; // 15ms

  get state(): MetronomeState {
    return { ...this._state };
  }

  get beatTimestamps(): BeatTimestamp[] {
    return [...this._beatTimestamps];
  }

  /**
   * Initialize the audio context (must be called after user interaction)
   */
  async init(): Promise<void> {
    if (this.audioContext) return;

    this.audioContext = new AudioContext();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
    this.gainNode.gain.value = this._state.volume;

    // Resume if suspended (browser policy)
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
  }

  /**
   * Set callbacks for beat events
   */
  setCallbacks(callbacks: MetronomeCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Get beats per bar based on time signature
   */
  private getBeatsPerBar(): number {
    switch (this._state.timeSignature) {
      case "2/4": return 2;
      case "3/4": return 3;
      case "4/4": return 4;
      case "5/8": return 5;
      case "6/8": return 6;
      case "7/8": return 7;
      default: return 4;
    }
  }

  /**
   * Calculate note duration in seconds
   */
  private getNoteDuration(): number {
    const secondsPerBeat = 60.0 / this._state.tempo;
    // For compound time signatures (6/8), adjust
    if (this._state.timeSignature === "6/8") {
      return secondsPerBeat / 2; // Eighth note feel
    }
    return secondsPerBeat / this._state.subdivision;
  }

  /**
   * Schedule a single note/click
   */
  private scheduleNote(time: number, isAccent: boolean, isSubdivision: boolean): void {
    if (!this.audioContext || !this.gainNode) return;

    // Create oscillator for tone
    const osc = this.audioContext.createOscillator();
    const noteGain = this.audioContext.createGain();

    osc.connect(noteGain);
    noteGain.connect(this.gainNode);

    // Choose frequency and duration based on note type
    let freq: number;
    let duration: number;
    let volumeMultiplier: number;

    if (isSubdivision) {
      freq = this.subdivisionFreq;
      duration = this.subdivisionDuration;
      volumeMultiplier = 0.4; // Quieter for subdivisions
    } else if (isAccent) {
      freq = this.accentFreq;
      duration = this.accentDuration;
      volumeMultiplier = 1.0;
    } else {
      freq = this.normalFreq;
      duration = this.normalDuration;
      volumeMultiplier = 0.7;
    }

    osc.frequency.value = freq;
    osc.type = "sine"; // Soft sine wave - minimal harmonics for less mic interference

    // Envelope: quick attack, quick decay
    const attackTime = 0.002; // 2ms attack
    noteGain.gain.setValueAtTime(0, time);
    noteGain.gain.linearRampToValueAtTime(volumeMultiplier, time + attackTime);
    noteGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.start(time);
    osc.stop(time + duration + 0.01);

    // Record beat timestamp for audio masking
    const wallTime = Date.now() + (time - this.audioContext.currentTime) * 1000;
    this._beatTimestamps.push({
      time,
      wallTime,
      isAccent,
    });

    // Trim old timestamps
    if (this._beatTimestamps.length > this.maxBeatHistory) {
      this._beatTimestamps = this._beatTimestamps.slice(-this.maxBeatHistory);
    }

    // Trigger callback
    if (!isSubdivision && this.callbacks.onBeat) {
      // Schedule callback close to actual beat time
      const delay = Math.max(0, (time - this.audioContext.currentTime) * 1000);
      setTimeout(() => {
        this.callbacks.onBeat?.(this.currentBeatInBar + 1, isAccent, wallTime);
      }, delay);
    }
  }

  /**
   * Advance to next note and schedule it
   */
  private nextNote(): void {
    const noteDuration = this.getNoteDuration();
    this.nextNoteTime += noteDuration;

    this.currentSubdivision++;

    if (this.currentSubdivision >= this._state.subdivision) {
      this.currentSubdivision = 0;
      this.currentBeatInBar++;

      if (this.currentBeatInBar >= this.getBeatsPerBar()) {
        this.currentBeatInBar = 0;
      }
    }

    this._state.currentBeat = this.currentBeatInBar;
    this.callbacks.onStateChange?.(this.state);
  }

  /**
   * Main scheduler loop
   */
  private scheduler(): void {
    if (!this.audioContext || !this._state.isPlaying) return;

    // Schedule all notes that need to play before the next interval
    while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      const isMainBeat = this.currentSubdivision === 0;
      const isAccent = isMainBeat && this.currentBeatInBar === 0;
      const isSubdivision = !isMainBeat;

      this.scheduleNote(this.nextNoteTime, isAccent, isSubdivision);
      this.nextNote();
    }

    // Schedule next check
    this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
  }

  /**
   * Start the metronome
   */
  async start(): Promise<void> {
    if (this._state.isPlaying) return;

    await this.init();
    if (!this.audioContext) return;

    this._state.isPlaying = true;
    this.currentBeatInBar = 0;
    this.currentSubdivision = 0;
    this.nextNoteTime = this.audioContext.currentTime + 0.05; // Small delay before first beat

    this.callbacks.onStateChange?.(this.state);
    this.scheduler();
  }

  /**
   * Stop the metronome
   */
  stop(): void {
    if (!this._state.isPlaying) return;

    this._state.isPlaying = false;
    this._state.currentBeat = 0;

    if (this.timerID !== null) {
      clearTimeout(this.timerID);
      this.timerID = null;
    }

    this.callbacks.onStateChange?.(this.state);
  }

  /**
   * Toggle play/stop
   */
  async toggle(): Promise<void> {
    if (this._state.isPlaying) {
      this.stop();
    } else {
      await this.start();
    }
  }

  /**
   * Set tempo (BPM)
   */
  setTempo(tempo: number): void {
    this._state.tempo = Math.max(20, Math.min(240, tempo));
    this.callbacks.onStateChange?.(this.state);
  }

  /**
   * Set time signature
   */
  setTimeSignature(timeSignature: TimeSignature): void {
    this._state.timeSignature = timeSignature;
    // Reset beat counter when changing time signature
    if (this.currentBeatInBar >= this.getBeatsPerBar()) {
      this.currentBeatInBar = 0;
    }
    this.callbacks.onStateChange?.(this.state);
  }

  /**
   * Set subdivision (1, 2, 3, 4)
   */
  setSubdivision(subdivision: number): void {
    this._state.subdivision = Math.max(1, Math.min(4, subdivision));
    this.currentSubdivision = 0;
    this.callbacks.onStateChange?.(this.state);
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    this._state.volume = Math.max(0, Math.min(1, volume));
    if (this.gainNode) {
      this.gainNode.gain.value = this._state.volume;
    }
    this.callbacks.onStateChange?.(this.state);
  }

  /**
   * Get recent beat timestamps for audio masking
   * @param windowMs - Time window in milliseconds to look back
   */
  getRecentBeatTimestamps(windowMs: number = 1000): BeatTimestamp[] {
    const now = Date.now();
    const cutoff = now - windowMs;
    return this._beatTimestamps.filter(bt => bt.wallTime >= cutoff);
  }

  /**
   * Check if a given wall time is near a beat (for masking)
   * @param wallTime - Wall clock time to check
   * @param toleranceMs - Tolerance in milliseconds (default 25ms)
   */
  isNearBeat(wallTime: number, toleranceMs: number = 25): boolean {
    return this._beatTimestamps.some(bt =>
      Math.abs(bt.wallTime - wallTime) <= toleranceMs
    );
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
    }
    this.audioContext = null;
    this.gainNode = null;
    this._beatTimestamps = [];
  }
}

// Singleton instance
export const metronomeEngine = new MetronomeEngine();

// Export class for testing
export { MetronomeEngine };
