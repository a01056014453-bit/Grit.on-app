"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Target,
  Lightbulb,
  AlertTriangle,
  Music,
  Play,
  CheckCircle2,
  Shield,
  Zap,
  BookOpen,
  ListChecks,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { SongAnalysisV3 } from "@/types/song-analysis";

// ════════════════════════════════════════════════════════
// 공통 UI 조각
// ════════════════════════════════════════════════════════

function SectionCard({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm mb-3 overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <span className="font-semibold text-foreground text-sm flex-1">{title}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "warning" | "critical" | "muted" }) {
  const colors = {
    default: "bg-primary/10 text-primary",
    warning: "bg-amber-100 text-amber-700",
    critical: "bg-red-100 text-red-700",
    muted: "bg-secondary text-muted-foreground",
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${colors[variant]}`}>
      {children}
    </span>
  );
}

const severityVariant = (s: string) =>
  s === "critical" ? "critical" : s === "major" ? "warning" : "default";

const confidenceLabel = (c: string) =>
  c === "high" ? "확인됨" : c === "medium" ? "추정" : "미확인";

// ════════════════════════════════════════════════════════
// B. 작품 요약
// ════════════════════════════════════════════════════════

function SummarySection({ analysis }: { analysis: SongAnalysisV3 }) {
  const s = analysis.content.summary;
  if (!s) return null;

  return (
    <SectionCard title="작품 요약" icon={BookOpen} defaultOpen>
      {s.one_liner && (
        <p className="text-base font-bold text-foreground mb-3 leading-snug">
          {s.one_liner}
        </p>
      )}
      {s.context_for_practice && (
        <div className="mb-3">
          <p className="text-[11px] font-semibold text-muted-foreground mb-1">연습 전 알아야 할 것</p>
          <p className="text-sm text-foreground leading-relaxed">{s.context_for_practice}</p>
        </div>
      )}
      {s.structural_overview && (
        <div className="mb-3">
          <p className="text-[11px] font-semibold text-muted-foreground mb-1">구조 개요</p>
          <p className="text-sm text-foreground leading-relaxed">{s.structural_overview}</p>
        </div>
      )}
      {s.artistic_intent && (
        <div className="bg-secondary/50 rounded-lg p-3">
          <p className="text-[11px] font-semibold text-muted-foreground mb-1">작곡가의 의도</p>
          <p className="text-sm text-foreground leading-relaxed">{s.artistic_intent}</p>
        </div>
      )}
    </SectionCard>
  );
}

// ════════════════════════════════════════════════════════
// C. 검증된 사실
// ════════════════════════════════════════════════════════

function VerifiedFactsSection({ analysis }: { analysis: SongAnalysisV3 }) {
  const facts = analysis.content.verified_facts;
  if (!facts || facts.length === 0) return null;

  return (
    <SectionCard title="검증된 사실" icon={Shield}>
      <div className="flex flex-wrap gap-2">
        {facts.map((f, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 bg-secondary/60 rounded-lg px-3 py-1.5"
          >
            <span className="text-xs text-muted-foreground">{f.label}</span>
            <span className="text-xs font-semibold text-foreground">{f.value}</span>
            <Badge variant={f.confidence === "high" ? "default" : "muted"}>
              {confidenceLabel(f.confidence)}
            </Badge>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ════════════════════════════════════════════════════════
// D. 핵심 기술 과제
// ════════════════════════════════════════════════════════

function TechnicalDemandsSection({ analysis }: { analysis: SongAnalysisV3 }) {
  const demands = analysis.content.technical_demands;
  if (!demands || demands.length === 0) return null;

  return (
    <SectionCard title="핵심 기술 과제" icon={Zap}>
      <div className="space-y-2">
        {demands.map((d, i) => (
          <div key={i} className="bg-secondary/40 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm font-semibold text-foreground">{d.title}</span>
              <Badge variant={severityVariant(d.severity)}>{d.severity}</Badge>
              {d.location && (
                <span className="text-[10px] text-muted-foreground ml-auto">{d.location}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{d.description}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ════════════════════════════════════════════════════════
// E. 음악적 과제
// ════════════════════════════════════════════════════════

function MusicalChallengesSection({ analysis }: { analysis: SongAnalysisV3 }) {
  const challenges = analysis.content.musical_challenges;
  if (!challenges || challenges.length === 0) return null;

  return (
    <SectionCard title="음악적 과제" icon={Music}>
      <div className="space-y-2">
        {challenges.map((ch, i) => (
          <div key={i} className="border-l-2 border-primary pl-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-foreground">{ch.title}</span>
              {ch.location && (
                <span className="text-[10px] text-muted-foreground">{ch.location}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{ch.description}</p>
            {ch.reference_interpretation && (
              <p className="text-xs text-primary/80 mt-1 italic">{ch.reference_interpretation}</p>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ════════════════════════════════════════════════════════
// F. 연습 플랜
// ════════════════════════════════════════════════════════

function PracticePlanSection({ analysis }: { analysis: SongAnalysisV3 }) {
  const plan = analysis.content.practice_plan;
  if (!plan || !plan.phases || plan.phases.length === 0) return null;

  const [expandedPhase, setExpandedPhase] = useState<number | null>(0);

  return (
    <SectionCard title="연습 플랜" icon={ListChecks} defaultOpen>
      {(plan.estimated_duration || plan.recommended_order) && (
        <div className="flex flex-wrap gap-3 mb-3">
          {plan.estimated_duration && (
            <div className="text-xs text-muted-foreground">
              예상 소요: <span className="font-semibold text-foreground">{plan.estimated_duration}</span>
            </div>
          )}
          {plan.recommended_order && (
            <div className="text-xs text-muted-foreground">
              권장 순서: <span className="font-medium text-foreground">{plan.recommended_order}</span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        {plan.phases.map((phase) => {
          const isOpen = expandedPhase === phase.phase;
          return (
            <div key={phase.phase} className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedPhase(isOpen ? null : phase.phase)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left bg-secondary/30"
              >
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                  {phase.phase}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground">{phase.title}</span>
                  <span className="text-[10px] text-muted-foreground ml-2">{phase.duration}</span>
                </div>
                {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 py-2 space-y-1.5">
                      {phase.goal && (
                        <p className="text-xs text-muted-foreground italic mb-2">{phase.goal}</p>
                      )}
                      {(phase.tasks ?? []).map((task, ti) => (
                        <div key={ti} className="flex items-start gap-2 py-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary/60 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground leading-relaxed">{task.instruction}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {task.target && <span className="text-[10px] text-muted-foreground">{task.target}</span>}
                              {task.minutes && <span className="text-[10px] text-muted-foreground">{task.minutes}분</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ════════════════════════════════════════════════════════
// G. 흔한 실수 / 함정
// ════════════════════════════════════════════════════════

function PitfallsSection({ analysis }: { analysis: SongAnalysisV3 }) {
  const pitfalls = analysis.content.pitfalls;
  if (!pitfalls || pitfalls.length === 0) return null;

  return (
    <SectionCard title="흔한 실수" icon={AlertTriangle}>
      <div className="space-y-2">
        {pitfalls.map((p, i) => (
          <div key={i} className="bg-amber-50/60 border border-amber-200/40 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm font-semibold text-foreground">{p.title}</span>
              {p.location && <span className="text-[10px] text-muted-foreground">{p.location}</span>}
            </div>
            <div className="space-y-1 text-xs">
              <p><span className="font-semibold text-red-600">실수:</span> <span className="text-foreground">{p.mistake}</span></p>
              <p><span className="font-semibold text-amber-600">원인:</span> <span className="text-foreground">{p.cause}</span></p>
              <p><span className="font-semibold text-green-700">해결:</span> <span className="text-foreground">{p.fix}</span></p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ════════════════════════════════════════════════════════
// H. 추천 음반
// ════════════════════════════════════════════════════════

function RecordingsSection({ analysis }: { analysis: SongAnalysisV3 }) {
  const recs = analysis.content.recommended_recordings;
  if (!recs || recs.length === 0) return null;

  return (
    <SectionCard title="추천 음반" icon={Play}>
      <div className="space-y-2">
        {recs.map((r, i) => {
          const hasUrl = !!r.youtube_url;
          return (
            <div key={i} className="bg-secondary/40 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-foreground">{r.artist}</span>
                <div className="flex items-center gap-2">
                  {r.year && <span className="text-[10px] text-muted-foreground">{r.year}</span>}
                  {r.label && <span className="text-[10px] text-muted-foreground">{r.label}</span>}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{r.why}</p>
              {r.listen_for && (
                <p className="text-xs text-primary/80 mt-1 italic">{r.listen_for}</p>
              )}
              {hasUrl && (
                <a
                  href={r.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary mt-1.5 hover:underline"
                >
                  <Play className="w-3 h-3" /> YouTube에서 듣기
                </a>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ════════════════════════════════════════════════════════
// I. 악장별 / 모음곡 가이드
// ════════════════════════════════════════════════════════

function MovementGuidesSection({ analysis }: { analysis: SongAnalysisV3 }) {
  const guides = analysis.content.movement_guides;
  if (!guides || guides.length === 0) return null;

  return (
    <SectionCard title="악장별 가이드" icon={Target}>
      <div className="space-y-3">
        {guides.map((g, i) => (
          <div key={i} className="border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                {g.number}
              </span>
              <span className="text-sm font-semibold text-foreground">{g.title}</span>
              {g.key && <Badge>{g.key}</Badge>}
              {g.form && <Badge variant="muted">{g.form}</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mb-2">{g.character}</p>

            {g.technical_demands?.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] font-semibold text-muted-foreground mb-1">기술 과제</p>
                {g.technical_demands.map((d, di) => (
                  <div key={di} className="text-xs text-foreground ml-2 mb-1">
                    <span className="font-medium">{d.title}</span>
                    {d.description && <span className="text-muted-foreground"> — {d.description}</span>}
                  </div>
                ))}
              </div>
            )}

            {g.pitfalls?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-amber-600 mb-1">주의</p>
                {g.pitfalls.map((p, pi) => (
                  <p key={pi} className="text-xs text-muted-foreground ml-2">
                    {p.title}: {p.fix}
                  </p>
                ))}
              </div>
            )}

            {g.connection_to_next && (
              <p className="text-[10px] text-primary/70 mt-2 italic">{g.connection_to_next}</p>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function CollectionGuidesSection({ analysis }: { analysis: SongAnalysisV3 }) {
  const guides = analysis.content.collection_guides;
  if (!guides || guides.length === 0) return null;

  const label = analysis.content.work_type === "variation_set" ? "변주별 가이드" : "곡별 가이드";

  return (
    <SectionCard title={label} icon={Lightbulb}>
      <div className="space-y-2">
        {guides.map((g, i) => (
          <div key={i} className="bg-secondary/40 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-primary">{g.number}.</span>
              <span className="text-sm font-semibold text-foreground">{g.title}</span>
              {g.key && <Badge variant="muted">{g.key}</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mb-1.5">{g.character}</p>
            {g.technical_focus?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                {g.technical_focus.map((t, ti) => (
                  <Badge key={ti}>{t}</Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-foreground">{g.practice_note}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ════════════════════════════════════════════════════════
// 메인 V3Display
// ════════════════════════════════════════════════════════

interface V3DisplayProps {
  analysis: SongAnalysisV3;
}

export function V3Display({ analysis }: V3DisplayProps) {
  return (
    <div>
      <SummarySection analysis={analysis} />
      <VerifiedFactsSection analysis={analysis} />
      <TechnicalDemandsSection analysis={analysis} />
      <MusicalChallengesSection analysis={analysis} />
      <PracticePlanSection analysis={analysis} />
      <PitfallsSection analysis={analysis} />
      <RecordingsSection analysis={analysis} />
      <MovementGuidesSection analysis={analysis} />
      <CollectionGuidesSection analysis={analysis} />
    </div>
  );
}
