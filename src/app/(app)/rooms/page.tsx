"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import { mockRooms } from "@/data/mock-schools";
import { isRoomJoined, getUserMembership } from "@/lib/room-store";
import { SCHOOL_TYPE_LABELS, SCHOOL_TYPE_COLORS } from "@/types";
import { cn } from "@/lib/utils";

const categories = ["전체", "서울대", "한예종", "연세대", "이화여대"];

export default function RoomsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");

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
      room.school.shortName.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  const myRooms = roomsWithStatus.filter((room) => room.isJoined);

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-primary" />
          입시 룸
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          영상을 올리고 다른 학생들의 연습을 참고하세요
        </p>
      </div>

      {/* Upload-to-View Info */}
      <div className="bg-gradient-to-br from-violet-500/10 to-primary/10 rounded-xl border border-primary/20 p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-primary flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">
              동일곡 상호열람 시스템
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              같은 곡을 업로드한 학생들끼리 서로의 영상을 볼 수 있어요. 내가
              연습하는 곡을 올려 다른 학생들의 연습을 참고하세요.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3" />
                익명/블러
              </span>
              <span className="flex items-center gap-1 text-red-500">
                <Eye className="w-3 h-3" />
                녹화/캡쳐 차단
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                DRM 보호
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* My Rooms */}
      {myRooms.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            내가 참여 중인 룸
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {myRooms.map((room) => (
              <Link
                key={room.id}
                href={`/rooms/${room.school.id}`}
                className="shrink-0 w-44 bg-card rounded-xl border border-border p-3 hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Music className="w-4 h-4 text-primary" />
                  </div>
                  {room.hasUploaded ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                      열람 가능
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      업로드 필요
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-foreground line-clamp-1">
                  {room.school.name} {room.school.year}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded",
                      SCHOOL_TYPE_COLORS[room.school.type]
                    )}
                  >
                    {SCHOOL_TYPE_LABELS[room.school.type]}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {room.memberCount}명
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="학교 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === category
                ? "bg-primary text-white"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Rooms List */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          모든 룸 ({filteredRooms.length})
        </h2>

        {filteredRooms.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <GraduationCap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">검색 결과가 없습니다</p>
          </div>
        ) : (
          filteredRooms.map((room) => (
            <Link
              key={room.id}
              href={`/rooms/${room.school.id}`}
              className="block bg-card rounded-xl p-4 border border-border hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">
                      {room.school.name} {room.school.year}
                    </h3>
                    {room.isJoined && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                        참여 중
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1",
                        SCHOOL_TYPE_COLORS[room.school.type]
                      )}
                    >
                      {room.school.type === "designated" ? (
                        <FileText className="w-3 h-3" />
                      ) : (
                        <Pen className="w-3 h-3" />
                      )}
                      {SCHOOL_TYPE_LABELS[room.school.type]}
                    </span>
                    {room.school.type === "designated" &&
                      room.school.designatedPieces && (
                        <span className="text-[10px] text-muted-foreground">
                          {room.school.designatedPieces.length}곡 지정
                        </span>
                      )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {room.memberCount}명
                    </span>
                    <span className="flex items-center gap-1">
                      <Video className="w-3 h-3" />
                      {room.videoCount}개
                    </span>
                    <span className="text-primary">
                      마감{" "}
                      {new Date(room.school.deadline).toLocaleDateString(
                        "ko-KR",
                        { month: "short", day: "numeric" }
                      )}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Create Room CTA */}
      <div className="mt-6 p-4 bg-secondary/50 rounded-xl border border-border">
        <p className="text-sm text-foreground font-medium mb-1">
          원하는 룸이 없나요?
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          새로운 입시 룸을 만들어 같은 목표를 가진 학생들과 함께하세요.
        </p>
        <button className="w-full py-3 rounded-xl border border-primary text-primary font-medium text-sm hover:bg-primary/5 transition-colors">
          새 룸 만들기
        </button>
      </div>
    </div>
  );
}
