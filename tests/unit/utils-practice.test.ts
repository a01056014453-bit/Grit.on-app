import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getGreeting,
  getTotalPlanMinutes,
  groupDrillsBySong,
  getRandomTip,
  PRACTICE_TIPS,
} from "@/lib/utils-practice";
import type { DrillCard } from "@/types";

function makeDrill(overrides: Partial<DrillCard> = {}): DrillCard {
  return {
    id: "drill-1",
    song: "Chopin Etude",
    section: "A section",
    duration: 10,
    completed: false,
    ...overrides,
  } as DrillCard;
}

describe("getGreeting", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("새벽 (0~5시)", () => {
    vi.spyOn(Date.prototype, "getHours").mockReturnValue(3);
    expect(getGreeting()).toBe("좋은 새벽이에요");
  });

  it("아침 (6~11시)", () => {
    vi.spyOn(Date.prototype, "getHours").mockReturnValue(9);
    expect(getGreeting()).toBe("좋은 아침이에요");
  });

  it("오후 (12~17시)", () => {
    vi.spyOn(Date.prototype, "getHours").mockReturnValue(14);
    expect(getGreeting()).toBe("좋은 오후에요");
  });

  it("저녁 (18~23시)", () => {
    vi.spyOn(Date.prototype, "getHours").mockReturnValue(20);
    expect(getGreeting()).toBe("좋은 저녁이에요");
  });
});

describe("getRandomTip", () => {
  it("PRACTICE_TIPS 배열에서 하나를 반환", () => {
    const tip = getRandomTip();
    expect(PRACTICE_TIPS).toContain(tip);
  });
});

describe("getTotalPlanMinutes", () => {
  it("빈 배열이면 0", () => {
    expect(getTotalPlanMinutes([])).toBe(0);
  });

  it("모든 드릴의 duration 합산", () => {
    const drills = [
      makeDrill({ duration: 10 }),
      makeDrill({ duration: 15 }),
      makeDrill({ duration: 5 }),
    ];
    expect(getTotalPlanMinutes(drills)).toBe(30);
  });
});

describe("groupDrillsBySong", () => {
  it("빈 배열이면 빈 배열", () => {
    expect(groupDrillsBySong([])).toEqual([]);
  });

  it("같은 곡의 드릴을 그룹화", () => {
    const drills = [
      makeDrill({ id: "1", song: "Song A", duration: 10 }),
      makeDrill({ id: "2", song: "Song B", duration: 15 }),
      makeDrill({ id: "3", song: "Song A", duration: 5 }),
    ];

    const groups = groupDrillsBySong(drills);
    expect(groups.length).toBe(2);

    const songA = groups.find((g) => g.song === "Song A");
    expect(songA).toBeDefined();
    expect(songA!.drills.length).toBe(2);
    expect(songA!.totalDuration).toBe(15);

    const songB = groups.find((g) => g.song === "Song B");
    expect(songB).toBeDefined();
    expect(songB!.drills.length).toBe(1);
    expect(songB!.totalDuration).toBe(15);
  });
});
