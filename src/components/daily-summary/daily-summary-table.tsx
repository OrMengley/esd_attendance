import React from "react";
import { useTranslation } from "react-i18next";
import { ClassDailyAttendanceSummary } from "@/lib/daily-attendance-summary";
import { DailySummaryStatusBadge } from "./daily-summary-status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink, Clock } from "lucide-react";

interface DailySummaryTableProps {
  items: ClassDailyAttendanceSummary[];
  onViewAttendance: (classroomId: string) => void;
}

export const DailySummaryTable: React.FC<DailySummaryTableProps> = ({
  items,
  onViewAttendance,
}) => {
  const { t, i18n } = useTranslation();

  return (
    <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <Table className="w-full text-xs">
          <TableHeader className="bg-muted/40 font-khmer">
            <TableRow className="hover:bg-transparent border-border/80">
              <TableHead className="font-bold text-foreground py-3.5 pl-4 min-w-[170px]">
                {t("classes.classColumn", { defaultValue: "ថ្នាក់រៀន" })}
              </TableHead>
              <TableHead className="font-bold text-foreground min-w-[150px]">
                {t("classes.teacher", { defaultValue: "គ្រូបង្រៀន" })}
              </TableHead>
              <TableHead className="font-bold text-foreground min-w-[140px]">
                {t("classes.package", { defaultValue: "កញ្ចប់សិក្សា" })}
              </TableHead>
              <TableHead className="font-bold text-foreground min-w-[140px]">
                {t("dailySummary.scheduleTime", { defaultValue: "កាលវិភាគ & ម៉ោង" })}
              </TableHead>
              <TableHead className="font-bold text-foreground text-center min-w-[70px]">
                {t("dailySummary.eligibleStudents", { defaultValue: "សិស្ស" })}
              </TableHead>
              <TableHead className="font-bold text-foreground text-center min-w-[70px]">
                {t("dailySummary.recordedStudents", { defaultValue: "កត់ត្រា" })}
              </TableHead>
              <TableHead className="font-bold text-emerald-600 text-center min-w-[60px]">
                {t("attendanceStatus.present", { defaultValue: "វត្តមាន" })}
              </TableHead>
              <TableHead className="font-bold text-rose-600 text-center min-w-[60px]">
                {t("attendanceStatus.absent", { defaultValue: "អវត្តមាន" })}
              </TableHead>
              <TableHead className="font-bold text-amber-600 text-center min-w-[50px]">
                {t("attendanceStatus.late", { defaultValue: "យឺត" })}
              </TableHead>
              <TableHead className="font-bold text-blue-600 text-center min-w-[60px]">
                {t("attendanceStatus.permission", { defaultValue: "ច្បាប់" })}
              </TableHead>
              <TableHead className="font-bold text-foreground text-center min-w-[80px]">
                {t("dailySummary.rate", { defaultValue: "អត្រា (%)" })}
              </TableHead>
              <TableHead className="font-bold text-foreground min-w-[130px]">
                {t("dailySummary.completionStatus", { defaultValue: "ស្ថានភាពកត់ត្រា" })}
              </TableHead>
              <TableHead className="font-bold text-foreground text-right pr-4 min-w-[110px]">
                {t("dailySummary.actions", { defaultValue: "សកម្មភាព" })}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
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
                <TableRow
                  key={row.classroom.id}
                  className="hover:bg-muted/30 transition-colors border-border/60"
                >
                  {/* Class Name & Code */}
                  <TableCell className="py-3 pl-4 font-khmer">
                    <div className="font-bold text-foreground text-sm line-clamp-1">
                      {row.classroom.name}
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                      {row.classroom.code}
                    </div>
                  </TableCell>

                  {/* Teacher Avatar & Name */}
                  <TableCell className="py-3 font-khmer">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7 ring-1 ring-border shrink-0">
                        <AvatarImage src={row.teacher?.avatarUrl} />
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                          {row.teacher?.name ? row.teacher.name.charAt(0) : "T"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-xs truncate">
                          {row.teacher?.name || t("dashboard.unassigned", { defaultValue: "មិនទាន់ចាត់តាំង" })}
                        </p>
                        {row.teacher?.username && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            @{row.teacher.username}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Study Package */}
                  <TableCell className="py-3 font-khmer">
                    <span className="font-medium text-muted-foreground line-clamp-1" title={packageName}>
                      {packageName}
                    </span>
                  </TableCell>

                  {/* Schedule & Session Time */}
                  <TableCell className="py-3 font-khmer">
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-foreground">
                        {scheduleDaysLabel}
                      </div>
                      <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span>
                          {row.classroom.startTime} - {row.classroom.endTime}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Eligible Students */}
                  <TableCell className="py-3 text-center font-bold text-foreground">
                    {row.eligibleStudentCount}
                  </TableCell>

                  {/* Recorded Count */}
                  <TableCell className="py-3 text-center font-semibold">
                    <span
                      className={
                        row.recordedStudentCount === row.eligibleStudentCount && row.eligibleStudentCount > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : row.recordedStudentCount > 0
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-muted-foreground"
                      }
                    >
                      {row.recordedStudentCount} / {row.eligibleStudentCount}
                    </span>
                  </TableCell>

                  {/* Present */}
                  <TableCell className="py-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                    {row.presentCount}
                  </TableCell>

                  {/* Absent */}
                  <TableCell className="py-3 text-center font-bold text-rose-600 dark:text-rose-400">
                    {row.absentCount}
                  </TableCell>

                  {/* Late */}
                  <TableCell className="py-3 text-center font-bold text-amber-600 dark:text-amber-400">
                    {row.lateCount}
                  </TableCell>

                  {/* Permission */}
                  <TableCell className="py-3 text-center font-bold text-blue-600 dark:text-blue-400">
                    {row.permissionCount}
                  </TableCell>

                  {/* Rate */}
                  <TableCell className="py-3 text-center font-bold text-foreground">
                    {rateDisplay}
                  </TableCell>

                  {/* Completion Status */}
                  <TableCell className="py-3">
                    <DailySummaryStatusBadge status={row.status} />
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-3 pr-4 text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onViewAttendance(row.classroom.id)}
                      className="h-8 px-2.5 text-xs font-khmer rounded-xl hover:bg-primary hover:text-primary-foreground transition-colors gap-1.5 shadow-xs"
                    >
                      <span>{t("dailySummary.viewAttendance", { defaultValue: "មើលវត្តមាន" })}</span>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
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
