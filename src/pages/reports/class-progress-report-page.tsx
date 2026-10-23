import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import {
  ClassProgressFilters,
  ClassProgressReportData,
} from "@/models/class-progress-report.model";
import { User } from "@/models/user.model";
import { StudyPackage } from "@/models/study-package.model";
import { userService } from "@/services/user.service";
import { studyPackageService } from "@/services/study-package.service";
import { classProgressReportService } from "@/services/class-progress-report.service";
import { getCambodiaToday } from "@/lib/attendance-time-lock";

import { ClassProgressSummaryCards } from "@/components/reports/class-progress/class-progress-summary-cards";
import { ClassProgressFiltersCard } from "@/components/reports/class-progress/class-progress-filters";
import { ClassProgressTable } from "@/components/reports/class-progress/class-progress-table";
import { ClassProgressMobileCard } from "@/components/reports/class-progress/class-progress-mobile-card";
import { ClassProgressEmptyState } from "@/components/reports/class-progress/class-progress-empty-state";

const DEFAULT_FILTERS: ClassProgressFilters = {
  searchQuery: "",
  status: "active",
  packageId: "all",
  teacherId: "all",
  schedule: "all",
  progressRange: "all",
  health: "all",
};

export const ClassProgressReportPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { currentBranchId } = useBranch();
  const navigate = useNavigate();

  // Role validation: super_admin and admin only
  const isAuthorized = user?.role === "super_admin" || user?.role === "admin";

  const [filters, setFilters] = useState<ClassProgressFilters>(DEFAULT_FILTERS);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [studyPackages, setStudyPackages] = useState<StudyPackage[]>([]);

  const [reportData, setReportData] = useState<ClassProgressReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);

  // Check if any filter diverges from defaults
  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchQuery.trim() !== "" ||
      filters.status !== "active" ||
      filters.packageId !== "all" ||
      filters.teacherId !== "all" ||
      filters.schedule !== "all" ||
      filters.progressRange !== "all" ||
      filters.health !== "all"
    );
  }, [filters]);

  // Load dropdown options once
  useEffect(() => {
    if (!isAuthorized) return;

    const loadDropdownData = async () => {
      try {
        const [activeTeachers, pList] = await Promise.all([
          userService.getActiveTeachers(currentBranchId),
          studyPackageService.getStudyPackages(),
        ]);

        setTeachers(activeTeachers);
        setStudyPackages(pList);

        // Reset selected teacher if no longer active
        setFilters((prev) => {
          if (
            prev.teacherId !== "all" &&
            !activeTeachers.some((tea) => tea.id === prev.teacherId)
          ) {
            return {
              ...prev,
              teacherId: "all",
            };
          }
          return prev;
        });
      } catch (err) {
        console.error("Failed to load options for class progress report:", err);
      }
    };

    loadDropdownData();
  }, [isAuthorized, currentBranchId]);

  // Fetch report data
  const fetchReport = useCallback(
    async (showLoadingSpinner: boolean = true) => {
      if (!isAuthorized) return;
      if (showLoadingSpinner) {
        setIsLoading(true);
      }
      try {
        const data = await classProgressReportService.generateReport(
          filters,
          user?.name,
          currentBranchId,
          user
        );
        setReportData(data);
      } catch (err) {
        console.error("Failed to load class progress report:", err);
        toast.error(t("classProgressReport.loadError"));
      } finally {
        if (showLoadingSpinner) {
          setIsLoading(false);
        }
      }
    },
    [filters, isAuthorized, user, currentBranchId, t]
  );

  useEffect(() => {
    fetchReport(true);
  }, [fetchReport]);

  const handleFilterChange = <K extends keyof ClassProgressFilters>(
    key: K,
    value: ClassProgressFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handlePrint = () => {
    const params = new URLSearchParams();
    if (filters.searchQuery.trim()) params.set("q", filters.searchQuery.trim());
    if (filters.status) params.set("status", filters.status);
    if (filters.packageId) params.set("pkgId", filters.packageId);
    if (filters.teacherId) params.set("teacherId", filters.teacherId);
    if (filters.schedule) params.set("schedule", filters.schedule);
    if (filters.progressRange) params.set("progress", filters.progressRange);
    if (filters.health) params.set("health", filters.health);

    navigate(`/class-progress-report/print?${params.toString()}`);
  };

  const handleExportExcel = async () => {
    if (!reportData) return;
    setIsExportingExcel(true);
    try {
      const lang = i18n.language === "km" ? "km" : "en";
      await classProgressReportService.exportToExcel(reportData, lang);
      toast.success(t("classProgressReport.exportSuccess"));
    } catch (err) {
      console.error("Excel export error:", err);
      toast.error(t("classProgressReport.exportError"));
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleViewDetails = (classroomId: string) => {
    navigate(`/classes/${classroomId}`);
  };

  const handleViewAttendance = (classroomId: string) => {
    const currentMonth = getCambodiaToday().slice(0, 7);
    navigate(`/attendance-reports/monthly/${classroomId}/${currentMonth}`);
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
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

  const rows = reportData?.rows || [];
  const summary = reportData?.summary;

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Title and Action buttons */}
      <PageHeader
        title={t("classProgressReport.title")}
        description={t("classProgressReport.description")}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchReport(true)}
            disabled={isLoading}
            className="h-9 px-3 gap-1.5 rounded-xl border-slate-200 dark:border-slate-800 shadow-xs"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin text-primary" : "text-muted-foreground"}`}
            />
            <span className="font-khmer">{t("classProgressReport.refresh")}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            disabled={isLoading || rows.length === 0}
            className="h-9 px-3 gap-1.5 rounded-xl border-slate-200 dark:border-slate-800 shadow-xs"
          >
            <Printer className="h-4 w-4 text-muted-foreground" />
            <span className="font-khmer">{t("classProgressReport.printReport")}</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleExportExcel}
            disabled={isLoading || isExportingExcel || rows.length === 0}
            className="h-9 px-3 gap-1.5 rounded-xl shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isExportingExcel ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            <span className="font-khmer">{t("classProgressReport.exportExcel")}</span>
          </Button>
        </div>
      </PageHeader>

      {/* Summary Cards */}
      {summary && <ClassProgressSummaryCards summary={summary} />}

      {/* Filter Controls */}
      <ClassProgressFiltersCard
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        teachers={teachers}
        studyPackages={studyPackages}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="p-12 text-center bg-card rounded-2xl border border-border/60">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
          <p className="text-sm font-medium font-khmer text-muted-foreground">
            {t("classProgressReport.loadingData")}
          </p>
        </div>
      )}

      {/* Main Content Area */}
      {!isLoading && (
        <>
          {rows.length === 0 ? (
            <ClassProgressEmptyState
              onResetFilters={handleResetFilters}
              hasActiveFilters={hasActiveFilters}
            />
          ) : (
            <div className="space-y-4">
              {/* Results count banner */}
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>
                  {t("classProgressReport.resultsCount", { count: rows.length })}
                </span>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <ClassProgressTable
                  rows={rows}
                  onViewDetails={handleViewDetails}
                  onViewAttendance={handleViewAttendance}
                  pageSize={15}
                />
              </div>

              {/* Mobile Cards View */}
              <div className="block md:hidden">
                <ClassProgressMobileCard
                  rows={rows}
                  onViewDetails={handleViewDetails}
                  onViewAttendance={handleViewAttendance}
                  pageSize={10}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
