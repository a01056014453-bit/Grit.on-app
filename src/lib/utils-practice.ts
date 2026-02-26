import type { DrillCard } from "@/types";

/** 요일 배열 */
export const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

/** 연습 팁 목록 */
export const PRACTICE_TIPS = [
  "천천히 연습하는 것이 가장 빠른 길입니다.",
  "어려운 부분은 리듬을 바꿔서 연습해보세요.",
  "한 손씩 따로 연습하면 더 명확해집니다.",
  "녹음해서 자신의 연주를 객관적으로 들어보세요.",
  "긴장을 풀고 호흡에 집중하세요.",
  "메트로놈을 활용하여 정확한 템포를 유지하세요.",
  "같은 구간을 5번 연속 완벽하게 치면 다음으로 넘어가세요.",
  "손목과 팔의 힘을 빼고 자연스럽게 연주하세요.",
  "어려운 패시지는 점점 빠르게 연습해보세요.",
  "눈을 감고 연주해보면 청각에 더 집중할 수 있어요.",
  "프레이징을 노래하듯이 연주해보세요.",
  "페달 없이 먼저 완벽하게 연습하세요.",
];

/** 랜덤 팁 가져오기 */
export function getRandomTip(): string {
  return PRACTICE_TIPS[Math.floor(Math.random() * PRACTICE_TIPS.length)];
}

/** 인사말 가져오기 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "좋은 새벽이에요";
  if (hour < 12) return "좋은 아침이에요";
  if (hour < 18) return "좋은 오후에요";
  return "좋은 저녁이에요";
}

/** 드릴 카드 총 연습 시간 계산 */
export function getTotalPlanMinutes(drillCards: DrillCard[]): number {
  return drillCards.reduce((sum, card) => sum + card.duration, 0);
}

/** 곡별로 드릴 카드 그룹화 */
export interface GroupedDrills {
  song: string;
  drills: DrillCard[];
  totalDuration: number;
}

export function groupDrillsBySong(drillCards: DrillCard[]): GroupedDrills[] {
  const grouped = drillCards.reduce((acc, drill) => {
    if (!acc[drill.song]) {
      acc[drill.song] = [];
    }
    acc[drill.song].push(drill);
    return acc;
  }, {} as Record<string, DrillCard[]>);

  return Object.entries(grouped).map(([song, drills]) => ({
    song,
    drills,
    totalDuration: drills.reduce((sum, d) => sum + d.duration, 0),
  }));
}
