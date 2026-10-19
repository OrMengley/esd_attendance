import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TeacherSelectionDialog } from "@/components/classes/teacher-selection-dialog";
import { classroomService } from "@/services/classroom.service";
import { studyPackageService } from "@/services/study-package.service";
import { userService } from "@/services/user.service";
import { schoolHolidayService } from "@/services/school-holiday.service";
import { branchService } from "@/services/branch.service";
import { Classroom, ClassroomStatus } from "@/models/classroom.model";
import { StudyPackage } from "@/models/study-package.model";
import { User } from "@/models/user.model";
import { SchoolHoliday } from "@/models/school-holiday.model";
import { Branch } from "@/models/branch.model";
import {
  calculateSessionMinutes,
  calculateHoursPerWeek,
  calculateExpectedEndDate,
  WEEKDAY_DAYS,
  WEEKEND_DAYS,
  getScheduleType,
} from "@/lib/classroom-schedule";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  School,
  GraduationCap,
  Calendar,
  Clock,
  Sparkles,
  Info,
  Users,
  FileText,
  Check,
  UserCheck,
  Plus,
} from "lucide-react";

interface ClassroomFormPageProps {
  mode?: "create" | "edit";
}

export const ClassroomFormPage: React.FC<ClassroomFormPageProps> = ({ mode: explicitMode }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { currentBranchId } = useBranch();

  const isEditMode = explicitMode ? explicitMode === "edit" : Boolean(id);

  // Data states
  const [studyPackages, setStudyPackages] = useState<StudyPackage[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeHolidays, setActiveHolidays] = useState<SchoolHoliday[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [packageId, setPackageId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [assignedTeacherId, setAssignedTeacherId] = useState("");
  const [scheduleType, setScheduleType] = useState<"weekday" | "weekend">("weekday");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("08:00");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [capacity, setCapacity] = useState<number | string>("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<ClassroomStatus>("active");

  // Teacher modal state
  const [isTeacherDialogOpen, setIsTeacherDialogOpen] = useState(false);

  // Load initial data
  const loadInitial = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [pkgs, usrs, holidays, brList] = await Promise.all([
        studyPackageService.getStudyPackages(),
        userService.getTeachers(),
        schoolHolidayService.getActiveSchoolHolidays(),
        branchService.getActiveBranches(),
      ]);

      let userBranches = brList;
      if (user?.role !== "super_admin") {
        userBranches = brList.filter((b) => b.id === user?.branchId);
        if (userBranches.length === 0 && user?.branchId) {
          const singleBranch = await branchService.getBranchById(user.branchId);
          if (singleBranch) {
            userBranches = [singleBranch];
          }
        }
      }

      setStudyPackages(pkgs);
      setTeachers(usrs);
      setActiveHolidays(holidays);
      setBranches(userBranches);

      if (isEditMode && id) {
        const existingClass = await classroomService.getClassroomById(id);
        if (existingClass) {
          setCode(existingClass.code || "");
          setName(existingClass.name || "");
          setPackageId(existingClass.packageId || "");
          setBranchId(existingClass.branchId || (user?.role !== "super_admin" ? (user?.branchId || "") : ""));
          setAssignedTeacherId(existingClass.assignedTeacherId || "");

          const sType = getScheduleType(existingClass.scheduleDays);
          setScheduleType(sType === "weekend" ? "weekend" : "weekday");

          setStartTime(existingClass.startTime || "07:00");
          setEndTime(existingClass.endTime || "08:00");
          setStartDate(existingClass.startDate || new Date().toISOString().split("T")[0]);
          setCapacity(existingClass.capacity ?? "");
          setNote(existingClass.note || "");
          setStatus(existingClass.status || "active");
        } else {
          toast.error(t("classes.classroomNotFound"));
          navigate("/classes");
        }
      } else {
        // Create mode defaults
        const defaultPkg = pkgs.find((p) => p.status === "active") || pkgs[0];
        if (defaultPkg) setPackageId(defaultPkg.id);

        const targetBranchId = user?.role !== "super_admin"
          ? (user?.branchId || "")
          : (currentBranchId && currentBranchId !== "all" ? currentBranchId : (userBranches[0]?.id || ""));

        if (targetBranchId) setBranchId(targetBranchId);

        const availableTeachers = targetBranchId
          ? usrs.filter((u) => !u.branchId || u.branchId === targetBranchId)
          : usrs;

        const defaultTeacher = availableTeachers.find((u) => u.status === "active") || usrs.find((u) => u.status === "active") || usrs[0];
        if (defaultTeacher) setAssignedTeacherId(defaultTeacher.id);
      }
    } catch (err) {
      console.error(err);
      toast.error(t("classes.fetchError"));
    } finally {
      setIsLoadingData(false);
    }
  }, [isEditMode, id, navigate, t, user, currentBranchId]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // Handle schedule type switch
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

  const selectedTeacher = useMemo(
    () => teachers.find((u) => u.id === assignedTeacherId),
    [teachers, assignedTeacherId]
  );

  const selectableTeachers = useMemo(() => {
    const targetBranch = branchId || (user?.role !== "super_admin" ? user?.branchId : undefined);
    if (!targetBranch) return teachers;
    return teachers.filter((t) => !t.branchId || t.branchId === targetBranch);
  }, [teachers, branchId, user]);

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
      const payload: Omit<Classroom, "id" | "createdAt" | "updatedAt"> = {
        code: cleanCode,
        name: cleanName,
        packageId,
        branchId: branchId || undefined,
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
      };

      if (isEditMode && id) {
        await classroomService.updateClassroom(id, payload, user?.id);
        toast.success(t("classes.updateSuccess"));
      } else {
        await classroomService.createClassroom(payload, user?.id);
        toast.success(t("classes.saveSuccess"));
      }

      navigate("/classes");
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

  if (isLoadingData) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-4">
        <div className="h-10 w-48 bg-muted/50 rounded-lg animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-card rounded-2xl border animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => navigate("/classes")}
            className="h-10 w-10 rounded-xl hover:bg-muted shrink-0"
            title={t("classes.backToClasses")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-khmer text-foreground tracking-tight">
              {isEditMode ? t("classes.editClassTitle") : t("classes.createClassTitle")}
            </h1>
            <p className="text-xs text-muted-foreground font-khmer mt-0.5">
              {t("classes.dialogDesc")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/classes")}
            disabled={isSubmitting}
            className="text-xs font-khmer"
          >
            {t("common.cancel")}
          </Button>

          <Button
            type="submit"
            form="classroom-form"
            variant="gradient"
            disabled={isSubmitting}
            className="gap-2 shadow-sm text-xs font-khmer"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? t("common.loading") : t("common.save")}
          </Button>
        </div>
      </div>

      {/* Main Form */}
      <form id="classroom-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Information */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base font-bold font-khmer flex items-center gap-2">
              <School className="h-4 w-4 text-primary" />
              {t("classes.basicInfo")}
            </CardTitle>
            <CardDescription className="text-xs font-khmer">
              {t("classes.dialogDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="class-package" className="text-xs font-khmer">
                  {t("classes.package")} <span className="text-destructive">*</span>
                </Label>
                <Select value={packageId} onValueChange={setPackageId}>
                  <SelectTrigger id="class-package" className="text-xs font-khmer">
                    <SelectValue placeholder={t("classes.selectPackage")} />
                  </SelectTrigger>
                  <SelectContent>
                    {studyPackages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id} className="text-xs font-khmer">
                        {pkg.nameKh} ({pkg.totalPlannedHours} {t("classes.hoursUnit")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {user?.role == "super_admin" &&
                <div className="space-y-1.5">
                  <Label htmlFor="class-branch" className="text-xs font-khmer">
                    {t("branches.branch")}
                  </Label>
                  <Select
                    value={branchId || "none"}
                    onValueChange={(val) => setBranchId(val === "none" ? "" : val)}
                    disabled={user?.role !== "super_admin"}
                  >
                    <SelectTrigger id="class-branch" className="text-xs font-khmer">
                      <SelectValue placeholder={t("branches.selectBranchPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {user?.role === "super_admin" && (
                        <SelectItem value="none" className="text-xs font-khmer">
                          {t("common.none", { defaultValue: "មិនមាន" })}
                        </SelectItem>
                      )}
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id} className="text-xs font-khmer">
                          {b.nameKh} ({b.code}){b.isMain ? " ★" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              }

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
          </CardContent>
        </Card>

        {/* Section 2: Teacher Assignment */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-khmer flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-emerald-600" />
                  {t("classes.teacherAssignment")} <span className="text-destructive">*</span>
                </CardTitle>
                <CardDescription className="text-xs font-khmer">
                  {t("classes.selectTeacherModalDesc")}
                </CardDescription>
              </div>

              {selectedTeacher && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTeacherDialogOpen(true)}
                  className="text-xs font-khmer h-8 gap-1.5"
                >
                  <UserCheck className="h-3.5 w-3.5 text-primary" />
                  {t("classes.changeTeacher")}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {selectedTeacher ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/70 gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11 ring-2 ring-primary/20 shrink-0">
                    <AvatarImage src={selectedTeacher.avatarUrl} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
                      {selectedTeacher.name ? selectedTeacher.name.charAt(0) : "T"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">
                        {selectedTeacher.name}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Teacher
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground font-mono">
                      <span>@{selectedTeacher.username}</span>
                      {selectedTeacher.phone && <span>{selectedTeacher.phone}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsTeacherDialogOpen(true)}
                    className="text-xs font-khmer h-8"
                  >
                    {t("classes.changeTeacher")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAssignedTeacherId("")}
                    className="text-xs font-khmer h-8 text-destructive hover:bg-destructive/10"
                  >
                    {t("classes.removeTeacher")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border border-dashed border-border/80 bg-muted/20 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground font-khmer">
                      {t("classes.noTeacherSelected")}
                    </h4>
                    <p className="text-[11px] text-muted-foreground font-khmer">
                      {t("classes.teacherRequired")}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="gradient"
                  size="sm"
                  onClick={() => setIsTeacherDialogOpen(true)}
                  className="text-xs font-khmer gap-1.5 shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("classes.selectTeacher")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 3: Learning Schedule */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base font-bold font-khmer flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              {t("classes.learningSchedule")}
            </CardTitle>
            <CardDescription className="text-xs font-khmer">
              {t("classes.dialogDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center min-h-[20px]">
                  <Label className="text-xs font-khmer">
                    {t("classes.scheduleType")} <span className="text-destructive">*</span>
                  </Label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={scheduleType === "weekday" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleScheduleTypeChange("weekday")}
                    className="text-xs font-khmer h-10 rounded-lg"
                  >
                    {t("classes.weekday")}
                  </Button>
                  <Button
                    type="button"
                    variant={scheduleType === "weekend" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleScheduleTypeChange("weekend")}
                    className="text-xs font-khmer h-10 rounded-lg"
                  >
                    {t("classes.weekend")}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center min-h-[20px]">
                  <Label className="text-xs font-khmer text-muted-foreground">
                    {t("classes.learningDays")} (Auto)
                  </Label>
                </div>
                <div className="h-10 px-3 rounded-lg bg-muted/40 border border-border/70 flex items-center text-xs font-khmer text-foreground">
                  <Calendar className="h-3.5 w-3.5 text-primary mr-2" />
                  <span>
                    {scheduleType === "weekday"
                      ? t("classes.mondayToFriday") + " (Mon - Fri)"
                      : t("classes.saturdaySunday") + " (Sat - Sun)"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center min-h-[20px]">
                  <Label htmlFor="start-time" className="text-xs font-khmer">
                    {t("classes.startTime")} <span className="text-destructive">*</span>
                  </Label>
                </div>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="pl-8 text-xs font-mono h-10 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center min-h-[20px]">
                  <Label htmlFor="end-time" className="text-xs font-khmer">
                    {t("classes.endTime")} <span className="text-destructive">*</span>
                  </Label>
                </div>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="pl-8 text-xs font-mono h-10 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center min-h-[20px]">
                  <Label className="text-xs font-khmer text-muted-foreground">
                    {t("classes.hoursPerWeekLabel")}
                  </Label>
                </div>
                <div className="h-10 px-3 rounded-lg bg-muted/40 border border-border/70 flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">
                    {hoursPerWeek} {t("classes.hoursUnit")}/wk
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {sessionMinutes} {t("classes.sessionMinutes")}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Study Period */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base font-bold font-khmer flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              {t("classes.studyPeriod")}
            </CardTitle>
            <CardDescription className="text-xs font-khmer">
              {t("classes.studyPeriodDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center min-h-[20px]">
                  <Label htmlFor="start-date" className="text-xs font-khmer">
                    {t("classes.startDate")} <span className="text-destructive">*</span>
                  </Label>
                </div>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs font-mono h-10 rounded-lg"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between min-h-[20px]">
                  <Label className="text-xs font-khmer flex items-center gap-1.5 text-primary font-bold">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    {t("classes.expectedEndDate")}
                  </Label>
                  <span className="text-[10px] text-muted-foreground font-khmer">
                    ({selectedPackage?.totalPlannedHours || 40} {t("classes.hoursUnit")})
                  </span>
                </div>
                <div className="h-10 px-3 rounded-lg bg-primary/5 border border-primary/30 flex items-center justify-between text-xs font-mono font-bold text-primary">
                  <span>{calculatedExpectedEndDate || "-"}</span>
                  <span className="text-[10px] font-sans font-normal px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    Auto
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground font-khmer flex items-start gap-1.5 bg-muted/30 p-2.5 rounded-lg border border-border/40">
              <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <span>{t("classes.endDateCalculatedHint")}</span>
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Additional Information */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base font-bold font-khmer flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {t("classes.additionalInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-1.5 max-w-xs">
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
              <Label htmlFor="class-note" className="text-xs font-khmer">
                {t("classes.note")}
              </Label>
              <Textarea
                id="class-note"
                placeholder={t("classes.notePlaceholder")}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="text-xs font-khmer min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/classes")}
            disabled={isSubmitting}
            className="text-xs font-khmer"
          >
            {t("common.cancel")}
          </Button>

          <Button
            type="submit"
            variant="gradient"
            disabled={isSubmitting}
            className="gap-2 shadow-sm text-xs font-khmer"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? t("common.loading") : t("common.save")}
          </Button>
        </div>
      </form>

      {/* Dedicated Teacher Selection Dialog */}
      <TeacherSelectionDialog
        open={isTeacherDialogOpen}
        onOpenChange={setIsTeacherDialogOpen}
        teachers={selectableTeachers}
        selectedTeacherId={assignedTeacherId}
        onSelect={(teacher) => setAssignedTeacherId(teacher.id)}
      />
    </div>
  );
};

export default ClassroomFormPage;
