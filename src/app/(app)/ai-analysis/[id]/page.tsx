"use client";

import { useParams, useRouter } from "next/navigation";
import { safeBack } from "@/lib/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Music,
  User,
  Clock,
  BookOpen,
  Hash,
  Lightbulb,
  Loader2,
  Sparkles,
  Play,
} from "lucide-react";
import { saveAnalyzedSong } from "@/lib/song-analysis-store";
import type {
  SongAnalysis,
  SongAnalysisContentV2,
} from "@/types/song-analysis";
import { isV2Content, getDifficultyLabel } from "@/types/song-analysis";

/** localStorage 분석 캐시를 최대 20개로 유지 */
function cleanupAnalysisCache() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("sempre-analysis-")) keys.push(key);
    }
    if (keys.length > 20) {
      // 오래된 것부터 삭제 (키 순서 = 저장 순서는 아니지만 대략적)
      keys.slice(0, keys.length - 20).forEach((k) => localStorage.removeItem(k));
    }
  } catch { /* 무시 */ }
}

export default function AnalysisDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [analysis, setAnalysis] = useState<SongAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAnalysis() {
      // 1. localStorage 캐시에서 즉시 표시
      try {
        const cached = localStorage.getItem(`sempre-analysis-${id}`);
        if (cached) {
          const cachedData = JSON.parse(cached) as SongAnalysis;
          setAnalysis(cachedData);
          setLoading(false); // 즉시 표시
        }
      } catch { /* 캐시 파싱 실패 무시 */ }

      // 2. 백그라운드에서 DB 최신 버전 가져오기
      try {
        // user-analyses에서 composer/title 가져와서 fallback 검색용으로 전달
        let queryParams = "";
        try {
          const raw = localStorage.getItem("sempre-user-analyses");
          if (raw) {
            const list = JSON.parse(raw) as { id: string; composer: string; title: string }[];
            const match = list.find((a) => a.id === id);
            if (match) {
              queryParams = `?composer=${encodeURIComponent(match.composer)}&title=${encodeURIComponent(match.title)}`;
            }
          }
        } catch { /* 무시 */ }

        const res = await fetch(`/api/song-analysis/${id}${queryParams}`);
        if (!res.ok) {
          if (!analysis) setError("분석 데이터를 찾을 수 없습니다.");
          return;
        }
        const data: SongAnalysis = await res.json();
        setAnalysis(data);

        // localStorage에 캐시 저장 (최대 20개 유지)
        try {
          localStorage.setItem(`sempre-analysis-${data.id}`, JSON.stringify(data));
          if (data.id !== id) {
            localStorage.removeItem(`sempre-analysis-${id}`);
          }
          cleanupAnalysisCache();
        } catch { /* 저장 실패 무시 (용량 초과 등) */ }

        // user-analyses의 id가 달라졌으면 업데이트
        if (data.id !== id) {
          try {
            const raw = localStorage.getItem("sempre-user-analyses");
            if (raw) {
              const list = JSON.parse(raw) as { id: string; composer: string; title: string; analyzedAt: string }[];
              const updated = list.map((a) => a.id === id ? { ...a, id: data.id } : a);
              localStorage.setItem("sempre-user-analyses", JSON.stringify(updated));
            }
          } catch { /* 무시 */ }
        }

        saveAnalyzedSong({
          id: data.id,
          title: data.meta.title,
          opus: data.meta.opus,
          composer: data.meta.composer,
        });
      } catch {
        if (!analysis) setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalysis();
  }, [id]);

  if (loading) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto min-h-screen bg-blob-violet">
        <div className="bg-blob-extra" />
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">분석 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto min-h-screen bg-blob-violet">
        <div className="bg-blob-extra" />
        <button
          onClick={() => safeBack(router)}
          className="flex items-center gap-2 text-muted-foreground mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>뒤로</span>
        </button>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {error || "분석 데이터를 찾을 수 없습니다."}
          </p>
          <p className="text-xs text-muted-foreground/60 mb-4">
            이전 버전에서 저장된 데이터일 수 있습니다.
          </p>
          <a
            href="/ai-analysis/new"
            className="inline-block px-6 py-3 bg-violet-500 text-white text-sm font-semibold rounded-xl"
          >
            새로 분석하기
          </a>
        </div>
      </div>
    );
  }

  const { meta, content } = analysis;
  const v2: SongAnalysisContentV2 | null = isV2Content(content)
    ? content
    : null;

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => safeBack(router)}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">곡 분석</h1>
          <p className="text-xs text-muted-foreground">AI 음악학 분석</p>
        </div>
      </div>

      {/* Song Header Card */}
      <div className="bg-card rounded-xl p-4 border border-border shadow-sm mb-4">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <Music className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-foreground">{meta.composer}</h2>
            <p className="text-sm text-muted-foreground">
              {meta.title} {meta.opus}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {meta.key && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">
                  {meta.key}
                </span>
              )}
              {meta.difficulty_level && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">
                  {getDifficultyLabel(meta.difficulty_level)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 1. Song Overview (V2 only) */}
      {v2?.song_overview && (
        <Section title="곡 개요" icon={Music}>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {v2.song_overview.composition_period && (
              <div>
                <p className="text-xs text-muted-foreground">작곡 시기</p>
                <p className="font-medium text-foreground">
                  {v2.song_overview.composition_period}
                </p>
              </div>
            )}
            {v2.song_overview.tempo_marking && (
              <div>
                <p className="text-xs text-muted-foreground">템포</p>
                <p className="font-medium text-foreground">
                  {v2.song_overview.tempo_marking}
                </p>
              </div>
            )}
            {v2.song_overview.genre && (
              <div>
                <p className="text-xs text-muted-foreground">장르</p>
                <p className="font-medium text-foreground">
                  {v2.song_overview.genre}
                </p>
              </div>
            )}
            {v2.song_overview.form && (
              <div>
                <p className="text-xs text-muted-foreground">형식</p>
                <p className="font-medium text-foreground">
                  {v2.song_overview.form}
                </p>
              </div>
            )}
          </div>
          {v2.song_overview.musical_features?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {v2.song_overview.musical_features.map((f, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
                >
                  {f}
                </span>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* 2. Composer */}
      {v2?.composer_life ? (
        <Section title="작곡가 생애" icon={User}>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {v2.composer_life.summary}
          </p>
          {v2.composer_life.timeline?.length > 0 && (
            <div className="mt-3 space-y-2">
              {v2.composer_life.timeline.map((entry, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-xs font-mono text-primary shrink-0 min-w-[60px]">
                    {entry.period}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {entry.description}
                  </p>
                </div>
              ))}
            </div>
          )}
          {v2.composer_life.at_composition && (
            <div className="mt-3 bg-secondary/50 rounded-lg p-3">
              <p className="text-xs font-semibold text-foreground mb-1">
                작곡 당시
              </p>
              <p className="text-xs text-muted-foreground">
                {v2.composer_life.at_composition}
              </p>
            </div>
          )}
        </Section>
      ) : content.composer_background ? (
        <Section title="작곡가" icon={User}>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {content.composer_background}
          </p>
        </Section>
      ) : null}

      {/* 3. Historical Background */}
      {v2?.historical_background ? (
        <Section title="시대적 배경" icon={Clock}>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-foreground mb-1">
                시대 특성
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {v2.historical_background.era_characteristics}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground mb-1">
                동시대 작곡가
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {v2.historical_background.contemporary_composers}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground mb-1">
                음악 사조
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {v2.historical_background.musical_movement}
              </p>
            </div>
          </div>
        </Section>
      ) : content.historical_context ? (
        <Section title="시대적 맥락" icon={Clock}>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {content.historical_context}
          </p>
        </Section>
      ) : null}

      {/* 4. Song Characteristics / Work Background */}
      {v2?.song_characteristics ? (
        <Section title="곡의 특징" icon={Sparkles}>
          <div className="space-y-3">
            {v2.song_characteristics.composition_background && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-1">
                  작곡 배경
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {v2.song_characteristics.composition_background}
                </p>
              </div>
            )}
            {v2.song_characteristics.form_and_structure && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-1">
                  형식과 구조
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {v2.song_characteristics.form_and_structure}
                </p>
              </div>
            )}
            {v2.song_characteristics.technique && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-1">
                  기법
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {v2.song_characteristics.technique}
                </p>
              </div>
            )}
            {v2.song_characteristics.literary_dramatic && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-1">
                  문학·극적 요소
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {v2.song_characteristics.literary_dramatic}
                </p>
              </div>
            )}
            {v2.song_characteristics.conclusion && (
              <div className="bg-secondary/50 rounded-lg p-3">
                <p className="text-xs font-semibold text-foreground mb-1">
                  결론
                </p>
                <p className="text-xs text-muted-foreground">
                  {v2.song_characteristics.conclusion}
                </p>
              </div>
            )}
          </div>
        </Section>
      ) : content.work_background ? (
        <Section title="곡 배경" icon={BookOpen}>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {content.work_background}
          </p>
        </Section>
      ) : null}

      {/* 5. Structure Analysis */}
      {v2?.structure_analysis_v2 ? (
        <Section title="구조·화성 분석" icon={Hash}>
          {v2.structure_analysis_v2.sections?.length > 0 && (
            <div className="space-y-2 mb-4">
              {v2.structure_analysis_v2.sections.map((s, i) => (
                <div key={i} className="bg-secondary/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground text-sm">
                      {s.section}
                    </span>
                    {s.measures && (
                      <span className="text-xs text-primary font-mono">
                        mm. {s.measures}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {s.key_signature && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                        {s.key_signature}
                      </span>
                    )}
                    {s.time_signature && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                        {s.time_signature}
                      </span>
                    )}
                    {s.tempo && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                        {s.tempo}
                      </span>
                    )}
                    {s.mood && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700">
                        {s.mood}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {s.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {v2.structure_analysis_v2.harmony_table?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">
                화성 분석표
              </p>
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full text-xs min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">
                        마디
                      </th>
                      <th className="text-left py-2 text-muted-foreground font-medium">
                        박
                      </th>
                      <th className="text-left py-2 text-muted-foreground font-medium">
                        코드
                      </th>
                      <th className="text-left py-2 text-muted-foreground font-medium">
                        Roman
                      </th>
                      <th className="text-left py-2 text-muted-foreground font-medium">
                        기능
                      </th>
                      <th className="text-left py-2 text-muted-foreground font-medium">
                        비고
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {v2.structure_analysis_v2.harmony_table.map((row, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-1.5 text-foreground font-mono">
                          {row.measure}
                        </td>
                        <td className="py-1.5 text-muted-foreground">
                          {row.beat}
                        </td>
                        <td className="py-1.5 text-foreground">{row.chord}</td>
                        <td className="py-1.5 font-mono text-primary">
                          {row.roman_numeral}
                        </td>
                        <td className="py-1.5 text-muted-foreground">
                          {row.function}
                        </td>
                        <td className="py-1.5 text-muted-foreground">
                          {row.note}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Section>
      ) : content.structure_analysis?.length > 0 ? (
        <Section title="곡 구조" icon={Hash}>
          <div className="space-y-2">
            {content.structure_analysis.map((s, i) => (
              <div key={i} className="bg-secondary/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-foreground text-sm">
                    {s.section}
                  </span>
                  {s.measures && (
                    <span className="text-xs text-primary font-mono">
                      mm. {s.measures}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {/* 6. Practice Method / Technique Tips */}
      {v2?.practice_method ? (
        <Section title="연습법" icon={Lightbulb}>
          {v2.practice_method.technique_summary?.length > 0 && (
            <div className="space-y-3 mb-4">
              {v2.practice_method.technique_summary.map((tech, i) => (
                <div key={i}>
                  <p className="text-sm font-medium text-foreground mb-1">
                    {tech.category}
                  </p>
                  <ul className="space-y-1">
                    {tech.items.map((item, j) => (
                      <li
                        key={j}
                        className="text-xs text-muted-foreground flex items-start gap-2"
                      >
                        <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {v2.practice_method.section_guides?.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs font-semibold text-foreground mb-2">
                구간별 가이드
              </p>
              {v2.practice_method.section_guides.map((guide, i) => (
                <div key={i} className="border-l-2 border-primary pl-3">
                  <p className="text-sm font-medium text-foreground">
                    {guide.section}
                  </p>
                  <p className="text-xs text-muted-foreground">{guide.guide}</p>
                </div>
              ))}
            </div>
          )}

          {v2.practice_method.weekly_routine?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">
                연습 루틴
              </p>
              <div className="space-y-3">
                {v2.practice_method.weekly_routine.map((week) => (
                  <div
                    key={week.week}
                    className="bg-secondary/50 rounded-lg p-3"
                  >
                    <p className="text-sm font-semibold text-foreground mb-2">
                      {week.week}주차: {week.theme}
                    </p>
                    <div className="space-y-2">
                      {week.days.map((day, di) => (
                        <div key={di} className="text-xs">
                          <span className="font-medium text-foreground">
                            {day.day}
                          </span>
                          <span className="text-muted-foreground">
                            {" "}
                            — {day.focus}
                          </span>
                          <ul className="mt-0.5 ml-3">
                            {day.tasks.map((task, ti) => (
                              <li key={ti} className="text-muted-foreground">
                                • {task}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>
      ) : content.technique_tips?.length > 0 ? (
        <Section title="테크닉 팁" icon={Lightbulb}>
          <div className="space-y-3">
            {content.technique_tips.map((tip, i) => (
              <div key={i} className="bg-secondary/50 rounded-lg p-3">
                <p className="text-sm font-medium text-foreground">
                  {tip.section}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  <strong>문제:</strong> {tip.problem}
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>해결:</strong> {tip.solution}
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>연습:</strong> {tip.practice}
                </p>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {/* Musical Interpretation (V1 only, when V2 song_characteristics not available) */}
      {!v2?.song_characteristics && content.musical_interpretation && (
        <Section title="음악적 해석" icon={Sparkles}>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {content.musical_interpretation}
          </p>
        </Section>
      )}

      {/* 7. Recommended Performances */}
      {v2?.recommended_performances_v2?.length ? (
        <Section title="추천 연주" icon={Play}>
          <div className="space-y-3">
            {v2.recommended_performances_v2.map((perf, i) => (
              <div key={i} className="bg-secondary/50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground text-sm">
                    {perf.artist}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {perf.year}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {perf.comment}
                </p>
                <a
                  href={perf.youtube_url || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${perf.artist} ${meta.composer} ${meta.title}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary mt-1 hover:underline"
                >
                  <Play className="w-3 h-3" /> YouTube에서 듣기
                </a>
              </div>
            ))}
          </div>
        </Section>
      ) : content.recommended_performances?.length ? (
        <Section title="추천 연주" icon={Play}>
          <div className="space-y-3">
            {content.recommended_performances.map((perf, i) => {
              const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${perf.artist} ${meta.composer} ${meta.title}`)}`;
              return (
                <div key={i} className="bg-secondary/50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground text-sm">
                      {perf.artist}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {perf.year}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {perf.comment}
                  </p>
                  <a
                    href={(perf as any).youtube_url || searchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary mt-1.5 hover:underline"
                  >
                    <Play className="w-3 h-3" /> YouTube에서 듣기
                  </a>
                </div>
              );
            })}
          </div>
        </Section>
      ) : null}

      {/* Disclaimer */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-xs text-amber-800 text-center">
          <strong>주의:</strong> 본 분석은 AI 기반 참고 자료이며,
          <br />
          정확한 학습을 위해 전문 자료를 함께 참고하시기 바랍니다.
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm mb-4 overflow-hidden">
      <div className="px-4 py-3 bg-muted/50 border-b border-border">
        <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
          <Icon className="w-4 h-4 text-primary" />
          {title}
        </h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
