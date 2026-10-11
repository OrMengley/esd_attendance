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
import { Search, X, Filter } from "lucide-react";
import {
  ClassProgressFilters,
  ClassProgressHealthFilter,
  ClassProgressRangeFilter,
  ClassProgressScheduleFilter,
  ClassProgressStatusFilter,
} from "@/models/class-progress-report.model";
import { StudyPackage } from "@/models/study-package.model";
import { User } from "@/models/user.model";
import { getPackageDisplayName } from "@/lib/class-progress-labels";

interface ClassProgressFiltersProps {
  filters: ClassProgressFilters;
  onFilterChange: <K extends keyof ClassProgressFilters>(
    key: K,
    value: ClassProgressFilters[K]
  ) => void;
  onResetFilters: () => void;
  teachers: User[];
  studyPackages: StudyPackage[];
  hasActiveFilters: boolean;
}

const LABEL_CLASS =
  "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block";
const TRIGGER_CLASS = "h-9 text-xs rounded-xl bg-background border-border/80 truncate";

export const ClassProgressFiltersCard: React.FC<ClassProgressFiltersProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  teachers,
  studyPackages,
  hasActiveFilters,
}) => {
  const { t, i18n } = useTranslation();
  const language = i18n.language === "km" ? "km" : "en";

  // Assigned Teacher filter: active users with role "teacher" only, sorted alphabetically.
  const activeTeachers = React.useMemo(
    () =>
      teachers
        .filter((u) => u.role === "teacher" && u.status === "active")
        .sort((a, b) =>
          (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" })
        ),
    [teachers]
  );

  // Auto-reset if selected teacher is no longer active, deleted, or missing
  React.useEffect(() => {
    if (
      filters.teacherId !== "all" &&
      !activeTeachers.some((tch) => tch.id === filters.teacherId)
    ) {
      onFilterChange("teacherId", "all");
    }
  }, [filters.teacherId, activeTeachers, onFilterChange]);

  return (
    <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <Filter className="h-4 w-4 text-primary" />
          <span>{t("classProgressReport.filters.title")}</span>
        </div>

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-7 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg gap-1"
          >
            <X className="h-3.5 w-3.5" />
            <span>{t("classProgressReport.filters.clearFilters")}</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* 1. Search by class name or code */}
        <div className="space-y-1 sm:col-span-2">
          <label className={LABEL_CLASS}>{t("classProgressReport.filters.searchLabel")}</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={filters.searchQuery}
              onChange={(e) => onFilterChange("searchQuery", e.target.value)}
              placeholder={t("classProgressReport.filters.searchPlaceholder")}
              className="pl-8 h-9 text-xs rounded-xl bg-background border-border/80"
            />
          </div>
        </div>

        {/* 2. Class status */}
        <div className="space-y-1">
          <label className={LABEL_CLASS}>{t("classProgressReport.filters.statusLabel")}</label>
          <Select
            value={filters.status}
            onValueChange={(val) => onFilterChange("status", val as ClassProgressStatusFilter)}
          >
            <SelectTrigger className={TRIGGER_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("classProgressReport.filters.allStatuses")}</SelectItem>
              <SelectItem value="active">{t("classProgressReport.filters.statusActive")}</SelectItem>
              <SelectItem value="completed">
                {t("classProgressReport.filters.statusCompleted")}
              </SelectItem>
              <SelectItem value="inactive">
                {t("classProgressReport.filters.statusInactive")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 3. Study package */}
        <div className="space-y-1">
          <label className={LABEL_CLASS}>{t("classProgressReport.filters.packageLabel")}</label>
          <Select
            value={filters.packageId}
            onValueChange={(val) => onFilterChange("packageId", val)}
          >
            <SelectTrigger className={TRIGGER_CLASS}>
              <SelectValue placeholder={t("classProgressReport.filters.allPackages")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("classProgressReport.filters.allPackages")}</SelectItem>
              {studyPackages.map((pkg) => (
                <SelectItem key={pkg.id} value={pkg.id}>
                  {getPackageDisplayName(pkg, language)} ({pkg.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 4. Assigned teacher (active teachers only) */}
        <div className="space-y-1">
          <label className={LABEL_CLASS}>{t("classProgressReport.filters.teacherLabel")}</label>
          <Select
            value={filters.teacherId}
            onValueChange={(val) => onFilterChange("teacherId", val)}
          >
            <SelectTrigger className={TRIGGER_CLASS}>
              <SelectValue placeholder={t("classProgressReport.filters.allTeachers")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("classProgressReport.filters.allTeachers")}</SelectItem>
              {activeTeachers.map((tch) => (
                <SelectItem key={tch.id} value={tch.id}>
                  {tch.username ? `${tch.name} (@${tch.username})` : tch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 5. Schedule */}
        <div className="space-y-1">
          <label className={LABEL_CLASS}>{t("classProgressReport.filters.scheduleLabel")}</label>
          <Select
            value={filters.schedule}
            onValueChange={(val) => onFilterChange("schedule", val as ClassProgressScheduleFilter)}
          >
            <SelectTrigger className={TRIGGER_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("classProgressReport.filters.allSchedules")}</SelectItem>
              <SelectItem value="weekday">
                {t("classProgressReport.filters.weekdaySchedule")}
              </SelectItem>
              <SelectItem value="weekend">
                {t("classProgressReport.filters.weekendSchedule")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 6. Progress range */}
        <div className="space-y-1">
          <label className={LABEL_CLASS}>{t("classProgressReport.filters.progressLabel")}</label>
          <Select
            value={filters.progressRange}
            onValueChange={(val) =>
              onFilterChange("progressRange", val as ClassProgressRangeFilter)
            }
          >
            <SelectTrigger className={TRIGGER_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("classProgressReport.filters.allProgress")}</SelectItem>
              <SelectItem value="not_started">
                {t("classProgressReport.filters.progressNotStarted")}
              </SelectItem>
              <SelectItem value="in_progress">
                {t("classProgressReport.filters.progressInProgress")}
              </SelectItem>
              <SelectItem value="near_completion">
                {t("classProgressReport.filters.progressNearCompletion")}
              </SelectItem>
              <SelectItem value="completed">
                {t("classProgressReport.filters.progressCompleted")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 7. Completion health */}
        <div className="space-y-1">
          <label className={LABEL_CLASS}>{t("classProgressReport.filters.healthLabel")}</label>
          <Select
            value={filters.health}
            onValueChange={(val) => onFilterChange("health", val as ClassProgressHealthFilter)}
          >
            <SelectTrigger className={TRIGGER_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("classProgressReport.filters.allHealth")}</SelectItem>
              <SelectItem value="on_track">{t("classProgressReport.health.onTrack")}</SelectItem>
              <SelectItem value="overdue">{t("classProgressReport.health.overdue")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
