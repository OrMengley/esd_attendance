import { AttendanceStatus } from "./attendance.model";

export type CorrectionReason =
  | "teacher_wrong_status"
  | "student_valid_explanation"
  | "medical_reason"
  | "system_data_entry_error"
  | "other";

export interface AttendanceAuditLog {
  id: string;

  attendanceId: string;
  classroomId: string;
  studentId: string;
  attendanceDate: string; // YYYY-MM-DD

  previousStatus: AttendanceStatus | null;
  newStatus: AttendanceStatus;

  correctionReason: CorrectionReason;
  correctionNote?: string;

  correctedById: string;
  correctedByName: string;
  correctedByUsername: string;
  correctedByRole: "super_admin" | "admin";

  correctedAt: string; // ISO string

  studentSnapshot: {
    studentCode: string;
    fullNameKm?: string;
    fullNameEn?: string;
  };

  classroomSnapshot: {
    classCode: string;
    className: string;
  };

  teacherSnapshot?: {
    teacherId: string;
    fullName: string;
    username: string;
  };
}
