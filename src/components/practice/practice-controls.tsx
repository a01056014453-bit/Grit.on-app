"use client";

import { Play, Pause, Square, Mic } from "lucide-react";

interface PracticeControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  hasPermission: boolean | null;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onRequestPermission: () => void;
}

export function PracticeControls({
  isRecording,
  isPaused,
  hasPermission,
  onStart,
  onPause,
  onResume,
  onStop,
  onRequestPermission,
}: PracticeControlsProps) {
  return (
    <>
      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        {!isRecording ? (
          <button
            onClick={onStart}
            disabled={hasPermission === false}
            className="w-20 h-20 rounded-full bg-black hover:bg-gray-800 shadow-lg disabled:opacity-50 flex items-center justify-center transition-colors"
          >
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          </button>
        ) : (
          <>
            <button
              onClick={() => (isPaused ? onResume() : onPause())}
              className="w-16 h-16 rounded-full border-2 border-gray-300 hover:border-gray-400 flex items-center justify-center transition-colors"
            >
              {isPaused ? (
                <Play className="w-6 h-6 text-black ml-0.5" fill="currentColor" />
              ) : (
                <Pause className="w-6 h-6 text-black" />
              )}
            </button>
            <button
              onClick={onStop}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
            >
              <Square className="w-6 h-6 text-white" fill="white" />
            </button>
          </>
        )}
      </div>

      {/* Permission Request Button */}
      {hasPermission === false && (
        <div className="mt-6 text-center">
          <button
            onClick={onRequestPermission}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 mx-auto"
          >
            <Mic className="w-4 h-4" />
            마이크 권한 요청
          </button>
        </div>
      )}
    </>
  );
}
