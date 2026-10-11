import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Attendance } from "@/models/attendance.model";
import { Classroom } from "@/models/classroom.model";
import { Student } from "@/models/student.model";
import { User } from "@/models/user.model";
import { AttendanceCorrectionDialog } from "./attendance-correction-dialog";
import { Edit3, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

export interface AttendanceWithDetails extends Attendance {
  attendanceDocId?: string;
  student?: Student;
  classroom?: Classroom;
  teacher?: User;
}

interface AttendanceCorrectionTableProps {
  records: AttendanceWithDetails[];
  pageSize?: number;
  onRefresh?: () => void;
  onRecordCorrected?: (updatedRecord: Attendance) => void;
}

export const AttendanceCorrectionTable: React.FC<AttendanceCorrectionTableProps> = ({
  records,
  pageSize = 15,
  onRefresh,
  onRecordCorrected,
}) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceWithDetails | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const pageRecords = records.slice(startIndex, startIndex + pageSize);

  const handleOpenCorrection = (rec: AttendanceWithDetails) => {
    setSelectedRecord(rec);
    setIsDialogOpen(true);
  };

  if (records.length === 0) {
    return (
      <EmptyState
        title={t("attendanceCorrectionsPage.noRecords", { defaultValue: "No attendance records found" })}
        description={t("attendanceCorrectionsPage.noRecordsDesc", {
          defaultValue: "Adjust your search filters or date range to find attendance records.",
        })}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-28 text-xs">{t("attendanceCorrection.date", { defaultValue: "Date" })}</TableHead>
                <TableHead className="w-28 text-xs">{t("students.studentId", { defaultValue: "Code" })}</TableHead>
                <TableHead className="text-xs">{t("attendanceCorrection.student", { defaultValue: "Student" })}</TableHead>
                <TableHead className="text-xs">{t("attendanceCorrection.class", { defaultValue: "Class" })}</TableHead>
                <TableHead className="w-32 text-xs text-center">{t("common.status", { defaultValue: "Status" })}</TableHead>
                <TableHead className="w-28 text-xs text-center">{t("attendanceCorrection.badgeCorrected", { defaultValue: "Correction" })}</TableHead>
                <TableHead className="text-xs">{t("dashboard.remark", { defaultValue: "Remark" })}</TableHead>
                <TableHead className="w-32 text-xs text-right">{t("common.actions", { defaultValue: "Actions" })}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRecords.map((rec) => {
                const studentName = rec.student?.nameKh || rec.student?.nameEn || rec.studentId;
                const studentCode = rec.student?.studentCode || "—";
                const className = rec.classroom?.name || rec.classroomId;
                const classCode = rec.classroom?.code || "—";
                const isCorrected = !!rec.lastCorrectedAt;

                return (
                  <TableRow key={rec.id} className="hover:bg-muted/30">
                    {/* Date */}
                    <TableCell className="font-mono text-xs font-semibold text-foreground whitespace-nowrap">
                      {rec.attendanceDate || rec.date}
                    </TableCell>

                    {/* Student Code */}
                    <TableCell className="font-mono text-xs font-bold text-foreground">
                      #{studentCode}
                    </TableCell>

                    {/* Student Name */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-foreground">
                          {studentName}
                        </span>
                        {rec.student?.nameEn && rec.student?.nameKh && (
                          <span className="text-[11px] text-muted-foreground font-sans">
                            {rec.student.nameEn}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Class */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-foreground truncate max-w-[160px]">
                          {className}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {classCode}
                        </span>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center">
                      <StatusBadge attendanceStatus={rec.status} className="text-[10px] py-0 px-2" />
                    </TableCell>

                    {/* Correction badge */}
                    <TableCell className="text-center">
                      {isCorrected ? (
                        <Badge
                          variant="gold"
                          title={rec.lastCorrectedByName ? `Corrected by ${rec.lastCorrectedByName}` : undefined}
                          className="text-[10px] py-0.5 px-2 font-medium bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 gap-1 inline-flex items-center"
                        >
                          <CheckCircle2 className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                          {t("attendanceCorrection.badgeCorrected", { defaultValue: "Corrected" })}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/60 text-[11px]">—</span>
                      )}
                    </TableCell>

                    {/* Remark */}
                    <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                      <div className="flex flex-col gap-0.5">
                        {rec.remark && (
                          <span title={rec.remark} className="truncate block font-medium text-foreground">
                            {rec.remark}
                          </span>
                        )}
                        {rec.lastCorrectionReason && (
                          <span
                            title={
                              rec.lastCorrectionNote
                                ? `${rec.lastCorrectionReason}: ${rec.lastCorrectionNote}`
                                : rec.lastCorrectionReason
                            }
                            className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 truncate"
                          >
                            <span className="font-medium">
                              [{t("attendanceCorrection.badgeCorrected", { defaultValue: "Corrected" })}]
                            </span>
                            <span className="truncate">
                              {rec.lastCorrectionReason === "student_valid_explanation"
                                ? t("attendanceCorrection.reasonValidExplanation", { defaultValue: "Valid explanation" })
                                : rec.lastCorrectionReason === "teacher_wrong_status"
                                ? t("attendanceCorrection.reasonTeacherWrong", { defaultValue: "Teacher mistake" })
                                : rec.lastCorrectionReason === "medical_reason"
                                ? t("attendanceCorrection.reasonMedical", { defaultValue: "Medical" })
                                : rec.lastCorrectionReason === "system_data_entry_error"
                                ? t("attendanceCorrection.reasonSystemError", { defaultValue: "Data error" })
                                : rec.lastCorrectionReason}
                            </span>
                          </span>
                        )}
                        {!rec.remark && !rec.lastCorrectionReason && (
                          <span className="italic text-muted-foreground/60">—</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Action: Correct Attendance */}
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenCorrection(rec)}
                        className="text-xs font-medium gap-1.5 h-8 border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>{t("attendanceCorrection.buttonLabel", { defaultValue: "Correct" })}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/70 bg-muted/10 text-xs">
            <span className="text-muted-foreground">
              {t("attendanceAuditLogs.paginationPage", {
                current: validPage,
                total: totalPages,
                defaultValue: `Page ${validPage} of ${totalPages}`,
              })}{" "}
              ({records.length} records)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={validPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-8 px-2.5 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                <span>Previous</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={validPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 px-2.5 text-xs"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Correction Dialog */}
      {selectedRecord && (
        <AttendanceCorrectionDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          attendanceDocId={selectedRecord.attendanceDocId || selectedRecord.id}
          attendanceId={selectedRecord.attendanceDocId || selectedRecord.id}
          classroomId={selectedRecord.classroomId}
          studentId={selectedRecord.studentId}
          attendanceDate={selectedRecord.attendanceDate || selectedRecord.date || ""}
          previousStatus={selectedRecord.status}
          classroom={selectedRecord.classroom}
          student={selectedRecord.student}
          teacher={selectedRecord.teacher}
          onSuccess={(updatedRecord) => {
            if (updatedRecord && onRecordCorrected) {
              onRecordCorrected(updatedRecord);
            } else if (onRefresh) {
              onRefresh();
            }
          }}
        />
      )}
    </div>
  );
};
