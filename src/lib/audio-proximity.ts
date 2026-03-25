/**
 * 스펙트럼 게이팅: 근접/원거리 소리 판별
 *
 * 벽을 통과한 소리는 고주파 에너지가 크게 감쇠됨.
 * 고주파/저주파 비율로 근접(본인 연주) vs 원거리(옆방) 판별.
 */

export type ProximityResult = "near" | "far" | "unknown";

/**
 * 주파수 데이터로 소리의 근접도를 추정
 *
 * @param frequencyData - AnalyserNode.getByteFrequencyData() 결과
 * @param fftSize - AnalyserNode의 fftSize
 * @param sampleRate - AudioContext의 sampleRate (보통 44100)
 * @returns "near" (본인 근처), "far" (벽 너머), "unknown" (판별 불가)
 */
export function estimateProximity(
  frequencyData: Uint8Array,
  fftSize: number,
  sampleRate: number,
): ProximityResult {
  const binCount = frequencyData.length; // fftSize / 2
  const binWidth = sampleRate / fftSize; // Hz per bin

  // 저주파 대역 (100Hz ~ 2kHz): 벽 통과해도 잘 전달
  const lowStart = Math.floor(100 / binWidth);
  const lowEnd = Math.floor(2000 / binWidth);
  let lowEnergy = 0;
  for (let i = lowStart; i < lowEnd && i < binCount; i++) {
    lowEnergy += frequencyData[i];
  }

  // 고주파 대역 (4kHz ~ 10kHz): 벽 통과 시 크게 감쇠
  const highStart = Math.floor(4000 / binWidth);
  const highEnd = Math.floor(10000 / binWidth);
  let highEnergy = 0;
  for (let i = highStart; i < highEnd && i < binCount; i++) {
    highEnergy += frequencyData[i];
  }

  // 에너지가 너무 낮으면 판별 불가
  if (lowEnergy < 50) return "unknown";

  const ratio = highEnergy / lowEnergy;

  // 벽 통과 소리: 고주파 비율 매우 낮음 (< 0.05)
  // 근접 소리: 고주파 비율 높음 (> 0.12)
  if (ratio < 0.05) return "far";
  if (ratio > 0.12) return "near";
  return "unknown";
}

/**
 * 녹음된 음악(유튜브/스피커) vs 실제 연주 판별
 *
 * 녹음 음악: 프레임 간 스펙트럼이 매우 일정 (프로 마스터링)
 * 실제 연습: 멈춤, 반복, 실수 등으로 스펙트럼 변화가 불규칙
 */
const spectrumHistory: number[][] = [];
const SPECTRUM_HISTORY_SIZE = 5;

export function detectRecordedMusic(frequencyData: Uint8Array): boolean {
  const bands: number[] = [];
  const bandSize = Math.floor(frequencyData.length / 8);
  for (let b = 0; b < 8; b++) {
    let sum = 0;
    for (let i = b * bandSize; i < (b + 1) * bandSize && i < frequencyData.length; i++) {
      sum += frequencyData[i];
    }
    bands.push(sum / bandSize);
  }

  spectrumHistory.push(bands);
  if (spectrumHistory.length > SPECTRUM_HISTORY_SIZE) spectrumHistory.shift();
  if (spectrumHistory.length < 3) return false;

  let totalChange = 0;
  for (let i = 1; i < spectrumHistory.length; i++) {
    let frameChange = 0;
    for (let b = 0; b < 8; b++) {
      frameChange += Math.abs(spectrumHistory[i][b] - spectrumHistory[i - 1][b]);
    }
    totalChange += frameChange / 8;
  }
  const avgChange = totalChange / (spectrumHistory.length - 1);

  // 녹음 음악: 변화량 < 5, 실제 연습: 변화량 > 15
  return avgChange < 5;
}

export function resetSpectrumHistory(): void {
  spectrumHistory.length = 0;
}

/**
 * 악기별 주파수 범위 (기본음 범위)
 * 근접 판별 시 해당 악기의 주파수 대역에 에너지가 집중되어 있는지 확인
 */
export const INSTRUMENT_FREQ_RANGES: Record<string, { low: number; high: number }> = {
  piano: { low: 27, high: 4200 },      // A0 ~ C8
  violin: { low: 196, high: 3520 },     // G3 ~ A7
  cello: { low: 65, high: 987 },        // C2 ~ B5
  flute: { low: 262, high: 2349 },      // C4 ~ D7
  clarinet: { low: 147, high: 2093 },   // D3 ~ C7
  guitar: { low: 82, high: 1175 },      // E2 ~ D6
  vocal: { low: 80, high: 1100 },       // 남성 저음 ~ 여성 고음
};

/**
 * 해당 악기의 주파수 범위에 에너지가 집중되어 있는지 확인
 * 집중도가 높으면 본인 연주일 가능성이 높음
 */
export function checkInstrumentFocus(
  frequencyData: Uint8Array,
  fftSize: number,
  sampleRate: number,
  instrument: string,
): number {
  const range = INSTRUMENT_FREQ_RANGES[instrument];
  if (!range) return 0.5; // 알 수 없는 악기

  const binWidth = sampleRate / fftSize;
  const binCount = frequencyData.length;

  const instStart = Math.floor(range.low / binWidth);
  const instEnd = Math.min(Math.floor(range.high / binWidth), binCount - 1);

  let instEnergy = 0;
  let totalEnergy = 0;

  for (let i = 0; i < binCount; i++) {
    totalEnergy += frequencyData[i];
    if (i >= instStart && i <= instEnd) {
      instEnergy += frequencyData[i];
    }
  }

  if (totalEnergy < 50) return 0;
  return instEnergy / totalEnergy; // 0~1, 높을수록 해당 악기에 집중
}
