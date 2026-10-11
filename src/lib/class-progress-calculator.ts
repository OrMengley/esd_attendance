import { Classroom } from "@/models/classroom.model";
import { StudyPackage } from "@/models/study-package.model";
import { User } from "@/models/user.model";
import { Enrollment } from "@/models/enrollment.model";
import { SchoolHoliday } from "@/models/school-holiday.model";
import { getHolidayForDate } from "@/lib/holiday-calendar";
import { getCambodiaDateTime } from "@/lib/attendance-time-lock";
import { calculateSessionMinutes, getScheduleType } from "@/lib/classroom-schedule";
import {
  ClassCapacityMetrics,
  ClassProgressFilters,
  ClassProgressHealth,
  ClassProgressMetrics,
  ClassProgressReportData,
  ClassProgressRow,
  ClassProgressSummaryMetrics,
} from "@/models/class-progress-report.model";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_ITERATION_DAYS = 3650; // ~10 years safety guard
const NEAR_COMPLETION_THRESHOLD = 80;

export interface CambodiaNow {
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:mm
}

function parseYmdToUtc(dateStr: string): number | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return null;
  return Date.UTC(y, m - 1, d);
}

function utcToYmd(ms: number): string {
  const dt = new Date(ms);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addMinutesToTime(timeStr: string, minutes: number): string | null {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  const total = h * 60 + m + minutes;
  if (total >= 24 * 60) return "23:59";
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Session duration in minutes: classroom.sessionMinutes, falling back to endTime - startTime. */
export function getClassSessionMinutes(classroom: Classroom): number {
  if (classroom.sessionMinutes && classroom.sessionMinutes > 0) {
    return classroom.sessionMinutes;
  }
  return calculateSessionMinutes(classroom.startTime, classroom.endTime);
}

/** Time (HH:mm) at which a scheduled session ends. */
function getSessionEndTime(classroom: Classroom, sessionMinutes: number): string {
  if (classroom.endTime) return classroom.endTime;
  return addMinutesToTime(classroom.startTime, sessionMinutes) || "23:59";
}

export function getClassScheduleType(classroom: Classroom): "weekday" | "weekend" {
  return getScheduleType(classroom.scheduleDays) === "weekend" ? "weekend" : "weekday";
}

/**
 * Counts class sessions that have already ended.
 *
 * A session counts only when ALL conditions are true:
 * - the date matches the classroom learning days
 * - the date is on/after startDate and on/before expectedEndDate
 * - the date is not an active school holiday
 * - past dates always count; today counts only once endTime has passed (Cambodia time)
 * - future dates never count
 *
 * Attendance records are intentionally NOT used: progress is driven by the schedule.
 */
export function countCompletedSessions(
  classroom: Classroom,
  holidays: SchoolHoliday[],
  now: CambodiaNow
): number {
  const startMs = parseYmdToUtc(classroom.startDate);
  if (startMs === null) return 0;
  if (!classroom.scheduleDays || classroom.scheduleDays.length === 0) return 0;

  const todayMs = parseYmdToUtc(now.dateStr);
  if (todayMs === null) return 0;

  // Upper bound: never beyond today, expected end date, or an earlier actual end date.
  let lastMs = todayMs;
  const expectedMs = parseYmdToUtc(classroom.expectedEndDate);
  if (expectedMs !== null) lastMs = Math.min(lastMs, expectedMs);
  const actualMs = classroom.actualEndDate ? parseYmdToUtc(classroom.actualEndDate) : null;
  if (actualMs !== null) lastMs = Math.min(lastMs, actualMs);

  if (lastMs < startMs) return 0;

  const sessionMinutes = getClassSessionMinutes(classroom);
  const endTime = getSessionEndTime(classroom, sessionMinutes);

  let count = 0;
  let iterations = 0;
  for (let ms = startMs; ms <= lastMs && iterations < MAX_ITERATION_DAYS; ms += DAY_MS, iterations++) {
    const jsDay = new Date(ms).getUTCDay(); // 0=Sun ... 6=Sat
    const customDay = jsDay === 0 ? 7 : jsDay; // 1=Mon ... 7=Sun
    if (!classroom.scheduleDays.includes(customDay)) continue;

    const dateStr = utcToYmd(ms);
    if (getHolidayForDate(dateStr, holidays)) continue;

    if (dateStr < now.dateStr) {
      count++;
    } else if (dateStr === now.dateStr && now.timeStr >= endTime) {
      count++;
    }
  }

  return count;
}

function roundTo(value: number, digits: number): number {
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
}

/**
 * Single source of truth for a classroom's learning progress.
 * Used by the Class Progress Report and the Classroom Detail page.
 */
export function calculateClassProgressMetrics(params: {
  classroom: Classroom;
  studyPackage: StudyPackage | null;
  holidays: SchoolHoliday[];
  now?: CambodiaNow;
}): ClassProgressMetrics {
  const { classroom, studyPackage, holidays } = params;
  const now = params.now ?? getCambodiaDateTime();

  const plannedHours = studyPackage?.totalPlannedHours && studyPackage.totalPlannedHours > 0
    ? studyPackage.totalPlannedHours
    : 0;

  const sessionHours = getClassSessionMinutes(classroom) / 60;
  const completedSessions = countCompletedSessions(classroom, holidays, now);

  const completedHoursRaw = completedSessions * sessionHours;
  const completedHours = roundTo(Math.min(completedHoursRaw, plannedHours), 2);
  const remainingHours = roundTo(Math.max(0, plannedHours - completedHours), 2);

  let progressPercent =
    plannedHours > 0 ? roundTo(Math.min((completedHours / plannedHours) * 100, 100), 1) : 0;
  // Never show 100% while hours remain (rounding guard).
  if (remainingHours > 0 && progressPercent >= 100) progressPercent = 99.9;

  const isManualCompleted = classroom.status === "completed";
  const isOverdueCandidate =
    plannedHours > 0 &&
    remainingHours > 0 &&
    !!classroom.expectedEndDate &&
    classroom.expectedEndDate < now.dateStr;

  let health: ClassProgressHealth;
  if (isManualCompleted || (plannedHours > 0 && remainingHours <= 0)) {
    health = "completed";
  } else if (isOverdueCandidate) {
    health = "overdue";
  } else if (remainingHours > 0 && progressPercent >= NEAR_COMPLETION_THRESHOLD) {
    health = "near_completion";
  } else if (completedSessions === 0) {
    health = "not_started";
  } else {
    health = "on_track";
  }

  return {
    plannedHours,
    completedHours,
    remainingHours,
    progressPercent,
    completedSessions,
    sessionHours,
    health,
    isOverdue: health === "overdue",
    isManuallyCompletedIncomplete: isManualCompleted && completedHours < plannedHours,
  };
}

/** Capacity based on active/current enrollments only. */
export function calculateClassCapacityMetrics(
  classroom: Classroom,
  enrolledStudents: number
): ClassCapacityMetrics {
  const capacity = classroom.capacity && classroom.capacity > 0 ? classroom.capacity : null;
  return {
    enrolledStudents,
    capacity,
    availableSeats: capacity !== null ? Math.max(0, capacity - enrolledStudents) : null,
    capacityPercent: capacity !== null ? roundTo((enrolledStudents / capacity) * 100, 1) : 0,
  };
}

/** Counts active enrollments per classroom in a single pass (no per-class reads). */
export function countActiveEnrollmentsByClassroom(
  enrollments: Enrollment[]
): Map<string, number> {
  const studentsByClass = new Map<string, Set<string>>();
  enrollments.forEach((enr) => {
    if (enr.status !== "active") return;
    const set = studentsByClass.get(enr.classroomId) || new Set<string>();
    set.add(enr.studentId);
    studentsByClass.set(enr.classroomId, set);
  });

  const counts = new Map<string, number>();
  studentsByClass.forEach((set, classroomId) => counts.set(classroomId, set.size));
  return counts;
}

/** Formats hours: integer when whole, otherwise up to 2 decimals (e.g. 10 / 10.5). */
export function formatHours(hours: number): string {
  if (!isFinite(hours)) return "0";
  return String(roundTo(hours, 2));
}

export function formatPercent(percent: number): string {
  const rounded = roundTo(percent, 1);
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}

function healthSortWeight(health: ClassProgressHealth): number {
  if (health === "overdue") return 0;
  if (health === "near_completion") return 1;
  return 2;
}

/**
 * Default sorting:
 * 1. Overdue classes first
 * 2. Near completion classes second
 * 3. Lowest progress percentage after that
 * 4. Class name
 */
export function sortClassProgressRows(rows: ClassProgressRow[]): ClassProgressRow[] {
  return [...rows].sort((a, b) => {
    const weightDiff = healthSortWeight(a.health) - healthSortWeight(b.health);
    if (weightDiff !== 0) return weightDiff;
    if (a.progressPercent !== b.progressPercent) return a.progressPercent - b.progressPercent;
    return (a.classroom.name || "").localeCompare(b.classroom.name || "");
  });
}

export function filterClassProgressRows(
  rows: ClassProgressRow[],
  filters: ClassProgressFilters
): ClassProgressRow[] {
  const q = filters.searchQuery.trim().toLowerCase();

  return rows.filter((row) => {
    const { classroom } = row;

    if (q) {
      const name = (classroom.name || "").toLowerCase();
      const code = (classroom.code || "").toLowerCase();
      if (!name.includes(q) && !code.includes(q)) return false;
    }

    if (filters.status !== "all" && classroom.status !== filters.status) return false;
    if (filters.packageId !== "all" && classroom.packageId !== filters.packageId) return false;
    if (filters.teacherId !== "all" && classroom.assignedTeacherId !== filters.teacherId) {
      return false;
    }
    if (filters.schedule !== "all" && row.scheduleType !== filters.schedule) return false;

    switch (filters.progressRange) {
      case "not_started":
        if (row.progressPercent !== 0) return false;
        break;
      case "in_progress":
        if (!(row.progressPercent > 0 && row.progressPercent < NEAR_COMPLETION_THRESHOLD)) {
          return false;
        }
        break;
      case "near_completion":
        if (!(row.progressPercent >= NEAR_COMPLETION_THRESHOLD && row.progressPercent < 100)) {
          return false;
        }
        break;
      case "completed":
        if (row.progressPercent < 100) return false;
        break;
      default:
        break;
    }

    if (filters.health === "overdue" && row.health !== "overdue") return false;
    if (filters.health === "on_track" && (row.health === "overdue" || row.health === "completed")) {
      return false;
    }

    return true;
  });
}

export function calculateClassProgressSummary(
  rows: ClassProgressRow[]
): ClassProgressSummaryMetrics {
  const totalClasses = rows.length;
  const activeClasses = rows.filter((r) => r.classroom.status === "active").length;
  const completedClasses = rows.filter((r) => r.classroom.status === "completed").length;
  const nearCompletionClasses = rows.filter(
    (r) =>
      r.classroom.status === "active" &&
      r.progressPercent >= NEAR_COMPLETION_THRESHOLD &&
      r.remainingHours > 0
  ).length;
  const overdueClasses = rows.filter((r) => r.health === "overdue").length;
  const averageProgress =
    totalClasses > 0
      ? roundTo(rows.reduce((sum, r) => sum + r.progressPercent, 0) / totalClasses, 1)
      : 0;

  return {
    totalClasses,
    activeClasses,
    completedClasses,
    averageProgress,
    nearCompletionClasses,
    overdueClasses,
  };
}

export function calculateClassProgressReport(params: {
  filters: ClassProgressFilters;
  classrooms: Classroom[];
  studyPackages: StudyPackage[];
  users: User[];
  enrollments: Enrollment[];
  holidays: SchoolHoliday[];
  currentUserName?: string;
  now?: CambodiaNow;
}): ClassProgressReportData {
  const { filters, classrooms, studyPackages, users, enrollments, holidays, currentUserName } =
    params;
  const now = params.now ?? getCambodiaDateTime();

  const packageMap = new Map<string, StudyPackage>();
  studyPackages.forEach((p) => packageMap.set(p.id, p));

  const userMap = new Map<string, User>();
  users.forEach((u) => userMap.set(u.id, u));

  const enrolledCounts = countActiveEnrollmentsByClassroom(enrollments);

  const allRows: ClassProgressRow[] = classrooms.map((classroom) => {
    const studyPackage = packageMap.get(classroom.packageId) || null;
    const metrics = calculateClassProgressMetrics({ classroom, studyPackage, holidays, now });
    const capacityMetrics = calculateClassCapacityMetrics(
      classroom,
      enrolledCounts.get(classroom.id) || 0
    );

    return {
      classroom,
      studyPackage,
      teacher: userMap.get(classroom.assignedTeacherId) || null,
      scheduleType: getClassScheduleType(classroom),
      expectedEndDate: classroom.expectedEndDate,
      ...metrics,
      ...capacityMetrics,
    };
  });

  // Validate selected teacher: if inactive, deleted, or no longer teacher role, reset to "all"
  let effectiveFilters = filters;
  let selectedTeacher: User | null = null;
  if (filters.teacherId !== "all") {
    const teacher = userMap.get(filters.teacherId);
    if (teacher && teacher.role === "teacher" && teacher.status === "active") {
      selectedTeacher = teacher;
    } else {
      effectiveFilters = { ...filters, teacherId: "all" };
    }
  }

  const rows = sortClassProgressRows(filterClassProgressRows(allRows, effectiveFilters));
  const summary = calculateClassProgressSummary(rows);

  const generatedAt = new Date().toLocaleString("en-GB", {
    timeZone: "Asia/Phnom_Penh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return {
    filters: effectiveFilters,
    rows,
    summary,
    selectedPackage:
      effectiveFilters.packageId !== "all" ? packageMap.get(effectiveFilters.packageId) || null : null,
    selectedTeacher,
    generatedAt,
    generatedBy: currentUserName,
  };
}
