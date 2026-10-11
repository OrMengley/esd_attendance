import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { AbsenceLateStudentRow } from "@/models/absence-late-report.model";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  History,
} from "lucide-react";

interface AbsenceLateTableProps {
  students: AbsenceLateStudentRow[];
  onViewStudentHistory: (studentId: string) => void;
  pageSize?: number;
}

export const AbsenceLateTable: React.FC<AbsenceLateTableProps> = ({
  students,
  onViewStudentHistory,
  pageSize = 15,
}) => {
  const { t, i18n } = useTranslation();
  const isKm = i18n.language === "km";
  const [currentPage, setCurrentPage] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset page and horizontal scroll on student data change (filter change / refresh)
  useEffect(() => {
    setCurrentPage(1);
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, [students]);

  // Reset scroll on pagination change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, [currentPage]);

  const totalPages = Math.ceil(students.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedStudents = students.slice(startIndex, startIndex + pageSize);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs w-full">
      {/* Scroll container constrained to table wrapper with zero page-level overflow */}
      <div
        ref={scrollRef}
        className="w-full overflow-x-auto relative scrollbar-thin scrollbar-thumb-muted-foreground/20"
      >
        <Table className={`w-full text-xs border-collapse ${isKm ? "font-khmer" : "font-sans"}`}>
          <TableHeader className="bg-muted/60 border-b border-border/80">
            <TableRow className="hover:bg-transparent">
              {/* 1. Sticky Rank Header */}
              <TableHead className="sticky left-0 z-30 bg-muted py-3 pl-3 text-center w-12 min-w-[48px] max-w-[48px] font-bold text-foreground">
                {t("absenceLateReport.rank", { defaultValue: isKm ? "ល.រ" : "Rank" })}
              </TableHead>

              {/* 2. Sticky Student Header */}
              <TableHead className="sticky left-12 z-30 bg-muted py-3 px-3 text-left min-w-[190px] max-w-[240px] font-bold text-foreground border-r border-border shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)] dark:shadow-[4px_0_6px_-2px_rgba(0,0,0,0.3)]">
                {t("absenceLateReport.student", { defaultValue: isKm ? "សិស្ស" : "Student" })}
              </TableHead>

              {/* 3. Current Class */}
              <TableHead className="py-3 px-3 text-left font-bold text-foreground min-w-[145px] max-w-[190px]">
                {t("absenceLateReport.currentClass", { defaultValue: isKm ? "ថ្នាក់បច្ចុប្បន្ន" : "Current Class" })}
              </TableHead>

              {/* 4. Assigned Teacher */}
              <TableHead className="py-3 px-3 text-left font-bold text-foreground min-w-[130px] max-w-[170px]">
                {t("classes.teacher", { defaultValue: isKm ? "គ្រូបង្រៀន" : "Teacher" })}
              </TableHead>

              {/* 5. Sessions (Elapsed of Planned) */}
              <TableHead className="py-3 px-2 text-center font-bold text-foreground min-w-[95px]">
                {t("absenceLateReport.sessions", { defaultValue: isKm ? "វគ្គសិក្សា" : "Sessions" })}
              </TableHead>

              {/* 6. Present */}
              <TableHead className="py-3 px-2 text-center font-bold text-emerald-600 dark:text-emerald-400 min-w-[65px]">
                {t("attendanceStatus.present", { defaultValue: isKm ? "វត្តមាន" : "Present" })}
              </TableHead>

              {/* 7. Absent */}
              <TableHead className="py-3 px-2 text-center font-bold text-rose-600 dark:text-rose-400 min-w-[65px]">
                {t("attendanceStatus.absent", { defaultValue: isKm ? "អវត្តមាន" : "Absent" })}
              </TableHead>

              {/* 8. Late */}
              <TableHead className="py-3 px-2 text-center font-bold text-amber-600 dark:text-amber-400 min-w-[65px]">
                {t("attendanceStatus.late", { defaultValue: isKm ? "យឺត" : "Late" })}
              </TableHead>

              {/* 9. Attendance Rate */}
              <TableHead className="py-3 px-2 text-center font-bold text-foreground min-w-[95px]">
                {t("absenceLateReport.rate", { defaultValue: isKm ? "អត្រា (%)" : "Rate (%)" })}
              </TableHead>

              {/* 10. Last Incident */}
              <TableHead className="py-3 px-3 text-left font-bold text-foreground min-w-[140px]">
                {t("absenceLateReport.lastIncident", { defaultValue: isKm ? "លើកចុងក្រោយ" : "Last Incident" })}
              </TableHead>

              {/* 11. Actions */}
              <TableHead className="py-3 pr-4 pl-2 text-right font-bold text-foreground min-w-[155px]">
                {t("common.actions", { defaultValue: isKm ? "សកម្មភាព" : "Actions" })}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedStudents.map((row) => {
              const rateDisplay =
                row.attendanceRate !== null ? (
                  <span className="font-mono font-bold text-foreground">
                    {row.attendanceRate}%
                  </span>
                ) : (
                  <span
                    className="font-mono text-muted-foreground text-xs"
                    title={t("absenceLateReport.notStarted", {
                      defaultValue: isKm ? "មិនទាន់ចាប់ផ្តើម" : "Not started",
                    })}
                  >
                    —
                  </span>
                );

              return (
                <TableRow
                  key={row.student.id}
                  className="group hover:bg-muted/30 transition-colors border-b border-border/60"
                >
                  {/* 1. Sticky Rank Body Cell (Solid Background) */}
                  <TableCell className="sticky left-0 z-20 bg-card group-hover:bg-slate-50 dark:group-hover:bg-slate-900 transition-colors py-2.5 pl-3 text-center font-mono font-bold text-muted-foreground w-12 min-w-[48px] max-w-[48px]">
                    #{row.rank}
                  </TableCell>

                  {/* 2. Sticky Student Body Cell (Solid Background with Shadow Divider) */}
                  <TableCell className="sticky left-12 z-20 bg-card group-hover:bg-slate-50 dark:group-hover:bg-slate-900 transition-colors py-2.5 px-3 border-r border-border shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)] dark:shadow-[4px_0_6px_-2px_rgba(0,0,0,0.3)] min-w-[190px] max-w-[240px]">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7 ring-1 ring-border shrink-0">
                        <AvatarImage src={row.student.avatarUrl} />
                        <AvatarFallback className="text-[11px] bg-primary/10 text-primary font-bold">
                          {row.student.nameKh ? row.student.nameKh.charAt(0) : "S"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground text-xs leading-tight truncate">
                          {row.student.nameKh}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                          <span className="font-mono text-primary font-medium">
                            {row.student.studentCode}
                          </span>
                          {row.student.nameEn && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[100px]">{row.student.nameEn}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* 3. Current Class */}
                  <TableCell className="py-2.5 px-3 min-w-[145px] max-w-[190px]">
                    <div className="min-w-0">
                      <p className="font-bold text-foreground text-xs truncate">
                        {row.currentClass.name}
                      </p>
                      <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                        {row.currentClass.code}
                      </p>
                    </div>
                  </TableCell>

                  {/* 4. Assigned Teacher */}
                  <TableCell className="py-2.5 px-3 min-w-[130px] max-w-[170px]">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-xs truncate">
                        {row.assignedTeacher?.name ||
                          t("dashboard.unassigned", { defaultValue: isKm ? "មិនទាន់ចាត់តាំង" : "Unassigned" })}
                      </p>
                      {row.assignedTeacher?.username && (
                        <p className="text-[10px] text-muted-foreground truncate font-mono">
                          @{row.assignedTeacher.username}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* 5. Sessions (Elapsed of Planned) */}
                  <TableCell className="py-2.5 px-2 text-center min-w-[95px]">
                    <div className="flex flex-col items-center justify-center">
                      <span className="font-mono font-bold text-foreground text-xs">
                        {row.elapsedSessions}
                      </span>
                      <span className="text-[10px] text-muted-foreground block whitespace-nowrap">
                        {t("absenceLateReport.ofPlanned", {
                          count: row.plannedSessions,
                          defaultValue: isKm ? `នៃ ${row.plannedSessions} គ្រោងទុក` : `of ${row.plannedSessions} planned`,
                        })}
                      </span>
                    </div>
                  </TableCell>

                  {/* 6. Present */}
                  <TableCell className="py-2.5 px-2 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400 min-w-[65px]">
                    {row.presentCount}
                  </TableCell>

                  {/* 7. Absent */}
                  <TableCell className="py-2.5 px-2 text-center min-w-[65px]">
                    {row.absentCount > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-6 px-1.5 py-0.5 rounded-full text-xs font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                        {row.absentCount}
                      </span>
                    ) : (
                      <span className="text-muted-foreground font-mono">0</span>
                    )}
                  </TableCell>

                  {/* 8. Late */}
                  <TableCell className="py-2.5 px-2 text-center min-w-[65px]">
                    {row.lateCount > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-6 px-1.5 py-0.5 rounded-full text-xs font-bold font-mono bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                        {row.lateCount}
                      </span>
                    ) : (
                      <span className="text-muted-foreground font-mono">0</span>
                    )}
                  </TableCell>

                  {/* 9. Attendance Rate */}
                  <TableCell className="py-2.5 px-2 text-center min-w-[95px]">
                    {rateDisplay}
                  </TableCell>

                  {/* 10. Last Incident */}
                  <TableCell className="py-2.5 px-3 min-w-[140px]">
                    {row.lastIncidentDate ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[11px] text-foreground font-medium">
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
                      <span className="text-muted-foreground font-mono">—</span>
                    )}
                  </TableCell>

                  {/* 11. Actions */}
                  <TableCell className="py-2.5 pr-4 pl-2 text-right min-w-[155px]">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onViewStudentHistory(row.student.id)}
                      className="h-8 px-2.5 text-xs rounded-xl hover:bg-primary hover:text-primary-foreground transition-colors gap-1.5 shadow-xs whitespace-nowrap"
                    >
                      <History className="h-3.5 w-3.5" />
                      <span>
                        {t("absenceLateReport.viewHistory", {
                          defaultValue: isKm ? "មើលប្រវត្តិវត្តមាន" : "View Student History",
                        })}
                      </span>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {students.length > pageSize && (
        <div className={`flex items-center justify-between px-4 py-3 border-t border-border/80 bg-muted/20 text-xs ${isKm ? "font-khmer" : "font-sans"}`}>
          <span className="text-muted-foreground">
            {t("common.showing", { defaultValue: isKm ? "បង្ហាញ" : "Showing" })} {startIndex + 1} -{" "}
            {Math.min(startIndex + pageSize, students.length)} / {students.length}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handlePrevPage}
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
              onClick={handleNextPage}
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
