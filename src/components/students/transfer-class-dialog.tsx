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
import { Student } from "@/models/student.model";
import { Enrollment } from "@/models/enrollment.model";
import { Classroom } from "@/models/classroom.model";
import { StudyPackage } from "@/models/study-package.model";
import { User } from "@/models/user.model";
import { classroomService } from "@/services/classroom.service";
import { userService } from "@/services/user.service";
import { enrollmentService } from "@/services/enrollment.service";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  ArrowRightLeft,
  School,
  BookOpen,
  GraduationCap,
  Calendar,
  Clock,
  ChevronRight,
  Info,
  CheckCircle2,
  Search,
  Users,
  Check,
  AlertCircle,
} from "lucide-react";
import { formatKhmerDate } from "@/lib/utils";

interface TransferClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  activeEnrollment: Enrollment | null;
  activeClass: Classroom | null;
  activePackage: StudyPackage | null;
  activeTeacher: User | null;
  onSuccess?: () => void;
}

export const TransferClassDialog: React.FC<TransferClassDialogProps> = ({
  open,
  onOpenChange,
  student,
  activeEnrollment,
  activeClass,
  activePackage,
  activeTeacher,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Tomorrow's date as default effective date
  const getDefaultEffectiveDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const [availableClasses, setAvailableClasses] = useState<Classroom[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<string, number>>({});
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);

  const [selectedTargetClass, setSelectedTargetClass] = useState<Classroom | null>(null);
  const [targetTeacher, setTargetTeacher] = useState<User | null>(null);
  const [effectiveDate, setEffectiveDate] = useState<string>(getDefaultEffectiveDate());
  const [reason, setReason] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isClassPickerOpen, setIsClassPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedTargetClass(null);
      setTargetTeacher(null);
      setEffectiveDate(getDefaultEffectiveDate());
      setReason("");
      setSearchQuery("");
      loadCompatibleClasses();
    }
  }, [open]);

  const loadCompatibleClasses = async () => {
    if (!activeEnrollment || !activeClass) return;
    setIsLoadingClasses(true);
    try {
      const [allClasses, allTeachers, allEnrollments] = await Promise.all([
        classroomService.getClassrooms(),
        userService.getUsers(),
        enrollmentService.getEnrollments(),
      ]);

      // Only active classes with the SAME study package and NOT the current class
      const compatible = allClasses.filter(
        (c) =>
          c.status === "active" &&
          c.id !== activeClass.id &&
          c.packageId === activeEnrollment.packageId
      );

      // Counts per classroom
      const counts: Record<string, number> = {};
      allEnrollments.forEach((e) => {
        if (e.status === "active") {
          counts[e.classroomId] = (counts[e.classroomId] || 0) + 1;
        }
      });

      setAvailableClasses(compatible);
      setTeachers(allTeachers);
      setEnrollmentCounts(counts);
    } catch (e) {
      console.error("Failed to load compatible classes for transfer:", e);
      toast.error(t("transfer.fetchError", { defaultValue: "មិនអាចទាញយកទិន្នន័យថ្នាក់រៀនបានទេ" }));
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const handleSelectTargetClass = async (cls: Classroom) => {
    setSelectedTargetClass(cls);
    const tch = teachers.find((u) => u.id === cls.assignedTeacherId) || null;
    setTargetTeacher(tch);
    setIsClassPickerOpen(false);
  };

  const filteredTargetClasses = useMemo(() => {
    if (!searchQuery.trim()) return availableClasses;
    const q = searchQuery.toLowerCase().trim();
    return availableClasses.filter((cls) => {
      const matchCode = cls.code.toLowerCase().includes(q);
      const matchName = cls.name.toLowerCase().includes(q);
      const tch = teachers.find((u) => u.id === cls.assignedTeacherId);
      const matchTeacher = tch ? tch.name.toLowerCase().includes(q) : false;
      return matchCode || matchName || matchTeacher;
    });
  }, [availableClasses, searchQuery, teachers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !activeEnrollment || !activeClass) return;

    if (!selectedTargetClass) {
      toast.error(t("transfer.targetClassRequired", { defaultValue: "សូមជ្រើសរើសថ្នាក់រៀនថ្មី" }));
      return;
    }

    if (!effectiveDate) {
      toast.error(t("transfer.effectiveDateRequired", { defaultValue: "សូមជ្រើសរើសថ្ងៃចាប់ផ្តើមផ្ទេរ" }));
      return;
    }

    if (activeEnrollment.startDate && effectiveDate < activeEnrollment.startDate) {
      toast.error(
        t("transfer.dateBeforeStartDateError", {
          defaultValue: "ថ្ងៃផ្ទេរមិនអាចនៅមុនថ្ងៃចាប់ផ្តើមរៀននៃថ្នាក់ចាស់បានទេ",
        })
      );
      return;
    }

    if (!reason.trim()) {
      toast.error(t("transfer.reasonRequired", { defaultValue: "សូមបញ្ចូលមូលហេតុនៃការផ្ទេរ" }));
      return;
    }

    setIsSubmitting(true);
    try {
      await enrollmentService.transferEnrollment({
        sourceEnrollmentId: activeEnrollment.id,
        targetClassroomId: selectedTargetClass.id,
        effectiveDate,
        reason: reason.trim(),
        currentUserId: user?.id,
      });

      toast.success(t("transfer.success", { defaultValue: "ផ្ទេរថ្នាក់រៀនបានជោគជ័យ" }));
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("Transfer error:", err);
      if (err.message === "CLASS_CAPACITY_FULL") {
        toast.error(t("transfer.classFull", { defaultValue: "ថ្នាក់រៀនថ្មីពេញហើយ" }));
      } else if (err.message === "DIFFERENT_PACKAGE_TRANSFER") {
        toast.error(
          t("transfer.samePackageOnly", {
            defaultValue: "អាចផ្ទេរបានតែទៅថ្នាក់ដែលមានកញ្ចប់សិក្សាដូចគ្នាប៉ុណ្ណោះ",
          })
        );
      } else if (err.message === "SOURCE_ENROLLMENT_NOT_ACTIVE") {
        toast.error(t("transfer.notActiveError", { defaultValue: "ការចុះឈ្មោះនេះមិនសកម្មទៀតទេ" }));
      } else {
        toast.error(err.message || t("common.error"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!student || !activeEnrollment || !activeClass) return null;

  const activeDaysText = activeClass.scheduleDays.length === 5
    ? t("classes.mondayToFriday")
    : t("classes.saturdaySunday");

  const targetDaysText = selectedTargetClass
    ? selectedTargetClass.scheduleDays.length === 5
      ? t("classes.mondayToFriday")
      : t("classes.saturdaySunday")
    : "";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl lg:max-w-4xl w-[96vw] max-h-[90vh] flex flex-col p-5 sm:p-7 z-50 overflow-hidden rounded-2xl sm:rounded-3xl">
          <DialogHeader className="pb-4 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-purple-600/10 border border-purple-600/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                <ArrowRightLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold font-khmer">
                  {t("transfer.title", { defaultValue: "ផ្ទេរថ្នាក់រៀន" })}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm font-khmer text-muted-foreground mt-0.5">
                  {t("transfer.description", {
                    defaultValue: "ផ្ទេរសិស្សទៅថ្នាក់រៀនថ្មីដែលមានកញ្ចប់សិក្សាដូចគ្នា ដោយរក្សាទុកប្រវត្តិចុះឈ្មោះ និងវត្តមានចាស់។",
                  })}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden space-y-4 pt-2">
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Student Summary Card */}
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/70 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-10 w-10 ring-1 ring-border shrink-0">
                    <AvatarImage src={student.avatarUrl} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                      {student.nameKh.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground truncate">
                        {student.nameKh}
                      </span>
                      {student.nameEn && (
                        <span className="text-xs text-muted-foreground truncate">
                          ({student.nameEn})
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 font-mono">
                      <span className="font-semibold text-primary">{student.studentCode}</span>
                      <span>•</span>
                      <span>{student.phone || "-"}</span>
                    </div>
                  </div>
                </div>

                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[11px] font-khmer shrink-0">
                  {activePackage ? `${activePackage.code} - ${activePackage.nameKh}` : ""}
                </Badge>
              </div>

              {/* Source Class vs Target Class Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Source (Current) Class - Readonly */}
                <div className="p-4 rounded-2xl border border-border/80 bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border/50">
                    <span className="text-xs font-bold text-muted-foreground font-khmer flex items-center gap-1.5">
                      <School className="h-4 w-4 text-slate-500" />
                      <span>{t("transfer.currentClass", { defaultValue: "ថ្នាក់រៀនបច្ចុប្បន្ន (ចាស់)" })}</span>
                    </span>
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] py-0 px-2 font-khmer">
                      {t("enrollment.statusActive")}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="font-mono text-xs font-bold text-primary">{activeClass.code}</div>
                      <div className="font-bold text-sm text-foreground font-khmer">{activeClass.name}</div>
                    </div>

                    <div className="space-y-1.5 pt-1 text-muted-foreground">
                      <div className="flex items-center gap-1.5 truncate">
                        <GraduationCap className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span>{t("enrollment.teacher")}: {activeTeacher ? activeTeacher.name : "-"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <Clock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>{activeDaysText} ({activeClass.startTime} - {activeClass.endTime})</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <Calendar className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span>{t("enrollment.startDate")}: {formatKhmerDate(activeEnrollment.startDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Target Class Selector / Summary */}
                <div className="p-4 rounded-2xl border border-primary/40 bg-primary/5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-primary/20">
                    <span className="text-xs font-bold text-primary font-khmer flex items-center gap-1.5">
                      <ArrowRightLeft className="h-4 w-4 text-primary" />
                      <span>{t("transfer.targetClass", { defaultValue: "ថ្នាក់រៀនថ្មី (គោលដៅ)" })} *</span>
                    </span>
                    {selectedTargetClass && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsClassPickerOpen(true)}
                        className="h-6 text-[11px] text-primary font-khmer hover:bg-primary/20 px-2"
                      >
                        {t("classes.changeTeacher", { defaultValue: "ប្តូរថ្នាក់" })}
                      </Button>
                    )}
                  </div>

                  {selectedTargetClass ? (
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="font-mono text-xs font-bold text-primary">{selectedTargetClass.code}</div>
                        <div className="font-bold text-sm text-foreground font-khmer">{selectedTargetClass.name}</div>
                      </div>

                      <div className="space-y-1.5 pt-1 text-muted-foreground">
                        <div className="flex items-center gap-1.5 truncate">
                          <GraduationCap className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          <span>{t("enrollment.teacher")}: {targetTeacher ? targetTeacher.name : "-"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <Clock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>{targetDaysText} ({selectedTargetClass.startTime} - {selectedTargetClass.endTime})</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <Calendar className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span>{t("enrollment.expectedEndDate")}: {formatKhmerDate(selectedTargetClass.expectedEndDate)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsClassPickerOpen(true)}
                      className="w-full p-5 rounded-xl border border-dashed border-primary/40 hover:border-primary bg-background/60 hover:bg-background flex flex-col items-center justify-center text-center transition-all group min-h-[130px] space-y-2"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <School className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs sm:text-sm text-primary font-khmer">
                          {t("transfer.selectTargetClass", { defaultValue: "ចុចដើម្បីជ្រើសរើសថ្នាក់រៀនថ្មី" })}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-khmer mt-0.5">
                          {t("transfer.compatibleClassesCount", {
                            count: availableClasses.length,
                            defaultValue: `មាន ${availableClasses.length} ថ្នាក់សមស្រប`,
                          })}
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Effective Transfer Date & Transfer Reason */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold font-khmer">
                    {t("transfer.effectiveDate", { defaultValue: "ថ្ងៃចាប់ផ្តើមផ្ទេរ" })}{" "}
                    <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    min={activeEnrollment.startDate}
                    className="text-xs sm:text-sm h-10 bg-background"
                    required
                  />
                  <span className="text-[11px] text-muted-foreground font-khmer">
                    {t("transfer.effectiveDateHint", {
                      defaultValue: "វត្តមានមុនកាលបរិច្ឆេទនេះនៅថ្នាក់ចាស់ ចាប់ពីថ្ងៃនេះទៅនៅថ្នាក់ថ្មី",
                    })}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold font-khmer">
                    {t("transfer.reason", { defaultValue: "មូលហេតុនៃការផ្ទេរ" })}{" "}
                    <span className="text-rose-500">*</span>
                  </Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={t("transfer.reasonPlaceholder", {
                      defaultValue: "ឧ. សិស្សសុំប្តូរម៉ោងរៀនដោយសារជាប់ម៉ោងរៀននៅសាលា...",
                    })}
                    rows={2}
                    className="text-xs sm:text-sm bg-background resize-none"
                    required
                  />
                </div>
              </div>

              {/* Information Notice */}
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-2.5 text-xs text-purple-700 dark:text-purple-300 font-khmer">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  {t("transfer.ruleNotice", {
                    defaultValue: "ការផ្ទេរនឹងប្តូរស្ថានភាពការចុះឈ្មោះចាស់ទៅជា \"បានផ្ទេរ\" (Transferred) និងបង្កើតការចុះឈ្មោះថ្មីជា \"សកម្ម\" ដោយស្វ័យប្រវត្តិ។",
                  })}
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
                disabled={isSubmitting || !selectedTargetClass || !effectiveDate || !reason.trim()}
                className="text-xs font-khmer h-9 gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
              >
                {isSubmitting ? (
                  <span>{t("common.saving")}</span>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{t("transfer.confirmAction", { defaultValue: "បញ្ជាក់ការផ្ទេរថ្នាក់" })}</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Target Class Search & Selection Dialog */}
      <Dialog open={isClassPickerOpen} onOpenChange={setIsClassPickerOpen}>
        <DialogContent className="sm:max-w-4xl lg:max-w-5xl w-[96vw] max-h-[88vh] flex flex-col p-5 sm:p-7 z-[60] rounded-2xl sm:rounded-3xl">
          <DialogHeader className="pb-4 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-purple-600/10 border border-purple-600/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                <School className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold font-khmer">
                  {t("transfer.selectTargetClassTitle", { defaultValue: "ជ្រើសរើសថ្នាក់រៀនគោលដៅ" })}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm font-khmer text-muted-foreground mt-0.5">
                  {t("transfer.samePackageHint", {
                    defaultValue: `បង្ហាញតែថ្នាក់សកម្មក្នុងកញ្ចប់សិក្សា \"${activePackage?.nameKh || ""}\"`,
                  })}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="pt-2 pb-1">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("classes.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-xs sm:text-sm h-10 bg-background rounded-xl"
                autoFocus
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1 min-h-[300px]">
            {isLoadingClasses ? (
              <div className="space-y-3 py-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 bg-muted/40 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : filteredTargetClasses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
                  <AlertCircle className="w-7 h-7 text-amber-500" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm sm:text-base font-semibold text-foreground font-khmer">
                    {t("transfer.noCompatibleClass", {
                      defaultValue: "មិនមានថ្នាក់រៀនសមស្របសម្រាប់ផ្ទេរទេ",
                    })}
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-md font-khmer">
                    {t("transfer.noCompatibleClassDesc", {
                      defaultValue: "សូមបង្កើតថ្នាក់ថ្មីក្នុងកញ្ចប់សិក្សាដូចគ្នានេះជាមុនសិន។",
                    })}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTargetClasses.map((cls) => {
                  const isSelected = selectedTargetClass?.id === cls.id;
                  const enrolledCount = enrollmentCounts[cls.id] || 0;
                  const capacity = cls.capacity;
                  const isFull = capacity ? enrolledCount >= capacity : false;
                  const spotsLeft = capacity ? Math.max(0, capacity - enrolledCount) : null;
                  const tch = teachers.find((u) => u.id === cls.assignedTeacherId);
                  const isWeekday = cls.scheduleDays.length === 5;
                  const daysText = isWeekday
                    ? t("classes.mondayToFriday")
                    : t("classes.saturdaySunday");

                  return (
                    <div
                      key={cls.id}
                      onClick={() => {
                        if (!isFull) {
                          handleSelectTargetClass(cls);
                        }
                      }}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                        isSelected
                          ? "bg-purple-500/10 border-purple-500 ring-2 ring-purple-500/20 shadow-sm"
                          : isFull
                          ? "bg-muted/30 border-border/50 opacity-70 cursor-not-allowed"
                          : "bg-card hover:bg-muted/30 border-border/80 hover:border-purple-500/40 hover:shadow-xs cursor-pointer"
                      }`}
                    >
                      <div className="flex flex-col gap-3.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="font-mono font-bold text-xs bg-muted/80 text-foreground px-2.5 py-1 rounded-lg border border-border/60">
                              {cls.code}
                            </span>
                            <span className="font-bold text-sm sm:text-base text-foreground font-khmer">
                              {cls.name}
                            </span>
                            {isSelected && (
                              <Badge className="bg-purple-600 text-white text-[11px] py-0.5 px-2.5 gap-1 font-khmer">
                                <Check className="h-3.5 w-3.5" />
                                {t("common.selected", { defaultValue: "បានជ្រើសរើស" })}
                              </Badge>
                            )}
                            {isFull && (
                              <Badge variant="destructive" className="text-[11px] py-0.5 px-2.5 font-khmer">
                                {t("enrollment.full")}
                              </Badge>
                            )}
                          </div>

                          <div className="shrink-0 self-end sm:self-center">
                            <Button
                              type="button"
                              size="sm"
                              disabled={isFull}
                              variant={isSelected ? "default" : "outline"}
                              className="text-xs font-khmer h-8 sm:h-9 px-4 shadow-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isFull) {
                                  handleSelectTargetClass(cls);
                                }
                              }}
                            >
                              {isSelected
                                ? t("common.selected", { defaultValue: "បានជ្រើសរើស" })
                                : t("classes.selectAction")}
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/40 text-xs text-muted-foreground">
                          <div className="space-y-0.5 min-w-0">
                            <span className="text-[11px] font-semibold text-muted-foreground/80 font-khmer flex items-center gap-1.5">
                              <GraduationCap className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                              <span>{t("enrollment.teacher")}:</span>
                            </span>
                            <p className="font-medium text-foreground truncate pl-5">
                              {tch ? tch.name : "-"}
                            </p>
                          </div>

                          <div className="space-y-0.5 min-w-0">
                            <span className="text-[11px] font-semibold text-muted-foreground/80 font-khmer flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              <span>{t("enrollment.schedule")}:</span>
                            </span>
                            <p className="font-medium text-foreground truncate pl-5">
                              {daysText} ({cls.startTime} - {cls.endTime})
                            </p>
                          </div>

                          <div className="space-y-0.5 min-w-0">
                            <span className="text-[11px] font-semibold text-muted-foreground/80 font-khmer flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                              <span>{t("enrollment.expectedEndDate")}:</span>
                            </span>
                            <p className="font-medium text-foreground truncate pl-5">
                              {formatKhmerDate(cls.expectedEndDate)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="font-khmer">
                              {t("enrollment.enrolled")}:{" "}
                              <span className="font-bold text-foreground font-mono">{enrolledCount}</span>
                              {capacity ? (
                                <> / <span className="font-bold text-foreground font-mono">{capacity}</span> {t("classes.studentsUnit")}</>
                              ) : ` ${t("classes.studentsUnit")}`}
                            </span>
                          </div>

                          {capacity ? (
                            isFull ? (
                              <span className="text-xs font-bold text-rose-500 font-khmer bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                                {t("enrollment.full")}
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-khmer bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                {t("enrollment.spotsLeft", { count: spotsLeft })}
                              </span>
                            )
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
