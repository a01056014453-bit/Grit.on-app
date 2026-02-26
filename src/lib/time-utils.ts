/** SLA 마감까지 남은 시간 계산 */
export function getRemainingTime(deadline: string): {
  hours: number;
  minutes: number;
  isExpired: boolean;
  text: string;
} {
  const remaining = new Date(deadline).getTime() - Date.now();
  const isExpired = remaining <= 0;
  const hours = Math.max(0, Math.floor(remaining / (1000 * 60 * 60)));
  const minutes = Math.max(0, Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60)));

  let text = "";
  if (isExpired) {
    text = "만료됨";
  } else if (hours > 0) {
    text = `${hours}시간 ${minutes}분 남음`;
  } else {
    text = `${minutes}분 남음`;
  }

  return { hours, minutes, isExpired, text };
}
