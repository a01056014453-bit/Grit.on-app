"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  BookOpen,
  Upload,
  Trash2,
  Loader2,
  FileText,
  Plus,
  X,
  Search,
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

// ── 리소스 타입 라벨 ──────────────────────────────────────

const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  paper: "논문",
  thesis: "석사논문",
  dissertation: "박사논문",
  article: "학술기사",
};

// ── 메인 페이지 ────────────────────────────────────────────

export default function ComposerResourcesPage() {
  const [resources, setResources] = useState<ComposerResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 업로드 폼 상태
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [formData, setFormData] = useState({
    composer: "",
    title: "",
    resource_type: "paper" as ResourceType,
    author: "",
    year: "",
    source: "",
    language: "ko",
    piece_title: "",
    tags: "",
  });
  const [extractedText, setExtractedText] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // ── PDF 파일 선택 ─────────────────────────────────────

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("PDF 파일만 업로드 가능합니다.");
      return;
    }

    setPdfFile(file);
    setExtracting(true);
    setUploadStatus("PDF에서 텍스트를 추출하는 중...");

    try {
      const result = await extractTextFromPdf(file);
      setExtractedText(result.text);
      setPageCount(result.pageCount);
      setUploadStatus(`${result.pageCount}페이지에서 ${result.text.length.toLocaleString()}자 추출 완료`);
    } catch (err) {
      console.error("PDF 추출 실패:", err);
      setUploadStatus("PDF 텍스트 추출에 실패했습니다. 텍스트를 직접 붙여넣어 주세요.");
    } finally {
      setExtracting(false);
    }
  };

  // ── 업로드 ────────────────────────────────────────────

  const handleUpload = async () => {
    if (!formData.composer.trim() || !formData.title.trim()) {
      alert("작곡가와 자료 제목은 필수입니다.");
      return;
    }
    if (!extractedText.trim()) {
      alert("추출된 텍스트가 없습니다. PDF를 업로드하거나 텍스트를 직접 입력해주세요.");
      return;
    }

    setUploading(true);
    setUploadStatus("저장 중...");

    try {
      const body = {
        composer: formData.composer.trim(),
        title: formData.title.trim(),
        resource_type: formData.resource_type,
        author: formData.author.trim() || undefined,
        year: formData.year.trim() || undefined,
        source: formData.source.trim() || undefined,
        language: formData.language,
        piece_title: formData.piece_title.trim() || undefined,
        extracted_text: extractedText,
        page_count: pageCount || undefined,
        file_size_bytes: pdfFile?.size,
        tags: formData.tags.trim()
          ? formData.tags.split(",").map((t) => t.trim())
          : undefined,
        auto_translate: formData.language !== "ko",
      };

      const res = await fetch("/api/composer-resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (json.success) {
        setUploadStatus("저장 완료!");
        resetForm();
        setShowUploadForm(false);
        fetchResources();
      } else {
        setUploadStatus(`오류: ${json.error}`);
      }
    } catch {
      setUploadStatus("네트워크 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      composer: "",
      title: "",
      resource_type: "paper",
      author: "",
      year: "",
      source: "",
      language: "ko",
      piece_title: "",
      tags: "",
    });
    setExtractedText("");
    setPageCount(0);
    setPdfFile(null);
    setUploadStatus("");
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
      const json = await res.json();
      if (json.success) {
        setDeleteTarget(null);
        fetchResources();
      }
    } catch {
      console.error("삭제 실패");
    }
  };

  // ── 필터링 ────────────────────────────────────────────

  const activeResources = resources.filter((r) => r.is_active);
  const filteredResources = searchQuery.trim()
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">학술자료 DB</h1>
          <p className="text-sm text-gray-500 mt-1">
            작곡가별 논문/학술자료를 관리하고 AI 분석에 활용합니다
          </p>
        </div>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          {showUploadForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showUploadForm ? "닫기" : "자료 추가"}
        </button>
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

      {/* Upload Form */}
      {showUploadForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">새 학술자료 추가</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                작곡가 *
              </label>
              <input
                type="text"
                value={formData.composer}
                onChange={(e) => setFormData({ ...formData, composer: e.target.value })}
                placeholder="예: Kapustin, Chopin"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                자료 제목 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="논문/자료 제목"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
              <select
                value={formData.resource_type}
                onChange={(e) =>
                  setFormData({ ...formData, resource_type: e.target.value as ResourceType })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="paper">논문</option>
                <option value="thesis">석사논문</option>
                <option value="dissertation">박사논문</option>
                <option value="article">학술기사</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">저자</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="저자명"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">연도</label>
              <input
                type="text"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                placeholder="2016"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">언어</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="ko">한국어</option>
                <option value="en">영어</option>
                <option value="de">독일어</option>
                <option value="fr">프랑스어</option>
                <option value="ja">일본어</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                출처 (학교/학술지)
              </label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="중앙대학교 대학원"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                대상곡 (선택)
              </label>
              <input
                type="text"
                value={formData.piece_title}
                onChange={(e) => setFormData({ ...formData, piece_title: e.target.value })}
                placeholder="예: Concert Etude Op.40 No.6"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              태그 (쉼표 구분)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="재즈, 화성분석, 형식분석, 연주법"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          {/* PDF 업로드 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PDF 파일 업로드
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-violet-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="pdf-upload"
              />
              <label htmlFor="pdf-upload" className="cursor-pointer">
                {extracting ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                    <span className="text-sm text-gray-500">텍스트 추출 중...</span>
                  </div>
                ) : pdfFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-8 h-8 text-violet-500" />
                    <span className="text-sm font-medium text-gray-700">{pdfFile.name}</span>
                    <span className="text-xs text-gray-500">
                      {(pdfFile.size / 1024 / 1024).toFixed(1)}MB
                      {pageCount > 0 && ` · ${pageCount}페이지`}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      PDF 파일을 선택하세요
                    </span>
                    <span className="text-xs text-gray-400">
                      텍스트가 자동으로 추출됩니다
                    </span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* 추출된 텍스트 미리보기/편집 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              추출된 텍스트 {extractedText && `(${extractedText.length.toLocaleString()}자)`}
            </label>
            <textarea
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              rows={8}
              placeholder="PDF에서 자동 추출되거나, 여기에 직접 텍스트를 붙여넣을 수 있습니다."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono resize-y focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>

          {uploadStatus && (
            <p className="text-sm text-violet-600 mb-4">{uploadStatus}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={uploading || extracting}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploading ? "저장 중..." : "저장"}
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowUploadForm(false);
              }}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
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
      ) : filteredResources.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-700">
            {searchQuery ? "검색 결과가 없습니다" : "등록된 학술자료가 없습니다"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {searchQuery ? "다른 키워드로 검색해보세요" : "위의 '자료 추가' 버튼으로 논문을 등록하세요"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  작곡가
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  자료 제목
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  유형
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  대상곡
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  저자 / 연도
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  텍스트
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredResources.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {r.composer}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-[240px] truncate">
                    {r.title}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-violet-50 text-violet-700 font-medium">
                      {RESOURCE_TYPE_LABELS[r.resource_type] || r.resource_type}
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
                    {r.page_count && ` · ${r.page_count}p`}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDeleteTarget(r)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      title="삭제"
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

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">자료 삭제</h3>
            <p className="text-sm text-gray-600 mb-4">
              &quot;{deleteTarget.title}&quot;을(를) 삭제하시겠습니까?
              <br />
              <span className="text-xs text-gray-400">
                (비활성화 처리되며 복구 가능합니다)
              </span>
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
