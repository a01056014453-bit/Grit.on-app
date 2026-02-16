import { AppNotification } from "@/types";

const STORAGE_KEY = "grit-on-notifications";

function getToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number, hours = 10, minutes = 0): string {
  const d = getToday();
  d.setDate(d.getDate() - n);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

const mockNotifications: AppNotification[] = [
  {
    id: "n1",
    type: "analysis_complete",
    title: "쇼팽 에튀드 Op.10 No.1 분석 완료",
    description: "AI가 연주 분석을 완료했습니다. 테크닉 점수와 개선 포인트를 확인해 보세요.",
    icon: "Brain",
    read: false,
    createdAt: daysAgo(0, 14, 30),
    actionUrl: "/analysis",
  },
  {
    id: "n2",
    type: "feedback_received",
    title: "김선생님 피드백 도착",
    description: "쇼팽 발라드 1번에 대한 상세 피드백이 도착했습니다.",
    icon: "MessageSquare",
    read: false,
    createdAt: daysAgo(0, 11, 15),
    actionUrl: "/feedback",
  },
  {
    id: "n3",
    type: "practice_milestone",
    title: "연습 7일 연속 달성! 🎉",
    description: "7일 연속 연습을 완료했습니다. 꾸준한 연습이 실력을 만들어요!",
    icon: "Trophy",
    read: false,
    createdAt: daysAgo(0, 9, 0),
  },
  {
    id: "n4",
    type: "feedback_status",
    title: "피드백 요청 수락됨",
    description: "박선생님이 베토벤 소나타 피드백 요청을 수락했습니다. 48시간 내 피드백이 도착할 예정입니다.",
    icon: "CheckCircle",
    read: true,
    createdAt: daysAgo(1, 16, 45),
    actionUrl: "/feedback",
  },
  {
    id: "n5",
    type: "analysis_complete",
    title: "바흐 인벤션 No.8 분석 완료",
    description: "성부 밸런스와 아티큘레이션에 대한 분석 결과를 확인하세요.",
    icon: "Brain",
    read: true,
    createdAt: daysAgo(1, 10, 20),
    actionUrl: "/analysis",
  },
  {
    id: "n6",
    type: "practice_milestone",
    title: "이번 주 연습 목표 달성!",
    description: "주간 연습 목표 5시간을 달성했습니다. 다음 목표를 설정해 보세요.",
    icon: "Target",
    read: true,
    createdAt: daysAgo(2, 20, 0),
  },
  {
    id: "n7",
    type: "feedback_received",
    title: "이선생님 피드백 도착",
    description: "리스트 라 캄파넬라 연습 영상에 대한 피드백이 도착했습니다.",
    icon: "MessageSquare",
    read: true,
    createdAt: daysAgo(3, 15, 30),
    actionUrl: "/feedback",
  },
];

function initializeStorage(): void {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockNotifications));
  }
}

export function getNotifications(): AppNotification[] {
  if (typeof window === "undefined") return mockNotifications;
  initializeStorage();
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : mockNotifications;
}

export function getUnreadCount(): number {
  return getNotifications().filter((n) => !n.read).length;
}

export function addNotification(
  notification: Omit<AppNotification, "id" | "createdAt" | "read">
): AppNotification {
  const notifications = getNotifications();
  const newNotification: AppNotification = {
    ...notification,
    id: `n${Date.now()}`,
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifications.unshift(newNotification);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  return newNotification;
}

export function markAsRead(id: string): void {
  const notifications = getNotifications();
  const index = notifications.findIndex((n) => n.id === id);
  if (index === -1) return;
  notifications[index].read = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
}

export function markAllAsRead(): void {
  const notifications = getNotifications().map((n) => ({ ...n, read: true }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
}
