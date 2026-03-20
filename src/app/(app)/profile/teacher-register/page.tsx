"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { safeBack } from "@/lib/navigation";
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle,
  X,
  Shield,
  User,
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
  syncVerificationFromSupabase,
} from "@/lib/teacher-store";

const SPECIALTY_OPTIONS = [
  "피아노", "바이올린", "첼로", "비올라", "플루트",
  "클라리넷", "오보에", "트럼펫", "호른", "성악",
  "기타", "드럼", "작곡", "지휘",
];

type Step = 1 | 2 | 3 | 4;
const TOTAL_STEPS = 4;

export default function TeacherRegisterPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>(1);

  // 개인정보
  const [realName, setRealName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string[]>([]);

  // 서류
  const [documents, setDocuments] = useState<TeacherDocument[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<TeacherDocumentType>("graduation");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");
  const [verification, setVerification] = useState<TeacherVerification | null>(null);

  // 유효성
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    syncVerificationFromSupabase()
      .then(() => setVerification(getVerification()))
      .catch(() => setVerification(getVerification()));
  }, []);

  if (!verification) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto min-h-screen bg-blob-orange">
        <div className="bg-blob-orange-extra" />
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // 이미 승인됨
  if (verification.status === "approved") {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto min-h-screen bg-blob-orange">
        <div className="bg-blob-orange-extra" />
        <button onClick={() => safeBack(router)} className="mb-6">
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
            className="px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold"
          >
            프로필로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 심사 중
  if (verification.status === "pending") {
    const handleResubmit = () => {
      localStorage.removeItem("grit-on-teacher-verification");
      setVerification({
        id: "",
        applicantName: "",
        specialty: [],
        status: "none",
        documents: [],
      });
    };

    return (
      <div className="px-4 py-6 max-w-lg mx-auto min-h-screen bg-blob-orange">
        <div className="bg-blob-orange-extra" />
        <button onClick={() => safeBack(router)} className="mb-6">
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
            onClick={handleResubmit}
            className="w-full max-w-xs mx-auto py-3 bg-orange-600 text-white rounded-xl font-semibold text-sm mb-3"
          >
            다시 제출하기
          </button>
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

  const toggleSpecialty = (s: string) => {
    setSelectedSpecialty((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
    setErrors((prev) => ({ ...prev, specialty: "" }));
  };

  const validatePersonalInfo = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!realName.trim()) {
      newErrors.realName = "실명을 입력해주세요.";
    } else if (realName.trim().length < 2) {
      newErrors.realName = "이름은 2글자 이상이어야 합니다.";
    }

    if (phone.trim() && !/^01[016789]-?\d{3,4}-?\d{4}$/.test(phone.replace(/\s/g, ""))) {
      newErrors.phone = "올바른 전화번호 형식이 아닙니다.";
    }

    if (selectedSpecialty.length === 0) {
      newErrors.specialty = "전공 분야를 1개 이상 선택해주세요.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextFromPersonalInfo = () => {
    if (validatePersonalInfo()) {
      setStep(3);
    }
  };

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
    submitVerification({
      documents,
      realName: realName.trim(),
      specialty: selectedSpecialty,
      phone: phone.trim() || undefined,
      aiReview,
    });
    setStep(4);
    setIsSubmitting(false);
    setSubmitStatus("");
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto min-h-screen bg-blob-orange">
      <div className="bg-blob-orange-extra" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => safeBack(router)}>
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">선생님 등록</h1>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= s
                  ? "bg-orange-600 text-white"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              {step > s ? <CheckCircle className="w-4 h-4" /> : s}
            </div>
            {s < TOTAL_STEPS && (
              <div
                className={`flex-1 h-0.5 ${
                  step > s ? "bg-orange-600" : "bg-gray-200"
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
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              선생님으로 활동하기
            </h2>
            <p className="text-gray-500 text-sm">
              학생들에게 원포인트 레슨을 제공하고<br />
              피드백으로 도움을 줄 수 있습니다.
            </p>
          </div>

          <div className="space-y-3 mb-8">
            {[
              { title: "개인정보 입력", desc: "실명, 전공 분야, 연락처 입력" },
              { title: "서류 제출", desc: "졸업증명서 또는 재학증명서 업로드" },
              { title: "심사 후 활동 시작", desc: "1~2일 내 검토 후 승인" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-white rounded-xl p-4 border border-gray-100"
              >
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-orange-600">{i + 1}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full py-3.5 bg-orange-600 text-white rounded-xl font-semibold text-sm"
          >
            시작하기
          </button>
        </div>
      )}

      {/* Step 2: 개인정보 입력 */}
      {step === 2 && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <User className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-bold text-gray-900">개인정보 입력</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            선생님 활동에 사용될 정보를 입력해주세요.
          </p>

          {/* 실명 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              실명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={realName}
              onChange={(e) => {
                setRealName(e.target.value);
                setErrors((prev) => ({ ...prev, realName: "" }));
              }}
              placeholder="홍길동"
              className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                errors.realName ? "border-red-300" : "border-gray-200"
              }`}
            />
            {errors.realName && (
              <p className="text-xs text-red-500 mt-1">{errors.realName}</p>
            )}
            <p className="text-[11px] text-gray-400 mt-1">
              학생들에게 표시되는 이름입니다.
            </p>
          </div>

          {/* 연락처 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              연락처 <span className="text-gray-400 font-normal">(선택)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setErrors((prev) => ({ ...prev, phone: "" }));
              }}
              placeholder="010-1234-5678"
              className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                errors.phone ? "border-red-300" : "border-gray-200"
              }`}
            />
            {errors.phone && (
              <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
            )}
          </div>

          {/* 전공 분야 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              전공 분야 <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-1">(복수 선택 가능)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SPECIALTY_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSpecialty(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedSpecialty.includes(s)
                      ? "bg-orange-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {errors.specialty && (
              <p className="text-xs text-red-500 mt-1.5">{errors.specialty}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm"
            >
              이전
            </button>
            <button
              onClick={handleNextFromPersonalInfo}
              className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-semibold text-sm"
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* Step 3: 서류 업로드 */}
      {step === 3 && (
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
                Object.entries(DOCUMENT_TYPE_LABELS) as [TeacherDocumentType, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedDocType(key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedDocType === key
                      ? "bg-orange-600 text-white"
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
            className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-orange-400 hover:bg-orange-50/50 transition-colors mb-4"
          >
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">클릭하여 파일 업로드</p>
            <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG (최대 10MB)</p>
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
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-orange-600" />
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
              onClick={() => setStep(2)}
              className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm"
            >
              이전
            </button>
            <button
              onClick={handleSubmit}
              disabled={documents.length === 0 || isSubmitting}
              className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50"
            >
              {isSubmitting ? (submitStatus || "제출 중...") : "제출하기"}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: 완료 */}
      {step === 4 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">신청 완료!</h2>
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
