/**
 * 사용자 행동 추적 (앱 진입, 로그인, 연습 등)
 * /api/analytics/track 경유 → Supabase user_events 테이블 저장
 *
 * 모든 유저(Free/Pro)에게 적용 — 내부 분석용 데이터 수집
 * Pro 기능 제한과 무관 (추적은 서비스 운영에 필수)
 */

import { z } from "zod";

export const EventTypeEnum = z.enum([
  "app_open",
  "login",
  "signup",
  "practice_start",
  "practice_end",
  "analysis_request",
  "feedback_request",
  "page_view",
]);

export type EventType = z.infer<typeof EventTypeEnum>;

const TrackEventSchema = z.object({
  event: EventTypeEnum,
  userId: z.string().optional(),
  properties: z.record(z.unknown()).optional(),
});

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
    // 유효성 검사
    const parsed = TrackEventSchema.safeParse(params);
    if (!parsed.success) {
      console.warn("[analytics] 유효하지 않은 이벤트:", parsed.error.message);
      return;
    }

    const uid = params.userId
      || (typeof window !== "undefined"
        ? localStorage.getItem("sempre-user-id") || localStorage.getItem("grit-on-user-id")
        : null);

    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: params.event,
        userId: uid,
        properties: params.properties,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        platform: typeof navigator !== "undefined" ? (navigator as any).userAgentData?.platform : undefined,
        standalone: typeof window !== "undefined"
          ? (window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true)
          : false,
      }),
    }).catch(() => {}); // fire-and-forget
  } catch {
    // 추적 실패해도 앱 동작에 영향 없음
  }
}
