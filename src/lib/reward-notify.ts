import { addNotification } from "@/lib/notification-store";
import { sendPushToUser } from "@/lib/push-notify";

/**
 * 보상 크레딧 획득 시 알림 발송
 * - 인앱 알림 (notification-store)
 * - 푸시 알림 (push-notify)
 */
export function notifyRewardGranted(params: {
  userId: string;
  rewardName: string;
  amount: number;
  newBalance: number;
}): void {
  const { userId, rewardName, amount, newBalance } = params;

  // 인앱 알림
  addNotification({
    type: "reward",
    title: "크레딧 보상 획득!",
    description: `${rewardName}으로 ${amount}크레딧을 받았습니다. (잔액: ${newBalance})`,
    icon: "Gift",
    actionUrl: "/credits",
  });

  // 푸시 알림 (비동기, 실패 무시)
  sendPushToUser({
    userId,
    title: "🎉 크레딧 보상!",
    body: `${rewardName} — ${amount}크레딧 획득`,
    url: "/credits",
  }).catch(() => {});
}

/**
 * 일일 1위 배지 획득 알림 (크레딧 0이지만 배지 알림)
 */
export function notifyBadgeGranted(params: {
  userId: string;
  badgeName: string;
  badgeCount: number;
}): void {
  const { userId, badgeName, badgeCount } = params;
  const remaining = 2 - (badgeCount % 2);

  addNotification({
    type: "reward",
    title: "배지 획득!",
    description:
      remaining === 0
        ? `${badgeName} 배지 2개 달성! 1크레딧으로 교환됩니다.`
        : `${badgeName} 배지를 받았습니다. ${remaining}개 더 모으면 1크레딧!`,
    icon: "Award",
    actionUrl: "/ranking",
  });

  sendPushToUser({
    userId,
    title: "🏅 배지 획득!",
    body: `${badgeName} — ${remaining === 0 ? "1크레딧 교환!" : `${remaining}개 더 모으면 교환`}`,
    url: "/ranking",
  }).catch(() => {});
}
