/**
 * 사용자 행동 추적 (앱 진입, 로그인, 연습 등)
 * Supabase user_events 테이블에 기록
 */

export type EventType =
  | "app_open"        // 앱 진입
  | "login"           // 로그인 완료
  | "signup"          // 회원가입 완료
  | "practice_start"  // 연습 시작
  | "practice_end"    // 연습 종료
  | "analysis_request" // AI 분석 요청
  | "feedback_request" // 피드백 요청
  | "page_view";      // 페이지 조회

interface TrackEventParams {
  event: EventType;
  userId?: string;
  properties?: Record<string, unknown>;
}

export async function trackEvent({ event, userId, properties }: TrackEventParams): Promise<void> {
  try {
    const uid = userId || (typeof window !== "undefined" ? localStorage.getItem("sempre-user-id") || localStorage.getItem("grit-on-user-id") : null);

    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        userId: uid,
        properties,
        timestamp: new Date().toISOString(),
        // 기기 정보
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        platform: typeof navigator !== "undefined" ? (navigator as any).userAgentData?.platform : undefined,
        standalone: typeof window !== "undefined" ? (window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true) : false,
      }),
    }).catch(() => {}); // fire-and-forget
  } catch {
    // 추적 실패해도 앱 동작에 영향 없음
  }
}
