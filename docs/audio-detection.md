# 오디오 감지 로직 (순연습시간 측정)

> CLAUDE.md에서 @import. 핵심 파일: `src/hooks/useAudioRecorder.ts`
> 관련 모듈: `src/lib/audio-classifier.ts`(YAMNet 분류), `src/lib/audio-proximity.ts`(재생 음원/녹음 감지), `src/lib/pitch-detector.ts`(피치 검출)

## 소리 감지

- FFT 크기: **4096**
- 노이즈 플로어는 고정값이 아니라 **적응형** — 최근 10개 비연주 클립의 dB 평균(`NOISE_HISTORY_SIZE`)으로 계산, **30초마다 재캘리브레이션**(`NOISE_RECALIBRATION_INTERVAL_MS`)
- 연주 감지 임계값 = `노이즈 플로어 + 3dB`
- dB 계산: `20 * log10(rms) + 90` (0~120 범위로 클램프)

## 카운팅 시작/중단 (히스테리시스)

- 악기 소리가 **800ms**(`PIANO_ON_THRESHOLD_MS`) 이상 지속되어야 순연습시간 카운팅 시작
- 소리가 끊긴 후 **7000ms**(`PIANO_OFF_DELAY_MS`) 지나야 카운팅 중단 (짧은 쉼은 무시)
- 목소리(대화) 감지 시 **2500ms**(`VOICE_SUPPRESS_MS`) 동안 카운팅 억제

## 클립 분류 (YAMNet)

- **3초마다**(`CLASSIFY_INTERVAL_MS`) 클립 단위로 `classifyAudioClip` 호출 — 악기 소리 vs 잡음/목소리 분류
- 분류 신뢰도 임계값: **0.55**(`MIN_CONFIDENCE`) 미만이면 무시
- YAMNet 분류 사이 구간은 dB 기반 간이 판별로 보간(부드러운 타이머 갱신)

## 파생 지표

- 집중도(%) = 순연습시간 / 전체 경과시간

## 캘리브레이션

- 녹음 시작 시 ~2초(60fps × 2, `CALIBRATION_SAMPLES`) 동안 노이즈 플로어 캘리브레이션, 첫 0.5초(`CALIBRATION_SKIP`)는 마이크 초기화로 스킵, 이후 3초 카운트다운(`COUNTDOWN_SECONDS`) 후 측정 시작
