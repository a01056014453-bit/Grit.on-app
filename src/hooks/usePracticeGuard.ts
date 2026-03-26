"use client";

/**
 * 연습 세션 보호 — 전역 상태
 *
 * 네비게이션 시 3가지 선택지 제공:
 * 1. 일시정지하고 이동 — 세션 유지, 돌아오면 이어서
 * 2. 연습 종료 후 저장 — 세션 저장하고 이동
 * 3. 취소 — 연습 계속
 */

let _isRecording = false;
let _isPaused = false;
let _onPauseCallback: (() => void) | null = null;
let _onStopCallback: (() => void) | null = null;
const _listeners = new Set<() => void>();

function notifyListeners(): void {
  _listeners.forEach((fn) => {
    try { fn(); } catch { /* 무시 */ }
  });
}

export interface PracticeCallbacks {
  onPause?: () => void;   // 일시정지 콜백
  onStop?: () => void;    // 종료+저장 콜백
}

/** 연습 중 상태 설정 */
export function setPracticeRecording(
  recording: boolean,
  callbacks?: PracticeCallbacks,
): void {
  _isRecording = recording;
  if (recording && callbacks) {
    _onPauseCallback = callbacks.onPause ?? null;
    _onStopCallback = callbacks.onStop ?? null;
  }
  if (!recording) {
    _isPaused = false;
    _onPauseCallback = null;
    _onStopCallback = null;
  }
  notifyListeners();
}

/** 일시정지 상태 설정 */
export function setPracticePaused(paused: boolean): void {
  _isPaused = paused;
  notifyListeners();
}

export function isPracticeRecording(): boolean { return _isRecording; }
export function isPracticePaused(): boolean { return _isPaused; }

export type GuardAction = "pause" | "stop" | "cancel";

/** 네비게이션 가드 — BottomNavigation에서 모달 표시 후 action 전달 */
export function executeGuardAction(action: GuardAction, navigate: () => void): void {
  if (action === "cancel") return;

  if (action === "pause") {
    // 일시정지: 세션 유지, 상태는 recording+paused
    if (_onPauseCallback) {
      try { _onPauseCallback(); } catch (err) { console.error("[guard] pause 실패:", err); }
    }
    _isPaused = true;
    notifyListeners();
    setTimeout(() => {
      try { navigate(); } catch (err) { console.error("[guard] navigate 실패:", err); }
    }, 50);
    return;
  }

  if (action === "stop") {
    // 종료+저장: 세션 종료
    if (_onStopCallback) {
      try { _onStopCallback(); } catch (err) { console.error("[guard] stop 실패:", err); }
    }
    _isRecording = false;
    _isPaused = false;
    _onPauseCallback = null;
    _onStopCallback = null;
    notifyListeners();
    setTimeout(() => {
      try { navigate(); } catch (err) { console.error("[guard] navigate 실패:", err); }
    }, 150);
  }
}

/** 상태 변경 구독 */
export function subscribePracticeState(fn: () => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}
