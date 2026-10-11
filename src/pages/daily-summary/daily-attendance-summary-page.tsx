import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDailyAttendanceSummary } from "@/hooks/use-daily-attendance-summary";
import { DailySummaryHeader } from "@/components/daily-summary/daily-summary-header";
import { DailySummaryCards } from "@/components/daily-summary/daily-summary-cards";
import { DailySummaryFilters } from "@/components/daily-summary/daily-summary-filters";
import { DailySummaryTable } from "@/components/daily-summary/daily-summary-table";
import { DailySummaryMobileCards } from "@/components/daily-summary/daily-summary-mobile-cards";
import { Button } from "@/components/ui/button";
import {
  Palmtree,
  SearchX,
  CalendarX2,
  RotateCcw,
} from "lucide-react";

export const DailyAttendanceSummaryPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const {
    selectedDate,
    setSelectedDate,
    isLoading,
    overallSummary,
    classesSummary,
    filteredClasses,
    teachers,
    packages,
    searchQuery,
    setSearchQuery,
    selectedTeacherId,
    setSelectedTeacherId,
    selectedPackageId,
    setSelectedPackageId,
    selectedScheduleType,
    setSelectedScheduleType,
    selectedStatus,
    setSelectedStatus,
    hasActiveFilters,
    resetFilters,
    refresh,
  } = useDailyAttendanceSummary();

  const handleViewAttendance = (classroomId: string) => {
    navigate(`/attendance?classroomId=${classroomId}&date=${selectedDate}`);
  };

  const isSchoolClosed = overallSummary.isHoliday;
  const holidayName =
    i18n.language === "en" && overallSummary.holidayNameEn
      ? overallSummary.holidayNameEn
      : overallSummary.holidayNameKm;

  const scheduledCount = classesSummary.length;

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* 1. Header with Date Navigator & Timezone Context */}
      <DailySummaryHeader
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onRefresh={refresh}
        isLoading={isLoading}
        isSchoolClosed={isSchoolClosed}
        holidayName={holidayName}
      />

      {/* 2. Overall Summary Cards */}
      <DailySummaryCards
        summary={overallSummary}
        isSchoolClosed={isSchoolClosed}
      />

      {/* 3. Filters (Show only if school is open) */}
      {!isSchoolClosed && (
        <DailySummaryFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedTeacherId={selectedTeacherId}
          onTeacherChange={setSelectedTeacherId}
          selectedPackageId={selectedPackageId}
          onPackageChange={setSelectedPackageId}
          selectedScheduleType={selectedScheduleType}
          onScheduleTypeChange={setSelectedScheduleType}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          teachers={teachers}
          packages={packages}
          onResetFilters={resetFilters}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      {/* 4. Main Classrooms List / Table Area */}
      <div className="space-y-3">
        {/* Loading State Skeleton */}
        {isLoading ? (
          <div className="space-y-3 py-4">
            <div className="h-12 bg-card rounded-2xl border border-border/80 animate-pulse" />
            <div className="h-20 bg-card rounded-2xl border border-border/80 animate-pulse" />
            <div className="h-20 bg-card rounded-2xl border border-border/80 animate-pulse" />
            <div className="h-20 bg-card rounded-2xl border border-border/80 animate-pulse" />
          </div>
        ) : isSchoolClosed ? (
          /* School Closed Empty State */
          <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-dashed border-border/80 text-center font-khmer space-y-3">
            <div className="h-14 w-14 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Palmtree className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">
                {t("dailySummary.schoolClosed", { defaultValue: "សាលាឈប់សម្រាក" })}
              </h3>
              <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                {holidayName
                  ? `${t("dailySummary.schoolClosedNotice", {
                      defaultValue:
                        "សាលារៀនត្រូវបានបិទផ្លូវការនៅថ្ងៃនេះដោយសារជាថ្ងៃឈប់សម្រាក។ មិនមានកាលវិភាគបង្រៀនទេ។",
                    })} (${holidayName})`
                  : t("dailySummary.schoolClosedNotice")}
              </p>
            </div>
          </div>
        ) : scheduledCount === 0 ? (
          /* No Scheduled Classes for this date */
          <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-dashed border-border/80 text-center font-khmer space-y-3">
            <div className="h-14 w-14 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center">
              <CalendarX2 className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">
                {t("dailySummary.noScheduledClasses", { defaultValue: "មិនមានថ្នាក់ក្នុងកាលវិភាគទេ" })}
              </h3>
              <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                {t("dailySummary.noScheduledClassesDesc", {
                  defaultValue: "មិនមានថ្នាក់រៀនសកម្មត្រូវបានកំណត់កាលវិភាគសម្រាប់កាលបរិច្ឆេទនេះឡើយ។",
                })}
              </p>
            </div>
          </div>
        ) : filteredClasses.length === 0 ? (
          /* Filtered Results Empty */
          <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-dashed border-border/80 text-center font-khmer space-y-3">
            <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <SearchX className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">
                {t("dailySummary.noMatchingClasses", { defaultValue: "រកមិនឃើញថ្នាក់រៀនត្រូវគ្នាទេ" })}
              </h3>
              <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                {t("dailySummary.noMatchingClassesDesc", {
                  defaultValue: "មិនមានទិន្នន័យសង្ខេបវត្តមានថ្នាក់រៀនត្រូវនឹងលក្ខខណ្ឌស្វែងរក និងតម្រងឡើយ។",
                })}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="mt-2 text-xs font-khmer rounded-xl gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{t("studentAttendance.resetFilter", { defaultValue: "កំណត់ឡើងវិញ" })}</span>
            </Button>
          </div>
        ) : (
          /* Data Displays: Desktop Table & Mobile Cards */
          <div>
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-xs font-bold font-khmer text-foreground">
                {t("classes.title", { defaultValue: "ថ្នាក់រៀន" })} ({filteredClasses.length})
              </span>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              <DailySummaryTable
                items={filteredClasses}
                onViewAttendance={handleViewAttendance}
              />
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden">
              <DailySummaryMobileCards
                items={filteredClasses}
                onViewAttendance={handleViewAttendance}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
