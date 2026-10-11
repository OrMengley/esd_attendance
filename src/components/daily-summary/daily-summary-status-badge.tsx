import React from "react";
import { useTranslation } from "react-i18next";
import { DailyClassAttendanceStatus } from "@/lib/daily-attendance-summary";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  Clock3,
  AlertTriangle,
  CalendarClock,
  Palmtree,
} from "lucide-react";

interface DailySummaryStatusBadgeProps {
  status: DailyClassAttendanceStatus;
  className?: string;
  showIcon?: boolean;
}

export const DailySummaryStatusBadge: React.FC<DailySummaryStatusBadgeProps> = ({
  status,
  className,
  showIcon = true,
}) => {
  const { t } = useTranslation();

  const getStatusConfig = () => {
    switch (status) {
      case "completed":
        return {
          label: t("dailySummary.completed", { defaultValue: "បានកត់ត្រារួចរាល់" }),
          icon: CheckCircle2,
          classes:
            "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
        };
      case "partial":
        return {
          label: t("dailySummary.partial", { defaultValue: "បានកត់មួយផ្នែក" }),
          icon: Clock3,
          classes:
            "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
        };
      case "not_recorded":
        return {
          label: t("dailySummary.notRecorded", { defaultValue: "មិនទាន់កត់ត្រា" }),
          icon: Clock,
          classes:
            "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
        };
      case "missing":
        return {
          label: t("dailySummary.missing", { defaultValue: "ខកខានកត់ត្រា" }),
          icon: AlertTriangle,
          classes:
            "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 font-semibold",
        };
      case "upcoming":
        return {
          label: t("dailySummary.upcoming", { defaultValue: "មិនទាន់ដល់ម៉ោង" }),
          icon: CalendarClock,
          classes:
            "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
        };
      case "school_closed":
        return {
          label: t("dailySummary.schoolClosed", { defaultValue: "សាលាឈប់សម្រាក" }),
          icon: Palmtree,
          classes:
            "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
        };
      default:
        return {
          label: status,
          icon: Clock,
          classes: "bg-slate-50 text-slate-700 border-slate-200",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border font-khmer shadow-sm whitespace-nowrap transition-colors",
        config.classes,
        className
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
};
