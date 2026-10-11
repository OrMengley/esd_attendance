import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth-context";
import { useSchoolSettings } from "@/hooks/use-school-settings";
import { attendanceReportService, toKhmerNumber } from "@/services/attendance-report.service";
import { exportAttendanceReportToExcel } from "@/lib/attendance-report-excel";
import { MonthlyAttendanceReportData } from "@/models/attendance-report.model";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Printer,
  FileSpreadsheet,
  Globe,
  Loader2,
  AlertCircle,
  ShieldAlert,
  Calendar,
  Clock,
  School,
  BookOpen,
  User as UserIcon,
  Edit3,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AttendanceCorrectionDialog } from "@/components/attendance-corrections/attendance-correction-dialog";
import { AttendanceStatus } from "@/models/attendance.model";
import { getCambodiaToday } from "@/lib/attendance-time-lock";

export const MonthlyReportPreviewPage: React.FC = () => {
  const { classroomId, yearMonth } = useParams<{ classroomId: string; yearMonth: string }>();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const schoolSettings = useSchoolSettings();
  const navigate = useNavigate();

  const [reportData, setReportData] = useState<MonthlyAttendanceReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  const [reportLanguage, setReportLanguage] = useState<"km" | "en">(
    i18n.language === "km" ? "km" : "en"
  );

  // Correction state
  const [correctionTarget, setCorrectionTarget] = useState<{
    attendanceDocId?: string;
    student: any;
    date: string;
    previousStatus: AttendanceStatus | null;
  } | null>(null);
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const cambodiaToday = getCambodiaToday();
  const isAdmin = user?.role === "super_admin" || user?.role === "admin";

  useEffect(() => {
    if (!classroomId || !yearMonth) {
      setErrorMessage("INVALID_PARAMETERS");
      setIsLoading(false);
      return;
    }

    loadReport();
  }, [classroomId, yearMonth, user]);

  const loadReport = async () => {
    if (!classroomId || !yearMonth) return;
    setIsLoading(true);
    setErrorMessage(null);
    setIsUnauthorized(false);

    try {
      const data = await attendanceReportService.generateMonthlyReport(
        classroomId,
        yearMonth,
        user?.name
      );

      // Teacher permission check: teacher can only see their own assigned classes
      if (user?.role === "teacher") {
        const isAssigned =
          data.classroom.assignedTeacherId === user.id ||
          user.assignedClassroomIds?.includes(data.classroom.id);

        if (!isAssigned) {
          setIsUnauthorized(true);
          setIsLoading(false);
          return;
        }
      }

      setReportData(data);
    } catch (e: any) {
      console.error("Failed to load monthly report preview:", e);
      if (e.message === "CLASSROOM_NOT_FOUND") {
        setErrorMessage("CLASSROOM_NOT_FOUND");
      } else {
        setErrorMessage("LOAD_ERROR");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/attendance-reports?classId=${classroomId || ""}&month=${yearMonth || ""}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = async () => {
    if (!reportData) return;
    setIsExportingExcel(true);
    try {
      await exportAttendanceReportToExcel(reportData, reportLanguage);
      toast.success(t("attendanceReports.exportSuccess", { defaultValue: "បានទាញយកឯកសារ Excel ជោគជ័យ" }));
    } catch (e) {
      console.error("Excel export error:", e);
      toast.error(t("attendanceReports.exportError", { defaultValue: "មិនអាចទាញយកឯកសារ Excel បានទេ" }));
    } finally {
      setIsExportingExcel(false);
    }
  };

  const isKm = reportLanguage === "km";

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <h2 className="text-lg font-bold text-foreground font-khmer">
          {t("common.loading", { defaultValue: "កំពុងរៀបចំរបាយការណ៍..." })}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {t("attendanceReports.loadingDesc", { defaultValue: "កំពុងទាញយកទិន្នន័យវត្តមានសិស្ស និងគណនាស្ថិតិ..." })}
        </p>
      </div>
    );
  }

  // 2. Unauthorized State
  if (isUnauthorized) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="h-16 w-16 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground font-khmer">
          {t("attendanceReports.unauthorizedReport", { defaultValue: "គ្មានសិទ្ធិចូលមើលរបាយការណ៍នេះទេ" })}
        </h2>
        <p className="text-xs text-muted-foreground max-w-md mt-1 mb-6">
          {t("attendanceReports.unauthorizedDesc", {
            defaultValue: "អ្នកអាចមើលបានតែរបាយការណ៍វត្តមាននៃថ្នាក់ដែលត្រូវបានចាត់តាំងឱ្យអ្នកតែប៉ុណ្ណោះ។",
          })}
        </p>
        <Button onClick={handleBack} variant="outline" className="gap-2 rounded-xl">
          <ArrowLeft className="h-4 w-4" />
          <span>{t("attendanceReports.backToReports", { defaultValue: "ត្រឡប់ទៅការកំណត់របាយការណ៍" })}</span>
        </Button>
      </div>
    );
  }

  // 3. Error / Not Found State
  if (errorMessage || !reportData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="h-16 w-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground font-khmer">
          {t("attendanceReports.reportNotFound", { defaultValue: "រកមិនឃើញទិន្នន័យរបាយការណ៍នេះទេ" })}
        </h2>
        <p className="text-xs text-muted-foreground max-w-md mt-1 mb-6">
          {t("attendanceReports.notFoundDesc", {
            defaultValue: "សូមពិនិត្យមើលថ្នាក់រៀន និងកាលបរិច្ឆេទខែដែលអ្នកបានជ្រើសរើសឡើងវិញ។",
          })}
        </p>
        <Button onClick={handleBack} variant="outline" className="gap-2 rounded-xl">
          <ArrowLeft className="h-4 w-4" />
          <span>{t("attendanceReports.backToReports", { defaultValue: "ត្រឡប់ទៅការកំណត់របាយការណ៍" })}</span>
        </Button>
      </div>
    );
  }

  const isWeekday = reportData.classroom.scheduleDays?.length === 5;
  const scheduleText = isKm
    ? isWeekday
      ? "ចន្ទ ដល់ សុក្រ (Mon-Fri)"
      : "សៅរ៍ និង អាទិត្យ (Sat-Sun)"
    : isWeekday
    ? "Monday - Friday"
    : "Saturday - Sunday";

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 print:bg-white print:text-black">
      {/* Print CSS */}
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 8mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
          }
          .print-hidden {
            display: none !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
        }
      `}</style>

      {/* Top Floating Action Toolbar (Hidden in Print) */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3 shadow-xs print:hidden print-hidden">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Back button & Breadcrumb title */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="h-9 px-3 gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 shadow-xs font-medium"
            >
              <ArrowLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <span className="font-khmer">{t("attendanceReports.backToReports", { defaultValue: "ត្រឡប់ក្រោយ" })}</span>
            </Button>
            <div className="hidden md:block">
              <h1 className="text-sm font-bold font-khmer text-foreground">
                {isKm
                  ? `របាយការណ៍វត្តមានប្រចាំខែ • ${reportData.monthNameKm}`
                  : `Monthly Attendance Report • ${reportData.monthNameEn}`}
              </h1>
              <p className="text-[11px] text-muted-foreground font-mono">
                {reportData.classroom.name} ({reportData.classroom.code})
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <Globe className="h-3.5 w-3.5 text-muted-foreground ml-1.5" />
              <button
                type="button"
                onClick={() => setReportLanguage("km")}
                className={cn(
                  "px-2 py-0.5 rounded-lg font-medium transition-all font-khmer",
                  reportLanguage === "km"
                    ? "bg-white dark:bg-slate-700 text-primary font-bold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                ខ្មែរ
              </button>
              <button
                type="button"
                onClick={() => setReportLanguage("en")}
                className={cn(
                  "px-2 py-0.5 rounded-lg font-medium transition-all",
                  reportLanguage === "en"
                    ? "bg-white dark:bg-slate-700 text-primary font-bold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                EN
              </button>
            </div>

            {/* Export Excel */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="h-9 gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 font-medium shadow-xs"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span className="hidden sm:inline">
                {isExportingExcel
                  ? t("common.loading", { defaultValue: "កំពុងដំណើរការ..." })
                  : t("attendanceReports.exportExcel", { defaultValue: "ទាញយក Excel" })}
              </span>
            </Button>

            {/* Print / Save as PDF */}
            <Button
              variant="default"
              size="sm"
              onClick={handlePrint}
              className="h-9 gap-1.5 rounded-xl bg-[#1E347B] hover:bg-[#263E89] text-white font-semibold shadow-xs"
            >
              <Printer className="h-4 w-4 text-[#F3B51B]" />
              <span>{t("attendanceReports.printSavePdf", { defaultValue: "បោះពុម្ព / រក្សាទុកជា PDF" })}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Report Page Surface */}
      <main className="p-4 sm:p-6 lg:p-8 print:p-0">
        <div className="max-w-[1600px] mx-auto bg-white text-slate-900 border border-slate-200 shadow-xl rounded-2xl p-6 sm:p-8 print:border-none print:shadow-none print:p-0 print:rounded-none print:max-w-none">
          {/* 1. Official School Header */}
          <div className="border-b-2 border-[#1E347B] pb-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={schoolSettings.logoUrl || "/images/Logo-Wat-Soriyaram-Training-Computer-School.png"}
                  alt="School Logo"
                  className="h-16 w-16 object-contain shrink-0"
                />
                <div>
                  <h1 className="text-base sm:text-lg font-bold font-khmer text-[#1E347B] leading-snug">
                    {schoolSettings.centerName || "មជ្ឈមណ្ឌលបណ្តុះបណ្តាលកុំព្យូទ័រ វត្តសុរិយារាម"}
                  </h1>
                  <h2 className="text-xs sm:text-sm font-semibold text-slate-700 tracking-wide">
                    WAT SORIYARAM COMPUTER TRAINING SCHOOL
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {t("app.fullTitle", { defaultValue: "ប្រព័ន្ធគ្រប់គ្រងវត្តមានសិស្សថ្នាក់កុំព្យូទ័រ" })}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="inline-block px-3.5 py-1 bg-[#F3B51B] text-[#16213D] font-extrabold text-xs sm:text-sm rounded-lg shadow-xs font-khmer uppercase tracking-wide">
                  {isKm ? "របាយការណ៍វត្តមានប្រចាំខែ" : "Monthly Attendance Report"}
                </div>
                <p className="text-sm font-bold text-slate-900 mt-1.5 font-mono">
                  {isKm ? reportData.monthNameKm : reportData.monthNameEn}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  {isKm ? "កាលបរិច្ឆេទបង្កើត" : "Generated"}: {reportData.generatedAt}
                  {reportData.generatedBy ? ` (${reportData.generatedBy})` : ""}
                </p>
              </div>
            </div>

            {/* 2. Structured Classroom Information Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 font-semibold text-[10px] uppercase block">
                  {isKm ? "ថ្នាក់រៀន" : "Classroom"}
                </span>
                <span className="font-bold text-slate-900 truncate block">
                  {reportData.classroom.name}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {reportData.classroom.code}
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-semibold text-[10px] uppercase block">
                  {isKm ? "កញ្ចប់សិក្សា" : "Study Package"}
                </span>
                <span className="font-semibold text-slate-900 truncate block">
                  {reportData.studyPackage?.nameKh || reportData.studyPackage?.nameEn || "—"}
                </span>
                <span className="text-[10px] text-[#1E347B] font-medium">
                  {reportData.studyPackage?.totalPlannedHours ? `${reportData.studyPackage.totalPlannedHours} ម៉ោង` : ""}
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-semibold text-[10px] uppercase block">
                  {isKm ? "គ្រូបង្រៀន" : "Assigned Teacher"}
                </span>
                <span className="font-semibold text-slate-900 truncate block">
                  {reportData.teacher?.name || "—"}
                </span>
                <span className="text-[10px] text-slate-500">
                  @{reportData.teacher?.username || ""}
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-semibold text-[10px] uppercase block">
                  {isKm ? "កាលវិភាគ & ម៉ោង" : "Schedule & Time"}
                </span>
                <span className="font-semibold text-slate-900 block truncate">
                  {scheduleText}
                </span>
                <span className="text-[10px] text-slate-600 font-mono">
                  {reportData.classroom.startTime} - {reportData.classroom.endTime}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Compact Status Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-4">
            <span className="font-bold font-khmer text-slate-700 text-[11px]">
              {isKm ? "សម្គាល់វត្តមាន:" : "Status Legend:"}
            </span>
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-medium">
                <span className="font-bold">P</span> = {isKm ? "វត្តមាន" : "Present"}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300 font-medium">
                <span className="font-bold">A</span> = {isKm ? "អវត្តមាន" : "Absent"}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 font-medium">
                <span className="font-bold">L</span> = {isKm ? "យឺត" : "Late"}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-300 font-medium">
                <span className="font-bold">E</span> = {isKm ? "ច្បាប់" : "Permission"}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 border border-amber-400 font-medium">
                <span className="font-bold">H</span> = {isKm ? "ថ្ងៃឈប់សម្រាក" : "Holiday"}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 border border-slate-300 font-medium">
                <span className="font-bold">•</span> = {isKm ? "មិនទាន់កត់ត្រា" : "Pending"}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 border border-slate-300 font-medium">
                <span className="font-bold">—</span> = {isKm ? "ក្រៅវគ្គ" : "Off-session"}
              </span>
            </div>
          </div>

          {/* 4. Full Dynamic Attendance Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-slate-300 min-w-[900px]">
              <thead>
                <tr className="bg-[#1E347B] text-white">
                  {/* Sticky screen headers */}
                  <th className="py-2.5 px-2 text-center border border-slate-400 w-10 sticky left-0 z-10 bg-[#1E347B] print:static">
                    {isKm ? "ល.រ" : "No."}
                  </th>
                  <th className="py-2.5 px-2 text-center border border-slate-400 w-24 sticky left-10 z-10 bg-[#1E347B] print:static">
                    {isKm ? "អត្តលេខ" : "Code"}
                  </th>
                  <th className="py-2.5 px-3 text-left border border-slate-400 min-w-[140px] sticky left-34 z-10 bg-[#1E347B] print:static font-khmer">
                    {isKm ? "គោត្តនាម-នាម" : "Student Name"}
                  </th>
                  <th className="py-2.5 px-1.5 text-center border border-slate-400 w-12">
                    {isKm ? "ភេទ" : "Sex"}
                  </th>

                  {/* Dynamic Date Headers */}
                  {reportData.dateColumns.map((col) => (
                    <th
                      key={col.dateStr}
                      title={
                        col.isHoliday
                          ? `${isKm ? "ថ្ងៃឈប់សម្រាក" : "Holiday"}: ${
                              (isKm ? col.holiday?.nameKm : col.holiday?.nameEn) || ""
                            }`
                          : col.dateStr
                      }
                      className={cn(
                        "py-1.5 px-0.5 text-center border border-slate-400 min-w-[34px]",
                        col.isHoliday ? "bg-amber-700 text-amber-50" : "bg-[#263E89] text-white"
                      )}
                    >
                      <div className="font-bold text-[11px] leading-tight">
                        {isKm ? toKhmerNumber(col.dayNumber) : col.dayNumber}
                      </div>
                      <div className="text-[8px] opacity-90 leading-tight">
                        {isKm ? col.dayNameKm : col.dayNameEn}
                      </div>
                    </th>
                  ))}

                  {/* Summary Columns */}
                  <th className="py-2.5 px-1.5 text-center border border-slate-400 w-10 bg-[#16213D] text-emerald-300 font-bold">
                    P
                  </th>
                  <th className="py-2.5 px-1.5 text-center border border-slate-400 w-10 bg-[#16213D] text-rose-300 font-bold">
                    A
                  </th>
                  <th className="py-2.5 px-1.5 text-center border border-slate-400 w-10 bg-[#16213D] text-amber-300 font-bold">
                    L
                  </th>
                  <th className="py-2.5 px-1.5 text-center border border-slate-400 w-10 bg-[#16213D] text-blue-300 font-bold">
                    E
                  </th>
                  <th className="py-2.5 px-1.5 text-center border border-slate-400 w-12 bg-[#16213D] text-white font-bold">
                    {isKm ? "សរុប" : "Total"}
                  </th>
                  <th className="py-2.5 px-2 text-center border border-slate-400 w-14 bg-[#16213D] text-[#F3B51B] font-extrabold">
                    %
                  </th>
                </tr>
              </thead>

              <tbody>
                {reportData.studentRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4 + reportData.dateColumns.length + 6}
                      className="py-10 text-center text-slate-500 font-khmer text-xs"
                    >
                      {t("attendanceReports.noStudentsFound", {
                        defaultValue: "មិនមានទិន្នន័យសិស្សចុះឈ្មោះក្នុងថ្នាក់នេះសម្រាប់ខែនេះទេ",
                      })}
                    </td>
                  </tr>
                ) : (
                  reportData.studentRows.map((row, index) => {
                    const isEven = index % 2 === 0;
                    return (
                      <tr
                        key={row.student.id}
                        className={cn("transition-colors", isEven ? "bg-white" : "bg-slate-50")}
                      >
                        {/* Frozen Columns on Screen */}
                        <td
                          className={cn(
                            "py-2 px-2 text-center border border-slate-300 font-mono text-slate-600 sticky left-0 z-1 print:static",
                            isEven ? "bg-white" : "bg-slate-50"
                          )}
                        >
                          {isKm ? toKhmerNumber(index + 1) : index + 1}
                        </td>
                        <td
                          className={cn(
                            "py-2 px-2 text-center border border-slate-300 font-mono font-semibold text-slate-900 sticky left-10 z-1 print:static",
                            isEven ? "bg-white" : "bg-slate-50"
                          )}
                        >
                          {row.student.studentCode}
                        </td>
                        <td
                          className={cn(
                            "py-2 px-3 border border-slate-300 font-medium text-slate-900 sticky left-34 z-1 print:static font-khmer",
                            isEven ? "bg-white" : "bg-slate-50"
                          )}
                        >
                          <div className="truncate max-w-[150px]">
                            {row.student.nameKh}
                            {row.student.nameEn && (
                              <span className="block text-[10px] text-slate-500 font-sans truncate">
                                {row.student.nameEn}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-1.5 text-center border border-slate-300 text-slate-600">
                          {row.student.gender === "female"
                            ? isKm
                              ? "ស្រី"
                              : "F"
                            : isKm
                            ? "ប្រុស"
                            : "M"}
                        </td>

                        {/* Date Status Cells */}
                        {reportData.dateColumns.map((col) => {
                          const cellData = row.cells[col.dateStr];
                          const code = cellData?.code || "•";
                          const isClickableCorrection = isAdmin && cellData?.hasRecord && col.dateStr <= cambodiaToday;

                          return (
                            <td
                              key={col.dateStr}
                              onClick={() => {
                                if (isClickableCorrection) {
                                  setCorrectionTarget({
                                    attendanceDocId: cellData.attendanceDocId,
                                    student: row.student,
                                    date: col.dateStr,
                                    previousStatus: (cellData.status as AttendanceStatus) || null,
                                  });
                                  setIsCorrectionOpen(true);
                                }
                              }}
                              className={cn(
                                "py-1.5 px-0.5 text-center border border-slate-300 font-bold text-[11px]",
                                col.isHoliday && "bg-amber-50/70",
                                isClickableCorrection && "cursor-pointer hover:bg-amber-100/60 transition-colors"
                              )}
                              title={
                                cellData?.isHoliday
                                  ? `${isKm ? "ថ្ងៃឈប់សម្រាក" : "Holiday"}: ${
                                      (isKm ? cellData.holidayNameKm : cellData.holidayNameEn) || ""
                                    }`
                                  : isClickableCorrection
                                  ? `${code}: ${cellData?.remark || ""}${cellData?.remark ? " — " : ""}${isKm ? "ចុចដើម្បីកែប្រែវត្តមាន" : "Click to correct attendance"}`
                                  : cellData?.remark
                                  ? `${code}: ${cellData.remark}`
                                  : undefined
                              }
                            >
                              {code === "P" ? (
                                <span className="inline-flex items-center justify-center h-5.5 w-5.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                                  P
                                </span>
                              ) : code === "A" ? (
                                <span className="inline-flex items-center justify-center h-5.5 w-5.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[11px]">
                                  A
                                </span>
                              ) : code === "L" ? (
                                <span className="inline-flex items-center justify-center h-5.5 w-5.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[11px]">
                                  L
                                </span>
                              ) : code === "E" ? (
                                <span className="inline-flex items-center justify-center h-5.5 w-5.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[11px]">
                                  E
                                </span>
                              ) : code === "H" ? (
                                <span className="inline-flex items-center justify-center h-5.5 w-5.5 rounded-md bg-amber-200/80 text-amber-900 font-bold text-[10px]">
                                  H
                                </span>
                              ) : code === "—" ? (
                                <span className="text-slate-400 text-xs">—</span>
                              ) : (
                                <span className="text-slate-400 text-xs">•</span>
                              )}
                            </td>
                          );
                        })}

                        {/* Summary Columns */}
                        <td className="py-2 px-1.5 text-center border border-slate-300 font-mono font-semibold text-emerald-700 bg-emerald-50/30">
                          {isKm ? toKhmerNumber(row.presentCount) : row.presentCount}
                        </td>
                        <td className="py-2 px-1.5 text-center border border-slate-300 font-mono font-semibold text-rose-700 bg-rose-50/30">
                          {isKm ? toKhmerNumber(row.absentCount) : row.absentCount}
                        </td>
                        <td className="py-2 px-1.5 text-center border border-slate-300 font-mono font-semibold text-amber-700 bg-amber-50/30">
                          {isKm ? toKhmerNumber(row.lateCount) : row.lateCount}
                        </td>
                        <td className="py-2 px-1.5 text-center border border-slate-300 font-mono font-semibold text-blue-700 bg-blue-50/30">
                          {isKm ? toKhmerNumber(row.permissionCount) : row.permissionCount}
                        </td>
                        <td className="py-2 px-1.5 text-center border border-slate-300 font-mono font-bold text-slate-900 bg-slate-100">
                          {isKm ? toKhmerNumber(row.recordedSessionCount) : row.recordedSessionCount}
                        </td>
                        <td className="py-2 px-2 text-center border border-slate-300 font-mono font-extrabold text-[#1E347B] bg-[#1E347B]/10">
                          {isKm ? `${toKhmerNumber(row.attendanceRate)}%` : `${row.attendanceRate}%`}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Totals Summary Footer */}
              {reportData.studentRows.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-200 font-bold border-t-2 border-slate-500 text-slate-900">
                    <td
                      colSpan={4}
                      className="py-2.5 px-3 text-center border border-slate-400 font-khmer sticky left-0 z-1 bg-slate-200 print:static"
                    >
                      {isKm ? "សរុបវត្តមានទូទៅ (Overall Totals)" : "Overall Totals"}
                    </td>

                    {/* Per-Date Sum */}
                    {reportData.dateColumns.map((col) => {
                      if (col.isHoliday) {
                        return (
                          <td
                            key={col.dateStr}
                            className="py-2 px-0.5 text-center border border-slate-400 font-mono text-[11px] text-amber-800 bg-amber-200/60"
                          >
                            H
                          </td>
                        );
                      }
                      const presentCount = reportData.studentRows.filter(
                        (r) => r.cells[col.dateStr]?.code === "P"
                      ).length;
                      return (
                        <td
                          key={col.dateStr}
                          className="py-2 px-0.5 text-center border border-slate-400 font-mono text-[11px] text-slate-900"
                        >
                          {presentCount > 0
                            ? isKm
                              ? toKhmerNumber(presentCount)
                              : presentCount
                            : "-"}
                        </td>
                      );
                    })}

                    <td className="py-2.5 px-1.5 text-center border border-slate-400 font-mono font-bold text-emerald-800 bg-emerald-100">
                      {isKm
                        ? toKhmerNumber(reportData.summaryMetrics.totalPresent)
                        : reportData.summaryMetrics.totalPresent}
                    </td>
                    <td className="py-2.5 px-1.5 text-center border border-slate-400 font-mono font-bold text-rose-800 bg-rose-100">
                      {isKm
                        ? toKhmerNumber(reportData.summaryMetrics.totalAbsent)
                        : reportData.summaryMetrics.totalAbsent}
                    </td>
                    <td className="py-2.5 px-1.5 text-center border border-slate-400 font-mono font-bold text-amber-800 bg-amber-100">
                      {isKm
                        ? toKhmerNumber(reportData.summaryMetrics.totalLate)
                        : reportData.summaryMetrics.totalLate}
                    </td>
                    <td className="py-2.5 px-1.5 text-center border border-slate-400 font-mono font-bold text-blue-800 bg-blue-100">
                      {isKm
                        ? toKhmerNumber(reportData.summaryMetrics.totalPermission)
                        : reportData.summaryMetrics.totalPermission}
                    </td>
                    <td className="py-2.5 px-1.5 text-center border border-slate-400 font-mono font-bold text-slate-900 bg-slate-300">
                      {isKm
                        ? toKhmerNumber(reportData.summaryMetrics.totalRecordedStudentSessions)
                        : reportData.summaryMetrics.totalRecordedStudentSessions}
                    </td>
                    <td className="py-2.5 px-2 text-center border border-slate-400 font-mono font-extrabold text-[#1E347B] bg-[#F3B51B]/30">
                      {isKm
                        ? `${toKhmerNumber(reportData.summaryMetrics.overallAttendanceRate)}%`
                        : `${reportData.summaryMetrics.overallAttendanceRate}%`}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* 5. Report Signatures Footer */}
          <div className="grid grid-cols-3 gap-6 sm:gap-12 mt-8 pt-4 border-t border-slate-200 text-xs">
            <div className="text-center space-y-12">
              <p className="font-bold text-slate-800 font-khmer">
                {isKm ? "រៀបចំដោយ" : "Prepared By"}
              </p>
              <div className="border-t border-slate-400 mx-4 sm:mx-8 pt-1.5">
                <p className="text-[11px] text-slate-600 font-medium">
                  {reportData.generatedBy || user?.name || "...................................."}
                </p>
              </div>
            </div>

            <div className="text-center space-y-12">
              <p className="font-bold text-slate-800 font-khmer">
                {isKm ? "ហត្ថលេខាគ្រូបង្រៀន" : "Teacher Signature"}
              </p>
              <div className="border-t border-slate-400 mx-4 sm:mx-8 pt-1.5">
                <p className="text-[11px] text-slate-600 font-medium">
                  {reportData.teacher?.name || "...................................."}
                </p>
              </div>
            </div>

            <div className="text-center space-y-12">
              <p className="font-bold text-slate-800 font-khmer">
                {isKm ? "ប្រធានមជ្ឈមណ្ឌល / រដ្ឋបាល" : "Director / Admin Signature"}
              </p>
              <div className="border-t border-slate-400 mx-4 sm:mx-8 pt-1.5">
                <p className="text-[11px] text-slate-600 font-medium">
                  ....................................
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Correction Dialog */}
      {correctionTarget && classroomId && isAdmin && (
        <AttendanceCorrectionDialog
          open={isCorrectionOpen}
          onOpenChange={setIsCorrectionOpen}
          attendanceDocId={correctionTarget.attendanceDocId}
          attendanceId={correctionTarget.attendanceDocId}
          classroomId={classroomId}
          studentId={correctionTarget.student?.id || ""}
          attendanceDate={correctionTarget.date}
          previousStatus={correctionTarget.previousStatus}
          student={correctionTarget.student}
          onSuccess={() => {
            // Reload report data to reflect correction
            loadReport();
          }}
        />
      )}
    </div>
  );
};
