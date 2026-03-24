import { dbMutate } from "@/lib/db-mutate";

// ─── 타입 ───

export interface CreditBalance {
  balance: number;
  plan: "free" | "pro";
}

export interface CreditTransaction {
  id: string;
  amount: number;
  type: "charge" | "subscription" | "hold" | "release" | "refund" | "reward";
  description: string | null;
  balanceAfter: number;
  createdAt: string;
}

// ─── 잔액 조회 ───

export async function getCreditBalance(userId: string): Promise<CreditBalance> {
  try {
    const res = await fetch(
      `/api/db/query?table=profiles&filter=id.eq.${userId}&limit=1`,
    );
    if (!res.ok) return { balance: 0, plan: "free" };
    const { data } = await res.json();
    if (!data || data.length === 0) return { balance: 0, plan: "free" };
    return {
      balance: data[0].credit_balance ?? 0,
      plan: (data[0].subscription_plan ?? "free") as "free" | "pro",
    };
  } catch {
    return { balance: 0, plan: "free" };
  }
}

// ─── 크레딧 홀드 (기능 이용 시) ───

export async function holdCredits(params: {
  userId: string;
  amount: number;
  referenceId: string;
  description: string;
}): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  // 잔액 확인
  const { balance } = await getCreditBalance(params.userId);
  if (balance < params.amount) {
    return { success: false, error: "크레딧이 부족합니다." };
  }

  // 잔액 차감
  const newBalance = balance - params.amount;
  const updateResult = await dbMutate({
    table: "profiles",
    operation: "update",
    data: { credit_balance: newBalance },
    filters: { id: params.userId },
  });

  if (!updateResult.success) {
    return { success: false, error: "잔액 차감에 실패했습니다." };
  }

  // 트랜잭션 기록
  await dbMutate({
    table: "credit_transactions",
    operation: "insert",
    data: {
      user_id: params.userId,
      amount: -params.amount,
      type: "hold",
      reference_id: params.referenceId,
      description: params.description,
      balance_after: newBalance,
    },
  });

  return { success: true, newBalance };
}

// ─── 크레딧 릴리스 (완료 확정) ───

export async function releaseCredits(params: {
  userId: string;
  amount: number;
  referenceId: string;
}): Promise<boolean> {
  // 릴리스는 잔액 변동 없음 (이미 홀드에서 차감됨)
  // 트랜잭션 기록만
  const result = await dbMutate({
    table: "credit_transactions",
    operation: "insert",
    data: {
      user_id: params.userId,
      amount: 0,
      type: "release",
      reference_id: params.referenceId,
      description: "피드백 완료 확정",
      balance_after: (await getCreditBalance(params.userId)).balance,
    },
  });

  return result.success;
}

// ─── 크레딧 환불 (거절/만료) ───

export async function refundCredits(params: {
  userId: string;
  amount: number;
  referenceId: string;
}): Promise<boolean> {
  const { balance } = await getCreditBalance(params.userId);
  const newBalance = balance + params.amount;

  const updateResult = await dbMutate({
    table: "profiles",
    operation: "update",
    data: { credit_balance: newBalance },
    filters: { id: params.userId },
  });

  if (!updateResult.success) return false;

  await dbMutate({
    table: "credit_transactions",
    operation: "insert",
    data: {
      user_id: params.userId,
      amount: params.amount,
      type: "refund",
      reference_id: params.referenceId,
      description: "피드백 요청 환불",
      balance_after: newBalance,
    },
  });

  return true;
}

// ─── 크레딧 충전 (관리자 수동 / PG 연동 후 자동) ───

export async function chargeCredits(params: {
  userId: string;
  amount: number;
  description?: string;
}): Promise<{ success: boolean; newBalance?: number }> {
  const { balance } = await getCreditBalance(params.userId);
  const newBalance = balance + params.amount;

  const updateResult = await dbMutate({
    table: "profiles",
    operation: "update",
    data: {
      credit_balance: newBalance,
      total_credit_purchases: params.amount, // TODO: INCREMENT
    },
    filters: { id: params.userId },
  });

  if (!updateResult.success) return { success: false };

  await dbMutate({
    table: "credit_transactions",
    operation: "insert",
    data: {
      user_id: params.userId,
      amount: params.amount,
      type: "charge",
      description: params.description ?? "크레딧 충전",
      balance_after: newBalance,
    },
  });

  return { success: true, newBalance };
}

// ─── 트랜잭션 이력 조회 ───

export async function getCreditHistory(
  userId: string,
): Promise<CreditTransaction[]> {
  try {
    const res = await fetch(
      `/api/db/query?table=credit_transactions&filter=user_id.eq.${userId}&limit=50`,
    );
    if (!res.ok) return [];
    const { data } = await res.json();
    return (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      amount: row.amount as number,
      type: row.type as CreditTransaction["type"],
      description: row.description as string | null,
      balanceAfter: row.balance_after as number,
      createdAt: row.created_at as string,
    }));
  } catch {
    return [];
  }
}
