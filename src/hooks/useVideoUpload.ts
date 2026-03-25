"use client";

import { useState, useCallback } from "react";

interface UseVideoUploadOptions {
  type: "student" | "demo";
  maxSizeMB?: number;
}

interface UseVideoUploadReturn {
  upload: (file: File, requestId: string) => Promise<string | null>;
  uploading: boolean;
  progress: number;
  error: string | null;
  reset: () => void;
}

const ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

/**
 * 피드백 영상 업로드 훅
 * Supabase Storage signed URL로 직접 업로드 (Vercel body 크기 제한 우회)
 */
export function useVideoUpload({
  type,
  maxSizeMB = 50,
}: UseVideoUploadOptions): UseVideoUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  const upload = useCallback(
    async (file: File, requestId: string): Promise<string | null> => {
      setError(null);
      setProgress(0);

      // 클라이언트 사이드 검증
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("영상 파일만 업로드 가능합니다. (MP4, WebM, MOV)");
        return null;
      }

      const maxSize = maxSizeMB * 1024 * 1024;
      if (file.size > maxSize) {
        setError(`${maxSizeMB}MB 이하 영상만 업로드 가능합니다.`);
        return null;
      }

      setUploading(true);

      try {
        // 1. 서버에서 signed upload URL 받기
        setProgress(5);
        const urlRes = await fetch("/api/feedback/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId,
            type,
            fileName: file.name,
            contentType: file.type,
          }),
        });

        const urlData = await urlRes.json();
        if (!urlRes.ok || !urlData.signedUrl) {
          setError(urlData.error || "업로드 URL 생성에 실패했습니다.");
          return null;
        }

        // 2. signed URL로 Supabase Storage에 직접 업로드
        const publicUrl = await new Promise<string | null>((resolve) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              // 5~95% 범위로 매핑 (5%는 URL 생성, 95~100%는 완료 처리)
              setProgress(5 + Math.round((e.loaded / e.total) * 90));
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              setProgress(100);
              resolve(urlData.publicUrl);
            } else {
              setError("영상 업로드에 실패했습니다. 다시 시도해주세요.");
              resolve(null);
            }
          });

          xhr.addEventListener("error", () => {
            setError("네트워크 오류가 발생했습니다.");
            resolve(null);
          });

          xhr.open("PUT", urlData.signedUrl);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        });

        return publicUrl;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "업로드에 실패했습니다.";
        setError(message);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [type, maxSizeMB],
  );

  return { upload, uploading, progress, error, reset };
}
