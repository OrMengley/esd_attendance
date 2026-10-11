import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ClassProgressRow } from "@/models/class-progress-report.model";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClassroomStatusBadge } from "@/components/classes/classroom-status-badge";
import {
  ClassProgressHealthBadge,
  getProgressBarColor,
} from "@/components/reports/class-progress/class-progress-health-badge";
import { formatHours, formatPercent } from "@/lib/class-progress-calculator";
import {
  formatLearningDays,
  getPackageDisplayName,
  getScheduleTypeLabel,
} from "@/lib/class-progress-labels";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Eye, FileBarChart2 } from "lucide-react";

interface ClassProgressMobileCardProps {
  rows: ClassProgressRow[];
  onViewDetails: (classroomId: string) => void;
  onViewAttendance: (classroomId: string) => void;
  pageSize?: number;
}

export const ClassProgressMobileCard: React.FC<ClassProgressMobileCardProps> = ({
  rows,
  onViewDetails,
  onViewAttendance,
  pageSize = 10,
}) => {
  const { t, i18n } = useTranslation();
  const isKm = i18n.language === "km";
  const language = isKm ? "km" : "en";
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [rows]);

  const totalPages = Math.ceil(rows.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const pagedRows = rows.slice(startIndex, startIndex + pageSize);

  return (
    <div className={cn("space-y-3 md:hidden w-full", isKm ? "font-khmer" : "font-sans")}>
      {pagedRows.map((row) => {
        const { classroom, teacher, studyPackage } = row;
        return (
          <Card
            key={classroom.id}
            className="border-border/80 shadow-xs hover:border-primary/40 transition-colors w-full overflow-hidden"
          >
            <CardContent className="p-4 space-y-3">
              {/* Header: class + status */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="font-bold text-foreground text-sm leading-tight truncate">
                    {classroom.name}
                  </h4>
                  <p className="font-mono text-[11px] text-primary font-medium mt-0.5">
                    {classroom.code}
                  </p>
                </div>
                <ClassroomStatusBadge status={classroom.status} className="shrink-0" />
              </div>

              <ClassProgressHealthBadge health={row.health} />

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1 text-xs">
                  <span className="font-mono font-semibold text-foreground">
                    {t("classProgressReport.table.hoursOfPlanned", {
                      completed: formatHours(row.completedHours),
                      planned: formatHours(row.plannedHours),
                    })}
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    {formatPercent(row.progressPercent)}
                  </span>
                </div>
                <div
                  className="h-2 w-full rounded-full bg-muted overflow-hidden"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(row.progressPercent)}
                >
                  <div
                    className={cn("h-full rounded-full", getProgressBarColor(row.health))}
                    style={{ width: `${row.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Details */}
              <div className="bg-muted/30 rounded-xl p-2.5 text-xs space-y-1.5 border border-border/50">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">
                    {t("classProgressReport.table.package")}:
                  </span>
                  <span className="font-semibold text-foreground truncate text-right">
                    {studyPackage
                      ? getPackageDisplayName(studyPackage, language)
                      : t("classProgressReport.table.noPackage")}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">
                    {t("classProgressReport.table.teacher")}:
                  </span>
                  <span className="flex items-center gap-1.5 min-w-0">
                    {teacher && (
                      <Avatar className="h-5 w-5 shrink-0">
                        <AvatarImage src={teacher.avatarUrl} />
                        <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">
                          {teacher.name ? teacher.name.charAt(0) : "T"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <span className="font-semibold text-foreground truncate text-right">
                      {teacher ? teacher.name : t("classProgressReport.table.unassigned")}
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">
                    {t("classProgressReport.table.schedule")}:
                  </span>
                  <span className="font-semibold text-foreground text-right">
                    {getScheduleTypeLabel(t, row.scheduleType)} · {formatLearningDays(t, classroom)}
                    <span className="block font-mono text-[11px] text-muted-foreground font-normal">
                      {classroom.startTime} → {classroom.endTime}
                    </span>
                  </span>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 text-center py-1 border-y border-border/60">
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground">
                    {t("classProgressReport.table.remainingHours")}
                  </p>
                  <p className="font-mono font-bold text-xs text-foreground">
                    {formatHours(row.remainingHours)}{" "}
                    <span className="text-[10px] font-normal text-muted-foreground">
                      {t("classProgressReport.table.hoursUnit")}
                    </span>
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground">
                    {t("classProgressReport.table.expectedEndDate")}
                  </p>
                  <p
                    className={cn(
                      "font-mono text-[11px] font-semibold",
                      row.isOverdue ? "text-rose-600 dark:text-rose-400" : "text-foreground"
                    )}
                  >
                    {row.expectedEndDate || "—"}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground">
                    {t("classProgressReport.table.capacity")}
                  </p>
                  <p className="font-mono font-bold text-xs text-foreground">
                    {row.capacity !== null
                      ? `${row.enrolledStudents} / ${row.capacity}`
                      : row.enrolledStudents}
                  </p>
                  {row.availableSeats !== null && (
                    <p className="text-[10px] text-muted-foreground">
                      {t("classProgressReport.table.seatsLeft", { count: row.availableSeats })}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(classroom.id)}
                  className="h-8 flex-1 px-2.5 text-xs rounded-xl gap-1.5 min-w-0"
                >
                  <Eye className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{t("classProgressReport.table.viewDetails")}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onViewAttendance(classroom.id)}
                  className="h-8 flex-1 px-2.5 text-xs rounded-xl gap-1.5 min-w-0"
                >
                  <FileBarChart2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{t("classProgressReport.table.viewAttendance")}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {rows.length > pageSize && (
        <div className="flex items-center justify-between px-1 py-1 text-xs">
          <span className="text-muted-foreground">
            {t("classProgressReport.paginationInfo", {
              from: startIndex + 1,
              to: Math.min(startIndex + pageSize, rows.length),
              total: rows.length,
            })}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => currentPage > 1 && setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8 rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-mono px-1 font-semibold text-foreground">
              {currentPage} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => currentPage < totalPages && setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 rounded-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
