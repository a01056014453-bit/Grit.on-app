/**
 * 서버 API를 통한 DB 쓰기 헬퍼
 * RLS를 우회하여 인증된 유저의 데이터를 안전하게 쓰기
 */

interface MutateParams {
  table: string;
  operation: "insert" | "upsert" | "update" | "delete";
  data?: Record<string, unknown>;
  filters?: Record<string, unknown>;
  returnData?: boolean;
}

interface MutateResult<T = unknown> {
  success: boolean;
  data: T | null;
  error?: string;
}

export async function dbMutate<T = unknown>(
  params: MutateParams
): Promise<MutateResult<T>> {
  try {
    const res = await fetch("/api/db/mutate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error(`[dbMutate] ${params.operation} ${params.table}:`, result.error);
      return { success: false, data: null, error: result.error };
    }

    return { success: true, data: result.data ?? null };
  } catch (err) {
    console.error(`[dbMutate] 네트워크 오류:`, err);
    return { success: false, data: null, error: "네트워크 오류" };
  }
}
