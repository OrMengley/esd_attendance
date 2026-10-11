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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ClassSelectionDialog } from "./class-selection-dialog";
import { Student } from "@/models/student.model";
import { Classroom } from "@/models/classroom.model";
import { StudyPackage } from "@/models/study-package.model";
import { User } from "@/models/user.model";
import { Enrollment } from "@/models/enrollment.model";
import { enrollmentService } from "@/services/enrollment.service";
import { studyPackageService } from "@/services/study-package.service";
import { userService } from "@/services/user.service";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  UserPlus,
  School,
  BookOpen,
  GraduationCap,
  Calendar,
  Clock,
  ChevronRight,
  Info,
  CheckCircle2,
} from "lucide-react";
import { formatKhmerDate } from "@/lib/utils";

interface EnrollmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  onSuccess?: (enrollment: Enrollment) => void;
}

export const EnrollmentDialog: React.FC<EnrollmentDialogProps> = ({
  open,
  onOpenChange,
  student,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [selectedClass, setSelectedClass] = useState<Classroom | null>(null);
  const [studyPackage, setStudyPackage] = useState<StudyPackage | null>(null);
  const [teacher, setTeacher] = useState<User | null>(null);
  const [startDate, setStartDate] = useState("");
  const [note, setNote] = useState("");
  const [isClassPickerOpen, setIsClassPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when opening dialog
  useEffect(() => {
    if (open) {
      setSelectedClass(null);
      setStudyPackage(null);
      setTeacher(null);
      setStartDate("");
      setNote("");
    }
  }, [open]);

  // When class is selected, fetch associated package and teacher, and set default startDate
  const handleClassSelected = async (classroom: Classroom) => {
    setSelectedClass(classroom);
    setStartDate(classroom.startDate || new Date().toISOString().split("T")[0]);

    try {
      const [pkg, usr] = await Promise.all([
        studyPackageService.getStudyPackageById(classroom.packageId),
        userService.getUserById(classroom.assignedTeacherId),
      ]);
      setStudyPackage(pkg);
      setTeacher(usr);
    } catch (e) {
      console.error("Failed to load class details:", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    if (!selectedClass) {
      toast.error(t("enrollment.classroomRequired"));
      return;
    }

    if (!startDate) {
      toast.error(t("enrollment.startDateRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      const newEnrollment = await enrollmentService.createEnrollment(
        {
          studentId: student.id,
          classroomId: selectedClass.id,
          packageId: selectedClass.packageId,
          startDate,
          expectedEndDate: selectedClass.expectedEndDate,
          status: "active",
          note: note.trim(),
        },
        user?.id
      );

      toast.success(t("enrollment.created"));
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(newEnrollment);
      }
    } catch (err: any) {
      console.error("Enrollment failed:", err);
      if (err.message === "ACTIVE_ENROLLMENT_EXISTS") {
        toast.error(t("enrollment.activeExists"));
      } else if (err.message === "CLASS_CAPACITY_FULL") {
        toast.error(t("enrollment.classFull"));
      } else if (err.message === "CLASSROOM_NOT_ACTIVE") {
        toast.error(t("enrollment.classNotActive"));
      } else {
        toast.error(err.message || t("common.error"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!student) return null;

  const isWeekday = selectedClass ? selectedClass.scheduleDays.length === 5 : false;
  const daysText = isWeekday
    ? t("classes.mondayToFriday")
    : t("classes.saturdaySunday");

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl lg:max-w-3xl w-[95vw] max-h-[90vh] flex flex-col p-5 sm:p-7 z-50 overflow-hidden rounded-2xl sm:rounded-3xl">
          <DialogHeader className="pb-4 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary dark:text-blue-400 shrink-0">
                <UserPlus className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold font-khmer">
                  {t("enrollment.enrollInClass")}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm font-khmer text-muted-foreground mt-0.5">
                  {t("enrollment.dialogDesc")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden space-y-4 pt-2">
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Student Summary Card */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold font-khmer">
                  {t("enrollment.selectedStudent")}
                </Label>
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 flex items-center gap-3">
                  <Avatar className="h-11 w-11 ring-1 ring-border shrink-0">
                    <AvatarImage src={student.avatarUrl} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
                      {student.nameKh.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">
                        {student.nameKh}
                      </span>
                      {student.nameEn && (
                        <span className="text-xs text-muted-foreground">
                          ({student.nameEn})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="font-mono font-semibold text-primary">
                        {student.studentCode}
                      </span>
                      <span>•</span>
                      <span>
                        {student.gender === "female"
                          ? t("gender.female")
                          : t("gender.male")}
                      </span>
                      {student.phone && (
                        <>
                          <span>•</span>
                          <span className="font-mono">{student.phone}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Class Selection Section */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold font-khmer flex items-center justify-between">
                  <span>
                    {t("enrollment.selectClass")}{" "}
                    <span className="text-rose-500">*</span>
                  </span>
                </Label>

                {selectedClass ? (
                  <div
                    onClick={() => setIsClassPickerOpen(true)}
                    className="p-3 rounded-xl border border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-md">
                          {selectedClass.code}
                        </span>
                        <span className="font-bold text-sm text-foreground">
                          {selectedClass.name}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-primary font-khmer hover:bg-primary/20"
                      >
                        {t("classes.changeTeacher", { defaultValue: "ប្តូរថ្នាក់" })}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground pt-1 border-t border-border/40">
                      <div className="flex items-center gap-1.5 truncate">
                        <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate">
                          {studyPackage ? `${studyPackage.code} - ${studyPackage.nameKh}` : "-"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <GraduationCap className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">
                          {teacher ? teacher.name : "-"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <Clock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>
                          {daysText} ({selectedClass.startTime} - {selectedClass.endTime})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <Calendar className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span>
                          {formatKhmerDate(selectedClass.startDate)} → {formatKhmerDate(selectedClass.expectedEndDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsClassPickerOpen(true)}
                    className="w-full p-4 rounded-xl border border-dashed border-border hover:border-primary/50 bg-card hover:bg-muted/30 flex items-center justify-between text-left transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                        <School className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs sm:text-sm text-foreground font-khmer">
                          {t("enrollment.selectClassPlaceholder")}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-khmer">
                          {t("enrollment.dialogDesc")}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                  </button>
                )}
              </div>

              {/* Start Date & Expected End Date */}
              {selectedClass && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold font-khmer">
                      {t("enrollment.startDate")}{" "}
                      <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="text-xs sm:text-sm h-9 bg-background"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold font-khmer">
                      {t("enrollment.expectedEndDate")} (
                      {t("common.optional", { defaultValue: "ស្វ័យប្រវត្តិ" })})
                    </Label>
                    <Input
                      type="date"
                      value={selectedClass.expectedEndDate}
                      readOnly
                      disabled
                      className="text-xs sm:text-sm h-9 bg-muted/60 text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                </div>
              )}

              {/* Note */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold font-khmer">
                  {t("enrollment.note")} ({t("common.optional")})
                </Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("enrollment.notePlaceholder")}
                  rows={2}
                  className="text-xs sm:text-sm bg-background resize-none"
                />
              </div>

              {/* Information hint */}
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-2.5 text-xs text-blue-600 dark:text-blue-400 font-khmer">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  {t(
                    "classes.endDateCalculatedHint",
                    "កាលបរិច្ឆេទបញ្ចប់រំពឹងទុកត្រូវបានកំណត់ដោយស្វ័យប្រវត្តិតាមកាលវិភាគថ្នាក់រៀន។"
                  )}
                </span>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-border/60 flex flex-row items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="text-xs font-khmer h-9"
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !selectedClass || !startDate}
                className="text-xs font-khmer h-9 gap-1.5"
              >
                {isSubmitting ? (
                  <span>{t("common.saving")}</span>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{t("enrollment.enrollInClass")}</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Class Selection Dialog */}
      <ClassSelectionDialog
        open={isClassPickerOpen}
        onOpenChange={setIsClassPickerOpen}
        selectedClassroomId={selectedClass?.id}
        onSelect={handleClassSelected}
      />
    </>
  );
};
