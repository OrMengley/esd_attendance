import React, { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { Attendance, AttendanceStatus } from "@/models/attendance.model";
import { CorrectionReason } from "@/models/attendance-audit-log.model";
import { Classroom } from "@/models/classroom.model";
import { Student } from "@/models/student.model";
import { Enrollment } from "@/models/enrollment.model";
import { User } from "@/models/user.model";
import { useAuth } from "@/contexts/auth-context";
import { attendanceCorrectionService } from "@/services/attendance-correction.service";
import { AttendanceCorrectionConfirmDialog } from "./attendance-correction-confirm-dialog";
import { AttendanceStatusChange } from "./attendance-status-change";
import { toast } from "sonner";
import {
  Edit3,
  Calendar,
  School,
  User as UserIcon,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AttendanceCorrectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Target record info
  attendanceDocId?: string;
  attendanceId?: string;
  classroomId: string;
  studentId: string;
  attendanceDate: string; // YYYY-MM-DD
  previousStatus?: AttendanceStatus | null;
  // Optional preloaded entities
  classroom?: Classroom;
  student?: Student;
  enrollment?: Enrollment;
  teacher?: User;
  onSuccess?: (updatedRecord?: Attendance) => void;
}

const CORRECTION_REASONS: CorrectionReason[] = [
  "teacher_wrong_status",
  "student_valid_explanation",
  "medical_reason",
  "system_data_entry_error",
  "other",
];

const ATTENDANCE_STATUSES: AttendanceStatus[] = [
  "present",
  "absent",
  "late",
  "permission",
];

export const AttendanceCorrectionDialog: React.FC<AttendanceCorrectionDialogProps> = ({
  open,
  onOpenChange,
  attendanceDocId,
  attendanceId,
  classroomId,
  studentId,
  attendanceDate,
  previousStatus,
  classroom,
  student,
  enrollment,
  teacher,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [newStatus, setNewStatus] = useState<AttendanceStatus | "">("");
  const [reason, setReason] = useState<CorrectionReason | "">("");
  const [notes, setNotes] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);

  // Confirmation modal step
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when opened
  useEffect(() => {
    if (open) {
      setNewStatus("");
      setReason("");
      setNotes("");
      setErrorText(null);
      setShowConfirm(false);
      setIsSaving(false);
    }
  }, [open, previousStatus]);

  const studentDisplayName = student?.nameKh || student?.nameEn || studentId;
  const studentCode = student?.studentCode || "—";
  const classDisplayName = classroom?.name || classroomId;
  const classCode = classroom?.code || "—";

  const handleReview = () => {
    setErrorText(null);

    if (!newStatus) {
      setErrorText(t("attendanceCorrection.selectNewStatus"));
      return;
    }

    if (previousStatus && newStatus === previousStatus) {
      setErrorText(t("attendanceCorrection.statusUnchangedError"));
      return;
    }

    if (!reason) {
      setErrorText(t("attendanceCorrection.selectReason"));
      return;
    }

    if (reason === "other" && notes.trim().length === 0) {
      setErrorText(t("attendanceCorrection.notesRequiredError"));
      return;
    }

    if (notes.trim().length > 500) {
      setErrorText(t("attendanceCorrection.notesTooLongError"));
      return;
    }

    setShowConfirm(true);
  };

  const handleExecuteSave = async () => {
    if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
      toast.error(t("common.error"));
      return;
    }
    if (!newStatus || !reason) return;

    setIsSaving(true);
    try {
      const result = await attendanceCorrectionService.correctAttendance({
        attendanceDocId: attendanceDocId || attendanceId,
        attendanceId: attendanceDocId || attendanceId,
        classroomId,
        studentId,
        attendanceDate,
        newStatus,
        reason,
        notes: notes.trim(),
        currentUser: user,
        classroom,
        student,
        enrollment,
        teacher,
      });

      toast.success(t("attendanceCorrection.success", { defaultValue: "Attendance corrected successfully" }));
      setShowConfirm(false);
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(result.attendance);
      }
    } catch (e: any) {
      console.error("Attendance correction failed:", e);
      let msg = t("attendanceCorrection.error", { defaultValue: "Failed to correct attendance" });
      if (e?.message === "STATUS_UNCHANGED") {
        msg = t("attendanceCorrection.statusUnchangedError");
      } else if (e?.message === "CORRECTION_VERIFICATION_FAILED") {
        msg = t("attendanceCorrection.verificationFailed", { defaultValue: "Verification failed: Firestore record status was not updated." });
      } else if (e?.message === "ATTENDANCE_NOT_FOUND") {
        msg = t("attendanceCorrection.notFound", { defaultValue: "Attendance record not found in database." });
      } else if (e?.message === "FUTURE_DATE") {
        msg = t("attendanceCorrection.cannotCorrectFuture");
      } else if (e?.message === "SCHOOL_HOLIDAY") {
        msg = t("attendanceCorrection.cannotCorrectHoliday");
      } else if (e?.message === "NOT_SCHEDULED_DAY") {
        msg = t("attendanceCorrection.cannotCorrectNotScheduled");
      } else if (e?.message === "STUDENT_NOT_ELIGIBLE" || e?.message === "BEFORE_ENROLLMENT_START") {
        msg = t("attendanceCorrection.cannotCorrectNotEnrolled");
      } else if (e?.message === "SESSION_NOT_ENDED_YET") {
        msg = t("attendanceCorrection.cannotCorrectSessionActive");
      } else if (e?.message) {
        msg = e.message;
      }
      toast.error(msg);
      setErrorText(msg);
      // Return to review/edit without closing dialog so admin can retry
      setShowConfirm(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Edit3 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold font-khmer">
                  {t("attendanceCorrection.title", { defaultValue: "Correct Attendance" })}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {t("attendanceCorrection.subtitle", {
                    defaultValue: "Administrative correction for locked or past attendance record",
                  })}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Target Record Info Card */}
          <div className="rounded-xl border bg-muted/20 p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <UserIcon className="h-3.5 w-3.5 text-primary" />
                {t("attendanceCorrection.student", { defaultValue: "Student" })}:
              </span>
              <span className="font-semibold text-foreground">
                {studentDisplayName} <span className="font-mono text-muted-foreground">({studentCode})</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <School className="h-3.5 w-3.5 text-primary" />
                {t("attendanceCorrection.class", { defaultValue: "Class" })}:
              </span>
              <span className="font-semibold text-foreground">
                {classDisplayName} <span className="font-mono text-muted-foreground">({classCode})</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                {t("attendanceCorrection.date", { defaultValue: "Attendance Date" })}:
              </span>
              <span className="font-mono font-bold text-foreground">{attendanceDate}</span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-border/60">
              <span className="text-muted-foreground">
                {t("attendanceCorrection.previousStatus", { defaultValue: "Previous Status" })}:
              </span>
              {previousStatus ? (
                <StatusBadge attendanceStatus={previousStatus} className="text-[11px]" />
              ) : (
                <span className="text-muted-foreground italic">
                  {t("attendanceCorrection.noRecord", { defaultValue: "No previous record" })}
                </span>
              )}
            </div>
          </div>

          {/* Form Controls */}
          <div className="space-y-4 my-2">
            {/* New Status */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                {t("attendanceCorrection.selectNewStatus", { defaultValue: "New Attendance Status" })} *
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ATTENDANCE_STATUSES.map((st) => {
                  const isSelected = newStatus === st;
                  const isOld = previousStatus === st;

                  return (
                    <button
                      key={st}
                      type="button"
                      disabled={isOld}
                      onClick={() => setNewStatus(st)}
                      className={cn(
                        "p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all",
                        isSelected
                          ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-2 ring-amber-500/30 font-bold"
                          : isOld
                          ? "opacity-40 cursor-not-allowed bg-muted/40 border-dashed"
                          : "bg-card border-border hover:bg-muted/30 text-foreground"
                      )}
                    >
                      <StatusBadge attendanceStatus={st} className="text-[10px] pointer-events-none" />
                      {isOld && (
                        <span className="text-[9px] text-muted-foreground">({t("attendanceCorrection.previousStatus", { defaultValue: "Current" })})</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reason Dropdown */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                {t("attendanceCorrection.selectReason", { defaultValue: "Correction Reason" })} *
              </Label>
              <Select value={reason} onValueChange={(val) => setReason(val as CorrectionReason)}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder={t("attendanceCorrection.selectReasonPlaceholder", { defaultValue: "Select a reason..." })} />
                </SelectTrigger>
                <SelectContent>
                  {CORRECTION_REASONS.map((r) => (
                    <SelectItem key={r} value={r} className="text-xs">
                      {t(`correctionReasons.${r}`, { defaultValue: r })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">
                  {t("attendanceCorrection.notes", { defaultValue: "Notes / Justification" })}
                  {reason === "other" && <span className="text-rose-500 ml-1">*</span>}
                </Label>
                <span className={cn("text-[10px]", notes.length > 500 ? "text-rose-600 font-bold" : "text-muted-foreground")}>
                  {notes.length} / 500 {t("attendanceCorrection.characters", { defaultValue: "characters" })}
                </span>
              </div>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder={t("attendanceCorrection.notesPlaceholder", {
                  defaultValue: "Explain the reason for this correction (maximum 500 characters)...",
                })}
                className="text-xs resize-none"
              />
              {reason === "other" && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  {t("attendanceCorrection.notesRequiredHint", { defaultValue: "Notes are required when selecting 'Other'" })}
                </p>
              )}
            </div>

            {/* Error banner */}
            {errorText && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorText}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              type="button"
              onClick={handleReview}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5 text-xs shadow-sm"
            >
              <span>{t("attendanceCorrection.proceedToConfirm", { defaultValue: "Review & Confirm" })}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Step Dialog */}
      {newStatus && reason && (
        <AttendanceCorrectionConfirmDialog
          open={showConfirm}
          onOpenChange={setShowConfirm}
          studentName={studentDisplayName}
          studentCode={studentCode}
          className={classDisplayName}
          classCode={classCode}
          attendanceDate={attendanceDate}
          previousStatus={previousStatus}
          newStatus={newStatus}
          reason={reason}
          notes={notes}
          isSaving={isSaving}
          onConfirm={handleExecuteSave}
        />
      )}
    </>
  );
};
