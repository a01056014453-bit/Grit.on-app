"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Pause,
  Clock,
  Coins,
  MessageSquare,
  User,
  Award,
  CheckCircle,
  Star,
  Music,
  Target,
  ChevronRight,
  Lock,
  Send,
  ThumbsUp,
} from "lucide-react";

// Mock request data
const mockRequest = {
  id: "1",
  composer: "F. Chopin",
  piece: "Ballade No.1 Op.23",
  measures: "33-40",
  problemType: "양손 합",
  description: "왼손 아르페지오와 오른손 멜로디 타이밍이 안 맞아요. 특히 36마디에서 왼손이 빨라지면서 오른손 멜로디가 묻혀버립니다.",
  status: "reviewing", // open, reviewing, closed
  deadline: "2025-01-20T18:00:00",
  credit: 3,
  videoUrl: "/sample-video.mp4",
  videoLength: 45,
  createdAt: "2025-01-19T10:00:00",
  isAnonymous: true,
  studentName: "익명의 학생",
};

// Mock proposals (마감 후에만 보임)
const mockProposals = [
  {
    id: "p1",
    expertId: "e1",
    expertName: "김OO 선생님",
    expertBadge: "전문가",
    trustScore: 4.8,
    completedCount: 45,
    comments: [
      { measure: "33-34", text: "왼손이 선행하는 느낌으로 치세요. 오른손은 왼손 3번째 음과 함께 들어갑니다." },
      { measure: "35-36", text: "여기서 왼손 아르페지오가 빨라지는데, 메트로놈 없이 천천히 양손 따로 연습 후 합치세요." },
      { measure: "37-38", text: "크레센도 구간이니 왼손도 조금씩 세게, 하지만 오른손 멜로디가 항상 위에 있어야 해요." },
    ],
    demoVideoUrl: "/demo-video-1.mp4",
    demoVideoLength: 78,
    practiceCard: {
      section: "33-40마디",
      tempo: "♩= 40 → 60 → 목표템포",
      steps: ["양손 따로 느린 템포", "왼손 3번째 음에 오른손 맞추기", "점진적 템포 증가"],
      dailyTime: "15분",
    },
    submittedAt: "2025-01-19T14:30:00",
  },
  {
    id: "p2",
    expertId: "e2",
    expertName: "박OO",
    expertBadge: "상급생",
    trustScore: 4.5,
    completedCount: 12,
    comments: [
      { measure: "33-36", text: "왼손 첫 음을 페달과 함께 깊게 누르고, 나머지 음은 가볍게 굴리세요." },
      { measure: "36-40", text: "오른손 멜로디 음만 따로 연습해서 노래하듯이 익힌 후 양손 합치면 됩니다." },
    ],
    demoVideoUrl: "/demo-video-2.mp4",
    demoVideoLength: 65,
    practiceCard: {
      section: "33-40마디",
      tempo: "♩= 50 → 72",
      steps: ["멜로디만 노래하며 연습", "왼손 첫 음 강조", "양손 합"],
      dailyTime: "10분",
    },
    submittedAt: "2025-01-19T16:00:00",
  },
  {
    id: "p3",
    expertId: "e3",
    expertName: "이OO 교수",
    expertBadge: "전문가",
    trustScore: 4.9,
    completedCount: 128,
    comments: [
      { measure: "33", text: "시작 전 호흡을 하고, 왼손 베이스음(G)을 충분히 울린 후 오른손 진입." },
      { measure: "34-35", text: "왼손 아르페지오의 최고음이 오른손과 겹치지 않게, 최고음 직전에 오른손을 넣으세요." },
      { measure: "36-38", text: "이 구간은 '말하듯이' 연주하세요. 왼손은 반주, 오른손은 이야기하는 사람." },
    ],
    demoVideoUrl: "/demo-video-3.mp4",
    demoVideoLength: 88,
    practiceCard: {
      section: "33-40마디",
      tempo: "♩= 36 → 48 → 60 → 목표",
      steps: ["베이스음-멜로디 2성부만 연습", "아르페지오 추가", "표현과 다이나믹 추가"],
      dailyTime: "20분",
    },
    submittedAt: "2025-01-19T15:20:00",
  },
];

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);

  const request = mockRequest;
  const timeRemaining = getTimeRemaining(request.deadline);
  const isDeadlinePassed = !timeRemaining;
  const isOwner = true; // 실제로는 로그인 유저와 비교
  const isExpert = false; // 전문가 여부

  const handleAccept = (proposalId: string) => {
    setSelectedProposal(proposalId);
    setShowAcceptDialog(true);
  };

  const confirmAccept = () => {
    // TODO: 채택 API 호출
    alert("제안이 채택되었습니다! 연습 플랜에 추가되었습니다.");
    setShowAcceptDialog(false);
    router.push("/practice");
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
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
                {request.measures} 마디
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                {request.problemType}
              </span>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3">{request.description}</p>

        {/* Video Player Placeholder */}
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
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 text-white text-xs">
            {request.videoLength}초
          </div>
        </div>

        {/* Deadline / Status */}
        {timeRemaining ? (
          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl">
            <div className="flex items-center gap-2 text-primary">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">마감까지 {timeRemaining}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {mockProposals.length}개 제안 접수
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
            <div className="flex items-center gap-2 text-amber-700">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">모집 마감</span>
            </div>
            <span className="text-xs text-amber-600">
              {mockProposals.length}개 제안 검토 가능
            </span>
          </div>
        )}
      </div>

      {/* Expert Submit CTA (if not owner and deadline not passed) */}
      {!isOwner && !isDeadlinePassed && (
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
            제안 목록 ({mockProposals.length})
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
              현재 {mockProposals.length}개의 제안이 접수되었습니다
            </p>
          </div>
        ) : (
          // 마감 후 or 소유자: 제안 목록 표시
          <div className="space-y-3">
            {mockProposals.map((proposal) => (
              <div
                key={proposal.id}
                className={`bg-card rounded-xl border p-4 transition-all ${
                  selectedProposal === proposal.id
                    ? "border-primary shadow-lg"
                    : "border-border hover:border-primary/30"
                }`}
              >
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
                    <span className="text-sm font-medium text-foreground">{proposal.demoVideoLength}초</span>
                  </div>
                  <div className="flex-1 p-2 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <Target className="w-3 h-3" />
                      연습 카드
                    </div>
                    <span className="text-sm font-medium text-foreground">{proposal.practiceCard.dailyTime}/일</span>
                  </div>
                </div>

                {/* Accept Button (for owner) */}
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
                <span className="text-primary font-bold">2.1 크레딧 지급</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowAcceptDialog(false)}
                className="flex-1 py-3 rounded-xl border border-border text-foreground font-medium"
              >
                취소
              </button>
              <button
                onClick={confirmAccept}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-medium"
              >
                채택하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
