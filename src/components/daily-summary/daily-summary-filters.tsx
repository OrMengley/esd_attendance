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
import { User } from "@/models/user.model";
import { StudyPackage } from "@/models/study-package.model";

interface DailySummaryFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTeacherId: string;
  onTeacherChange: (teacherId: string) => void;
  selectedPackageId: string;
  onPackageChange: (packageId: string) => void;
  selectedScheduleType: string;
  onScheduleTypeChange: (scheduleType: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  teachers: User[];
  packages: StudyPackage[];
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export const DailySummaryFilters: React.FC<DailySummaryFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedTeacherId,
  onTeacherChange,
  selectedPackageId,
  onPackageChange,
  selectedScheduleType,
  onScheduleTypeChange,
  selectedStatus,
  onStatusChange,
  teachers,
  packages,
  onResetFilters,
  hasActiveFilters,
}) => {
  const { t, i18n } = useTranslation();

  return (
    <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold font-khmer text-foreground">
          <Filter className="h-4 w-4 text-primary" />
          <span>{t("attendanceReports.filtersTitle", { defaultValue: "តម្រងទិន្នន័យ" })}</span>
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
            <span>{t("studentAttendance.resetFilter", { defaultValue: "កំណត់ឡើងវិញ" })}</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {/* 1. Search Query */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("dailySummary.searchPlaceholder", {
              defaultValue: "ស្វែងរកតាមឈ្មោះថ្នាក់ ឬកូដថ្នាក់...",
            })}
            className="pl-9 h-9 text-xs rounded-xl font-khmer bg-background border-border/80"
          />
        </div>

        {/* 2. Teacher Filter */}
        <Select value={selectedTeacherId} onValueChange={onTeacherChange}>
          <SelectTrigger className="h-9 text-xs rounded-xl font-khmer bg-background border-border/80">
            <SelectValue
              placeholder={t("dailySummary.allTeachers", { defaultValue: "គ្រូទាំងអស់" })}
            />
          </SelectTrigger>
          <SelectContent className="font-khmer">
            <SelectItem value="all">
              {t("dailySummary.allTeachers", { defaultValue: "គ្រូទាំងអស់" })}
            </SelectItem>
            {teachers.map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.id}>
                {teacher.name} (@{teacher.username})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 3. Study Package Filter */}
        <Select value={selectedPackageId} onValueChange={onPackageChange}>
          <SelectTrigger className="h-9 text-xs rounded-xl font-khmer bg-background border-border/80">
            <SelectValue
              placeholder={t("dailySummary.allPackages", { defaultValue: "កញ្ចប់សិក្សាទាំងអស់" })}
            />
          </SelectTrigger>
          <SelectContent className="font-khmer">
            <SelectItem value="all">
              {t("dailySummary.allPackages", { defaultValue: "កញ្ចប់សិក្សាទាំងអស់" })}
            </SelectItem>
            {packages.map((pkg) => (
              <SelectItem key={pkg.id} value={pkg.id}>
                {i18n.language === "en" && pkg.nameEn ? pkg.nameEn : pkg.nameKh} ({pkg.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 4. Schedule Type Filter */}
        <Select value={selectedScheduleType} onValueChange={onScheduleTypeChange}>
          <SelectTrigger className="h-9 text-xs rounded-xl font-khmer bg-background border-border/80">
            <SelectValue
              placeholder={t("dailySummary.allSchedules", { defaultValue: "កាលវិភាគទាំងអស់" })}
            />
          </SelectTrigger>
          <SelectContent className="font-khmer">
            <SelectItem value="all">
              {t("dailySummary.allSchedules", { defaultValue: "កាលវិភាគទាំងអស់" })}
            </SelectItem>
            <SelectItem value="weekday">
              {t("dailySummary.weekday", { defaultValue: "ចន្ទ - សុក្រ (ថ្ងៃធម្មតា)" })}
            </SelectItem>
            <SelectItem value="weekend">
              {t("dailySummary.weekend", { defaultValue: "សៅរ៍ - អាទិត្យ (ចុងសប្តាហ៍)" })}
            </SelectItem>
          </SelectContent>
        </Select>

        {/* 5. Completion Status Filter */}
        <Select value={selectedStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="h-9 text-xs rounded-xl font-khmer bg-background border-border/80">
            <SelectValue
              placeholder={t("dailySummary.allStatuses", { defaultValue: "ស្ថានភាពទាំងអស់" })}
            />
          </SelectTrigger>
          <SelectContent className="font-khmer">
            <SelectItem value="all">
              {t("dailySummary.allStatuses", { defaultValue: "ស្ថានភាពទាំងអស់" })}
            </SelectItem>
            <SelectItem value="completed">
              {t("dailySummary.completed", { defaultValue: "បានកត់ត្រារួចរាល់" })}
            </SelectItem>
            <SelectItem value="partial">
              {t("dailySummary.partial", { defaultValue: "បានកត់មួយផ្នែក" })}
            </SelectItem>
            <SelectItem value="not_recorded">
              {t("dailySummary.notRecorded", { defaultValue: "មិនទាន់កត់ត្រា" })}
            </SelectItem>
            <SelectItem value="missing">
              {t("dailySummary.missing", { defaultValue: "ខកខានកត់ត្រា" })}
            </SelectItem>
            <SelectItem value="upcoming">
              {t("dailySummary.upcoming", { defaultValue: "មិនទាន់ដល់ម៉ោង" })}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
