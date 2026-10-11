import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AdminClassAttendanceItem,
  DashboardClassAttendanceStatus,
} from "@/models/dashboard.model";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  User,
  Users,
  Eye,
  ArrowUpRight,
  School,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminClassAttendanceListProps {
  classes: AdminClassAttendanceItem[];
  selectedDate: string;
}

export const AdminClassAttendanceList: React.FC<AdminClassAttendanceListProps> = ({
  classes,
  selectedDate,
}) => {
  const { t, i18n } = useTranslation();
  const isKm = i18n.language === "km";

  const khmerDigits = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];
  const toKhmerNum = (n: number | string) =>
    String(n).replace(/[0-9]/g, (w) => khmerDigits[parseInt(w, 10)]);

  const renderStatusBadge = (status: DashboardClassAttendanceStatus) => {
    switch (status) {
      case "upcoming":
        return (
          <Badge
            variant="secondary"
            className="text-[11px] font-medium font-khmer gap-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300/50"
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
            {t("dashboard.statusCompleted", { defaultValue: "Completed" })}
          </Badge>
        );

      case "partial":
        return (
          <Badge
            className="text-[11px] font-medium font-khmer gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
          >
            <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            {t("dashboard.statusPartial", { defaultValue: "Partial" })}
          </Badge>
        );

      case "missing":
        return (
          <Badge
            variant="destructive"
            className="text-[11px] font-medium font-khmer gap-1 bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
          >
            <XCircle className="h-3 w-3 text-rose-600 dark:text-rose-400" />
            {t("dashboard.statusMissing", { defaultValue: "Missing" })}
          </Badge>
        );

      case "holiday":
        return (
          <Badge
            className="text-[11px] font-medium font-khmer gap-1 bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40"
          >
            {t("dashboard.statusHoliday", { defaultValue: "Holiday / No Class" })}
          </Badge>
        );
    }
  };

  if (classes.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center text-xs text-muted-foreground font-khmer">
        {t("dashboard.noClassesToday", {
          defaultValue: "No classes scheduled for today.",
        })}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card shadow-2xs overflow-hidden">
      <div className="p-4 border-b border-border/70 flex items-center justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-foreground font-khmer">
            {t("dashboard.classAttendanceStatus", {
              defaultValue: "Attendance Status by Class",
            })}
          </h3>
          <p className="text-xs text-muted-foreground font-khmer">
            {t("dashboard.classAttendanceStatusSubtitle", {
              defaultValue: "Today's scheduled learning sessions and current recording progress",
            })}
          </p>
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-8 text-xs gap-1 text-primary hover:text-primary font-khmer"
        >
          <Link to={`/daily-attendance-summary?date=${selectedDate}`}>
            <span>{t("common.viewAll", { defaultValue: "View All" })}</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-xs font-semibold font-khmer">
                {t("classes.className", { defaultValue: "Class" })}
              </TableHead>
              <TableHead className="text-xs font-semibold font-khmer">
                {t("classes.teacher", { defaultValue: "Teacher" })}
              </TableHead>
              <TableHead className="text-xs font-semibold font-khmer text-center">
                {t("dashboard.scheduleTime", { defaultValue: "Time" })}
              </TableHead>
              <TableHead className="text-xs font-semibold font-khmer text-center">
                {t("dashboard.progress", { defaultValue: "Progress" })}
              </TableHead>
              <TableHead className="text-xs font-semibold font-khmer text-center">
                {t("common.status", { defaultValue: "Status" })}
              </TableHead>
              <TableHead className="text-xs font-semibold font-khmer text-right">
                {t("common.actions", { defaultValue: "Actions" })}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.map((item) => {
              const teacherName =
                (item.teacher as any)?.fullName ||
                item.teacher?.name ||
                item.teacher?.username ||
                "—";

              return (
                <TableRow key={item.classroom.id} className="hover:bg-muted/20">
                  {/* Class Info */}
                  <TableCell className="py-3">
                    <div className="flex flex-col">
                      <Link
                        to={`/classes/${item.classroom.id}`}
                        className="font-bold text-xs text-foreground hover:text-primary font-khmer truncate max-w-[200px]"
                      >
                        {item.classroom.name}
                      </Link>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {item.classroom.code}
                      </span>
                    </div>
                  </TableCell>

                  {/* Teacher */}
                  <TableCell className="py-3">
                    <span className="text-xs text-foreground font-khmer truncate max-w-[140px] block">
                      {teacherName}
                    </span>
                  </TableCell>

                  {/* Schedule Time */}
                  <TableCell className="text-center py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {item.scheduleTime}
                  </TableCell>

                  {/* Progress (Recorded / Total) */}
                  <TableCell className="text-center py-3">
                    <div className="inline-flex flex-col items-center">
                      <span className="font-mono text-xs font-bold text-foreground">
                        {isKm ? toKhmerNum(item.recordedCount) : item.recordedCount} /{" "}
                        {isKm ? toKhmerNum(item.enrolledCount) : item.enrolledCount}
                      </span>
                      {item.recordedCount > 0 && (
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                          <span className="text-emerald-600 font-semibold">
                            P:{isKm ? toKhmerNum(item.presentCount) : item.presentCount}
                          </span>
                          <span className="text-rose-600 font-semibold">
                            A:{isKm ? toKhmerNum(item.absentCount) : item.absentCount}
                          </span>
                          <span className="text-amber-600 font-semibold">
                            L:{isKm ? toKhmerNum(item.lateCount) : item.lateCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="text-center py-3 whitespace-nowrap">
                    {renderStatusBadge(item.status)}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right py-3 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] px-2 font-khmer rounded-lg"
                      >
                        <Link to={`/attendance?classroomId=${item.classroom.id}&date=${selectedDate}`}>
                          <Eye className="h-3 w-3 mr-1" />
                          <span>{t("dashboard.viewAttendance", { defaultValue: "Attendance" })}</span>
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                        title={t("classes.viewDetails", { defaultValue: "Class Details" })}
                      >
                        <Link to={`/classes/${item.classroom.id}`}>
                          <School className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
