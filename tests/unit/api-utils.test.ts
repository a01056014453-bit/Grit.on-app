import { describe, it, expect } from "vitest";
import { rateLimitResponse } from "@/lib/api-utils";

describe("rateLimitResponse", () => {
  it("429 상태 코드 반환", () => {
    const response = rateLimitResponse(Date.now() + 60_000);
    expect(response.status).toBe(429);
  });

  it("기본 에러 메시지 포함", async () => {
    const response = rateLimitResponse(Date.now() + 60_000);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("요청이 너무 많습니다");
  });

  it("커스텀 메시지 사용", async () => {
    const response = rateLimitResponse(Date.now() + 60_000, "커스텀 메시지");
    const body = await response.json();
    expect(body.error).toBe("커스텀 메시지");
  });

  it("Retry-After 헤더 포함", () => {
    const resetAt = Date.now() + 30_000;
    const response = rateLimitResponse(resetAt);
    const retryAfter = response.headers.get("Retry-After");
    expect(retryAfter).toBeDefined();
    expect(Number(retryAfter)).toBeGreaterThan(0);
    expect(Number(retryAfter)).toBeLessThanOrEqual(30);
  });

  it("X-RateLimit-Reset 헤더 포함", () => {
    const resetAt = Date.now() + 60_000;
    const response = rateLimitResponse(resetAt);
    const resetHeader = response.headers.get("X-RateLimit-Reset");
    expect(resetHeader).toBe(String(resetAt));
  });
});
