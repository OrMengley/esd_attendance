import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Printer,
  Calendar,
  School,
  Clock,
  CheckCircle2,
  XCircle,
  Clock3,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  User as UserIcon,
  Phone,
  Layers,
  Sparkles,
  Filter,
  History,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Eye,
  Edit3,
} from "lucide-react";
import { AttendanceCorrectionDialog } from "@/components/attendance-corrections/attendance-correction-dialog";
import {
  studentAttendanceService,
  toKhmerNum,
} from "@/services/student-attendance.service";
import { Student } from "@/models/student.model";
import { Enrollment } from "@/models/enrollment.model";
import { Classroom } from "@/models/classroom.model";
import { Attendance, AttendanceStatus } from "@/models/attendance.model";
import { StudyPackage } from "@/models/study-package.model";
import { User } from "@/models/user.model";
import { getCambodiaToday } from "@/lib/attendance-time-lock";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const StudentAttendanceDetailPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const [searchParams] = useSearchParams();
  const urlMonth = searchParams.get("month") || "";

  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [student, setStudent] = useState<Student | null>(null);
  const [enrollments, setEnrollments] = useState<{
    enrollment: Enrollment;
    classroom: Classroom | null;
    studyPackage: StudyPackage | null;
    teacher: User | null;
  }[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<(Attendance & {
    classroomName?: string;
    classroomCode?: string;
    teacherName?: string;
    recordedByName?: string;
  })[]>([]);
  const [overallSummary, setOverallSummary] = useState<{
    presentCount: number;
    absentCount: number;
    lateCount: number;
    permissionCount: number;
    recordedSessions: number;
    attendanceRate: number;
  }>({
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    permissionCount: 0,
    recordedSessions: 0,
    attendanceRate: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  // Filters for Attendance Table
  const [selectedClassFilter, setSelectedClassFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [filterMonth, setFilterMonth] = useState<string>(() => urlMonth);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Monthly Report Dialog State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportMonth, setReportMonth] = useState<string>(() =>
    urlMonth || getCambodiaToday().substring(0, 7)
  );
  const [reportEnrollmentId, setReportEnrollmentId] = useState<string>("");

  // Correction Modal State
  const [selectedRecordForCorrection, setSelectedRecordForCorrection] = useState<(Attendance & {
    classroomName?: string;
    classroomCode?: string;
  }) | null>(null);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);

  const isKm = i18n.language === "km";

  useEffect(() => {
    if (urlMonth) {
      setFilterMonth(urlMonth);
      setReportMonth(urlMonth);
    }
  }, [urlMonth]);

  useEffect(() => {
    if (!studentId) return;
    loadStudentHistory();
  }, [studentId, user]);

  const loadStudentHistory = async () => {
    if (!studentId) return;
    setIsLoading(true);
    setIsUnauthorized(false);

    try {
      const data = await studentAttendanceService.getStudentFullHistory(studentId, user);
      setStudent(data.student);
      setEnrollments(data.enrollments);
      setAttendanceRecords(data.attendanceRecords);
      setOverallSummary(data.overallSummary);

      if (data.enrollments.length > 0) {
        setReportEnrollmentId(data.enrollments[0].enrollment.id);
      }
    } catch (e: any) {
      console.error("Failed to load student history:", e);
      if (e.message === "UNAUTHORIZED_STUDENT_ACCESS") {
        setIsUnauthorized(true);
      } else {
        toast.error(t("studentAttendance.fetchError", { defaultValue: "មិនអាចទាញយកទិន្នន័យប្រវត្តិវត្តមានបានទេ" }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered attendance logs
  const filteredAttendance = useMemo(() => {
    return attendanceRecords.filter((rec) => {
      const date = rec.attendanceDate || rec.date || "";

      // 1. Class filter
      if (selectedClassFilter !== "all" && rec.classroomId !== selectedClassFilter) {
        return false;
      }

      // 2. Status filter
      if (selectedStatusFilter !== "all" && rec.status !== selectedStatusFilter) {
        return false;
      }

      // 3. Month filter
      if (filterMonth && !date.startsWith(filterMonth)) {
        return false;
      }

      // 4. Date Range filter
      if (filterDateFrom && date < filterDateFrom) return false;
      if (filterDateTo && date > filterDateTo) return false;

      return true;
    });
  }, [
    attendanceRecords,
    selectedClassFilter,
    selectedStatusFilter,
    filterMonth,
    filterDateFrom,
    filterDateTo,
  ]);

  const effectiveSummary = useMemo(() => {
    if (
      !filterMonth &&
      !filterDateFrom &&
      !filterDateTo &&
      selectedClassFilter === "all" &&
      selectedStatusFilter === "all"
    ) {
      return overallSummary;
    }
    const p = filteredAttendance.filter((r) => r.status === "present").length;
    const a = filteredAttendance.filter((r) => r.status === "absent").length;
    const l = filteredAttendance.filter((r) => r.status === "late").length;
    const e = filteredAttendance.filter((r) => r.status === "permission").length;
    const total = filteredAttendance.length;
    const rate = total > 0 ? Math.round(((p + l + e) / total) * 100) : 0;
    return {
      presentCount: p,
      absentCount: a,
      lateCount: l,
      permissionCount: e,
      recordedSessions: total,
      attendanceRate: rate,
    };
  }, [
    overallSummary,
    filterMonth,
    filterDateFrom,
    filterDateTo,
    selectedClassFilter,
    selectedStatusFilter,
    filteredAttendance,
  ]);

  const handleOpenMonthlyReportModal = () => {
    setIsReportModalOpen(true);
  };

  const handleGenerateMonthlyReport = () => {
    if (!studentId || !reportMonth) return;
    setIsReportModalOpen(false);
    const query = reportEnrollmentId ? `?enrollmentId=${reportEnrollmentId}` : "";
    navigate(`/student-attendance/${studentId}/monthly/${reportMonth}${query}`);
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center space-y-3">
        <Loader2 className="h-9 w-9 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-khmer">
          {t("common.loading", { defaultValue: "កំពុងទាញយកទិន្នន័យប្រវត្តិសិស្ស..." })}
        </p>
      </div>
    );
  }

  if (isUnauthorized) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
        <div className="h-16 w-16 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-bold text-foreground font-khmer">
          {t("studentAttendance.unauthorized", { defaultValue: "គ្មានសិទ្ធិចូលមើលទិន្នន័យសិស្សនេះទេ" })}
        </h2>
        <p className="text-xs text-muted-foreground">
          {t("studentAttendance.unauthorizedDesc", {
            defaultValue: "អ្នកអាចមើលបានតែប្រវត្តិវត្តមានរបស់សិស្សដែលស្ថិតក្នុងថ្នាក់ដែលអ្នកត្រូវបានចាត់តាំងប៉ុណ្ណោះ។",
          })}
        </p>
        <Button onClick={() => navigate("/student-attendance")} variant="outline" className="rounded-xl gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span>{t("common.back", { defaultValue: "ត្រឡប់ក្រោយ" })}</span>
        </Button>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="py-20 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
        <h3 className="text-base font-bold font-khmer">{t("studentAttendance.notFound", { defaultValue: "រកមិនឃើញសិស្សនេះទេ" })}</h3>
        <Button onClick={() => navigate("/student-attendance")} variant="outline">
          {t("common.back", { defaultValue: "ត្រឡប់ក្រោយ" })}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Profile Header & Top Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border/80">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/student-attendance")}
            className="rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <Avatar className="h-14 w-14 ring-2 ring-primary/20 shrink-0">
            <AvatarImage src={student.avatarUrl} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
              {student.nameKh?.charAt(0) || "S"}
            </AvatarFallback>
          </Avatar>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground font-khmer">
                {student.nameKh}
              </h1>
              <Badge variant="outline" className="font-mono text-xs font-semibold px-2 py-0.5">
                {student.studentCode}
              </Badge>
              <Badge
                variant={student.status === "active" ? "success" : "secondary"}
                className="text-[10px] py-0 px-2"
              >
                {student.status === "active"
                  ? t("status.active", { defaultValue: "Active" })
                  : t("status.inactive", { defaultValue: "Inactive" })}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
              {student.nameEn && <span>{student.nameEn}</span>}
              <span>•</span>
              <span>
                {t("studentAttendance.gender", { defaultValue: "Gender" })}:{" "}
                {student.gender === "female"
                  ? t("studentAttendance.female", { defaultValue: "Female" })
                  : t("studentAttendance.male", { defaultValue: "Male" })}
              </span>
              {student.phone && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="h-3 w-3" />
                    {student.phone}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Button: View Monthly Report */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleOpenMonthlyReportModal}
            className="gap-2 h-10 px-4 rounded-xl bg-[#1E347B] hover:bg-[#263E89] text-white font-semibold shadow-xs"
          >
            <FileText className="h-4 w-4 text-[#F3B51B]" />
            <span>{t("studentAttendance.viewMonthlyReport", { defaultValue: "របាយការណ៍ប្រចាំខែសិស្ស" })}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 2. Attendance Summary Cards (Calculated strictly from recorded expected sessions) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Present */}
        <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground font-khmer">
                {t("studentAttendance.present", { defaultValue: "វត្តមាន (P)" })}
              </p>
              <h3 className="text-xl font-bold text-emerald-600 mt-0.5 font-mono">
                {isKm ? toKhmerNum(effectiveSummary.presentCount) : effectiveSummary.presentCount}
              </h3>
            </div>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
          </CardContent>
        </Card>

        {/* Absent */}
        <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground font-khmer">
                {t("studentAttendance.absent", { defaultValue: "អវត្តមាន (A)" })}
              </p>
              <h3 className="text-xl font-bold text-rose-600 mt-0.5 font-mono">
                {isKm ? toKhmerNum(effectiveSummary.absentCount) : effectiveSummary.absentCount}
              </h3>
            </div>
            <div className="h-9 w-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600">
              <XCircle className="h-4.5 w-4.5" />
            </div>
          </CardContent>
        </Card>

        {/* Late */}
        <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground font-khmer">
                {t("studentAttendance.late", { defaultValue: "យឺត (L)" })}
              </p>
              <h3 className="text-xl font-bold text-amber-600 mt-0.5 font-mono">
                {isKm ? toKhmerNum(effectiveSummary.lateCount) : effectiveSummary.lateCount}
              </h3>
            </div>
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Clock3 className="h-4.5 w-4.5" />
            </div>
          </CardContent>
        </Card>

        {/* Permission */}
        <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground font-khmer">
                {t("studentAttendance.permission", { defaultValue: "ច្បាប់ (E)" })}
              </p>
              <h3 className="text-xl font-bold text-blue-600 mt-0.5 font-mono">
                {isKm ? toKhmerNum(effectiveSummary.permissionCount) : effectiveSummary.permissionCount}
              </h3>
            </div>
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <AlertCircle className="h-4.5 w-4.5" />
            </div>
          </CardContent>
        </Card>

        {/* Recorded Sessions */}
        <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground font-khmer">
                {t("studentAttendance.recordedSessions", { defaultValue: "វគ្គកត់វត្តមាន" })}
              </p>
              <h3 className="text-xl font-bold text-foreground mt-0.5 font-mono">
                {isKm ? toKhmerNum(effectiveSummary.recordedSessions) : effectiveSummary.recordedSessions}
              </h3>
            </div>
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <History className="h-4.5 w-4.5" />
            </div>
          </CardContent>
        </Card>

        {/* Attendance Rate */}
        <Card className="rounded-2xl border-border/80 shadow-xs bg-linear-to-br from-primary/5 to-brand-gold/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground font-khmer">
                {t("studentAttendance.attendanceRate", { defaultValue: "អត្រាវត្តមានសរុប" })}
              </p>
              <h3 className="text-xl font-extrabold text-primary mt-0.5 font-mono">
                {isKm ? `${toKhmerNum(effectiveSummary.attendanceRate)}%` : `${effectiveSummary.attendanceRate}%`}
              </h3>
            </div>
            <div className="h-9 w-9 rounded-xl bg-brand-gold/20 flex items-center justify-center text-amber-700">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Chronological Enrollment History Section */}
      <Card className="border border-border/80 shadow-xs rounded-2xl bg-card">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-sm font-bold font-khmer text-foreground flex items-center gap-2">
            <School className="h-4 w-4 text-primary" />
            <span>{t("studentAttendance.enrollmentHistory", { defaultValue: "ប្រវត្តិចុះឈ្មោះចូលរៀន" })}</span>
            <Badge variant="secondary" className="font-mono text-xs px-2 py-0">
              {isKm ? toKhmerNum(enrollments.length) : enrollments.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          {enrollments.length === 0 ? (
            <p className="text-xs text-muted-foreground italic text-center py-4">
              {t("studentAttendance.noEnrollments", { defaultValue: "មិនមានប្រវត្តិចុះឈ្មោះចូលរៀនទេ" })}
            </p>
          ) : (
            <div
              className={cn(
                "grid gap-3.5",
                enrollments.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
              )}
            >
              {enrollments.map((item) => {
                const { enrollment, classroom, studyPackage, teacher } = item;
                const isSelected = selectedClassFilter === classroom?.id;
                const cName = classroom?.name || "Unknown Class";
                const pkgName = studyPackage
                  ? isKm
                    ? (studyPackage.nameKh || studyPackage.nameEn)
                    : (studyPackage.nameEn || studyPackage.nameKh)
                  : "—";

                return (
                  <div
                    key={enrollment.id}
                    onClick={() => {
                      if (classroom?.id) {
                        setSelectedClassFilter(isSelected ? "all" : classroom.id);
                      }
                    }}
                    className={cn(
                      "p-3.5 rounded-xl border transition-all cursor-pointer text-xs space-y-2",
                      isSelected
                        ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/30"
                        : "bg-muted/20 border-border/70 hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-foreground font-khmer">
                          {cName}
                        </h4>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {classroom?.code}
                        </span>
                      </div>
                      <Badge
                        variant={
                          enrollment.status === "active"
                            ? "success"
                            : enrollment.status === "transferred"
                            ? "gold"
                            : enrollment.status === "completed"
                            ? "default"
                            : "secondary"
                        }
                        className="text-[10px] py-0 px-1.5 shrink-0"
                      >
                        {enrollment.status === "active"
                          ? t("status.active", { defaultValue: "Active" })
                          : enrollment.status === "completed"
                          ? t("classes.statusCompleted", { defaultValue: "Completed" })
                          : enrollment.status === "transferred"
                          ? t("transfer.transferredBadge", { defaultValue: "Transferred" })
                          : enrollment.status}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                      <div className="flex justify-between">
                        <span>{t("studentAttendance.package", { defaultValue: "កញ្ចប់សិក្សា" })}:</span>
                        <span className="font-medium text-foreground truncate max-w-[200px]">
                          {pkgName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("studentAttendance.teacher", { defaultValue: "គ្រូបង្រៀន" })}:</span>
                        <span className="font-medium text-foreground">{teacher?.name || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("studentAttendance.startDate", { defaultValue: "ថ្ងៃចាប់ផ្តើម" })}:</span>
                        <span className="font-mono text-foreground">{enrollment.startDate || "—"}</span>
                      </div>
                      {enrollment.actualEndDate && (
                        <div className="flex justify-between text-amber-700 dark:text-amber-400">
                          <span>{t("studentAttendance.endDate", { defaultValue: "ថ្ងៃបញ្ចប់/ផ្ទេរ" })}:</span>
                          <span className="font-mono font-semibold">{enrollment.actualEndDate}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Detailed Attendance Timeline / Table */}
      <Card className="border border-border/80 shadow-xs rounded-2xl bg-card">
        <div className="p-4 sm:p-5 border-b border-border/70 flex flex-col md:flex-row md:items-center justify-between gap-3.5 bg-muted/20">
          <div className="flex items-center gap-2 shrink-0">
            <History className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold font-khmer text-foreground">
              {t("studentAttendance.attendanceTimeline", { defaultValue: "ប្រវត្តិវត្តមានលម្អិត" })}
            </h3>
            <Badge variant="secondary" className="font-mono text-xs px-2 py-0">
              {isKm ? toKhmerNum(filteredAttendance.length) : filteredAttendance.length}
            </Badge>
          </div>

          {/* Responsive Quick Filters Row without clipping */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Class Filter */}
            <div className="min-w-[140px] shrink-0">
              <Select value={selectedClassFilter} onValueChange={setSelectedClassFilter}>
                <SelectTrigger className="h-8 rounded-lg bg-background border-border/80 text-xs w-full">
                  <SelectValue placeholder={t("studentAttendance.allClasses", { defaultValue: "ថ្នាក់ទាំងអស់" })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    {t("studentAttendance.allClasses", { defaultValue: "ថ្នាក់ទាំងអស់" })}
                  </SelectItem>
                  {enrollments.map((e) => (
                    <SelectItem key={e.enrollment.id} value={e.classroom?.id || ""} className="text-xs">
                      {e.classroom?.name || "Class"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="min-w-[120px] shrink-0">
              <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
                <SelectTrigger className="h-8 rounded-lg bg-background border-border/80 text-xs w-full">
                  <SelectValue placeholder={t("studentAttendance.allStatuses", { defaultValue: "ស្ថានភាព" })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">{t("studentAttendance.allStatuses", { defaultValue: "ទាំងអស់" })}</SelectItem>
                  <SelectItem value="present" className="text-xs text-emerald-600">P - {t("studentAttendance.present", { defaultValue: "វត្តមាន" })}</SelectItem>
                  <SelectItem value="absent" className="text-xs text-rose-600">A - {t("studentAttendance.absent", { defaultValue: "អវត្តមាន" })}</SelectItem>
                  <SelectItem value="late" className="text-xs text-amber-600">L - {t("studentAttendance.late", { defaultValue: "យឺត" })}</SelectItem>
                  <SelectItem value="permission" className="text-xs text-blue-600">E - {t("studentAttendance.permission", { defaultValue: "ច្បាប់" })}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Month Filter */}
            <div className="min-w-[140px] shrink-0">
              <Input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                aria-label={t("studentAttendance.filterByDate", { defaultValue: "Filter by month" })}
                className="h-8 rounded-lg bg-background border-border/80 text-xs w-full"
              />
            </div>

            {(selectedClassFilter !== "all" || selectedStatusFilter !== "all" || filterMonth) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedClassFilter("all");
                  setSelectedStatusFilter("all");
                  setFilterMonth("");
                }}
                className="h-8 text-xs text-muted-foreground hover:text-foreground shrink-0"
              >
                {t("studentAttendance.resetFilter", { defaultValue: "កំណត់ឡើងវិញ" })}
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#1E347B] text-white">
                <th className="py-2.5 px-4 font-semibold text-center w-12">#</th>
                <th className="py-2.5 px-4 font-semibold w-28">
                  {t("studentAttendance.date", { defaultValue: "កាលបរិច្ឆេទ" })}
                </th>
                <th className="py-2.5 px-3 font-semibold min-w-[140px]">
                  {t("studentAttendance.class", { defaultValue: "ថ្នាក់រៀន" })}
                </th>
                <th className="py-2.5 px-3 font-semibold text-center w-28">
                  {t("studentAttendance.status", { defaultValue: "ស្ថានភាព" })}
                </th>
                <th className="py-2.5 px-4 font-semibold min-w-[150px]">
                  {t("studentAttendance.remark", { defaultValue: "ចំណាំ / មូលហេតុ" })}
                </th>
                <th className="py-2.5 px-3 font-semibold w-36">
                  {t("studentAttendance.recordedBy", { defaultValue: "កត់ត្រាដោយ" })}
                </th>
                {(user?.role === "super_admin" || user?.role === "admin") && (
                  <th className="py-2.5 px-3 font-semibold text-right w-24">
                    {t("common.actions", { defaultValue: "សកម្មភាព" })}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td
                    colSpan={(user?.role === "super_admin" || user?.role === "admin") ? 7 : 6}
                    className="py-12 text-center text-muted-foreground font-khmer text-xs"
                  >
                    {t("studentAttendance.noAttendanceRecords", {
                      defaultValue: "មិនមានកំណត់ត្រាវត្តមានត្រូវនឹងលក្ខខណ្ឌនេះទេ",
                    })}
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((rec, index) => {
                  const isEven = index % 2 === 0;

                  return (
                    <tr
                      key={rec.id || index}
                      className={cn(
                        "transition-colors hover:bg-primary/5",
                        isEven ? "bg-card" : "bg-muted/15"
                      )}
                    >
                      <td className="py-2.5 px-4 text-center font-mono text-muted-foreground">
                        {isKm ? toKhmerNum(index + 1) : index + 1}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-semibold text-foreground">
                        {rec.attendanceDate}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-foreground block truncate">
                          {rec.classroomName || "—"}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {rec.classroomCode}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {rec.status === "present" ? (
                          <Badge variant="success" className="text-[11px] font-bold py-0.5 px-2">
                            P - {t("studentAttendance.present", { defaultValue: "វត្តមាន" })}
                          </Badge>
                        ) : rec.status === "absent" ? (
                          <Badge variant="destructive" className="text-[11px] font-bold py-0.5 px-2">
                            A - {t("studentAttendance.absent", { defaultValue: "អវត្តមាន" })}
                          </Badge>
                        ) : rec.status === "late" ? (
                          <Badge variant="warning" className="text-[11px] font-bold py-0.5 px-2">
                            L - {t("studentAttendance.late", { defaultValue: "យឺត" })}
                          </Badge>
                        ) : (
                          <Badge variant="info" className="text-[11px] font-bold py-0.5 px-2">
                            E - {t("studentAttendance.permission", { defaultValue: "ច្បាប់" })}
                          </Badge>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground">
                        {rec.remark ? (
                          <span className="text-foreground">{rec.remark}</span>
                        ) : (
                          <span className="italic text-muted-foreground/60">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground text-[11px]">
                        {rec.recordedByName || rec.recordedBy || "—"}
                      </td>
                      {(user?.role === "super_admin" || user?.role === "admin") && (
                        <td className="py-2.5 px-3 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRecordForCorrection(rec);
                              setIsCorrectionModalOpen(true);
                            }}
                            className="h-7 px-2 text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 font-medium gap-1"
                            title={t("attendanceCorrection.buttonLabel", { defaultValue: "Correct Attendance" })}
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>{t("attendanceCorrection.buttonLabel", { defaultValue: "Correct" })}</span>
                          </Button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 5. Monthly Student Report Dialog */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-khmer flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span>{t("studentAttendance.monthlyReportDialogTitle", { defaultValue: "របាយការណ៍វត្តមានប្រចាំខែរបស់សិស្ស" })}</span>
            </DialogTitle>
            <DialogDescription className="text-xs font-khmer">
              {t("studentAttendance.monthlyReportDialogDesc", {
                defaultValue: "ជ្រើសរើសខែ និងថ្នាក់រៀនដើម្បីបង្កើតរបាយការណ៍វត្តមានផ្ទាល់ខ្លួនប្រចាំខែ។",
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            {/* Month Picker */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>{t("studentAttendance.selectMonth", { defaultValue: "ជ្រើសរើសខែ / ឆ្នាំ *" })}</span>
              </Label>
              <Input
                type="month"
                value={reportMonth}
                onChange={(e) => setReportMonth(e.target.value)}
                className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
              />
            </div>

            {/* Enrollment Select (Only shown if student has more than 1 enrollment) */}
            {enrollments.length > 1 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <School className="h-3.5 w-3.5 text-primary" />
                  <span>{t("studentAttendance.selectEnrollment", { defaultValue: "ជ្រើសរើសថ្នាក់រៀន *" })}</span>
                </Label>
                <Select value={reportEnrollmentId} onValueChange={setReportEnrollmentId}>
                  <SelectTrigger className="h-10 rounded-xl bg-background border-border/80 text-xs">
                    <SelectValue placeholder={t("studentAttendance.selectClassPlaceholder", { defaultValue: "ជ្រើសរើសថ្នាក់..." })} />
                  </SelectTrigger>
                  <SelectContent>
                    {enrollments.map((e) => {
                      const statusLabel =
                        e.enrollment.status === "active"
                          ? t("status.active", { defaultValue: "Active" })
                          : e.enrollment.status === "completed"
                          ? t("classes.statusCompleted", { defaultValue: "Completed" })
                          : e.enrollment.status === "transferred"
                          ? t("transfer.transferredBadge", { defaultValue: "Transferred" })
                          : e.enrollment.status;

                      return (
                        <SelectItem key={e.enrollment.id} value={e.enrollment.id} className="text-xs">
                          {e.classroom?.name || "Class"} ({e.classroom?.code}) • {statusLabel}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsReportModalOpen(false)}
              className="rounded-xl text-xs"
            >
              {t("common.cancel", { defaultValue: "បោះបង់" })}
            </Button>
            <Button
              onClick={handleGenerateMonthlyReport}
              disabled={!reportMonth}
              className="rounded-xl bg-[#1E347B] hover:bg-[#263E89] text-white font-semibold text-xs gap-1.5"
            >
              <Eye className="h-3.5 w-3.5 text-[#F3B51B]" />
              <span>{t("studentAttendance.openPreview", { defaultValue: "មើលរបាយការណ៍" })}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attendance Correction Modal */}
      {selectedRecordForCorrection && (
        <AttendanceCorrectionDialog
          open={isCorrectionModalOpen}
          onOpenChange={setIsCorrectionModalOpen}
          attendanceDocId={selectedRecordForCorrection.attendanceDocId || selectedRecordForCorrection.id}
          attendanceId={selectedRecordForCorrection.attendanceDocId || selectedRecordForCorrection.id}
          classroomId={selectedRecordForCorrection.classroomId}
          studentId={selectedRecordForCorrection.studentId}
          attendanceDate={selectedRecordForCorrection.attendanceDate}
          previousStatus={selectedRecordForCorrection.status}
          student={student || undefined}
          onSuccess={loadStudentHistory}
        />
      )}
    </div>
  );
};
