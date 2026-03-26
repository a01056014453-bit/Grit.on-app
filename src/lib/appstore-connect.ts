/**
 * App Store Connect API 연동
 *
 * 환경변수:
 * - APP_STORE_ISSUER_ID: API 키 발급자 ID
 * - APP_STORE_KEY_ID: API 키 ID
 * - APP_STORE_PRIVATE_KEY: .p8 PEM 내용 (\n을 리터럴 \n으로 치환한 문자열)
 * - APPSTORE_APP_ID: 앱 ID (기본값: 6760019130)
 */

import { SignJWT, importPKCS8 } from "jose";

const ISSUER_ID = process.env.APP_STORE_ISSUER_ID ?? "";
const KEY_ID = process.env.APP_STORE_KEY_ID ?? "";
const PRIVATE_KEY_RAW = process.env.APP_STORE_PRIVATE_KEY ?? "";
const APP_ID = process.env.APPSTORE_APP_ID ?? "6760019130";
const BASE_URL = "https://api.appstoreconnect.apple.com/v1";

function getPrivateKeyPem(): string {
  // \n 리터럴을 실제 개행으로 치환
  const pem = PRIVATE_KEY_RAW.replace(/\\n/g, "\n");
  if (pem.includes("BEGIN PRIVATE KEY")) return pem;
  return `-----BEGIN PRIVATE KEY-----\n${pem}\n-----END PRIVATE KEY-----`;
}

/** ES256 JWT 생성 (jose 사용) */
async function generateToken(): Promise<string> {
  const privateKey = await importPKCS8(getPrivateKeyPem(), "ES256");
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: KEY_ID, typ: "JWT" })
    .setIssuer(ISSUER_ID)
    .setIssuedAt()
    .setExpirationTime("20m")
    .setAudience("appstoreconnect-v1")
    .sign(privateKey);
}

/** API 요청 헬퍼 */
async function apiRequest<T = unknown>(path: string): Promise<T> {
  const token = await generateToken();
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`App Store Connect ${res.status}: ${text.slice(0, 200)}`);
  }

  return res.json() as Promise<T>;
}

/** API 키 설정 확인 */
export function isConfigured(): boolean {
  return !!(ISSUER_ID && KEY_ID && PRIVATE_KEY_RAW);
}

/** 앱 정보 조회 */
export async function getAppInfo(): Promise<{
  name: string;
  bundleId: string;
  version: string;
  rating: number;
  reviewCount: number;
} | null> {
  try {
    const data = await apiRequest<{
      data: {
        attributes: {
          name: string;
          bundleId: string;
        };
      };
    }>(`/v1/apps/${APP_ID}`);

    // 최신 버전 조회
    const versions = await apiRequest<{
      data: { attributes: { versionString: string } }[];
    }>(`/v1/apps/${APP_ID}/appStoreVersions?limit=1&sort=-versionString`);

    const version = versions.data?.[0]?.attributes?.versionString ?? "-";

    return {
      name: data.data?.attributes?.name ?? "Sempre",
      bundleId: data.data?.attributes?.bundleId ?? "-",
      version,
      rating: 0,
      reviewCount: 0,
    };
  } catch (err) {
    console.error("[appstore-connect] getAppInfo 실패:", err);
    return null;
  }
}

/** 다운로드 데이터 조회 (Analytics Report Requests API) */
export async function getAppDownloads(): Promise<{
  total: number;
  last7days: number;
  last30days: number;
  trend: { date: string; count: number }[];
} | null> {
  try {
    // 1. 기존 리포트 요청 확인
    const existing = await apiRequest<{
      data: {
        id: string;
        attributes: { accessType: string };
        relationships?: {
          reports?: { links?: { related?: string } };
        };
      }[];
    }>(`/v1/analyticsReportRequests?filter[app]=${APP_ID}&limit=5`);

    // ONGOING 타입 리포트가 있으면 사용
    const ongoingReport = existing.data?.find(
      (r) => r.attributes.accessType === "ONGOING",
    );

    if (!ongoingReport) {
      // 리포트 요청 생성 시도
      try {
        await createReportRequest();
      } catch {
        // 이미 존재하거나 실패 — 무시
      }
      return { total: 0, last7days: 0, last30days: 0, trend: [] };
    }

    // 2. 리포트 목록에서 APP_DOWNLOADS 찾기
    const reportsUrl = ongoingReport.relationships?.reports?.links?.related;
    if (!reportsUrl) {
      return { total: 0, last7days: 0, last30days: 0, trend: [] };
    }

    const reports = await apiRequest<{
      data: {
        id: string;
        attributes: { category: string; name: string };
        relationships?: {
          instances?: { links?: { related?: string } };
        };
      }[];
    }>(reportsUrl);

    const downloadReport = reports.data?.find(
      (r) => r.attributes.category === "APP_USAGE" || r.attributes.name?.includes("Download"),
    );

    if (!downloadReport?.relationships?.instances?.links?.related) {
      return { total: 0, last7days: 0, last30days: 0, trend: [] };
    }

    // 3. 인스턴스(실제 데이터) 조회
    const instances = await apiRequest<{
      data: {
        id: string;
        attributes: {
          processingDate: string;
          granularity: string;
        };
        relationships?: {
          segments?: { links?: { related?: string } };
        };
      }[];
    }>(downloadReport.relationships.instances.links.related);

    // 최신 일별 인스턴스 찾기
    const dailyInstance = instances.data
      ?.filter((i) => i.attributes.granularity === "DAILY")
      .sort((a, b) => b.attributes.processingDate.localeCompare(a.attributes.processingDate))[0];

    if (!dailyInstance?.relationships?.segments?.links?.related) {
      return { total: 0, last7days: 0, last30days: 0, trend: [] };
    }

    // 4. 세그먼트 데이터 다운로드 URL 획득
    const segments = await apiRequest<{
      data: {
        attributes: { url?: string; checksum?: string };
      }[];
    }>(dailyInstance.relationships.segments.links.related);

    const downloadUrl = segments.data?.[0]?.attributes?.url;
    if (!downloadUrl) {
      return { total: 0, last7days: 0, last30days: 0, trend: [] };
    }

    // 5. TSV/CSV 데이터 파싱
    const csvRes = await fetch(downloadUrl);
    const csvText = await csvRes.text();
    const trend = parseTsvData(csvText);

    const now = new Date();
    const day7 = new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0];
    const day30 = new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0];

    const last7days = trend.filter((t) => t.date >= day7).reduce((s, t) => s + t.count, 0);
    const last30days = trend.filter((t) => t.date >= day30).reduce((s, t) => s + t.count, 0);
    const total = trend.reduce((s, t) => s + t.count, 0);

    return {
      total,
      last7days,
      last30days,
      trend: trend.filter((t) => t.date >= day30),
    };
  } catch (err) {
    console.error("[appstore-connect] getAppDownloads 실패:", err);
    return null;
  }
}

/** Analytics Report Request 생성 */
async function createReportRequest(): Promise<void> {
  const token = await generateToken();
  await fetch(`${BASE_URL}/v1/analyticsReportRequests`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        type: "analyticsReportRequests",
        attributes: { accessType: "ONGOING" },
        relationships: {
          app: { data: { type: "apps", id: APP_ID } },
        },
      },
    }),
  });
}

/** TSV 다운로드 데이터 파싱 */
function parseTsvData(tsv: string): { date: string; count: number }[] {
  const lines = tsv.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split("\t").map((h) => h.trim().toLowerCase());
  const dateIdx = headers.findIndex((h) => h.includes("date"));
  const countIdx = headers.findIndex(
    (h) => h.includes("download") || h.includes("install") || h.includes("count"),
  );

  if (dateIdx === -1 || countIdx === -1) return [];

  return lines
    .slice(1)
    .map((line) => {
      const cols = line.split("\t");
      const date = cols[dateIdx]?.trim() ?? "";
      const count = parseInt(cols[countIdx]?.trim() ?? "0", 10);
      return { date, count: isNaN(count) ? 0 : count };
    })
    .filter((r) => r.date.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}
