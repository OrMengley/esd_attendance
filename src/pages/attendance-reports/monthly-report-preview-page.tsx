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
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AttendanceCorrectionDialog } from "@/components/attendance-corrections/attendance-correction-dialog";
import { AttendanceStatus } from "@/models/attendance.model";
import { MonthlyAttendanceMatrixTable } from "@/components/attendance-reports/monthly-attendance-matrix-table";

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

          {/* 3. Reusable Attendance Matrix Table */}
          <MonthlyAttendanceMatrixTable
            reportData={reportData}
            language={reportLanguage}
            isAdmin={isAdmin}
            onCorrectRecord={(target) => {
              setCorrectionTarget(target);
              setIsCorrectionOpen(true);
            }}
          />

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
