"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  AlertTriangle,
  X,
  FileText,
  Pen,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { VideoProtection } from "@/components/app/video-protection";
import {
  getSchoolById,
  getRoomBySchoolId,
  getVideosByRoomId,
} from "@/data/mock-schools";
import {
  getUserMembership,
  joinRoom,
} from "@/lib/room-store";
import { groupVideosByPiece, type PieceGroup } from "@/lib/room-access";
import type {
  School,
  Room,
  RoomVideo,
  RoomMembership,
} from "@/types";
import { SCHOOL_TYPE_LABELS, SCHOOL_TYPE_COLORS } from "@/types";
import { cn } from "@/lib/utils";

// Stagger animation variants
const listContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const listItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

// Blur-in text animation (per character)
const charVariants: Variants = {
  hidden: { opacity: 0, filter: "blur(8px)" },
  show: (i: number) => ({
    opacity: 1,
    filter: "blur(0px)",
    transition: { delay: i * 0.03, duration: 0.4, ease: "easeOut" },
  }),
};

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
  return date.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" }) + "일";
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

  if (!school || !room) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto min-h-screen bg-blob-violet">
        <div className="bg-blob-extra" />
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-white/20 rounded-xl" />
          <div className="h-24 bg-white/20 rounded-xl" />
          <div className="h-48 bg-white/20 rounded-xl" />
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

  const titleText = `${school.name} ${school.year}`;

  return (
    <div className="min-h-screen bg-blob-violet px-4 py-6 max-w-lg mx-auto pb-24">
      <div className="bg-blob-extra" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm border border-white/40 flex items-center justify-center hover:bg-white/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900 flex flex-wrap">
            {titleText.split("").map((char, i) => (
              <motion.span
                key={i}
                custom={i}
                variants={charVariants}
                initial="hidden"
                animate="show"
                className={char === " " ? "inline-block w-1.5" : ""}
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </h1>
          <motion.div
            className="flex items-center gap-2 mt-0.5"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 font-medium",
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
              <span className="text-xs text-gray-500">
                {school.designatedPieces.length}곡 지정
              </span>
            )}
          </motion.div>
        </div>
        <button
          onClick={() => setShowRulesModal(true)}
          className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm border border-white/40 flex items-center justify-center hover:bg-white/50 transition-colors"
        >
          <Shield className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Room Stats */}
      <motion.div
        className="grid grid-cols-3 gap-2.5 mb-5"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
      >
        <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-3.5 border border-white/50 text-center shadow-sm">
          <Users className="w-5 h-5 text-violet-500 mx-auto mb-1.5" />
          <div className="text-lg font-bold text-gray-900">
            {room.memberCount}
          </div>
          <div className="text-[10px] text-gray-400">참여자</div>
        </div>
        <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-3.5 border border-white/50 text-center shadow-sm">
          <Video className="w-5 h-5 text-purple-500 mx-auto mb-1.5" />
          <div className="text-lg font-bold text-gray-900">
            {videos.length}
          </div>
          <div className="text-[10px] text-gray-400">영상</div>
        </div>
        <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-3.5 border border-white/50 text-center shadow-sm">
          <Music className="w-5 h-5 text-amber-500 mx-auto mb-1.5" />
          <div className={cn(
            "text-lg font-bold",
            daysUntilDeadline <= 3 ? "text-red-500" : "text-gray-900"
          )}>
            D{daysUntilDeadline >= 0 ? `-${daysUntilDeadline}` : `+${Math.abs(daysUntilDeadline)}`}
          </div>
          <div className="text-[10px] text-gray-400">마감</div>
        </div>
      </motion.div>

      {/* Upload CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        {!hasAnyUpload ? (
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 mb-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm mb-1">
                  곡을 업로드해야 열람할 수 있어요
                </p>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                  같은 곡을 업로드한 학생들끼리 서로의 영상을 볼 수 있어요.
                </p>
                <Link href={`/rooms/${schoolId}/upload`}>
                  <motion.div
                    className="group/btn relative w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium text-sm flex items-center justify-center gap-2 overflow-hidden"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                    <Upload className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">내 영상 업로드하기</span>
                  </motion.div>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <Link href={`/rooms/${schoolId}/upload`}>
            <motion.div
              className="group/btn relative w-full mb-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium text-sm flex items-center justify-center gap-2 overflow-hidden shadow-sm shadow-violet-500/20"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
              <Upload className="w-4 h-4 relative z-10" />
              <span className="relative z-10">새 영상 업로드</span>
            </motion.div>
          </Link>
        )}
      </motion.div>

      {/* Videos by Piece */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="inline-block font-bold text-sm text-violet-700 bg-violet-100/60 backdrop-blur-sm px-3.5 py-1 rounded-full">
            연습 영상 ({videos.length})
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setSortBy("recent")}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                sortBy === "recent"
                  ? "bg-violet-100/70 text-violet-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              최신순
            </button>
            <button
              onClick={() => setSortBy("helpful")}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                sortBy === "helpful"
                  ? "bg-violet-100/70 text-violet-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              도움순
            </button>
          </div>
        </div>

        {/* Piece Groups */}
        <motion.div
          className="space-y-3"
          variants={listContainer}
          initial="hidden"
          animate="show"
        >
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
              <motion.div
                key={groupKey}
                variants={listItem}
                className="bg-white/40 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm overflow-hidden"
              >
                {/* Group Header */}
                <button
                  onClick={() => group.canView && toggleGroup(groupKey)}
                  className={cn(
                    "w-full p-4 flex items-center gap-3 text-left transition-colors",
                    group.canView && "hover:bg-white/30"
                  )}
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                      group.canView
                        ? "bg-green-100/80"
                        : "bg-white/40"
                    )}
                  >
                    {group.canView ? (
                      <Unlock className="w-4 h-4 text-green-600" />
                    ) : (
                      <Lock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {group.piece.fullName ??
                        `${group.piece.composer} - ${group.piece.title}`}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {group.uploaderCount}명
                      </span>
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        {group.videos.length}개
                      </span>
                      {group.piece.category && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100/60 text-violet-600 font-medium">
                          {group.piece.category}
                        </span>
                      )}
                    </div>
                  </div>
                  {group.canView ? (
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    </motion.div>
                  ) : (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-amber-100/80 text-amber-700 font-medium whitespace-nowrap">
                      업로드 시 열람
                    </span>
                  )}
                </button>

                {/* Videos */}
                <AnimatePresence>
                  {group.canView && isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/30">
                        {sortedVideos.map((video, vIdx) => (
                          <motion.div
                            key={video.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: vIdx * 0.05, duration: 0.25 }}
                            className={cn(
                              "p-4 hover:bg-white/20 cursor-pointer transition-colors",
                              vIdx !== sortedVideos.length - 1 && "border-b border-white/20"
                            )}
                            onClick={() => setSelectedVideo(video)}
                          >
                            <div className="flex gap-3">
                              {/* Thumbnail */}
                              <div className="w-20 h-14 bg-gradient-to-br from-violet-200/60 to-purple-200/60 rounded-xl flex items-center justify-center relative shrink-0 overflow-hidden">
                                <Play className="w-5 h-5 text-violet-600" />
                                <span className="absolute bottom-1 right-1 text-[9px] px-1 py-0.5 bg-black/50 backdrop-blur-sm text-white rounded-md font-medium">
                                  {formatDuration(video.duration)}
                                </span>
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-sm font-semibold text-gray-900">
                                    {video.userName}
                                  </span>
                                  {video.faceBlurred && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-100/60 text-violet-500 font-medium">
                                      블러
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-violet-600 font-medium mb-1">
                                  {video.section}
                                </p>
                                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <ThumbsUp className="w-3 h-3" />
                                    {video.helpfulCount}
                                  </span>
                                  <span>{formatDate(video.uploadedAt)}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Locked State */}
                {!group.canView && (
                  <div className="border-t border-white/20 p-4 bg-white/10">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">
                          이 곡을 업로드하면 {group.uploaderCount}명의 영상을 볼
                          수 있어요
                        </p>
                      </div>
                      <Link
                        href={`/rooms/${schoolId}/upload`}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-medium flex items-center gap-1 shadow-sm shadow-violet-500/20"
                      >
                        <Upload className="w-3 h-3" />
                        업로드
                      </Link>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}

          {pieceGroups.length === 0 && (
            <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/30">
              <Video className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                아직 업로드된 영상이 없어요
              </p>
              <p className="text-gray-400 text-xs mt-1">
                첫 번째로 영상을 올려보세요!
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Video Player Modal with Protection */}
      <AnimatePresence>
        {selectedVideo && (
          <VideoProtection onViolation={() => setSelectedVideo(null)}>
            <motion.div
              className="fixed inset-0 bg-black z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className="p-4 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedVideo(null)}
                    className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
                      <Shield className="w-3 h-3" />
                      녹화 감지 중
                    </div>
                    <button className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                      <Flag className="w-4 h-4 text-white/70" />
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
                          Sempre 학습용
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
                      <p className="text-white font-semibold">
                        {selectedVideo.userName}
                      </p>
                      <p className="text-white/60 text-sm">
                        {selectedVideo.piece.composer} - {selectedVideo.piece.title}
                      </p>
                      <p className="text-white/40 text-xs mt-0.5">
                        {selectedVideo.section}
                      </p>
                    </div>
                    <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-medium flex items-center gap-2 shadow-lg shadow-violet-500/30">
                      <ThumbsUp className="w-4 h-4" />
                      도움 됨
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-2 p-2.5 bg-white/5 rounded-xl">
                    <Shield className="w-4 h-4 text-white/40" />
                    <p className="text-white/40 text-xs">
                      본 영상은 저작권법에 의해 보호됩니다. 무단 복제 시 법적 처벌을
                      받을 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </VideoProtection>
        )}
      </AnimatePresence>

      {/* Rules Modal */}
      <AnimatePresence>
        {showRulesModal && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-violet-500/30">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">룸 규칙</h3>
              </div>

              <div className="space-y-3 mb-6">
                {rules.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-600">{rule}</p>
                  </div>
                ))}
              </div>

              <motion.button
                onClick={() => setShowRulesModal(false)}
                className="group/btn relative w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium overflow-hidden"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                <span className="relative z-10">확인</span>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
