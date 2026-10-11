import React from "react";
import { useTranslation } from "react-i18next";
import { DailyAttendanceOverallSummary } from "@/lib/daily-attendance-summary";
import {
  School,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  UserCheck,
  UserX,
  UserMinus,
  FileCheck2,
  Percent,
  CalendarClock,
} from "lucide-react";

interface DailySummaryCardsProps {
  summary: DailyAttendanceOverallSummary;
  isSchoolClosed: boolean;
}

export const DailySummaryCards: React.FC<DailySummaryCardsProps> = ({
  summary,
  isSchoolClosed,
}) => {
  const { t } = useTranslation();

  const rateDisplay =
    isSchoolClosed || summary.overallAttendanceRate === null
      ? "—"
      : `${summary.overallAttendanceRate}%`;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {/* 1. Scheduled Classes */}
      <div className="bg-card p-4 rounded-2xl border border-border/70 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-muted-foreground font-khmer line-clamp-1">
            {t("dailySummary.scheduledClasses", { defaultValue: "ថ្នាក់មានកាលវិភាគ" })}
          </span>
          <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <School className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-sans text-foreground">
            {isSchoolClosed ? 0 : summary.scheduledClassesCount}
          </span>
          <span className="text-[11px] text-muted-foreground font-khmer">
            {t("classes.title", { defaultValue: "ថ្នាក់" })}
          </span>
        </div>
      </div>

      {/* 2. Completed Classes */}
      <div className="bg-card p-4 rounded-2xl border border-border/70 shadow-xs flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-muted-foreground font-khmer line-clamp-1">
            {t("dailySummary.completedClasses", { defaultValue: "ថ្នាក់កត់ត្រារួចរាល់" })}
          </span>
          <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-sans text-emerald-600 dark:text-emerald-400">
            {isSchoolClosed ? 0 : summary.completedClassesCount}
          </span>
          <span className="text-[11px] text-muted-foreground font-khmer">
            {t("classes.title", { defaultValue: "ថ្នាក់" })}
          </span>
        </div>
      </div>

      {/* 3. Pending / Partial Classes */}
      <div className="bg-card p-4 rounded-2xl border border-border/70 shadow-xs flex flex-col justify-between hover:border-amber-500/40 transition-colors">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-muted-foreground font-khmer line-clamp-1">
            {t("dailySummary.pendingClasses", { defaultValue: "កំពុងរង់ចាំ / មួយផ្នែក" })}
          </span>
          <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock3 className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-sans text-amber-600 dark:text-amber-400">
            {isSchoolClosed ? 0 : summary.pendingClassesCount}
          </span>
          <span className="text-[11px] text-muted-foreground font-khmer">
            {t("classes.title", { defaultValue: "ថ្នាក់" })}
          </span>
        </div>
      </div>

      {/* 4. Missing Attendance Classes */}
      <div className="bg-card p-4 rounded-2xl border border-border/70 shadow-xs flex flex-col justify-between hover:border-rose-500/40 transition-colors">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-muted-foreground font-khmer line-clamp-1">
            {t("dailySummary.missingClasses", { defaultValue: "ថ្នាក់ខកខានកត់ត្រា" })}
          </span>
          <div className="h-8 w-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span
            className={`text-2xl font-bold font-sans ${
              !isSchoolClosed && summary.missingClassesCount > 0
                ? "text-rose-600 dark:text-rose-400"
                : "text-foreground"
            }`}
          >
            {isSchoolClosed ? 0 : summary.missingClassesCount}
          </span>
          <span className="text-[11px] text-muted-foreground font-khmer">
            {t("classes.title", { defaultValue: "ថ្នាក់" })}
          </span>
        </div>
      </div>

      {/* 5. Overall Attendance Rate */}
      <div className="bg-card p-4 rounded-2xl border border-border/70 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-muted-foreground font-khmer line-clamp-1">
            {t("dailySummary.overallAttendanceRate", { defaultValue: "អត្រាវត្តមានសរុប" })}
          </span>
          <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Percent className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-sans text-primary">
            {rateDisplay}
          </span>
        </div>
      </div>

      {/* Student Breakdown Cards (Bottom row) */}
      {/* 6. Present Students */}
      <div className="bg-emerald-500/5 p-3.5 rounded-2xl border border-emerald-500/20 shadow-xs flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <UserCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 font-khmer truncate">
            {t("dailySummary.presentStudents", { defaultValue: "សិស្សមានវត្តមាន" })}
          </p>
          <p className="text-xl font-bold font-sans text-emerald-700 dark:text-emerald-400 leading-tight">
            {isSchoolClosed ? 0 : summary.totalPresent}
          </p>
        </div>
      </div>

      {/* 7. Absent Students */}
      <div className="bg-rose-500/5 p-3.5 rounded-2xl border border-rose-500/20 shadow-xs flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-rose-500/15 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0">
          <UserX className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-rose-800 dark:text-rose-300 font-khmer truncate">
            {t("dailySummary.absentStudents", { defaultValue: "សិស្សអវត្តមាន" })}
          </p>
          <p className="text-xl font-bold font-sans text-rose-700 dark:text-rose-400 leading-tight">
            {isSchoolClosed ? 0 : summary.totalAbsent}
          </p>
        </div>
      </div>

      {/* 8. Late Students */}
      <div className="bg-amber-500/5 p-3.5 rounded-2xl border border-amber-500/20 shadow-xs flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
          <UserMinus className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-amber-800 dark:text-amber-300 font-khmer truncate">
            {t("dailySummary.lateStudents", { defaultValue: "សិស្សមកយឺត" })}
          </p>
          <p className="text-xl font-bold font-sans text-amber-700 dark:text-amber-400 leading-tight">
            {isSchoolClosed ? 0 : summary.totalLate}
          </p>
        </div>
      </div>

      {/* 9. Permission Students */}
      <div className="bg-blue-500/5 p-3.5 rounded-2xl border border-blue-500/20 shadow-xs flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-blue-500/15 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
          <FileCheck2 className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-blue-800 dark:text-blue-300 font-khmer truncate">
            {t("dailySummary.permissionStudents", { defaultValue: "សិស្សសុំច្បាប់" })}
          </p>
          <p className="text-xl font-bold font-sans text-blue-700 dark:text-blue-400 leading-tight">
            {isSchoolClosed ? 0 : summary.totalPermission}
          </p>
        </div>
      </div>

      {/* 10. Upcoming Classes (or Recorded Students count) */}
      <div className="bg-slate-500/5 p-3.5 rounded-2xl border border-slate-500/20 shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1">
        <div className="h-10 w-10 rounded-xl bg-slate-500/15 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
          <CalendarClock className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 font-khmer truncate">
            {summary.upcomingClassesCount > 0
              ? t("dailySummary.upcomingClasses", { defaultValue: "ថ្នាក់មិនទាន់ដល់ម៉ោង" })
              : t("dailySummary.recordedStudents", { defaultValue: "សិស្សបានកត់វត្តមាន" })}
          </p>
          <p className="text-xl font-bold font-sans text-slate-800 dark:text-slate-200 leading-tight">
            {isSchoolClosed
              ? 0
              : summary.upcomingClassesCount > 0
              ? summary.upcomingClassesCount
              : `${summary.totalRecordedStudents} / ${summary.totalEligibleStudents}`}
          </p>
        </div>
      </div>
    </div>
  );
};
