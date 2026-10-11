import React from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AttendanceAuditLog } from "@/models/attendance-audit-log.model";
import { AttendanceStatusChange } from "./attendance-status-change";
import {
  FileText,
  User,
  School,
  Calendar,
  Clock,
  ShieldCheck,
  GraduationCap,
  Info,
} from "lucide-react";
import { formatKhmerDateTime } from "@/lib/utils";

interface AuditLogDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auditLog: AttendanceAuditLog | null;
}

export const AuditLogDetailDialog: React.FC<AuditLogDetailDialogProps> = ({
  open,
  onOpenChange,
  auditLog,
}) => {
  const { t } = useTranslation();

  if (!auditLog) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl rounded-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold font-khmer">
                {t("attendanceAuditLogs.detailsTitle", { defaultValue: "Correction Audit Detail" })}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {t("attendanceAuditLogs.detailsDesc", {
                  defaultValue: "Complete audit snapshot of this attendance correction",
                })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-2 text-xs">
          {/* Status Change Spotlight Card */}
          <div className="p-4 rounded-xl border bg-card/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                {t("attendanceAuditLogs.changeOverview", { defaultValue: "Status Change" })}
              </span>
              <AttendanceStatusChange
                previousStatus={auditLog.previousStatus}
                newStatus={auditLog.newStatus}
              />
            </div>
            <div className="sm:text-right">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                {t("attendanceCorrection.reason", { defaultValue: "Reason" })}
              </span>
              <Badge variant="outline" className="font-medium text-xs">
                {t(`correctionReasons.${auditLog.correctionReason}`, {
                  defaultValue: auditLog.correctionReason,
                })}
              </Badge>
            </div>
          </div>

          {/* Grid of Snapshots */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Student Snapshot */}
            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2">
              <span className="font-semibold text-primary flex items-center gap-1.5 text-xs">
                <User className="h-3.5 w-3.5" />
                {t("attendanceAuditLogs.studentSnapshot", { defaultValue: "Student Snapshot" })}
              </span>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("attendanceCorrection.student")}:</span>
                  <span className="font-semibold text-foreground">
                    {auditLog.studentSnapshot?.fullNameKm || auditLog.studentSnapshot?.fullNameEn || "—"}
                  </span>
                </div>
                {auditLog.studentSnapshot?.fullNameEn && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Latin Name:</span>
                    <span className="text-foreground">{auditLog.studentSnapshot.fullNameEn}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Student ID:</span>
                  <span className="font-mono font-bold text-foreground">
                    #{auditLog.studentSnapshot?.studentCode || "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Classroom Snapshot */}
            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2">
              <span className="font-semibold text-primary flex items-center gap-1.5 text-xs">
                <School className="h-3.5 w-3.5" />
                {t("attendanceAuditLogs.classroomSnapshot", { defaultValue: "Classroom Snapshot" })}
              </span>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("attendanceCorrection.class")}:</span>
                  <span className="font-semibold text-foreground">
                    {auditLog.classroomSnapshot?.className || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Class Code:</span>
                  <span className="font-mono font-bold text-foreground">
                    {auditLog.classroomSnapshot?.classCode || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("attendanceCorrection.date")}:</span>
                  <span className="font-mono font-bold text-foreground">{auditLog.attendanceDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Corrected By & Teacher Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Administrator details */}
            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2">
              <span className="font-semibold text-primary flex items-center gap-1.5 text-xs">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t("attendanceCorrection.changedBy", { defaultValue: "Corrected By" })}
              </span>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Admin:</span>
                  <span className="font-semibold text-foreground">{auditLog.correctedByName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Username:</span>
                  <span className="font-mono text-muted-foreground">@{auditLog.correctedByUsername}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role:</span>
                  <Badge variant="gold" className="text-[10px] py-0 px-1.5">
                    {auditLog.correctedByRole}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timestamp:</span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {formatKhmerDateTime(auditLog.correctedAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Teacher Snapshot */}
            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2">
              <span className="font-semibold text-primary flex items-center gap-1.5 text-xs">
                <GraduationCap className="h-3.5 w-3.5" />
                {t("attendanceAuditLogs.teacherSnapshot", { defaultValue: "Teacher Snapshot" })}
              </span>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Teacher:</span>
                  <span className="font-semibold text-foreground">
                    {auditLog.teacherSnapshot?.fullName || "—"}
                  </span>
                </div>
                {auditLog.teacherSnapshot?.username && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Username:</span>
                    <span className="font-mono text-muted-foreground">
                      @{auditLog.teacherSnapshot.username}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Justification Notes */}
          {auditLog.correctionNote && (
            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-1">
              <span className="text-muted-foreground font-semibold text-[11px] block">
                {t("attendanceCorrection.notesLabel", { defaultValue: "Notes" })}:
              </span>
              <p className="p-2.5 rounded-lg bg-background border text-xs text-foreground font-sans break-words whitespace-pre-wrap">
                {auditLog.correctionNote}
              </p>
            </div>
          )}

          {/* Immutability Notice */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-[11px]">
            <Info className="h-4 w-4 shrink-0" />
            <span>
              {t("attendanceAuditLogs.readOnlyNotice", {
                defaultValue: "Audit logs are permanently preserved and cannot be edited or deleted.",
              })}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            {t("common.close", { defaultValue: "Close" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
