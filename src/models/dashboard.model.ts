import { Classroom } from "./classroom.model";
import { StudyPackage } from "./study-package.model";
import { User } from "./user.model";

export type DashboardClassAttendanceStatus =
  | "upcoming"
  | "in_progress"
  | "completed"
  | "partial"
  | "missing"
  | "holiday";

export interface AdminDashboardMetrics {
  activeStudentsCount: number;
  activeClassesCount: number;
  activeTeachersCount: number;
  todayScheduledClassesCount: number;
  attendanceRecordedCount: number;
  requiresAttentionCount: number;
}

export interface AdminAttendanceOverview {
  presentCount: number;
  absentCount: number;
  lateCount: number;
  permissionCount: number;
  totalRecorded: number;
  totalEligible: number;
  attendanceRate: number | null; // null when totalRecorded === 0
}

export interface AdminClassAttendanceItem {
  classroom: Classroom;
  studyPackage: StudyPackage | null;
  teacher: User | null;
  scheduleTime: string;
  enrolledCount: number;
  recordedCount: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  permissionCount: number;
  status: DashboardClassAttendanceStatus;
}

export type AttentionItemType =
  | "missing_attendance"
  | "partial_attendance"
  | "overdue_class"
  | "repeated_absence_late";

export interface AttentionItem {
  id: string;
  type: AttentionItemType;
  title: string;
  description: string;
  severity: "danger" | "warning" | "info";
  link: string;
  linkText?: string;
}

export interface TeacherDashboardMetrics {
  myActiveClassesCount: number;
  todayClassesCount: number;
  attendanceCompletedCount: number;
  requiresAttendanceCount: number;
  nextClassText: string;
  nextClass: Classroom | null;
}

export type TeacherSessionState =
  | "upcoming"
  | "in_progress"
  | "completed"
  | "requires_attendance"
  | "locked";

export type TeacherActionType =
  | "disabled_upcoming"
  | "mark"
  | "continue"
  | "view"
  | "required";

export interface TeacherScheduleItem {
  classroom: Classroom;
  studyPackage: StudyPackage | null;
  scheduleTime: string;
  enrolledCount: number;
  recordedCount: number;
  sessionState: TeacherSessionState;
  actionType: TeacherActionType;
  actionText: string;
  actionLink: string;
}

export interface DashboardData {
  selectedDate: string; // YYYY-MM-DD in Cambodia
  currentTimeStr: string; // HH:mm in Cambodia
  isHoliday: boolean;
  holidayNameKm?: string;
  holidayNameEn?: string;
  admin?: {
    metrics: AdminDashboardMetrics;
    attendanceOverview: AdminAttendanceOverview;
    classes: AdminClassAttendanceItem[];
    attentionItems: AttentionItem[];
  };
  teacher?: {
    metrics: TeacherDashboardMetrics;
    schedule: TeacherScheduleItem[];
    hasNoClassesScheduled: boolean;
    hasNoAssignedClassrooms: boolean;
  };
}
