import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StudentStatusBadge } from "@/components/students/student-status-badge";
import { EnrollmentStatusBadge } from "@/components/students/enrollment-status-badge";
import { EnrollmentDialog } from "@/components/students/enrollment-dialog";
import { EnrollmentHistoryTable } from "@/components/students/enrollment-history-table";
import { TransferClassDialog } from "@/components/students/transfer-class-dialog";
import { TransferHistorySection } from "@/components/students/transfer-history-section";
import { AuditUserDisplay } from "@/components/shared/audit-user-display";
import { studentService } from "@/services/student.service";
import { enrollmentService } from "@/services/enrollment.service";
import { classroomService } from "@/services/classroom.service";
import { studyPackageService } from "@/services/study-package.service";
import { userService } from "@/services/user.service";
import { Student } from "@/models/student.model";
import { Enrollment } from "@/models/enrollment.model";
import { EnrollmentTransfer } from "@/models/enrollment-transfer.model";
import { Classroom } from "@/models/classroom.model";
import { StudyPackage } from "@/models/study-package.model";
import { User } from "@/models/user.model";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  ArrowLeft,
  Edit2,
  UserPlus,
  School,
  BookOpen,
  GraduationCap,
  Calendar,
  Clock,
  MapPin,
  Users,
  Phone,
  FileText,
  CheckCircle2,
  Award,
  Sparkles,
  Info,
  ShieldAlert,
  User as UserIcon,
  History,
  ArrowRightLeft,
} from "lucide-react";
import { formatKhmerDate, formatAuditDateTime } from "@/lib/utils";

export const StudentDetailPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();

  const [student, setStudent] = useState<Student | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [transfers, setTransfers] = useState<EnrollmentTransfer[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [packages, setPackages] = useState<StudyPackage[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [activeEnrollment, setActiveEnrollment] = useState<Enrollment | null>(
    null
  );
  const [activeClass, setActiveClass] = useState<Classroom | null>(null);
  const [activePackage, setActivePackage] = useState<StudyPackage | null>(null);
  const [activeTeacher, setActiveTeacher] = useState<User | null>(null);

  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const createdByUser = useMemo(() => {
    if (!student?.createdBy || student.createdBy === "system") return null;
    return teachers.find((u) => u.id === student.createdBy) || null;
  }, [student?.createdBy, teachers]);

  const updatedByUser = useMemo(() => {
    if (!student?.updatedBy || student.updatedBy === "system") return null;
    return teachers.find((u) => u.id === student.updatedBy) || null;
  }, [student?.updatedBy, teachers]);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [std, enrList, clsList, pkgList, usrList, trList] = await Promise.all([
        studentService.getStudentById(id),
        enrollmentService.getEnrollmentsByStudentId(id),
        classroomService.getClassrooms(),
        studyPackageService.getStudyPackages(),
        userService.getUsers(),
        enrollmentService.getTransfersByStudentId(id),
      ]);

      if (!std) {
        toast.error(t("students.noStudentsTitle"));
        navigate("/students");
        return;
      }

      setStudent(std);
      setEnrollments(enrList);
      setTransfers(trList);
      setClassrooms(clsList);
      setPackages(pkgList);
      setTeachers(usrList);

      const activeEnr = enrList.find((e) => e.status === "active") || null;
      setActiveEnrollment(activeEnr);

      if (activeEnr) {
        const cls = clsList.find((c) => c.id === activeEnr.classroomId) || null;
        setActiveClass(cls);
        if (cls) {
          const pkg = pkgList.find((p) => p.id === cls.packageId) || null;
          const tch =
            usrList.find((u) => u.id === cls.assignedTeacherId) || null;
          setActivePackage(pkg);
          setActiveTeacher(tch);
        }
      } else {
        setActiveClass(null);
        setActivePackage(null);
        setActiveTeacher(null);
      }
    } catch (e) {
      console.error("Failed to load student details:", e);
      toast.error(t("students.fetchError"));
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 py-6">
        <div className="h-10 w-48 bg-muted/50 rounded-xl animate-pulse" />
        <div className="h-44 bg-card rounded-2xl border animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-card rounded-2xl border animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!student) return null;

  const isWeekday = activeClass ? activeClass.scheduleDays.length === 5 : false;
  const daysText = isWeekday
    ? t("classes.mondayToFriday")
    : t("classes.saturdaySunday");

  const formattedAddress = [
    student.address?.village ? `${t("students.village")} ${student.address.village}` : "",
    student.address?.commune ? `${t("students.commune")} ${student.address.commune}` : "",
    student.address?.district ? `${t("students.district")} ${student.address.district}` : "",
    student.address?.province ? `${t("students.province")} ${student.address.province}` : "",
  ]
    .filter(Boolean)
    .join(", ") || "-";

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl shrink-0"
          >
            <Link to="/students" title={t("students.backToStudents")}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-khmer text-foreground">
                {student.nameKh}
              </h1>
              {student.nameEn && (
                <span className="text-sm font-medium text-muted-foreground">
                  ({student.nameEn})
                </span>
              )}
              <StudentStatusBadge status={student.status} />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
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

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs font-khmer h-9 gap-1.5"
          >
            <Link to={`/students/${student.id}/edit`}>
              <Edit2 className="h-3.5 w-3.5 text-amber-500" />
              <span>{t("students.editStudent")}</span>
            </Link>
          </Button>

          <Button
            onClick={() => setIsEnrollDialogOpen(true)}
            size="sm"
            className="text-xs font-khmer h-9 gap-1.5 shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            <span>{t("enrollment.enrollInClass")}</span>
          </Button>
        </div>
      </div>

      {/* Hero: Current Active Enrollment */}
      {activeEnrollment && activeClass ? (
        <Card className="rounded-2xl border-primary/40 bg-gradient-to-br from-primary/5 via-card to-card dark:from-primary/10 dark:via-card dark:to-card shadow-xs overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/15 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <School className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold font-khmer flex items-center gap-2">
                    <span>{t("enrollment.activeEnrollment")}</span>
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] py-0 px-2 font-khmer">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {t("enrollment.statusActive")}
                    </Badge>
                  </CardTitle>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsTransferDialogOpen(true)}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-khmer gap-1.5 border-primary/30 text-primary dark:text-blue-300 hover:bg-primary/10 shadow-xs"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5 text-primary dark:text-blue-400" />
                  <span>{t("transfer.title", { defaultValue: "ផ្ទេរថ្នាក់រៀន" })}</span>
                </Button>

                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-primary font-khmer"
                >
                  <Link to={`/classes/${activeClass.id}`}>
                    {t("classes.viewDetails")}
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-mono font-bold text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20">
                  {activeClass.code}
                </span>
                <h3 className="text-lg font-bold text-foreground mt-1">
                  {activeClass.name}
                </h3>
              </div>

              <div className="text-xs text-muted-foreground">
                <span className="font-khmer">{t("enrollment.startDate")}:</span>{" "}
                <span className="font-bold text-foreground">
                  {formatKhmerDate(activeEnrollment.startDate)}
                </span>
              </div>
            </div>

            {/* Grid details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2 border-t border-border/60">
              {/* Study Package */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/80">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary dark:text-blue-400 shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-muted-foreground font-khmer">
                    {t("enrollment.studyPackage")}
                  </div>
                  <div className="font-semibold text-xs text-foreground truncate">
                    {activePackage ? activePackage.nameKh : "-"}
                  </div>
                </div>
              </div>

              {/* Teacher */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/80">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-muted-foreground font-khmer">
                    {t("enrollment.teacher")}
                  </div>
                  <div className="font-semibold text-xs text-foreground truncate">
                    {activeTeacher ? activeTeacher.name : "-"}
                  </div>
                </div>
              </div>

              {/* Schedule & Time */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/80">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-muted-foreground font-khmer">
                    {t("enrollment.schedule")}
                  </div>
                  <div className="font-semibold text-xs text-foreground truncate">
                    {daysText} ({activeClass.startTime} - {activeClass.endTime})
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl border-dashed border-border bg-card shadow-xs">
          <CardContent className="py-8 px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                <School className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground font-khmer">
                  {t("enrollment.noActiveEnrollment")}
                </h3>
                <p className="text-xs text-muted-foreground font-khmer max-w-md mt-0.5">
                  {t("enrollment.noActiveEnrollmentDesc")}
                </p>
              </div>
            </div>

            <Button
              onClick={() => setIsEnrollDialogOpen(true)}
              className="text-xs font-khmer h-9 gap-1.5 shrink-0"
            >
              <UserPlus className="h-4 w-4" />
              <span>{t("enrollment.enrollInClass")}</span>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Student Details Grid (2 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <UserIcon className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold font-khmer">
                  {t("students.studentInfo")}
                </CardTitle>
                <CardDescription className="text-xs font-khmer">
                  {t("students.studentInfoDesc")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-4 pb-2 border-b border-border/60">
              <Avatar className="h-16 w-16 rounded-2xl ring-2 ring-border shrink-0">
                <AvatarImage src={student.avatarUrl} className="object-cover" />
                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg rounded-2xl">
                  {student.nameKh.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="font-bold text-base text-foreground">
                  {student.nameKh}
                </div>
                {student.nameEn && (
                  <div className="text-xs text-muted-foreground">
                    {student.nameEn}
                  </div>
                )}
                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  {student.studentCode}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground block font-khmer">
                  {t("students.gender")}:
                </span>
                <span className="font-semibold text-foreground">
                  {student.gender === "female"
                    ? t("gender.female")
                    : t("gender.male")}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block font-khmer">
                  {t("students.dob")}:
                </span>
                <span className="font-semibold text-foreground">
                  {student.dateOfBirth ? formatKhmerDate(student.dateOfBirth) : "-"}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block font-khmer">
                  {t("students.birthCertificate")}:
                </span>
                <span className="font-semibold text-foreground">
                  {student.birthCertificateStatus === "has_certificate"
                    ? t("students.hasCertificate")
                    : t("students.noCertificate")}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block font-khmer">
                  {t("students.studentPhone")}:
                </span>
                <span className="font-mono font-semibold text-foreground">
                  {student.phone || "-"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Card */}
        <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold font-khmer">
                  {t("students.addressInfo")}
                </CardTitle>
                <CardDescription className="text-xs font-khmer">
                  {t("students.addressInfoDesc")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="p-3 rounded-xl bg-muted/40 border border-border/70 text-xs leading-relaxed text-foreground font-khmer">
              {formattedAddress}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <span className="text-muted-foreground block font-khmer">
                  {t("students.village")}:
                </span>
                <span className="font-semibold text-foreground">
                  {student.address?.village || "-"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block font-khmer">
                  {t("students.commune")}:
                </span>
                <span className="font-semibold text-foreground">
                  {student.address?.commune || "-"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block font-khmer">
                  {t("students.district")}:
                </span>
                <span className="font-semibold text-foreground">
                  {student.address?.district || "-"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block font-khmer">
                  {t("students.province")}:
                </span>
                <span className="font-semibold text-foreground">
                  {student.address?.province || "-"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Father Information Card */}
        <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold font-khmer">
                  {t("students.fatherInfo")}
                </CardTitle>
                <CardDescription className="text-xs font-khmer">
                  {t("students.fatherInfoDesc")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground font-khmer">
                {t("students.fatherName")}:
              </span>
              <span className="font-bold text-foreground">
                {student.fatherName || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground font-khmer">
                {t("students.fatherJob")}:
              </span>
              <span className="font-medium text-foreground">
                {student.fatherOccupation || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground font-khmer">
                {t("students.fatherPhone")}:
              </span>
              <span className="font-mono font-bold text-foreground">
                {student.fatherPhone || "-"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Mother Information Card */}
        <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-600 dark:text-pink-400">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold font-khmer">
                  {t("students.motherInfo")}
                </CardTitle>
                <CardDescription className="text-xs font-khmer">
                  {t("students.motherInfoDesc")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground font-khmer">
                {t("students.motherName")}:
              </span>
              <span className="font-bold text-foreground">
                {student.motherName || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground font-khmer">
                {t("students.motherJob")}:
              </span>
              <span className="font-medium text-foreground">
                {student.motherOccupation || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground font-khmer">
                {t("students.motherPhone")}:
              </span>
              <span className="font-mono font-bold text-foreground">
                {student.motherPhone || "-"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Note & Additional Information if present */}
      {student.note && (
        <Card className="rounded-2xl border-border/80 shadow-xs overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-600 dark:text-slate-400">
                <FileText className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-bold font-khmer">
                {t("students.note")}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-khmer">
              {student.note}
            </p>
          </CardContent>
        </Card>
      )}

      {/* SECTION: Enrollment History */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-khmer text-foreground">
              {t("enrollment.history")}
            </h2>
            <p className="text-xs text-muted-foreground font-khmer">
              {t("enrollment.historyDesc")}
            </p>
          </div>

          <Button
            onClick={() => setIsEnrollDialogOpen(true)}
            size="sm"
            variant="outline"
            className="text-xs font-khmer h-8 gap-1.5"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>{t("enrollment.enrollInClass")}</span>
          </Button>
        </div>

        <EnrollmentHistoryTable
          enrollments={enrollments}
          classrooms={classrooms}
          packages={packages}
          teachers={teachers}
          onRefresh={loadData}
        />

        {/* Transfer History Audit Log */}
        <TransferHistorySection
          transfers={transfers}
          classrooms={classrooms}
          users={teachers}
          isLoading={isLoading}
        />
      </div>

      {/* System / Audit Information Footer */}
      <Card className="rounded-2xl border-border/80 bg-muted/20 shadow-xs overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/60 py-3 px-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground font-khmer">
            <History className="h-4 w-4" />
            <span>{t("students.auditInfo", { defaultValue: "ព័ត៌មានប្រព័ន្ធ & កាលបរិច្ឆេទ" })}</span>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <span className="block text-[11px] font-khmer text-muted-foreground">
                {t("students.createdAt")}:
              </span>
              <span className="font-semibold text-foreground font-khmer text-xs">
                {formatAuditDateTime(student.createdAt, i18n.language)}
              </span>
            </div>

            <div className="space-y-1">
              <span className="block text-[11px] font-khmer text-muted-foreground">
                {t("students.updatedAt")}:
              </span>
              <span className="font-semibold text-foreground font-khmer text-xs">
                {student.updatedAt
                  ? formatAuditDateTime(student.updatedAt, i18n.language)
                  : "-"}
              </span>
            </div>

            <AuditUserDisplay
              label={t("students.createdBy")}
              userId={student.createdBy}
              user={createdByUser}
              isLoading={isLoading}
            />

            <AuditUserDisplay
              label={t("students.updatedBy")}
              userId={student.updatedBy}
              user={updatedByUser}
              isLoading={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Enrollment Dialog */}
      <EnrollmentDialog
        open={isEnrollDialogOpen}
        onOpenChange={setIsEnrollDialogOpen}
        student={student}
        onSuccess={() => {
          loadData();
        }}
      />

      {/* Transfer Class Dialog */}
      <TransferClassDialog
        open={isTransferDialogOpen}
        onOpenChange={setIsTransferDialogOpen}
        student={student}
        activeEnrollment={activeEnrollment}
        activeClass={activeClass}
        activePackage={activePackage}
        activeTeacher={activeTeacher}
        onSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
};
