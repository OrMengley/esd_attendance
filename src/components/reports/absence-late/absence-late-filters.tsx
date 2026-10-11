import React from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Filter, Calendar } from "lucide-react";
import {
  AbsenceLateFilters,
  AbsenceLateReportType,
  ScheduleFilterType,
} from "@/models/absence-late-report.model";
import { Classroom } from "@/models/classroom.model";
import { User } from "@/models/user.model";
import { StudyPackage } from "@/models/study-package.model";

interface AbsenceLateFiltersProps {
  filters: AbsenceLateFilters;
  onFilterChange: <K extends keyof AbsenceLateFilters>(
    key: K,
    value: AbsenceLateFilters[K]
  ) => void;
  onResetFilters: () => void;
  classrooms: Classroom[];
  teachers: User[];
  studyPackages: StudyPackage[];
  hasActiveFilters: boolean;
}

export const AbsenceLateFiltersCard: React.FC<AbsenceLateFiltersProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  classrooms,
  teachers,
  studyPackages,
  hasActiveFilters,
}) => {
  const { t, i18n } = useTranslation();

  const sortedTeachers = React.useMemo(() => {
    return teachers
      .filter((u) => u.role === "teacher" && u.status === "active")
      .sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", undefined, {
          sensitivity: "base",
        })
      );
  }, [teachers]);

  return (
    <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold font-khmer text-foreground">
          <Filter className="h-4 w-4 text-primary" />
          <span>{t("attendanceReports.filtersTitle", { defaultValue: "តម្រងរបាយការណ៍" })}</span>
        </div>

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-7 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg font-khmer gap-1"
          >
            <X className="h-3.5 w-3.5" />
            <span>{t("absenceLateReport.clearFilters")}</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2.5">
        {/* 1. Month Picker (YYYY-MM) */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground font-khmer uppercase tracking-wider block">
            {t("attendanceReports.selectMonth", { defaultValue: "ខែ / ឆ្នាំ" })}
          </label>
          <div className="relative">
            <Input
              type="month"
              value={filters.yearMonth}
              onChange={(e) => {
                if (e.target.value) {
                  onFilterChange("yearMonth", e.target.value);
                }
              }}
              className="h-9 text-xs rounded-xl font-sans bg-background border-border/80"
            />
          </div>
        </div>

        {/* 2. Report Type Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground font-khmer uppercase tracking-wider block">
            {t("absenceLateReport.reportType")}
          </label>
          <Select
            value={filters.reportType}
            onValueChange={(val) => onFilterChange("reportType", val as AbsenceLateReportType)}
          >
            <SelectTrigger className="h-9 text-xs rounded-xl font-khmer bg-background border-border/80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="font-khmer">
              <SelectItem value="either">
                {t("absenceLateReport.typeEither")}
              </SelectItem>
              <SelectItem value="absent_only">
                {t("absenceLateReport.typeAbsentOnly")}
              </SelectItem>
              <SelectItem value="late_only">
                {t("absenceLateReport.typeLateOnly")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 3. Minimum Occurrences */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground font-khmer uppercase tracking-wider block">
            {t("absenceLateReport.minOccurrences")}
          </label>
          <Input
            type="number"
            min={1}
            max={100}
            value={filters.minOccurrences}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              onFilterChange("minOccurrences", isNaN(val) || val < 1 ? 1 : val);
            }}
            className="h-9 text-xs rounded-xl font-mono bg-background border-border/80"
          />
        </div>

        {/* 4. Classroom Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground font-khmer uppercase tracking-wider block">
            {t("classes.classColumn", { defaultValue: "ថ្នាក់រៀន" })}
          </label>
          <Select
            value={filters.selectedClassId}
            onValueChange={(val) => onFilterChange("selectedClassId", val)}
          >
            <SelectTrigger className="h-9 text-xs rounded-xl font-khmer bg-background border-border/80 truncate">
              <SelectValue placeholder={t("absenceLateReport.allClasses")} />
            </SelectTrigger>
            <SelectContent className="font-khmer">
              <SelectItem value="all">
                {t("absenceLateReport.allClasses")}
              </SelectItem>
              {classrooms.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} ({cls.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 5. Teacher Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground font-khmer uppercase tracking-wider block">
            {t("classes.teacher", { defaultValue: "គ្រូបង្រៀន" })}
          </label>
          <Select
            value={filters.selectedTeacherId}
            onValueChange={(val) => onFilterChange("selectedTeacherId", val)}
          >
            <SelectTrigger className="h-9 text-xs rounded-xl font-khmer bg-background border-border/80 truncate">
              <SelectValue placeholder={t("absenceLateReport.allTeachers")} />
            </SelectTrigger>
            <SelectContent className="font-khmer">
              <SelectItem value="all">
                {t("absenceLateReport.allTeachers")}
              </SelectItem>
              {sortedTeachers.map((tch) => (
                <SelectItem key={tch.id} value={tch.id}>
                  {tch.username ? `${tch.name} (@${tch.username})` : tch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 6. Study Package Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground font-khmer uppercase tracking-wider block">
            {t("classes.package", { defaultValue: "កញ្ចប់សិក្សា" })}
          </label>
          <Select
            value={filters.selectedPackageId}
            onValueChange={(val) => onFilterChange("selectedPackageId", val)}
          >
            <SelectTrigger className="h-9 text-xs rounded-xl font-khmer bg-background border-border/80 truncate">
              <SelectValue placeholder={t("absenceLateReport.allPackages")} />
            </SelectTrigger>
            <SelectContent className="font-khmer">
              <SelectItem value="all">
                {t("absenceLateReport.allPackages")}
              </SelectItem>
              {studyPackages.map((pkg) => (
                <SelectItem key={pkg.id} value={pkg.id}>
                  {i18n.language === "en" && pkg.nameEn ? pkg.nameEn : pkg.nameKh} ({pkg.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 7. Schedule Filter (Default All Schedules!) */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground font-khmer uppercase tracking-wider block">
            {t("absenceLateReport.schedule")}
          </label>
          <Select
            value={filters.selectedSchedule}
            onValueChange={(val) => onFilterChange("selectedSchedule", val as ScheduleFilterType)}
          >
            <SelectTrigger className="h-9 text-xs rounded-xl font-khmer bg-background border-border/80">
              <SelectValue placeholder={t("absenceLateReport.allSchedules")} />
            </SelectTrigger>
            <SelectContent className="font-khmer">
              <SelectItem value="all">
                {t("absenceLateReport.allSchedules")}
              </SelectItem>
              <SelectItem value="weekday">
                {t("absenceLateReport.weekdaySchedule")}
              </SelectItem>
              <SelectItem value="weekend">
                {t("absenceLateReport.weekendSchedule")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 8. Student Search */}
        <div className="space-y-1 sm:col-span-2 md:col-span-1 xl:col-span-1">
          <label className="text-[10px] font-semibold text-muted-foreground font-khmer uppercase tracking-wider block">
            {t("common.search", { defaultValue: "ស្វែងរក" })}
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={filters.searchQuery}
              onChange={(e) => onFilterChange("searchQuery", e.target.value)}
              placeholder={t("absenceLateReport.searchPlaceholder")}
              className="pl-8 h-9 text-xs rounded-xl font-khmer bg-background border-border/80"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
