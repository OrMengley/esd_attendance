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
import { AttendanceStatus } from "@/models/attendance.model";
import { CorrectionReason } from "@/models/attendance-audit-log.model";
import { AttendanceStatusChange } from "./attendance-status-change";
import { AlertTriangle, Loader2, ShieldCheck, User, School, Calendar, FileText } from "lucide-react";

interface AttendanceCorrectionConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  studentCode: string;
  className: string;
  classCode: string;
  attendanceDate: string;
  previousStatus: AttendanceStatus | null | undefined;
  newStatus: AttendanceStatus;
  reason: CorrectionReason;
  notes?: string;
  isSaving: boolean;
  onConfirm: () => void;
}

export const AttendanceCorrectionConfirmDialog: React.FC<AttendanceCorrectionConfirmDialogProps> = ({
  open,
  onOpenChange,
  studentName,
  studentCode,
  className,
  classCode,
  attendanceDate,
  previousStatus,
  newStatus,
  reason,
  notes,
  isSaving,
  onConfirm,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold font-khmer">
                {t("attendanceCorrection.confirmTitle", { defaultValue: "Confirm Attendance Correction" })}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {t("attendanceCorrection.confirmDesc", {
                  defaultValue: "You are changing this student's attendance record. This action will be permanently recorded in the audit log.",
                })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 my-2 rounded-xl border bg-muted/20 p-4 text-xs">
          {/* Student */}
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" />
              {t("attendanceCorrection.student", { defaultValue: "Student" })}:
            </span>
            <span className="font-semibold text-foreground text-right">
              {studentName} <span className="font-mono text-muted-foreground">({studentCode})</span>
            </span>
          </div>

          {/* Class */}
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <School className="h-3.5 w-3.5 text-primary" />
              {t("attendanceCorrection.class", { defaultValue: "Class" })}:
            </span>
            <span className="font-semibold text-foreground text-right">
              {className} <span className="font-mono text-muted-foreground">({classCode})</span>
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              {t("attendanceCorrection.date", { defaultValue: "Attendance Date" })}:
            </span>
            <span className="font-mono font-bold text-foreground">{attendanceDate}</span>
          </div>

          {/* Status Change */}
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <span className="text-muted-foreground">
              {t("attendanceAuditLogs.changeOverview", { defaultValue: "Status Change" })}:
            </span>
            <AttendanceStatusChange previousStatus={previousStatus} newStatus={newStatus} size="sm" />
          </div>

          {/* Reason */}
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <span className="text-muted-foreground">
              {t("attendanceCorrection.reason", { defaultValue: "Reason" })}:
            </span>
            <span className="font-medium text-foreground text-right">
              {t(`correctionReasons.${reason}`, { defaultValue: reason })}
            </span>
          </div>

          {/* Notes if provided */}
          {notes && notes.trim().length > 0 && (
            <div className="space-y-1 pt-0.5">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
                {t("attendanceCorrection.notesLabel", { defaultValue: "Notes" })}:
              </span>
              <p className="p-2 rounded-lg bg-background border text-[11px] text-foreground font-sans break-words">
                {notes.trim()}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="text-xs"
          >
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2 text-xs"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{t("attendanceCorrection.saving", { defaultValue: "Saving..." })}</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>{t("attendanceCorrection.confirmAndSave", { defaultValue: "Confirm & Save Correction" })}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
