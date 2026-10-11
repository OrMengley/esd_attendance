import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Classroom, ClassroomStatus } from "@/models/classroom.model";
import { StudyPackage } from "@/models/study-package.model";
import { User } from "@/models/user.model";
import { SchoolHoliday } from "@/models/school-holiday.model";
import { schoolHolidayService } from "@/services/school-holiday.service";
import {
  calculateSessionMinutes,
  calculateHoursPerWeek,
  calculateExpectedEndDate,
  WEEKDAY_DAYS,
  WEEKEND_DAYS,
  getScheduleType,
} from "@/lib/classroom-schedule";
import { toast } from "sonner";
import {
  School,
  BookOpen,
  GraduationCap,
  Calendar,
  Clock,
  Users,
  Sparkles,
  Info,
} from "lucide-react";

interface ClassroomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classroomToEdit?: Classroom | null;
  studyPackages: StudyPackage[];
  teachers: User[];
  onSubmit: (data: Omit<Classroom, "id" | "createdAt" | "updatedAt">) => Promise<void>;
}

export const ClassroomDialog: React.FC<ClassroomDialogProps> = ({
  open,
  onOpenChange,
  classroomToEdit,
  studyPackages,
  teachers,
  onSubmit,
}) => {
  const { t } = useTranslation();

  const [activeHolidays, setActiveHolidays] = useState<SchoolHoliday[]>([]);

  useEffect(() => {
    let isMounted = true;
    schoolHolidayService.getActiveSchoolHolidays().then((holidays) => {
      if (isMounted) setActiveHolidays(holidays);
    }).catch(console.error);
    return () => {
      isMounted = false;
    };
  }, []);

  // Active packages and teachers
  const activePackages = useMemo(
    () => studyPackages.filter((p) => p.status === "active" || p.id === classroomToEdit?.packageId),
    [studyPackages, classroomToEdit]
  );

  const activeTeachers = useMemo(
    () =>
      teachers.filter(
        (u) =>
          u.role === "teacher" &&
          (u.status === "active" || u.id === classroomToEdit?.assignedTeacherId)
      ),
    [teachers, classroomToEdit]
  );

  // Form states
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [packageId, setPackageId] = useState("");
  const [assignedTeacherId, setAssignedTeacherId] = useState("");
  const [scheduleType, setScheduleType] = useState<"weekday" | "weekend">("weekday");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("08:00");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [capacity, setCapacity] = useState<number | string>("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<ClassroomStatus>("active");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state on open / classroomToEdit change
  useEffect(() => {
    if (classroomToEdit) {
      setCode(classroomToEdit.code || "");
      setName(classroomToEdit.name || "");
      setPackageId(classroomToEdit.packageId || "");
      setAssignedTeacherId(classroomToEdit.assignedTeacherId || "");

      const sType = getScheduleType(classroomToEdit.scheduleDays);
      setScheduleType(sType === "weekend" ? "weekend" : "weekday");

      setStartTime(classroomToEdit.startTime || "07:00");
      setEndTime(classroomToEdit.endTime || "08:00");
      setStartDate(classroomToEdit.startDate || new Date().toISOString().split("T")[0]);
      setCapacity(classroomToEdit.capacity ?? "");
      setNote(classroomToEdit.note || "");
      setStatus(classroomToEdit.status || "active");
    } else {
      // Default new classroom
      setCode("");
      setName("");
      setPackageId(activePackages[0]?.id || "");
      setAssignedTeacherId(activeTeachers[0]?.id || "");
      setScheduleType("weekday");
      setStartTime("07:00");
      setEndTime("08:00");
      setStartDate(new Date().toISOString().split("T")[0]);
      setCapacity("");
      setNote("");
      setStatus("active");
    }
  }, [classroomToEdit, open, activePackages, activeTeachers]);

  // Handle schedule type change
  const handleScheduleTypeChange = (type: "weekday" | "weekend") => {
    setScheduleType(type);
    if (type === "weekday") {
      setStartTime("07:00");
      setEndTime("08:00");
    } else {
      setStartTime("07:00");
      setEndTime("09:00");
    }
  };

  const scheduleDays = useMemo(
    () => (scheduleType === "weekday" ? WEEKDAY_DAYS : WEEKEND_DAYS),
    [scheduleType]
  );

  const selectedPackage = useMemo(
    () => studyPackages.find((p) => p.id === packageId),
    [studyPackages, packageId]
  );

  const sessionMinutes = useMemo(
    () => calculateSessionMinutes(startTime, endTime),
    [startTime, endTime]
  );

  const hoursPerWeek = useMemo(
    () => calculateHoursPerWeek(scheduleDays, sessionMinutes),
    [scheduleDays, sessionMinutes]
  );

  const calculatedExpectedEndDate = useMemo(() => {
    const plannedHours = selectedPackage?.totalPlannedHours || 40;
    return calculateExpectedEndDate(startDate, plannedHours, scheduleDays, sessionMinutes, activeHolidays);
  }, [startDate, selectedPackage, scheduleDays, sessionMinutes, activeHolidays]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();

    if (!cleanCode) {
      toast.error(t("classes.codeRequired"));
      return;
    }
    if (!cleanName) {
      toast.error(t("classes.nameRequired"));
      return;
    }
    if (!packageId) {
      toast.error(t("classes.packageRequired"));
      return;
    }
    if (!assignedTeacherId) {
      toast.error(t("classes.teacherRequired"));
      return;
    }
    if (!startDate) {
      toast.error(t("classes.startDateRequired"));
      return;
    }

    if (sessionMinutes <= 0) {
      toast.error(t("classes.endTimeAfterStartTimeError"));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        code: cleanCode,
        name: cleanName,
        packageId,
        assignedTeacherId,
        scheduleDays,
        startTime,
        endTime,
        sessionMinutes,
        hoursPerWeek,
        startDate,
        expectedEndDate: calculatedExpectedEndDate,
        capacity: capacity === "" ? undefined : Number(capacity),
        note: note.trim(),
        status,
      });
      onOpenChange(false);
    } catch (error: any) {
      if (error?.message === "CLASS_CODE_EXISTS") {
        toast.error(t("classes.codeExistsError"));
      } else {
        toast.error(t("classes.saveError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <School className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold font-khmer">
                {classroomToEdit ? t("classes.editClass") : t("classes.addClass")}
              </DialogTitle>
              <DialogDescription className="text-xs font-khmer text-muted-foreground">
                {t("classes.dialogDesc")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 py-3 pr-1">
          {/* Section 1: Code & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="class-code" className="text-xs font-khmer">
                {t("classes.code")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="class-code"
                placeholder={t("classes.codePlaceholder")}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="font-mono text-xs uppercase"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="class-name" className="text-xs font-khmer">
                {t("classes.name")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="class-name"
                placeholder={t("classes.namePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs font-khmer"
                required
              />
            </div>
          </div>

          {/* Section 2: Study Package & Assigned Teacher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="class-package" className="text-xs font-khmer">
                {t("classes.package")} <span className="text-destructive">*</span>
              </Label>
              <Select value={packageId} onValueChange={setPackageId}>
                <SelectTrigger id="class-package" className="text-xs font-khmer">
                  <SelectValue placeholder={t("classes.selectPackage")} />
                </SelectTrigger>
                <SelectContent>
                  {activePackages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id} className="text-xs font-khmer">
                      {pkg.nameKh} ({pkg.totalPlannedHours} {t("classes.hoursUnit")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="class-teacher" className="text-xs font-khmer">
                {t("classes.teacher")} <span className="text-destructive">*</span>
              </Label>
              <Select value={assignedTeacherId} onValueChange={setAssignedTeacherId}>
                <SelectTrigger id="class-teacher" className="text-xs">
                  <SelectValue placeholder={t("classes.selectTeacher")} />
                </SelectTrigger>
                <SelectContent>
                  {activeTeachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id} className="text-xs">
                      {teacher.name} (@{teacher.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Section 3: Schedule Type & Learning Days */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-khmer">
                  {t("classes.scheduleType")} <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={scheduleType === "weekday" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleScheduleTypeChange("weekday")}
                    className="text-xs font-khmer h-9"
                  >
                    {t("classes.weekday")}
                  </Button>
                  <Button
                    type="button"
                    variant={scheduleType === "weekend" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleScheduleTypeChange("weekend")}
                    className="text-xs font-khmer h-9"
                  >
                    {t("classes.weekend")}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-khmer text-muted-foreground">
                  {t("classes.learningDays")} (Auto)
                </Label>
                <div className="h-9 px-3 rounded-md bg-background border border-border/80 flex items-center text-xs font-khmer text-foreground">
                  <Calendar className="h-3.5 w-3.5 text-primary mr-2" />
                  <span>
                    {scheduleType === "weekday"
                      ? t("classes.mondayToFriday") + " (Mon - Fri)"
                      : t("classes.saturdaySunday") + " (Sat - Sun)"}
                  </span>
                </div>
              </div>
            </div>

            {/* Session Times */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="start-time" className="text-xs font-khmer">
                  {t("classes.startTime")} <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="pl-8 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="end-time" className="text-xs font-khmer">
                  {t("classes.endTime")} <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="pl-8 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-khmer text-muted-foreground">
                  {t("classes.sessionDuration")}
                </Label>
                <div className="h-9 px-3 rounded-md bg-background border border-border/80 flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    {sessionMinutes} {t("classes.sessionMinutes")}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {hoursPerWeek} {t("classes.hoursPerWeek")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Start Date & Auto Calculated Expected End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="start-date" className="text-xs font-khmer">
                {t("classes.startDate")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-khmer flex items-center gap-1.5 text-primary font-bold">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  {t("classes.expectedEndDate")}
                </Label>
                <span className="text-[10px] text-muted-foreground font-khmer">
                  ({selectedPackage?.totalPlannedHours || 40} {t("classes.hoursUnit")})
                </span>
              </div>
              <div className="h-9 px-3 rounded-md bg-primary/5 border border-primary/20 flex items-center justify-between text-xs font-mono font-bold text-primary">
                <span>{calculatedExpectedEndDate || "-"}</span>
                <span className="text-[10px] font-sans font-normal px-2 py-0.5 rounded bg-primary/10 text-primary">
                  Auto
                </span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground font-khmer flex items-start gap-1.5 bg-muted/30 p-2.5 rounded-lg border border-border/40">
            <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            <span>{t("classes.endDateCalculatedHint")}</span>
          </div>

          {/* Section 5: Capacity & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="class-capacity" className="text-xs font-khmer">
                {t("classes.capacity")}
              </Label>
              <div className="relative">
                <Users className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  id="class-capacity"
                  type="number"
                  min={1}
                  placeholder={t("classes.capacityPlaceholder")}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="pl-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="class-status" className="text-xs font-khmer">
                {t("classes.status")}
              </Label>
              <Select
                value={status}
                onValueChange={(val: ClassroomStatus) => setStatus(val)}
              >
                <SelectTrigger id="class-status" className="text-xs font-khmer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active" className="text-xs font-khmer">
                    {t("classes.activeStatus")}
                  </SelectItem>
                  <SelectItem value="completed" className="text-xs font-khmer">
                    {t("classes.completedStatus")}
                  </SelectItem>
                  <SelectItem value="inactive" className="text-xs font-khmer">
                    {t("classes.inactiveStatus")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Section 6: Note */}
          <div className="space-y-1.5">
            <Label htmlFor="class-note" className="text-xs font-khmer">
              {t("classes.note")}
            </Label>
            <Textarea
              id="class-note"
              placeholder={t("classes.notePlaceholder")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="text-xs font-khmer min-h-[60px]"
            />
          </div>

          <DialogFooter className="gap-2 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-xs font-khmer"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              variant="gradient"
              disabled={isSubmitting}
              className="text-xs font-khmer shadow-sm"
            >
              {isSubmitting ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
