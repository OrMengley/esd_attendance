import { SchoolHoliday } from "@/models/school-holiday.model";

/**
 * Checks if a specific date (YYYY-MM-DD) falls within an active school holiday
 */
export function isHoliday(
  dateStr: string,
  activeHolidays: SchoolHoliday[] = []
): boolean {
  if (!dateStr || !activeHolidays || activeHolidays.length === 0) return false;
  return activeHolidays.some(
    (h) =>
      h.status === "active" &&
      dateStr >= h.startDate &&
      dateStr <= h.endDate
  );
}

/**
 * Returns the active holiday object covering a specific date (YYYY-MM-DD), or null if none
 */
export function getHolidayForDate(
  dateStr: string,
  activeHolidays: SchoolHoliday[] = []
): SchoolHoliday | null {
  if (!dateStr || !activeHolidays || activeHolidays.length === 0) return null;
  const match = activeHolidays.find(
    (h) =>
      h.status === "active" &&
      dateStr >= h.startDate &&
      dateStr <= h.endDate
  );
  return match || null;
}

/**
 * Alias for isHoliday - checks if school is closed on a given date due to holiday
 */
export function isSchoolClosed(
  dateStr: string,
  activeHolidays: SchoolHoliday[] = []
): boolean {
  return isHoliday(dateStr, activeHolidays);
}

/**
 * Finds all active holidays overlapping or situated between a start date and end date
 */
export function getSchoolClosuresBetweenDates(
  startDate: string,
  endDate: string,
  activeHolidays: SchoolHoliday[] = []
): SchoolHoliday[] {
  if (!startDate || !endDate || !activeHolidays) return [];
  return activeHolidays.filter(
    (h) =>
      h.status === "active" &&
      h.startDate <= endDate &&
      h.endDate >= startDate
  );
}

/**
 * Calculates inclusive calendar days between two dates (YYYY-MM-DD)
 * @example calculateHolidayDays("2026-04-14", "2026-04-16") => 3
 */
export function calculateHolidayDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  if (endDate < startDate) return 0;

  const [y1, m1, d1] = startDate.split("-").map(Number);
  const [y2, m2, d2] = endDate.split("-").map(Number);

  const start = Date.UTC(y1, m1 - 1, d1);
  const end = Date.UTC(y2, m2 - 1, d2);

  const diffTime = end - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 0;
}

/**
 * Validates if a proposed holiday range overlaps with another active holiday
 */
export function hasOverlappingHoliday(
  target: { startDate: string; endDate: string; id?: string },
  holidays: SchoolHoliday[]
): { overlaps: boolean; conflictingHoliday?: SchoolHoliday } {
  if (!target.startDate || !target.endDate) {
    return { overlaps: false };
  }

  const conflicting = holidays.find(
    (h) =>
      h.id !== target.id &&
      h.status === "active" &&
      target.startDate <= h.endDate &&
      target.endDate >= h.startDate
  );

  if (conflicting) {
    return { overlaps: true, conflictingHoliday: conflicting };
  }

  return { overlaps: false };
}

/**
 * Calculates classroom expected end date skipping both non-learning days and active school holidays.
 * Continues session accumulation until totalPlannedHours is satisfied.
 */
export function calculateClassroomExpectedEndDate(params: {
  startDate: string;
  totalPlannedHours: number;
  scheduleDays: number[];
  sessionMinutes: number;
  activeHolidays?: SchoolHoliday[];
}): string {
  const {
    startDate,
    totalPlannedHours,
    scheduleDays,
    sessionMinutes,
    activeHolidays = [],
  } = params;

  if (
    !startDate ||
    totalPlannedHours <= 0 ||
    !scheduleDays ||
    scheduleDays.length === 0 ||
    sessionMinutes <= 0
  ) {
    return startDate || "";
  }

  const [yearStr, monthStr, dayStr] = startDate.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return startDate;
  }

  const currentDate = new Date(year, month, day);
  const totalMinutesNeeded = totalPlannedHours * 60;
  const totalSessionsNeeded = Math.ceil(totalMinutesNeeded / sessionMinutes);

  let sessionsCount = 0;
  const MAX_DAYS = 1500; // safety guard (~4 years)
  let iterations = 0;

  while (sessionsCount < totalSessionsNeeded && iterations < MAX_DAYS) {
    // Current date string YYYY-MM-DD
    const yStr = currentDate.getFullYear();
    const mStr = String(currentDate.getMonth() + 1).padStart(2, "0");
    const dStr = String(currentDate.getDate()).padStart(2, "0");
    const dateKey = `${yStr}-${mStr}-${dStr}`;

    const jsDay = currentDate.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
    const customDay = jsDay === 0 ? 7 : jsDay;

    // 1. Must be a scheduled learning day
    const isScheduledDay = scheduleDays.includes(customDay);

    // 2. Must NOT be an active school holiday
    const isHolidayDate = isHoliday(dateKey, activeHolidays);

    if (isScheduledDay && !isHolidayDate) {
      sessionsCount++;
      if (sessionsCount >= totalSessionsNeeded) {
        break;
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
    iterations++;
  }

  const resYear = currentDate.getFullYear();
  const resMonth = String(currentDate.getMonth() + 1).padStart(2, "0");
  const resDay = String(currentDate.getDate()).padStart(2, "0");

  return `${resYear}-${resMonth}-${resDay}`;
}
