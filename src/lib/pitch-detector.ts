/**
 * 자기상관(Autocorrelation) 기반 피치 감지
 *
 * 성악 연습: 지속적 피치 + 안정적 주파수 → "singing"
 * 대화: 불규칙 피치 + 짧은 지속시간 → "speech"
 */

export interface PitchResult {
  frequency: number;   // Hz (0이면 피치 없음)
  confidence: number;  // 0~1
}

/**
 * 시간 영역 데이터에서 피치를 감지
 *
 * @param timeData - AnalyserNode.getFloatTimeDomainData() 또는 Float32Array
 * @param sampleRate - 샘플레이트 (보통 44100)
 * @returns 피치 결과 (frequency=0이면 피치 미감지)
 */
export function detectPitch(
  timeData: Float32Array,
  sampleRate: number,
): PitchResult {
  const bufferSize = timeData.length;
  const halfSize = Math.floor(bufferSize / 2);

  // 인간 음성/악기 범위: 60Hz ~ 2000Hz
  const minLag = Math.floor(sampleRate / 2000); // 2000Hz 상한
  const maxLag = Math.floor(sampleRate / 60);   // 60Hz 하한

  if (maxLag >= halfSize) {
    return { frequency: 0, confidence: 0 };
  }

  // RMS 체크: 너무 조용하면 피치 없음
  let rms = 0;
  for (let i = 0; i < bufferSize; i++) {
    rms += timeData[i] * timeData[i];
  }
  rms = Math.sqrt(rms / bufferSize);
  if (rms < 0.01) return { frequency: 0, confidence: 0 };

  // 자기상관 계산
  let bestLag = 0;
  let bestCorr = -1;

  for (let lag = minLag; lag < maxLag && lag < halfSize; lag++) {
    let correlation = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < halfSize; i++) {
      correlation += timeData[i] * timeData[i + lag];
      norm1 += timeData[i] * timeData[i];
      norm2 += timeData[i + lag] * timeData[i + lag];
    }

    const normalizedCorr = correlation / (Math.sqrt(norm1 * norm2) + 1e-10);

    if (normalizedCorr > bestCorr) {
      bestCorr = normalizedCorr;
      bestLag = lag;
    }
  }

  if (bestCorr < 0.6 || bestLag === 0) {
    return { frequency: 0, confidence: 0 };
  }

  return {
    frequency: sampleRate / bestLag,
    confidence: bestCorr,
  };
}

/**
 * 여러 프레임의 피치 결과를 분석하여 "노래" vs "말하기" 판별
 *
 * @param pitchHistory - 최근 N개 프레임의 피치 결과
 * @returns "singing" (안정적 피치, 음악적), "speech" (불안정), "none" (피치 없음)
 */
export function analyzePitchPattern(
  pitchHistory: PitchResult[],
): "singing" | "speech" | "none" {
  const validPitches = pitchHistory.filter((p) => p.frequency > 0 && p.confidence > 0.6);

  // 피치 감지율이 50% 미만이면 "none"
  if (validPitches.length < pitchHistory.length * 0.5) {
    return "none";
  }

  const frequencies = validPitches.map((p) => p.frequency);

  // 피치 안정성: 연속된 피치 간 변화량
  let totalVariation = 0;
  for (let i = 1; i < frequencies.length; i++) {
    // 센트(cents) 단위 변화량 계산
    const cents = Math.abs(1200 * Math.log2(frequencies[i] / frequencies[i - 1]));
    totalVariation += cents;
  }
  const avgVariation = frequencies.length > 1 ? totalVariation / (frequencies.length - 1) : 0;

  // 노래: 피치 변화가 음악적 (반음=100 cents 이내의 단계적 변화)
  // 대화: 피치 변화가 불규칙 (200 cents 이상 빈번)
  // 평균 변화량 < 150 cents → singing
  // 평균 변화량 > 300 cents → speech

  if (avgVariation < 150) return "singing";
  if (avgVariation > 300) return "speech";

  // 중간 영역: 평균 피치 confidence로 추가 판별
  const avgConfidence = validPitches.reduce((a, b) => a + b.confidence, 0) / validPitches.length;
  return avgConfidence > 0.75 ? "singing" : "speech";
}
