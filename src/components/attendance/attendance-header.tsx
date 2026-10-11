import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Classroom } from "@/models/classroom.model";
import { SchoolHoliday } from "@/models/school-holiday.model";
import { AttendanceAccessState } from "@/lib/attendance-time-lock";
import {
  ClipboardCheck,
  CheckCheck,
  Save,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  LockOpen,
  Edit3,
  X,
  Play,
  Palmtree,
} from "lucide-react";

interface AttendanceHeaderProps {
  onMarkAllPresent: () => void;
  onSave: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  hasExistingRecords: boolean;
  isEditing: boolean;
  isValidScheduleDay: boolean;
  hasClassSelected: boolean;
  hasStudents: boolean;
  accessState: AttendanceAccessState;
  selectedClassroom: Classroom | null;
  isTeacherRole: boolean;
  activeHoliday?: SchoolHoliday | null;
}

export const AttendanceHeader: React.FC<AttendanceHeaderProps> = ({
  onMarkAllPresent,
  onSave,
  onStartEdit,
  onCancelEdit,
  isSaving,
  hasUnsavedChanges,
  hasExistingRecords,
  isEditing,
  isValidScheduleDay,
  hasClassSelected,
  hasStudents,
  accessState,
  selectedClassroom,
  isTeacherRole,
  activeHoliday,
}) => {
  const { t } = useTranslation();

  const isHolidayLocked = accessState === "holiday";
  const isTimeLocked = (isTeacherRole && accessState !== "open") || isHolidayLocked;
  const isPostSaveLocked = hasExistingRecords && !isEditing;

  const isSaveDisabled =
    !hasClassSelected ||
    !isValidScheduleDay ||
    !hasStudents ||
    isTimeLocked ||
    isSaving;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
            <ClipboardCheck className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold font-khmer text-foreground tracking-tight">
                {t("attendance.pageTitle", { defaultValue: "កត់ត្រាវត្តមានប្រចាំថ្ងៃ" })}
              </h1>

              {/* Status Badges based on Access State & Lock State */}
              {hasClassSelected && (
                <>
                  {accessState === "holiday" && (
                    <Badge
                      variant="outline"
                      className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[11px] font-khmer py-0.5 px-2.5 gap-1.5"
                    >
                      <Palmtree className="h-3.5 w-3.5 text-amber-600" />
                      <span>
                        {t("holidays.schoolClosed", { defaultValue: "សាលាបិទ (ថ្ងៃឈប់សម្រាក)" })}
                        {activeHoliday ? ` · ${activeHoliday.nameKm}` : ""}
                      </span>
                    </Badge>
                  )}

                  {isTeacherRole && accessState === "upcoming" && selectedClassroom && (
                    <Badge
                      variant="outline"
                      className="bg-primary/10 text-primary dark:text-blue-300 border-primary/30 text-[11px] font-khmer py-0.5 px-2.5 gap-1.5"
                    >
                      <Clock className="h-3 w-3" />
                      <span>
                        {t("attendance.upcoming")} · {t("attendance.opensAt", { time: selectedClassroom.startTime })}
                      </span>
                    </Badge>
                  )}

                  {isTeacherRole && accessState === "finished" && selectedClassroom && (
                    <Badge
                      variant="outline"
                      className="bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30 text-[11px] font-khmer py-0.5 px-2.5 gap-1.5"
                    >
                      <Lock className="h-3 w-3" />
                      <span>
                        {t("attendance.finished")} · {t("attendance.endedAt", { time: selectedClassroom.endTime })}
                      </span>
                    </Badge>
                  )}

                  {isTeacherRole && accessState === "not_today" && (
                    <Badge
                      variant="outline"
                      className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 text-[11px] font-khmer py-0.5 px-2.5 gap-1"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      <span>{t("attendance.notToday")}</span>
                    </Badge>
                  )}

                  {(!isTeacherRole || accessState === "open") && accessState !== "holiday" && (
                    <>
                      {isPostSaveLocked ? (
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[11px] font-khmer py-0.5 px-2.5 gap-1.5"
                        >
                          <Lock className="h-3 w-3 text-emerald-600" />
                          <span>{t("attendance.savedLocked", { defaultValue: "បានរក្សាទុក (ចាក់សោរ)" })}</span>
                        </Badge>
                      ) : isEditing ? (
                        <Badge
                          variant="outline"
                          className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[11px] font-khmer py-0.5 px-2.5 gap-1.5 animate-pulse"
                        >
                          <Edit3 className="h-3 w-3 text-amber-600" />
                          <span>{t("attendance.editingMode", { defaultValue: "កំពុងកែប្រែ" })}</span>
                        </Badge>
                      ) : hasUnsavedChanges ? (
                        <Badge
                          variant="outline"
                          className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[11px] font-khmer py-0.5 px-2.5 gap-1 animate-pulse"
                        >
                          <Clock className="h-3 w-3" />
                          <span>{t("attendance.unsaved", { defaultValue: "មិនទាន់រក្សាទុក" })}</span>
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-khmer py-0.5 px-2.5 gap-1"
                        >
                          <Play className="h-3 w-3" />
                          <span>{t("attendance.inProgress", { defaultValue: "កំពុងរៀន" })}</span>
                        </Badge>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
            <p className="text-xs sm:text-sm font-khmer text-muted-foreground mt-0.5">
              {t("attendance.pageDescription", {
                defaultValue: "កត់ត្រា និងគ្រប់គ្រងវត្តមានសិស្សប្រចាំថ្ងៃតាមថ្នាក់រៀន និងកាលវិភាគ",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
        {/* If in Post-Save Locked Mode and class is open (or admin): show "Edit Attendance" */}
        {isPostSaveLocked && (!isTeacherRole || accessState === "open") && (
          <Button
            type="button"
            onClick={onStartEdit}
            variant="outline"
            disabled={!hasClassSelected || !hasStudents || isSaving}
            className="text-xs font-khmer h-9 sm:h-10 gap-2 border-primary/40 text-primary hover:bg-primary/10 px-4"
          >
            <LockOpen className="h-4 w-4" />
            <span>{t("attendance.editAttendance", { defaultValue: "កែប្រែវត្តមាន" })}</span>
          </Button>
        )}

        {/* If in Editing Mode: show "Cancel Edit" button */}
        {isEditing && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancelEdit}
            disabled={isSaving}
            className="text-xs font-khmer h-9 sm:h-10 gap-1.5 border-border"
          >
            <X className="h-4 w-4 text-muted-foreground" />
            <span>{t("attendance.cancelEdit", { defaultValue: "បោះបង់ការកែប្រែ" })}</span>
          </Button>
        )}

        {/* Mark All Present: Only enabled during active recording/editing */}
        {(!hasExistingRecords || isEditing) && (!isTeacherRole || accessState === "open") && (
          <Button
            type="button"
            variant="outline"
            onClick={onMarkAllPresent}
            disabled={!hasClassSelected || !isValidScheduleDay || !hasStudents || isTimeLocked || isSaving}
            className="text-xs font-khmer h-9 sm:h-10 gap-2 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
          >
            <CheckCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t("attendance.markAllPresent", { defaultValue: "វត្តមានទាំងអស់" })}</span>
          </Button>
        )}

        {/* Save / Update Attendance Button */}
        {(!hasExistingRecords || isEditing) && (!isTeacherRole || accessState === "open") && (
          <Button
            type="button"
            onClick={onSave}
            disabled={isSaveDisabled}
            className={`text-xs font-khmer h-9 sm:h-10 gap-2 text-white shadow-md px-5 ${
              isEditing
                ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/25"
                : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25"
            }`}
          >
            {isSaving ? (
              <span>{t("common.saving", { defaultValue: "កំពុងរក្សាទុក..." })}</span>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>
                  {isEditing
                    ? t("attendance.updateAttendance", { defaultValue: "កែប្រែវត្តមាន" })
                    : t("attendance.save", { defaultValue: "រក្សាទុកវត្តមាន" })}
                </span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
