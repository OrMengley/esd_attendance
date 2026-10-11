import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ArrowLeft,
  Printer,
  FileSpreadsheet,
  Loader2,
  ShieldAlert,
  AlertCircle,
  Globe,
} from "lucide-react";
import {
  AbsenceLateFilters,
  AbsenceLateReportData,
  AbsenceLateReportType,
  ScheduleFilterType,
} from "@/models/absence-late-report.model";
import { absenceLateReportService } from "@/services/absence-late-report.service";
import { AbsenceLatePrintView } from "@/components/reports/absence-late/absence-late-print-view";
import { getCambodiaToday } from "@/lib/attendance-time-lock";

export const AbsenceLateReportPrintPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const isAuthorized = user?.role === "super_admin" || user?.role === "admin";

  const monthParam = searchParams.get("month") || getCambodiaToday().slice(0, 7);
  const typeParam = (searchParams.get("type") as AbsenceLateReportType) || "either";
  const minParam = parseInt(searchParams.get("min") || "1", 10) || 1;
  const classIdParam = searchParams.get("classId") || "all";
  const teacherIdParam = searchParams.get("teacherId") || "all";
  const pkgIdParam = searchParams.get("pkgId") || "all";
  const scheduleParam = (searchParams.get("schedule") as ScheduleFilterType) || "all";
  const searchParam = searchParams.get("q") || "";

  const [language, setLanguage] = useState<"km" | "en">(
    i18n.language === "km" ? "km" : "en"
  );
  const [reportData, setReportData] = useState<AbsenceLateReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);

  useEffect(() => {
    if (!isAuthorized) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const filters: AbsenceLateFilters = {
          yearMonth: monthParam,
          reportType: typeParam,
          minOccurrences: minParam,
          selectedClassId: classIdParam,
          selectedTeacherId: teacherIdParam,
          selectedPackageId: pkgIdParam,
          selectedSchedule: scheduleParam,
          searchQuery: searchParam,
        };
        const data = await absenceLateReportService.generateReport(
          filters,
          user?.name
        );
        setReportData(data);
      } catch (err) {
        console.error("Failed to load report for print:", err);
        toast.error(
          t("absenceLateReport.loadError", {
            defaultValue: "មិនអាចទាញយករបាយការណ៍បានទេ",
          })
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [
    isAuthorized,
    monthParam,
    typeParam,
    minParam,
    classIdParam,
    teacherIdParam,
    pkgIdParam,
    scheduleParam,
    searchParam,
    user?.name,
    t,
  ]);

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    navigate("/absence-late-report");
  };

  const handleExportExcel = async () => {
    if (!reportData) return;
    setIsExportingExcel(true);
    try {
      await absenceLateReportService.exportToExcel(reportData, language);
      toast.success(
        t("attendanceReports.exportSuccess", {
          defaultValue: "បានទាញយកឯកសារ Excel ជោគជ័យ",
        })
      );
    } catch (err) {
      console.error("Excel export error:", err);
      toast.error(
        t("attendanceReports.exportError", {
          defaultValue: "មិនអាចទាញយកឯកសារ Excel បានទេ",
        })
      );
    } finally {
      setIsExportingExcel(false);
    }
  };

  const isKm = language === "km";

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="h-16 w-16 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className={`text-xl font-bold text-foreground ${isKm ? "font-khmer" : ""}`}>
          {isKm ? "មិនមានសិទ្ធិចូលមើលទិន្នន័យនេះទេ" : "Unauthorized Access"}
        </h2>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <h2 className={`text-lg font-bold text-foreground ${isKm ? "font-khmer" : ""}`}>
          {isKm ? "កំពុងរៀបចំរបាយការណ៍..." : "Preparing report..."}
        </h2>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="h-10 w-10 text-rose-500 mb-4" />
        <h2 className={`text-lg font-bold text-foreground ${isKm ? "font-khmer" : ""}`}>
          {isKm ? "មិនអាចទាញយករបាយការណ៍បានទេ" : "Failed to load report"}
        </h2>
        <Button variant="outline" onClick={handleBack} className={`mt-4 rounded-xl ${isKm ? "font-khmer" : ""}`}>
          {isKm ? "ត្រឡប់ក្រោយ" : "Back"}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 print:bg-white print:text-black">
      {/* Landscape Print CSS Rules */}
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

      {/* Floating Action Bar (Hidden in Print) */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3 shadow-xs print:hidden print-hidden">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Back button & Title */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="h-9 px-3 gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 shadow-xs font-medium"
            >
              <ArrowLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <span className={isKm ? "font-khmer" : ""}>
                {isKm ? "ត្រឡប់ក្រោយ" : "Back"}
              </span>
            </Button>
            <div>
              <h1 className="text-sm font-bold font-khmer text-foreground">
                {isKm
                  ? `របាយការណ៍សិស្សអវត្តមាន និងមកយឺត • ${reportData.monthNameKm}`
                  : `Absence & Late Report • ${reportData.monthNameEn}`}
              </h1>
              <p className="text-[11px] text-muted-foreground font-mono">
                {reportData.summary.studentsFlagged} {isKm ? "នាក់ជាប់លក្ខខណ្ឌ" : "students flagged"}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <Button
                variant={isKm ? "default" : "ghost"}
                size="sm"
                onClick={() => setLanguage("km")}
                className="h-7 px-2.5 text-xs rounded-lg font-khmer"
              >
                ខ្មែរ
              </Button>
              <Button
                variant={!isKm ? "default" : "ghost"}
                size="sm"
                onClick={() => setLanguage("en")}
                className="h-7 px-2.5 text-xs rounded-lg font-sans"
              >
                EN
              </Button>
            </div>

            {/* Print Button */}
            <Button
              onClick={handlePrint}
              size="sm"
              className="h-9 px-3.5 gap-1.5 rounded-xl bg-[#1E347B] hover:bg-[#263E89] text-white shadow-xs font-semibold"
            >
              <Printer className="h-4 w-4 text-[#F3B51B]" />
              <span className={isKm ? "font-khmer" : ""}>{isKm ? "បោះពុម្ព" : "Print"}</span>
            </Button>

            {/* Export Excel Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="h-9 px-3.5 gap-1.5 rounded-xl border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30 shadow-xs font-semibold"
            >
              {isExportingExcel ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              )}
              <span className={isKm ? "font-khmer" : ""}>
                {isKm ? "ទាញយក Excel" : "Export Excel"}
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Print Surface */}
      <main className="p-4 sm:p-6 lg:p-8 print:p-0">
        <div className="max-w-[1600px] mx-auto bg-white text-slate-900 border border-slate-200 shadow-xl rounded-2xl p-6 sm:p-8 print:border-none print:shadow-none print:p-0 print:rounded-none print:max-w-none">
          <AbsenceLatePrintView reportData={reportData} language={language} />
        </div>
      </main>
    </div>
  );
};
