export type InvitationStatus = "pending" | "accepted" | "expired" | "canceled";

export interface Invitation {
  id: string;
  teacherId: string;
  studentName?: string;
  email?: string;
  phone?: string;
  category?: string;
  token: string;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvitationInput {
  studentName?: string;
  email?: string;
  phone?: string;
  category?: string;
}

export interface InvitationDetail extends Invitation {
  teacherName: string;
  teacherSpecialty: string[];
}
