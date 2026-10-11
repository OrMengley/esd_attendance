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
import { CorrectionReason } from "@/models/attendance-audit-log.model";
import { Search, RotateCcw } from "lucide-react";

interface AuditLogFiltersProps {
  startDate: string;
  onStartDateChange: (val: string) => void;
  endDate: string;
  onEndDateChange: (val: string) => void;
  classroomId: string;
  onClassroomIdChange: (val: string) => void;
  studentSearch: string;
  onStudentSearchChange: (val: string) => void;
  correctedById: string;
  onCorrectedByIdChange: (val: string) => void;
  previousStatus: AttendanceStatus | "all";
  onPreviousStatusChange: (val: AttendanceStatus | "all") => void;
  newStatus: AttendanceStatus | "all";
  onNewStatusChange: (val: AttendanceStatus | "all") => void;
  correctionReason: CorrectionReason | "all";
  onCorrectionReasonChange: (val: CorrectionReason | "all") => void;
  classrooms: Classroom[];
  adminUsers: User[];
  onReset: () => void;
}

const CORRECTION_REASONS: CorrectionReason[] = [
  "teacher_wrong_status",
  "student_valid_explanation",
  "medical_reason",
  "system_data_entry_error",
  "other",
];

const ATTENDANCE_STATUSES: AttendanceStatus[] = [
  "present",
  "absent",
  "late",
  "permission",
];

export const AuditLogFilters: React.FC<AuditLogFiltersProps> = ({
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  classroomId,
  onClassroomIdChange,
  studentSearch,
  onStudentSearchChange,
  correctedById,
  onCorrectedByIdChange,
  previousStatus,
  onPreviousStatusChange,
  newStatus,
  onNewStatusChange,
  correctionReason,
  onCorrectionReasonChange,
  classrooms,
  adminUsers,
  onReset,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-3">
      {/* Primary search & quick fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Student Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("attendanceCorrectionsPage.searchPlaceholder", {
              defaultValue: "Search by student code or name...",
            })}
            value={studentSearch}
            onChange={(e) => onStudentSearchChange(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        {/* Classroom */}
        <Select value={classroomId} onValueChange={onClassroomIdChange}>
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

      {/* Secondary filter selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1 border-t border-border/50">
        {/* Corrected By Admin */}
        <Select value={correctedById} onValueChange={onCorrectedByIdChange}>
          <SelectTrigger className="text-xs">
            <SelectValue placeholder={t("attendanceCorrection.changedBy", { defaultValue: "Corrected By" })} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all", { defaultValue: "All Admins" })}</SelectItem>
            {adminUsers.map((u) => (
              <SelectItem key={u.id} value={u.id} className="text-xs">
                {u.name} (@{u.username})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Previous Status */}
        <Select value={previousStatus} onValueChange={(val) => onPreviousStatusChange(val as AttendanceStatus | "all")}>
          <SelectTrigger className="text-xs">
            <SelectValue placeholder={t("attendanceCorrection.previousStatus", { defaultValue: "Changed From" })} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("attendanceAuditLogs.colChangedFrom", { defaultValue: "Changed From (All)" })}</SelectItem>
            {ATTENDANCE_STATUSES.map((st) => (
              <SelectItem key={st} value={st} className="text-xs">
                {t(`attendanceStatus.${st}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* New Status */}
        <Select value={newStatus} onValueChange={(val) => onNewStatusChange(val as AttendanceStatus | "all")}>
          <SelectTrigger className="text-xs">
            <SelectValue placeholder={t("attendanceCorrection.newStatus", { defaultValue: "Changed To" })} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("attendanceAuditLogs.colChangedTo", { defaultValue: "Changed To (All)" })}</SelectItem>
            {ATTENDANCE_STATUSES.map((st) => (
              <SelectItem key={st} value={st} className="text-xs">
                {t(`attendanceStatus.${st}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Correction Reason */}
        <Select value={correctionReason} onValueChange={(val) => onCorrectionReasonChange(val as CorrectionReason | "all")}>
          <SelectTrigger className="text-xs">
            <SelectValue placeholder={t("attendanceCorrection.reason", { defaultValue: "Reason" })} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all", { defaultValue: "All Reasons" })}</SelectItem>
            {CORRECTION_REASONS.map((r) => (
              <SelectItem key={r} value={r} className="text-xs">
                {t(`correctionReasons.${r}`, { defaultValue: r })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Reset button */}
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
  );
};
