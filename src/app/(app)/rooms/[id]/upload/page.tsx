"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Video,
  Music,
  AlertCircle,
  X,
} from "lucide-react";
import { getSchoolById } from "@/data/mock-schools";
import type { School } from "@/types";

export default function RoomUploadPage() {
  const router = useRouter();
  const params = useParams();
  const schoolId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [school, setSchool] = useState<School | null>(null);
  const [pieceName, setPieceName] = useState("");
  const [measureStart, setMeasureStart] = useState("");
  const [measureEnd, setMeasureEnd] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [faceBlur, setFaceBlur] = useState(true);
  const [anonymous, setAnonymous] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const schoolData = getSchoolById(schoolId);
    if (!schoolData) {
      router.push("/rooms");
      return;
    }
    setSchool(schoolData);
  }, [schoolId, router]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      alert("영상 파일만 업로드할 수 있습니다.");
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      alert("파일 크기는 500MB 이하여야 합니다.");
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const removeVideo = () => {
    setVideoFile(null);
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoPreview(null);
  };

  const canUpload = pieceName.trim().length >= 2 && videoFile;

  const handleUpload = () => {
    if (!canUpload) return;
    setIsUploading(true);
    // TODO: 실제 Supabase Storage 업로드
    setTimeout(() => {
      setIsUploading(false);
      alert("업로드가 완료되었습니다!");
      router.push(`/rooms/${schoolId}`);
    }, 1000);
  };

  if (!school) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blob-violet">
        <div className="animate-pulse text-gray-400">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto min-h-screen pb-24 bg-blob-violet">
      <div className="bg-blob-extra" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-sm border border-white/50 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">영상 업로드</h1>
          <p className="text-xs text-gray-500">{school.name} {school.year}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Video Upload Area */}
        {!videoFile ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center bg-white/40 backdrop-blur-sm hover:border-violet-400 hover:bg-white/60 transition-all"
          >
            <Video className="w-14 h-14 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">탭하여 영상 선택</p>
            <p className="text-xs text-gray-400 mt-1">MP4, MOV (최대 500MB)</p>
          </button>
        ) : (
          <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl border border-white/60 overflow-hidden">
            {videoPreview && (
              <video
                src={videoPreview}
                className="w-full aspect-video object-cover rounded-t-2xl"
                controls
              />
            )}
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Video className="w-4 h-4 text-violet-600 shrink-0" />
                <span className="text-sm text-gray-700 truncate">{videoFile.name}</span>
              </div>
              <button
                onClick={removeVideo}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0 hover:bg-red-100 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Song Name */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/60 p-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
            <Music className="w-4 h-4 text-violet-600" />
            곡명
          </label>
          <input
            type="text"
            placeholder="예: F. Chopin - Ballade No.1 Op.23"
            value={pieceName}
            onChange={(e) => setPieceName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/80 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent placeholder:text-gray-400"
          />
        </div>

        {/* Measure Range */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/60 p-4">
          <label className="text-sm font-semibold text-gray-900 mb-3 block">
            연습 마디 (선택)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder="시작"
              value={measureStart}
              onChange={(e) => setMeasureStart(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-white/80 border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent placeholder:text-gray-400"
            />
            <span className="text-gray-400 font-medium">~</span>
            <input
              type="number"
              placeholder="끝"
              value={measureEnd}
              onChange={(e) => setMeasureEnd(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-white/80 border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent placeholder:text-gray-400"
            />
            <span className="text-sm text-gray-500">마디</span>
          </div>
        </div>

        {/* Options */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/60 p-4 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={faceBlur}
              onChange={(e) => setFaceBlur(e.target.checked)}
              className="rounded accent-violet-600 w-4 h-4"
            />
            <span className="text-sm text-gray-900">얼굴 자동 블러 처리</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="rounded accent-violet-600 w-4 h-4"
            />
            <span className="text-sm text-gray-900">익명으로 업로드</span>
          </label>
        </div>

        {/* Warning */}
        <div className="p-3 bg-amber-50 rounded-xl">
          <p className="text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            업로드한 영상은 룸 규칙에 따라 관리되며, 워터마크가 자동 삽입됩니다.
          </p>
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!canUpload || isUploading}
          className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
            canUpload && !isUploading
              ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          <Upload className="w-4 h-4" />
          {isUploading ? "업로드 중..." : "업로드"}
        </button>
      </div>
    </div>
  );
}
