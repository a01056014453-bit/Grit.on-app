import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// dbMutate는 서버 경유 fetch 래퍼 → 호출 인자만 검증하도록 모킹
const dbMutateMock = vi.fn();
vi.mock("@/lib/db-mutate", () => ({
  dbMutate: (...args: unknown[]) => dbMutateMock(...args),
}));

import { chargeCredits } from "@/lib/queries/credits";

/** /api/db/query 응답을 흉내내는 fetch 모킹 */
function mockProfileFetch(
  profile: { credit_balance?: number; total_credit_purchases?: number } | null,
) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data: profile ? [profile] : [] }),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("chargeCredits", () => {
  beforeEach(() => {
    dbMutateMock.mockReset();
    dbMutateMock.mockResolvedValue({ success: true, data: null });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("기존 잔액에 충전액을 더하고 누적 구매 횟수를 1 증가시킨다", async () => {
    const fetchMock = mockProfileFetch({
      credit_balance: 7,
      total_credit_purchases: 2,
    });

    const result = await chargeCredits({ userId: "user-1", amount: 10 });

    expect(result).toEqual({ success: true, newBalance: 17 });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("table=profiles&filter=id.eq.user-1"),
    );

    // 1번째 호출: profiles 갱신
    expect(dbMutateMock).toHaveBeenNthCalledWith(1, {
      table: "profiles",
      operation: "update",
      data: { credit_balance: 17, total_credit_purchases: 3 },
      filters: { id: "user-1" },
    });
  });

  it("프로필 컬럼이 비어 있으면 0 기준으로 계산한다 (첫 충전)", async () => {
    mockProfileFetch({});

    const result = await chargeCredits({ userId: "user-1", amount: 5 });

    expect(result).toEqual({ success: true, newBalance: 5 });
    expect(dbMutateMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: { credit_balance: 5, total_credit_purchases: 1 },
      }),
    );
  });

  it("charge 트랜잭션을 balance_after와 함께 기록한다", async () => {
    mockProfileFetch({ credit_balance: 3, total_credit_purchases: 0 });

    await chargeCredits({
      userId: "user-1",
      amount: 4,
      description: "관리자 수동 충전",
    });

    expect(dbMutateMock).toHaveBeenNthCalledWith(2, {
      table: "credit_transactions",
      operation: "insert",
      data: {
        user_id: "user-1",
        amount: 4,
        type: "charge",
        description: "관리자 수동 충전",
        balance_after: 7,
      },
    });
  });

  it("description 미지정 시 기본 문구를 사용한다", async () => {
    mockProfileFetch({ credit_balance: 0, total_credit_purchases: 0 });

    await chargeCredits({ userId: "user-1", amount: 1 });

    expect(dbMutateMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({ description: "크레딧 충전" }),
      }),
    );
  });

  it("잔액 조회가 네트워크 오류로 실패하면 DB를 건드리지 않고 중단한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    const result = await chargeCredits({ userId: "user-1", amount: 10 });

    expect(result).toEqual({ success: false });
    // 잔액을 0 기준으로 덮어쓰는 회귀 방지
    expect(dbMutateMock).not.toHaveBeenCalled();
  });

  it("프로필 갱신이 실패하면 트랜잭션을 기록하지 않는다", async () => {
    mockProfileFetch({ credit_balance: 7, total_credit_purchases: 2 });
    dbMutateMock.mockResolvedValueOnce({
      success: false,
      data: null,
      error: "update failed",
    });

    const result = await chargeCredits({ userId: "user-1", amount: 10 });

    expect(result).toEqual({ success: false });
    expect(dbMutateMock).toHaveBeenCalledTimes(1);
    expect(dbMutateMock.mock.calls[0][0]).toMatchObject({ table: "profiles" });
  });
});
