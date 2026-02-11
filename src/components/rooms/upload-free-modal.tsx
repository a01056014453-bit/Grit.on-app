"use client";

import { useState, useMemo, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Users, Music, Upload, AlertCircle, Video } from "lucide-react";
import type { School, FreePiece, RoomVideo } from "@/types";
import { findSimilarPieces, type SimilarPiece } from "@/lib/room-access";
import { cn } from "@/lib/utils";

interface UploadFreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: School;
  videos: RoomVideo[];
  onUpload: (piece: FreePiece) => void;
}

export function UploadFreeModal({
  isOpen,
  onClose,
  school,
  videos,
  onUpload,
}: UploadFreeModalProps) {
  const [step, setStep] = useState<"input" | "upload">("input");
  const [composer, setComposer] = useState("");
  const [title, setTitle] = useState("");
  const [faceBlur, setFaceBlur] = useState(true);
  const [anonymous, setAnonymous] = useState(true);
  const [similarPieces, setSimilarPieces] = useState<SimilarPiece[]>([]);

  // 유사곡 검색
  useEffect(() => {
    if (composer.length >= 2 || title.length >= 2) {
      const similar = findSimilarPieces(videos, composer, title, 3);
      setSimilarPieces(similar);
    } else {
      setSimilarPieces([]);
    }
  }, [composer, title, videos]);

  const isValidInput = composer.trim().length >= 2 && title.trim().length >= 2;

  const handleSelectSimilar = (piece: SimilarPiece) => {
    setComposer(piece.composer);
    setTitle(piece.title);
  };

  const handleNext = () => {
    if (isValidInput) {
      setStep("upload");
    }
  };

  const handleUpload = () => {
    if (isValidInput) {
      onUpload({ composer: composer.trim(), title: title.trim() });
      handleClose();
    }
  };

  const handleClose = () => {
    setStep("input");
    setComposer("");
    setTitle("");
    setFaceBlur(true);
    setAnonymous(true);
    setSimilarPieces([]);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === "input" ? "연습 곡 정보 입력" : "영상 업로드"}
    >
      {step === "input" ? (
        <div className="p-5">
          {/* 작곡가 입력 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              작곡가
            </label>
            <input
              type="text"
              placeholder="예: F. Chopin"
              value={composer}
              onChange={(e) => setComposer(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* 곡명 입력 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              곡명
            </label>
            <input
              type="text"
              placeholder="예: Ballade No.1 Op.23"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* 유사곡 추천 */}
          {similarPieces.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Music className="w-3 h-3" />
                유사한 곡 추천
              </p>
              <div className="space-y-2">
                {similarPieces.map((piece, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSimilar(piece)}
                    className="w-full p-3 rounded-xl border border-border bg-card hover:border-primary/30 text-left transition-all"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {piece.composer} - {piece.title}
                    </p>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Users className="w-3 h-3" />
                      {piece.uploaderCount}명이 같은 곡 연습 중
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 안내 메시지 */}
          <div className="p-3 bg-violet-50 rounded-xl">
            <p className="text-xs text-violet-700 flex items-start gap-2">
              <Users className="w-4 h-4 shrink-0 mt-0.5" />
              같은 곡을 업로드한 학생들의 영상을 서로 볼 수 있어요!
            </p>
          </div>

          {/* 다음 버튼 */}
          <button
            onClick={handleNext}
            disabled={!isValidInput}
            className={cn(
              "w-full mt-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors",
              isValidInput
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
                {composer} - {title}
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
              onClick={() => setStep("input")}
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
