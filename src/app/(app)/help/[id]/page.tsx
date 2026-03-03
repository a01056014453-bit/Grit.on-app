"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { safeBack } from "@/lib/navigation";
import { getUserId } from "@/lib/user-id";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Pause,
  Clock,
  Coins,
  MessageSquare,
  User,
  CheckCircle,
  Star,
  Music,
  Target,
  Lock,
  Send,
} from "lucide-react";
import type { HelpRequest, HelpProposal } from "@/types/help";
import { HELP_PROBLEM_TYPE_LABELS } from "@/types/help";

function getTimeRemaining(deadline: string) {
  const now = new Date();
  const end = new Date(deadline);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return null;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}일 ${hours % 24}시간`;
  }
  return `${hours}시간 ${minutes}분`;
}

export default function HelpRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;
  const userId = getUserId();

  const [request, setRequest] = useState<HelpRequest | null>(null);
  const [proposals, setProposals] = useState<HelpProposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/help-requests/${requestId}`);
        if (!res.ok) throw new Error("요청을 불러올 수 없습니다.");
        const data = await res.json();
        setRequest(data.request);
        setProposals(data.proposals ?? []);
      } catch (err) {
        console.error("[help/[id]] 로드 실패:", err);
        setLoadError(err instanceof Error ? err.message : "데이터를 불러올 수 없습니다.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [requestId]);

  if (isLoading) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto min-h-screen bg-blob-violet flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-violet-300 border-t-violet-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (loadError || !request) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto min-h-screen bg-blob-violet">
        <div className="bg-blob-extra" />
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <p className="text-muted-foreground">{loadError ?? "요청을 찾을 수 없습니다."}</p>
          <button
            onClick={() => router.push("/help")}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const timeRemaining = getTimeRemaining(request.deadline);
  const isDeadlinePassed = !timeRemaining;
  const isOwner = request.studentId === userId;
  const typeLabel = HELP_PROBLEM_TYPE_LABELS[request.problemType] ?? request.problemType;

  const handleAccept = (proposalId: string) => {
    setSelectedProposal(proposalId);
    setShowAcceptDialog(true);
  };

  const confirmAccept = async () => {
    if (!selectedProposal) return;
    setIsAccepting(true);

    try {
      const res = await fetch(`/api/help-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", proposalId: selectedProposal }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? "채택에 실패했습니다.");
      }

      setShowAcceptDialog(false);
      router.push("/practice");
    } catch (err) {
      console.error("[help/[id]] 채택 실패:", err);
      alert(err instanceof Error ? err.message : "채택에 실패했습니다.");
    } finally {
      setIsAccepting(false);
    }
  };

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
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">해결 요청</h1>
          <p className="text-xs text-muted-foreground">
            {request.status === "open" ? "모집 중" : request.status === "reviewing" ? "검토 중" : "완료"}
          </p>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700">
          <Coins className="w-4 h-4" />
          <span className="text-sm font-bold">{request.credit}</span>
        </div>
      </div>

      {/* Request Info */}
      <div className="bg-card rounded-xl border border-border p-4 mb-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Music className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-foreground">{request.composer}</h2>
            <p className="text-sm text-muted-foreground">{request.piece}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono">
                {request.measureStart}-{request.measureEnd} 마디
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                {typeLabel}
              </span>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3">{request.description}</p>

        {/* Video Player Placeholder */}
        {request.videoUrl && (
          <div className="relative bg-black rounded-xl overflow-hidden aspect-video mb-3">
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-white" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1" />
                )}
              </button>
            </div>
            {request.videoLength && (
              <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 text-white text-xs">
                {request.videoLength}초
              </div>
            )}
          </div>
        )}

        {/* Deadline / Status */}
        {timeRemaining ? (
          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl">
            <div className="flex items-center gap-2 text-primary">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">마감까지 {timeRemaining}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {proposals.length}개 제안 접수
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
            <div className="flex items-center gap-2 text-amber-700">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">모집 마감</span>
            </div>
            <span className="text-xs text-amber-600">
              {proposals.length}개 제안 검토 가능
            </span>
          </div>
        )}
      </div>

      {/* Expert Submit CTA (if not owner and deadline not passed) */}
      {!isOwner && !isDeadlinePassed && request.status === "open" && (
        <Link
          href={`/help/${request.id}/submit`}
          className="block w-full mb-4 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-primary text-white font-semibold text-center"
        >
          <Send className="w-5 h-5 inline mr-2" />
          해결 제안 제출하기
        </Link>
      )}

      {/* Proposals Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            제안 목록 ({proposals.length})
          </h3>
          {!isDeadlinePassed && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Lock className="w-3 h-3" />
              마감 후 공개
            </span>
          )}
        </div>

        {!isDeadlinePassed && !isOwner ? (
          // 마감 전 & 비소유자: 블라인드
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <Lock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">제안은 마감 후에 공개됩니다</p>
            <p className="text-xs text-muted-foreground mt-1">
              현재 {proposals.length}개의 제안이 접수되었습니다
            </p>
          </div>
        ) : proposals.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">아직 제안이 없습니다</p>
          </div>
        ) : (
          // 마감 후 or 소유자: 제안 목록 표시
          <div className="space-y-3">
            {proposals.map((proposal) => (
              <div
                key={proposal.id}
                className={`bg-card rounded-xl border p-4 transition-all ${
                  selectedProposal === proposal.id
                    ? "border-primary shadow-lg"
                    : request.acceptedProposalId === proposal.id
                      ? "border-green-500 bg-green-50/30"
                      : "border-border hover:border-primary/30"
                }`}
              >
                {/* Accepted Badge */}
                {request.acceptedProposalId === proposal.id && (
                  <div className="flex items-center gap-1 text-green-600 mb-2 text-xs font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    채택됨
                  </div>
                )}

                {/* Expert Info */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{proposal.expertName}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          proposal.expertBadge === "전문가"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {proposal.expertBadge}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          {proposal.trustScore}
                        </span>
                        <span>|</span>
                        <span>{proposal.completedCount}건 해결</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comments Preview */}
                <div className="space-y-2 mb-3">
                  {proposal.comments.slice(0, 2).map((comment, idx) => (
                    <div key={idx} className="bg-secondary/50 rounded-lg p-2">
                      <span className="text-xs font-mono text-primary">{comment.measure}마디</span>
                      <p className="text-sm text-muted-foreground line-clamp-2">{comment.text}</p>
                    </div>
                  ))}
                  {proposal.comments.length > 2 && (
                    <p className="text-xs text-muted-foreground">
                      +{proposal.comments.length - 2}개 더보기
                    </p>
                  )}
                </div>

                {/* Demo Video & Practice Card */}
                <div className="flex gap-2 mb-3">
                  <div className="flex-1 p-2 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <Play className="w-3 h-3" />
                      시연 영상
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {proposal.demoVideoLength ? `${proposal.demoVideoLength}초` : "-"}
                    </span>
                  </div>
                  <div className="flex-1 p-2 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <Target className="w-3 h-3" />
                      연습 카드
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {proposal.practiceCard.dailyTime ? `${proposal.practiceCard.dailyTime}/일` : "-"}
                    </span>
                  </div>
                </div>

                {/* Accept Button (for owner, when status is not closed) */}
                {isOwner && request.status !== "closed" && (
                  <button
                    onClick={() => handleAccept(proposal.id)}
                    className="w-full py-3 rounded-xl bg-primary text-white font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    이 제안 채택하기
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Accept Dialog */}
      {showAcceptDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">제안을 채택하시겠습니까?</h3>
              <p className="text-sm text-muted-foreground">
                채택한 제안의 연습 카드가 오늘의 연습 플랜에 자동으로 추가됩니다.
              </p>
            </div>

            <div className="bg-secondary/50 rounded-xl p-3 mb-4">
              <p className="text-xs text-muted-foreground mb-1">크레딧 분배</p>
              <div className="flex justify-between text-sm">
                <span>채택 보너스</span>
                <span className="text-primary font-bold">
                  {(request.credit * 0.7).toFixed(1)} 크레딧 지급
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowAcceptDialog(false)}
                disabled={isAccepting}
                className="flex-1 py-3 rounded-xl border border-border text-foreground font-medium"
              >
                취소
              </button>
              <button
                onClick={confirmAccept}
                disabled={isAccepting}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-medium disabled:opacity-50"
              >
                {isAccepting ? "처리 중..." : "채택하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
