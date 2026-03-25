"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { safeBack } from "@/lib/navigation";
import {
  ArrowLeft,
  Coins,
  Crown,
  Zap,
  Gift,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import { getUserId } from "@/lib/user-id";

const CREDIT_PACKAGES = [
  { amount: 1, price: 1000, label: "1크레딧" },
  { amount: 3, price: 3000, label: "3크레딧", popular: false },
  { amount: 5, price: 5000, label: "5크레딧", popular: true },
  { amount: 10, price: 10000, label: "10크레딧" },
];

const PRO_BENEFITS = [
  "매월 10크레딧 자동 지급",
  "보상 크레딧 1.5배",
  "보상 크레딧 유효기간 무제한",
  "AI 곡 분석 무제한",
  "상세 연습 리포트",
  "클라우드 백업",
];

export default function CreditsPage() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/credits/balance")
      .then((r) => r.json())
      .then((data) => {
        setBalance(data.balance ?? 0);
        setPlan(data.plan ?? "free");
        setTotalPurchases(data.totalPurchases ?? 0);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const [chargeMessage, setChargeMessage] = useState("");

  const handleCharge = async () => {
    setChargeMessage("결제 시스템을 준비 중입니다. 곧 이용 가능합니다!");
  };

  const handleProSubscribe = () => {
    setChargeMessage("Pro 구독 시스템을 준비 중입니다. 곧 이용 가능합니다!");
  };

  const showProBanner = totalPurchases >= 3 && plan === "free";

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => safeBack(router)}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">크레딧</h1>
          <p className="text-xs text-muted-foreground">충전 및 구독 관리</p>
        </div>
      </div>

      {/* 잔액 카드 */}
      <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 mb-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Coins className="w-5 h-5" />
          <span className="text-sm font-medium opacity-90">내 크레딧</span>
        </div>
        <div className="text-4xl font-bold mb-1">
          {isLoading ? "..." : balance}
        </div>
        <p className="text-sm opacity-75">
          {plan === "pro" ? "Pro 구독 중" : "Free 플랜"}
        </p>
      </div>

      {/* Pro 전환 배너 (3회 이상 구매자) */}
      {showProBanner && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200 mb-6">
          <div className="flex items-start gap-3">
            <Crown className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">
                Pro로 전환하면 더 저렴해요!
              </p>
              <p className="text-xs text-amber-700 mt-1">
                매달 크레딧을 구매하고 계시네요. Pro 구독(₩23,900/월)으로 매월 10크레딧 자동 지급!
                <span className="font-bold"> 41% 할인 효과</span>
              </p>
              <button
                onClick={handleProSubscribe}
                className="mt-3 px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-xl"
              >
                Pro 시작하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 크레딧 충전 */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          크레딧 충전
        </h2>
        <p className="text-xs text-muted-foreground mb-3">1크레딧 = ₩1,000</p>

        <div className="grid grid-cols-2 gap-3">
          {CREDIT_PACKAGES.map((pkg) => (
            <button
              key={pkg.amount}
              onClick={() => setSelectedPackage(pkg.amount)}
              className={`relative p-4 rounded-xl border text-left transition-all ${
                selectedPackage === pkg.amount
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-2 right-3 px-2 py-0.5 bg-primary text-white text-[10px] font-bold rounded-full">
                  인기
                </span>
              )}
              <p className="text-lg font-bold text-foreground">{pkg.label}</p>
              <p className="text-sm text-muted-foreground">
                ₩{pkg.price.toLocaleString()}
              </p>
            </button>
          ))}
        </div>

        {chargeMessage && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-700 text-center">{chargeMessage}</p>
          </div>
        )}

        {selectedPackage && (
          <button
            onClick={handleCharge}
            className="w-full mt-4 py-4 rounded-xl bg-primary text-white font-semibold"
          >
            {selectedPackage}크레딧 충전하기 (₩{(selectedPackage * 1000).toLocaleString()})
          </button>
        )}
      </div>

      {/* Pro 구독 */}
      {plan === "free" && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" />
            Pro 구독
          </h2>

          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-bold text-foreground">SEMPRE Pro</p>
                <p className="text-sm text-muted-foreground">매월 10크레딧 + 전용 혜택</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">₩23,900</p>
                <p className="text-[10px] text-muted-foreground">/월</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {PRO_BENEFITS.map((benefit) => (
                <div key={benefit} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-sm text-foreground">{benefit}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleProSubscribe}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold"
            >
              Pro 시작하기
            </button>
          </div>
        </div>
      )}

      {/* 크레딧 소비 단가 */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Gift className="w-4 h-4 text-primary" />
          크레딧 사용처
        </h2>
        <div className="bg-card rounded-xl border border-border divide-y divide-border">
          {[
            { name: "원포인트 레슨 피드백", cost: 2 },
            { name: "AI 곡 분석", cost: 1 },
            { name: "AI 연습 리포트", cost: 1 },
          ].map((item) => (
            <div key={item.name} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-foreground">{item.name}</span>
              <span className="text-sm font-bold text-primary">{item.cost}크레딧</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
