import { describe, it, expect } from "vitest";
import { formatDuration, formatTime, getMinutes } from "@/lib/format";

describe("formatDuration", () => {
  it("0초를 올바르게 포맷", () => {
    expect(formatDuration(0)).toBe("0분 0초");
  });

  it("60초 미만을 올바르게 포맷", () => {
    expect(formatDuration(45)).toBe("0분 45초");
  });

  it("정확히 1분을 올바르게 포맷", () => {
    expect(formatDuration(60)).toBe("1분 0초");
  });

  it("분 + 초 조합을 올바르게 포맷", () => {
    expect(formatDuration(125)).toBe("2분 5초");
  });

  it("큰 값을 올바르게 포맷", () => {
    expect(formatDuration(3661)).toBe("61분 1초");
  });
});

describe("formatTime", () => {
  it("0초를 00:00으로 포맷", () => {
    expect(formatTime(0)).toBe("00:00");
  });

  it("한 자리 분/초를 패딩", () => {
    expect(formatTime(65)).toBe("01:05");
  });

  it("두 자리 분/초를 올바르게 포맷", () => {
    expect(formatTime(754)).toBe("12:34");
  });
});

describe("getMinutes", () => {
  it("0초는 0분", () => {
    expect(getMinutes(0)).toBe(0);
  });

  it("59초는 0분 (내림)", () => {
    expect(getMinutes(59)).toBe(0);
  });

  it("60초는 1분", () => {
    expect(getMinutes(60)).toBe(1);
  });

  it("125초는 2분", () => {
    expect(getMinutes(125)).toBe(2);
  });
});
