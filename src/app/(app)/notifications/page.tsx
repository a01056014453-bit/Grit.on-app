"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronLeft,
  Brain,
  MessageSquare,
  Trophy,
  CheckCircle,
  Target,
} from "lucide-react";
import { AnimatedList } from "@/components/ui/animated-list";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "@/lib/notification-store";
import {
  AppNotification,
  NOTIFICATION_TYPE_CONFIG,
} from "@/types";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain,
  MessageSquare,
  Trophy,
  CheckCircle,
  Target,
};

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

function getDateGroup(dateStr: string): "today" | "yesterday" | "earlier" {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (target.getTime() === today.getTime()) return "today";
  if (target.getTime() === yesterday.getTime()) return "yesterday";
  return "earlier";
}

const GROUP_LABELS: Record<string, string> = {
  today: "오늘",
  yesterday: "어제",
  earlier: "이전",
};

function NotificationItem({
  notification,
  onRead,
}: {
  notification: AppNotification;
  onRead: (id: string) => void;
}) {
  const config = NOTIFICATION_TYPE_CONFIG[notification.type];
  const IconComponent = ICON_MAP[notification.icon] || Bell;

  const content = (
    <div
      onClick={() => !notification.read && onRead(notification.id)}
      className={`flex items-start gap-3 bg-white/40 backdrop-blur-xl rounded-2xl p-4 border transition-all mb-2 ${
        notification.read
          ? "border-white/30 opacity-70"
          : "border-white/50 shadow-sm"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.bgColor}`}
      >
        <IconComponent className={`w-5 h-5 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${config.bgColor} ${config.color}`}
          >
            {config.label}
          </span>
          {!notification.read && (
            <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
          )}
        </div>
        <h3
          className={`text-sm font-semibold leading-snug ${
            notification.read ? "text-gray-500" : "text-gray-900"
          }`}
        >
          {notification.title}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
          {notification.description}
        </p>
        <span className="text-[11px] text-gray-400 mt-1 block">
          {getRelativeTime(notification.createdAt)}
        </span>
      </div>
    </div>
  );

  if (notification.actionUrl) {
    return (
      <Link href={notification.actionUrl} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setNotifications(getNotifications());
    setUnreadCount(getUnreadCount());
  }, []);

  const grouped = useMemo(() => {
    const groups: Record<string, AppNotification[]> = {
      today: [],
      yesterday: [],
      earlier: [],
    };
    notifications.forEach((n) => {
      const group = getDateGroup(n.createdAt);
      groups[group].push(n);
    });
    return groups;
  }, [notifications]);

  const handleRead = (id: string) => {
    markAsRead(id);
    setNotifications(getNotifications());
    setUnreadCount(getUnreadCount());
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    setNotifications(getNotifications());
    setUnreadCount(0);
  };

  const nonEmptyGroups = Object.entries(grouped).filter(
    ([, items]) => items.length > 0
  );

  return (
    <div className="px-4 py-6 max-w-lg mx-auto min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center border border-white/40"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-violet-600" />
            <h1 className="text-xl font-bold text-gray-900">알림</h1>
            {unreadCount > 0 && (
              <span className="bg-violet-600 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-violet-600 font-semibold hover:text-violet-800 transition-colors"
          >
            모두 읽음
          </button>
        )}
      </div>

      {/* Notification Groups */}
      {nonEmptyGroups.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-white/40 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto mb-4 border border-white/50">
            <Bell className="w-8 h-8 text-violet-300" />
          </div>
          <p className="text-gray-500 font-medium">알림이 없습니다</p>
          <p className="text-sm text-gray-400 mt-1">
            새로운 소식이 있으면 알려드릴게요
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {nonEmptyGroups.map(([group, items]) => (
            <div key={group}>
              <h2 className="text-sm font-bold text-gray-600 mb-3 px-1">
                {GROUP_LABELS[group]}
              </h2>
              <AnimatedList delay={150} className="space-y-0">
                {items.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={handleRead}
                  />
                ))}
              </AnimatedList>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
