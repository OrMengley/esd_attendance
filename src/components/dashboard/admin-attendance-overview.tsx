import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AdminAttendanceOverview as AdminOverviewType } from "@/models/dashboard.model";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Percent,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminAttendanceOverviewProps {
  overview: AdminOverviewType;
  selectedDate: string;
}

export const AdminAttendanceOverview: React.FC<AdminAttendanceOverviewProps> = ({
  overview,
  selectedDate,
}) => {
  const { t, i18n } = useTranslation();
  const isKm = i18n.language === "km";

  const khmerDigits = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];
  const toKhmerNum = (n: number | string) =>
    String(n).replace(/[0-9]/g, (w) => khmerDigits[parseInt(w, 10)]);

  const {
    presentCount,
    absentCount,
    lateCount,
    permissionCount,
    totalRecorded,
    totalEligible,
    attendanceRate,
  } = overview;

  const rateDisplay =
    attendanceRate !== null
      ? isKm
        ? `${toKhmerNum(attendanceRate)}%`
        : `${attendanceRate}%`
      : "—";

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <TrendingUp className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-foreground font-khmer">
              {t("dashboard.todayAttendanceOverview", {
                defaultValue: "Today's Attendance Overview",
              })}
            </h2>
            <p className="text-xs text-muted-foreground font-khmer">
              {t("dashboard.recordedProgress", {
                recorded: isKm ? toKhmerNum(totalRecorded) : totalRecorded,
                total: isKm ? toKhmerNum(totalEligible) : totalEligible,
                defaultValue: `${totalRecorded} of ${totalEligible} enrolled students recorded today`,
              })}
            </p>
          </div>
        </div>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-8.5 rounded-xl text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5 self-start sm:self-auto"
        >
          <Link to={`/daily-attendance-summary?date=${selectedDate}`}>
            <span className="font-medium font-khmer">
              {t("dashboard.viewDailySummary", { defaultValue: "View Daily Summary" })}
            </span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Present */}
        <div className="p-3.5 rounded-xl border bg-emerald-500/5 border-emerald-500/20">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="text-xs font-semibold font-khmer">
              {t("attendanceStatus.present", { defaultValue: "Present" })}
            </span>
          </div>
          <p className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
            {isKm ? toKhmerNum(presentCount) : presentCount}
          </p>
        </div>

        {/* Absent */}
        <div className="p-3.5 rounded-xl border bg-rose-500/5 border-rose-500/20">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-1">
            <XCircle className="h-4 w-4 shrink-0" />
            <span className="text-xs font-semibold font-khmer">
              {t("attendanceStatus.absent", { defaultValue: "Absent" })}
            </span>
          </div>
          <p className="text-xl font-bold font-mono text-rose-700 dark:text-rose-300">
            {isKm ? toKhmerNum(absentCount) : absentCount}
          </p>
        </div>

        {/* Late */}
        <div className="p-3.5 rounded-xl border bg-amber-500/5 border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
            <Clock className="h-4 w-4 shrink-0" />
            <span className="text-xs font-semibold font-khmer">
              {t("attendanceStatus.late", { defaultValue: "Late" })}
            </span>
          </div>
          <p className="text-xl font-bold font-mono text-amber-700 dark:text-amber-300">
            {isKm ? toKhmerNum(lateCount) : lateCount}
          </p>
        </div>

        {/* Permission */}
        <div className="p-3.5 rounded-xl border bg-blue-500/5 border-blue-500/20">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="text-xs font-semibold font-khmer">
              {t("attendanceStatus.permission", { defaultValue: "Permission" })}
            </span>
          </div>
          <p className="text-xl font-bold font-mono text-blue-700 dark:text-blue-300">
            {isKm ? toKhmerNum(permissionCount) : permissionCount}
          </p>
        </div>

        {/* Attendance Rate */}
        <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl border bg-[#1E347B]/5 dark:bg-blue-500/10 border-[#1E347B]/20 dark:border-blue-500/30">
          <div className="flex items-center gap-2 text-[#1E347B] dark:text-blue-400 mb-1">
            <Percent className="h-4 w-4 shrink-0" />
            <span className="text-xs font-bold font-khmer">
              {t("dashboard.attendanceRate", { defaultValue: "Attendance Rate" })}
            </span>
          </div>
          <p className="text-xl font-bold font-mono text-[#1E347B] dark:text-blue-300">
            {rateDisplay}
          </p>
        </div>
      </div>
    </div>
  );
};
