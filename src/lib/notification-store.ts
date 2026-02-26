import { AppNotification } from "@/types";

const STORAGE_KEY = "grit-on-notifications";

export function getNotifications(): AppNotification[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
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
  const updated = [...notifications];
  updated[index] = { ...updated[index], read: true };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function markAllAsRead(): void {
  const notifications = getNotifications().map((n) => ({ ...n, read: true }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
}
