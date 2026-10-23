export interface EnrollmentTransfer {
  id: string;
  studentId: string;

  sourceEnrollmentId: string;
  sourceClassroomId: string;
  sourceBranchId?: string;

  targetEnrollmentId: string;
  targetClassroomId: string;
  targetBranchId?: string;

  packageId: string;
  effectiveDate: string;
  reason: string;

  transferredBy: string;
  transferredAt: string;
}
