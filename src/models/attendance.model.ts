export type AttendanceStatus =
  | "present"
  | "absent"
  | "late"
  | "permission";

export interface Attendance {
  id: string;
  attendanceDate: string; // YYYY-MM-DD

  studentId: string;
  enrollmentId: string;
  classroomId: string;
  packageId: string;
  teacherId: string;

  status: AttendanceStatus;
  remark?: string;

  recordedBy: string;
  recordedAt: string;
  updatedBy?: string;
  updatedAt?: string;

  // Document ID alias
  attendanceDocId?: string;

  // Correction audit fields
  lastCorrectedAt?: string;
  lastCorrectedById?: string;
  lastCorrectedByName?: string;
  lastCorrectedByUsername?: string;
  lastCorrectionReason?: string;
  lastCorrectionNote?: string;

  // Compatibility alias
  date?: string;
  subjectId?: string;
  createdAt?: string;
}

