import { Classroom } from "@/models/classroom.model";
import { SchoolHoliday } from "@/models/school-holiday.model";
import { isHoliday, getHolidayForDate } from "./holiday-calendar";

export type AttendanceAccessState =
  | "upcoming"
  | "open"
  | "finished"
  | "not_scheduled"
  | "not_today"
  | "holiday";

/**
 * Get current date and time components in Cambodia timezone (Asia/Phnom_Penh)
 */
export function getCambodiaDateTime(date: Date = new Date()): {
  dateStr: string;
  timeStr: string;
  dayOfWeek: number;
  hours: number;
  minutes: number;
} {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Phnom_Penh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const getPart = (type: string) =>
      parts.find((p) => p.type === type)?.value || "";

    const year = getPart("year");
    const month = getPart("month");
    const day = getPart("day");
    let hourStr = getPart("hour");
    if (hourStr === "24") hourStr = "00";
    const minuteStr = getPart("minute");

    const dateStr = `${year}-${month}-${day}`;
    const timeStr = `${hourStr.padStart(2, "0")}:${minuteStr.padStart(2, "0")}`;

    const [y, m, d] = [
      parseInt(year, 10),
      parseInt(month, 10),
      parseInt(day, 10),
    ];
    const jsDate = new Date(y, m - 1, d);
    const jsDay = jsDate.getDay();
    const dayOfWeek = jsDay === 0 ? 7 : jsDay; // 1=Monday ... 7=Sunday

    return {
      dateStr,
      timeStr,
      dayOfWeek,
      hours: parseInt(hourStr, 10),
      minutes: parseInt(minuteStr, 10),
    };
  } catch (e) {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;
    const jsDay = now.getDay();
    const dayOfWeek = jsDay === 0 ? 7 : jsDay;
    return {
      dateStr,
      timeStr,
      dayOfWeek,
      hours: now.getHours(),
      minutes: now.getMinutes(),
    };
  }
}

/**
 * Returns today's YYYY-MM-DD in Cambodia timezone
 */
export function getCambodiaToday(): string {
  return getCambodiaDateTime().dateStr;
}

/**
 * Returns current HH:mm in Cambodia timezone
 */
export function getCambodiaNowTime(): string {
  return getCambodiaDateTime().timeStr;
}

/**
 * Get Day of Week (1=Monday ... 7=Sunday) for any date string (YYYY-MM-DD)
 */
export function getDayOfWeekFromDateStr(dateStr: string): number {
  if (!dateStr) return 1;
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  const jsDay = d.getDay();
  return jsDay === 0 ? 7 : jsDay;
}

/**
 * Evaluate the attendance access state for a classroom on a specific date.
 * Holiday check has the HIGHEST priority!
 * - If date is an active school holiday -> "holiday"
 * - Admin/Super Admin bypass time-of-day restrictions, but see holiday status.
 * - For teachers:
 *   1. Holiday -> "holiday"
 *   2. Date must be today in Cambodia.
 *   3. Date must match classroom.scheduleDays.
 *   4. Current time < startTime -> "upcoming"
 *   5. Current time >= startTime && currentTime < endTime -> "open"
 *   6. Current time >= endTime -> "finished"
 */
export function getAttendanceAccessState(
  classroom: Classroom | null,
  selectedDate: string,
  userRole?: string,
  activeHolidays: SchoolHoliday[] = []
): AttendanceAccessState {
  if (!classroom) return "not_today";

  // 1. Highest Priority: School Holiday / Closure
  if (isHoliday(selectedDate, activeHolidays)) {
    return "holiday";
  }

  const { dateStr: cambodiaToday, timeStr: cambodiaNow } = getCambodiaDateTime();

  const dayOfWeek = getDayOfWeekFromDateStr(selectedDate);
  const isScheduled = classroom.scheduleDays?.includes(dayOfWeek);

  if (!isScheduled) {
    return "not_scheduled";
  }

  // Admins and Super Admins bypass time restrictions (unless closed holiday)
  if (userRole === "admin" || userRole === "super_admin") {
    return "open";
  }

  // Teacher role strict evaluation:
  if (selectedDate !== cambodiaToday) {
    return "not_today";
  }

  const startTime = classroom.startTime || "00:00";
  const endTime = classroom.endTime || "23:59";

  if (cambodiaNow < startTime) {
    return "upcoming";
  }

  if (cambodiaNow >= startTime && cambodiaNow < endTime) {
    return "open";
  }

  return "finished";
}

/**
 * Check if teacher is allowed to record or edit attendance right now
 */
export function canTeacherRecordAttendance(params: {
  classroom: Classroom | null;
  selectedDate: string;
  userRole?: string;
  userId?: string;
  activeHolidays?: SchoolHoliday[];
}): { allowed: boolean; state: AttendanceAccessState; reason?: string; holiday?: SchoolHoliday | null } {
  const { classroom, selectedDate, userRole, userId, activeHolidays = [] } = params;

  if (!classroom) {
    return { allowed: false, state: "not_today", reason: "CLASSROOM_REQUIRED" };
  }

  // Check Holiday
  if (isHoliday(selectedDate, activeHolidays)) {
    const holiday = getHolidayForDate(selectedDate, activeHolidays);
    return {
      allowed: false,
      state: "holiday",
      reason: "SCHOOL_CLOSED_HOLIDAY",
      holiday,
    };
  }

  // Admin bypass
  if (userRole === "admin" || userRole === "super_admin") {
    const dayOfWeek = getDayOfWeekFromDateStr(selectedDate);
    const isScheduled = classroom.scheduleDays?.includes(dayOfWeek);
    if (!isScheduled) {
      return { allowed: false, state: "not_scheduled", reason: "NOT_SCHEDULED_DAY" };
    }
    return { allowed: true, state: "open" };
  }

  // Teacher verification:
  if (userRole === "teacher") {
    if (userId && classroom.assignedTeacherId !== userId) {
      return { allowed: false, state: "not_today", reason: "TEACHER_NOT_ASSIGNED" };
    }
  }

  const state = getAttendanceAccessState(classroom, selectedDate, userRole, activeHolidays);

  if (state === "open") {
    return { allowed: true, state: "open" };
  }

  return { allowed: false, state, reason: state.toUpperCase() };
}
