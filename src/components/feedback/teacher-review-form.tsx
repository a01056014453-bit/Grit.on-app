"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { createTeacherReview, getTeacherReview, TeacherReview } from "@/lib/queries/teacher-review";

interface TeacherReviewFormProps {
  requestId: string;
  studentId: string;
  teacherId: string;
}

/**
 * 선생님 평가 폼
 * - 1~5점 별점 (필수)
 * - 한줄평 (선택, 100자)
 * - 이미 리뷰가 있으면 읽기 전용
 */
export function TeacherReviewForm({
  requestId,
  studentId,
  teacherId,
}: TeacherReviewFormProps) {
  const [existingReview, setExistingReview] = useState<TeacherReview | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    getTeacherReview(requestId)
      .then((review) => {
        if (review) {
          setExistingReview(review);
          setRating(review.rating);
          setComment(review.comment ?? "");
        }
      })
      .finally(() => setIsLoading(false));
  }, [requestId]);

  const handleSubmit = async () => {
    if (rating === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const review = await createTeacherReview({
        requestId,
        studentId,
        teacherId,
        rating,
        comment: comment.trim() || undefined,
      });

      if (review) {
        setExistingReview(review);
        setSubmitted(true);
      }
    } catch (err) {
      console.error("Failed to submit review:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl p-4 border border-border mb-4">
        <div className="h-20 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const isReadOnly = !!existingReview;
  const displayRating = hoverRating || rating;

  return (
    <div className="bg-card rounded-xl p-4 border border-border mb-4">
      <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Star className="w-4 h-4 text-amber-500" />
        {isReadOnly ? "내 평가" : "피드백 평가"}
      </h2>

      {/* 별점 */}
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={isReadOnly}
            onClick={() => !isReadOnly && setRating(star)}
            onMouseEnter={() => !isReadOnly && setHoverRating(star)}
            onMouseLeave={() => !isReadOnly && setHoverRating(0)}
            className={`transition-transform ${
              isReadOnly ? "cursor-default" : "cursor-pointer hover:scale-110"
            }`}
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                star <= displayRating
                  ? "text-amber-400 fill-current"
                  : "text-slate-200"
              }`}
            />
          </button>
        ))}
      </div>

      {/* 한줄평 */}
      {isReadOnly ? (
        comment && (
          <p className="text-sm text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
            {comment}
          </p>
        )
      ) : (
        <>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="피드백이 어떠셨나요? (선택)"
            maxLength={100}
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none mb-2"
          />
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">
              {comment.length}/100
            </p>
            <button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "등록 중..." : "평가 남기기"}
            </button>
          </div>
        </>
      )}

      {submitted && !existingReview?.comment && (
        <p className="text-xs text-green-600 mt-2">감사합니다! 평가가 등록되었습니다.</p>
      )}
    </div>
  );
}
