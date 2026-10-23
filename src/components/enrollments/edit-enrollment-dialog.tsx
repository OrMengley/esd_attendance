import React, { useState, useEffect, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Student } from "@/models/student.model";
import { Enrollment } from "@/models/enrollment.model";
import { Classroom } from "@/models/classroom.model";
import { StudyPackage } from "@/models/study-package.model";
import { enrollmentService } from "@/services/enrollment.service";
import { attendanceService } from "@/services/attendance.service";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  Edit3,
  School,
  Calendar,
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Layers,
  Users,
} from "lucide-react";
import { formatKhmerDate } from "@/lib/utils";

interface EditEnrollmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enrollment: Enrollment | null;
  student: Student | null;
  classrooms: Classroom[];
  packages: StudyPackage[];
  onSuccess: () => void;
  onSwitchToTransfer?: (enrollment: Enrollment) => void;
}

export const EditEnrollmentDialog: React.FC<EditEnrollmentDialogProps> = ({
  open,
  onOpenChange,
  enrollment,
  student,
  classrooms,
  packages,
  onSuccess,
  onSwitchToTransfer,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [selectedClassId, setSelectedClassId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [expectedEndDate, setExpectedEndDate] = useState("");
  const [note, setNote] = useState("");

  const [hasAttendance, setHasAttendance] = useState(false);
  const [isCheckingAttendance, setIsCheckingAttendance] = useState(false);
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active classrooms available for selection
  const availableClasses = useMemo(() => {
    return classrooms.filter(
      (c) => c.status === "active" || c.id === enrollment?.classroomId
    );
  }, [classrooms, enrollment?.classroomId]);

  const currentSelectedClass = useMemo(() => {
    return classrooms.find((c) => c.id === selectedClassId) || null;
  }, [classrooms, selectedClassId]);

  const currentPackage = useMemo(() => {
    const pkgId = currentSelectedClass?.packageId || enrollment?.packageId;
    return packages.find((p) => p.id === pkgId) || null;
  }, [currentSelectedClass, enrollment?.packageId, packages]);

  // Check if class changed from original enrollment
  const isClassChanged = Boolean(
    enrollment && selectedClassId && selectedClassId !== enrollment.classroomId
  );

  useEffect(() => {
    if (open && enrollment) {
      setSelectedClassId(enrollment.classroomId);
      setStartDate(enrollment.startDate || "");
      setExpectedEndDate(enrollment.expectedEndDate || "");
      setNote(enrollment.note || "");
      setOverrideConfirmed(false);

      // Check attendance records asynchronously
      setIsCheckingAttendance(true);
      attendanceService
        .hasAttendanceRecords(enrollment.studentId, enrollment.classroomId)
        .then((recordsExist) => {
          setHasAttendance(recordsExist);
        })
        .catch((err) => {
          console.warn("Failed to check attendance records:", err);
          setHasAttendance(false);
        })
        .finally(() => {
          setIsCheckingAttendance(false);
        });
    } else {
      setSelectedClassId("");
      setStartDate("");
      setExpectedEndDate("");
      setNote("");
      setHasAttendance(false);
      setOverrideConfirmed(false);
    }
  }, [open, enrollment]);

  // Automatically adjust dates when picking a new class if empty
  const handleClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId);
    const target = classrooms.find((c) => c.id === newClassId);
    if (target) {
      if (target.startDate && !startDate) {
        setStartDate(target.startDate);
      }
      if (target.expectedEndDate && !expectedEndDate) {
        setExpectedEndDate(target.expectedEndDate);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollment || !selectedClassId || !startDate || !expectedEndDate) {
      toast.error(t("common.requiredFields", { defaultValue: "Please fill in all required fields" }));
      return;
    }

    if (isClassChanged && hasAttendance && !overrideConfirmed) {
      toast.error(
        t("enrollments.confirmOverrideAttendance", {
          defaultValue: "Please confirm understanding the attendance impact or use Transfer Class.",
        })
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const updates: Partial<Enrollment> = {
        classroomId: selectedClassId,
        startDate,
        expectedEndDate,
        note: note.trim(),
      };

      if (currentSelectedClass?.packageId) {
        updates.packageId = currentSelectedClass.packageId;
      }

      await enrollmentService.updateEnrollment(enrollment.id, updates, user);
      toast.success(t("enrollments.updateSuccess"));
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Failed to update enrollment:", err);
      if (err.message === "UNAUTHORIZED_BRANCH") {
        toast.error(t("common.unauthorizedBranch", { defaultValue: "មិនមានសិទ្ធិចាត់ចែងសាខានេះទេ (Unauthorized branch)" }));
      } else if (err.message === "CLASS_CAPACITY_FULL") {
        toast.error(t("enrollments.capacityFullError"));
      } else if (err.message === "CLASSROOM_NOT_ACTIVE") {
        toast.error(t("classroom.notActive", { defaultValue: "Target class is not active" }));
      } else {
        toast.error(t("common.errorOccurred", { defaultValue: "Failed to update enrollment" }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {t("enrollments.editEnrollment")}
              </DialogTitle>
              <DialogDescription>
                {t("enrollments.editEnrollmentDesc")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {student && (
          <div className="flex items-center gap-4 p-3.5 rounded-xl bg-muted/40 border">
            <Avatar className="h-12 w-12 border-2 border-background shadow-xs">
              <AvatarImage src={student.avatarUrl} alt={student.nameKh} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {student.nameKh.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base truncate">
                  {student.nameKh}
                </span>
                {student.nameEn && (
                  <span className="text-xs text-muted-foreground truncate">
                    ({student.nameEn})
                  </span>
                )}
                <Badge variant="outline" className="font-mono text-xs">
                  {student.studentCode}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
                {student.phone && <span>{student.phone}</span>}
                {student.gender && (
                  <span>
                    {student.gender === "female"
                      ? t("student.genderFemale", { defaultValue: "ស្រី" })
                      : t("student.genderMale", { defaultValue: "ប្រុស" })}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Classroom Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 font-medium">
              <School className="h-4 w-4 text-muted-foreground" />
              {t("enrollments.changeClass")} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedClassId}
              onValueChange={handleClassChange}
              disabled={isSubmitting}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("enrollments.filterByClass")} />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {availableClasses.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    <div className="flex items-center justify-between gap-4 py-0.5 w-full">
                      <span className="font-medium">{cls.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {cls.code} • {cls.startTime} - {cls.endTime}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {currentSelectedClass && (
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/30 border text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {currentSelectedClass.startTime} - {currentSelectedClass.endTime}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  <span className="truncate">
                    {currentPackage?.nameKh || currentPackage?.nameEn || "Standard Course"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Attendance Safety Warning */}
          {isClassChanged && hasAttendance && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-amber-900 dark:text-amber-200 text-sm">
                    {t("enrollments.hasAttendanceWarning")}
                  </p>
                  <p className="text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                    Directly changing the classroom is suitable for immediate clerical errors. If the student has already attended sessions, use Transfer Class to ensure accurate historical logs.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-amber-500/20">
                {onSwitchToTransfer && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 border-amber-500/30 gap-1.5 text-xs font-medium"
                    onClick={() => {
                      onOpenChange(false);
                      onSwitchToTransfer(enrollment!);
                    }}
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                    {t("enrollments.transferInstead")}
                  </Button>
                )}

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-amber-950 dark:text-amber-200">
                  <Checkbox
                    checked={overrideConfirmed}
                    onCheckedChange={(checked) => setOverrideConfirmed(Boolean(checked))}
                  />
                  <span>{t("enrollments.confirmOverrideAttendance")}</span>
                </label>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center gap-1.5 font-medium">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {t("enrollments.startDate")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedEndDate" className="flex items-center gap-1.5 font-medium">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {t("enrollments.expectedEndDate")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="expectedEndDate"
                type="date"
                value={expectedEndDate}
                onChange={(e) => setExpectedEndDate(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note" className="font-medium">
              {t("enrollments.note")}
            </Label>
            <Textarea
              id="note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Corrected mistaken class batch; rescheduled per student request..."
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !selectedClassId ||
                !startDate ||
                !expectedEndDate ||
                (isClassChanged && hasAttendance && !overrideConfirmed)
              }
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSubmitting ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
