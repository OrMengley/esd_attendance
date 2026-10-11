import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TeacherScheduleItem } from "@/models/dashboard.model";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  ClipboardCheck,
  Eye,
  School,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TeacherScheduleCardProps {
  item: TeacherScheduleItem;
}

export const TeacherScheduleCard: React.FC<TeacherScheduleCardProps> = ({ item }) => {
  const { t, i18n } = useTranslation();
  const isKm = i18n.language === "km";

  const khmerDigits = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];
  const toKhmerNum = (n: number | string) =>
    String(n).replace(/[0-9]/g, (w) => khmerDigits[parseInt(w, 10)]);

  const {
    classroom,
    studyPackage,
    scheduleTime,
    enrolledCount,
    recordedCount,
    sessionState,
    actionType,
    actionText,
    actionLink,
  } = item;

  const packageName =
    (isKm ? studyPackage?.nameKh : studyPackage?.nameEn) ||
    studyPackage?.nameKh ||
    studyPackage?.code ||
    classroom.packageId ||
    "—";

  // Session state badge
  const renderStateBadge = () => {
    switch (sessionState) {
      case "upcoming":
        return (
          <Badge
            variant="secondary"
            className="text-[11px] font-medium font-khmer gap-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <Clock className="h-3 w-3" />
            {t("dashboard.statusUpcoming", { defaultValue: "Upcoming" })}
          </Badge>
        );

      case "in_progress":
        return (
          <Badge
            className="text-[11px] font-medium font-khmer gap-1 bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            {t("dashboard.statusInProgress", { defaultValue: "In Progress" })}
          </Badge>
        );

      case "completed":
        return (
          <Badge
            className="text-[11px] font-medium font-khmer gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
          >
            <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            {t("dashboard.statusAttendanceCompleted", { defaultValue: "Completed" })}
          </Badge>
        );

      case "requires_attendance":
        return (
          <Badge
            variant="destructive"
            className="text-[11px] font-medium font-khmer gap-1 bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
          >
            <AlertTriangle className="h-3 w-3 text-rose-600 dark:text-rose-400" />
            {t("dashboard.statusRequiresAttendance", { defaultValue: "Requires Attendance" })}
          </Badge>
        );

      case "locked":
        return (
          <Badge
            variant="secondary"
            className="text-[11px] font-medium font-khmer gap-1 bg-muted text-muted-foreground"
          >
            <Lock className="h-3 w-3" />
            {t("dashboard.statusLocked", { defaultValue: "Locked" })}
          </Badge>
        );
    }
  };

  // Action Button
  const renderActionButton = () => {
    if (actionType === "disabled_upcoming") {
      return (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          className="h-8.5 rounded-xl text-xs gap-1.5 font-khmer cursor-not-allowed opacity-60"
        >
          <Clock className="h-3.5 w-3.5" />
          <span>{actionText}</span>
        </Button>
      );
    }

    if (actionType === "mark" || actionType === "continue") {
      return (
        <Button
          asChild
          size="sm"
          className="h-8.5 rounded-xl text-xs gap-1.5 font-khmer bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
        >
          <Link to={actionLink}>
            <ClipboardCheck className="h-3.5 w-3.5" />
            <span>{actionText}</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      );
    }

    if (actionType === "required") {
      return (
        <Button
          asChild
          variant="destructive"
          size="sm"
          className="h-8.5 rounded-xl text-xs gap-1.5 font-khmer bg-rose-600 text-white hover:bg-rose-700 shadow-xs"
        >
          <Link to={actionLink}>
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{actionText}</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      );
    }

    // Default "view"
    return (
      <Button
        asChild
        variant="outline"
        size="sm"
        className="h-8.5 rounded-xl text-xs gap-1.5 font-khmer border-border/80 hover:bg-muted/50"
      >
        <Link to={actionLink}>
          <Eye className="h-3.5 w-3.5" />
          <span>{actionText}</span>
        </Link>
      </Button>
    );
  };

  const isFull = enrolledCount > 0 && recordedCount >= enrolledCount;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border bg-card/90 shadow-2xs hover:border-primary/30 transition-all">
      <div className="flex items-start gap-3.5 min-w-0">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <School className="h-5 w-5" />
        </div>

        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-bold text-foreground font-khmer truncate max-w-[240px]">
              {classroom.name}
            </h4>
            <span className="font-mono text-xs text-muted-foreground">
              ({classroom.code})
            </span>
            {renderStateBadge()}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-khmer">
            {/* Package */}
            <span className="inline-flex items-center gap-1 truncate max-w-[180px]">
              <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
              {packageName}
            </span>

            {/* Schedule Time */}
            <span className="inline-flex items-center gap-1 font-mono">
              <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              {scheduleTime}
            </span>

            {/* Enrolled & Progress */}
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>{t("classes.enrolledCount", { defaultValue: "Enrolled" })}:</span>
              <strong className="font-mono text-foreground">
                {isKm ? toKhmerNum(enrolledCount) : enrolledCount}
              </strong>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
        {/* Progress pill */}
        <div className="text-right">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/40 text-xs font-mono">
            <span className="text-muted-foreground">Recorded:</span>
            <span
              className={cn(
                "font-bold",
                isFull ? "text-emerald-600" : recordedCount > 0 ? "text-amber-600" : "text-rose-600"
              )}
            >
              {isKm ? toKhmerNum(recordedCount) : recordedCount} / {isKm ? toKhmerNum(enrolledCount) : enrolledCount}
            </span>
          </div>
        </div>

        {renderActionButton()}
      </div>
    </div>
  );
};
