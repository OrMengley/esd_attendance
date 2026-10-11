import { getCambodiaToday } from "./attendance-time-lock";

export type HolidayPeriod = "upcoming" | "today" | "past";

/**
 * Determines whether a holiday is upcoming, today (happening right now), or past
 * based on Cambodia timezone (Asia/Phnom_Penh).
 * Uses date-only YYYY-MM-DD string comparisons to avoid timezone-shift bugs.
 *
 * @param startDate - Starting date formatted as "YYYY-MM-DD"
 * @param endDate - Ending date formatted as "YYYY-MM-DD"
 * @param customTodayStr - Optional override for testing (YYYY-MM-DD)
 * @returns "upcoming" | "today" | "past"
 */
export function getHolidayPeriod(
  startDate: string,
  endDate: string,
  customTodayStr?: string
): HolidayPeriod {
  if (!startDate || !endDate) return "upcoming";

  const today = customTodayStr || getCambodiaToday();

  if (today < startDate) {
    return "upcoming";
  }

  if (today > endDate) {
    return "past";
  }

  return "today";
}
