"use client";

import { useState } from "react";
import { Play, AlertCircle, Video } from "lucide-react";

interface VideoPlayerProps {
  url?: string;
  poster?: string;
  className?: string;
}

/**
 * 피드백 영상 재생 컴포넌트
 * - url이 없으면 "영상이 없습니다" fallback
 * - 로딩/에러 상태 처리
 * - 모바일 반응형 (aspect-video)
 */
export function VideoPlayer({ url, poster, className = "" }: VideoPlayerProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!url) {
    return (
      <div
        className={`aspect-video bg-slate-100 rounded-xl flex flex-col items-center justify-center ${className}`}
      >
        <Video className="w-10 h-10 text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">영상이 없습니다</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`aspect-video bg-red-50 rounded-xl flex flex-col items-center justify-center ${className}`}
      >
        <AlertCircle className="w-10 h-10 text-red-300 mb-2" />
        <p className="text-sm text-red-500">영상을 불러올 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className={`relative aspect-video rounded-xl overflow-hidden bg-black ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      )}
      <video
        src={url}
        poster={poster}
        controls
        playsInline
        preload="metadata"
        className="w-full h-full object-contain"
        onLoadedData={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
    </div>
  );
}
