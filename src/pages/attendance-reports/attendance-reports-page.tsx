import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileSpreadsheet,
  Calendar,
  School,
  BookOpen,
  GraduationCap,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Sparkles,
  Filter,
  Eye,
  Globe,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { classroomService } from "@/services/classroom.service";
import { studyPackageService } from "@/services/study-package.service";
import { userService } from "@/services/user.service";
import { attendanceReportService, toKhmerNumber } from "@/services/attendance-report.service";
import { exportAttendanceReportToExcel } from "@/lib/attendance-report-excel";
import { Classroom } from "@/models/classroom.model";
import { StudyPackage } from "@/models/study-package.model";
import { User } from "@/models/user.model";
import { MonthlyAttendanceReportData } from "@/models/attendance-report.model";
import { AttendanceStatus } from "@/models/attendance.model";
import { getCambodiaToday } from "@/lib/attendance-time-lock";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MonthlyAttendanceMatrixTable } from "@/components/attendance-reports/monthly-attendance-matrix-table";
import { AttendanceCorrectionDialog } from "@/components/attendance-corrections/attendance-correction-dialog";

export const AttendanceReportsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { currentBranchId, isAllBranches } = useBranch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const isTeacher = user?.role === "teacher";
  const isAdmin = user?.role === "super_admin" || user?.role === "admin";

  // URL query params fallback
  const queryClassId = searchParams.get("classId");
  const queryMonth = searchParams.get("month");

  // Form selections
  const [selectedClassId, setSelectedClassId] = useState<string>(queryClassId || "");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    queryMonth || (() => getCambodiaToday().substring(0, 7))
  );
  const [reportLanguage, setReportLanguage] = useState<"km" | "en">(
    i18n.language === "km" ? "km" : "en"
  );

  // Metadata
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [packages, setPackages] = useState<StudyPackage[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);

  // Summary Metrics loaded on setup page
  const [summaryReportData, setSummaryReportData] = useState<MonthlyAttendanceReportData | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Attendance Correction Dialog State
  const [correctionTarget, setCorrectionTarget] = useState<{
    attendanceDocId?: string;
    student: any;
    date: string;
    previousStatus: AttendanceStatus | null;
  } | null>(null);
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);

  useEffect(() => {
    setReportLanguage(i18n.language === "km" ? "km" : "en");
  }, [i18n.language]);

  // Load classrooms, packages, teachers with Branch scoping
  const loadMetadata = useCallback(async () => {
    setIsLoadingMetadata(true);
    try {
      const [allClasses, allPackages, allUsers] = await Promise.all([
        classroomService.getClassrooms(),
        studyPackageService.getStudyPackages(),
        userService.getUsers(),
      ]);

      const branchScopedClasses = !isAllBranches && currentBranchId
        ? allClasses.filter((c) => c.branchId === currentBranchId)
        : allClasses;

      const accessibleClasses = isTeacher
        ? branchScopedClasses.filter((c) => c.assignedTeacherId === user?.id)
        : branchScopedClasses;

      setClassrooms(accessibleClasses);
      setPackages(allPackages);
      setTeachers(allUsers);

      // Auto-select classroom
      if (accessibleClasses.length > 0) {
        setSelectedClassId((prev) => {
          if (queryClassId && accessibleClasses.some((c) => c.id === queryClassId)) {
            return queryClassId;
          }
          if (!prev || !accessibleClasses.some((c) => c.id === prev)) {
            return accessibleClasses[0].id;
          }
          return prev;
        });
      } else {
        setSelectedClassId("");
      }
    } catch (e) {
      console.error("Failed to load metadata:", e);
      toast.error(t("attendanceReports.fetchError", { defaultValue: "មិនអាចទាញយកទិន្នន័យថ្នាក់រៀនបានទេ" }));
    } finally {
      setIsLoadingMetadata(false);
    }
  }, [isTeacher, user?.id, isAllBranches, currentBranchId, queryClassId, t]);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  // Fetch summary report metrics and matrix data
  const fetchSummary = useCallback(async () => {
    if (!selectedClassId || !selectedMonth) {
      setSummaryReportData(null);
      return;
    }

    setIsLoadingSummary(true);
    try {
      const data = await attendanceReportService.generateMonthlyReport(
        selectedClassId,
        selectedMonth,
        user?.name
      );
      setSummaryReportData(data);
    } catch (e) {
      console.error("Failed to load summary metrics:", e);
      setSummaryReportData(null);
    } finally {
      setIsLoadingSummary(false);
    }
  }, [selectedClassId, selectedMonth, user?.name]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const selectedClassroom = useMemo(() => {
    return classrooms.find((c) => c.id === selectedClassId) || null;
  }, [classrooms, selectedClassId]);

  const selectedPackage = useMemo(() => {
    if (!selectedClassroom) return null;
    return packages.find((p) => p.id === selectedClassroom.packageId) || null;
  }, [selectedClassroom, packages]);

  const selectedTeacher = useMemo(() => {
    if (!selectedClassroom) return null;
    return teachers.find((u) => u.id === selectedClassroom.assignedTeacherId) || null;
  }, [selectedClassroom, teachers]);

  const isWeekday = selectedClassroom?.scheduleDays?.length === 5;
  const scheduleText = selectedClassroom
    ? isWeekday
      ? t("classes.mondayToFriday", { defaultValue: "ចន្ទ ដល់ សុក្រ" })
      : t("classes.saturdaySunday", { defaultValue: "សៅរ៍ និង អាទិត្យ" })
    : "";

  // Navigate to full Preview Route
  const handleViewMonthlyReport = () => {
    if (!selectedClassId || !selectedMonth) {
      toast.warning(t("attendanceReports.selectClassroomWarning", { defaultValue: "សូមជ្រើសរើសថ្នាក់រៀន និងខែជាមុនសិន" }));
      return;
    }

    navigate(`/attendance-reports/monthly/${selectedClassId}/${selectedMonth}`);
  };

  // Quick export Excel from setup page
  const handleExportExcel = async () => {
    if (!summaryReportData) {
      if (!selectedClassId || !selectedMonth) return;
      try {
        setIsExportingExcel(true);
        const data = await attendanceReportService.generateMonthlyReport(
          selectedClassId,
          selectedMonth,
          user?.name
        );
        await exportAttendanceReportToExcel(data, reportLanguage);
        toast.success(t("attendanceReports.exportSuccess", { defaultValue: "បានទាញយកឯកសារ Excel ជោគជ័យ" }));
      } catch (e) {
        console.error(e);
        toast.error(t("attendanceReports.exportError", { defaultValue: "មិនអាចទាញយកឯកសារ Excel បានទេ" }));
      } finally {
        setIsExportingExcel(false);
      }
      return;
    }

    try {
      setIsExportingExcel(true);
      await exportAttendanceReportToExcel(summaryReportData, reportLanguage);
      toast.success(t("attendanceReports.exportSuccess", { defaultValue: "បានទាញយកឯកសារ Excel ជោគជ័យ" }));
    } catch (e) {
      console.error(e);
      toast.error(t("attendanceReports.exportError", { defaultValue: "មិនអាចទាញយកឯកសារ Excel បានទេ" }));
    } finally {
      setIsExportingExcel(false);
    }
  };

  const isKm = reportLanguage === "km";

  return (
    <div className="space-y-6 max-w-full mx-auto">
      {/* Page Header */}
      <PageHeader
        title={t("attendanceReports.title", { defaultValue: "របាយការណ៍វត្តមានប្រចាំខែ" })}
        description={t("attendanceReports.subtitle", {
          defaultValue: "រៀបចំ និងពិនិត្យមើលសេចក្តីសង្ខេបវត្តមានសិស្សប្រចាំខែតាមថ្នាក់រៀន",
        })}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={!selectedClassId || !selectedMonth || isExportingExcel}
            className="gap-1.5 h-9 rounded-xl border-border/80 shadow-xs font-medium"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>
              {isExportingExcel
                ? t("common.loading", { defaultValue: "កំពុងដំណើរការ..." })
                : t("attendanceReports.exportExcel", { defaultValue: "ទាញយក Excel (.xlsx)" })}
            </span>
          </Button>

          <Button
            onClick={handleViewMonthlyReport}
            disabled={!selectedClassId || !selectedMonth}
            className="gap-2 h-9 rounded-xl bg-[#1E347B] hover:bg-[#263E89] text-white font-semibold shadow-xs"
          >
            <Eye className="h-4 w-4 text-[#F3B51B]" />
            <span>{t("attendanceReports.viewMonthlyReport", { defaultValue: "មើលរបាយការណ៍ប្រចាំខែ" })}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </PageHeader>

      {/* 1. Report Filters Card */}
      <Card className="border border-border/80 shadow-xs rounded-2xl bg-card">
        <CardContent className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Filter className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold font-khmer text-foreground">
                {t("attendanceReports.filtersTitle", { defaultValue: "កំណត់លក្ខខណ្ឌរបាយការណ៍" })}
              </h2>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border/60">
              <Globe className="h-3.5 w-3.5 text-muted-foreground ml-1.5" />
              <button
                type="button"
                onClick={() => setReportLanguage("km")}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-lg font-medium transition-all font-khmer",
                  reportLanguage === "km"
                    ? "bg-white text-primary shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                ភាសាខ្មែរ
              </button>
              <button
                type="button"
                onClick={() => setReportLanguage("en")}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-lg font-medium transition-all",
                  reportLanguage === "en"
                    ? "bg-white text-primary shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                English
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Classroom Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold font-khmer flex items-center gap-1.5 text-foreground">
                <School className="h-3.5 w-3.5 text-primary" />
                <span>{t("attendanceReports.selectClassroom", { defaultValue: "ជ្រើសរើសថ្នាក់រៀន *" })}</span>
              </Label>
              <Select
                value={selectedClassId}
                onValueChange={(val) => {
                  setSelectedClassId(val);
                  setSearchParams({ classId: val, month: selectedMonth });
                }}
                disabled={isLoadingMetadata || classrooms.length === 0}
              >
                <SelectTrigger className="h-10 rounded-xl bg-background border-border/80">
                  <SelectValue
                    placeholder={
                      isLoadingMetadata
                        ? t("common.loading", { defaultValue: "កំពុងផ្ទុក..." })
                        : t("attendanceReports.selectClassroomPlaceholder", { defaultValue: "ជ្រើសរើសថ្នាក់..." })
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {classrooms.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs py-2">
                      <div className="flex flex-col text-left">
                        <span className="font-semibold text-foreground">{c.name}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {c.code} • {c.startTime} - {c.endTime}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month Picker */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold font-khmer flex items-center gap-1.5 text-foreground">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>{t("attendanceReports.selectMonth", { defaultValue: "ជ្រើសរើសខែ / ឆ្នាំ *" })}</span>
              </Label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setSearchParams({ classId: selectedClassId, month: e.target.value });
                }}
                className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
              />
            </div>

            {/* Primary Action Button */}
            {/* <div className="flex items-end">
              <Button
                onClick={handleViewMonthlyReport}
                disabled={!selectedClassId || !selectedMonth}
                className="h-10 w-full rounded-xl bg-[#1E347B] hover:bg-[#263E89] text-white font-semibold shadow-sm gap-2 text-xs"
              >
                <Eye className="h-4 w-4 text-[#F3B51B]" />
                <span>{t("attendanceReports.viewMonthlyReport", { defaultValue: "មើលរបាយការណ៍ប្រចាំខែ" })}</span>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </div> */}
          </div>

          {/* 2. Compact Classroom Information Summary */}
          {selectedClassroom && (
            <div className="pt-2 border-t border-border/60">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                    {t("attendanceReports.classInformation", { defaultValue: "ថ្នាក់រៀន" })}
                  </span>
                  <span className="font-bold text-foreground truncate block">
                    {selectedClassroom.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground ">
                    {selectedClassroom.code}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                    {t("sidebar.packages", { defaultValue: "កញ្ចប់សិក្សា" })}
                  </span>
                  <span className="font-semibold text-foreground truncate block">
                    {selectedPackage?.nameKh || selectedPackage?.nameEn || "—"}
                  </span>
                  <span className="text-[10px] text-primary font-medium">
                    {selectedPackage?.totalPlannedHours ? `${selectedPackage.totalPlannedHours} ម៉ោង` : ""}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                    {t("classes.teacher", { defaultValue: "គ្រូបង្រៀន" })}
                  </span>
                  <span className="font-semibold text-foreground truncate block">
                    {selectedTeacher?.name || "—"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    @{selectedTeacher?.username || ""}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                    {t("attendanceReports.scheduleType", { defaultValue: "ប្រភេទកាលវិភាគ" })}
                  </span>
                  <Badge variant={isWeekday ? "default" : "gold"} className="text-[10px] py-0 px-2 mt-0.5">
                    {scheduleText}
                  </Badge>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                    {t("classes.time", { defaultValue: "ម៉ោងសិក្សា" })}
                  </span>
                  <span className="font-semibold  text-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3 text-primary" />
                    {selectedClassroom.startTime} - {selectedClassroom.endTime}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                    {t("classes.startDate", { defaultValue: "ថ្ងៃចាប់ផ្តើម" })}
                  </span>
                  <span className=" text-foreground text-xs mt-0.5 block">
                    {selectedClassroom.startDate || "—"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. High-Level Summary Metrics Cards (Live on Setup page) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-bold font-khmer text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>{t("attendanceReports.monthlySummaryTitle", { defaultValue: "សេចក្តីសង្ខេបវត្តមានប្រចាំខែ" })}</span>
          </h3>
          {isLoadingSummary && (
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              {t("common.loading", { defaultValue: "កំពុងគណនា..." })}
            </span>
          )}
        </div>

        {summaryReportData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {/* Enrolled Students */}
              <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground font-khmer">
                      {t("attendanceReports.enrolledStudents", { defaultValue: "សិស្សសរុបក្នុងថ្នាក់" })}
                    </p>
                    <h3 className="text-xl font-bold text-foreground mt-0.5 ">
                      {isKm
                        ? toKhmerNumber(summaryReportData.summaryMetrics.totalEnrolledStudents)
                        : summaryReportData.summaryMetrics.totalEnrolledStudents}
                    </h3>
                  </div>
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Users className="h-4.5 w-4.5" />
                  </div>
                </CardContent>
              </Card>

              {/* Scheduled Sessions */}
              <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground font-khmer">
                      {t("attendanceReports.scheduledSessions", { defaultValue: "វគ្គសិក្សាគ្រោងទុក" })}
                    </p>
                    <h3 className="text-xl font-bold text-foreground mt-0.5 ">
                      {isKm
                        ? toKhmerNumber(summaryReportData.summaryMetrics.scheduledSessionsCount)
                        : summaryReportData.summaryMetrics.scheduledSessionsCount}
                    </h3>
                  </div>
                  <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <Calendar className="h-4.5 w-4.5" />
                  </div>
                </CardContent>
              </Card>

              {/* Recorded Sessions */}
              <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground font-khmer">
                      {t("attendanceReports.recordedSessions", { defaultValue: "វគ្គបានកត់វត្តមាន" })}
                    </p>
                    <h3 className="text-xl font-bold text-foreground mt-0.5 ">
                      {isKm
                        ? toKhmerNumber(summaryReportData.summaryMetrics.recordedSessionsCount)
                        : summaryReportData.summaryMetrics.recordedSessionsCount}
                    </h3>
                  </div>
                  <div className="h-9 w-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-primary">
                    <CheckCircle2 className="h-4.5 w-4.5" />
                  </div>
                </CardContent>
              </Card>

              {/* Overall Present */}
              <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground font-khmer">
                      {t("attendanceReports.present", { defaultValue: "វត្តមាន (P)" })}
                    </p>
                    <h3 className="text-xl font-bold text-emerald-600 mt-0.5 ">
                      {isKm
                        ? toKhmerNumber(summaryReportData.summaryMetrics.totalPresent)
                        : summaryReportData.summaryMetrics.totalPresent}
                    </h3>
                  </div>
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="h-4.5 w-4.5" />
                  </div>
                </CardContent>
              </Card>

              {/* Overall Absent */}
              <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground font-khmer">
                      {t("attendanceReports.absent", { defaultValue: "អវត្តមាន (A)" })}
                    </p>
                    <h3 className="text-xl font-bold text-rose-600 mt-0.5 ">
                      {isKm
                        ? toKhmerNumber(summaryReportData.summaryMetrics.totalAbsent)
                        : summaryReportData.summaryMetrics.totalAbsent}
                    </h3>
                  </div>
                  <div className="h-9 w-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600">
                    <XCircle className="h-4.5 w-4.5" />
                  </div>
                </CardContent>
              </Card>

              {/* Overall Attendance Rate */}
              <Card className="rounded-2xl border-border/80 shadow-xs bg-linear-to-br from-primary/5 to-brand-gold/10">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground font-khmer">
                      {t("attendanceReports.attendanceRate", { defaultValue: "អត្រាវត្តមានសរុប" })}
                    </p>
                    <h3 className="text-xl font-extrabold text-primary mt-0.5 ">
                      {isKm
                        ? `${toKhmerNumber(summaryReportData.summaryMetrics.overallAttendanceRate)}%`
                        : `${summaryReportData.summaryMetrics.overallAttendanceRate}%`}
                    </h3>
                  </div>
                  <div className="h-9 w-9 rounded-xl bg-brand-gold/20 flex items-center justify-center text-amber-700">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Attendance Matrix Table */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold font-khmer text-foreground">
                  {isKm
                    ? `តារាងវត្តមានលម្អិតសម្រាប់ខែ ${summaryReportData.monthNameKm}`
                    : `Monthly Attendance Details for ${summaryReportData.monthNameEn}`}
                </h3>
              </div>
              <MonthlyAttendanceMatrixTable
                reportData={summaryReportData}
                language={reportLanguage}
                isAdmin={isAdmin}
                onCorrectRecord={(target) => {
                  setCorrectionTarget(target);
                  setIsCorrectionOpen(true);
                }}
              />
            </div>
          </div>
        ) : (
          <Card className="border border-dashed border-border rounded-2xl bg-card/60 p-8 text-center">
            <div className="max-w-md mx-auto space-y-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold font-khmer text-foreground">
                {t("attendanceReports.selectClassroomAndMonthPrompt", {
                  defaultValue: "សូមជ្រើសរើសថ្នាក់រៀន និងខែដើម្បីពិនិត្យមើលសេចក្តីសង្ខេប",
                })}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("attendanceReports.setupHint", {
                  defaultValue: "បន្ទាប់ពីជ្រើសរើសរួច អ្នកអាចចុច \"មើលរបាយការណ៍ប្រចាំខែ\" ដើម្បីពិនិត្យមើលតារាងវត្តមានលម្អិត និងបោះពុម្ពជា PDF។",
                })}
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Attendance Correction Dialog */}
      {correctionTarget && selectedClassId && isAdmin && (
        <AttendanceCorrectionDialog
          open={isCorrectionOpen}
          onOpenChange={setIsCorrectionOpen}
          attendanceDocId={correctionTarget.attendanceDocId}
          attendanceId={correctionTarget.attendanceDocId}
          classroomId={selectedClassId}
          studentId={correctionTarget.student?.id || ""}
          attendanceDate={correctionTarget.date}
          previousStatus={correctionTarget.previousStatus}
          student={correctionTarget.student}
          onSuccess={() => {
            fetchSummary();
          }}
        />
      )}
    </div>
  );
};
