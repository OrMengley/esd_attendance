import { Student } from "@/models/student.model";
import { Classroom } from "@/models/classroom.model";
import { StudyPackage } from "@/models/study-package.model";
import { User } from "@/models/user.model";

export type AbsenceLateReportType = "either" | "absent_only" | "late_only";

export type ScheduleFilterType = "all" | "weekday" | "weekend";

export interface AbsenceLateFilters {
  yearMonth: string; // YYYY-MM
  reportType: AbsenceLateReportType;
  minOccurrences: number;
  selectedClassId: string; // 'all' or classroomId
  selectedTeacherId: string; // 'all' or teacherId
  selectedPackageId: string; // 'all' or packageId
  selectedSchedule: ScheduleFilterType;
  searchQuery: string;
}

export interface AbsenceLateIncident {
  date: string; // YYYY-MM-DD
  status: "absent" | "late";
  remark?: string;
  classroomId: string;
  classroomName: string;
  classroomCode?: string;
}

export interface AbsenceLateStudentRow {
  rank: number;
  student: Student;
  currentClass: Classroom;
  assignedTeacher: User | null;
  studyPackage: StudyPackage | null;
  scheduleTypeText: "weekday" | "weekend";
  plannedSessions: number;
  elapsedSessions: number;
  scheduledSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  permissionCount: number;
  attendanceRate: number | null;
  lastIncidentDate: string | null;
  lastIncidentStatus: "absent" | "late" | null;
  incidents: AbsenceLateIncident[];
}

export interface AbsenceLateSummaryMetrics {
  studentsFlagged: number;
  studentsWithAbsences: number;
  studentsWithLates: number;
  totalAbsences: number;
  totalLates: number;
}

export interface AbsenceLateReportData {
  selectedMonth: string; // YYYY-MM
  monthNameKm: string;
  monthNameEn: string;
  filters: AbsenceLateFilters;
  students: AbsenceLateStudentRow[];
  summary: AbsenceLateSummaryMetrics;
  generatedAt: string;
  generatedBy?: string;
}
