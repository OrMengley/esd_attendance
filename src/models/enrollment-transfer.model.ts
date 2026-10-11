export interface EnrollmentTransfer {
  id: string;
  studentId: string;

  sourceEnrollmentId: string;
  sourceClassroomId: string;

  targetEnrollmentId: string;
  targetClassroomId: string;

  packageId: string;
  effectiveDate: string;
  reason: string;

  transferredBy: string;
  transferredAt: string;
}
