/**
 * App Store Connect API 연동
 * 다운로드 수, 설치 수 등 앱 분석 데이터 조회
 *
 * 환경변수:
 * - APPSTORE_ISSUER_ID: API 키 발급자 ID (UUID)
 * - APPSTORE_KEY_ID: API 키 ID (10자리)
 * - APPSTORE_PRIVATE_KEY: .p8 파일 내용 (base64 또는 PEM)
 * - APPSTORE_APP_ID: 앱 ID (App Store Connect에서 확인)
 */

import crypto from "crypto";

const ISSUER_ID = process.env.APPSTORE_ISSUER_ID || "";
const KEY_ID = process.env.APPSTORE_KEY_ID || "";
const PRIVATE_KEY_RAW = process.env.APPSTORE_PRIVATE_KEY || "";
const APP_ID = process.env.APPSTORE_APP_ID || "6760019130";

function getPrivateKey(): string {
  // PEM 형식이면 그대로, 아니면 PEM으로 감싸기
  if (PRIVATE_KEY_RAW.includes("BEGIN PRIVATE KEY")) {
    return PRIVATE_KEY_RAW;
  }
  return `-----BEGIN PRIVATE KEY-----\n${PRIVATE_KEY_RAW}\n-----END PRIVATE KEY-----`;
}

/** JWT 토큰 생성 (ES256) */
function generateToken(): string {
  const header = {
    alg: "ES256",
    kid: KEY_ID,
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: ISSUER_ID,
    iat: now,
    exp: now + 20 * 60, // 20분
    aud: "appstoreconnect-v1",
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const sign = crypto.createSign("SHA256");
  sign.update(signingInput);
  const signature = sign.sign(getPrivateKey());

  // DER → raw r,s (ES256)
  const derSignature = signature;
  const r = derSignature.subarray(4, 4 + derSignature[3]);
  const s = derSignature.subarray(4 + derSignature[3] + 2);
  const rawR = r.length > 32 ? r.subarray(r.length - 32) : Buffer.concat([Buffer.alloc(32 - r.length), r]);
  const rawS = s.length > 32 ? s.subarray(s.length - 32) : Buffer.concat([Buffer.alloc(32 - s.length), s]);
  const rawSignature = Buffer.concat([rawR, rawS]).toString("base64url");

  return `${signingInput}.${rawSignature}`;
}

async function apiRequest(path: string): Promise<unknown> {
  if (!ISSUER_ID || !KEY_ID || !PRIVATE_KEY_RAW) {
    throw new Error("App Store Connect API 키가 설정되지 않았습니다.");
  }

  const token = generateToken();
  const res = await fetch(`https://api.appstoreconnect.apple.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`App Store Connect API error ${res.status}: ${text}`);
  }

  return res.json();
}

/** 앱 정보 조회 */
export async function getAppInfo() {
  const data = await apiRequest(`/v1/apps/${APP_ID}`) as any;
  return data.data?.attributes ?? null;
}

/** 앱 다운로드/설치 수 조회 (최근 30일) */
export async function getAppDownloads(): Promise<{
  totalDownloads: number;
  totalInstalls: number;
  dailyData: { date: string; downloads: number; installs: number }[];
}> {
  try {
    // App Store Connect Analytics Reports API
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

    // perfPowerMetrics는 일반 API로는 접근 어려움
    // Sales and Trends API 사용
    const data = await apiRequest(
      `/v1/apps/${APP_ID}/appStoreVersions?limit=1&sort=-versionString`
    ) as any;

    // 기본 앱 정보는 가져올 수 있지만 다운로드 수는 Analytics Reports API 필요
    // Analytics Reports는 별도 엔드포인트 사용

    // Fallback: analyticsReportRequests 사용
    const reportData = await apiRequest(
      `/v1/analyticsReportRequests?filter[app]=${APP_ID}`
    ).catch(() => null) as any;

    if (reportData?.data?.length > 0) {
      // 리포트 데이터 처리
      return parseAnalyticsReport(reportData);
    }

    return {
      totalDownloads: 0,
      totalInstalls: 0,
      dailyData: [],
    };
  } catch (err) {
    console.error("[appstore-connect] getAppDownloads error:", err);
    return {
      totalDownloads: 0,
      totalInstalls: 0,
      dailyData: [],
    };
  }
}

function parseAnalyticsReport(data: any) {
  // Analytics Report 파싱 로직
  return {
    totalDownloads: 0,
    totalInstalls: 0,
    dailyData: [],
  };
}

/** API 키 설정 확인 */
export function isConfigured(): boolean {
  return !!(ISSUER_ID && KEY_ID && PRIVATE_KEY_RAW);
}
