import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ClassProgressRow } from "@/models/class-progress-report.model";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, Eye, FileBarChart2 } from "lucide-react";

interface ClassProgressTableProps {
  rows: ClassProgressRow[];
  onViewDetails: (classroomId: string) => void;
  onViewAttendance: (classroomId: string) => void;
  pageSize?: number;
}

const HEAD_CLASS = "py-3 px-3 text-left font-bold text-foreground whitespace-nowrap";

export const ClassProgressTable: React.FC<ClassProgressTableProps> = ({
  rows,
  onViewDetails,
  onViewAttendance,
  pageSize = 15,
}) => {
  const { t, i18n } = useTranslation();
  const isKm = i18n.language === "km";
  const language = isKm ? "km" : "en";
  const [currentPage, setCurrentPage] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset page and horizontal scroll when data changes (filters / refresh)
  useEffect(() => {
    setCurrentPage(1);
    if (scrollRef.current) scrollRef.current.scrollLeft = 0;
  }, [rows]);

  // Reset horizontal scroll on pagination
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = 0;
  }, [currentPage]);

  const totalPages = Math.ceil(rows.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const pagedRows = rows.slice(startIndex, startIndex + pageSize);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs w-full">
      {/* Horizontal scroll stays inside this wrapper — no page-level overflow */}
      <div
        ref={scrollRef}
        className="w-full overflow-x-auto relative scrollbar-thin scrollbar-thumb-muted-foreground/20"
      >
        <Table className={cn("w-full text-xs border-collapse", isKm ? "font-khmer" : "font-sans")}>
          <TableHeader className="bg-muted/60 border-b border-border/80">
            <TableRow className="hover:bg-transparent">
              {/* 1. Sticky class column */}
              <TableHead
                className={cn(
                  HEAD_CLASS,
                  "sticky left-0 z-30 bg-muted min-w-[200px] max-w-[240px] border-r border-border shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)] dark:shadow-[4px_0_6px_-2px_rgba(0,0,0,0.3)]"
                )}
              >
                {t("classProgressReport.table.class")}
              </TableHead>
              <TableHead className={cn(HEAD_CLASS, "min-w-[170px]")}>
                {t("classProgressReport.table.package")}
              </TableHead>
              <TableHead className={cn(HEAD_CLASS, "min-w-[170px]")}>
                {t("classProgressReport.table.teacher")}
              </TableHead>
              <TableHead className={cn(HEAD_CLASS, "min-w-[150px]")}>
                {t("classProgressReport.table.schedule")}
              </TableHead>
              <TableHead className={cn(HEAD_CLASS, "min-w-[200px]")}>
                {t("classProgressReport.table.progress")}
              </TableHead>
              <TableHead className={cn(HEAD_CLASS, "min-w-[100px] text-center")}>
                {t("classProgressReport.table.remainingHours")}
              </TableHead>
              <TableHead className={cn(HEAD_CLASS, "min-w-[130px]")}>
                {t("classProgressReport.table.expectedEndDate")}
              </TableHead>
              <TableHead className={cn(HEAD_CLASS, "min-w-[150px]")}>
                {t("classProgressReport.table.health")}
              </TableHead>
              <TableHead className={cn(HEAD_CLASS, "min-w-[170px]")}>
                {t("classProgressReport.table.capacity")}
              </TableHead>
              <TableHead className={cn(HEAD_CLASS, "min-w-[120px]")}>
                {t("classProgressReport.table.status")}
              </TableHead>
              <TableHead className={cn(HEAD_CLASS, "min-w-[100px] text-right pr-4")}>
                {t("classProgressReport.table.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {pagedRows.map((row) => {
              const { classroom, teacher, studyPackage } = row;
              const capacityBarColor =
                row.capacityPercent >= 100
                  ? "bg-rose-500"
                  : row.capacityPercent >= 90
                  ? "bg-amber-500"
                  : "bg-emerald-500";

              return (
                <TableRow
                  key={classroom.id}
                  className="group hover:bg-muted/30 transition-colors border-b border-border/60"
                >
                  {/* 1. Class (sticky, solid background) */}
                  <TableCell className="sticky left-0 z-20 bg-card group-hover:bg-slate-50 dark:group-hover:bg-slate-900 transition-colors py-2.5 px-3 border-r border-border shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)] dark:shadow-[4px_0_6px_-2px_rgba(0,0,0,0.3)] min-w-[200px] max-w-[240px]">
                    <p className="font-bold text-foreground text-xs leading-tight truncate">
                      {classroom.name}
                    </p>
                    <p className="font-mono text-[11px] text-primary font-medium mt-0.5">
                      {classroom.code}
                    </p>
                  </TableCell>

                  {/* 2. Study package */}
                  <TableCell className="py-2.5 px-3 min-w-[170px]">
                    <p className="font-semibold text-foreground text-xs truncate max-w-[200px]">
                      {studyPackage
                        ? getPackageDisplayName(studyPackage, language)
                        : t("classProgressReport.table.noPackage")}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {t("classProgressReport.table.plannedHoursValue", {
                        hours: formatHours(row.plannedHours),
                      })}
                    </p>
                  </TableCell>

                  {/* 3. Assigned teacher */}
                  <TableCell className="py-2.5 px-3 min-w-[170px]">
                    {teacher ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-7 w-7 ring-1 ring-border shrink-0">
                          <AvatarImage src={teacher.avatarUrl} />
                          <AvatarFallback className="text-[11px] bg-primary/10 text-primary font-bold">
                            {teacher.name ? teacher.name.charAt(0) : "T"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-xs truncate max-w-[140px]">
                            {teacher.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono truncate">
                            @{teacher.username}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">
                        {t("classProgressReport.table.unassigned")}
                      </span>
                    )}
                  </TableCell>

                  {/* 4. Schedule */}
                  <TableCell className="py-2.5 px-3 min-w-[150px]">
                    <p className="font-semibold text-foreground text-xs">
                      {getScheduleTypeLabel(t, row.scheduleType)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatLearningDays(t, classroom)}
                    </p>
                    <p className="text-[11px] font-mono text-muted-foreground">
                      {classroom.startTime} → {classroom.endTime}
                    </p>
                  </TableCell>

                  {/* 5. Learning progress */}
                  <TableCell className="py-2.5 px-3 min-w-[200px]">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-[11px] text-foreground font-semibold whitespace-nowrap">
                        {t("classProgressReport.table.hoursOfPlanned", {
                          completed: formatHours(row.completedHours),
                          planned: formatHours(row.plannedHours),
                        })}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-foreground">
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
                        className={cn(
                          "h-full rounded-full transition-all",
                          getProgressBarColor(row.health)
                        )}
                        style={{ width: `${row.progressPercent}%` }}
                      />
                    </div>
                  </TableCell>

                  {/* 6. Remaining hours */}
                  <TableCell className="py-2.5 px-3 text-center min-w-[100px]">
                    <span className="font-mono font-bold text-foreground text-xs">
                      {formatHours(row.remainingHours)}
                    </span>{" "}
                    <span className="text-[10px] text-muted-foreground">
                      {t("classProgressReport.table.hoursUnit")}
                    </span>
                  </TableCell>

                  {/* 7. Expected end date */}
                  <TableCell className="py-2.5 px-3 min-w-[130px]">
                    <span
                      className={cn(
                        "font-mono text-[11px] font-medium",
                        row.isOverdue ? "text-rose-600 dark:text-rose-400 font-bold" : "text-foreground"
                      )}
                    >
                      {row.expectedEndDate || "—"}
                    </span>
                  </TableCell>

                  {/* 8. Completion health */}
                  <TableCell className="py-2.5 px-3 min-w-[150px]">
                    <ClassProgressHealthBadge health={row.health} />
                  </TableCell>

                  {/* 9. Capacity */}
                  <TableCell className="py-2.5 px-3 min-w-[170px]">
                    {row.capacity !== null ? (
                      <>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-mono text-[11px] font-semibold text-foreground">
                            {row.enrolledStudents} / {row.capacity}
                          </span>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {t("classProgressReport.table.seatsLeft", {
                              count: row.availableSeats ?? 0,
                            })}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", capacityBarColor)}
                            style={{ width: `${Math.min(row.capacityPercent, 100)}%` }}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="font-mono text-[11px] font-semibold text-foreground">
                          {row.enrolledStudents}
                        </span>
                        <p className="text-[10px] text-muted-foreground">
                          {t("classProgressReport.table.noCapacity")}
                        </p>
                      </>
                    )}
                  </TableCell>

                  {/* 10. Status */}
                  <TableCell className="py-2.5 px-3 min-w-[120px]">
                    <ClassroomStatusBadge status={classroom.status} />
                  </TableCell>

                  {/* 11. Actions */}
                  <TableCell className="py-2.5 pr-4 pl-2 text-right min-w-[100px]">
                    <div className="flex items-center justify-end gap-1.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => onViewDetails(classroom.id)}
                            aria-label={t("classProgressReport.table.viewDetails")}
                            className="h-8 w-8 rounded-xl hover:bg-primary hover:text-primary-foreground transition-colors shadow-xs"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className={isKm ? "font-khmer text-xs" : "text-xs"}>
                            {t("classProgressReport.table.viewDetails")}
                          </p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => onViewAttendance(classroom.id)}
                            aria-label={t("classProgressReport.table.viewAttendance")}
                            className="h-8 w-8 rounded-xl hover:bg-primary hover:text-primary-foreground transition-colors shadow-xs"
                          >
                            <FileBarChart2 className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className={isKm ? "font-khmer text-xs" : "text-xs"}>
                            {t("classProgressReport.table.viewAttendance")}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination footer */}
      {rows.length > pageSize && (
        <div
          className={cn(
            "flex items-center justify-between px-4 py-3 border-t border-border/80 bg-muted/20 text-xs",
            isKm ? "font-khmer" : "font-sans"
          )}
        >
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
            <span className="font-mono px-2 font-semibold text-foreground">
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
    </TooltipProvider>
  );
};
