"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle,
  X,
  Shield,
} from "lucide-react";
import {
  TeacherDocument,
  TeacherDocumentType,
  TeacherVerification,
  DOCUMENT_TYPE_LABELS,
  AIReview,
} from "@/types";
import {
  getVerification,
  submitVerification,
} from "@/lib/teacher-store";

type Step = 1 | 2 | 3;

export default function TeacherRegisterPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>(1);
  const [documents, setDocuments] = useState<TeacherDocument[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<TeacherDocumentType>("graduation");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");
  const [verification, setVerification] = useState<TeacherVerification | null>(null);

  useEffect(() => {
    setVerification(getVerification());
  }, []);

  // 클라이언트에서 verification 로딩 전까지 로딩 표시
  if (!verification) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // If already approved, show status
  if (verification.status === "approved") {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
        <button onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">인증 완료</h2>
          <p className="text-gray-500 mb-6">
            선생님 인증이 완료되었습니다.<br />
            프로필에서 선생님 모드를 활성화하세요.
          </p>
          <button
            onClick={() => router.push("/profile")}
            className="px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold"
          >
            프로필로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // If pending
  if (verification.status === "pending") {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
        <button onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">심사 중</h2>
          <p className="text-gray-500 mb-2">
            제출하신 서류를 검토 중입니다.<br />
            보통 1~2일 내에 완료됩니다.
          </p>
          <p className="text-xs text-gray-400 mb-6">
            신청일: {new Date(verification.appliedAt!).toLocaleDateString("ko-KR")}
          </p>

          <button
            onClick={() => router.push("/profile")}
            className="text-sm text-gray-500 underline"
          >
            프로필로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("파일 크기는 10MB 이하여야 합니다.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const doc: TeacherDocument = {
        id: `doc-${Date.now()}`,
        type: selectedDocType,
        fileName: file.name,
        fileData: event.target?.result as string,
        uploadedAt: new Date().toISOString(),
      };
      setDocuments((prev) => [...prev, doc]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSubmit = async () => {
    if (documents.length === 0) return;
    setIsSubmitting(true);

    let aiReview: AIReview | undefined;

    // AI 사전 분석 시도
    try {
      setSubmitStatus("AI 서류 분석 중...");
      const res = await fetch("/api/verify-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documents: documents.map((d) => ({
            id: d.id,
            type: d.type,
            fileName: d.fileName,
            fileData: d.fileData,
          })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        aiReview = data.aiReview;
      }
    } catch {
      // AI 분석 실패해도 제출은 진행
    }

    setSubmitStatus("서류 제출 중...");
    submitVerification(documents, aiReview);
    setStep(3);
    setIsSubmitting(false);
    setSubmitStatus("");
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()}>
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">선생님 등록</h1>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= s
                  ? "bg-violet-600 text-white"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              {step > s ? <CheckCircle className="w-4 h-4" /> : s}
            </div>
            {s < 3 && (
              <div
                className={`flex-1 h-0.5 ${
                  step > s ? "bg-violet-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: 안내 */}
      {step === 1 && (
        <div>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-violet-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              선생님으로 활동하기
            </h2>
            <p className="text-gray-500 text-sm">
              학생들에게 원포인트 레슨을 제공하고<br />
              크레딧을 받을 수 있습니다.
            </p>
          </div>

          <div className="space-y-3 mb-8">
            {[
              { title: "서류 제출", desc: "졸업증명서 또는 재학증명서 업로드" },
              { title: "심사 진행", desc: "1~2일 내 서류 검토 완료" },
              { title: "활동 시작", desc: "인증 후 선생님 모드 활성화" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-white rounded-xl p-4 border border-gray-100"
              >
                <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-violet-600">
                    {i + 1}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full py-3.5 bg-violet-600 text-white rounded-xl font-semibold text-sm"
          >
            서류 제출하기
          </button>
        </div>
      )}

      {/* Step 2: 서류 업로드 */}
      {step === 2 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">서류 업로드</h2>
          <p className="text-sm text-gray-500 mb-6">
            음악 관련 학력 또는 자격을 증명할 수 있는 서류를 업로드해 주세요.
          </p>

          {/* Document Type Select */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              서류 종류
            </label>
            <div className="flex gap-2 flex-wrap">
              {(
                Object.entries(DOCUMENT_TYPE_LABELS) as [
                  TeacherDocumentType,
                  string
                ][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedDocType(key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedDocType === key
                      ? "bg-violet-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Upload Area */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-violet-400 hover:bg-violet-50/50 transition-colors mb-4"
          >
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">
              클릭하여 파일 업로드
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PDF, JPG, PNG (최대 10MB)
            </p>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Uploaded Documents */}
          {documents.length > 0 && (
            <div className="space-y-2 mb-6">
              <p className="text-sm font-medium text-gray-700">
                업로드된 서류 ({documents.length})
              </p>
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100"
                >
                  <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {DOCUMENT_TYPE_LABELS[doc.type]}
                    </p>
                  </div>
                  <button
                    onClick={() => removeDocument(doc.id)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm"
            >
              이전
            </button>
            <button
              onClick={handleSubmit}
              disabled={documents.length === 0 || isSubmitting}
              className="flex-1 py-3 bg-violet-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50"
            >
              {isSubmitting ? (submitStatus || "제출 중...") : "제출하기"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: 완료 */}
      {step === 3 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            신청 완료!
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            서류 검토 후 결과를 알려드리겠습니다.<br />
            보통 1~2일 내에 완료됩니다.
          </p>

          <button
            onClick={() => router.push("/profile")}
            className="text-sm text-gray-500 underline"
          >
            프로필로 돌아가기
          </button>
        </div>
      )}
    </div>
  );
}
