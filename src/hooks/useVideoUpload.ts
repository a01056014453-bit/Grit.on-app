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
 * - type: "student" (학생 연습 영상) | "demo" (선생님 시연 영상)
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
        const formData = new FormData();
        formData.append("file", file);
        formData.append("requestId", requestId);
        formData.append("type", type);

        // XMLHttpRequest로 진행률 추적
        const url = await new Promise<string | null>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          });

          xhr.addEventListener("load", () => {
            try {
              const result = JSON.parse(xhr.responseText);
              if (xhr.status >= 200 && xhr.status < 300 && result.success) {
                resolve(result.url);
              } else {
                setError(result.error || "업로드에 실패했습니다.");
                resolve(null);
              }
            } catch {
              setError("서버 응답을 처리할 수 없습니다.");
              resolve(null);
            }
          });

          xhr.addEventListener("error", () => {
            reject(new Error("네트워크 오류가 발생했습니다."));
          });

          xhr.addEventListener("abort", () => {
            resolve(null);
          });

          xhr.open("POST", "/api/feedback/upload-video");
          xhr.send(formData);
        });

        return url;
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
