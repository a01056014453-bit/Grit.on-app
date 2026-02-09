"use client";

import { Music, ChevronRight } from "lucide-react";
import type { Song } from "@/types";

interface PieceSelectorProps {
  selectedSong: Song;
  isRecording: boolean;
  onClick: () => void;
}

export function PieceSelector({
  selectedSong,
  isRecording,
  onClick,
}: PieceSelectorProps) {
  return (
    <div
      onClick={() => !isRecording && onClick()}
      className={`bg-white rounded-xl p-4 border border-gray-200 mb-6 transition-transform cursor-pointer ${
        !isRecording ? "active:scale-[0.99] hover:border-gray-300" : "opacity-60"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
          <Music className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-black">
            {selectedSong.title}
          </p>
          <p className="text-xs text-gray-500">
            {selectedSong.duration} · {selectedSong.lastPracticed}
          </p>
        </div>
        {!isRecording && (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </div>
    </div>
  );
}
