import { config } from 'dotenv';
config({ path: '.env.local' });

const apiKey = process.env.COOLSMS_API_KEY;
const apiSecret = process.env.COOLSMS_API_SECRET;
const senderNumber = process.env.COOLSMS_SENDER_NUMBER;

console.log("=== CoolSMS 설정 확인 ===");
console.log("API Key:", apiKey ? `${apiKey.slice(0, 4)}...` : "❌ 미설정");
console.log("API Secret:", apiSecret ? `${apiSecret.slice(0, 4)}...` : "❌ 미설정");
console.log("Sender Number:", senderNumber || "❌ 미설정");

if (!apiKey || !apiSecret || !senderNumber) {
  console.error("환경변수가 설정되지 않았습니다.");
  process.exit(1);
}

// CoolSMS SDK 테스트
const mod = await import('coolsms-node-sdk');
const CoolsmsMessageService = mod.default?.default ?? mod.default;
const sms = new CoolsmsMessageService(apiKey, apiSecret);

// 1. 먼저 잔액 확인
try {
  const balance = await sms.getBalance();
  console.log("\n=== 잔액 확인 ===");
  console.log("Balance:", balance.balance, "원");
  console.log("Point:", balance.point, "원");
} catch (err) {
  console.error("잔액 조회 실패:", err.message);
}

// 2. 테스트 문자 발송
console.log("\n=== SMS 발송 테스트 ===");
const testPhone = senderNumber; // 본인 번호로 테스트
try {
  const result = await sms.sendOne({
    to: testPhone.replace(/-/g, ""),
    from: senderNumber.replace(/-/g, ""),
    text: "[Sempre 테스트] SMS 발송 테스트입니다.",
    autoTypeDetect: true,
  });
  console.log("발송 결과:", JSON.stringify(result, null, 2));
  console.log("statusCode:", result.statusCode);
  console.log("statusMessage:", result.statusMessage);
} catch (err) {
  console.error("SMS 발송 실패:", err.message);
  if (err.response) {
    console.error("Response:", JSON.stringify(err.response, null, 2));
  }
}
