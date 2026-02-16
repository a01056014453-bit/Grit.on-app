'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, X, Loader2, Save } from 'lucide-react';
import type {
  SongAnalysis,
  SongAnalysisContentV2,
  DifficultyLevel,
  VerificationStatus,
  ComposerTimelineEntry,
  StructureSectionV2,
  HarmonyTableRow,
  PracticeTechniqueItem,
  PracticeSectionGuide,
  WeeklyRoutine,
  WeeklyRoutineDay,
  RecommendedPerformanceV2,
} from '@/types/song-analysis';
import { isV2Content } from '@/types/song-analysis';

interface AnalysisEditFormProps {
  analysis: SongAnalysis;
  onSave: (updated: SongAnalysis) => void;
  onCancel: () => void;
  saving: boolean;
}

// ── 공통 스타일 ──
const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent';
const textareaClass = `${inputClass} min-h-[80px] resize-y`;
const labelClass = 'block text-xs font-medium text-gray-500 mb-1';
const addBtnClass = 'flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors';
const removeBtnClass = 'p-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0';

/** 접히기/펼치기 섹션 */
function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-100 rounded-lg">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors rounded-lg"
      >
        {title}
        {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

export function AnalysisEditForm({ analysis, onSave, onCancel, saving }: AnalysisEditFormProps) {
  const [draft, setDraft] = useState<SongAnalysis>(JSON.parse(JSON.stringify(analysis)));

  const isV2 = isV2Content(draft.content);
  const v2 = draft.content as SongAnalysisContentV2;

  // ── Meta helpers ──
  const setMeta = (key: string, value: string) => {
    setDraft((d) => ({ ...d, meta: { ...d.meta, [key]: value } }));
  };

  const setContentField = (key: string, value: unknown) => {
    setDraft((d) => ({ ...d, content: { ...d.content, [key]: value } }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...draft, updated_at: new Date().toISOString() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ── 1. 메타 정보 ── */}
      <Section title="1. 메타 정보" defaultOpen>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>작곡가</label>
            <input className={inputClass} value={draft.meta.composer} onChange={(e) => setMeta('composer', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>곡명</label>
            <input className={inputClass} value={draft.meta.title} onChange={(e) => setMeta('title', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>작품번호 (Opus)</label>
            <input className={inputClass} value={draft.meta.opus} onChange={(e) => setMeta('opus', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>조성 (Key)</label>
            <input className={inputClass} value={draft.meta.key} onChange={(e) => setMeta('key', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>난이도</label>
            <select className={inputClass} value={draft.meta.difficulty_level} onChange={(e) => setMeta('difficulty_level', e.target.value)}>
              <option value="Beginner">초급 (Beginner)</option>
              <option value="Intermediate">중급 (Intermediate)</option>
              <option value="Advanced">고급 (Advanced)</option>
              <option value="Virtuoso">전문가 (Virtuoso)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>검증 상태</label>
            <select
              className={inputClass}
              value={draft.verification_status}
              onChange={(e) => setDraft((d) => ({ ...d, verification_status: e.target.value as VerificationStatus }))}
            >
              <option value="Verified">검증됨</option>
              <option value="Needs Review">검수 필요</option>
              <option value="Pending">분석 중</option>
            </select>
          </div>
        </div>
      </Section>

      {/* ── V2 Sections ── */}
      {isV2 && (
        <>
          {/* 2. 곡의 개요 */}
          <Section title="2. 곡의 개요">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>작곡 시기</label>
                <input className={inputClass} value={v2.song_overview?.composition_period || ''} onChange={(e) => setContentField('song_overview', { ...v2.song_overview, composition_period: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>빠르기말</label>
                <input className={inputClass} value={v2.song_overview?.tempo_marking || ''} onChange={(e) => setContentField('song_overview', { ...v2.song_overview, tempo_marking: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>장르</label>
                <input className={inputClass} value={v2.song_overview?.genre || ''} onChange={(e) => setContentField('song_overview', { ...v2.song_overview, genre: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>형식</label>
                <input className={inputClass} value={v2.song_overview?.form || ''} onChange={(e) => setContentField('song_overview', { ...v2.song_overview, form: e.target.value })} />
              </div>
            </div>
            <div>
              <label className={labelClass}>음악적 특징 (쉼표로 구분)</label>
              <input
                className={inputClass}
                value={(v2.song_overview?.musical_features || []).join(', ')}
                onChange={(e) => setContentField('song_overview', { ...v2.song_overview, musical_features: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
              />
            </div>
          </Section>

          {/* 3. 작곡가 생애 */}
          <Section title="3. 작곡가 생애">
            <div>
              <label className={labelClass}>요약</label>
              <textarea className={textareaClass} value={v2.composer_life?.summary || ''} onChange={(e) => setContentField('composer_life', { ...v2.composer_life, summary: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>작곡 당시</label>
              <textarea className={textareaClass} value={v2.composer_life?.at_composition || ''} onChange={(e) => setContentField('composer_life', { ...v2.composer_life, at_composition: e.target.value })} />
            </div>
            {/* 타임라인 동적 행 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelClass}>타임라인</label>
                <button
                  type="button"
                  className={addBtnClass}
                  onClick={() => {
                    const timeline = [...(v2.composer_life?.timeline || []), { period: '', description: '' }];
                    setContentField('composer_life', { ...v2.composer_life, timeline });
                  }}
                >
                  <Plus className="w-3 h-3" /> 추가
                </button>
              </div>
              <div className="space-y-2">
                {(v2.composer_life?.timeline || []).map((entry: ComposerTimelineEntry, i: number) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <input
                        className={`${inputClass} w-40`}
                        placeholder="시기 (예: 1810-1849)"
                        value={entry.period}
                        onChange={(e) => {
                          const timeline = [...(v2.composer_life?.timeline || [])];
                          timeline[i] = { ...timeline[i], period: e.target.value };
                          setContentField('composer_life', { ...v2.composer_life, timeline });
                        }}
                      />
                      <button
                        type="button"
                        className={removeBtnClass}
                        onClick={() => {
                          const timeline = (v2.composer_life?.timeline || []).filter((_: ComposerTimelineEntry, j: number) => j !== i);
                          setContentField('composer_life', { ...v2.composer_life, timeline });
                        }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea
                      className={`${textareaClass} min-h-[50px]`}
                      placeholder="설명"
                      value={entry.description}
                      onChange={(e) => {
                        const timeline = [...(v2.composer_life?.timeline || [])];
                        timeline[i] = { ...timeline[i], description: e.target.value };
                        setContentField('composer_life', { ...v2.composer_life, timeline });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* 4. 시대적 배경 */}
          <Section title="4. 시대적 배경">
            <div>
              <label className={labelClass}>시대 특징</label>
              <textarea className={textareaClass} value={v2.historical_background?.era_characteristics || ''} onChange={(e) => setContentField('historical_background', { ...v2.historical_background, era_characteristics: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>동시대 작곡가</label>
              <textarea className={textareaClass} value={v2.historical_background?.contemporary_composers || ''} onChange={(e) => setContentField('historical_background', { ...v2.historical_background, contemporary_composers: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>음악적 사조</label>
              <textarea className={textareaClass} value={v2.historical_background?.musical_movement || ''} onChange={(e) => setContentField('historical_background', { ...v2.historical_background, musical_movement: e.target.value })} />
            </div>
          </Section>

          {/* 5. 곡의 특징 */}
          <Section title="5. 곡의 특징">
            <div>
              <label className={labelClass}>작곡 배경</label>
              <textarea className={textareaClass} value={v2.song_characteristics?.composition_background || ''} onChange={(e) => setContentField('song_characteristics', { ...v2.song_characteristics, composition_background: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>형식과 구조</label>
              <textarea className={textareaClass} value={v2.song_characteristics?.form_and_structure || ''} onChange={(e) => setContentField('song_characteristics', { ...v2.song_characteristics, form_and_structure: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>기법</label>
              <textarea className={textareaClass} value={v2.song_characteristics?.technique || ''} onChange={(e) => setContentField('song_characteristics', { ...v2.song_characteristics, technique: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>문학적/극적 요소</label>
              <textarea className={textareaClass} value={v2.song_characteristics?.literary_dramatic || ''} onChange={(e) => setContentField('song_characteristics', { ...v2.song_characteristics, literary_dramatic: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>결론</label>
              <textarea className={textareaClass} value={v2.song_characteristics?.conclusion || ''} onChange={(e) => setContentField('song_characteristics', { ...v2.song_characteristics, conclusion: e.target.value })} />
            </div>
          </Section>

          {/* 6. 구조/화성 분석 - Sections */}
          <Section title="6. 구조/화성 분석">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">섹션 구간</span>
              <button
                type="button"
                className={addBtnClass}
                onClick={() => {
                  const sections = [...(v2.structure_analysis_v2?.sections || []), { section: '', measures: '', key_signature: '', time_signature: '', tempo: '', mood: '', description: '' }];
                  setContentField('structure_analysis_v2', { ...v2.structure_analysis_v2, sections });
                }}
              >
                <Plus className="w-3 h-3" /> 섹션 추가
              </button>
            </div>
            <div className="space-y-3">
              {(v2.structure_analysis_v2?.sections || []).map((sec: StructureSectionV2, i: number) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-600">섹션 {i + 1}</span>
                    <button
                      type="button"
                      className={removeBtnClass}
                      onClick={() => {
                        const sections = (v2.structure_analysis_v2?.sections || []).filter((_: StructureSectionV2, j: number) => j !== i);
                        setContentField('structure_analysis_v2', { ...v2.structure_analysis_v2, sections });
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className={labelClass}>구간명</label>
                      <input className={inputClass} value={sec.section} onChange={(e) => { const s = [...(v2.structure_analysis_v2?.sections || [])]; s[i] = { ...s[i], section: e.target.value }; setContentField('structure_analysis_v2', { ...v2.structure_analysis_v2, sections: s }); }} />
                    </div>
                    <div>
                      <label className={labelClass}>마디</label>
                      <input className={inputClass} value={sec.measures} onChange={(e) => { const s = [...(v2.structure_analysis_v2?.sections || [])]; s[i] = { ...s[i], measures: e.target.value }; setContentField('structure_analysis_v2', { ...v2.structure_analysis_v2, sections: s }); }} />
                    </div>
                    <div>
                      <label className={labelClass}>조성</label>
                      <input className={inputClass} value={sec.key_signature} onChange={(e) => { const s = [...(v2.structure_analysis_v2?.sections || [])]; s[i] = { ...s[i], key_signature: e.target.value }; setContentField('structure_analysis_v2', { ...v2.structure_analysis_v2, sections: s }); }} />
                    </div>
                    <div>
                      <label className={labelClass}>박자</label>
                      <input className={inputClass} value={sec.time_signature} onChange={(e) => { const s = [...(v2.structure_analysis_v2?.sections || [])]; s[i] = { ...s[i], time_signature: e.target.value }; setContentField('structure_analysis_v2', { ...v2.structure_analysis_v2, sections: s }); }} />
                    </div>
                    <div>
                      <label className={labelClass}>빠르기</label>
                      <input className={inputClass} value={sec.tempo} onChange={(e) => { const s = [...(v2.structure_analysis_v2?.sections || [])]; s[i] = { ...s[i], tempo: e.target.value }; setContentField('structure_analysis_v2', { ...v2.structure_analysis_v2, sections: s }); }} />
                    </div>
                    <div>
                      <label className={labelClass}>분위기</label>
                      <input className={inputClass} value={sec.mood} onChange={(e) => { const s = [...(v2.structure_analysis_v2?.sections || [])]; s[i] = { ...s[i], mood: e.target.value }; setContentField('structure_analysis_v2', { ...v2.structure_analysis_v2, sections: s }); }} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>설명</label>
                    <textarea className={`${textareaClass} min-h-[60px]`} value={sec.description} onChange={(e) => { const s = [...(v2.structure_analysis_v2?.sections || [])]; s[i] = { ...s[i], description: e.target.value }; setContentField('structure_analysis_v2', { ...v2.structure_analysis_v2, sections: s }); }} />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* 7. 연습법 */}
          <Section title="7. 연습법">
            {/* 기술 카테고리 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">기술 카테고리</span>
                <button
                  type="button"
                  className={addBtnClass}
                  onClick={() => {
                    const ts = [...(v2.practice_method?.technique_summary || []), { category: '', items: [''] }];
                    setContentField('practice_method', { ...v2.practice_method, technique_summary: ts });
                  }}
                >
                  <Plus className="w-3 h-3" /> 카테고리 추가
                </button>
              </div>
              <div className="space-y-2">
                {(v2.practice_method?.technique_summary || []).map((cat: PracticeTechniqueItem, i: number) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <input
                        className={`${inputClass} w-48`}
                        placeholder="카테고리명"
                        value={cat.category}
                        onChange={(e) => {
                          const ts = [...(v2.practice_method?.technique_summary || [])];
                          ts[i] = { ...ts[i], category: e.target.value };
                          setContentField('practice_method', { ...v2.practice_method, technique_summary: ts });
                        }}
                      />
                      <button type="button" className={removeBtnClass} onClick={() => { const ts = (v2.practice_method?.technique_summary || []).filter((_: PracticeTechniqueItem, j: number) => j !== i); setContentField('practice_method', { ...v2.practice_method, technique_summary: ts }); }}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea
                      className={`${textareaClass} min-h-[50px]`}
                      placeholder="아이템 (쉼표 구분)"
                      value={cat.items.join(', ')}
                      onChange={(e) => {
                        const ts = [...(v2.practice_method?.technique_summary || [])];
                        ts[i] = { ...ts[i], items: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) };
                        setContentField('practice_method', { ...v2.practice_method, technique_summary: ts });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 구간별 연습 가이드 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">구간별 연습 가이드</span>
                <button
                  type="button"
                  className={addBtnClass}
                  onClick={() => {
                    const sg = [...(v2.practice_method?.section_guides || []), { section: '', guide: '' }];
                    setContentField('practice_method', { ...v2.practice_method, section_guides: sg });
                  }}
                >
                  <Plus className="w-3 h-3" /> 가이드 추가
                </button>
              </div>
              <div className="space-y-3">
                {(v2.practice_method?.section_guides || []).map((g: PracticeSectionGuide, i: number) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <input
                        className={`${inputClass} w-48`}
                        placeholder="구간명"
                        value={g.section}
                        onChange={(e) => {
                          const sg = [...(v2.practice_method?.section_guides || [])];
                          sg[i] = { ...sg[i], section: e.target.value };
                          setContentField('practice_method', { ...v2.practice_method, section_guides: sg });
                        }}
                      />
                      <button type="button" className={removeBtnClass} onClick={() => { const sg = (v2.practice_method?.section_guides || []).filter((_: PracticeSectionGuide, j: number) => j !== i); setContentField('practice_method', { ...v2.practice_method, section_guides: sg }); }}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea
                      className={`${textareaClass} min-h-[80px]`}
                      placeholder="연습 가이드 내용"
                      value={g.guide}
                      onChange={(e) => {
                        const sg = [...(v2.practice_method?.section_guides || [])];
                        sg[i] = { ...sg[i], guide: e.target.value };
                        setContentField('practice_method', { ...v2.practice_method, section_guides: sg });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 4주 루틴 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">4주 연습 루틴</span>
                <button
                  type="button"
                  className={addBtnClass}
                  onClick={() => {
                    const wr = [...(v2.practice_method?.weekly_routine || [])];
                    wr.push({ week: wr.length + 1, theme: '', days: [{ day: '월', focus: '', tasks: [''] }] });
                    setContentField('practice_method', { ...v2.practice_method, weekly_routine: wr });
                  }}
                >
                  <Plus className="w-3 h-3" /> 주차 추가
                </button>
              </div>
              <div className="space-y-3">
                {(v2.practice_method?.weekly_routine || []).map((week: WeeklyRoutine, wi: number) => (
                  <div key={wi} className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2 items-center flex-1">
                        <span className="text-xs font-bold text-gray-600 flex-shrink-0">{week.week}주차</span>
                        <input
                          className={`${inputClass} flex-1`}
                          placeholder="주제"
                          value={week.theme}
                          onChange={(e) => {
                            const wr = [...(v2.practice_method?.weekly_routine || [])];
                            wr[wi] = { ...wr[wi], theme: e.target.value };
                            setContentField('practice_method', { ...v2.practice_method, weekly_routine: wr });
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          type="button"
                          className={addBtnClass}
                          onClick={() => {
                            const wr = [...(v2.practice_method?.weekly_routine || [])];
                            wr[wi] = { ...wr[wi], days: [...wr[wi].days, { day: '', focus: '', tasks: [''] }] };
                            setContentField('practice_method', { ...v2.practice_method, weekly_routine: wr });
                          }}
                        >
                          <Plus className="w-3 h-3" /> 일 추가
                        </button>
                        <button type="button" className={removeBtnClass} onClick={() => { const wr = (v2.practice_method?.weekly_routine || []).filter((_: WeeklyRoutine, j: number) => j !== wi); setContentField('practice_method', { ...v2.practice_method, weekly_routine: wr }); }}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {week.days.map((day: WeeklyRoutineDay, di: number) => (
                      <div key={di} className="ml-4 p-3 bg-white rounded-lg border border-gray-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2 items-center flex-1">
                            <input
                              className={`${inputClass} w-20 flex-shrink-0`}
                              placeholder="요일"
                              value={day.day}
                              onChange={(e) => {
                                const wr = [...(v2.practice_method?.weekly_routine || [])];
                                const days = [...wr[wi].days];
                                days[di] = { ...days[di], day: e.target.value };
                                wr[wi] = { ...wr[wi], days };
                                setContentField('practice_method', { ...v2.practice_method, weekly_routine: wr });
                              }}
                            />
                            <input
                              className={inputClass}
                              placeholder="포커스"
                              value={day.focus}
                              onChange={(e) => {
                                const wr = [...(v2.practice_method?.weekly_routine || [])];
                                const days = [...wr[wi].days];
                                days[di] = { ...days[di], focus: e.target.value };
                                wr[wi] = { ...wr[wi], days };
                                setContentField('practice_method', { ...v2.practice_method, weekly_routine: wr });
                              }}
                            />
                          </div>
                          <button type="button" className={`${removeBtnClass} ml-2`} onClick={() => {
                            const wr = [...(v2.practice_method?.weekly_routine || [])];
                            wr[wi] = { ...wr[wi], days: wr[wi].days.filter((_: WeeklyRoutineDay, j: number) => j !== di) };
                            setContentField('practice_method', { ...v2.practice_method, weekly_routine: wr });
                          }}>
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div>
                          <label className={labelClass}>할 일 (쉼표 구분)</label>
                          <textarea
                            className={`${textareaClass} min-h-[50px]`}
                            value={day.tasks.join(', ')}
                            onChange={(e) => {
                              const wr = [...(v2.practice_method?.weekly_routine || [])];
                              const days = [...wr[wi].days];
                              days[di] = { ...days[di], tasks: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) };
                              wr[wi] = { ...wr[wi], days };
                              setContentField('practice_method', { ...v2.practice_method, weekly_routine: wr });
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* 8. 추천 연주 */}
          <Section title="8. 추천 연주">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">추천 연주 목록</span>
              <button
                type="button"
                className={addBtnClass}
                onClick={() => {
                  const rp = [...(v2.recommended_performances_v2 || []), { artist: '', year: '', comment: '', youtube_url: '' }];
                  setContentField('recommended_performances_v2', rp);
                }}
              >
                <Plus className="w-3 h-3" /> 연주 추가
              </button>
            </div>
            <div className="space-y-2">
              {(v2.recommended_performances_v2 || []).map((p: RecommendedPerformanceV2, i: number) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-600">연주 {i + 1}</span>
                    <button type="button" className={removeBtnClass} onClick={() => { const rp = (v2.recommended_performances_v2 || []).filter((_: RecommendedPerformanceV2, j: number) => j !== i); setContentField('recommended_performances_v2', rp); }}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>아티스트</label>
                      <input className={inputClass} value={p.artist} onChange={(e) => { const rp = [...(v2.recommended_performances_v2 || [])]; rp[i] = { ...rp[i], artist: e.target.value }; setContentField('recommended_performances_v2', rp); }} />
                    </div>
                    <div>
                      <label className={labelClass}>연도</label>
                      <input className={inputClass} value={p.year} onChange={(e) => { const rp = [...(v2.recommended_performances_v2 || [])]; rp[i] = { ...rp[i], year: e.target.value }; setContentField('recommended_performances_v2', rp); }} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>코멘트</label>
                    <input className={inputClass} value={p.comment} onChange={(e) => { const rp = [...(v2.recommended_performances_v2 || [])]; rp[i] = { ...rp[i], comment: e.target.value }; setContentField('recommended_performances_v2', rp); }} />
                  </div>
                  <div>
                    <label className={labelClass}>YouTube URL</label>
                    <input className={inputClass} value={p.youtube_url || ''} onChange={(e) => { const rp = [...(v2.recommended_performances_v2 || [])]; rp[i] = { ...rp[i], youtube_url: e.target.value }; setContentField('recommended_performances_v2', rp); }} />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}

      {/* ── V1 Sections (non-V2 fallback) ── */}
      {!isV2 && (
        <>
          <Section title="2. 작곡가 배경">
            <textarea className={textareaClass} value={draft.content.composer_background || ''} onChange={(e) => setContentField('composer_background', e.target.value)} />
          </Section>
          <Section title="3. 시대적 상황">
            <textarea className={textareaClass} value={draft.content.historical_context || ''} onChange={(e) => setContentField('historical_context', e.target.value)} />
          </Section>
          <Section title="4. 작품 배경">
            <textarea className={textareaClass} value={draft.content.work_background || ''} onChange={(e) => setContentField('work_background', e.target.value)} />
          </Section>
          <Section title="5. 음악적 해석">
            <textarea className={textareaClass} value={draft.content.musical_interpretation || ''} onChange={(e) => setContentField('musical_interpretation', e.target.value)} />
          </Section>
        </>
      )}

      {/* ── 저장/취소 버튼 ── */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          저장
        </button>
      </div>
    </form>
  );
}
