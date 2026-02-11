"use client";

import { useState, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { Search, Users, Music, Upload, AlertCircle, Video, Check } from "lucide-react";
import type { School, DesignatedPiece, RoomVideo } from "@/types";
import { getSamePieceUploaderCount } from "@/lib/room-access";
import { cn } from "@/lib/utils";

interface UploadDesignatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: School;
  videos: RoomVideo[];
  onUpload: (pieceId: string, piece: DesignatedPiece) => void;
}

export function UploadDesignatedModal({
  isOpen,
  onClose,
  school,
  videos,
  onUpload,
}: UploadDesignatedModalProps) {
  const [step, setStep] = useState<"select" | "upload">("select");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<DesignatedPiece | null>(null);
  const [faceBlur, setFaceBlur] = useState(true);
  const [anonymous, setAnonymous] = useState(true);

  const pieces = school.designatedPieces ?? [];

  // 카테고리 목록 추출
  const categories = useMemo(() => {
    const cats = new Set<string>();
    pieces.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [pieces]);

  // 필터링된 곡 목록
  const filteredPieces = useMemo(() => {
    return pieces.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.composer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        !selectedCategory || p.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [pieces, searchQuery, selectedCategory]);

  const handleSelectPiece = (piece: DesignatedPiece) => {
    setSelectedPiece(piece);
  };

  const handleNext = () => {
    if (selectedPiece) {
      setStep("upload");
    }
  };

  const handleUpload = () => {
    if (selectedPiece) {
      onUpload(selectedPiece.id, selectedPiece);
      handleClose();
    }
  };

  const handleClose = () => {
    setStep("select");
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedPiece(null);
    setFaceBlur(true);
    setAnonymous(true);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === "select" ? "연습 곡 선택" : "영상 업로드"}
    >
      {step === "select" ? (
        <div className="p-5">
          {/* 검색 */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="곡 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* 카테고리 필터 */}
          {categories.length > 0 && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors",
                  !selectedCategory
                    ? "bg-primary text-white"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                전체
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors",
                    selectedCategory === cat
                      ? "bg-primary text-white"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* 곡 목록 */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {filteredPieces.map((piece) => {
              const uploaderCount = getSamePieceUploaderCount(
                videos,
                piece.id,
                null,
                school
              );
              const isSelected = selectedPiece?.id === piece.id;

              return (
                <button
                  key={piece.id}
                  onClick={() => handleSelectPiece(piece)}
                  className={cn(
                    "w-full p-3 rounded-xl border text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {piece.fullName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" />
                          {uploaderCount}명이 같은 곡 연습 중
                        </span>
                        {piece.category && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                            {piece.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredPieces.length === 0 && (
              <div className="text-center py-8">
                <Music className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  검색 결과가 없습니다
                </p>
              </div>
            )}
          </div>

          {/* 안내 메시지 */}
          <div className="mt-4 p-3 bg-violet-50 rounded-xl">
            <p className="text-xs text-violet-700 flex items-start gap-2">
              <Users className="w-4 h-4 shrink-0 mt-0.5" />
              같은 곡을 업로드한 학생들의 영상을 서로 볼 수 있어요!
            </p>
          </div>

          {/* 다음 버튼 */}
          <button
            onClick={handleNext}
            disabled={!selectedPiece}
            className={cn(
              "w-full mt-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors",
              selectedPiece
                ? "bg-primary text-white"
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            )}
          >
            다음: 영상 업로드
          </button>
        </div>
      ) : (
        <div className="p-5">
          {/* 선택된 곡 정보 */}
          <div className="p-3 bg-secondary rounded-xl mb-4">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {selectedPiece?.fullName}
              </span>
            </div>
          </div>

          {/* 업로드 영역 */}
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center mb-4">
            <Video className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">영상 파일 선택</p>
            <p className="text-xs text-muted-foreground">30초 이상, 최대 10분</p>
          </div>

          {/* 옵션 */}
          <div className="space-y-2 mb-4">
            <label className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={faceBlur}
                onChange={(e) => setFaceBlur(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-foreground">얼굴 자동 블러 처리</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-foreground">익명으로 업로드</span>
            </label>
          </div>

          {/* 안내 */}
          <div className="p-3 bg-amber-50 rounded-xl mb-4">
            <p className="text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              업로드한 영상은 룸 규칙에 따라 관리되며, 워터마크가 자동 삽입됩니다.
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2">
            <button
              onClick={() => setStep("select")}
              className="flex-1 py-3 rounded-xl border border-border text-foreground font-medium"
            >
              이전
            </button>
            <button
              onClick={handleUpload}
              className="flex-1 py-3 rounded-xl bg-primary text-white font-medium flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              업로드
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
