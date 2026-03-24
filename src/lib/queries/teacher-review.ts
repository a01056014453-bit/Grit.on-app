import { dbMutate } from "@/lib/db-mutate";

export interface TeacherReview {
  id: string;
  requestId: string;
  studentId: string;
  teacherId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface TeacherReviewRow {
  id: string;
  request_id: string;
  student_id: string;
  teacher_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

/**
 * 선생님 리뷰 생성
 * - request_id UNIQUE 제약으로 중복 방지
 * - 생성 후 teachers 테이블 rating 갱신
 */
export async function createTeacherReview(params: {
  requestId: string;
  studentId: string;
  teacherId: string;
  rating: number;
  comment?: string;
}): Promise<TeacherReview | null> {
  const result = await dbMutate<TeacherReviewRow>({
    table: "teacher_reviews",
    operation: "insert",
    data: {
      request_id: params.requestId,
      student_id: params.studentId,
      teacher_id: params.teacherId,
      rating: params.rating,
      comment: params.comment ?? null,
    },
    returnData: true,
  });

  if (!result.success || !result.data) return null;

  return rowToReview(result.data);
}

/**
 * 특정 피드백 요청에 대한 리뷰 조회
 * dbMutate는 select를 지원하지 않으므로 API를 직접 호출
 */
export async function getTeacherReview(
  requestId: string,
): Promise<TeacherReview | null> {
  try {
    const res = await fetch(`/api/db/query?table=teacher_reviews&filter=request_id.eq.${requestId}&limit=1`);
    if (!res.ok) return null;
    const { data } = await res.json();
    if (!data || data.length === 0) return null;
    return rowToReview(data[0]);
  } catch {
    return null;
  }
}

function rowToReview(row: TeacherReviewRow): TeacherReview {
  return {
    id: row.id,
    requestId: row.request_id,
    studentId: row.student_id,
    teacherId: row.teacher_id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
  };
}
