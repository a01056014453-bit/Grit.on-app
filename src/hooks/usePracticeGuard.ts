"use client";

/**
 * 연습 세션 보호 — 전역 상태
 * 녹음 중일 때 네비게이션을 차단하고 확인 대화상자를 표시
 */

let _isRecording = false;
let _onStopCallback: (() => void) | null = null;
const _listeners = new Set<() => void>();

/** 연습 중 상태 설정 (practice/page.tsx에서 호출) */
export function setPracticeRecording(recording: boolean, onStop?: () => void) {
  _isRecording = recording;
  _onStopCallback = onStop ?? null;
  _listeners.forEach((fn) => fn());
}

/** 현재 연습 중인지 확인 */
export function isPracticeRecording(): boolean {
  return _isRecording;
}

/** 네비게이션 시도 시 호출 — 연습 중이면 확인 후 이동 */
export function guardNavigation(href: string, navigate: () => void): boolean {
  if (!_isRecording) {
    navigate();
    return true;
  }

  const confirmed = window.confirm(
    "연습 중입니다.\n연습을 중단하고 이동하시겠습니까?\n\n현재까지의 연습 기록은 자동 저장됩니다."
  );

  if (confirmed) {
    if (_onStopCallback) {
      _onStopCallback();
    }
    _isRecording = false;
    _listeners.forEach((fn) => fn());
    // 약간의 딜레이 후 이동 (세션 저장 시간 확보)
    setTimeout(navigate, 100);
    return true;
  }

  return false;
}

/** 상태 변경 구독 (BottomNavigation에서 사용) */
export function subscribePracticeState(fn: () => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}
