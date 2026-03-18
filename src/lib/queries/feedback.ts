import { supabase } from "@/lib/supabase";
import { dbMutate } from "@/lib/db-mutate";
import type { Tables, Json } from "@/types/database";
import type { FeedbackRequest, FeedbackRequestStatus, Feedback, FeedbackComment, PracticeCard } from "@/types";

type FeedbackRequestRow = Tables<"feedback_requests">;

export type { FeedbackRequest, FeedbackRequestStatus, Feedback };

export async function getFeedbackRequests(
  studentId: string
): Promise<FeedbackRequest[]> {
  const { data, error } = await supabase
    .from("feedback_requests")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getFeedbackRequests]", error.message);
    return [];
  }

  return (data ?? []).map(rowToRequest);
}

export async function getFeedbackRequestById(
  id: string
): Promise<FeedbackRequest | null> {
  const { data, error } = await supabase
    .from("feedback_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return rowToRequest(data);
}

export async function getTeacherFeedbackRequests(
  teacherId: string
): Promise<FeedbackRequest[]> {
  const { data, error } = await supabase
    .from("feedback_requests")
    .select("*")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []).map(rowToRequest);
}

export async function createFeedbackRequest(
  request: Pick<FeedbackRequest, "studentId" | "teacherId" | "piece" | "composer" | "description" | "problemType" | "measureStart" | "measureEnd" | "videoUrl" | "faceBlurred" | "creditAmount" | "paymentStatus" | "status">
): Promise<FeedbackRequest | null> {
  const result = await dbMutate<FeedbackRequestRow>({
    table: "feedback_requests",
    operation: "insert",
    data: {
      student_id: request.studentId,
      teacher_id: request.teacherId,
      piece: request.piece,
      composer: request.composer,
      description: request.description,
      problem_type: request.problemType,
      measure_start: request.measureStart,
      measure_end: request.measureEnd,
      video_url: request.videoUrl ?? null,
      status: request.status,
      face_blurred: request.faceBlurred,
      credit_amount: request.creditAmount,
      payment_status: request.paymentStatus,
    },
    returnData: true,
  });

  if (!result.success || !result.data) return null;
  return rowToRequest(result.data);
}

export async function updateFeedbackRequestStatus(
  id: string,
  status: FeedbackRequestStatus,
  additionalUpdates?: Record<string, unknown>
): Promise<boolean> {
  const updates: Record<string, unknown> = { status, ...additionalUpdates };
  const now = new Date().toISOString();
  if (status === "SENT") {
    updates.sent_at = now;
    updates.accept_deadline = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
    updates.payment_status = "held";
  }
  if (status === "ACCEPTED") {
    updates.accepted_at = now;
    updates.submit_deadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  }
  if (status === "SUBMITTED") updates.submitted_at = now;
  if (status === "COMPLETED") {
    updates.completed_at = now;
    updates.payment_status = "released";
  }
  if (status === "DECLINED") updates.payment_status = "refunded";
  if (status === "EXPIRED") updates.payment_status = "refunded";
  if (status === "REFUNDED") updates.payment_status = "refunded";

  const result = await dbMutate({
    table: "feedback_requests",
    operation: "update",
    data: updates,
    filters: { id },
  });

  return result.success;
}

export async function getFeedback(requestId: string): Promise<Feedback | null> {
  const { data, error } = await supabase
    .from("feedbacks")
    .select("*")
    .eq("request_id", requestId)
    .single();

  if (error) return null;
  return {
    id: data.id,
    requestId: data.request_id,
    comments: (data.comments ?? []) as unknown as FeedbackComment[],
    demoVideoUrl: data.demo_video_url ?? undefined,
    practiceCard: (data.practice_card ?? { section: "", tempoProgression: "", steps: [], dailyMinutes: 0 }) as unknown as PracticeCard,
    submittedAt: data.submitted_at ?? "",
  };
}

export async function saveFeedback(
  feedback: Omit<Feedback, "id" | "submittedAt">
): Promise<boolean> {
  const result = await dbMutate({
    table: "feedbacks",
    operation: "insert",
    data: {
      request_id: feedback.requestId,
      comments: feedback.comments as unknown as Json,
      demo_video_url: feedback.demoVideoUrl ?? null,
      practice_card: feedback.practiceCard as unknown as Json,
    },
  });

  return result.success;
}

/** DB row → FeedbackRequest (null → undefined 변환) */
function rowToRequest(row: FeedbackRequestRow): FeedbackRequest {
  return {
    id: row.id,
    studentId: row.student_id,
    teacherId: row.teacher_id,
    piece: row.piece,
    composer: row.composer,
    description: row.description,
    problemType: row.problem_type,
    measureStart: row.measure_start,
    measureEnd: row.measure_end,
    videoUrl: row.video_url ?? undefined,
    status: (row.status ?? "DRAFT") as FeedbackRequestStatus,
    createdAt: row.created_at ?? "",
    sentAt: row.sent_at ?? undefined,
    acceptDeadline: row.accept_deadline ?? undefined,
    acceptedAt: row.accepted_at ?? undefined,
    submitDeadline: row.submit_deadline ?? undefined,
    submittedAt: row.submitted_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    declineReason: row.decline_reason ?? undefined,
    clarificationRequest: row.clarification_request ?? undefined,
    clarificationResponse: row.clarification_response ?? undefined,
    faceBlurred: row.face_blurred ?? false,
    creditAmount: row.credit_amount ?? 0,
    paymentStatus: (row.payment_status ?? "pending") as FeedbackRequest["paymentStatus"],
  };
}
