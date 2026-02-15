"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Music, User, Globe, BookOpen, Layers, Lightbulb, Users, Calendar, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  SongAnalysis,
  SongAnalysisContentV2,
} from "@/types/song-analysis";
import { isV2Content } from "@/types/song-analysis";

// ── 1. 곡의 개요 섹션 ──

function OverviewSection({ content }: { content: SongAnalysisContentV2 }) {
  const overview = content.song_overview;
  if (!overview) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "원제", value: overview.title_original },
          { label: "작곡 시기", value: overview.composition_period },
          { label: "빠르기", value: overview.tempo_marking },
          { label: "장르", value: overview.genre },
          { label: "형식", value: overview.form },
        ].filter(item => item.value).map((item, i) => (
          <div key={i} className="bg-violet-50/50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
            <p className="text-sm font-medium text-gray-900">{item.value}</p>
          </div>
        ))}
      </div>
      {overview.musical_features.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">음악적 특징</p>
          <div className="flex flex-wrap gap-2">
            {overview.musical_features.map((f, i) => (
              <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-violet-100/60 text-violet-700 font-medium">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 2. 작곡가 생애 섹션 ──

function ComposerLifeSection({ content }: { content: SongAnalysisContentV2 }) {
  const life = content.composer_life;
  if (!life) return null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{life.summary}</p>

      {life.timeline.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-violet-600 mb-2">생애 타임라인</p>
          <div className="space-y-2">
            {life.timeline.map((entry, i) => (
              <div key={i} className="flex gap-3 bg-violet-50/40 rounded-xl p-3">
                <div className="shrink-0 w-28">
                  <span className="text-xs font-bold text-violet-700">{entry.period}</span>
                </div>
                <p className="text-sm text-gray-600 flex-1">{entry.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {life.at_composition && (
        <div className="bg-violet-50/50 rounded-xl p-4 border border-violet-100/50">
          <p className="text-xs font-semibold text-violet-600 mb-1">작곡 당시 상황</p>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{life.at_composition}</p>
        </div>
      )}
    </div>
  );
}

// ── 3. 시대적 배경 섹션 ──

function HistoricalSection({ content }: { content: SongAnalysisContentV2 }) {
  const bg = content.historical_background;
  if (!bg) return null;

  return (
    <div className="space-y-4">
      {bg.era_characteristics && (
        <div>
          <p className="text-xs font-semibold text-violet-600 mb-1">시대 특징</p>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{bg.era_characteristics}</p>
        </div>
      )}
      {bg.contemporary_composers && (
        <div>
          <p className="text-xs font-semibold text-violet-600 mb-1">동시대 작곡가</p>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{bg.contemporary_composers}</p>
        </div>
      )}
      {bg.musical_movement && (
        <div>
          <p className="text-xs font-semibold text-violet-600 mb-1">음악 사조</p>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{bg.musical_movement}</p>
        </div>
      )}
    </div>
  );
}

// ── 4. 곡의 특징 섹션 ──

function CharacteristicsSection({ content }: { content: SongAnalysisContentV2 }) {
  const chars = content.song_characteristics;
  if (!chars) return null;

  const subsections = [
    { label: "작곡 배경", value: chars.composition_background },
    { label: "형식과 구조", value: chars.form_and_structure },
    { label: "기교", value: chars.technique },
    { label: "문학적/극적 측면", value: chars.literary_dramatic },
    { label: "결론", value: chars.conclusion },
  ].filter(s => s.value);

  return (
    <div className="space-y-4">
      {subsections.map((sub, i) => (
        <div key={i}>
          <p className="text-xs font-semibold text-violet-600 mb-1">{sub.label}</p>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{sub.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── 5. 구조/화성 분석 섹션 ──

function StructureHarmonySection({ content }: { content: SongAnalysisContentV2 }) {
  const sa = content.structure_analysis_v2;
  if (!sa) return null;



  return (
    <div className="space-y-4">
      {/* 구간별 구성 */}
      <div className="space-y-2">
        {sa.sections.map((s, i) => (
          <div key={i} className="bg-violet-50/40 rounded-xl p-3">
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="font-semibold text-sm text-violet-700">{s.section}</span>
              <span className="text-xs text-gray-400 shrink-0">{s.measures}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {s.key_signature && <span className="text-[10px] px-2 py-0.5 bg-violet-100/60 text-violet-600 rounded-full">{s.key_signature}</span>}
              {s.time_signature && <span className="text-[10px] px-2 py-0.5 bg-violet-100/60 text-violet-600 rounded-full">{s.time_signature}</span>}
              {s.tempo && <span className="text-[10px] px-2 py-0.5 bg-violet-100/60 text-violet-600 rounded-full">{s.tempo}</span>}
            </div>
            {s.mood && <p className="text-xs text-gray-500 italic mb-1">{s.mood}</p>}
            <p className="text-sm text-gray-600">{s.description}</p>
          </div>
        ))}
      </div>

    </div>
  );
}

// ── 6. 연습법 섹션 ──

function PracticeMethodSection({ content }: { content: SongAnalysisContentV2 }) {
  const pm = content.practice_method;
  if (!pm) return null;

  const [activeTab, setActiveTab] = useState<"summary" | "sections" | "routine">("summary");

  return (
    <div className="space-y-3">
      {/* 탭 */}
      <div className="flex gap-1 bg-violet-50/50 rounded-xl p-1">
        {[
          { key: "summary" as const, label: "기술 요약" },
          { key: "sections" as const, label: "구간별 가이드" },
          { key: "routine" as const, label: "4주 루틴" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 text-xs font-medium py-2 px-3 rounded-lg transition-colors ${
              activeTab === tab.key
                ? "bg-white text-violet-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 기술 요약 탭 */}
      {activeTab === "summary" && pm.technique_summary.length > 0 && (
        <div className="space-y-2">
          {pm.technique_summary.map((cat, i) => (
            <div key={i} className="bg-violet-50/40 rounded-xl p-3">
              <p className="text-xs font-bold text-violet-700 mb-2">{cat.category}</p>
              <ul className="space-y-1">
                {cat.items.map((item, j) => (
                  <li key={j} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-violet-400 mt-1 shrink-0">-</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* 구간별 가이드 탭 */}
      {activeTab === "sections" && pm.section_guides.length > 0 && (
        <div className="space-y-2">
          {pm.section_guides.map((guide, i) => (
            <div key={i} className="bg-violet-50/40 rounded-xl p-3">
              <p className="text-xs font-bold text-violet-700 mb-1">{guide.section}</p>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{guide.guide}</p>
            </div>
          ))}
        </div>
      )}

      {/* 4주 루틴 탭 */}
      {activeTab === "routine" && pm.weekly_routine.length > 0 && (
        <div className="space-y-4">
          {pm.weekly_routine.map((week) => (
            <div key={week.week} className="border border-violet-100/50 rounded-xl overflow-hidden">
              <div className="bg-violet-50/60 px-4 py-2">
                <p className="text-sm font-bold text-violet-700">Week {week.week}: {week.theme}</p>
              </div>
              <div className="p-3 space-y-2">
                {week.days.map((day, j) => (
                  <div key={j} className="bg-white/60 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-violet-600 bg-violet-100/60 px-2 py-0.5 rounded">{day.day}</span>
                      <span className="text-xs text-gray-500">{day.focus}</span>
                    </div>
                    <ul className="space-y-1">
                      {day.tasks.map((task, k) => (
                        <li key={k} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-violet-400 mt-0.5 shrink-0">-</span>
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 7. 추천 연주 섹션 ──

function PerformancesSection({ content, analysis }: { content: SongAnalysisContentV2; analysis: SongAnalysis }) {
  const perfs = content.recommended_performances_v2;
  if (!perfs || perfs.length === 0) return null;

  return (
    <div>
      <p className="text-xs text-gray-500 mb-3">탭하면 YouTube에서 연주를 들을 수 있습니다</p>
      <div className="space-y-2">
        {perfs.map((perf, i) => {
          const url = perf.youtube_url
            ? perf.youtube_url
            : `https://www.youtube.com/results?search_query=${encodeURIComponent(`${perf.artist} ${analysis.meta.title} ${analysis.meta.composer}`)}`;

          return (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-violet-50/40 hover:bg-violet-50/70 transition-colors border border-violet-100/30"
            >
              <div className="w-10 h-10 rounded-full bg-violet-200/50 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-violet-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900">{perf.artist}</p>
                <p className="text-xs text-gray-500 truncate">
                  {perf.year && `${perf.year}년`} {perf.comment && `· ${perf.comment}`}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ── V1 기존 렌더링 (하위 호환) ──

function V1LegacyDisplay({ analysis, openSections, toggleSection }: {
  analysis: SongAnalysis;
  openSections: Set<number>;
  toggleSection: (idx: number) => void;
}) {
  const content = analysis.content;
  const sections = [
    {
      icon: <User className="w-5 h-5 text-violet-600" />,
      title: "작곡가 배경",
      content: <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{content.composer_background}</p>,
    },
    {
      icon: <Globe className="w-5 h-5 text-violet-600" />,
      title: "시대적 상황",
      content: <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{content.historical_context}</p>,
    },
    {
      icon: <BookOpen className="w-5 h-5 text-violet-600" />,
      title: "작품 배경",
      content: <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{content.work_background}</p>,
    },
    {
      icon: <Layers className="w-5 h-5 text-violet-600" />,
      title: "곡 구조",
      content: (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-violet-200/30">
                <th className="text-left py-2 px-2 font-semibold text-gray-700 w-24">섹션</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">특징</th>
              </tr>
            </thead>
            <tbody>
              {content.structure_analysis.map((s, i) => (
                <tr key={i} className="border-b border-white/30 last:border-0">
                  <td className="py-3 px-2 align-top">
                    <span className="font-semibold text-violet-700">{s.section}</span>
                  </td>
                  <td className="py-3 px-2 text-gray-600">
                    {s.character && <span className="font-medium text-gray-800">{s.character}. </span>}
                    {s.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
    {
      icon: <Lightbulb className="w-5 h-5 text-violet-600" />,
      title: "테크닉 솔루션",
      content: (
        <div className="space-y-3">
          {content.technique_tips.map((tip, i) => (
            <div key={i} className="bg-white/40 backdrop-blur-xl rounded-2xl p-4 border border-white/50">
              <p className="text-sm font-bold text-violet-700 mb-3">{tip.section}</p>
              <div className="space-y-2.5">
                {tip.problem && (
                  <div className="flex items-start gap-2.5">
                    <span className="text-xs font-semibold text-violet-600 bg-violet-100/60 px-1.5 py-0.5 rounded shrink-0 mt-0.5">문제</span>
                    <p className="text-sm text-gray-700">{tip.problem}</p>
                  </div>
                )}
                {tip.solution && (
                  <div className="flex items-start gap-2.5">
                    <span className="text-xs font-semibold text-violet-600 bg-violet-100/60 px-1.5 py-0.5 rounded shrink-0 mt-0.5">해결</span>
                    <p className="text-sm text-gray-700">{tip.solution}</p>
                  </div>
                )}
                {tip.practice && (
                  <div className="flex items-start gap-2.5">
                    <span className="text-xs font-semibold text-violet-600 bg-violet-100/60 px-1.5 py-0.5 rounded shrink-0 mt-0.5">연습</span>
                    <p className="text-sm text-gray-700">{tip.practice}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <Sparkles className="w-5 h-5 text-violet-600" />,
      title: "음악적 해석",
      content: <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{content.musical_interpretation}</p>,
    },
    {
      icon: <Users className="w-5 h-5 text-violet-600" />,
      title: "추천 연주",
      content: (
        <div>
          <p className="text-xs text-gray-500 mb-4">탭하면 YouTube에서 연주를 들을 수 있습니다</p>
          <div className="space-y-3">
            {content.recommended_performances.map((perf, i) => {
              const q = encodeURIComponent(`${perf.artist} ${analysis.meta.title} ${analysis.meta.composer}`);
              return (
                <a key={i} href={`https://www.youtube.com/results?search_query=${q}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/30 hover:bg-white/50 transition-colors border border-white/30"
                >
                  <div className="w-10 h-10 rounded-full bg-violet-200/50 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-violet-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{perf.artist}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {perf.year && `${perf.year}년`} {perf.comment && `· ${perf.comment}`}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                </a>
              );
            })}
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      {sections.map((section, idx) => {
        const isOpen = openSections.has(idx);
        return (
          <div key={idx} className="bg-white/40 backdrop-blur-xl rounded-2xl border border-white/50 mb-4 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection(idx)}
              className="w-full flex items-center gap-3 p-5 text-left"
            >
              <div className="w-10 h-10 rounded-full bg-violet-200/50 flex items-center justify-center shrink-0">
                {section.icon}
              </div>
              <h3 className="font-bold text-gray-900 flex-1">{section.title}</h3>
              <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5">{section.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </>
  );
}

// ── V2 신규 렌더링 ──

function V2Display({ analysis, openSections, toggleSection }: {
  analysis: SongAnalysis;
  openSections: Set<number>;
  toggleSection: (idx: number) => void;
}) {
  const content = analysis.content as SongAnalysisContentV2;

  const sections = [
    {
      icon: <Music className="w-5 h-5 text-violet-600" />,
      title: "곡의 개요",
      content: <OverviewSection content={content} />,
      show: !!content.song_overview,
    },
    {
      icon: <User className="w-5 h-5 text-violet-600" />,
      title: "작곡가 생애",
      content: <ComposerLifeSection content={content} />,
      show: !!content.composer_life,
    },
    {
      icon: <Globe className="w-5 h-5 text-violet-600" />,
      title: "시대적 배경",
      content: <HistoricalSection content={content} />,
      show: !!content.historical_background,
    },
    {
      icon: <BookOpen className="w-5 h-5 text-violet-600" />,
      title: "곡의 특징",
      content: <CharacteristicsSection content={content} />,
      show: !!content.song_characteristics,
    },
    {
      icon: <Layers className="w-5 h-5 text-violet-600" />,
      title: "구조/화성 분석",
      content: <StructureHarmonySection content={content} />,
      show: !!content.structure_analysis_v2,
    },
    {
      icon: <Lightbulb className="w-5 h-5 text-violet-600" />,
      title: "연습법 & 4주 루틴",
      content: <PracticeMethodSection content={content} />,
      show: !!content.practice_method,
    },
    {
      icon: <Users className="w-5 h-5 text-violet-600" />,
      title: "추천 연주",
      content: <PerformancesSection content={content} analysis={analysis} />,
      show: (content.recommended_performances_v2?.length ?? 0) > 0,
    },
  ].filter(s => s.show);

  return (
    <>
      {sections.map((section, idx) => {
        const isOpen = openSections.has(idx);
        return (
          <div key={idx} className="bg-white/40 backdrop-blur-xl rounded-2xl border border-white/50 mb-4 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection(idx)}
              className="w-full flex items-center gap-3 p-5 text-left"
            >
              <div className="w-10 h-10 rounded-full bg-violet-200/50 flex items-center justify-center shrink-0">
                {section.icon}
              </div>
              <h3 className="font-bold text-gray-900 flex-1">{section.title}</h3>
              <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5">{section.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </>
  );
}

// ── 메인 공유 컴포넌트 ──

interface AnalysisDisplayProps {
  analysis: SongAnalysis;
}

export function AnalysisDisplay({ analysis }: AnalysisDisplayProps) {
  const [openSections, setOpenSections] = useState<Set<number>>(new Set());

  const toggleSection = (idx: number) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const isV2 = (analysis.schema_version ?? 0) >= 2 && isV2Content(analysis.content);

  if (isV2) {
    return <V2Display analysis={analysis} openSections={openSections} toggleSection={toggleSection} />;
  }

  return <V1LegacyDisplay analysis={analysis} openSections={openSections} toggleSection={toggleSection} />;
}

// ── 관리자 모달용 간소화 표시 컴포넌트 ──

interface AnalysisDetailModalProps {
  analysis: SongAnalysis;
}

export function AnalysisDetailModal({ analysis }: AnalysisDetailModalProps) {
  const isV2 = (analysis.schema_version ?? 0) >= 2 && isV2Content(analysis.content);
  const content = analysis.content;

  if (!isV2) {
    // V1: 기존 모달 렌더링
    return (
      <div className="space-y-6">
        <section>
          <h4 className="text-sm font-bold text-violet-700 mb-2">작곡가 배경</h4>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{content.composer_background}</p>
        </section>
        <section>
          <h4 className="text-sm font-bold text-violet-700 mb-2">시대적 상황</h4>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{content.historical_context}</p>
        </section>
        <section>
          <h4 className="text-sm font-bold text-violet-700 mb-2">작품 배경</h4>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{content.work_background}</p>
        </section>
        <section>
          <h4 className="text-sm font-bold text-violet-700 mb-2">곡 구조</h4>
          <div className="space-y-3">
            {content.structure_analysis.map((s, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-gray-900">{s.section}</span>
                  {s.measures && <span className="text-xs text-gray-400">마디 {s.measures}</span>}
                  {s.key_tempo && <span className="text-xs text-violet-500">{s.key_tempo}</span>}
                </div>
                {s.character && <p className="text-xs text-gray-500 mb-1">{s.character}</p>}
                <p className="text-sm text-gray-700">{s.description}</p>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h4 className="text-sm font-bold text-violet-700 mb-2">테크닉 팁</h4>
          <div className="space-y-3">
            {content.technique_tips.map((t, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3">
                <span className="font-semibold text-sm text-gray-900">{t.section}</span>
                {t.problem && <p className="text-sm text-red-600 mt-1">문제: {t.problem}</p>}
                {t.solution && <p className="text-sm text-green-700">해결: {t.solution}</p>}
                {t.practice && <p className="text-sm text-blue-700">연습법: {t.practice}</p>}
              </div>
            ))}
          </div>
        </section>
        <section>
          <h4 className="text-sm font-bold text-violet-700 mb-2">음악적 해석</h4>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{content.musical_interpretation}</p>
        </section>
        <section>
          <h4 className="text-sm font-bold text-violet-700 mb-2">추천 연주</h4>
          <div className="space-y-2">
            {content.recommended_performances.map((p, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3">
                <span className="font-semibold text-sm text-gray-900">{p.artist}</span>
                <span className="text-xs text-gray-400 ml-2">({p.year})</span>
                <p className="text-sm text-gray-600 mt-0.5">{p.comment}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // V2: 새로운 7개 섹션 렌더링
  const v2 = content as SongAnalysisContentV2;

  return (
    <div className="space-y-6">
      {/* 1. 곡의 개요 */}
      {v2.song_overview && (
        <section>
          <h4 className="text-sm font-bold text-violet-700 mb-2">곡의 개요</h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "작곡 시기", value: v2.song_overview.composition_period },
              { label: "빠르기", value: v2.song_overview.tempo_marking },
              { label: "장르", value: v2.song_overview.genre },
              { label: "형식", value: v2.song_overview.form },
            ].filter(x => x.value).map((x, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-400">{x.label}</p>
                <p className="text-sm text-gray-900">{x.value}</p>
              </div>
            ))}
          </div>
          {v2.song_overview.musical_features.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {v2.song_overview.musical_features.map((f, i) => (
                <span key={i} className="text-xs px-2 py-1 bg-violet-50 text-violet-600 rounded-full">{f}</span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 2. 작곡가 생애 */}
      {v2.composer_life && (
        <section>
          <h4 className="text-sm font-bold text-violet-700 mb-2">작곡가 생애</h4>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-2">{v2.composer_life.summary}</p>
          {v2.composer_life.timeline.length > 0 && (
            <div className="space-y-1.5 mb-2">
              {v2.composer_life.timeline.map((t, i) => (
                <div key={i} className="flex gap-2 bg-gray-50 rounded-lg p-2">
                  <span className="text-xs font-bold text-violet-600 shrink-0 w-24">{t.period}</span>
                  <span className="text-xs text-gray-600">{t.description}</span>
                </div>
              ))}
            </div>
          )}
          {v2.composer_life.at_composition && (
            <div className="bg-violet-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-violet-600 mb-1">작곡 당시</p>
              <p className="text-sm text-gray-700">{v2.composer_life.at_composition}</p>
            </div>
          )}
        </section>
      )}

      {/* 3. 시대적 배경 */}
      {v2.historical_background && (
        <section>
          <h4 className="text-sm font-bold text-violet-700 mb-2">시대적 배경</h4>
          {v2.historical_background.era_characteristics && <p className="text-sm text-gray-700 mb-2">{v2.historical_background.era_characteristics}</p>}
          {v2.historical_background.contemporary_composers && <p className="text-sm text-gray-700 mb-2">{v2.historical_background.contemporary_composers}</p>}
          {v2.historical_background.musical_movement && <p className="text-sm text-gray-700">{v2.historical_background.musical_movement}</p>}
        </section>
      )}

      {/* 4. 곡의 특징 */}
      {v2.song_characteristics && (
        <section>
          <h4 className="text-sm font-bold text-violet-700 mb-2">곡의 특징</h4>
          {[
            { label: "작곡 배경", value: v2.song_characteristics.composition_background },
            { label: "형식과 구조", value: v2.song_characteristics.form_and_structure },
            { label: "기교", value: v2.song_characteristics.technique },
            { label: "문학적/극적 측면", value: v2.song_characteristics.literary_dramatic },
            { label: "결론", value: v2.song_characteristics.conclusion },
          ].filter(x => x.value).map((x, i) => (
            <div key={i} className="mb-2">
              <p className="text-xs font-semibold text-violet-600">{x.label}</p>
              <p className="text-sm text-gray-700">{x.value}</p>
            </div>
          ))}
        </section>
      )}

      {/* 5. 구조/화성 분석 */}
      {v2.structure_analysis_v2 && (
        <section>
          <h4 className="text-sm font-bold text-violet-700 mb-2">구조/화성 분석</h4>
          <div className="space-y-2">
            {v2.structure_analysis_v2.sections.map((s, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-gray-900">{s.section}</span>
                  <span className="text-xs text-gray-400">{s.measures}</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-1">
                  {s.key_signature && <span className="text-[10px] px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded">{s.key_signature}</span>}
                  {s.tempo && <span className="text-[10px] px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded">{s.tempo}</span>}
                </div>
                <p className="text-sm text-gray-700">{s.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. 연습법 */}
      {v2.practice_method && (
        <section>
          <h4 className="text-sm font-bold text-violet-700 mb-2">연습법 & 4주 루틴</h4>
          {v2.practice_method.section_guides.length > 0 && (
            <div className="space-y-2 mb-3">
              {v2.practice_method.section_guides.map((g, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-bold text-violet-600 mb-1">{g.section}</p>
                  <p className="text-sm text-gray-700">{g.guide}</p>
                </div>
              ))}
            </div>
          )}
          {v2.practice_method.weekly_routine.length > 0 && (
            <div className="space-y-3">
              {v2.practice_method.weekly_routine.map((w) => (
                <div key={w.week} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-3 py-1.5">
                    <p className="text-xs font-bold text-violet-600">Week {w.week}: {w.theme}</p>
                  </div>
                  <div className="p-2 space-y-1.5">
                    {w.days.map((d, j) => (
                      <div key={j} className="text-xs text-gray-600">
                        <span className="font-semibold text-violet-600">{d.day || ''}</span> ({d.focus || ''}): {(d.tasks || []).join(', ')}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 7. 추천 연주 */}
      {v2.recommended_performances_v2 && v2.recommended_performances_v2.length > 0 && (
        <section>
          <h4 className="text-sm font-bold text-violet-700 mb-2">추천 연주</h4>
          <div className="space-y-2">
            {v2.recommended_performances_v2.map((p, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3">
                <span className="font-semibold text-sm text-gray-900">{p.artist}</span>
                <span className="text-xs text-gray-400 ml-2">({p.year})</span>
                <p className="text-sm text-gray-600 mt-0.5">{p.comment}</p>
                {p.youtube_url && (
                  <a href={p.youtube_url} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-600 hover:underline mt-1 inline-block">
                    YouTube 링크
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
