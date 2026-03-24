/**
 * 서버에 푸시 발송 요청
 * 클라이언트에서 호출하면 서버가 대상 유저에게 웹 푸시를 보냄
 */

export async function sendPushToUser(params: {
  userId?: string;
  teacherId?: string;
  title: string;
  body: string;
  url?: string;
}): Promise<boolean> {
  try {
    const res = await fetch("/api/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}
