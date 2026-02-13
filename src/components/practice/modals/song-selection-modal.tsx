"use client";

import { Music, Check, Search, Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import type { Song } from "@/types";

interface SongSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  songs: Song[];
  selectedSong: Song | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectSong: (song: Song) => void;
  onAddSongClick: () => void;
}

export function SongSelectionModal({
  isOpen,
  onClose,
  songs,
  selectedSong,
  searchQuery,
  onSearchChange,
  onSelectSong,
  onAddSongClick,
}: SongSelectionModalProps) {
  const filteredSongs = songs.filter((song) =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        onSearchChange("");
      }}
      title="연습곡 선택"
    >
      <div className="p-4">
        {/* Search & Add */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="곡 검색..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={onAddSongClick}
            className="px-4 py-2.5 rounded-xl bg-primary text-white font-medium text-sm flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            추가
          </button>
        </div>

        {/* Song List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredSongs.map((song) => (
            <button
              key={song.id}
              onClick={() => onSelectSong(song)}
              className={`w-full p-4 rounded-xl border transition-all text-left ${
                selectedSong?.id === song.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:bg-accent"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedSong?.id === song.id ? "bg-primary/10" : "bg-secondary"
                  }`}
                >
                  <Music
                    className={`w-5 h-5 ${
                      selectedSong?.id === song.id
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{song.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {song.duration}
                  </p>
                </div>
                <div className="text-right">
                  {selectedSong?.id === song.id ? (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {song.lastPracticed}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}

          {filteredSongs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">검색 결과가 없습니다</p>
              <button
                onClick={onAddSongClick}
                className="mt-2 text-primary text-sm font-medium"
              >
                새 곡 추가하기
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
