import React from "react";
import { useTranslation } from "react-i18next";
import { AbsenceLateStudentRow } from "@/models/absence-late-report.model";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { History } from "lucide-react";

interface AbsenceLateMobileCardProps {
  students: AbsenceLateStudentRow[];
  onViewStudentHistory: (studentId: string) => void;
}

export const AbsenceLateMobileCard: React.FC<AbsenceLateMobileCardProps> = ({
  students,
  onViewStudentHistory,
}) => {
  const { t, i18n } = useTranslation();
  const isKm = i18n.language === "km";

  return (
    <div className={`space-y-3 md:hidden w-full ${isKm ? "font-khmer" : "font-sans"}`}>
      {students.map((row) => {
        const rateDisplay =
          row.attendanceRate !== null ? (
            `${row.attendanceRate}%`
          ) : (
            "—"
          );

        return (
          <Card
            key={row.student.id}
            className="border-border/80 shadow-xs hover:border-primary/40 transition-colors w-full overflow-hidden"
          >
            <CardContent className="p-4 space-y-3">
              {/* Header: Rank + Student Info */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-muted text-muted-foreground font-mono font-bold text-xs shrink-0">
                    #{row.rank}
                  </div>
                  <Avatar className="h-10 w-10 ring-1 ring-border shrink-0">
                    <AvatarImage src={row.student.avatarUrl} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                      {row.student.nameKh ? row.student.nameKh.charAt(0) : "S"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h4 className="font-bold text-foreground text-sm leading-tight truncate">
                      {row.student.nameKh}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <span className="font-mono text-primary font-medium">
                        {row.student.studentCode}
                      </span>
                      {row.student.nameEn && (
                        <>
                          <span>•</span>
                          <span className="truncate">{row.student.nameEn}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Attendance Rate */}
                <div className="text-right shrink-0">
                  <span className="text-[11px] text-muted-foreground block">
                    {t("absenceLateReport.rate", { defaultValue: isKm ? "អត្រា" : "Rate" })}
                  </span>
                  <span className="font-mono font-bold text-foreground text-sm">
                    {rateDisplay}
                  </span>
                </div>
              </div>

              {/* Class & Teacher Details */}
              <div className="bg-muted/30 rounded-xl p-2.5 text-xs space-y-1.5 border border-border/50">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">
                    {t("absenceLateReport.currentClass", { defaultValue: isKm ? "ថ្នាក់" : "Class" })}:
                  </span>
                  <span className="font-bold text-foreground truncate text-right">
                    {row.currentClass.name} ({row.currentClass.code})
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">
                    {t("classes.teacher", { defaultValue: isKm ? "គ្រូបង្រៀន" : "Teacher" })}:
                  </span>
                  <span className="font-semibold text-foreground truncate text-right">
                    {row.assignedTeacher?.name ||
                      t("dashboard.unassigned", { defaultValue: isKm ? "មិនទាន់ចាត់តាំង" : "Unassigned" })}
                  </span>
                </div>
              </div>

              {/* Metric counters: Elapsed / Planned Sessions, Present, Absent, Late */}
              <div className="grid grid-cols-4 gap-2 text-center py-1 border-y border-border/60">
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground">
                    {t("absenceLateReport.sessions", { defaultValue: isKm ? "វគ្គ" : "Sessions" })}
                  </p>
                  <p className="font-mono font-bold text-xs text-foreground">
                    {row.elapsedSessions}
                    <span className="text-[10px] text-muted-foreground font-normal">
                      /{row.plannedSessions}
                    </span>
                  </p>
                </div>

                <div className="space-y-0.5">
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {t("attendanceStatus.present", { defaultValue: isKm ? "វត្តមាន" : "Present" })}
                  </p>
                  <p className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                    {row.presentCount}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                    {t("attendanceStatus.absent", { defaultValue: isKm ? "អវត្តមាន" : "Absent" })}
                  </p>
                  {row.absentCount > 0 ? (
                    <span className="inline-flex items-center justify-center min-w-5 px-1.5 py-0.2 rounded-full text-xs font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                      {row.absentCount}
                    </span>
                  ) : (
                    <p className="font-mono font-bold text-xs text-muted-foreground">0</p>
                  )}
                </div>

                <div className="space-y-0.5">
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    {t("attendanceStatus.late", { defaultValue: isKm ? "យឺត" : "Late" })}
                  </p>
                  {row.lateCount > 0 ? (
                    <span className="inline-flex items-center justify-center min-w-5 px-1.5 py-0.2 rounded-full text-xs font-bold font-mono bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                      {row.lateCount}
                    </span>
                  ) : (
                    <p className="font-mono font-bold text-xs text-muted-foreground">0</p>
                  )}
                </div>
              </div>

              {/* Last Incident & Action */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="text-xs min-w-0">
                  <span className="text-muted-foreground text-[10px] block">
                    {t("absenceLateReport.lastIncident", { defaultValue: isKm ? "លើកចុងក្រោយ" : "Last Incident" })}:
                  </span>
                  {row.lastIncidentDate ? (
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {row.lastIncidentDate}
                      </span>
                      {row.lastIncidentStatus === "absent" ? (
                        <Badge
                          variant="destructive"
                          className="text-[10px] font-bold py-0 px-1.5 h-4.5"
                        >
                          {t("attendanceStatus.absent", { defaultValue: isKm ? "អវត្តមាន" : "Absent" })}
                        </Badge>
                      ) : (
                        <Badge
                          variant="warning"
                          className="text-[10px] font-bold py-0 px-1.5 h-4.5 bg-amber-500 text-white"
                        >
                          {t("attendanceStatus.late", { defaultValue: isKm ? "យឺត" : "Late" })}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs font-mono">—</span>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onViewStudentHistory(row.student.id)}
                  className="h-8 px-2.5 text-xs rounded-xl hover:bg-primary hover:text-primary-foreground transition-colors gap-1.5 shrink-0"
                >
                  <History className="h-3.5 w-3.5" />
                  <span>
                    {t("absenceLateReport.viewHistory", {
                      defaultValue: isKm ? "មើលប្រវត្តិវត្តមាន" : "View Student History",
                    })}
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
