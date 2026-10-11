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
import { AttendanceAuditLog } from "@/models/attendance-audit-log.model";
import { AuditLogDetailDialog } from "./audit-log-detail-dialog";
import { formatKhmerDateTime } from "@/lib/utils";
import { Eye, ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";

interface AuditLogTableProps {
  logs: AttendanceAuditLog[];
  pageSize?: number;
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({
  logs,
  pageSize = 15,
}) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AttendanceAuditLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const totalPages = Math.max(1, Math.ceil(logs.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const pageLogs = logs.slice(startIndex, startIndex + pageSize);

  const handleOpenDetail = (log: AttendanceAuditLog) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  if (logs.length === 0) {
    return (
      <EmptyState
        title={t("attendanceAuditLogs.noLogsFound", { defaultValue: "No audit logs found" })}
        description={t("attendanceAuditLogs.noLogsDesc", {
          defaultValue: "No attendance corrections match your filter criteria.",
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
                <TableHead className="w-36 text-xs">{t("attendanceAuditLogs.colCorrectedAt", { defaultValue: "Corrected At" })}</TableHead>
                <TableHead className="text-xs">{t("attendanceAuditLogs.colStudent", { defaultValue: "Student" })}</TableHead>
                <TableHead className="text-xs">{t("attendanceAuditLogs.colClass", { defaultValue: "Class" })}</TableHead>
                <TableHead className="w-28 text-xs">{t("attendanceAuditLogs.colDate", { defaultValue: "Date" })}</TableHead>
                <TableHead className="w-28 text-xs text-center">{t("attendanceAuditLogs.colChangedFrom", { defaultValue: "Changed From" })}</TableHead>
                <TableHead className="w-28 text-xs text-center">{t("attendanceAuditLogs.colChangedTo", { defaultValue: "Changed To" })}</TableHead>
                <TableHead className="text-xs">{t("attendanceAuditLogs.colReason", { defaultValue: "Reason" })}</TableHead>
                <TableHead className="w-32 text-xs">{t("attendanceAuditLogs.colCorrectedBy", { defaultValue: "Corrected By" })}</TableHead>
                <TableHead className="text-xs max-w-[180px]">{t("attendanceAuditLogs.colNotes", { defaultValue: "Notes" })}</TableHead>
                <TableHead className="w-20 text-xs text-right">{t("common.actions", { defaultValue: "Actions" })}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageLogs.map((log) => {
                const studentName =
                  log.studentSnapshot?.fullNameKm ||
                  log.studentSnapshot?.fullNameEn ||
                  "—";
                const studentCode = log.studentSnapshot?.studentCode || "—";
                const className = log.classroomSnapshot?.className || "—";
                const classCode = log.classroomSnapshot?.classCode || "—";

                return (
                  <TableRow key={log.id} className="hover:bg-muted/30">
                    {/* Corrected At */}
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {formatKhmerDateTime(log.correctedAt)}
                    </TableCell>

                    {/* Student */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-foreground">
                          {studentName}
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          #{studentCode}
                        </span>
                      </div>
                    </TableCell>

                    {/* Class */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs text-foreground font-medium truncate max-w-[160px]">
                          {className}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {classCode}
                        </span>
                      </div>
                    </TableCell>

                    {/* Attendance Date */}
                    <TableCell className="font-mono text-xs font-semibold text-foreground whitespace-nowrap">
                      {log.attendanceDate}
                    </TableCell>

                    {/* Changed From */}
                    <TableCell className="text-center">
                      {log.previousStatus ? (
                        <StatusBadge attendanceStatus={log.previousStatus} className="text-[10px] py-0 px-2" />
                      ) : (
                        <Badge variant="secondary" className="gap-0.5 text-[10px] text-muted-foreground font-normal py-0">
                          <HelpCircle className="h-2.5 w-2.5" />
                          <span>{t("attendanceCorrection.noRecord", { defaultValue: "None" })}</span>
                        </Badge>
                      )}
                    </TableCell>

                    {/* Changed To */}
                    <TableCell className="text-center">
                      <StatusBadge attendanceStatus={log.newStatus} className="text-[10px] py-0 px-2 font-bold" />
                    </TableCell>

                    {/* Reason */}
                    <TableCell>
                      <span className="text-xs text-foreground font-medium">
                        {t(`correctionReasons.${log.correctionReason}`, {
                          defaultValue: log.correctionReason,
                        })}
                      </span>
                    </TableCell>

                    {/* Corrected By */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-foreground truncate max-w-[120px]">
                          {log.correctedByName}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          @{log.correctedByUsername}
                        </span>
                      </div>
                    </TableCell>

                    {/* Notes */}
                    <TableCell className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {log.correctionNote ? (
                        <span title={log.correctionNote} className="truncate block">
                          {log.correctionNote}
                        </span>
                      ) : (
                        <span className="italic text-muted-foreground/60">—</span>
                      )}
                    </TableCell>

                    {/* View Details Action */}
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDetail(log)}
                        title={t("attendanceAuditLogs.viewDetails", { defaultValue: "View Details" })}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4 text-primary" />
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
              ({t("attendanceAuditLogs.totalRecords", { count: logs.length, defaultValue: `${logs.length} total` })})
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

      {/* Detail Dialog */}
      <AuditLogDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        auditLog={selectedLog}
      />
    </div>
  );
};
