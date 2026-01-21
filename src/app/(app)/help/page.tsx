"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  Plus,
  Clock,
  CheckCircle,
  Users,
  Coins,
  Filter,
  ChevronRight,
  Play,
  Eye,
  MessageSquare,
} from "lucide-react";

// Mock data - 해결 요청 목록
const mockRequests = [
  {
    id: "1",
    composer: "F. Chopin",
    piece: "Ballade No.1 Op.23",
    measures: "33-40",
    problemType: "양손 합",
    description: "왼손 아르페지오와 오른손 멜로디 타이밍이 안 맞아요",
    status: "open", // open, reviewing, closed
    deadline: "2025-01-20T18:00:00",
    credit: 3,
    proposalCount: 2,
    maxProposals: 5,
    videoLength: 45,
    createdAt: "2025-01-19T10:00:00",
    isAnonymous: true,
  },
  {
    id: "2",
    composer: "L. v. Beethoven",
    piece: "Piano Sonata No.8 Op.13",
    measures: "1-10",
    problemType: "템포",
    description: "Grave 부분 점음표 리듬이 흐트러져요",
    status: "open",
    deadline: "2025-01-21T12:00:00",
    credit: 4,
    proposalCount: 0,
    maxProposals: 5,
    videoLength: 38,
    createdAt: "2025-01-19T08:00:00",
    isAnonymous: false,
  },
  {
    id: "3",
    composer: "C. Debussy",
    piece: "Clair de Lune",
    measures: "27-34",
    problemType: "페달",
    description: "아르페지오 구간 페달링이 탁해져요",
    status: "reviewing",
    deadline: "2025-01-19T20:00:00",
    credit: 3,
    proposalCount: 3,
    maxProposals: 3,
    videoLength: 52,
    createdAt: "2025-01-18T14:00:00",
    isAnonymous: true,
  },
  {
    id: "4",
    composer: "F. Liszt",
    piece: "La Campanella",
    measures: "45-52",
    problemType: "테크닉",
    description: "반복되는 높은음 트릴이 지쳐서 끝까지 못 쳐요",
    status: "closed",
    deadline: "2025-01-18T18:00:00",
    credit: 5,
    proposalCount: 4,
    maxProposals: 5,
    videoLength: 60,
    createdAt: "2025-01-17T09:00:00",
    isAnonymous: true,
    acceptedProposal: {
      expertName: "김OO 선생님",
      badge: "전문가",
    },
  },
];

const problemTypes = ["전체", "양손 합", "템포", "페달", "테크닉", "보이싱", "리듬"];

function getStatusBadge(status: string) {
  switch (status) {
    case "open":
      return { label: "모집 중", color: "bg-green-100 text-green-700" };
    case "reviewing":
      return { label: "검토 중", color: "bg-amber-100 text-amber-700" };
    case "closed":
      return { label: "완료", color: "bg-gray-100 text-gray-600" };
    default:
      return { label: "알 수 없음", color: "bg-gray-100 text-gray-600" };
  }
}

function getTimeRemaining(deadline: string) {
  const now = new Date();
  const end = new Date(deadline);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return "마감됨";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}일 남음`;
  }
  return `${hours}시간 ${minutes}분 남음`;
}

export default function HelpRequestPage() {
  const [filter, setFilter] = useState("전체");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "reviewing" | "closed">("all");

  const filteredRequests = mockRequests.filter((req) => {
    const typeMatch = filter === "전체" || req.problemType === filter;
    const statusMatch = statusFilter === "all" || req.status === statusFilter;
    return typeMatch && statusMatch;
  });

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-primary" />
          해결 요청
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          막히는 구간을 올리고 전문가의 해결책을 받아보세요
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <Users className="w-5 h-5 text-primary mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">24</div>
          <div className="text-[10px] text-muted-foreground">활동 전문가</div>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">156</div>
          <div className="text-[10px] text-muted-foreground">해결 완료</div>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">4.2h</div>
          <div className="text-[10px] text-muted-foreground">평균 응답</div>
        </div>
      </div>

      {/* New Request Button */}
      <Link
        href="/help/new"
        className="block w-full mb-6 py-4 rounded-xl bg-gradient-to-r from-primary to-violet-600 text-white font-semibold text-center shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
      >
        <Plus className="w-5 h-5 inline mr-2" />
        새 해결 요청 만들기
      </Link>

      {/* Filters */}
      <div className="mb-4">
        {/* Status Filter */}
        <div className="flex gap-2 mb-3">
          {[
            { value: "all", label: "전체" },
            { value: "open", label: "모집 중" },
            { value: "reviewing", label: "검토 중" },
            { value: "closed", label: "완료" },
          ].map((status) => (
            <button
              key={status.value}
              onClick={() => setStatusFilter(status.value as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === status.value
                  ? "bg-primary text-white"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>

        {/* Problem Type Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {problemTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filter === type
                  ? "bg-violet-100 text-violet-700"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Request List */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <HelpCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">해당하는 요청이 없습니다</p>
          </div>
        ) : (
          filteredRequests.map((request) => {
            const statusBadge = getStatusBadge(request.status);
            const timeRemaining = getTimeRemaining(request.deadline);

            return (
              <Link
                key={request.id}
                href={`/help/${request.id}`}
                className="block bg-card rounded-xl p-4 border border-border hover:border-primary/30 hover:shadow-sm transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
                      {request.problemType}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-600">
                    <Coins className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">{request.credit}</span>
                  </div>
                </div>

                {/* Content */}
                <h3 className="font-semibold text-foreground mb-1">
                  {request.composer} - {request.piece}
                </h3>
                <p className="text-sm text-primary font-mono mb-1">
                  {request.measures} 마디
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {request.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Play className="w-3.5 h-3.5" />
                      {request.videoLength}초
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {request.proposalCount}/{request.maxProposals}
                    </span>
                  </div>
                  {request.status === "open" ? (
                    <span className="text-primary font-medium">{timeRemaining}</span>
                  ) : request.status === "closed" && request.acceptedProposal ? (
                    <span className="text-green-600">
                      {request.acceptedProposal.expertName} 채택
                    </span>
                  ) : (
                    <span>마감됨</span>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* How It Works */}
      <div className="mt-8 bg-gradient-to-br from-primary/5 to-violet-500/5 rounded-xl border border-primary/10 p-4">
        <h3 className="font-semibold text-foreground mb-3">이용 방법</h3>
        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-foreground">문제 영상 업로드</p>
              <p className="text-xs text-muted-foreground">30-60초 영상과 문제 설명을 올려요</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-foreground">전문가 제안 받기</p>
              <p className="text-xs text-muted-foreground">마감까지 블라인드로 제안이 모여요</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
              3
            </div>
            <div>
              <p className="font-medium text-foreground">채택 & 연습</p>
              <p className="text-xs text-muted-foreground">최적의 제안을 채택하면 연습 플랜에 자동 추가!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
