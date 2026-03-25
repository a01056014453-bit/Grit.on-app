import { describe, it, expect, vi, afterEach } from "vitest";
import { createRateLimiter } from "@/lib/rate-limit";

describe("createRateLimiter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("제한 내 요청은 성공", () => {
    const limiter = createRateLimiter({ interval: 60_000, maxRequests: 3 });
    const result = limiter("user-1");

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("remaining이 요청마다 감소", () => {
    const limiter = createRateLimiter({ interval: 60_000, maxRequests: 3 });

    expect(limiter("user-1").remaining).toBe(2);
    expect(limiter("user-1").remaining).toBe(1);
    expect(limiter("user-1").remaining).toBe(0);
  });

  it("제한 초과 시 실패", () => {
    const limiter = createRateLimiter({ interval: 60_000, maxRequests: 2 });

    limiter("user-1");
    limiter("user-1");
    const result = limiter("user-1");

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("서로 다른 키는 독립적", () => {
    const limiter = createRateLimiter({ interval: 60_000, maxRequests: 1 });

    expect(limiter("user-1").success).toBe(true);
    expect(limiter("user-2").success).toBe(true);
    expect(limiter("user-1").success).toBe(false);
    expect(limiter("user-2").success).toBe(false);
  });

  it("윈도우 경과 후 다시 성공", () => {
    const now = 1000000;
    vi.spyOn(Date, "now").mockReturnValue(now);

    const limiter = createRateLimiter({ interval: 1000, maxRequests: 1 });

    expect(limiter("user-1").success).toBe(true);
    expect(limiter("user-1").success).toBe(false);

    // 윈도우 지남
    vi.spyOn(Date, "now").mockReturnValue(now + 1001);
    expect(limiter("user-1").success).toBe(true);
  });

  it("resetAt이 합리적인 미래 시간", () => {
    const limiter = createRateLimiter({ interval: 60_000, maxRequests: 5 });
    const result = limiter("user-1");

    expect(result.resetAt).toBeGreaterThan(Date.now() - 1000);
    expect(result.resetAt).toBeLessThanOrEqual(Date.now() + 60_000 + 1000);
  });
});
