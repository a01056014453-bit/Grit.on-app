"use client";

/**
 * 연습 세션 보호 — 전역 상태
 *
 * 네비게이션 시 3가지 선택지:
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
    try { fn(); } catch { /* 리스너 에러 격리 */ }
  });
}

export interface PracticeCallbacks {
  onPause?: () => void;
  onStop?: () => void;
}

/**
 * 연습 중 상태 + 콜백 설정
 * recording과 paused를 한 번에 설정하여 레이스 컨디션 방지
 */
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

/**
 * 일시정지 상태만 변경
 * setPracticeRecording과 동일 notify 사이클에서 호출되지 않도록
 * 이미 recording=true인 상태에서만 의미가 있음
 */
export function setPracticePaused(paused: boolean): void {
  if (!_isRecording) return; // recording 중이 아니면 무시
  _isPaused = paused;
  notifyListeners();
}

export function isPracticeRecording(): boolean { return _isRecording; }
export function isPracticePaused(): boolean { return _isPaused; }

export type GuardAction = "pause" | "stop" | "cancel";

export interface GuardResult {
  success: boolean;
  error?: string;
}

/**
 * 네비게이션 가드 액션 실행
 * @returns GuardResult — 성공/실패 + 에러 메시지
 */
export function executeGuardAction(action: GuardAction, navigate: () => void): GuardResult {
  if (action === "cancel") return { success: true };

  if (action === "pause") {
    if (_onPauseCallback) {
      try {
        _onPauseCallback();
      } catch (err) {
        console.error("[guard] pause 실패:", err);
        return { success: false, error: "일시정지에 실패했습니다." };
      }
    }
    _isPaused = true;
    notifyListeners();
    setTimeout(() => {
      try { navigate(); } catch (err) { console.error("[guard] navigate 실패:", err); }
    }, 50);
    return { success: true };
  }

  if (action === "stop") {
    if (_onStopCallback) {
      try {
        _onStopCallback();
      } catch (err) {
        console.error("[guard] stop 실패:", err);
        return { success: false, error: "연습 저장에 실패했습니다." };
      }
    }
    _isRecording = false;
    _isPaused = false;
    _onPauseCallback = null;
    _onStopCallback = null;
    notifyListeners();
    setTimeout(() => {
      try { navigate(); } catch (err) { console.error("[guard] navigate 실패:", err); }
    }, 150);
    return { success: true };
  }

  return { success: false, error: "알 수 없는 액션" };
}

/** 상태 변경 구독 */
export function subscribePracticeState(fn: () => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}
