/**
 * 사용자 행동 추적
 * /api/analytics/track 경유 → Supabase user_events 테이블 저장
 *
 * 모든 유저(Free/Pro)에게 적용 — 내부 분석용
 */

// ── 이벤트 타입 (22종) ──

export type EventType =
  // A. 유입/접속
  | "app_open"
  | "page_view"
  | "landing_view"
  | "signup_started"
  | "signup_completed"
  | "login_completed"
  // B. 연습 (핵심 퍼널)
  | "practice_start_clicked"
  | "practice_session_started"
  | "practice_session_ended"
  | "practice_abandoned"
  | "result_viewed"
  // C. AI 곡 분석
  | "analysis_request"
  | "analysis_completed"
  | "analysis_viewed"
  | "analysis_failed"
  // D. 피드백/레슨
  | "feedback_request_created"
  | "feedback_submitted"
  | "feedback_viewed"
  // E. 에러
  | "error_occurred"
  | "result_not_loaded"
  // F. 성장/리텐션
  | "streak_achieved"
  | "ranking_viewed";

// ── 세션 ID ──

let _currentSessionId: string | null = null;

/** 연습 세션 ID 생성 (practice_start_clicked 시점에 호출) */
export function generateSessionId(): string {
  const uid =
    typeof window !== "undefined"
      ? localStorage.getItem("sempre-user-id") || localStorage.getItem("grit-on-user-id") || "anon"
      : "anon";
  _currentSessionId = `sess_${uid.slice(0, 8)}_${Date.now()}`;
  return _currentSessionId;
}

/** 현재 세션 ID 반환 */
export function getSessionId(): string | null {
  return _currentSessionId;
}

/** 세션 종료 */
export function clearSessionId(): void {
  _currentSessionId = null;
}

// ── 이벤트 추적 ──

interface TrackEventParams {
  event: EventType;
  userId?: string;
  properties?: Record<string, unknown>;
}

/**
 * 이벤트 추적 (fire-and-forget)
 * 실패해도 앱 동작에 영향 없음
 */
export async function trackEvent(params: TrackEventParams): Promise<void> {
  try {
    const uid =
      params.userId ||
      (typeof window !== "undefined"
        ? localStorage.getItem("sempre-user-id") || localStorage.getItem("grit-on-user-id")
        : null);

    // session_id 자동 포함
    const properties = {
      ...params.properties,
      ...(_currentSessionId ? { session_id: _currentSessionId } : {}),
    };

    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: params.event,
        userId: uid,
        properties,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        platform: typeof navigator !== "undefined" ? (navigator as unknown as { userAgentData?: { platform: string } }).userAgentData?.platform : undefined,
        standalone:
          typeof window !== "undefined"
            ? window.matchMedia("(display-mode: standalone)").matches ||
              (navigator as unknown as { standalone?: boolean }).standalone === true
            : false,
      }),
    }).catch(() => {});
  } catch {
    // 추적 실패해도 앱 동작에 영향 없음
  }
}

/**
 * 이탈 추적용 — beforeunload + visibilitychange 핸들러
 * iOS Safari/PWA에서 beforeunload가 안 먹히므로 둘 다 등록
 */
export function trackAbandon(properties: Record<string, unknown>): () => void {
  let sent = false;

  const send = () => {
    if (sent) return;
    sent = true;
    // sendBeacon이 더 안정적 (페이지 언로드 시에도 전송 보장)
    const payload = JSON.stringify({
      event: "practice_abandoned",
      userId:
        typeof window !== "undefined"
          ? localStorage.getItem("sempre-user-id") || localStorage.getItem("grit-on-user-id")
          : null,
      properties: {
        ...properties,
        ...(_currentSessionId ? { session_id: _currentSessionId } : {}),
      },
      timestamp: new Date().toISOString(),
    });

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics/track", new Blob([payload], { type: "application/json" }));
    } else {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  };

  const handleBeforeUnload = () => send();
  const handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") send();
  };

  window.addEventListener("beforeunload", handleBeforeUnload);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  // cleanup 함수 반환
  return () => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}
