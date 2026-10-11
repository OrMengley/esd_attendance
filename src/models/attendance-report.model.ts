import { Classroom } from "./classroom.model";
import { StudyPackage } from "./study-package.model";
import { User } from "./user.model";
import { Student } from "./student.model";
import { Enrollment } from "./enrollment.model";
import { AttendanceStatus } from "./attendance.model";
import { SchoolHoliday } from "./school-holiday.model";

export type ReportCellStatus =
  | AttendanceStatus
  | "holiday"
  | "not_enrolled"
  | "unrecorded";

export type ReportCellCode = "P" | "A" | "L" | "E" | "H" | "—" | "•";

export interface ReportCellData {
  status: ReportCellStatus;
  code: ReportCellCode;
  attendanceDocId?: string;
  remark?: string;
  isHoliday?: boolean;
  holidayNameKm?: string;
  holidayNameEn?: string;
  isEligibleDate: boolean;
  hasRecord: boolean;
}

export interface ReportDateColumn {
  dateStr: string; // YYYY-MM-DD
  dayNumber: string; // "01", "02", ...
  dayOfWeek: number; // 1=Mon ... 7=Sun
  dayNameEn: string; // "Mon", "Tue", ...
  dayNameKm: string; // "ចន្ទ", "អង្គារ", ...
  shortHeaderEn: string; // "01 Mon"
  shortHeaderKm: string; // "០១ ចន្ទ"
  isHoliday: boolean;
  holiday?: SchoolHoliday | null;
  isScheduledSession: boolean; // True if scheduled learning day within class active range & not holiday
}

export interface StudentReportRow {
  student: Student;
  enrollment: Enrollment;
  cells: Record<string, ReportCellData>; // key: YYYY-MM-DD
  presentCount: number;
  absentCount: number;
  lateCount: number;
  permissionCount: number;
  recordedSessionCount: number; // present + absent + late + permission
  expectedSessionCount: number; // valid scheduled class sessions while student was actively enrolled
  attendanceRate: number; // percentage (0 - 100), rounded to 1 decimal
}

export interface ReportSummaryMetrics {
  totalEnrolledStudents: number;
  scheduledSessionsCount: number; // count of scheduled non-holiday class dates in the month
  recordedSessionsCount: number; // count of dates with at least 1 recorded student attendance
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalPermission: number;
  totalRecordedStudentSessions: number;
  overallAttendanceRate: number; // (totalPresent + totalLate + totalPermission) / totalRecordedStudentSessions * 100
}

export interface MonthlyAttendanceReportData {
  classroom: Classroom;
  studyPackage: StudyPackage | null;
  teacher: User | null;
  selectedMonth: string; // YYYY-MM
  monthNameEn: string; // e.g. "October 2026"
  monthNameKm: string; // e.g. "តុលា ២០២៦"
  dateColumns: ReportDateColumn[];
  studentRows: StudentReportRow[];
  summaryMetrics: ReportSummaryMetrics;
  generatedAt: string; // ISO / Phnom Penh formatted string
  generatedBy?: string;
}
