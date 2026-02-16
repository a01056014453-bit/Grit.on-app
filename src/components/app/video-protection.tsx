"use client";

import { useEffect, useState, useCallback } from "react";
import { Shield, AlertTriangle } from "lucide-react";

interface VideoProtectionProps {
  children: React.ReactNode;
  onViolation?: () => void;
}

export function VideoProtection({ children, onViolation }: VideoProtectionProps) {
  const [isViolation, setIsViolation] = useState(false);
  const [violationMessage, setViolationMessage] = useState("");

  const handleViolation = useCallback((message: string) => {
    setIsViolation(true);
    setViolationMessage(message);
    onViolation?.();

    // 3초 후 경고 해제
    setTimeout(() => {
      setIsViolation(false);
      setViolationMessage("");
    }, 3000);
  }, [onViolation]);

  useEffect(() => {
    // 1. 우클릭 방지
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      handleViolation("우클릭이 금지되어 있습니다");
      return false;
    };

    // 2. 키보드 단축키 방지 (PrintScreen, Ctrl+C, Ctrl+S, Ctrl+P 등)
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen
      if (e.key === "PrintScreen") {
        e.preventDefault();
        handleViolation("화면 캡쳐가 금지되어 있습니다");
        return false;
      }

      // Ctrl/Cmd + S (저장)
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleViolation("저장이 금지되어 있습니다");
        return false;
      }

      // Ctrl/Cmd + P (인쇄)
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        handleViolation("인쇄가 금지되어 있습니다");
        return false;
      }

      // Ctrl/Cmd + Shift + S (스크린샷 - 일부 브라우저)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "s") {
        e.preventDefault();
        handleViolation("화면 캡쳐가 금지되어 있습니다");
        return false;
      }

      // Ctrl/Cmd + Shift + I (개발자 도구)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "i") {
        e.preventDefault();
        return false;
      }

      // F12 (개발자 도구)
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }
    };

    // 3. 탭 가시성 변경 감지 (녹화 앱으로 전환 시)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 탭이 숨겨졌을 때 (다른 앱으로 전환)
        // 영상 일시정지 등의 로직을 여기에 추가 가능
      }
    };

    // 4. 드래그 방지
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // 5. 선택 방지
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // 6. 개발자 도구 감지 (간접적)
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;

      if (widthThreshold || heightThreshold) {
        // 개발자 도구가 열려있을 가능성
        console.clear();
      }
    };

    // 이벤트 리스너 등록
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("selectstart", handleSelectStart);

    // 개발자 도구 감지 (1초마다)
    const devToolsInterval = setInterval(detectDevTools, 1000);

    // 클린업
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("selectstart", handleSelectStart);
      clearInterval(devToolsInterval);
    };
  }, [handleViolation]);

  return (
    <div
      className="relative"
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
      }}
    >
      {/* 보호 레이어 */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          // 투명 오버레이로 직접 비디오 요소 접근 방해
          background: "transparent",
        }}
      />

      {/* 콘텐츠 */}
      {children}

      {/* 위반 경고 오버레이 */}
      {isViolation && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <div className="text-center p-6">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">접근 제한</h3>
            <p className="text-white/70">{violationMessage}</p>
            <p className="text-white/50 text-sm mt-4">
              본 콘텐츠는 저작권으로 보호됩니다
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// 비디오 전용 보호 래퍼
export function ProtectedVideo({
  src,
  poster,
  className,
  onPlay,
  onPause,
}: {
  src: string;
  poster?: string;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
}) {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Screen Capture API 감지 시도 (제한적)
    const checkScreenCapture = async () => {
      try {
        // @ts-ignore - experimental API
        if (navigator.mediaDevices?.getDisplayMedia) {
          // 화면 공유 API 존재 - 녹화 가능성 있음
        }
      } catch (e) {
        // 무시
      }
    };

    checkScreenCapture();
  }, []);

  return (
    <div className="relative">
      {/* 비디오 요소 */}
      <video
        src={src}
        poster={poster}
        className={className}
        controls
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        playsInline
        onPlay={onPlay}
        onPause={onPause}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          pointerEvents: "auto",
        }}
      />

      {/* 워터마크 오버레이 */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="text-white/10 text-2xl font-bold rotate-[-30deg] select-none">
          Sempre 학습용
        </div>
      </div>

      {/* 상단 워터마크 */}
      <div className="absolute top-2 right-2 pointer-events-none">
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-black/40 text-white/50 text-[10px]">
          <Shield className="w-3 h-3" />
          보호됨
        </div>
      </div>

      {/* 하단 경고 */}
      <div className="absolute bottom-8 left-0 right-0 pointer-events-none">
        <p className="text-center text-white/30 text-[10px]">
          화면 녹화·캡쳐·공유 금지 | 위반 시 법적 책임
        </p>
      </div>
    </div>
  );
}
