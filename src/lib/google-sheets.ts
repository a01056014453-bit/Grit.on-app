/**
 * Google Sheets 연동 (Apps Script 웹훅 방식)
 *
 * 설정 방법:
 * 1. Google Sheets에서 Extensions → Apps Script
 * 2. 아래 코드를 붙여넣고 Deploy → Web App
 * 3. 웹앱 URL을 GOOGLE_SHEETS_WEBHOOK_URL 환경변수에 설정
 *
 * Apps Script 코드:
 * ```
 * function doPost(e) {
 *   const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
 *   const data = JSON.parse(e.postData.contents);
 *
 *   // 일일 리포트
 *   if (data.date) {
 *     sheet.appendRow([
 *       data.date,
 *       data.dau,
 *       data.newSignups,
 *       data.totalUsers,
 *       data.totalPracticeMinutes,
 *       data.feedbackRequests,
 *       data.feedbackCompleted,
 *       new Date(),
 *     ]);
 *   }
 *
 *   return ContentService.createTextOutput(
 *     JSON.stringify({ success: true })
 *   ).setMimeType(ContentService.MimeType.JSON);
 * }
 * ```
 *
 * 환경변수: GOOGLE_SHEETS_WEBHOOK_URL
 */

export async function appendToGoogleSheet(
  data: Record<string, unknown>,
): Promise<boolean> {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("[google-sheets] GOOGLE_SHEETS_WEBHOOK_URL 미설정");
    return false;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch (err) {
    console.error("[google-sheets] 발송 실패:", err);
    return false;
  }
}
