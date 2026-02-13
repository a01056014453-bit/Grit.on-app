"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showClose?: boolean;
}

export function Modal({ isOpen, onClose, title, children, showClose = true }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-gradient-to-b from-violet-200 via-violet-100/80 to-white rounded-t-3xl max-h-[85vh] overflow-hidden animate-slide-up">
        {/* Header */}
        {(title || showClose) && (
          <div className="sticky top-0 bg-white/30 backdrop-blur-xl border-b border-white/30 px-5 py-4 flex items-center justify-between z-10">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            {showClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center hover:bg-white/60 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto max-h-[calc(85vh-60px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
