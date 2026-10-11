import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth-context";
import { useSchoolSettings } from "@/hooks/use-school-settings";
import {
  studentAttendanceService,
  StudentMonthlyReportData,
  toKhmerNum,
} from "@/services/student-attendance.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Printer,
  Globe,
  Loader2,
  AlertCircle,
  ShieldAlert,
  Calendar,
  Clock,
  School,
  BookOpen,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  Clock3,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const StudentMonthlyReportPreviewPage: React.FC = () => {
  const { studentId, yearMonth } = useParams<{ studentId: string; yearMonth: string }>();
  const [searchParams] = useSearchParams();
  const enrollmentId = searchParams.get("enrollmentId") || undefined;

  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const schoolSettings = useSchoolSettings();
  const navigate = useNavigate();

  const [reportData, setReportData] = useState<StudentMonthlyReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  const [reportLanguage, setReportLanguage] = useState<"km" | "en">(
    i18n.language === "km" ? "km" : "en"
  );

  useEffect(() => {
    if (!studentId || !yearMonth) {
      setErrorMessage("INVALID_PARAMETERS");
      setIsLoading(false);
      return;
    }

    loadReport();
  }, [studentId, yearMonth, enrollmentId, user]);

  const loadReport = async () => {
    if (!studentId || !yearMonth) return;
    setIsLoading(true);
    setErrorMessage(null);
    setIsUnauthorized(false);

    try {
      const data = await studentAttendanceService.getStudentMonthlyReport({
        studentId,
        yearMonth,
        enrollmentId,
        currentUser: user,
      });

      setReportData(data);
    } catch (e: any) {
      console.error("Failed to load student monthly report:", e);
      if (e.message === "UNAUTHORIZED_TEACHER_REPORT" || e.message === "UNAUTHORIZED_STUDENT_ACCESS") {
        setIsUnauthorized(true);
      } else {
        setErrorMessage(e.message || "LOAD_ERROR");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/student-attendance/${studentId}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const isKm = reportLanguage === "km";

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <h2 className="text-lg font-bold text-foreground font-khmer">
          {t("common.loading", { defaultValue: "កំពុងរៀបចំរបាយការណ៍សិស្ស..." })}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {t("studentAttendance.loadingDesc", { defaultValue: "កំពុងទាញយកទិន្នន័យវត្តមាន និងគណនាស្ថិតិ..." })}
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
          {t("studentAttendance.unauthorized", { defaultValue: "គ្មានសិទ្ធិចូលមើលរបាយការណ៍នេះទេ" })}
        </h2>
        <p className="text-xs text-muted-foreground max-w-md mt-1 mb-6">
          {t("studentAttendance.unauthorizedDesc", {
            defaultValue: "អ្នកអាចមើលបានតែរបាយការណ៍វត្តមានរបស់សិស្សដែលស្ថិតក្នុងថ្នាក់ដែលអ្នកត្រូវបានចាត់តាំងប៉ុណ្ណោះ។",
          })}
        </p>
        <Button onClick={handleBack} variant="outline" className="gap-2 rounded-xl">
          <ArrowLeft className="h-4 w-4" />
          <span>{t("common.back", { defaultValue: "ត្រឡប់ក្រោយ" })}</span>
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
          {t("studentAttendance.reportNotFound", { defaultValue: "រកមិនឃើញទិន្នន័យរបាយការណ៍នេះទេ" })}
        </h2>
        <p className="text-xs text-muted-foreground max-w-md mt-1 mb-6">
          {t("studentAttendance.notFoundDesc", {
            defaultValue: "សូមពិនិត្យមើលថ្នាក់រៀន និងខែដែលអ្នកបានជ្រើសរើសឡើងវិញ។",
          })}
        </p>
        <Button onClick={handleBack} variant="outline" className="gap-2 rounded-xl">
          <ArrowLeft className="h-4 w-4" />
          <span>{t("common.back", { defaultValue: "ត្រឡប់ក្រោយ" })}</span>
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

  const classDisplayName = reportData.classroom.name;

  const packageDisplayName = reportData.studyPackage
    ? isKm
      ? (reportData.studyPackage.nameKh || reportData.studyPackage.nameEn)
      : (reportData.studyPackage.nameEn || reportData.studyPackage.nameKh)
    : "—";

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 print:bg-white print:text-black">
      {/* Print CSS - A4 Portrait */}
      <style>{`
        @media print {
          @page {
            size: portrait;
            margin: 10mm;
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
        <div className="max-w-[900px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Back button & title */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="h-9 px-3 gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 shadow-xs font-medium"
            >
              <ArrowLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <span className="font-khmer">{isKm ? "ត្រឡប់ក្រោយ" : "Back to History"}</span>
            </Button>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold font-khmer text-foreground">
                {isKm
                  ? `របាយការណ៍វត្តមាន • ${reportData.student.nameKh}`
                  : `Monthly Report • ${reportData.student.nameKh}`}
              </h1>
              <p className="text-[11px] text-muted-foreground font-mono">
                {reportData.student.studentCode} • {isKm ? reportData.monthNameKm : reportData.monthNameEn}
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

            {/* Print / Save as PDF */}
            <Button
              variant="default"
              size="sm"
              onClick={handlePrint}
              className="h-9 gap-1.5 rounded-xl bg-[#1E347B] hover:bg-[#263E89] text-white font-semibold shadow-xs"
            >
              <Printer className="h-4 w-4 text-[#F3B51B]" />
              <span>{isKm ? "បោះពុម្ព / រក្សាទុកជា PDF" : "Print / Save as PDF"}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Printable Report Document (A4 Portrait Paper) */}
      <main className="p-4 sm:p-6 lg:p-8 print:p-0">
        <div className="max-w-[900px] mx-auto bg-white text-slate-900 border border-slate-200 shadow-xl rounded-2xl p-6 sm:p-8 print:border-none print:shadow-none print:p-0 print:rounded-none print:max-w-none">
          {/* 1. Official School Header */}
          <div className="border-b-2 border-[#1E347B] pb-3 mb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
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
                  <p className="text-[10px] text-slate-500 font-medium font-khmer">
                    {isKm
                      ? "ប្រព័ន្ធគ្រប់គ្រងវត្តមានសិស្សថ្នាក់កុំព្យូទ័រ"
                      : "Computer Class Attendance Management System"}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block px-3 py-1 bg-[#F3B51B] text-[#16213D] font-extrabold text-xs rounded-lg shadow-xs font-khmer uppercase tracking-wide">
                  {isKm ? "របាយការណ៍វត្តមានសិស្សប្រចាំខែ" : "Monthly Student Report"}
                </div>
                <p className="text-sm font-bold text-slate-900 mt-1 font-mono">
                  {isKm ? reportData.monthNameKm : reportData.monthNameEn}
                </p>
                <p className="text-[9px] text-slate-500 font-mono">
                  {isKm ? "បង្កើតនៅ" : "Generated"}: {reportData.generatedAt}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Structured Student and Class Information Block */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-4">
            {/* Student Info */}
            <div className="space-y-1 pr-2 border-r border-slate-200">
              <h3 className="font-bold font-khmer text-[#1E347B] text-xs uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <UserIcon className="h-3.5 w-3.5 text-primary" />
                <span>{isKm ? "ព័ត៌មានសិស្ស" : "Student Information"}</span>
              </h3>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <span className="text-slate-500">{isKm ? "ឈ្មោះសិស្ស" : "Name"}:</span>
                <span className="font-bold text-slate-900 font-khmer">
                  {reportData.student.nameKh} {reportData.student.nameEn && `(${reportData.student.nameEn})`}
                </span>

                <span className="text-slate-500">{isKm ? "អត្តលេខ" : "Code"}:</span>
                <span className="font-mono font-bold text-slate-900">{reportData.student.studentCode}</span>

                <span className="text-slate-500">{isKm ? "ភេទ" : "Gender"}:</span>
                <span className="text-slate-900">{reportData.student.gender === "female" ? (isKm ? "ស្រី" : "Female") : isKm ? "ប្រុស" : "Male"}</span>

                {reportData.student.phone && (
                  <>
                    <span className="text-slate-500">{isKm ? "ទូរស័ព្ទ" : "Phone"}:</span>
                    <span className="font-mono text-slate-900">{reportData.student.phone}</span>
                  </>
                )}
              </div>
            </div>

            {/* Class Info */}
            <div className="space-y-1 pl-2">
              <h3 className="font-bold font-khmer text-[#1E347B] text-xs uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <School className="h-3.5 w-3.5 text-primary" />
                <span>{isKm ? "ព័ត៌មានថ្នាក់រៀន" : "Classroom Information"}</span>
              </h3>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <span className="text-slate-500">{isKm ? "ថ្នាក់រៀន" : "Class"}:</span>
                <span className="font-bold text-slate-900 truncate">
                  {classDisplayName} ({reportData.classroom.code})
                </span>

                <span className="text-slate-500">{isKm ? "កញ្ចប់សិក្សា" : "Package"}:</span>
                <span className="font-medium text-slate-900 truncate">
                  {packageDisplayName}
                </span>

                <span className="text-slate-500">{isKm ? "គ្រូបង្រៀន" : "Teacher"}:</span>
                <span className="font-medium text-slate-900">{reportData.teacher?.name || "—"}</span>

                <span className="text-slate-500">{isKm ? "កាលវិភាគ" : "Schedule"}:</span>
                <span className="text-slate-900">
                  {scheduleText} • {reportData.classroom.startTime}-{reportData.classroom.endTime}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Monthly Summary Metrics Box */}
          <div className="grid grid-cols-6 gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20 text-center mb-4">
            <div className="p-1.5 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 block font-khmer">{isKm ? "វគ្គគ្រោងទុក" : "Scheduled"}</span>
              <span className="text-base font-bold text-blue-700 font-mono">
                {isKm ? toKhmerNum(reportData.summary.scheduledSessions) : reportData.summary.scheduledSessions}
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 block font-khmer">{isKm ? "វគ្គកត់វត្តមាន" : "Recorded"}</span>
              <span className="text-base font-bold text-slate-800 font-mono">
                {isKm ? toKhmerNum(reportData.summary.recordedSessions) : reportData.summary.recordedSessions}
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] text-emerald-700 font-semibold block font-khmer">{isKm ? "វត្តមាន (P)" : "Present"}</span>
              <span className="text-base font-bold text-emerald-700 font-mono">
                {isKm ? toKhmerNum(reportData.summary.presentCount) : reportData.summary.presentCount}
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] text-rose-700 font-semibold block font-khmer">{isKm ? "អវត្តមាន (A)" : "Absent"}</span>
              <span className="text-base font-bold text-rose-700 font-mono">
                {isKm ? toKhmerNum(reportData.summary.absentCount) : reportData.summary.absentCount}
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] text-amber-700 font-semibold block font-khmer">{isKm ? "យឺត/ច្បាប់" : "Late/Perm"}</span>
              <span className="text-base font-bold text-amber-700 font-mono">
                {isKm
                  ? `${toKhmerNum(reportData.summary.lateCount)} / ${toKhmerNum(reportData.summary.permissionCount)}`
                  : `${reportData.summary.lateCount} / ${reportData.summary.permissionCount}`}
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-[#1E347B] text-white">
              <span className="text-[10px] text-[#F3B51B] font-bold block font-khmer">{isKm ? "អត្រាវត្តមាន" : "Rate"}</span>
              <span className="text-base font-extrabold text-white font-mono">
                {isKm ? `${toKhmerNum(reportData.summary.attendanceRate)}%` : `${reportData.summary.attendanceRate}%`}
              </span>
            </div>
          </div>

          {/* 4. Attendance Calendar Table */}
          <div className="mb-4">
            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead>
                <tr className="bg-[#1E347B] text-white text-[11px]">
                  <th className="py-2 px-2 text-center border border-slate-400 w-10">#</th>
                  <th className="py-2 px-3 border border-slate-400 w-28">{isKm ? "កាលបរិច្ឆេទ" : "Date"}</th>
                  <th className="py-2 px-2 text-center border border-slate-400 w-20">{isKm ? "ថ្ងៃ" : "Day"}</th>
                  <th className="py-2 px-3 text-center border border-slate-400 w-32">{isKm ? "ស្ថានភាពវត្តមាន" : "Status"}</th>
                  <th className="py-2 px-3 border border-slate-400">{isKm ? "ចំណាំ / មូលហេតុ" : "Remark / Reason"}</th>
                  <th className="py-2 px-3 border border-slate-400 w-32">{isKm ? "កត់ត្រាដោយ" : "Recorded By"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[11px]">
                {reportData.sessions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500 font-khmer italic">
                      {isKm ? "មិនមានវគ្គសិក្សាគ្រោងទុកសម្រាប់ខែនេះទេ" : "No scheduled class sessions in this month."}
                    </td>
                  </tr>
                ) : (
                  reportData.sessions.map((item, index) => {
                    const isEven = index % 2 === 0;

                    return (
                      <tr
                        key={item.dateStr}
                        className={cn(
                          item.isHoliday
                            ? "bg-amber-100/50"
                            : item.status === "not_expected"
                            ? "bg-slate-100/50"
                            : isEven
                            ? "bg-white"
                            : "bg-slate-50"
                        )}
                      >
                        <td className="py-1.5 px-2 text-center border border-slate-300 font-mono text-slate-500">
                          {isKm ? toKhmerNum(index + 1) : index + 1}
                        </td>
                        <td className="py-1.5 px-3 border border-slate-300 font-mono font-semibold text-slate-900">
                          {item.dateStr}
                        </td>
                        <td className="py-1.5 px-2 text-center border border-slate-300 font-medium">
                          {isKm ? item.dayNameKm : item.dayNameEn}
                        </td>
                        <td className="py-1.5 px-3 text-center border border-slate-300">
                          {item.status === "present" ? (
                            <span className="inline-block px-2 py-0.5 rounded font-bold text-emerald-800 bg-emerald-100 text-[11px]">
                              P - {isKm ? "វត្តមាន" : "Present"}
                            </span>
                          ) : item.status === "absent" ? (
                            <span className="inline-block px-2 py-0.5 rounded font-bold text-rose-800 bg-rose-100 text-[11px]">
                              A - {isKm ? "អវត្តមាន" : "Absent"}
                            </span>
                          ) : item.status === "late" ? (
                            <span className="inline-block px-2 py-0.5 rounded font-bold text-amber-800 bg-amber-100 text-[11px]">
                              L - {isKm ? "យឺត" : "Late"}
                            </span>
                          ) : item.status === "permission" ? (
                            <span className="inline-block px-2 py-0.5 rounded font-bold text-blue-800 bg-blue-100 text-[11px]">
                              E - {isKm ? "ច្បាប់" : "Permission"}
                            </span>
                          ) : item.status === "holiday" ? (
                            <span className="inline-block px-2 py-0.5 rounded font-bold text-amber-900 bg-amber-200 text-[10px]">
                              H - {isKm ? "ឈប់សម្រាក" : "Holiday"}
                            </span>
                          ) : item.status === "not_expected" ? (
                            <span className="text-slate-400 font-semibold">—</span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded font-medium text-slate-600 bg-slate-200 text-[10px]">
                              • {isKm ? "មិនទាន់កត់ត្រា" : "Pending"}
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-3 border border-slate-300 text-slate-700">
                          {item.isHoliday ? (
                            <span className="text-amber-800 font-medium">
                              {isKm ? item.holidayNameKm : item.holidayNameEn}
                            </span>
                          ) : item.remark ? (
                            <span>{item.remark}</span>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>
                        <td className="py-1.5 px-3 border border-slate-300 text-slate-600 text-[10px]">
                          {item.recordedByName || "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 5. Status Legend (Cleaned up to only include valid session statuses) */}
          <div className="flex flex-wrap items-center justify-start gap-4 py-2 px-3.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] mb-6">
            <span className="font-bold text-slate-700 font-khmer">{isKm ? "សម្គាល់:" : "Legend:"}</span>
            <span><strong>P</strong> = {isKm ? "វត្តមាន" : "Present"}</span>
            <span><strong>A</strong> = {isKm ? "អវត្តមាន" : "Absent"}</span>
            <span><strong>L</strong> = {isKm ? "យឺត" : "Late"}</span>
            <span><strong>E</strong> = {isKm ? "ច្បាប់" : "Permission"}</span>
            <span><strong>•</strong> = {isKm ? "មិនទាន់កត់ត្រា" : "Pending"}</span>
          </div>

          {/* 6. Formal Signatures Section */}
          <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-200 text-xs">
            <div className="text-center space-y-12">
              <p className="font-bold text-slate-800 font-khmer">
                {isKm ? "រៀបចំដោយ" : "Prepared By"}
              </p>
              <div className="border-t border-slate-400 mx-4 pt-1">
                <p className="text-[10px] text-slate-600 font-medium">
                  {reportData.generatedBy || user?.name || "...................................."}
                </p>
              </div>
            </div>

            <div className="text-center space-y-12">
              <p className="font-bold text-slate-800 font-khmer">
                {isKm ? "ហត្ថលេខាគ្រូបង្រៀន" : "Teacher Signature"}
              </p>
              <div className="border-t border-slate-400 mx-4 pt-1">
                <p className="text-[10px] text-slate-600 font-medium">
                  {reportData.teacher?.name || "...................................."}
                </p>
              </div>
            </div>

            <div className="text-center space-y-12">
              <p className="font-bold text-slate-800 font-khmer">
                {isKm ? "ប្រធានមជ្ឈមណ្ឌល / រដ្ឋបាល" : "Director / Admin Signature"}
              </p>
              <div className="border-t border-slate-400 mx-4 pt-1">
                <p className="text-[10px] text-slate-600 font-medium">
                  ....................................
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
