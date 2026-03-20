"use client";

import { useState } from "react";
import { X, UserPlus, Loader2, CheckCircle, Copy, Share2, Link } from "lucide-react";

interface InviteStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  { value: "전공", label: "전공" },
  { value: "취미", label: "취미" },
];

export function InviteStudentModal({ isOpen, onClose, onSuccess }: InviteStudentModalProps) {
  const [studentName, setStudentName] = useState("");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setStudentName("");
    setCategory("");
    setError("");
    setInviteUrl("");
    setCopied(false);
  };

  const handleClose = () => {
    if (inviteUrl) {
      onSuccess();
    }
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/teacher/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: studentName.trim() || undefined,
          category: category || undefined,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "초대 생성에 실패했습니다.");
        return;
      }

      setInviteUrl(result.inviteUrl);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("복사에 실패했습니다. 직접 복사해주세요.");
    }
  };

  const handleShare = async () => {
    if (!navigator.share) {
      await handleCopy();
      return;
    }

    try {
      await navigator.share({
        title: "Sempre - 학생 초대",
        text: studentName
          ? `${studentName}님, Sempre에서 함께 연습해요!`
          : "Sempre에서 함께 연습해요!",
        url: inviteUrl,
      });
    } catch (err) {
      // 사용자가 공유를 취소한 경우 무시
      if (err instanceof Error && err.name !== "AbortError") {
        await handleCopy();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 pb-8 max-h-[85vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-bold text-gray-900">학생 초대</h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
            aria-label="닫기"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {inviteUrl ? (
          /* 초대 링크 생성 완료 */
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-1">초대 링크가 생성되었습니다</p>
            <p className="text-sm text-gray-500 mb-5">
              링크를 학생에게 카카오톡, 문자 등으로 보내주세요.
            </p>

            {/* 링크 표시 */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 mb-4">
              <Link className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-600 truncate flex-1 text-left">{inviteUrl}</span>
            </div>

            {/* 공유 버튼들 */}
            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    링크 복사
                  </>
                )}
              </button>
              <button
                onClick={handleShare}
                className="flex-1 py-3 bg-orange-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                공유하기
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-5">
              초대 링크를 생성하여 학생에게 공유할 수 있습니다.
            </p>

            {/* 학생 이름 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                학생 이름 <span className="text-gray-400 font-normal">(선택)</span>
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="이름을 입력하세요"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* 카테고리 */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                분류 <span className="text-gray-400 font-normal">(선택)</span>
              </label>
              <div className="flex gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCategory(category === c.value ? "" : c.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      category === c.value
                        ? "bg-orange-100 text-orange-700 border border-orange-200"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="mb-4 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium"
                disabled={isSubmitting}
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-orange-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                aria-label="초대 링크 생성"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Link className="w-4 h-4" />
                    초대 링크 생성
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
