"use client";

import { useState } from "react";
import { X, ChevronDown, GraduationCap, Music } from "lucide-react";
import type { InstrumentType, RankingFilter, SchoolOption } from "@/types/ranking";
import { INSTRUMENT_LABELS, INSTRUMENT_EMOJIS } from "@/types/ranking";

interface RankingFilterBarProps {
  filter: RankingFilter;
  onFilterChange: (filter: RankingFilter) => void;
  schools: SchoolOption[];
}

const ALL_INSTRUMENTS: InstrumentType[] = [
  "piano", "violin", "viola", "cello", "double_bass",
  "flute", "oboe", "clarinet", "bassoon",
  "trumpet", "horn", "trombone", "tuba",
  "percussion", "harp", "guitar", "vocal", "composition",
];

export function RankingFilterBar({
  filter,
  onFilterChange,
  schools,
}: RankingFilterBarProps) {
  const [showSchoolSheet, setShowSchoolSheet] = useState(false);
  const [showInstrumentSheet, setShowInstrumentSheet] = useState(false);

  const isAll = !filter.schoolId && !filter.instrument;

  const handleReset = () => {
    onFilterChange({});
  };

  const handleSchoolSelect = (schoolId: string) => {
    onFilterChange({ ...filter, schoolId });
    setShowSchoolSheet(false);
  };

  const handleInstrumentSelect = (instrument: InstrumentType) => {
    onFilterChange({ ...filter, instrument });
    setShowInstrumentSheet(false);
  };

  const selectedSchool = schools.find((s) => s.id === filter.schoolId);

  return (
    <>
      {/* 필터 칩 */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide">
        {/* 전체 버튼 */}
        <button
          onClick={handleReset}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            isAll
              ? "bg-violet-500 text-white"
              : "bg-white/50 text-gray-600 border border-white/60"
          }`}
        >
          전체
        </button>

        {/* 학교 필터 */}
        {filter.schoolId && selectedSchool ? (
          <button
            onClick={() => onFilterChange({ ...filter, schoolId: undefined })}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-violet-500 text-white text-xs font-semibold whitespace-nowrap"
          >
            {selectedSchool.shortName}
            <X className="w-3 h-3" />
          </button>
        ) : (
          <button
            onClick={() => setShowSchoolSheet(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/50 text-gray-600 border border-white/60 text-xs font-semibold whitespace-nowrap"
          >
            <GraduationCap className="w-3 h-3" />
            학교
            <ChevronDown className="w-3 h-3" />
          </button>
        )}

        {/* 악기 필터 */}
        {filter.instrument ? (
          <button
            onClick={() => onFilterChange({ ...filter, instrument: undefined })}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-violet-500 text-white text-xs font-semibold whitespace-nowrap"
          >
            {INSTRUMENT_EMOJIS[filter.instrument]} {INSTRUMENT_LABELS[filter.instrument]}
            <X className="w-3 h-3" />
          </button>
        ) : (
          <button
            onClick={() => setShowInstrumentSheet(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/50 text-gray-600 border border-white/60 text-xs font-semibold whitespace-nowrap"
          >
            <Music className="w-3 h-3" />
            악기
            <ChevronDown className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* 학교 선택 바텀시트 */}
      {showSchoolSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowSchoolSheet(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-t-2xl p-5 pb-24 animate-slide-up max-h-[70vh] overflow-y-auto">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            <h3 className="text-base font-bold text-gray-900 mb-4">학교 선택</h3>

            {schools.length === 0 ? (
              <div className="text-center py-8">
                <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">등록된 학교가 없습니다</p>
              </div>
            ) : (
              <div className="space-y-2">
                {schools.map((school) => (
                  <button
                    key={school.id}
                    onClick={() => handleSchoolSelect(school.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                      filter.schoolId === school.id
                        ? "border-violet-500 bg-violet-50"
                        : "border-gray-200 hover:border-violet-300"
                    }`}
                  >
                    <GraduationCap className="w-5 h-5 text-violet-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{school.name}</p>
                      <p className="text-xs text-gray-500">{school.shortName}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 악기 선택 바텀시트 */}
      {showInstrumentSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowInstrumentSheet(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-t-2xl p-5 pb-24 animate-slide-up max-h-[70vh] overflow-y-auto">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            <h3 className="text-base font-bold text-gray-900 mb-4">악기 선택</h3>

            <div className="space-y-2">
              {ALL_INSTRUMENTS.map((inst) => (
                <button
                  key={inst}
                  onClick={() => handleInstrumentSelect(inst)}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                    filter.instrument === inst
                      ? "border-violet-500 bg-violet-50"
                      : "border-gray-200 hover:border-violet-300"
                  }`}
                >
                  <span className="text-xl">{INSTRUMENT_EMOJIS[inst]}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {INSTRUMENT_LABELS[inst]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
