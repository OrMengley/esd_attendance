import React from "react";
import { useTranslation } from "react-i18next";
import { ClassDailyAttendanceSummary } from "@/lib/daily-attendance-summary";
import { DailySummaryStatusBadge } from "./daily-summary-status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ExternalLink, Clock } from "lucide-react";

interface DailySummaryMobileCardsProps {
  items: ClassDailyAttendanceSummary[];
  onViewAttendance: (classroomId: string) => void;
}

export const DailySummaryMobileCards: React.FC<DailySummaryMobileCardsProps> = ({
  items,
  onViewAttendance,
}) => {
  const { t, i18n } = useTranslation();

  return (
    <div className="space-y-3">
      {items.map((row) => {
        const packageName =
          i18n.language === "en" && row.studyPackage?.nameEn
            ? row.studyPackage.nameEn
            : row.studyPackage?.nameKh || row.classroom.packageId;

        const rateDisplay =
          row.attendanceRate !== null ? `${row.attendanceRate}%` : "—";

        const scheduleDaysLabel =
          row.scheduleTypeText === "weekday"
            ? t("classes.mondayToFriday", { defaultValue: "ចន្ទ - សុក្រ" })
            : row.scheduleTypeText === "weekend"
            ? t("classes.saturdaySunday", { defaultValue: "សៅរ៍ - អាទិត្យ" })
            : row.classroom.scheduleDays?.join(", ") || "";

        return (
          <div
            key={row.classroom.id}
            className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs space-y-3 font-khmer hover:border-primary/40 transition-colors"
          >
            {/* Top Row: Class Info & Status Badge */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-foreground leading-snug truncate">
                  {row.classroom.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-mono font-medium text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                    {row.classroom.code}
                  </span>
                  <span className="text-[11px] text-muted-foreground truncate" title={packageName}>
                    {packageName}
                  </span>
                </div>
              </div>
              <DailySummaryStatusBadge status={row.status} />
            </div>

            {/* Middle Row: Teacher & Schedule */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
              {/* Teacher */}
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 ring-1 ring-border shrink-0">
                  <AvatarImage src={row.teacher?.avatarUrl} />
                  <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">
                    {row.teacher?.name ? row.teacher.name.charAt(0) : "T"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-xs truncate">
                    {row.teacher?.name || t("dashboard.unassigned", { defaultValue: "មិនទាន់ចាត់តាំង" })}
                  </p>
                </div>
              </div>

              {/* Schedule */}
              <div className="space-y-0.5 text-right">
                <div className="text-[11px] font-semibold text-foreground">
                  {scheduleDaysLabel}
                </div>
                <div className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-2.5 w-2.5 shrink-0" />
                  <span>
                    {row.classroom.startTime} - {row.classroom.endTime}
                  </span>
                </div>
              </div>
            </div>

            {/* Attendance Counts Grid */}
            <div className="grid grid-cols-5 gap-1.5 p-2 rounded-xl bg-muted/40 text-center text-xs">
              <div>
                <p className="text-[10px] text-muted-foreground font-medium">
                  {t("dailySummary.eligibleStudents", { defaultValue: "សិស្ស" })}
                </p>
                <p className="font-bold text-foreground mt-0.5">
                  {row.eligibleStudentCount}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-muted-foreground font-medium">
                  {t("dailySummary.recordedStudents", { defaultValue: "កត់ត្រា" })}
                </p>
                <p
                  className={`font-bold mt-0.5 ${
                    row.recordedStudentCount === row.eligibleStudentCount && row.eligibleStudentCount > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : row.recordedStudentCount > 0
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {row.recordedStudentCount}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {t("attendanceStatus.present", { defaultValue: "វត្តមាន" })}
                </p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {row.presentCount}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                  {t("attendanceStatus.absent", { defaultValue: "អវត្តមាន" })}
                </p>
                <p className="font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                  {row.absentCount}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-primary font-medium">
                  {t("dailySummary.rate", { defaultValue: "អត្រា" })}
                </p>
                <p className="font-bold text-primary mt-0.5">
                  {rateDisplay}
                </p>
              </div>
            </div>

            {/* Bottom Row: View Attendance Button */}
            <div className="pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onViewAttendance(row.classroom.id)}
                className="w-full h-8 text-xs font-khmer rounded-xl justify-center gap-1.5 hover:bg-primary hover:text-primary-foreground transition-colors shadow-xs"
              >
                <span>{t("dailySummary.viewAttendance", { defaultValue: "មើលវត្តមាន" })}</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
