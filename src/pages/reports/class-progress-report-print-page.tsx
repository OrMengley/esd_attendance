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
} from "lucide-react";
import {
  ClassProgressFilters,
  ClassProgressReportData,
  ClassProgressStatusFilter,
  ClassProgressScheduleFilter,
  ClassProgressRangeFilter,
  ClassProgressHealthFilter,
} from "@/models/class-progress-report.model";
import { classProgressReportService } from "@/services/class-progress-report.service";
import { ClassProgressPrintView } from "@/components/reports/class-progress/class-progress-print-view";

export const ClassProgressReportPrintPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const isAuthorized = user?.role === "super_admin" || user?.role === "admin";

  const searchParam = searchParams.get("q") || "";
  const statusParam = (searchParams.get("status") as ClassProgressStatusFilter) || "active";
  const pkgIdParam = searchParams.get("pkgId") || "all";
  const teacherIdParam = searchParams.get("teacherId") || "all";
  const scheduleParam = (searchParams.get("schedule") as ClassProgressScheduleFilter) || "all";
  const progressParam = (searchParams.get("progress") as ClassProgressRangeFilter) || "all";
  const healthParam = (searchParams.get("health") as ClassProgressHealthFilter) || "all";

  const [language, setLanguage] = useState<"km" | "en">(
    i18n.language === "km" ? "km" : "en"
  );
  const [reportData, setReportData] = useState<ClassProgressReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);

  useEffect(() => {
    if (!isAuthorized) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const filters: ClassProgressFilters = {
          searchQuery: searchParam,
          status: statusParam,
          packageId: pkgIdParam,
          teacherId: teacherIdParam,
          schedule: scheduleParam,
          progressRange: progressParam,
          health: healthParam,
        };
        const data = await classProgressReportService.generateReport(
          filters,
          user?.name
        );
        setReportData(data);
      } catch (err) {
        console.error("Failed to load class progress report for print:", err);
        toast.error(t("classProgressReport.loadError"));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [
    isAuthorized,
    searchParam,
    statusParam,
    pkgIdParam,
    teacherIdParam,
    scheduleParam,
    progressParam,
    healthParam,
    user?.name,
    t,
  ]);

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    navigate("/class-progress-report");
  };

  const handleExportExcel = async () => {
    if (!reportData) return;
    setIsExportingExcel(true);
    try {
      await classProgressReportService.exportToExcel(reportData, language);
      toast.success(t("classProgressReport.exportSuccess"));
    } catch (err) {
      console.error("Excel export error:", err);
      toast.error(t("classProgressReport.exportError"));
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
        <h2 className="text-xl font-bold font-khmer text-foreground">
          {t("classProgressReport.unauthorizedTitle")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          {t("classProgressReport.unauthorizedDesc")}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <h2 className={`text-lg font-bold text-foreground ${isKm ? "font-khmer" : ""}`}>
          {t("classProgressReport.print.preparing")}
        </h2>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="h-10 w-10 text-rose-500 mb-4" />
        <h2 className={`text-lg font-bold text-foreground ${isKm ? "font-khmer" : ""}`}>
          {t("classProgressReport.print.failedToLoad")}
        </h2>
        <Button variant="outline" onClick={handleBack} className={`mt-4 rounded-xl ${isKm ? "font-khmer" : ""}`}>
          {t("classProgressReport.print.back")}
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
                {t("classProgressReport.print.back")}
              </span>
            </Button>
            <div>
              <h1 className="text-sm font-bold font-khmer text-foreground">
                {t("classProgressReport.title")}
              </h1>
              <p className="text-[11px] text-muted-foreground font-mono">
                {reportData.summary.totalClasses} {isKm ? "ថ្នាក់រៀន" : "classes"}
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
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-9 px-3 gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 shadow-xs font-semibold"
            >
              <Printer className="h-4 w-4 text-slate-700 dark:text-slate-300" />
              <span className={isKm ? "font-khmer" : ""}>
                {t("classProgressReport.print.print")}
              </span>
            </Button>

            {/* Export Excel */}
            <Button
              variant="default"
              size="sm"
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="h-9 px-3 gap-1.5 rounded-xl shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {isExportingExcel ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              <span className={isKm ? "font-khmer" : ""}>
                {t("classProgressReport.exportExcel")}
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Print Container */}
      <main className="max-w-[1600px] mx-auto p-4 sm:p-6 print:p-0 print:max-w-none">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 print:border-none print:shadow-none overflow-hidden">
          <ClassProgressPrintView
            reportData={reportData}
            language={language}
          />
        </div>
      </main>
    </div>
  );
};
