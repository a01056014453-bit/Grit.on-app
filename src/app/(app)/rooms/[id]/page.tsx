"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Lock,
  Unlock,
  ThumbsUp,
  Play,
  Users,
  Video,
  Music,
  Flag,
  Shield,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  X,
  FileText,
  Pen,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { VideoProtection } from "@/components/app/video-protection";
import { UploadDesignatedModal, UploadFreeModal } from "@/components/rooms";
import {
  getSchoolById,
  getRoomBySchoolId,
  getVideosByRoomId,
} from "@/data/mock-schools";
import {
  getUserMembership,
  saveUserUpload,
  joinRoom,
} from "@/lib/room-store";
import { groupVideosByPiece, type PieceGroup } from "@/lib/room-access";
import type {
  School,
  Room,
  RoomVideo,
  RoomMembership,
  DesignatedPiece,
  FreePiece,
} from "@/types";
import { SCHOOL_TYPE_LABELS, SCHOOL_TYPE_COLORS } from "@/types";
import { cn } from "@/lib/utils";

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  );

  if (diffHours < 1) return "방금 전";
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffHours < 48) return "어제";
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function getDaysUntilDeadline(deadline: string): number {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  return Math.ceil(
    (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const schoolId = params.id as string;

  const [school, setSchool] = useState<School | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [videos, setVideos] = useState<RoomVideo[]>([]);
  const [membership, setMembership] = useState<RoomMembership | null>(null);
  const [pieceGroups, setPieceGroups] = useState<PieceGroup[]>([]);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<RoomVideo | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"recent" | "helpful">("recent");

  // 데이터 로드
  useEffect(() => {
    const loadData = () => {
      const schoolData = getSchoolById(schoolId);
      if (!schoolData) {
        router.push("/rooms");
        return;
      }

      const roomData = getRoomBySchoolId(schoolId);
      if (!roomData) {
        router.push("/rooms");
        return;
      }

      setSchool(schoolData);
      setRoom(roomData);

      // 룸 참여 처리
      joinRoom(roomData.id);

      const videoData = getVideosByRoomId(roomData.id);
      setVideos(videoData);

      const membershipData = getUserMembership(roomData.id);
      setMembership(membershipData);

      // 곡별 그룹핑
      const groups = groupVideosByPiece(videoData, membershipData, schoolData);
      setPieceGroups(groups);

      // 열람 가능한 그룹은 기본 펼침
      const expanded = new Set<string>();
      groups.forEach((g) => {
        if (g.canView) {
          expanded.add(g.pieceId ?? `${g.piece.composer}-${g.piece.title}`);
        }
      });
      setExpandedGroups(expanded);
    };

    loadData();
  }, [schoolId, router]);

  // 업로드 핸들러
  const handleUploadDesignated = (
    pieceId: string,
    piece: DesignatedPiece
  ) => {
    if (!room || !school) return;

    const newVideo: RoomVideo = {
      id: `v-${Date.now()}`,
      roomId: room.id,
      userId: "current-user",
      userName: `익명 #${Math.floor(Math.random() * 1000)}`,
      pieceId,
      piece: {
        composer: piece.composer,
        title: piece.title,
      },
      section: "전곡",
      duration: 300,
      uploadedAt: new Date().toISOString(),
      helpfulCount: 0,
      tags: [],
      faceBlurred: true,
    };

    saveUserUpload(room.id, newVideo, pieceId, undefined);

    // 상태 업데이트
    const updatedVideos = [...videos, newVideo];
    setVideos(updatedVideos);

    const updatedMembership = getUserMembership(room.id);
    setMembership(updatedMembership);

    const groups = groupVideosByPiece(updatedVideos, updatedMembership, school);
    setPieceGroups(groups);

    // 새로 업로드한 곡 그룹 펼치기
    setExpandedGroups((prev) => new Set([...prev, pieceId]));
  };

  const handleUploadFree = (piece: FreePiece) => {
    if (!room || !school) return;

    const newVideo: RoomVideo = {
      id: `v-${Date.now()}`,
      roomId: room.id,
      userId: "current-user",
      userName: `익명 #${Math.floor(Math.random() * 1000)}`,
      piece: {
        composer: piece.composer,
        title: piece.title,
      },
      section: "전곡",
      duration: 300,
      uploadedAt: new Date().toISOString(),
      helpfulCount: 0,
      tags: [],
      faceBlurred: true,
    };

    saveUserUpload(room.id, newVideo, undefined, piece);

    // 상태 업데이트
    const updatedVideos = [...videos, newVideo];
    setVideos(updatedVideos);

    const updatedMembership = getUserMembership(room.id);
    setMembership(updatedMembership);

    const groups = groupVideosByPiece(updatedVideos, updatedMembership, school);
    setPieceGroups(groups);

    // 새로 업로드한 곡 그룹 펼치기
    const groupKey = `${piece.composer.toLowerCase().replace(/\s+/g, "")}-${piece.title.toLowerCase().replace(/\s+/g, "")}`;
    setExpandedGroups((prev) => new Set([...prev, groupKey]));
  };

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const handleUploadForPiece = (group: PieceGroup) => {
    setShowUploadModal(true);
  };

  if (!school || !room) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
        <div className="animate-pulse">
          <div className="h-10 bg-secondary rounded-xl mb-4" />
          <div className="h-24 bg-secondary rounded-xl mb-4" />
          <div className="h-48 bg-secondary rounded-xl" />
        </div>
      </div>
    );
  }

  const rules = [
    "30초 이상의 연습 영상만 업로드 가능",
    "얼굴 블러 처리 권장",
    "다른 학생 비방/비난 금지",
    "영상 다운로드/캡처/공유 금지",
  ];

  const daysUntilDeadline = getDaysUntilDeadline(school.deadline);
  const hasAnyUpload =
    membership &&
    (membership.uploadedPieceIds.length > 0 ||
      membership.uploadedPieces.length > 0);

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
          <h1 className="text-lg font-bold text-foreground">
            {school.name} {school.year}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1",
                SCHOOL_TYPE_COLORS[school.type]
              )}
            >
              {school.type === "designated" ? (
                <FileText className="w-3 h-3" />
              ) : (
                <Pen className="w-3 h-3" />
              )}
              {SCHOOL_TYPE_LABELS[school.type]}
            </span>
            {school.type === "designated" && school.designatedPieces && (
              <span className="text-xs text-muted-foreground">
                {school.designatedPieces.length}곡 지정
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowRulesModal(true)}
          className="text-muted-foreground hover:text-foreground"
        >
          <Shield className="w-5 h-5" />
        </button>
      </div>

      {/* Room Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <Users className="w-5 h-5 text-primary mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">
            {room.memberCount}
          </div>
          <div className="text-[10px] text-muted-foreground">참여자</div>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <Video className="w-5 h-5 text-violet-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">
            {videos.length}
          </div>
          <div className="text-[10px] text-muted-foreground">영상</div>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <Music className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">
            D-{daysUntilDeadline}
          </div>
          <div className="text-[10px] text-muted-foreground">마감</div>
        </div>
      </div>

      {/* Upload CTA */}
      {!hasAnyUpload ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-amber-800 mb-1">
                곡을 업로드해야 열람할 수 있어요
              </p>
              <p className="text-xs text-amber-700 mb-3">
                같은 곡을 업로드한 학생들끼리 서로의 영상을 볼 수 있어요.
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="w-full py-3 rounded-xl bg-amber-600 text-white font-medium flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />내 영상 업로드하기
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowUploadModal(true)}
          className="w-full mb-4 py-3 rounded-xl border border-primary text-primary font-medium flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
        >
          <Upload className="w-4 h-4" />새 영상 업로드
        </button>
      )}

      {/* Videos by Piece */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">
            연습 영상 ({videos.length})
          </h2>
          <div className="flex gap-1">
            <button
              onClick={() => setSortBy("recent")}
              className={`px-2 py-1 rounded-lg text-xs ${
                sortBy === "recent"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              최신순
            </button>
            <button
              onClick={() => setSortBy("helpful")}
              className={`px-2 py-1 rounded-lg text-xs ${
                sortBy === "helpful"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              도움순
            </button>
          </div>
        </div>

        {/* Piece Groups */}
        <div className="space-y-3">
          {pieceGroups.map((group) => {
            const groupKey =
              group.pieceId ??
              `${group.piece.composer.toLowerCase().replace(/\s+/g, "")}-${group.piece.title.toLowerCase().replace(/\s+/g, "")}`;
            const isExpanded = expandedGroups.has(groupKey);

            const sortedVideos = [...group.videos].sort((a, b) => {
              if (sortBy === "helpful") {
                return b.helpfulCount - a.helpfulCount;
              }
              return (
                new Date(b.uploadedAt).getTime() -
                new Date(a.uploadedAt).getTime()
              );
            });

            return (
              <div
                key={groupKey}
                className="bg-card rounded-xl border border-border overflow-hidden"
              >
                {/* Group Header */}
                <button
                  onClick={() => group.canView && toggleGroup(groupKey)}
                  className={cn(
                    "w-full p-4 flex items-center gap-3 text-left",
                    group.canView && "hover:bg-secondary/50"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      group.canView ? "bg-green-100" : "bg-secondary"
                    )}
                  >
                    {group.canView ? (
                      <Unlock className="w-4 h-4 text-green-600" />
                    ) : (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {group.piece.fullName ??
                        `${group.piece.composer} - ${group.piece.title}`}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {group.uploaderCount}명
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        {group.videos.length}개
                      </span>
                      {group.piece.category && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                          {group.piece.category}
                        </span>
                      )}
                    </div>
                  </div>
                  {group.canView ? (
                    isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )
                  ) : (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                      업로드 시 열람
                    </span>
                  )}
                </button>

                {/* Videos */}
                {group.canView && isExpanded && (
                  <div className="border-t border-border">
                    {sortedVideos.map((video) => (
                      <div
                        key={video.id}
                        className="p-4 border-b border-border last:border-b-0 hover:bg-secondary/30 cursor-pointer"
                        onClick={() => setSelectedVideo(video)}
                      >
                        <div className="flex gap-3">
                          {/* Thumbnail */}
                          <div className="w-20 h-14 bg-gradient-to-br from-primary/20 to-violet-500/20 rounded-lg flex items-center justify-center relative shrink-0">
                            <Play className="w-5 h-5 text-primary" />
                            <span className="absolute bottom-1 right-1 text-[10px] px-1 bg-black/60 text-white rounded">
                              {formatDuration(video.duration)}
                            </span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-foreground">
                                {video.userName}
                              </span>
                              {video.faceBlurred && (
                                <span className="text-[10px] px-1 py-0.5 rounded bg-secondary text-muted-foreground">
                                  블러
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-primary font-mono mb-1">
                              {video.section}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="w-3 h-3" />
                                {video.helpfulCount}
                              </span>
                              <span>{formatDate(video.uploadedAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Locked State */}
                {!group.canView && (
                  <div className="border-t border-border p-4 bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">
                          이 곡을 업로드하면 {group.uploaderCount}명의 영상을 볼
                          수 있어요
                        </p>
                      </div>
                      <button
                        onClick={() => handleUploadForPiece(group)}
                        className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        업로드
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {pieceGroups.length === 0 && (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Video className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">
                아직 업로드된 영상이 없어요
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                첫 번째로 영상을 올려보세요!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Video Player Modal with Protection */}
      {selectedVideo && (
        <VideoProtection onViolation={() => setSelectedVideo(null)}>
          <div className="fixed inset-0 bg-black z-50">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-4 flex items-center justify-between">
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="text-white"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs">
                    <Shield className="w-3 h-3" />
                    녹화 감지 중
                  </div>
                  <button className="text-white/70 hover:text-white">
                    <Flag className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Video */}
              <div className="flex-1 flex items-center justify-center relative">
                <div className="w-full aspect-video bg-gray-900 flex items-center justify-center relative">
                  <video
                    className="w-full h-full object-contain"
                    controls
                    controlsList="nodownload noplaybackrate"
                    disablePictureInPicture
                    playsInline
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <source src="/sample-video.mp4" type="video/mp4" />
                  </video>

                  {/* Watermarks */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white/[0.07] text-4xl font-bold rotate-[-30deg] select-none whitespace-nowrap">
                        Grit.on 학습용
                      </div>
                    </div>
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-4 p-8">
                      {[...Array(9)].map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-center"
                        >
                          <span className="text-white/[0.03] text-sm rotate-[-30deg] select-none">
                            {new Date().toLocaleDateString()} · 학습용
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-400" />
                        <span className="text-white/70 text-xs">DRM 보호</span>
                      </div>
                      <span className="text-white/50 text-xs">
                        {new Date().toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="absolute bottom-12 left-0 right-0 pointer-events-none">
                    <div className="flex items-center justify-center gap-2 py-2 bg-red-500/10">
                      <AlertTriangle className="w-3 h-3 text-red-400" />
                      <span className="text-red-400/80 text-[10px]">
                        화면 녹화·캡쳐·공유 금지 | 위반 시 계정 정지 및 법적 책임
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info & Actions */}
              <div className="p-4 bg-gray-900 border-t border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white font-medium">
                      {selectedVideo.userName}
                    </p>
                    <p className="text-white/60 text-sm">
                      {selectedVideo.piece.composer} - {selectedVideo.piece.title}
                    </p>
                    <p className="text-white/40 text-xs mt-0.5">
                      {selectedVideo.section}
                    </p>
                  </div>
                  <button className="px-4 py-2 rounded-xl bg-primary text-white flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4" />
                    도움 됨
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 p-2 bg-white/5 rounded-lg">
                  <Shield className="w-4 h-4 text-white/40" />
                  <p className="text-white/40 text-xs">
                    본 영상은 저작권법에 의해 보호됩니다. 무단 복제 시 법적
                    처벌을 받을 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </VideoProtection>
      )}

      {/* Upload Modal - Designated */}
      {school.type === "designated" && (
        <UploadDesignatedModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          school={school}
          videos={videos}
          onUpload={handleUploadDesignated}
        />
      )}

      {/* Upload Modal - Free */}
      {school.type === "free" && (
        <UploadFreeModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          school={school}
          videos={videos}
          onUpload={handleUploadFree}
        />
      )}

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full">
            <div className="text-center mb-4">
              <Shield className="w-12 h-12 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground">룸 규칙</h3>
            </div>

            <div className="space-y-3 mb-6">
              {rules.map((rule, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{rule}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full py-3 rounded-xl bg-primary text-white font-medium"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
