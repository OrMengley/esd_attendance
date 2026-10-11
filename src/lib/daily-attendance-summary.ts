import { Classroom } from "@/models/classroom.model";
import { StudyPackage } from "@/models/study-package.model";
import { User } from "@/models/user.model";
import {
  getCambodiaToday,
  getCambodiaNowTime,
  getDayOfWeekFromDateStr,
} from "./attendance-time-lock";

export type DailyClassAttendanceStatus =
  | "upcoming"
  | "not_recorded"
  | "partial"
  | "completed"
  | "missing"
  | "school_closed";

export interface ClassDailyAttendanceSummary {
  classroom: Classroom;
  studyPackage: StudyPackage | null;
  teacher: User | null;
  eligibleStudentCount: number;
  recordedStudentCount: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  permissionCount: number;
  attendanceRate: number | null; // null when recordedStudentCount === 0
  status: DailyClassAttendanceStatus;
  isHoliday: boolean;
  holidayNameKm?: string;
  holidayNameEn?: string;
  scheduleTypeText: "weekday" | "weekend";
}

export interface DailyAttendanceOverallSummary {
  selectedDate: string;
  isHoliday: boolean;
  holidayNameKm?: string;
  holidayNameEn?: string;
  scheduledClassesCount: number;
  completedClassesCount: number;
  pendingClassesCount: number; // partial + not_recorded
  missingClassesCount: number;
  upcomingClassesCount: number;
  totalEligibleStudents: number;
  totalRecordedStudents: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalPermission: number;
  overallAttendanceRate: number | null;
}

/**
 * Determine the daily attendance completion status of a classroom.
 */
export function determineClassDailyAttendanceStatus(params: {
  selectedDate: string;
  classroom: Classroom;
  eligibleStudentCount: number;
  recordedStudentCount: number;
  isHoliday?: boolean;
}): DailyClassAttendanceStatus {
  const {
    selectedDate,
    classroom,
    eligibleStudentCount,
    recordedStudentCount,
    isHoliday = false,
  } = params;

  if (isHoliday) {
    return "school_closed";
  }

  const cambodiaToday = getCambodiaToday();
  const cambodiaNow = getCambodiaNowTime();
  const startTime = classroom.startTime || "00:00";
  const endTime = classroom.endTime || "23:59";

  const isFuture = selectedDate > cambodiaToday;
  const isPast = selectedDate < cambodiaToday;
  const isToday = selectedDate === cambodiaToday;

  // 1. Future Date
  if (isFuture) {
    return "upcoming";
  }

  // 2. Today, but before start time
  if (isToday && cambodiaNow < startTime) {
    return "upcoming";
  }

  // 3. Completed (All eligible students recorded)
  if (eligibleStudentCount > 0 && recordedStudentCount >= eligibleStudentCount) {
    return "completed";
  }

  // 4. Incomplete or Zero attendance on Past Date -> Missing
  if (isPast) {
    return "missing";
  }

  // 5. Today after class ended -> Missing if incomplete or zero
  if (isToday && cambodiaNow > endTime) {
    return "missing";
  }

  // 6. Today in progress (startTime <= now <= endTime)
  if (isToday && cambodiaNow >= startTime && cambodiaNow <= endTime) {
    if (recordedStudentCount > 0) {
      return "partial";
    }
    return "not_recorded";
  }

  // Fallback for any edge cases
  if (recordedStudentCount > 0) {
    return "partial";
  }
  return "not_recorded";
}

/**
 * Add or subtract days to a YYYY-MM-DD date string
 */
export function shiftDateStr(dateStr: string, days: number): string {
  if (!dateStr) return getCambodiaToday();
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}
