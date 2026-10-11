import type { TFunction } from "i18next";
import { Classroom, ClassroomStatus } from "@/models/classroom.model";
import { StudyPackage } from "@/models/study-package.model";
import {
  ClassProgressHealth,
  ClassProgressReportData,
} from "@/models/class-progress-report.model";
import { getScheduleType } from "@/lib/classroom-schedule";

/**
 * Label helpers shared by the on-screen UI, print view, and Excel export.
 * They accept any bound `t` so they can render in the global language
 * (useTranslation) or in a fixed language (i18n.getFixedT) without duplicating strings.
 */

export function getHealthLabel(t: TFunction, health: ClassProgressHealth): string {
  switch (health) {
    case "not_started":
      return t("classProgressReport.health.notStarted");
    case "on_track":
      return t("classProgressReport.health.onTrack");
    case "near_completion":
      return t("classProgressReport.health.nearCompletion");
    case "overdue":
      return t("classProgressReport.health.overdue");
    case "completed":
      return t("classProgressReport.health.completed");
  }
}

export function getClassStatusLabel(t: TFunction, status: ClassroomStatus): string {
  switch (status) {
    case "active":
      return t("classProgressReport.filters.statusActive");
    case "completed":
      return t("classProgressReport.filters.statusCompleted");
    default:
      return t("classProgressReport.filters.statusInactive");
  }
}

export function getScheduleTypeLabel(t: TFunction, scheduleType: "weekday" | "weekend"): string {
  return scheduleType === "weekday"
    ? t("classProgressReport.schedule.weekday")
    : t("classProgressReport.schedule.weekend");
}

/** "Mon – Fri", "Sat – Sun", or a joined list of day names for custom schedules. */
export function formatLearningDays(t: TFunction, classroom: Classroom): string {
  const type = getScheduleType(classroom.scheduleDays);
  if (type === "weekday") return t("classProgressReport.schedule.monFri");
  if (type === "weekend") return t("classProgressReport.schedule.satSun");

  return [...(classroom.scheduleDays || [])]
    .sort((a, b) => a - b)
    .map((day) => t(`classProgressReport.days.${day}`))
    .join(", ");
}

/** Study package display name in the requested language (stored Khmer name as fallback). */
export function getPackageDisplayName(
  pkg: StudyPackage | null,
  language: "km" | "en"
): string {
  if (!pkg) return "";
  return language === "en" && pkg.nameEn ? pkg.nameEn : pkg.nameKh;
}

const PROGRESS_RANGE_KEYS = {
  all: "allProgress",
  not_started: "progressNotStarted",
  in_progress: "progressInProgress",
  near_completion: "progressNearCompletion",
  completed: "progressCompleted",
} as const;

/**
 * Human-readable list of applied filters, used by both the print header
 * and the Excel export so they always describe the same filtered data.
 */
export function getAppliedFilterEntries(
  t: TFunction,
  data: ClassProgressReportData,
  language: "km" | "en"
): { label: string; value: string }[] {
  const { filters, selectedPackage, selectedTeacher } = data;

  const statusValue =
    filters.status === "all"
      ? t("classProgressReport.filters.allStatuses")
      : getClassStatusLabel(t, filters.status);

  const packageValue =
    filters.packageId === "all"
      ? t("classProgressReport.filters.allPackages")
      : getPackageDisplayName(selectedPackage, language) || filters.packageId;

  const teacherValue =
    filters.teacherId === "all"
      ? t("classProgressReport.filters.allTeachers")
      : selectedTeacher
      ? `${selectedTeacher.name} (@${selectedTeacher.username})`
      : filters.teacherId;

  const scheduleValue =
    filters.schedule === "weekday"
      ? t("classProgressReport.filters.weekdaySchedule")
      : filters.schedule === "weekend"
      ? t("classProgressReport.filters.weekendSchedule")
      : t("classProgressReport.filters.allSchedules");

  const healthValue =
    filters.health === "on_track"
      ? t("classProgressReport.health.onTrack")
      : filters.health === "overdue"
      ? t("classProgressReport.health.overdue")
      : t("classProgressReport.filters.allHealth");

  const entries = [
    { label: t("classProgressReport.filters.statusLabel"), value: statusValue },
    { label: t("classProgressReport.filters.packageLabel"), value: packageValue },
    { label: t("classProgressReport.filters.teacherLabel"), value: teacherValue },
    { label: t("classProgressReport.filters.scheduleLabel"), value: scheduleValue },
    {
      label: t("classProgressReport.filters.progressLabel"),
      value: t(`classProgressReport.filters.${PROGRESS_RANGE_KEYS[filters.progressRange]}`),
    },
    { label: t("classProgressReport.filters.healthLabel"), value: healthValue },
  ];

  if (filters.searchQuery.trim()) {
    entries.push({
      label: t("classProgressReport.filters.searchLabel"),
      value: filters.searchQuery.trim(),
    });
  }

  return entries;
}
