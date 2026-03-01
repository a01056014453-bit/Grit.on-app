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
  Download,
  X,
  AlertCircle,
} from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { createClient } from "@/lib/supabase-browser";
import type { ComposerResource, ResourceType } from "@/types/composer-resource";

const STORAGE_BUCKET = "composer-resources";

// ── PDF 텍스트 추출 (클라이언트 사이드) ────────────────────

async function extractTextFromPdf(
  file: File,
): Promise<{ text: string; pageCount: number }> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
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

// ── 배치 업로드 아이템 ────────────────────────────────────

type ItemStatus = "pending" | "extracting" | "classifying" | "ready" | "saving" | "done" | "error";
type AnalysisStatus = "idle" | "analyzing" | "done" | "error";

interface AnalysisJob {
  composer: string;
  pieceTitle: string;
  status: AnalysisStatus;
  error: string;
}

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

interface UploadItem {
  id: string;
  file: File;
  status: ItemStatus;
  extractedText: string;
  pageCount: number;
  meta: ClassifiedMeta | null;
  error: string;
  editMode: boolean;
}

function createUploadItem(file: File): UploadItem {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    file,
    status: "pending",
    extractedText: "",
    pageCount: 0,
    meta: null,
    error: "",
    editMode: false,
  };
}

// ── 메인 페이지 ────────────────────────────────────────────

export default function ComposerResourcesPage() {
  const [resources, setResources] = useState<ComposerResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // 배치 업로드 상태
  const [items, setItems] = useState<UploadItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // 자동 곡 분석 상태
  const [analysisJobs, setAnalysisJobs] = useState<AnalysisJob[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

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

  // ── 아이템 상태 업데이트 (불변) ────────────────────────

  const updateItem = useCallback(
    (id: string, patch: Partial<UploadItem>) => {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    },
    [],
  );

  // ── 단일 PDF 처리 ─────────────────────────────────────

  const processOneItem = async (item: UploadItem) => {
    // Step 1: 텍스트 추출
    updateItem(item.id, { status: "extracting" });

    let text = "";
    let pages = 0;
    try {
      const result = await extractTextFromPdf(item.file);
      text = result.text;
      pages = result.pageCount;
      updateItem(item.id, { extractedText: text, pageCount: pages });
    } catch (err) {
      updateItem(item.id, {
        status: "error",
        error: `텍스트 추출 실패: ${err instanceof Error ? err.message : "알 수 없는 오류"}`,
      });
      return;
    }

    // Step 2: AI 자동 분류
    updateItem(item.id, { status: "classifying" });

    try {
      const res = await fetch("/api/composer-resources/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extracted_text: text }),
      });

      const json = await res.json();

      if (!res.ok) {
        updateItem(item.id, {
          status: "error",
          error: `AI 분류 실패: ${json.error || res.statusText}`,
        });
        return;
      }

      if (json.success && json.metadata) {
        updateItem(item.id, {
          status: "ready",
          meta: {
            composer: json.metadata.composer || "",
            title: json.metadata.title || "",
            resource_type: json.metadata.resource_type || "paper",
            author: json.metadata.author || "",
            year: json.metadata.year || "",
            source: json.metadata.source || "",
            language: json.metadata.language || "ko",
            piece_title: json.metadata.piece_title || "",
            tags: Array.isArray(json.metadata.tags) ? json.metadata.tags : [],
          },
        });
      } else {
        updateItem(item.id, { status: "error", error: "AI 분류 결과 없음" });
      }
    } catch {
      updateItem(item.id, { status: "error", error: "네트워크 오류" });
    }
  };

  // ── 전체 순차 처리 ─────────────────────────────────────

  const processAllPending = async (newItems: UploadItem[]) => {
    setProcessing(true);
    for (const item of newItems) {
      if (item.status === "pending") {
        await processOneItem(item);
      }
    }
    setProcessing(false);
  };

  // ── 파일 추가 ──────────────────────────────────────────

  const addFiles = (files: FileList | File[]) => {
    const pdfFiles = Array.from(files).filter((f) =>
      f.name.toLowerCase().endsWith(".pdf"),
    );
    if (pdfFiles.length === 0) {
      alert("PDF 파일만 업로드 가능합니다.");
      return;
    }

    const newItems = pdfFiles.map(createUploadItem);
    setItems((prev) => [...prev, ...newItems]);
    processAllPending(newItems);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove("border-violet-400", "bg-violet-50/50");
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    dropZoneRef.current?.classList.add("border-violet-400", "bg-violet-50/50");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dropZoneRef.current?.classList.remove("border-violet-400", "bg-violet-50/50");
  };

  // ── 아이템 제거 ────────────────────────────────────────

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // ── PDF를 브라우저에서 직접 Storage 업로드 ────────────

  const uploadPdfToStorage = async (
    file: File,
    composer: string,
    title: string,
  ): Promise<string | null> => {
    try {
      // 버킷 존재 확인 (서버에서 생성)
      await fetch("/api/composer-resources/ensure-bucket");

      const supabase = createClient();
      const normalize = (s: string) =>
        s.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_.\-]/g, "");

      const timestamp = Date.now();
      const storagePath = `${normalize(composer)}/${timestamp}_${normalize(title)}.pdf`;

      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, file, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (error) {
        console.error("PDF Storage 업로드 실패:", error.message);
        return null;
      }

      return storagePath;
    } catch (err) {
      console.error("PDF 업로드 예외:", err);
      return null;
    }
  };

  // ── 단일 저장 ──────────────────────────────────────────

  const saveOneItem = async (item: UploadItem): Promise<boolean> => {
    if (!item.meta) return false;
    updateItem(item.id, { status: "saving" });

    try {
      // 1) PDF를 브라우저에서 직접 Storage에 업로드
      const pdfPath = await uploadPdfToStorage(
        item.file,
        item.meta.composer,
        item.meta.title,
      );

      // 2) 메타데이터만 JSON으로 API에 전송
      const body = {
        ...item.meta,
        extracted_text: item.extractedText,
        page_count: item.pageCount,
        file_size_bytes: item.file.size,
        auto_translate: item.meta.language !== "ko",
        pdf_storage_path: pdfPath || undefined,
      };

      const res = await fetch("/api/composer-resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (json.success) {
        updateItem(item.id, { status: "done" });
        return true;
      } else {
        updateItem(item.id, { status: "error", error: json.error || "저장 실패" });
        return false;
      }
    } catch {
      updateItem(item.id, { status: "error", error: "저장 중 오류 발생" });
      return false;
    }
  };

  // ── 전체 저장 ──────────────────────────────────────────

  const handleSaveAll = async () => {
    const readyItems = items.filter((i) => i.status === "ready");
    if (readyItems.length === 0) return;

    setSavingAll(true);

    // 저장 성공한 항목 중 piece_title 있는 것 수집
    const savedWithPiece: { composer: string; pieceTitle: string }[] = [];

    for (const item of readyItems) {
      const ok = await saveOneItem(item);
      if (ok && item.meta?.piece_title?.trim()) {
        savedWithPiece.push({
          composer: item.meta.composer,
          pieceTitle: item.meta.piece_title,
        });
      }
    }
    setSavingAll(false);
    fetchResources();

    // 완료된 항목 2초 뒤 제거
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.status !== "done"));
    }, 2000);

    // piece_title 있는 항목 → 자동 곡 분석 실행
    if (savedWithPiece.length > 0) {
      // 중복 제거 (같은 작곡가 + 곡)
      const unique = savedWithPiece.filter(
        (item, idx, arr) =>
          arr.findIndex(
            (x) => x.composer === item.composer && x.pieceTitle === item.pieceTitle,
          ) === idx,
      );
      runAutoAnalysis(unique);
    }
  };

  // ── 자동 곡 분석 ──────────────────────────────────────

  const runAutoAnalysis = async (
    targets: { composer: string; pieceTitle: string }[],
  ) => {
    const jobs: AnalysisJob[] = targets.map((t) => ({
      composer: t.composer,
      pieceTitle: t.pieceTitle,
      status: "idle" as AnalysisStatus,
      error: "",
    }));
    setAnalysisJobs(jobs);
    setAnalyzing(true);

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      // 상태 업데이트: analyzing
      setAnalysisJobs((prev) =>
        prev.map((j, idx) => (idx === i ? { ...j, status: "analyzing" } : j)),
      );

      try {
        const res = await fetch("/api/analyze-song-v2", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            composer: job.composer,
            title: job.pieceTitle,
            forceRefresh: true,
          }),
        });

        const json = await res.json();
        if (json.success) {
          setAnalysisJobs((prev) =>
            prev.map((j, idx) => (idx === i ? { ...j, status: "done" } : j)),
          );
        } else {
          setAnalysisJobs((prev) =>
            prev.map((j, idx) =>
              idx === i ? { ...j, status: "error", error: json.error || "분석 실패" } : j,
            ),
          );
        }
      } catch {
        setAnalysisJobs((prev) =>
          prev.map((j, idx) =>
            idx === i ? { ...j, status: "error", error: "네트워크 오류" } : j,
          ),
        );
      }
    }
    setAnalyzing(false);
  };

  // ── 전체 초기화 ────────────────────────────────────────

  const clearAll = () => {
    setItems([]);
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

  const handleDownloadPdf = async (storagePath: string) => {
    try {
      const res = await fetch(
        `/api/composer-resources/download?path=${encodeURIComponent(storagePath)}`,
      );
      const json = await res.json();
      if (json.success && json.url) {
        window.open(json.url, "_blank");
      } else {
        alert("PDF를 불러올 수 없습니다.");
      }
    } catch {
      alert("PDF 다운로드 실패");
    }
  };

  // ── 파생 데이터 ────────────────────────────────────────

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

  const readyCount = items.filter((i) => i.status === "ready").length;
  const processingCount = items.filter((i) =>
    ["pending", "extracting", "classifying"].includes(i.status),
  ).length;
  const doneCount = items.filter((i) => i.status === "done").length;
  const errorCount = items.filter((i) => i.status === "error").length;

  const hasItems = items.length > 0;

  // ── 렌더링 ────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">학술자료 DB</h1>
        <p className="text-sm text-gray-500 mt-1">
          PDF를 여러 개 드래그해서 한번에 업로드
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

      {/* 기존 자료 곡 분석 버튼 */}
      {activeResources.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => {
              const targets = activeResources
                .filter((r) => r.piece_title?.trim())
                .map((r) => ({ composer: r.composer, pieceTitle: r.piece_title! }));
              const unique = targets.filter(
                (t, i, arr) =>
                  arr.findIndex(
                    (x) => x.composer === t.composer && x.pieceTitle === t.pieceTitle,
                  ) === i,
              );
              if (unique.length === 0) {
                alert("대상곡이 있는 자료가 없습니다.");
                return;
              }
              runAutoAnalysis(unique);
            }}
            disabled={analyzing}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-violet-600 rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {analyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {analyzing ? "분석 진행 중..." : `기존 자료 곡 분석 실행 (${activeResources.filter((r) => r.piece_title?.trim()).length}곡)`}
          </button>
        </div>
      )}

      {/* Upload Zone */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        {/* 드롭존 — 항상 표시 (아이템 있어도 추가 가능) */}
        <div
          ref={dropZoneRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed border-gray-300 rounded-xl text-center transition-all cursor-pointer hover:border-violet-400 hover:bg-violet-50/30 ${hasItems ? "p-6" : "p-12"}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Upload className={`text-gray-300 mx-auto mb-2 ${hasItems ? "w-8 h-8" : "w-12 h-12 mb-4"}`} />
          <p className={`font-semibold text-gray-700 ${hasItems ? "text-sm" : "text-base mb-1"}`}>
            PDF 파일을 드래그하거나 클릭해서 선택 (여러 개 가능)
          </p>
          {!hasItems && (
            <p className="text-sm text-gray-400">
              AI가 작곡가, 제목, 저자, 대상곡 등을 자동으로 추출합니다
            </p>
          )}
        </div>

        {/* 배치 아이템 목록 */}
        {hasItems && (
          <div className="mt-4 space-y-3">
            {/* 상태 요약 바 */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>총 {items.length}개</span>
                {processingCount > 0 && (
                  <span className="flex items-center gap-1 text-violet-600">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    분석 중 {processingCount}개
                  </span>
                )}
                {readyCount > 0 && (
                  <span className="text-emerald-600">준비완료 {readyCount}개</span>
                )}
                {doneCount > 0 && (
                  <span className="text-green-600">저장완료 {doneCount}개</span>
                )}
                {errorCount > 0 && (
                  <span className="text-red-500">오류 {errorCount}개</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {readyCount > 0 && (
                  <button
                    onClick={handleSaveAll}
                    disabled={savingAll}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
                  >
                    {savingAll ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {savingAll ? "저장 중..." : `${readyCount}개 전체 저장`}
                  </button>
                )}
                <button
                  onClick={clearAll}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  전체 취소
                </button>
              </div>
            </div>

            {/* 각 아이템 카드 */}
            {items.map((item) => (
              <BatchItemCard
                key={item.id}
                item={item}
                onRemove={() => removeItem(item.id)}
                onUpdateMeta={(meta) => updateItem(item.id, { meta })}
                onToggleEdit={() => updateItem(item.id, { editMode: !item.editMode })}
                onRetrySave={() => saveOneItem(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 자동 곡 분석 진행 상황 */}
      {analysisJobs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-violet-500" />
            <h3 className="text-sm font-bold text-gray-900">곡 DB 자동 분석</h3>
            {analyzing && (
              <span className="flex items-center gap-1 text-xs text-violet-600">
                <Loader2 className="w-3 h-3 animate-spin" />
                진행 중...
              </span>
            )}
            {!analyzing && (
              <button
                onClick={() => setAnalysisJobs([])}
                className="ml-auto text-xs text-gray-400 hover:text-gray-600"
              >
                닫기
              </button>
            )}
          </div>
          <div className="space-y-2">
            {analysisJobs.map((job, idx) => (
              <div
                key={`${job.composer}-${job.pieceTitle}-${idx}`}
                className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm ${
                  job.status === "done"
                    ? "bg-green-50 border border-green-200"
                    : job.status === "error"
                      ? "bg-red-50 border border-red-200"
                      : job.status === "analyzing"
                        ? "bg-violet-50 border border-violet-200"
                        : "bg-gray-50 border border-gray-200"
                }`}
              >
                <div className="min-w-0">
                  <span className="font-medium text-gray-800">{job.composer}</span>
                  <span className="text-gray-400 mx-2">—</span>
                  <span className="text-gray-700">{job.pieceTitle}</span>
                </div>
                <div className="shrink-0 ml-3">
                  {job.status === "idle" && (
                    <span className="text-xs text-gray-400">대기</span>
                  )}
                  {job.status === "analyzing" && (
                    <span className="flex items-center gap-1 text-xs text-violet-600">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      분석 중
                    </span>
                  )}
                  {job.status === "done" && (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <Check className="w-3 h-3" />
                      곡 DB 등록 완료
                    </span>
                  )}
                  {job.status === "error" && (
                    <span className="flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle className="w-3 h-3" />
                      {job.error}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  <td className="px-4 py-3 text-right flex items-center justify-end gap-1">
                    {r.pdf_storage_path && (
                      <button
                        onClick={() => handleDownloadPdf(r.pdf_storage_path!)}
                        className="p-1.5 text-gray-400 hover:text-violet-600 transition-colors"
                        title="PDF 원본 보기"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
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

// ── 배치 아이템 카드 컴포넌트 ─────────────────────────────

function BatchItemCard({
  item,
  onRemove,
  onUpdateMeta,
  onToggleEdit,
  onRetrySave,
}: {
  item: UploadItem;
  onRemove: () => void;
  onUpdateMeta: (meta: ClassifiedMeta) => void;
  onToggleEdit: () => void;
  onRetrySave: () => void;
}) {
  const { status, file, meta, error, editMode, pageCount, extractedText } = item;

  // 상태별 아이콘 + 색상
  const statusConfig: Record<
    ItemStatus,
    { icon: React.ReactNode; bg: string; text: string; label: string }
  > = {
    pending: {
      icon: <Loader2 className="w-4 h-4 animate-spin" />,
      bg: "bg-gray-50 border-gray-200",
      text: "text-gray-500",
      label: "대기 중",
    },
    extracting: {
      icon: <FileText className="w-4 h-4" />,
      bg: "bg-violet-50 border-violet-200",
      text: "text-violet-600",
      label: "텍스트 추출 중...",
    },
    classifying: {
      icon: <Sparkles className="w-4 h-4" />,
      bg: "bg-violet-50 border-violet-200",
      text: "text-violet-600",
      label: "AI 분류 중...",
    },
    ready: {
      icon: <Check className="w-4 h-4" />,
      bg: "bg-emerald-50 border-emerald-200",
      text: "text-emerald-600",
      label: "준비 완료",
    },
    saving: {
      icon: <Loader2 className="w-4 h-4 animate-spin" />,
      bg: "bg-blue-50 border-blue-200",
      text: "text-blue-600",
      label: "저장 중...",
    },
    done: {
      icon: <Check className="w-4 h-4" />,
      bg: "bg-green-50 border-green-200",
      text: "text-green-600",
      label: "저장 완료",
    },
    error: {
      icon: <AlertCircle className="w-4 h-4" />,
      bg: "bg-red-50 border-red-200",
      text: "text-red-500",
      label: "오류",
    },
  };

  const cfg = statusConfig[status];

  return (
    <div className={`rounded-xl border p-4 transition-all ${cfg.bg}`}>
      {/* 헤더: 파일명 + 상태 + 액션 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-sm font-medium text-gray-800 truncate">{file.name}</span>
          <span className="text-xs text-gray-400 shrink-0">
            ({(file.size / 1024).toFixed(0)} KB)
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`flex items-center gap-1 text-xs font-medium ${cfg.text}`}>
            {cfg.icon}
            {cfg.label}
          </span>
          {status !== "saving" && status !== "done" && (
            <button
              onClick={onRemove}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 에러 표시 */}
      {status === "error" && error && (
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-red-500">{error}</p>
          {meta && (
            <button
              onClick={onRetrySave}
              className="text-xs text-red-600 underline hover:text-red-700"
            >
              재시도
            </button>
          )}
        </div>
      )}

      {/* 분류 결과 (ready 상태) */}
      {status === "ready" && meta && (
        <div className="mt-2">
          {editMode ? (
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { label: "작곡가", key: "composer" },
                  { label: "제목", key: "title" },
                  { label: "저자", key: "author" },
                  { label: "연도", key: "year" },
                  { label: "출처", key: "source" },
                  { label: "대상곡", key: "piece_title" },
                ] as const
              ).map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-[10px] text-gray-400 mb-0.5">{label}</label>
                  <input
                    type="text"
                    value={meta[key]}
                    onChange={(e) => onUpdateMeta({ ...meta, [key]: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-violet-500"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
              <span>
                <span className="text-gray-400">작곡가</span>{" "}
                <span className="font-medium text-gray-800">{meta.composer}</span>
              </span>
              <span>
                <span className="text-gray-400">유형</span>{" "}
                <span className="font-medium text-gray-800">
                  {TYPE_LABELS[meta.resource_type] || meta.resource_type}
                </span>
              </span>
              {meta.piece_title && (
                <span>
                  <span className="text-gray-400">대상곡</span>{" "}
                  <span className="font-medium text-gray-800">{meta.piece_title}</span>
                </span>
              )}
              <span>
                <span className="text-gray-400">저자</span>{" "}
                <span className="font-medium text-gray-800">{meta.author || "-"}</span>
              </span>
              <span>
                <span className="text-gray-400">연도</span>{" "}
                <span className="font-medium text-gray-800">{meta.year || "-"}</span>
              </span>
              <span className="text-gray-400">
                {pageCount}p · {extractedText.length.toLocaleString()}자
              </span>
            </div>
          )}
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={onToggleEdit}
              className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Pencil className="w-3 h-3" />
              {editMode ? "닫기" : "수정"}
            </button>
          </div>
        </div>
      )}

      {/* 완료 상태 */}
      {status === "done" && meta && (
        <p className="text-xs text-green-600 mt-1">
          {meta.composer} — {meta.title} 저장됨
        </p>
      )}
    </div>
  );
}
