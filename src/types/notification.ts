export type NotificationType =
  | "analysis_complete"
  | "feedback_received"
  | "practice_milestone"
  | "feedback_status";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  read: boolean;
  createdAt: string; // ISO string
  actionUrl?: string;
}

export const NOTIFICATION_TYPE_CONFIG: Record<
  NotificationType,
  { label: string; color: string; bgColor: string }
> = {
  analysis_complete: {
    label: "AI 분석",
    color: "text-blue-600",
    bgColor: "bg-blue-100/70",
  },
  feedback_received: {
    label: "피드백",
    color: "text-violet-600",
    bgColor: "bg-violet-100/70",
  },
  practice_milestone: {
    label: "마일스톤",
    color: "text-amber-600",
    bgColor: "bg-amber-100/70",
  },
  feedback_status: {
    label: "피드백 상태",
    color: "text-green-600",
    bgColor: "bg-green-100/70",
  },
};
