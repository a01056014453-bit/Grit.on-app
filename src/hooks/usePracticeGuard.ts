"use client";

/**
 * 연습 세션 보호 — 전역 상태
 * 녹음 중일 때 네비게이션을 차단하고 확인 대화상자를 표시
 *
 * 호출 순서:
 * 1. practice/page.tsx에서 isRecording 변경 시 setPracticeRecording(true/false) 호출
 * 2. BottomNavigation에서 subscribePracticeState로 상태 구독
 * 3. 사용자가 다른 탭 클릭 → guardNavigation → 확인 → navigate 콜백 실행
 *
 * _onStopCallback은 practice/page.tsx의 stopRecording을 참조하며,
 * guardNavigation 내에서 navigate() 호출 전에 실행되어 세션을 저장합니다.
 */

let _isRecording = false;
let _onStopCallback: (() => void) | null = null;
const _listeners = new Set<() => void>();

function notifyListeners(): void {
  _listeners.forEach((fn) => {
    try { fn(); } catch { /* 리스너 에러 무시 */ }
  });
}

/**
 * 연습 중 상태 설정 (practice/page.tsx에서 호출)
 * @param recording - 현재 녹음 중 여부
 * @param onStop - 녹음 중단 시 호출할 콜백 (세션 저장 등). recording=false일 때는 무시됨.
 */
export function setPracticeRecording(recording: boolean, onStop?: () => void): void {
  _isRecording = recording;
  _onStopCallback = recording && onStop ? onStop : null;
  notifyListeners();
}

/** 현재 연습 중인지 확인 */
export function isPracticeRecording(): boolean {
  return _isRecording;
}

/**
 * 네비게이션 시도 시 호출 — 연습 중이면 확인 후 이동
 * @param href - 이동할 경로 (로깅용)
 * @param navigate - 실제 이동 함수 (router.push 등)
 * @returns true=이동 진행, false=이동 취소
 */
export function guardNavigation(href: string, navigate: () => void): boolean {
  if (!_isRecording) {
    try { navigate(); } catch (err) { console.error("[practiceGuard] navigate 실패:", err); }
    return true;
  }

  const confirmed = window.confirm(
    "연습 중입니다.\n연습을 중단하고 이동하시겠습니까?\n\n현재까지의 연습 기록은 자동 저장됩니다."
  );

  if (confirmed) {
    // 1. 세션 저장 콜백 실행
    if (_onStopCallback) {
      try { _onStopCallback(); } catch (err) { console.error("[practiceGuard] onStop 실패:", err); }
    }

    // 2. 상태 초기화
    _isRecording = false;
    _onStopCallback = null;
    notifyListeners();

    // 3. 딜레이 후 이동 (세션 저장 시간 확보)
    setTimeout(() => {
      try { navigate(); } catch (err) { console.error("[practiceGuard] navigate 실패:", err); }
    }, 100);
    return true;
  }

  return false;
}

/** 상태 변경 구독 (BottomNavigation에서 사용) */
export function subscribePracticeState(fn: () => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}
