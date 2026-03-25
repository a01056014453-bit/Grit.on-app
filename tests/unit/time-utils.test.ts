import { describe, it, expect, vi, afterEach } from "vitest";
import { getRemainingTime } from "@/lib/time-utils";

describe("getRemainingTime", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("미래 마감시간: 시간 + 분 표시", () => {
    // 지금으로부터 2시간 30분 후
    const deadline = new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString();
    const result = getRemainingTime(deadline);

    expect(result.isExpired).toBe(false);
    expect(result.hours).toBe(2);
    expect(result.minutes).toBeGreaterThanOrEqual(29);
    expect(result.minutes).toBeLessThanOrEqual(30);
    expect(result.text).toContain("시간");
    expect(result.text).toContain("분 남음");
  });

  it("1시간 미만: 분만 표시", () => {
    const deadline = new Date(Date.now() + 45 * 60 * 1000).toISOString();
    const result = getRemainingTime(deadline);

    expect(result.isExpired).toBe(false);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBeGreaterThanOrEqual(44);
    expect(result.text).toMatch(/^\d+분 남음$/);
  });

  it("만료된 마감시간: isExpired true + '만료됨' 텍스트", () => {
    const deadline = new Date(Date.now() - 60 * 1000).toISOString();
    const result = getRemainingTime(deadline);

    expect(result.isExpired).toBe(true);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(0);
    expect(result.text).toBe("만료됨");
  });

  it("정확히 현재시간: 만료 처리", () => {
    // Date.now()와 동일한 시점이면 remaining <= 0
    vi.spyOn(Date, "now").mockReturnValue(1000000);
    const deadline = new Date(1000000).toISOString();
    const result = getRemainingTime(deadline);

    expect(result.isExpired).toBe(true);
    expect(result.text).toBe("만료됨");
  });
});
