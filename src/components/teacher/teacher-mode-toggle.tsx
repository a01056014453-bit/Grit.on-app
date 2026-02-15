"use client";

import { GraduationCap } from "lucide-react";

interface TeacherModeToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export function TeacherModeToggle({ enabled, onToggle }: TeacherModeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors"
      style={{
        borderColor: enabled ? "#ea580c" : "#e5e7eb",
        backgroundColor: enabled ? "#fff7ed" : "#ffffff",
      }}
    >
      <GraduationCap
        className="w-4 h-4"
        style={{ color: enabled ? "#ea580c" : "#9ca3af" }}
      />
      <span
        className="text-xs font-semibold"
        style={{ color: enabled ? "#ea580c" : "#9ca3af" }}
      >
        선생님
      </span>
      <div
        className={`w-8 h-4.5 rounded-full relative transition-colors ${
          enabled ? "bg-orange-600" : "bg-gray-300"
        }`}
        style={{ width: 32, height: 18 }}
      >
        <div
          className="absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform"
          style={{
            width: 14,
            height: 14,
            transform: enabled ? "translateX(15px)" : "translateX(2px)",
          }}
        />
      </div>
    </button>
  );
}
