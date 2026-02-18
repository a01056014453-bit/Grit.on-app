"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Lock,
  Eye,
  Music,
  GraduationCap,
  ChevronRight,
  Search,
  Video,
  Shield,
  FileText,
  Pen,
  ArrowLeft,
} from "lucide-react";
import { motion, Variants } from "framer-motion";
import { mockRooms } from "@/data/mock-schools";
import { isRoomJoined, getUserMembership } from "@/lib/room-store";
import { SCHOOL_TYPE_LABELS, SCHOOL_TYPE_COLORS } from "@/types";
import { cn } from "@/lib/utils";
import GradientText from "@/components/reactbits/GradientText";

const categories = ["전체", "서울대", "한예종", "연세대", "이화여대"];

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
    transition: { delay: i * 0.04, duration: 0.4, ease: "easeOut" },
  }),
};

function SpotlightCard({
  children,
  className = "",
  href,
}: {
  children: React.ReactNode;
  className?: string;
  href: string;
}) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    },
    []
  );

  return (
    <Link
      ref={cardRef}
      href={href}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered && (
        <div
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(200px circle at ${mousePos.x}px ${mousePos.y}px, rgba(139,92,246,0.12), transparent 60%)`,
          }}
        />
      )}
      <div className="relative z-10 flex items-center gap-3 w-full">
        {children}
      </div>
    </Link>
  );
}

export default function RoomsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // 참여 중인 룸 확인
  const roomsWithStatus = useMemo(() => {
    return mockRooms.map((room) => {
      const isJoined = isRoomJoined(room.id);
      const membership = getUserMembership(room.id);
      const hasUploaded =
        membership &&
        (membership.uploadedPieceIds.length > 0 ||
          membership.uploadedPieces.length > 0);

      return {
        ...room,
        isJoined,
        hasUploaded,
      };
    });
  }, []);

  const filteredRooms = roomsWithStatus.filter((room) => {
    const categoryMatch =
      selectedCategory === "전체" ||
      room.school.shortName === selectedCategory;
    const searchMatch =
      room.school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.school.shortName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  const myRooms = roomsWithStatus.filter((room) => room.isJoined);

  const titleText = "입시 룸";

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
          <h1 className="text-lg font-bold text-gray-900 flex">
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
          <motion.p
            className="text-xs text-gray-500"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            영상을 올리고 다른 학생의 연습을 참고하세요
          </motion.p>
        </div>
        <motion.div
          className="relative w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <GraduationCap className="w-5 h-5 text-white" />
          </motion.div>
        </motion.div>
      </div>

      {/* Upload-to-View Info Card */}
      <motion.div
        className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 mb-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md shadow-violet-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <GradientText
              className="!mx-0 text-sm font-bold"
              colors={["#7C3AED", "#A855F7", "#6D28D9"]}
              animationSpeed={6}
            >
              동일곡 상호열람 시스템
            </GradientText>
            <p className="text-xs text-gray-500 leading-relaxed mt-1.5">
              같은 곡을 업로드한 학생들끼리 서로의 영상을 볼 수 있어요.
              내가 연습하는 곡을 올려 다른 학생들의 연습을 참고하세요.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <Lock className="w-3 h-3" />
                익명/블러
              </span>
              <span className="flex items-center gap-1 text-[11px] text-red-400">
                <Eye className="w-3 h-3" />
                녹화/캡쳐 차단
              </span>
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <Shield className="w-3 h-3" />
                DRM 보호
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* My Rooms - Horizontal Scroll */}
      {myRooms.length > 0 && (
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <span className="inline-block font-bold text-sm text-violet-700 bg-violet-100/60 backdrop-blur-sm px-3.5 py-1 rounded-full mb-3">
            내가 참여 중인 룸
          </span>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {myRooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.3 + index * 0.08,
                  duration: 0.4,
                  ease: "easeOut",
                }}
              >
                <Link
                  href={`/rooms/${room.school.id}`}
                  className="shrink-0 w-[150px] block bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 p-3 hover:bg-white/80 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-violet-100/70 flex items-center justify-center">
                      <Music className="w-3.5 h-3.5 text-violet-600" />
                    </div>
                    {room.hasUploaded ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100/80 text-green-700 font-medium">
                        열람 가능
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100/80 text-amber-700 font-medium">
                        업로드 필요
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-gray-900 line-clamp-1">
                    {room.school.name} {room.school.year}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded font-medium",
                        SCHOOL_TYPE_COLORS[room.school.type]
                      )}
                    >
                      {SCHOOL_TYPE_LABELS[room.school.type]}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {room.memberCount}명
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Search Bar */}
      <motion.div
        className="relative mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        <motion.div
          animate={{ scale: isSearchFocused ? 1.02 : 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
          <input
            type="text"
            placeholder="학교 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-white/30 bg-white/40 backdrop-blur-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300/40 placeholder:text-gray-400 shadow-sm"
          />
        </motion.div>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === category
                ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-sm shadow-violet-500/20"
                : "bg-white/40 backdrop-blur-sm text-gray-500 hover:bg-white/60 border border-white/30"
            }`}
          >
            {category}
          </button>
        ))}
      </motion.div>

      {/* Rooms List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
      >
        <span className="inline-block font-bold text-sm text-violet-700 bg-violet-100/60 backdrop-blur-sm px-3.5 py-1 rounded-full mb-3">
          모든 룸 ({filteredRooms.length})
        </span>

        {filteredRooms.length === 0 ? (
          <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/30">
            <GraduationCap className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">검색 결과가 없습니다</p>
          </div>
        ) : (
          <motion.div
            className="bg-white/40 backdrop-blur-xl rounded-3xl border border-white/50 shadow-sm overflow-hidden"
            variants={listContainer}
            initial="hidden"
            animate="show"
          >
            {filteredRooms.map((room, index) => (
              <motion.div key={room.id} variants={listItem}>
                <SpotlightCard
                  href={`/rooms/${room.school.id}`}
                  className={`flex items-center gap-3 px-4 py-3.5 hover:bg-white/30 transition-colors ${
                    index !== filteredRooms.length - 1
                      ? "border-b border-white/30"
                      : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {room.school.name} {room.school.year}
                      </h3>
                      {room.isJoined && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100/70 text-violet-600 font-medium">
                          참여 중
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 font-medium",
                          SCHOOL_TYPE_COLORS[room.school.type]
                        )}
                      >
                        {room.school.type === "designated" ? (
                          <FileText className="w-2.5 h-2.5" />
                        ) : (
                          <Pen className="w-2.5 h-2.5" />
                        )}
                        {SCHOOL_TYPE_LABELS[room.school.type]}
                      </span>
                      {room.school.type === "designated" &&
                        room.school.designatedPieces && (
                          <span className="text-[10px] text-gray-400">
                            {room.school.designatedPieces.length}곡 지정
                          </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {room.memberCount}명
                      </span>
                      <span className="flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        {room.videoCount}개
                      </span>
                      <span className="text-violet-500 font-medium">
                        마감{" "}
                        {new Date(room.school.deadline).toLocaleDateString(
                          "ko-KR",
                          { month: "numeric", day: "numeric" }
                        )}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                </SpotlightCard>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Create Room CTA */}
      <motion.div
        className="mt-6 bg-white/30 backdrop-blur-sm rounded-2xl p-5 border border-white/30"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.4 }}
      >
        <p className="text-sm text-gray-900 font-semibold mb-1">
          원하는 룸이 없나요?
        </p>
        <p className="text-xs text-gray-500 mb-4">
          새로운 입시 룸을 만들어 같은 목표를 가진 학생들과 함께하세요.
        </p>
        <motion.button
          className="group/btn relative w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium text-sm overflow-hidden transition-all"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
          <span className="relative z-10">새 룸 만들기</span>
        </motion.button>
      </motion.div>
    </div>
  );
}
