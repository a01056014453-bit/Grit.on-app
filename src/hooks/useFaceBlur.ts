"use client";

/**
 * 얼굴 블러 처리 훅 (v2 구현 예정)
 *
 * 계획:
 * 1. @tensorflow-models/face-detection 패키지 추가
 * 2. 업로드 전 브라우저에서 프레임별 얼굴 감지
 * 3. Canvas로 블러 영역 처리
 * 4. MediaRecorder로 재인코딩
 * 5. 블러 처리된 Blob 반환
 *
 * 현재는 face_blurred 플래그만 DB에 저장하고
 * 실제 블러 처리는 미구현 상태입니다.
 */

interface UseFaceBlurReturn {
  processVideo: (file: File) => Promise<File>;
  processing: boolean;
  progress: number;
  supported: boolean;
}

export function useFaceBlur(): UseFaceBlurReturn {
  // v2에서 실제 구현 예정
  // 현재는 원본 파일을 그대로 반환
  return {
    processVideo: async (file: File) => file,
    processing: false,
    progress: 0,
    supported: false, // v2에서 true로 변경
  };
}
