import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth-context";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Loader2,
  ShieldAlert,
  AlertCircle,
} from "lucide-react";
import {
  AbsenceLateFilters,
  AbsenceLateReportData,
} from "@/models/absence-late-report.model";
import { Classroom } from "@/models/classroom.model";
import { User } from "@/models/user.model";
import { StudyPackage } from "@/models/study-package.model";
import { classroomService } from "@/services/classroom.service";
import { userService } from "@/services/user.service";
import { studyPackageService } from "@/services/study-package.service";
import { absenceLateReportService } from "@/services/absence-late-report.service";
import { getCambodiaToday } from "@/lib/attendance-time-lock";

import { AbsenceLateSummaryCards } from "@/components/reports/absence-late/absence-late-summary-cards";
import { AbsenceLateFiltersCard } from "@/components/reports/absence-late/absence-late-filters";
import { AbsenceLateTable } from "@/components/reports/absence-late/absence-late-table";
import { AbsenceLateMobileCard } from "@/components/reports/absence-late/absence-late-mobile-card";
import { AbsenceLateEmptyState } from "@/components/reports/absence-late/absence-late-empty-state";

export const AbsenceLateReportPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Role validation: super_admin and admin only
  const isAuthorized = user?.role === "super_admin" || user?.role === "admin";

  const defaultMonth = useMemo(() => getCambodiaToday().slice(0, 7), []);

  const [filters, setFilters] = useState<AbsenceLateFilters>({
    yearMonth: defaultMonth,
    reportType: "either",
    minOccurrences: 1,
    selectedClassId: "all",
    selectedTeacherId: "all",
    selectedPackageId: "all",
    selectedSchedule: "all",
    searchQuery: "",
  });

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [studyPackages, setStudyPackages] = useState<StudyPackage[]>([]);

  const [reportData, setReportData] = useState<AbsenceLateReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);

  // Load dropdown options once
  useEffect(() => {
    if (!isAuthorized) return;

    const loadDropdownData = async () => {
      try {
        const [cList, uList, pList] = await Promise.all([
          classroomService.getClassrooms(),
          userService.getUsers(),
          studyPackageService.getStudyPackages(),
        ]);
        setClassrooms(cList);
        // Active teachers only (user.role === "teacher" && user.status === "active")
        // Excludes super_admin, admin, and inactive teacher accounts
        const activeTeachers = uList
          .filter((u) => u.role === "teacher" && u.status === "active")
          .sort((a, b) =>
            (a.name || "").localeCompare(b.name || "", undefined, {
              sensitivity: "base",
            })
          );
        setTeachers(activeTeachers);

        // Preserve selected teacher if active; otherwise reset to "all"
        setFilters((prev) => {
          if (
            prev.selectedTeacherId !== "all" &&
            !activeTeachers.some((t) => t.id === prev.selectedTeacherId)
          ) {
            return {
              ...prev,
              selectedTeacherId: "all",
            };
          }
          return prev;
        });

        setStudyPackages(pList);
      } catch (err) {
        console.error("Failed to load filter options:", err);
      }
    };

    loadDropdownData();
  }, [isAuthorized]);

  // Load report data whenever filters change
  const fetchReport = useCallback(
    async (showLoading = true) => {
      if (!isAuthorized) return;
      if (showLoading) setIsLoading(true);
      try {
        const data = await absenceLateReportService.generateReport(
          filters,
          user?.name
        );
        setReportData(data);
      } catch (error) {
        console.error("Failed to generate absence and late report:", error);
        toast.error(
          t("absenceLateReport.loadError", {
            defaultValue: "មិនអាចទាញយករបាយការណ៍អវត្តមាន និងមកយឺតបានទេ",
          })
        );
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [filters, isAuthorized, user?.name, t]
  );

  useEffect(() => {
    fetchReport(true);
  }, [fetchReport]);

  const handleFilterChange = <K extends keyof AbsenceLateFilters>(
    key: K,
    value: AbsenceLateFilters[K]
  ) => {
    // If setting selectedTeacherId, verify it's 'all' or a valid active teacher
    if (key === "selectedTeacherId" && value !== "all") {
      const isValid = teachers.some((t) => t.id === value);
      if (!isValid) {
        setFilters((prev) => ({ ...prev, selectedTeacherId: "all" }));
        return;
      }
    }
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      yearMonth: defaultMonth,
      reportType: "either",
      minOccurrences: 1,
      selectedClassId: "all",
      selectedTeacherId: "all",
      selectedPackageId: "all",
      selectedSchedule: "all",
      searchQuery: "",
    });
  };

  const hasActiveFilters = useMemo(() => {
    return (
      filters.reportType !== "either" ||
      filters.minOccurrences !== 1 ||
      filters.selectedClassId !== "all" ||
      filters.selectedTeacherId !== "all" ||
      filters.selectedPackageId !== "all" ||
      filters.selectedSchedule !== "all" ||
      filters.searchQuery.trim() !== "" ||
      filters.yearMonth !== defaultMonth
    );
  }, [filters, defaultMonth]);

  const handleExportExcel = async () => {
    if (!reportData) return;
    setIsExportingExcel(true);
    try {
      await absenceLateReportService.exportToExcel(
        reportData,
        i18n.language === "km" ? "km" : "en"
      );
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

  const handlePrint = () => {
    const params = new URLSearchParams({
      month: filters.yearMonth,
      type: filters.reportType,
      min: filters.minOccurrences.toString(),
      classId: filters.selectedClassId,
      teacherId: filters.selectedTeacherId,
      pkgId: filters.selectedPackageId,
      schedule: filters.selectedSchedule,
      q: filters.searchQuery,
    });
    navigate(`/absence-late-report/print?${params.toString()}`);
  };

  const handleViewStudentHistory = (studentId: string) => {
    navigate(`/student-attendance/${studentId}?month=${filters.yearMonth}`);
  };

  // Unauthorized screen
  if (!isAuthorized) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
        <div className="h-16 w-16 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground font-khmer">
          {t("common.unauthorized", { defaultValue: "មិនមានសិទ្ធិចូលមើលទិន្នន័យនេះទេ" })}
        </h2>
        <p className="text-xs text-muted-foreground font-khmer">
          {t("absenceLateReport.unauthorizedDesc")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header with Page Actions */}
      <PageHeader
        title={t("absenceLateReport.title")}
        description={t("absenceLateReport.description")}
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchReport(true)}
            disabled={isLoading}
            className="h-9 px-3 text-xs font-khmer rounded-xl gap-1.5 shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{t("absenceLateReport.refresh")}</span>
          </Button>

          {/* Print */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            disabled={isLoading || !reportData || reportData.students.length === 0}
            className="h-9 px-3 text-xs font-khmer rounded-xl gap-1.5 shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 text-primary" />
            <span>{t("absenceLateReport.printReport")}</span>
          </Button>

          {/* Export Excel */}
          <Button
            type="button"
            size="sm"
            onClick={handleExportExcel}
            disabled={isLoading || isExportingExcel || !reportData || reportData.students.length === 0}
            className="h-9 px-3.5 text-xs font-khmer rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
          >
            {isExportingExcel ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-100" />
            )}
            <span>{t("absenceLateReport.exportExcel")}</span>
          </Button>
        </div>
      </PageHeader>

      {/* 2. Top Summary Cards */}
      <AbsenceLateSummaryCards
        summary={
          reportData?.summary || {
            studentsFlagged: 0,
            studentsWithAbsences: 0,
            studentsWithLates: 0,
            totalAbsences: 0,
            totalLates: 0,
          }
        }
      />

      {/* 3. Filter Controls Card */}
      <AbsenceLateFiltersCard
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        classrooms={classrooms}
        teachers={teachers}
        studyPackages={studyPackages}
        hasActiveFilters={hasActiveFilters}
      />

      {/* 4. Results Section */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-3 bg-card rounded-2xl border border-border/80">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-khmer">
            {t("absenceLateReport.loadingData")}
          </p>
        </div>
      ) : !reportData || reportData.students.length === 0 ? (
        <AbsenceLateEmptyState
          onResetFilters={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-khmer px-1">
            <span>
              {t("absenceLateReport.resultsCount", {
                count: reportData.students.length,
              })}
            </span>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block">
            <AbsenceLateTable
              students={reportData.students}
              onViewStudentHistory={handleViewStudentHistory}
            />
          </div>

          {/* Mobile Cards */}
          <div className="block md:hidden">
            <AbsenceLateMobileCard
              students={reportData.students}
              onViewStudentHistory={handleViewStudentHistory}
            />
          </div>
        </div>
      )}
    </div>
  );
};
