"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  BookOpen,
  Upload,
  Trash2,
  Loader2,
  FileText,
  Search,
  Sparkles,
  Check,
  Pencil,
} from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import type { ComposerResource, ResourceType } from "@/types/composer-resource";

// ── PDF 텍스트 추출 (클라이언트 사이드) ────────────────────

async function extractTextFromPdf(
  file: File,
): Promise<{ text: string; pageCount: number }> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageText = textContent.items.map((item: any) => item.str).join(" ");
    pages.push(pageText);
  }

  return {
    text: pages.join("\n\n").substring(0, 100000),
    pageCount: pdf.numPages,
  };
}

// ── 타입 라벨 ──────────────────────────────────────────────

const TYPE_LABELS: Record<ResourceType, string> = {
  paper: "논문",
  thesis: "석사논문",
  dissertation: "박사논문",
  article: "학술기사",
};

const LANG_LABELS: Record<string, string> = {
  ko: "한국어",
  en: "영어",
  de: "독일어",
  fr: "프랑스어",
  ja: "일본어",
};

// ── 업로드 단계 ────────────────────────────────────────────

type UploadStep = "idle" | "extracting" | "classifying" | "review" | "saving" | "done";

interface ClassifiedMeta {
  composer: string;
  title: string;
  resource_type: ResourceType;
  author: string;
  year: string;
  source: string;
  language: string;
  piece_title: string;
  tags: string[];
}

// ── 메인 페이지 ────────────────────────────────────────────

export default function ComposerResourcesPage() {
  const [resources, setResources] = useState<ComposerResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // 업로드 상태
  const [step, setStep] = useState<UploadStep>("idle");
  const [stepMessage, setStepMessage] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [meta, setMeta] = useState<ClassifiedMeta | null>(null);
  const [editMode, setEditMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // 삭제 확인
  const [deleteTarget, setDeleteTarget] = useState<ComposerResource | null>(null);

  // ── 데이터 로드 ────────────────────────────────────────

  const fetchResources = useCallback(async () => {
    try {
      const res = await fetch("/api/composer-resources");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setResources(json.data);
      }
    } catch {
      console.error("학술자료 목록 조회 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // ── PDF 처리 파이프라인 ────────────────────────────────

  const processPdf = async (file: File) => {
    setPdfFile(file);
    setEditMode(false);

    // Step 1: 텍스트 추출
    setStep("extracting");
    setStepMessage("PDF에서 텍스트 추출 중...");

    let text = "";
    let pages = 0;
    try {
      const result = await extractTextFromPdf(file);
      text = result.text;
      pages = result.pageCount;
      setExtractedText(text);
      setPageCount(pages);
    } catch {
      setStepMessage("PDF 텍스트 추출 실패. 다른 파일을 시도해주세요.");
      setStep("idle");
      return;
    }

    // Step 2: AI 자동 분류
    setStep("classifying");
    setStepMessage("AI가 논문 정보를 분석 중...");

    try {
      const res = await fetch("/api/composer-resources/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extracted_text: text }),
      });
      const json = await res.json();

      if (json.success && json.metadata) {
        setMeta({
          composer: json.metadata.composer || "",
          title: json.metadata.title || "",
          resource_type: json.metadata.resource_type || "paper",
          author: json.metadata.author || "",
          year: json.metadata.year || "",
          source: json.metadata.source || "",
          language: json.metadata.language || "ko",
          piece_title: json.metadata.piece_title || "",
          tags: Array.isArray(json.metadata.tags) ? json.metadata.tags : [],
        });
        setStep("review");
        setStepMessage("");
      } else {
        setStepMessage("AI 분류 실패. 다시 시도해주세요.");
        setStep("idle");
      }
    } catch {
      setStepMessage("네트워크 오류. 다시 시도해주세요.");
      setStep("idle");
    }
  };

  // ── 파일 선택 / 드래그앤드롭 ──────────────────────────

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("PDF 파일만 업로드 가능합니다.");
      return;
    }
    processPdf(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove("border-violet-400", "bg-violet-50/50");

    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("PDF 파일만 업로드 가능합니다.");
      return;
    }
    processPdf(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    dropZoneRef.current?.classList.add("border-violet-400", "bg-violet-50/50");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dropZoneRef.current?.classList.remove("border-violet-400", "bg-violet-50/50");
  };

  // ── 저장 ──────────────────────────────────────────────

  const handleSave = async () => {
    if (!meta) return;
    setStep("saving");
    setStepMessage("저장 중...");

    try {
      const body = {
        ...meta,
        extracted_text: extractedText,
        page_count: pageCount,
        file_size_bytes: pdfFile?.size,
        auto_translate: meta.language !== "ko",
      };

      const res = await fetch("/api/composer-resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (json.success) {
        setStep("done");
        setStepMessage("저장 완료!");
        fetchResources();
        setTimeout(() => resetUpload(), 2000);
      } else {
        setStepMessage(`오류: ${json.error}`);
        setStep("review");
      }
    } catch {
      setStepMessage("네트워크 오류");
      setStep("review");
    }
  };

  const resetUpload = () => {
    setStep("idle");
    setStepMessage("");
    setPdfFile(null);
    setExtractedText("");
    setPageCount(0);
    setMeta(null);
    setEditMode(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── 삭제 ──────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/composer-resources", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if ((await res.json()).success) {
        setDeleteTarget(null);
        fetchResources();
      }
    } catch {
      console.error("삭제 실패");
    }
  };

  // ── 필터링 ────────────────────────────────────────────

  const activeResources = resources.filter((r) => r.is_active);
  const filtered = searchQuery.trim()
    ? activeResources.filter(
        (r) =>
          r.composer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.piece_title?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : activeResources;

  const composerCount = new Set(activeResources.map((r) => r.composer_normalized)).size;
  const totalPages = activeResources.reduce((sum, r) => sum + (r.page_count || 0), 0);

  // ── 렌더링 ────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">학술자료 DB</h1>
        <p className="text-sm text-gray-500 mt-1">
          PDF를 올리면 AI가 자동으로 분류합니다
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard title="전체 자료" value={activeResources.length} icon={BookOpen} />
        <StatCard title="작곡가 수" value={composerCount} icon={FileText} />
        <StatCard title="총 페이지" value={totalPages} icon={FileText} iconColor="text-blue-600" />
        <StatCard
          title="논문/석사/박사"
          value={`${activeResources.filter((r) => r.resource_type === "paper").length} / ${activeResources.filter((r) => r.resource_type === "thesis").length} / ${activeResources.filter((r) => r.resource_type === "dissertation").length}`}
          icon={BookOpen}
          iconColor="text-emerald-600"
        />
      </div>

      {/* Upload Zone — 항상 표시 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        {step === "idle" && (
          <div
            ref={dropZoneRef}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center transition-all cursor-pointer hover:border-violet-400 hover:bg-violet-50/30"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-base font-semibold text-gray-700 mb-1">
              PDF 파일을 드래그하거나 클릭해서 선택
            </p>
            <p className="text-sm text-gray-400">
              AI가 작곡가, 제목, 저자, 대상곡 등을 자동으로 추출합니다
            </p>
          </div>
        )}

        {(step === "extracting" || step === "classifying") && (
          <div className="py-12 text-center">
            <div className="relative inline-block mb-4">
              <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center">
                {step === "extracting" ? (
                  <FileText className="w-8 h-8 text-violet-500" />
                ) : (
                  <Sparkles className="w-8 h-8 text-violet-500" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-violet-600 animate-spin" />
              </div>
            </div>
            <p className="font-semibold text-gray-800">{stepMessage}</p>
            {pdfFile && (
              <p className="text-sm text-gray-400 mt-2">{pdfFile.name}</p>
            )}
          </div>
        )}

        {step === "review" && meta && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-500" />
                <h3 className="text-lg font-bold text-gray-900">AI 자동 분류 결과</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {editMode ? "미리보기" : "수정"}
                </button>
                <button
                  onClick={resetUpload}
                  className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>

            {editMode ? (
              /* 수정 모드 — 간결한 그리드 */
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "작곡가", key: "composer" as const },
                  { label: "논문 제목", key: "title" as const },
                  { label: "저자", key: "author" as const },
                  { label: "연도", key: "year" as const },
                  { label: "출처", key: "source" as const },
                  { label: "대상곡", key: "piece_title" as const },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 mb-1">{label}</label>
                    <input
                      type="text"
                      value={meta[key]}
                      onChange={(e) => setMeta({ ...meta, [key]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">유형</label>
                  <select
                    value={meta.resource_type}
                    onChange={(e) => setMeta({ ...meta, resource_type: e.target.value as ResourceType })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">언어</label>
                  <select
                    value={meta.language}
                    onChange={(e) => setMeta({ ...meta, language: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    {Object.entries(LANG_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              /* 미리보기 모드 — 카드 형태 */
              <div className="bg-gray-50 rounded-xl p-5 mb-4">
                <div className="grid grid-cols-2 gap-y-3 gap-x-8">
                  {[
                    { label: "작곡가", value: meta.composer },
                    { label: "유형", value: TYPE_LABELS[meta.resource_type] || meta.resource_type },
                    { label: "논문 제목", value: meta.title },
                    { label: "언어", value: LANG_LABELS[meta.language] || meta.language },
                    { label: "저자", value: meta.author || "-" },
                    { label: "연도", value: meta.year || "-" },
                    { label: "출처", value: meta.source || "-" },
                    { label: "대상곡", value: meta.piece_title || "-" },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <span className="text-xs text-gray-400">{label}</span>
                      <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
                    </div>
                  ))}
                </div>
                {meta.tags.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-1.5">
                    {meta.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className="text-xs text-gray-400">
                    {pdfFile?.name} · {pageCount}페이지 · {extractedText.length.toLocaleString()}자 추출
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleSave}
              className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-colors"
            >
              <Check className="w-5 h-5" />
              이대로 저장
            </button>
          </div>
        )}

        {step === "saving" && (
          <div className="py-12 text-center">
            <Loader2 className="w-10 h-10 text-violet-500 animate-spin mx-auto mb-3" />
            <p className="font-semibold text-gray-800">{stepMessage}</p>
          </div>
        )}

        {step === "done" && (
          <div className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <p className="font-semibold text-gray-800">저장 완료!</p>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="작곡가, 제목으로 검색..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
        />
      </div>

      {/* Resource List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">로딩 중...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-700">
            {searchQuery ? "검색 결과가 없습니다" : "등록된 학술자료가 없습니다"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {searchQuery ? "다른 키워드로 검색해보세요" : "위에 PDF를 드래그해서 등록하세요"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">작곡가</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">자료 제목</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">유형</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">대상곡</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">저자 / 연도</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">분량</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.composer}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-[240px] truncate">{r.title}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-violet-50 text-violet-700 font-medium">
                      {TYPE_LABELS[r.resource_type] || r.resource_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-[180px] truncate">
                    {r.piece_title || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {[r.author, r.year].filter(Boolean).join(", ") || "-"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {r.extracted_text.length.toLocaleString()}자
                    {r.page_count ? ` · ${r.page_count}p` : ""}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDeleteTarget(r)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">자료 삭제</h3>
            <p className="text-sm text-gray-600 mb-4">
              &quot;{deleteTarget.title}&quot;을(를) 삭제하시겠습니까?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(deleteTarget.id)}
                className="px-4 py-2 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
