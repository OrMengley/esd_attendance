import React from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Classroom } from "@/models/classroom.model";
import { User } from "@/models/user.model";
import { AttendanceStatus } from "@/models/attendance.model";
import { Search, RotateCcw } from "lucide-react";

interface AttendanceCorrectionFiltersProps {
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
  selectedClassId: string;
  onClassIdChange: (val: string) => void;
  selectedTeacherId: string;
  onTeacherIdChange: (val: string) => void;
  selectedStatus: AttendanceStatus | "all";
  onStatusChange: (val: AttendanceStatus | "all") => void;
  startDate: string;
  onStartDateChange: (val: string) => void;
  endDate: string;
  onEndDateChange: (val: string) => void;
  correctedOnly: boolean;
  onCorrectedOnlyChange: (val: boolean) => void;
  classrooms: Classroom[];
  teachers: User[];
  onReset: () => void;
}

const ATTENDANCE_STATUSES: AttendanceStatus[] = [
  "present",
  "absent",
  "late",
  "permission",
];

export const AttendanceCorrectionFilters: React.FC<AttendanceCorrectionFiltersProps> = ({
  searchQuery,
  onSearchQueryChange,
  selectedClassId,
  onClassIdChange,
  selectedTeacherId,
  onTeacherIdChange,
  selectedStatus,
  onStatusChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  correctedOnly,
  onCorrectedOnlyChange,
  classrooms,
  teachers,
  onReset,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-3">
      {/* Top row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Universal Search (student code, student name, class code, class name) */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("attendanceCorrectionsPage.searchPlaceholder", {
              defaultValue: "Search student, class, or code...",
            })}
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        {/* Classroom */}
        <Select value={selectedClassId} onValueChange={onClassIdChange}>
          <SelectTrigger className="text-xs">
            <SelectValue placeholder={t("attendanceCorrectionsPage.allClasses", { defaultValue: "All Classes" })} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("attendanceCorrectionsPage.allClasses", { defaultValue: "All Classes" })}</SelectItem>
            {classrooms.map((c) => (
              <SelectItem key={c.id} value={c.id} className="text-xs">
                {c.name} ({c.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Start Date */}
        <div>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="text-xs font-mono"
            title={t("attendanceCorrectionsPage.fromDate", { defaultValue: "From Date" })}
          />
        </div>

        {/* End Date */}
        <div>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="text-xs font-mono"
            title={t("attendanceCorrectionsPage.toDate", { defaultValue: "To Date" })}
          />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 border-t border-border/50 items-center">
        {/* Teacher */}
        <Select value={selectedTeacherId} onValueChange={onTeacherIdChange}>
          <SelectTrigger className="text-xs">
            <SelectValue placeholder={t("attendanceCorrectionsPage.allTeachers", { defaultValue: "All Teachers" })} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("attendanceCorrectionsPage.allTeachers", { defaultValue: "All Teachers" })}</SelectItem>
            {teachers.map((tc) => (
              <SelectItem key={tc.id} value={tc.id} className="text-xs">
                {tc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status */}
        <Select value={selectedStatus} onValueChange={(val) => onStatusChange(val as AttendanceStatus | "all")}>
          <SelectTrigger className="text-xs">
            <SelectValue placeholder={t("attendanceStatus.allStatuses", { defaultValue: "All Statuses" })} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("attendanceStatus.allStatuses", { defaultValue: "All Statuses" })}</SelectItem>
            {ATTENDANCE_STATUSES.map((st) => (
              <SelectItem key={st} value={st} className="text-xs">
                {t(`attendanceStatus.${st}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Show Only Corrected Toggle */}
        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground px-1 select-none">
          <input
            type="checkbox"
            checked={correctedOnly}
            onChange={(e) => onCorrectedOnlyChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
          />
          <span>{t("attendanceCorrection.badgeCorrected", { defaultValue: "Corrected Only" })}</span>
        </label>

        {/* Reset button */}
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReset}
            className="text-xs gap-1.5 h-9"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{t("common.clearFilters", { defaultValue: "Clear Filters" })}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
