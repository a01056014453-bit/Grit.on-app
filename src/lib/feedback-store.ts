// LocalStorage-based store for feedback requests
import {
  FeedbackRequest,
  Feedback,
  FeedbackRequestStatus,
  Teacher,
} from "@/types";
import {
  mockFeedbackRequests,
  mockFeedbacks,
  getFeedbackRequestById as getMockRequestById,
} from "@/data/mock-feedback-requests";
import { mockTeachers, getTeacherById as getMockTeacherById } from "@/data/mock-teachers";

const STORAGE_KEY = "griton_feedback_requests";
const FEEDBACKS_KEY = "griton_feedbacks";

// Initialize storage with mock data if empty
function initializeStorage(): void {
  if (typeof window === "undefined") return;

  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockFeedbackRequests));
  }
  if (!localStorage.getItem(FEEDBACKS_KEY)) {
    localStorage.setItem(FEEDBACKS_KEY, JSON.stringify(mockFeedbacks));
  }
}

// Teacher functions (read-only from mock data)
export function getTeachers(): Teacher[] {
  return mockTeachers;
}

export function getTeacherById(id: string): Teacher | undefined {
  return getMockTeacherById(id);
}

export function searchTeachers(query: string): Teacher[] {
  const lowerQuery = query.toLowerCase();
  return mockTeachers.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.title.toLowerCase().includes(lowerQuery) ||
      t.specialty.some((s) => s.toLowerCase().includes(lowerQuery))
  );
}

export function filterTeachers(options: {
  specialty?: string;
  minRating?: number;
  maxPrice?: number;
  sortBy?: "rating" | "price" | "responseTime" | "completedCount";
}): Teacher[] {
  let filtered = [...mockTeachers];

  if (options.specialty) {
    filtered = filtered.filter((t) =>
      t.specialty.some((s) =>
        s.toLowerCase().includes(options.specialty!.toLowerCase())
      )
    );
  }

  if (options.minRating) {
    filtered = filtered.filter((t) => t.rating >= options.minRating!);
  }

  if (options.maxPrice) {
    filtered = filtered.filter((t) => t.priceCredits <= options.maxPrice!);
  }

  if (options.sortBy) {
    switch (options.sortBy) {
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "price":
        filtered.sort((a, b) => a.priceCredits - b.priceCredits);
        break;
      case "responseTime":
        filtered.sort((a, b) => a.avgResponseTime - b.avgResponseTime);
        break;
      case "completedCount":
        filtered.sort((a, b) => b.completedCount - a.completedCount);
        break;
    }
  }

  return filtered;
}

// Feedback Request functions
export function getFeedbackRequests(): FeedbackRequest[] {
  if (typeof window === "undefined") return mockFeedbackRequests;
  initializeStorage();
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : mockFeedbackRequests;
}

export function getFeedbackRequestById(id: string): FeedbackRequest | undefined {
  const requests = getFeedbackRequests();
  return requests.find((r) => r.id === id);
}

export function getFeedbackRequestsByStudent(studentId: string): FeedbackRequest[] {
  return getFeedbackRequests().filter((r) => r.studentId === studentId);
}

export function getFeedbackRequestsForTeacher(teacherId: string): FeedbackRequest[] {
  return getFeedbackRequests().filter((r) => r.teacherId === teacherId);
}

export function saveFeedbackRequest(
  request: Omit<FeedbackRequest, "id" | "createdAt">
): FeedbackRequest {
  const requests = getFeedbackRequests();
  const newRequest: FeedbackRequest = {
    ...request,
    id: `fr${Date.now()}`,
    createdAt: new Date().toISOString(),
    teacher: getTeacherById(request.teacherId),
  };
  requests.push(newRequest);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  return newRequest;
}

export function updateFeedbackRequest(
  id: string,
  updates: Partial<FeedbackRequest>
): FeedbackRequest | null {
  const requests = getFeedbackRequests();
  const index = requests.findIndex((r) => r.id === id);
  if (index === -1) return null;

  requests[index] = { ...requests[index], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  return requests[index];
}

export function updateRequestStatus(
  id: string,
  status: FeedbackRequestStatus,
  additionalUpdates?: Partial<FeedbackRequest>
): FeedbackRequest | null {
  const now = new Date().toISOString();
  const updates: Partial<FeedbackRequest> = { status, ...additionalUpdates };

  // Set timestamps based on status
  switch (status) {
    case "SENT":
      updates.sentAt = now;
      updates.acceptDeadline = new Date(
        Date.now() + 12 * 60 * 60 * 1000
      ).toISOString(); // +12h
      updates.paymentStatus = "held";
      break;
    case "ACCEPTED":
      updates.acceptedAt = now;
      updates.submitDeadline = new Date(
        Date.now() + 48 * 60 * 60 * 1000
      ).toISOString(); // +48h
      break;
    case "DECLINED":
      updates.paymentStatus = "refunded";
      break;
    case "EXPIRED":
      updates.paymentStatus = "refunded";
      break;
    case "SUBMITTED":
      updates.submittedAt = now;
      break;
    case "COMPLETED":
      updates.completedAt = now;
      updates.paymentStatus = "released";
      break;
    case "REFUNDED":
      updates.paymentStatus = "refunded";
      break;
  }

  return updateFeedbackRequest(id, updates);
}

export function deleteFeedbackRequest(id: string): boolean {
  const requests = getFeedbackRequests();
  const filtered = requests.filter((r) => r.id !== id);
  if (filtered.length === requests.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

// Feedback functions
export function getFeedbacks(): Record<string, Feedback> {
  if (typeof window === "undefined") return mockFeedbacks;
  initializeStorage();
  const stored = localStorage.getItem(FEEDBACKS_KEY);
  return stored ? JSON.parse(stored) : mockFeedbacks;
}

export function getFeedbackByRequestId(requestId: string): Feedback | undefined {
  const feedbacks = getFeedbacks();
  return feedbacks[requestId];
}

export function saveFeedback(feedback: Omit<Feedback, "id" | "submittedAt">): Feedback {
  const feedbacks = getFeedbacks();
  const newFeedback: Feedback = {
    ...feedback,
    id: `fb${Date.now()}`,
    submittedAt: new Date().toISOString(),
  };
  feedbacks[feedback.requestId] = newFeedback;
  localStorage.setItem(FEEDBACKS_KEY, JSON.stringify(feedbacks));

  // Update request status to SUBMITTED
  updateRequestStatus(feedback.requestId, "SUBMITTED");

  return newFeedback;
}

// Helper: Calculate remaining time for SLA
export function getRemainingTime(deadline: string): {
  hours: number;
  minutes: number;
  isExpired: boolean;
  text: string;
} {
  const remaining = new Date(deadline).getTime() - Date.now();
  const isExpired = remaining <= 0;
  const hours = Math.max(0, Math.floor(remaining / (1000 * 60 * 60)));
  const minutes = Math.max(0, Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60)));

  let text = "";
  if (isExpired) {
    text = "만료됨";
  } else if (hours > 0) {
    text = `${hours}시간 ${minutes}분 남음`;
  } else {
    text = `${minutes}분 남음`;
  }

  return { hours, minutes, isExpired, text };
}

// Check and auto-expire requests
export function checkExpiredRequests(): void {
  const requests = getFeedbackRequests();
  const now = Date.now();
  let updated = false;

  requests.forEach((request) => {
    // Check accept deadline
    if (
      request.status === "SENT" &&
      request.acceptDeadline &&
      new Date(request.acceptDeadline).getTime() < now
    ) {
      updateRequestStatus(request.id, "EXPIRED");
      updated = true;
    }
  });
}
