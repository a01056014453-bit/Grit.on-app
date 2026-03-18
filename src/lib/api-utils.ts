import { NextRequest, NextResponse } from "next/server";

/** 요청자 식별키 추출 (IP 기반) */
export function getClientIdentifier(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

/** Rate Limit 초과 시 429 응답 */
export function rateLimitResponse(
  resetAt: number,
  message?: string
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message ?? "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
        "X-RateLimit-Reset": String(resetAt),
      },
    }
  );
}
