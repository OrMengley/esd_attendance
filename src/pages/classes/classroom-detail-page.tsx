import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ClassroomStatusBadge } from "@/components/classes/classroom-status-badge";
import { classroomService } from "@/services/classroom.service";
import { studyPackageService } from "@/services/study-package.service";
import { userService } from "@/services/user.service";
import { schoolHolidayService } from "@/services/school-holiday.service";
import { enrollmentService } from "@/services/enrollment.service";
import { studentService } from "@/services/student.service";
import { AuditUserDisplay } from "@/components/shared/audit-user-display";
import { EnrolledStudentsCard, EnrolledStudentItem } from "@/components/classes/enrolled-students-card";
import { AddStudentToClassDialog } from "@/components/classes/add-student-to-class-dialog";
import { Classroom } from "@/models/classroom.model";
import { StudyPackage } from "@/models/study-package.model";
import { User } from "@/models/user.model";
import { Student } from "@/models/student.model";
import { SchoolHoliday } from "@/models/school-holiday.model";
import { Branch } from "@/models/branch.model";
import { branchService } from "@/services/branch.service";
import {
  calculateClassProgressMetrics,
  calculateClassCapacityMetrics,
  formatHours,
  formatPercent,
} from "@/lib/class-progress-calculator";
import {
  ClassProgressHealthBadge,
  getProgressBarColor,
} from "@/components/reports/class-progress/class-progress-health-badge";
import { formatKhmerDate, formatAuditDateTime } from "@/lib/utils";
import { toast } from "sonner";
import {
  ArrowLeft,
  Edit2,
  School,
  BookOpen,
  GraduationCap,
  Calendar,
  Clock,
  Users,
  CalendarCheck,
  FileText,
  Sparkles,
  Phone,
  Mail,
  History,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Building2,
} from "lucide-react";

export const ClassroomDetailPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [studyPackage, setStudyPackage] = useState<StudyPackage | null>(null);
  const [teacher, setTeacher] = useState<User | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [holidays, setHolidays] = useState<SchoolHoliday[]>([]);
  const [activeEnrollmentCount, setActiveEnrollmentCount] = useState<number>(0);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudentItem[]>([]);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const cls = await classroomService.getClassroomById(id, user);
      if (!cls) {
        toast.error(t("classes.classroomNotFound"));
        navigate("/classes");
        return;
      }

      if (user?.role === "admin" && user.branchId && cls.branchId !== user.branchId) {
        toast.error(t("common.unauthorized", { defaultValue: "You are not authorized to view this classroom." }));
        navigate("/classes");
        return;
      }

      setClassroom(cls);

      const [pkg, usr, hols, activeEnrollments, allStudents, branchData] = await Promise.all([
        cls.packageId ? studyPackageService.getStudyPackageById(cls.packageId) : Promise.resolve(null),
        cls.assignedTeacherId ? userService.getUserById(cls.assignedTeacherId) : Promise.resolve(null),
        schoolHolidayService.getActiveSchoolHolidays(),
        enrollmentService.getActiveEnrollmentsByClassroomId(cls.id, user),
        studentService.getStudents(cls.branchId),
        cls.branchId ? branchService.getBranchById(cls.branchId) : Promise.resolve(null),
      ]);

      const studentMap = new Map<string, Student>(allStudents.map((s) => [s.id, s]));
      const enrolledItems: EnrolledStudentItem[] = activeEnrollments
        .map((enr) => {
          const std = studentMap.get(enr.studentId);
          return std ? { enrollment: enr, student: std } : null;
        })
        .filter((item): item is EnrolledStudentItem => item !== null);

      setStudyPackage(pkg);
      setTeacher(usr);
      setBranch(branchData);
      setHolidays(hols);
      setEnrolledStudents(enrolledItems);
      setActiveEnrollmentCount(activeEnrollments.length);
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes("UNAUTHORIZED")) {
        toast.error(t("common.unauthorized", { defaultValue: "You are not authorized to view this classroom." }));
        navigate("/classes");
        return;
      }
      toast.error(t("classes.fetchError"));
    } finally {
      setIsLoading(false);
    }
  }, [id, user, navigate, t]);

  const progressMetrics = useMemo(() => {
    if (!classroom || !studyPackage) return null;
    return calculateClassProgressMetrics({
      classroom,
      studyPackage,
      holidays,
    });
  }, [classroom, studyPackage, holidays]);

  const capacityMetrics = useMemo(() => {
    if (!classroom) return null;
    return calculateClassCapacityMetrics(classroom, activeEnrollmentCount);
  }, [classroom, activeEnrollmentCount]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-4">
        <div className="h-10 w-48 bg-muted/50 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-card rounded-2xl border animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!classroom) return null;

  const isWeekday = classroom.scheduleDays.length === 5;
  const daysText = isWeekday
    ? t("classes.mondayToFriday") + " (Mon - Fri)"
    : t("classes.saturdaySunday") + " (Sat - Sun)";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
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
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold font-khmer text-foreground tracking-tight">
                {classroom.name}
              </h1>
              <ClassroomStatusBadge status={classroom.status} />
              {branch && (
                <Badge variant="outline" className="font-khmer text-xs gap-1 bg-muted/50 border-border">
                  <Building2 className="h-3 w-3 text-primary" />
                  <span>{branch.nameKh}</span>
                </Badge>
              )}
            </div>
            <p className="font-mono text-xs font-semibold text-primary mt-0.5">
              {classroom.code}
            </p>
          </div>
        </div>

        <Button asChild variant="gradient" className="gap-2 shadow-sm text-xs font-khmer self-start sm:self-auto">
          <Link to={`/classes/${classroom.id}/edit`}>
            <Edit2 className="h-4 w-4" />
            {t("classes.editClass")}
          </Link>
        </Button>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Study Package */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-sm font-bold font-khmer flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              {t("classes.package")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            <div className="font-bold text-base text-foreground font-khmer">
              {studyPackage?.nameKh || classroom.packageId}
            </div>
            {studyPackage?.nameEn && (
              <p className="text-xs text-muted-foreground">{studyPackage.nameEn}</p>
            )}
            <div className="flex items-center gap-2 pt-2">
              <Badge variant="outline" className="font-mono text-xs bg-muted/40">
                {studyPackage?.code || classroom.packageId}
              </Badge>
              <span className="text-xs font-semibold text-primary dark:text-blue-400 font-khmer">
                {studyPackage?.totalPlannedHours || 40} {t("classes.hoursUnit")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Assigned Teacher */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-sm font-bold font-khmer flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-emerald-600" />
              {t("classes.teacher")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {teacher ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-primary/20 shrink-0">
                  <AvatarImage src={teacher.avatarUrl} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
                    {teacher.name ? teacher.name.charAt(0) : "T"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-0.5">
                  <div className="font-bold text-sm text-foreground">{teacher.name}</div>
                  <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground font-mono">
                    <span>@{teacher.username}</span>
                    {teacher.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {teacher.phone}
                      </span>
                    )}
                  </div>
                  {teacher.email && (
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 pt-0.5">
                      <Mail className="h-3 w-3" />
                      {teacher.email}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground italic font-khmer">
                {t("dashboard.unassigned")}
              </span>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Learning Schedule */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-sm font-bold font-khmer flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              {t("classes.learningSchedule")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-muted-foreground text-[11px] font-khmer">
                  {t("classes.learningDays")}
                </span>
                <p className="font-semibold text-foreground font-khmer">{daysText}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-muted-foreground text-[11px] font-khmer">
                  {t("classes.time")}
                </span>
                <p className="font-semibold font-mono text-foreground">
                  {classroom.startTime} - {classroom.endTime}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-muted-foreground text-[11px] font-khmer">
                  {t("classes.sessionDuration")}
                </span>
                <p className="font-semibold text-foreground">
                  {classroom.sessionMinutes} {t("classes.sessionMinutes")}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-muted-foreground text-[11px] font-khmer">
                  {t("classes.hoursPerWeek")}
                </span>
                <p className="font-bold font-mono text-primary dark:text-blue-400">
                  {classroom.hoursPerWeek} {t("classes.hoursUnit")}/wk
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Study Period */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-sm font-bold font-khmer flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              {t("classes.studyPeriod")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
                <span className="text-muted-foreground text-[11px] font-khmer block">
                  {t("classes.startDate")}
                </span>
                <span className="font-bold text-foreground font-mono text-xs mt-0.5 block">
                  {classroom.startDate}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                <span className="text-primary font-semibold text-[11px] font-khmer flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  {t("classes.expectedEndDate")}
                </span>
                <span className="font-bold text-primary font-mono text-xs mt-0.5 block">
                  {classroom.expectedEndDate}
                </span>
              </div>
            </div>

            {classroom.actualEndDate && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between">
                <span className="text-emerald-700 dark:text-emerald-400 font-khmer">
                  {t("classes.actualEndDate")}:
                </span>
                <span className="font-bold font-mono text-emerald-700 dark:text-emerald-400">
                  {classroom.actualEndDate}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Learning Progress Card */}
        {progressMetrics && capacityMetrics && (
          <Card className="border-border/80 shadow-xs md:col-span-2">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm font-bold font-khmer flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {t("classProgressReport.detail.title")}
                </CardTitle>
                <ClassProgressHealthBadge health={progressMetrics.health} />
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {progressMetrics.isManuallyCompletedIncomplete && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>
                    {t("classProgressReport.detail.manualCompletedWarning", {
                      completed: formatHours(progressMetrics.completedHours),
                      planned: formatHours(progressMetrics.plannedHours),
                    })}
                  </span>
                </div>
              )}

              {/* Progress Bar & Percent */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-muted-foreground font-khmer">
                    {t("classProgressReport.detail.progress")}
                  </span>
                  <span className="font-bold font-mono text-foreground text-sm">
                    {formatPercent(progressMetrics.progressPercent)}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={Math.round(progressMetrics.progressPercent)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden"
                >
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${getProgressBarColor(progressMetrics.health)}`}
                    style={{ width: `${Math.min(100, Math.max(0, progressMetrics.progressPercent))}%` }}
                  />
                </div>
                <div className="text-[11px] text-muted-foreground font-khmer text-right">
                  {t("classProgressReport.detail.completedSessions", {
                    count: progressMetrics.completedSessions,
                  })}
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60">
                  <span className="text-muted-foreground text-[11px] font-khmer block">
                    {t("classProgressReport.detail.plannedHours")}
                  </span>
                  <span className="font-bold font-mono text-sm text-foreground mt-0.5 block">
                    {formatHours(progressMetrics.plannedHours)}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                  <span className="text-primary font-semibold text-[11px] font-khmer block">
                    {t("classProgressReport.detail.completedHours")}
                  </span>
                  <span className="font-bold font-mono text-sm text-primary mt-0.5 block">
                    {formatHours(progressMetrics.completedHours)}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60">
                  <span className="text-muted-foreground text-[11px] font-khmer block">
                    {t("classProgressReport.detail.remainingHours")}
                  </span>
                  <span className="font-bold font-mono text-sm text-foreground mt-0.5 block">
                    {formatHours(progressMetrics.remainingHours)}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60">
                  <span className="text-muted-foreground text-[11px] font-khmer block">
                    {t("classProgressReport.detail.enrollment")}
                  </span>
                  <span className="font-bold font-mono text-sm text-foreground mt-0.5 block">
                    {capacityMetrics.enrolledStudents}/{capacityMetrics.capacity ?? "—"}
                    {capacityMetrics.capacity !== null && capacityMetrics.capacity > 0 && (
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        ({Math.round(capacityMetrics.capacityPercent)}%)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Enrolled Students Roster */}
      {capacityMetrics && (
        <EnrolledStudentsCard
          classroom={classroom}
          enrolledStudents={enrolledStudents}
          capacityMetrics={capacityMetrics}
          isLoading={isLoading}
          onAddStudent={() => setIsAddStudentOpen(true)}
          onRefresh={loadData}
        />
      )}

      {/* Capacity & Notes */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-sm font-bold font-khmer flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            {t("classes.additionalInfo")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
            <span className="text-muted-foreground text-[11px] font-khmer flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              {t("classes.capacity")}
            </span>
            <span className="font-bold text-foreground text-xs mt-1 block">
              {classroom.capacity ? `${classroom.capacity} ${t("classes.studentsUnit")}` : "-"}
            </span>
          </div>

          <div className="md:col-span-2 p-3 rounded-xl bg-muted/40 border border-border/60">
            <span className="text-muted-foreground text-[11px] font-khmer flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              {t("classes.note")}
            </span>
            <p className="text-xs text-foreground font-khmer mt-1 whitespace-pre-wrap">
              {classroom.note || "-"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Audit Information */}
      <Card className="border-border/80 shadow-xs bg-muted/20 overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/60 py-2.5 px-5">
          <CardTitle className="text-xs font-bold font-khmer text-muted-foreground flex items-center gap-1.5">
            <History className="h-3.5 w-3.5" />
            {t("classes.auditInfo")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {classroom.createdAt && (
              <div className="space-y-1">
                <span className="block text-[11px] font-khmer text-muted-foreground">
                  {t("packages.createdAt")}:
                </span>
                <span className="font-semibold text-foreground font-khmer text-xs">
                  {formatAuditDateTime(classroom.createdAt, i18n.language)}
                </span>
              </div>
            )}
            {classroom.updatedAt && (
              <div className="space-y-1">
                <span className="block text-[11px] font-khmer text-muted-foreground">
                  {t("classes.lastUpdated")}:
                </span>
                <span className="font-semibold text-foreground font-khmer text-xs">
                  {formatAuditDateTime(classroom.updatedAt, i18n.language)}
                </span>
              </div>
            )}
            <AuditUserDisplay
              label={t("students.createdBy")}
              userId={classroom.createdBy}
              isLoading={isLoading}
            />
            <AuditUserDisplay
              label={t("students.updatedBy")}
              userId={classroom.updatedBy}
              isLoading={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Add Student to Class Dialog */}
      <AddStudentToClassDialog
        open={isAddStudentOpen}
        onOpenChange={setIsAddStudentOpen}
        classroom={classroom}
        onSuccess={loadData}
      />
    </div>
  );
};

export default ClassroomDetailPage;
