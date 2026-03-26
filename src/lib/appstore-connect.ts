/**
 * App Store Connect API 연동
 *
 * 환경변수:
 * - APP_STORE_ISSUER_ID: API 키 발급자 ID
 * - APP_STORE_KEY_ID: API 키 ID
 * - APP_STORE_PRIVATE_KEY: .p8 PEM 내용
 *     Vercel에서는 \n을 리터럴 \\n으로 치환한 단일 문자열로 저장
 *     예: "-----BEGIN PRIVATE KEY-----\\nMIGT...\\n-----END PRIVATE KEY-----"
 * - APPSTORE_APP_ID: 앱 ID (기본값: 6760019130)
 */

import { SignJWT, importPKCS8 } from "jose";

// ─── 타입 정의 ───────────────────────────────────────────────────

/** App Store Connect 공통 응답 래퍼 */
interface ASCResponse<T> {
  data: T;
  meta?: unknown;
}

/** /v1/apps/{id} 응답 */
interface ASCAppAttributes {
  name: string;
  bundleId: string;
  sku: string;
}

/** /v1/apps/{id}/appStoreVersions 응답 */
interface ASCVersionAttributes {
  versionString: string;
  appStoreState: string;
}

/** /v1/analyticsReportRequests 응답 */
interface ASCReportRequest {
  id: string;
  attributes: { accessType: string };
  relationships?: {
    reports?: { links?: { related?: string } };
  };
}

/** 리포트 */
interface ASCReport {
  id: string;
  attributes: { category: string; name: string };
  relationships?: {
    instances?: { links?: { related?: string } };
  };
}

/** 리포트 인스턴스 */
interface ASCReportInstance {
  id: string;
  attributes: { processingDate: string; granularity: string };
  relationships?: {
    segments?: { links?: { related?: string } };
  };
}

/** 세그먼트 */
interface ASCSegment {
  attributes: { url?: string; checksum?: string };
}

/** 공개 반환 타입 */
export interface AppInfo {
  name: string;
  bundleId: string;
  version: string;
}

export interface DownloadMetrics {
  total: number;
  last7days: number;
  last30days: number;
  trend: { date: string; count: number }[];
}

// ─── 설정 ────────────────────────────────────────────────────────

const ISSUER_ID = process.env.APPSTORE_ISSUER_ID ?? "";
const KEY_ID = process.env.APPSTORE_KEY_ID ?? "";
const PRIVATE_KEY_RAW = process.env.APPSTORE_PRIVATE_KEY ?? "";
const APP_ID = process.env.APPSTORE_APP_ID ?? "6760019130";
const BASE_URL = "https://api.appstoreconnect.apple.com/v1";

function getPrivateKeyPem(): string {
  let pem = PRIVATE_KEY_RAW;
  // 리터럴 \n → 실제 개행 치환 (한 줄 문자열로 저장된 경우)
  if (pem.includes("\\n")) {
    pem = pem.replace(/\\n/g, "\n");
  }
  // PEM 헤더가 없으면 감싸기
  if (!pem.includes("BEGIN PRIVATE KEY")) {
    pem = `-----BEGIN PRIVATE KEY-----\n${pem}\n-----END PRIVATE KEY-----`;
  }
  return pem.trim();
}

/** API 키 설정 확인 */
export function isConfigured(): boolean {
  return !!(ISSUER_ID && KEY_ID && PRIVATE_KEY_RAW);
}

// ─── JWT + API 호출 ──────────────────────────────────────────────

/** ES256 JWT 생성 (jose) */
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

/** API 요청 헬퍼 — 제네릭은 ASC 타입 전용 */
async function apiRequest<T>(path: string): Promise<T> {
  const token = await generateToken();
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`ASC ${res.status}: ${text.slice(0, 200)}`);
  }

  return res.json() as Promise<T>;
}

// ─── 앱 정보 ─────────────────────────────────────────────────────

/** 앱 정보 조회 (name, bundleId, version) */
export async function getAppInfo(): Promise<AppInfo | null> {
  try {
    const app = await apiRequest<ASCResponse<{ attributes: ASCAppAttributes }>>(
      `/v1/apps/${APP_ID}`,
    );

    const versions = await apiRequest<ASCResponse<{ attributes: ASCVersionAttributes }[]>>(
      `/v1/apps/${APP_ID}/appStoreVersions?filter[appStoreState]=READY_FOR_DISTRIBUTION&limit=1&sort=-versionString`,
    );

    const version = Array.isArray(versions.data)
      ? versions.data[0]?.attributes?.versionString ?? "-"
      : "-";

    return {
      name: app.data?.attributes?.name ?? "Sempre",
      bundleId: app.data?.attributes?.bundleId ?? "-",
      version,
    };
  } catch (err) {
    console.error("[appstore] getAppInfo 실패:", err);
    return null;
  }
}

// ─── 다운로드 데이터 ─────────────────────────────────────────────

/** 다운로드 데이터 조회 (Analytics Report Requests API) */
export async function getAppDownloads(): Promise<DownloadMetrics | null> {
  try {
    // 1. ONGOING 리포트 요청 찾기
    const existing = await apiRequest<ASCResponse<ASCReportRequest[]>>(
      `/v1/analyticsReportRequests?filter[app]=${APP_ID}&limit=5`,
    );

    const ongoingReport = existing.data?.find(
      (r) => r.attributes.accessType === "ONGOING",
    );

    if (!ongoingReport) {
      try {
        await createReportRequest();
        console.log("[appstore] ONGOING 리포트 요청 생성 완료 — 데이터는 다음 조회부터 사용 가능");
      } catch (err) {
        console.error("[appstore] 리포트 요청 생성 실패:", err);
      }
      return { total: 0, last7days: 0, last30days: 0, trend: [] };
    }

    // 2. 리포트 목록에서 다운로드 관련 리포트 찾기
    const reportsUrl = ongoingReport.relationships?.reports?.links?.related;
    if (!reportsUrl) {
      console.error("[appstore] 리포트 URL 없음");
      return { total: 0, last7days: 0, last30days: 0, trend: [] };
    }

    const reports = await apiRequest<ASCResponse<ASCReport[]>>(reportsUrl);
    const downloadReport = reports.data?.find(
      (r) =>
        r.attributes.category === "APP_USAGE" ||
        r.attributes.category === "APP_STORE_ENGAGEMENT" ||
        r.attributes.name?.toLowerCase().includes("download"),
    );

    if (!downloadReport?.relationships?.instances?.links?.related) {
      console.error("[appstore] 다운로드 리포트 인스턴스 없음");
      return { total: 0, last7days: 0, last30days: 0, trend: [] };
    }

    // 3. 최신 일별 인스턴스 찾기
    const instances = await apiRequest<ASCResponse<ASCReportInstance[]>>(
      downloadReport.relationships.instances.links.related,
    );

    const dailyInstance = instances.data
      ?.filter((i) => i.attributes.granularity === "DAILY")
      .sort((a, b) => b.attributes.processingDate.localeCompare(a.attributes.processingDate))[0];

    if (!dailyInstance?.relationships?.segments?.links?.related) {
      console.error("[appstore] 일별 인스턴스 세그먼트 없음");
      return { total: 0, last7days: 0, last30days: 0, trend: [] };
    }

    // 4. 세그먼트 → TSV 다운로드 URL
    const segments = await apiRequest<ASCResponse<ASCSegment[]>>(
      dailyInstance.relationships.segments.links.related,
    );

    const tsvUrl = segments.data?.[0]?.attributes?.url;
    if (!tsvUrl) {
      console.error("[appstore] TSV 다운로드 URL 없음");
      return { total: 0, last7days: 0, last30days: 0, trend: [] };
    }

    // 5. TSV 파싱
    const tsvRes = await fetch(tsvUrl);
    if (!tsvRes.ok) {
      console.error("[appstore] TSV 다운로드 실패:", tsvRes.status);
      return null;
    }

    const tsvText = await tsvRes.text();
    const trend = parseTsvData(tsvText);

    if (trend.length === 0) {
      console.error("[appstore] TSV 파싱 결과 비어있음 (헤더 매핑 실패 가능)");
      return { total: 0, last7days: 0, last30days: 0, trend: [] };
    }

    const now = new Date();
    const day7 = new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0];
    const day30 = new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0];

    return {
      total: trend.reduce((s, t) => s + t.count, 0),
      last7days: trend.filter((t) => t.date >= day7).reduce((s, t) => s + t.count, 0),
      last30days: trend.filter((t) => t.date >= day30).reduce((s, t) => s + t.count, 0),
      trend: trend.filter((t) => t.date >= day30),
    };
  } catch (err) {
    console.error("[appstore] getAppDownloads 실패:", err);
    return null;
  }
}

/** Analytics Report Request 생성 (ONGOING) */
async function createReportRequest(): Promise<void> {
  const token = await generateToken();
  const res = await fetch(`${BASE_URL}/v1/analyticsReportRequests`, {
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

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`리포트 요청 생성 실패 ${res.status}: ${text.slice(0, 200)}`);
  }
}

/**
 * Apple Analytics TSV 파싱
 *
 * Apple TSV 컬럼 예시:
 *   Date\tApp Name\tApp Apple ID\tSource Type\tUnits\tProduct Type\t...
 *
 * 매핑:
 *   - date: "date" 포함 컬럼
 *   - count: "units" 또는 "download" 또는 "install" 또는 "count" 포함 컬럼
 */
function parseTsvData(tsv: string): { date: string; count: number }[] {
  const lines = tsv.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split("\t").map((h) => h.trim().toLowerCase());

  // 날짜 컬럼 찾기
  const dateIdx = headers.findIndex((h) => h === "date" || h.includes("date"));

  // 수량 컬럼 찾기 (Apple TSV는 보통 "Units" 컬럼)
  const countIdx = headers.findIndex(
    (h) =>
      h === "units" ||
      h === "count" ||
      h.includes("download") ||
      h.includes("install"),
  );

  if (dateIdx === -1 || countIdx === -1) {
    console.error(
      `[appstore] TSV 헤더 매핑 실패 — headers: [${headers.join(", ")}], dateIdx=${dateIdx}, countIdx=${countIdx}`,
    );
    return [];
  }

  // 날짜별 합산 (동일 날짜에 여러 행이 있을 수 있음 — Source Type별 분리)
  const dateMap = new Map<string, number>();

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split("\t");
    const rawDate = cols[dateIdx]?.trim() ?? "";
    const rawCount = cols[countIdx]?.trim() ?? "0";

    // 날짜 형식 정규화 (YYYY-MM-DD 또는 MM/DD/YYYY 등)
    const date = normalizeDate(rawDate);
    if (!date) continue;

    const count = parseInt(rawCount, 10);
    if (isNaN(count)) continue;

    dateMap.set(date, (dateMap.get(date) ?? 0) + count);
  }

  return Array.from(dateMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** 날짜 문자열을 YYYY-MM-DD로 정규화 */
function normalizeDate(raw: string): string | null {
  if (!raw) return null;

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  // MM/DD/YYYY
  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    return `${slashMatch[3]}-${slashMatch[1].padStart(2, "0")}-${slashMatch[2].padStart(2, "0")}`;
  }

  // Date 파싱 fallback
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }

  return null;
}
