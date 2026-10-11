import { Classroom, ClassroomStatus } from "@/models/classroom.model";
import { StudyPackage } from "@/models/study-package.model";
import { User } from "@/models/user.model";

export type ClassProgressStatusFilter = "all" | ClassroomStatus;

export type ClassProgressScheduleFilter = "all" | "weekday" | "weekend";

/**
 * Progress range buckets (based on progressPercent):
 * - not_started: 0%
 * - in_progress: 1–79%
 * - near_completion: 80–99%
 * - completed: 100%
 */
export type ClassProgressRangeFilter =
  | "all"
  | "not_started"
  | "in_progress"
  | "near_completion"
  | "completed";

/**
 * Completion health filter:
 * - on_track: not overdue and not completed
 * - overdue: remaining hours > 0 and expected end date has passed
 */
export type ClassProgressHealthFilter = "all" | "on_track" | "overdue";

export type ClassProgressHealth =
  | "not_started"
  | "on_track"
  | "near_completion"
  | "overdue"
  | "completed";

export interface ClassProgressFilters {
  searchQuery: string;
  status: ClassProgressStatusFilter;
  packageId: string; // 'all' or packageId
  teacherId: string; // 'all' or teacherId
  schedule: ClassProgressScheduleFilter;
  progressRange: ClassProgressRangeFilter;
  health: ClassProgressHealthFilter;
}

/** Pure learning-progress metrics for a single classroom (shared with the class detail page). */
export interface ClassProgressMetrics {
  plannedHours: number;
  completedHours: number;
  remainingHours: number;
  progressPercent: number;
  completedSessions: number;
  sessionHours: number;
  health: ClassProgressHealth;
  isOverdue: boolean;
  /** Classroom manually marked completed while completedHours < plannedHours. */
  isManuallyCompletedIncomplete: boolean;
}

export interface ClassCapacityMetrics {
  enrolledStudents: number;
  capacity: number | null; // null when classroom has no capacity configured
  availableSeats: number | null;
  capacityPercent: number;
}

export interface ClassProgressRow extends ClassProgressMetrics, ClassCapacityMetrics {
  classroom: Classroom;
  studyPackage: StudyPackage | null;
  teacher: User | null;
  scheduleType: "weekday" | "weekend";
  expectedEndDate: string;
}

export interface ClassProgressSummaryMetrics {
  totalClasses: number;
  activeClasses: number;
  completedClasses: number;
  averageProgress: number;
  nearCompletionClasses: number;
  overdueClasses: number;
}

export interface ClassProgressReportData {
  filters: ClassProgressFilters;
  rows: ClassProgressRow[];
  summary: ClassProgressSummaryMetrics;
  selectedPackage: StudyPackage | null;
  selectedTeacher: User | null;
  generatedAt: string; // Cambodia timezone display string
  generatedBy?: string;
}
