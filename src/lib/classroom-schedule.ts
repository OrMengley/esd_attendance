/**
 * Schedule and End-Date Calculation Utilities for ESD Classrooms
 * Weekday standard: 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday, 7 = Sunday
 */

import { SchoolHoliday } from "@/models/school-holiday.model";
import { calculateClassroomExpectedEndDate } from "./holiday-calendar";

export const WEEKDAY_DAYS = [1, 2, 3, 4, 5];
export const WEEKEND_DAYS = [6, 7];

/**
 * Calculates session minutes from start time to end time ("HH:mm" format)
 * @example calculateSessionMinutes("07:00", "08:00") => 60
 * @example calculateSessionMinutes("07:00", "09:00") => 120
 */
export function calculateSessionMinutes(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;

  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return 0;

  const startTotalMinutes = startH * 60 + startM;
  const endTotalMinutes = endH * 60 + endM;

  const diff = endTotalMinutes - startTotalMinutes;
  return diff > 0 ? diff : 0;
}

/**
 * Calculates learning hours per week based on selected days and session minutes
 * @example calculateHoursPerWeek([1,2,3,4,5], 60) => 5 (5 hours/week)
 * @example calculateHoursPerWeek([6,7], 120) => 4 (4 hours/week)
 */
export function calculateHoursPerWeek(
  scheduleDays: number[],
  sessionMinutes: number
): number {
  if (!scheduleDays || scheduleDays.length === 0 || sessionMinutes <= 0) {
    return 0;
  }
  const weeklyMinutes = scheduleDays.length * sessionMinutes;
  const hours = weeklyMinutes / 60;
  return Math.round(hours * 10) / 10;
}

/**
 * Calculates the expected end date by iterating through schedule days from the start date
 * until the total planned hours are met, skipping non-learning days and active school holidays.
 *
 * @param startDate - Starting date formatted as "YYYY-MM-DD"
 * @param totalPlannedHours - Total hours planned in the study package (e.g. 40)
 * @param scheduleDays - Array of day numbers [1..7] (1=Mon, 7=Sun)
 * @param sessionMinutes - Duration of each daily session in minutes (e.g. 60 or 120)
 * @param activeHolidays - Optional array of active school holidays to skip
 * @returns Expected end date formatted as "YYYY-MM-DD"
 */
export function calculateExpectedEndDate(
  startDate: string,
  totalPlannedHours: number,
  scheduleDays: number[],
  sessionMinutes: number,
  activeHolidays?: SchoolHoliday[]
): string {
  return calculateClassroomExpectedEndDate({
    startDate,
    totalPlannedHours,
    scheduleDays,
    sessionMinutes,
    activeHolidays,
  });
}

/**
 * Identify schedule type from schedule days
 */
export function getScheduleType(scheduleDays: number[]): "weekday" | "weekend" | "custom" {
  if (!scheduleDays || scheduleDays.length === 0) return "weekday";
  const sorted = [...scheduleDays].sort().join(",");
  if (sorted === "1,2,3,4,5") return "weekday";
  if (sorted === "6,7") return "weekend";
  return "custom";
}
