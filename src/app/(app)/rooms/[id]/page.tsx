"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Lock,
  Eye,
  ThumbsUp,
  Play,
  Pause,
  Users,
  Video,
  Music,
  Filter,
  Flag,
  Shield,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  X,
} from "lucide-react";
import { VideoProtection } from "@/components/app/video-protection";

// Mock room data
const mockRoom = {
  id: "1",
  name: "서울대 피아노 2026",
  piece: "F. Chopin - Ballade No.1 Op.23",
  description: "서울대 음대 피아노과 2026학년도 입시 준비생들을 위한 공간입니다.",
  memberCount: 47,
  videoCount: 38,
  deadline: "2026-02-15",
  rules: [
    "30초 이상의 연습 영상만 업로드 가능",
    "얼굴 블러 처리 권장",
    "다른 학생 비방/비난 금지",
    "영상 다운로드/캡처/공유 금지",
  ],
};

// Mock videos
const mockVideos = [
  {
    id: "v1",
    userId: "u1",
    userName: "익명 #127",
    section: "1-36 마디",
    duration: 142,
    uploadedAt: "2025-01-19T14:00:00",
    helpfulCount: 12,
    thumbnail: null,
    tags: ["도입부", "제1주제"],
  },
  {
    id: "v2",
    userId: "u2",
    userName: "익명 #89",
    section: "37-67 마디",
    duration: 98,
    uploadedAt: "2025-01-19T12:00:00",
    helpfulCount: 8,
    thumbnail: null,
    tags: ["경과구", "발전부"],
  },
  {
    id: "v3",
    userId: "u3",
    userName: "익명 #203",
    section: "208-264 마디",
    duration: 115,
    uploadedAt: "2025-01-19T10:00:00",
    helpfulCount: 23,
    thumbnail: null,
    tags: ["코다", "Presto"],
  },
  {
    id: "v4",
    userId: "u4",
    userName: "익명 #156",
    section: "전곡",
    duration: 580,
    uploadedAt: "2025-01-18T20:00:00",
    helpfulCount: 45,
    thumbnail: null,
    tags: ["런스루"],
  },
  {
    id: "v5",
    userId: "u5",
    userName: "익명 #78",
    section: "68-105 마디",
    duration: 167,
    uploadedAt: "2025-01-18T16:00:00",
    helpfulCount: 15,
    thumbnail: null,
    tags: ["제2주제", "발전부"],
  },
];

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffHours < 1) return "방금 전";
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffHours < 48) return "어제";
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [hasUploaded, setHasUploaded] = useState(true); // 실제로는 서버에서 확인
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "helpful">("recent");

  const room = mockRoom;

  const sortedVideos = [...mockVideos].sort((a, b) => {
    if (sortBy === "helpful") {
      return b.helpfulCount - a.helpfulCount;
    }
    return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
  });

  const handleUpload = () => {
    setShowUploadModal(true);
  };

  const confirmUpload = () => {
    // TODO: 실제 업로드 로직
    setHasUploaded(true);
    setShowUploadModal(false);
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">{room.name}</h1>
          <p className="text-xs text-muted-foreground">{room.piece}</p>
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
          <div className="text-lg font-bold text-foreground">{room.memberCount}</div>
          <div className="text-[10px] text-muted-foreground">참여자</div>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <Video className="w-5 h-5 text-violet-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">{room.videoCount}</div>
          <div className="text-[10px] text-muted-foreground">영상</div>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <Music className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-foreground">D-27</div>
          <div className="text-[10px] text-muted-foreground">마감</div>
        </div>
      </div>

      {/* Upload Status / CTA */}
      {!hasUploaded ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-amber-800 mb-1">영상을 업로드해야 볼 수 있어요</p>
              <p className="text-xs text-amber-700 mb-3">
                Upload-to-View 정책에 따라 내 영상을 먼저 올려야 다른 학생들의 영상을 열람할 수 있습니다.
              </p>
              <button
                onClick={handleUpload}
                className="w-full py-3 rounded-xl bg-amber-600 text-white font-medium flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                내 영상 업로드하기
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={handleUpload}
          className="w-full mb-4 py-3 rounded-xl border border-primary text-primary font-medium flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
        >
          <Upload className="w-4 h-4" />
          새 영상 업로드
        </button>
      )}

      {/* Videos Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">
            연습 영상 ({mockVideos.length})
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

        {!hasUploaded ? (
          // 업로드 안 한 경우 블러 처리
          <div className="space-y-3">
            {sortedVideos.slice(0, 3).map((video) => (
              <div
                key={video.id}
                className="bg-card rounded-xl border border-border p-4 relative overflow-hidden"
              >
                <div className="absolute inset-0 backdrop-blur-md bg-white/50 flex items-center justify-center z-10">
                  <div className="text-center">
                    <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">업로드 후 열람 가능</p>
                  </div>
                </div>
                <div className="flex gap-3 opacity-50">
                  <div className="w-24 h-16 bg-secondary rounded-lg" />
                  <div className="flex-1">
                    <div className="h-4 bg-secondary rounded w-20 mb-2" />
                    <div className="h-3 bg-secondary rounded w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // 업로드한 경우 영상 목록
          <div className="space-y-3">
            {sortedVideos.map((video) => (
              <div
                key={video.id}
                className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 transition-all cursor-pointer"
                onClick={() => setSelectedVideo(video.id)}
              >
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  <div className="w-24 h-16 bg-gradient-to-br from-primary/20 to-violet-500/20 rounded-lg flex items-center justify-center relative shrink-0">
                    <Play className="w-6 h-6 text-primary" />
                    <span className="absolute bottom-1 right-1 text-[10px] px-1 bg-black/60 text-white rounded">
                      {formatDuration(video.duration)}
                    </span>
                    {/* Watermark indicator */}
                    <div className="absolute top-1 left-1">
                      <Shield className="w-3 h-3 text-white/70" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">{video.userName}</span>
                    </div>
                    <p className="text-xs text-primary font-mono mb-1">{video.section}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {video.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
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
      </div>

      {/* Video Player Modal with Protection */}
      {selectedVideo && hasUploaded && (
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
                  {/* 실제 비디오 플레이어 */}
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

                  {/* 다중 워터마크 */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {/* 중앙 대각선 워터마크 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white/[0.07] text-4xl font-bold rotate-[-30deg] select-none whitespace-nowrap">
                        Grit.on 학습용
                      </div>
                    </div>
                    {/* 반복 워터마크 패턴 */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-4 p-8">
                      {[...Array(9)].map((_, i) => (
                        <div key={i} className="flex items-center justify-center">
                          <span className="text-white/[0.03] text-sm rotate-[-30deg] select-none">
                            {new Date().toLocaleDateString()} · 학습용
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 상단 정보 바 */}
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

                  {/* 하단 경고 바 */}
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
                      {mockVideos.find((v) => v.id === selectedVideo)?.userName}
                    </p>
                    <p className="text-white/60 text-sm">
                      {mockVideos.find((v) => v.id === selectedVideo)?.section}
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
                    본 영상은 저작권법에 의해 보호됩니다. 무단 복제 시 법적 처벌을 받을 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </VideoProtection>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">영상 업로드</h3>
              <p className="text-sm text-muted-foreground">
                연습 영상을 업로드하면 다른 학생들의 영상을 볼 수 있어요
              </p>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center mb-4">
              <Video className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">영상 파일 선택</p>
              <p className="text-xs text-muted-foreground">30초 이상, 최대 10분</p>
            </div>

            {/* Options */}
            <div className="space-y-2 mb-4">
              <label className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm text-foreground">얼굴 자동 블러 처리</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm text-foreground">익명으로 업로드</span>
              </label>
            </div>

            {/* Notice */}
            <div className="p-3 bg-amber-50 rounded-xl mb-4">
              <p className="text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                업로드한 영상은 룸 규칙에 따라 관리되며, 워터마크가 자동 삽입됩니다.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 py-3 rounded-xl border border-border text-foreground font-medium"
              >
                취소
              </button>
              <button
                onClick={confirmUpload}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-medium"
              >
                업로드
              </button>
            </div>
          </div>
        </div>
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
              {room.rules.map((rule, idx) => (
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
