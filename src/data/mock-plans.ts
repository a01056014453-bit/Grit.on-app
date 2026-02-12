import type { WeeklyData, DrillCard, TodayPlanItem, AISuggestion } from "@/types";

/** 요일 배열 */
export const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

/** 주간 연습 데이터 */
export const mockWeeklyData: WeeklyData[] = [
  { day: 0, minutes: 75, target: 60, completed: true },
  { day: 1, minutes: 60, target: 60, completed: true },
  { day: 2, minutes: 45, target: 60, completed: false },
  { day: 3, minutes: 90, target: 60, completed: true },
  { day: 4, minutes: 55, target: 60, completed: false },
  { day: 5, minutes: 0, target: 60, completed: false },
  { day: 6, minutes: 0, target: 60, completed: false },
];

/** 오늘의 연습 계획 (초기값) */
export const initialTodayPlan: TodayPlanItem[] = [
  {
    id: "1",
    piece: "F. Chopin Ballade Op.23 No.1",
    measures: "mm. 23-28 (Coda entry)",
    duration: 15,
    priority: "high",
    completed: true,
    note: "왼손 아르페지오 정확성 향상",
  },
  {
    id: "2",
    piece: "F. Chopin Ballade Op.23 No.1",
    measures: "mm. 88-92 (Presto)",
    duration: 20,
    priority: "high",
    completed: false,
    note: "템포 과속 방지, 메트로놈 필수",
  },
  {
    id: "3",
    piece: "L. v. Beethoven Sonata Op.13 No.8",
    measures: "Mvt. 1, mm. 1-16",
    duration: 15,
    priority: "medium",
    completed: false,
    note: "그라베 템포 유지",
  },
  {
    id: "4",
    piece: "L. v. Beethoven Sonata Op.13 No.8",
    measures: "Mvt. 2 (full run-through)",
    duration: 10,
    priority: "low",
    completed: false,
    note: "아다지오 칸타빌레 표현",
  },
];

/** AI 제안 목록 */
export const mockAISuggestions: AISuggestion[] = [
  {
    id: "1",
    type: "tempo",
    title: "템포 과속 경향 감지",
    description: "88-92마디에서 평균 15% 빠르게 연주하는 경향이 있어요. 메트로놈을 ♩=168로 설정하고 연습해보세요.",
    priority: "high",
  },
  {
    id: "2",
    type: "dynamics",
    title: "다이나믹 범위 확대 필요",
    description: "전체적으로 mf-f 범위에서만 연주하고 있어요. pp-p 구간의 표현력을 높여보세요.",
    priority: "medium",
  },
  {
    id: "3",
    type: "practice",
    title: "연습 패턴 분석",
    description: "최근 5일간 코다 부분 연습 비중이 낮아요. 오늘은 23-28마디에 집중해보세요.",
    priority: "low",
  },
];

/** 드릴 카드 (홈 페이지용) */
export const mockDrillCards: DrillCard[] = [
  {
    id: "1",
    type: "rhythm",
    icon: "",
    song: "F. Chopin Ballade Op.23 No.1",
    title: "리듬 흔들림",
    measures: "57-60마디",
    action: "메트로놈 ON, 8분음표 강조",
    tempo: 76,
    duration: 3,
    recurrence: 4,
    confidence: 0.92,
  },
  {
    id: "2",
    type: "sync",
    icon: "",
    song: "F. Chopin Ballade Op.23 No.1",
    title: "양손 어긋남",
    measures: "23-26마디",
    action: "단손→양손 단계별 연습",
    tempo: 72,
    duration: 4,
    recurrence: 3,
    confidence: 0.88,
  },
  {
    id: "3",
    type: "pedal",
    icon: "",
    song: "F. Chopin Ballade Op.23 No.1",
    title: "페달 잔향 겹침",
    measures: "81-84마디",
    action: "반페달 / 교체페달 연습",
    tempo: 80,
    duration: 2,
    recurrence: 2,
    confidence: 0.85,
  },
  {
    id: "4",
    type: "dynamics",
    icon: "",
    song: "L. v. Beethoven Sonata Op.13 No.8",
    title: "다이나믹 부족",
    measures: "33-38마디",
    action: "pp→ff 점진적 크레센도",
    tempo: 84,
    duration: 3,
    recurrence: 2,
    confidence: 0.78,
  },
  {
    id: "5",
    type: "tempo",
    icon: "",
    song: "L. v. Beethoven Sonata Op.13 No.8",
    title: "템포 불안정",
    measures: "1-8마디",
    action: "Grave 도입부 일정 템포 유지",
    tempo: 48,
    duration: 5,
    recurrence: 3,
    confidence: 0.82,
  },
  {
    id: "6",
    type: "technique",
    icon: "",
    song: "L. v. Beethoven Sonata Op.13 No.8",
    title: "옥타브 트레몰로",
    measures: "51-58마디",
    action: "팔꿈치 고정, 손목 회전 연습",
    tempo: 92,
    duration: 5,
    recurrence: 4,
    confidence: 0.75,
  },
  {
    id: "7",
    type: "phrasing",
    icon: "",
    song: "F. Chopin Ballade Op.23 No.1",
    title: "프레이징 끊김",
    measures: "8-16마디",
    action: "레가토 연결, 호흡 자연스럽게",
    tempo: 68,
    duration: 5,
    recurrence: 3,
    confidence: 0.80,
  },
  {
    id: "8",
    type: "fingering",
    icon: "",
    song: "F. Chopin Etude Op.10 No.4",
    title: "운지법 정리",
    measures: "1-8마디",
    action: "16분음표 패시지 운지 확정",
    tempo: 60,
    duration: 5,
    recurrence: 5,
    confidence: 0.70,
  },
  {
    id: "9",
    type: "dynamics",
    icon: "",
    song: "F. Chopin Etude Op.10 No.4",
    title: "다이나믹 표현",
    measures: "33-40마디",
    action: "sf 악센트 + diminuendo 처리",
    tempo: 72,
    duration: 3,
    recurrence: 3,
    confidence: 0.76,
  },
  {
    id: "10",
    type: "rhythm",
    icon: "",
    song: "S. Rachmaninoff Prelude Op.23 No.5",
    title: "리듬 정확도",
    measures: "1-12마디",
    action: "행진곡풍 점음표 리듬 정확히",
    tempo: 88,
    duration: 5,
    recurrence: 3,
    confidence: 0.83,
  },
  {
    id: "11",
    type: "technique",
    icon: "",
    song: "S. Rachmaninoff Prelude Op.23 No.5",
    title: "큰 도약 정확도",
    measures: "35-42마디",
    action: "양손 넓은 도약 착지 연습",
    tempo: 76,
    duration: 4,
    recurrence: 4,
    confidence: 0.72,
  },
];

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
