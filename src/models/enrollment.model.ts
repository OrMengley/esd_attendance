export type EnrollmentStatus =
  | "active"
  | "completed"
  | "paused"
  | "cancelled"
  | "transferred";

export interface Enrollment {
  id: string;
  studentId: string;
  classroomId: string;
  packageId: string;

  startDate: string;
  expectedEndDate: string;
  actualEndDate?: string;

  status: EnrollmentStatus;
  note?: string;

  transferredAt?: string;
  transferredToEnrollmentId?: string;
  transferredFromEnrollmentId?: string;

  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}
