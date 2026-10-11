import React from "react";
import { useTranslation } from "react-i18next";
import { Classroom } from "@/models/classroom.model";
import { StudyPackage } from "@/models/study-package.model";
import { User } from "@/models/user.model";
import { SchoolHoliday } from "@/models/school-holiday.model";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  School,
  Calendar,
  BookOpen,
  GraduationCap,
  Clock,
  Users,
  AlertTriangle,
  Lock,
  Play,
  Info,
  CheckCircle2,
  Edit3,
  Palmtree,
} from "lucide-react";
import { formatKhmerDate } from "@/lib/utils";
import {
  AttendanceAccessState,
  getAttendanceAccessState,
} from "@/lib/attendance-time-lock";

interface ClassAttendanceSelectorProps {
  classrooms: Classroom[];
  packages: StudyPackage[];
  teachers: User[];
  selectedClassId: string;
  onSelectClassId: (classId: string) => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  selectedClassroom: Classroom | null;
  selectedPackage: StudyPackage | null;
  selectedTeacher: User | null;
  eligibleStudentCount: number;
  isValidScheduleDay: boolean;
  isTeacherRole: boolean;
  accessState: AttendanceAccessState;
  hasExistingRecords: boolean;
  isEditing: boolean;
  activeHolidays?: SchoolHoliday[];
  activeHoliday?: SchoolHoliday | null;
}

export const ClassAttendanceSelector: React.FC<ClassAttendanceSelectorProps> = ({
  classrooms,
  packages,
  teachers,
  selectedClassId,
  onSelectClassId,
  selectedDate,
  onSelectDate,
  selectedClassroom,
  selectedPackage,
  selectedTeacher,
  eligibleStudentCount,
  isValidScheduleDay,
  isTeacherRole,
  accessState,
  hasExistingRecords,
  isEditing,
  activeHolidays = [],
  activeHoliday,
}) => {
  const { t } = useTranslation();

  const isWeekday = selectedClassroom
    ? selectedClassroom.scheduleDays.length === 5
    : false;
  const daysText = selectedClassroom
    ? isWeekday
      ? t("classes.mondayToFriday")
      : t("classes.saturdaySunday")
    : "";

  return (
    <div className="space-y-4">
      {/* Selection Form Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Date Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold font-khmer flex items-center gap-1.5 text-foreground">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>{t("attendance.selectDate", { defaultValue: "កាលបរិច្ឆេទវត្តមាន" })}</span>
              <span className="text-rose-500">*</span>
            </Label>
            {isTeacherRole && (
              <span className="text-[10px] text-muted-foreground font-khmer flex items-center gap-1">
                <Lock className="h-2.5 w-2.5" />
                <span>{t("attendance.todayCambodia", { defaultValue: "ថ្ងៃនេះ (កម្ពុជា)" })}</span>
              </span>
            )}
          </div>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => onSelectDate(e.target.value)}
            disabled={isTeacherRole}
            className={`text-xs sm:text-sm h-10 rounded-xl ${
              isTeacherRole ? "bg-muted/40 cursor-not-allowed opacity-90" : "bg-background"
            }`}
            required
          />
        </div>

        {/* 2. Class Selector */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold font-khmer flex items-center gap-1.5 text-foreground">
            <School className="h-3.5 w-3.5 text-primary" />
            <span>{t("attendance.selectClass", { defaultValue: "សូមជ្រើសរើសថ្នាក់រៀន" })}</span>
            <span className="text-rose-500">*</span>
          </Label>
          <Select
            value={selectedClassId}
            onValueChange={onSelectClassId}
            disabled={classrooms.length === 0}
          >
            <SelectTrigger className="text-xs sm:text-sm h-10 bg-background rounded-xl font-khmer">
              <SelectValue
                placeholder={
                  classrooms.length === 0
                    ? isTeacherRole
                      ? t("attendance.noAssignedClasses", { defaultValue: "មិនមានថ្នាក់បង្រៀនត្រូវបានចាត់តាំងទេ" })
                      : t("attendance.noActiveClasses", { defaultValue: "មិនមានថ្នាក់រៀនសកម្មទេ" })
                    : t("attendance.selectClassPlaceholder", { defaultValue: "ជ្រើសរើសថ្នាក់រៀន..." })
                }
              />
            </SelectTrigger>
            <SelectContent className="max-h-72 font-khmer">
              {classrooms.map((cls) => {
                const tch = teachers.find((u) => u.id === cls.assignedTeacherId);
                const clsState = getAttendanceAccessState(
                  cls,
                  selectedDate,
                  isTeacherRole ? "teacher" : "admin",
                  activeHolidays
                );

                return (
                  <SelectItem key={cls.id} value={cls.id} className="py-2.5">
                    <div className="flex items-center justify-between gap-3 w-full">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-bold text-xs bg-muted px-1.5 py-0.5 rounded text-primary shrink-0">
                          {cls.code}
                        </span>
                        <span className="font-semibold text-xs text-foreground truncate">
                          {cls.name}
                        </span>
                        {tch && !isTeacherRole && (
                          <span className="text-[11px] text-muted-foreground font-mono truncate">
                            ({tch.name})
                          </span>
                        )}
                      </div>

                      {/* State Badge on item */}
                      <div className="shrink-0 ml-2">
                        {clsState === "holiday" ? (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] py-0 px-1.5 font-khmer gap-1">
                            <Palmtree className="h-2.5 w-2.5 text-amber-600" />
                            <span>{t("holidays.schoolClosed", { defaultValue: "សាលាបិទ" })}</span>
                          </Badge>
                        ) : isTeacherRole && clsState === "open" ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] py-0 px-1.5 font-khmer">
                            {t("attendance.inProgress")}
                          </Badge>
                        ) : isTeacherRole && clsState === "upcoming" ? (
                          <Badge variant="outline" className="bg-primary/10 text-primary dark:text-blue-300 border-primary/30 text-[10px] py-0 px-1.5 font-khmer">
                            {cls.startTime}
                          </Badge>
                        ) : isTeacherRole && clsState === "finished" ? (
                          <Badge variant="outline" className="bg-slate-500/10 text-slate-600 dark:text-slate-400 text-[10px] py-0 px-1.5 font-khmer">
                            {t("attendance.finished")}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 1. School Holiday / Closure Alert Banner (Priority #1) */}
      {selectedClassroom && accessState === "holiday" && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3.5 text-xs sm:text-sm font-khmer shadow-xs animate-in fade-in">
          <div className="p-2 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-xl shrink-0 mt-0.5">
            <Palmtree className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm sm:text-base">
              {t("holidays.closedToday", { defaultValue: "សាលាត្រូវបានបិទសម្រាប់ថ្ងៃនេះ (ថ្ងៃឈប់សម្រាក)" })}
            </h4>
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              {activeHoliday?.nameKm} {activeHoliday?.nameEn ? `(${activeHoliday.nameEn})` : ""}
              {activeHoliday ? ` · ${formatKhmerDate(activeHoliday.startDate)} ដល់ ${formatKhmerDate(activeHoliday.endDate)}` : ""}
            </p>
            <p className="text-xs text-muted-foreground font-khmer leading-relaxed">
              {t("holidays.attendanceLocked", {
                defaultValue: "ការកត់ត្រាវត្តមានត្រូវបានផ្អាក និងចាក់សោរក្នុងអំឡុងពេលថ្ងៃឈប់សម្រាក។",
              })}
            </p>
          </div>
        </div>
      )}

      {/* 2. Warning Alert if Date is NOT a scheduled learning day */}
      {selectedClassroom && accessState !== "holiday" && !isValidScheduleDay && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 flex items-start gap-3 text-xs sm:text-sm font-khmer shadow-xs animate-in fade-in">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">
              {t("attendance.noClassToday", {
                defaultValue: "ថ្នាក់នេះមិនមានកាលវិភាគរៀននៅថ្ងៃដែលបានជ្រើសរើសទេ",
              })}
            </h4>
            <p className="text-xs text-muted-foreground font-khmer leading-relaxed">
              {t("attendance.scheduleMismatchHint", {
                defaultValue: `កាលវិភាគថ្នាក់នេះគឺ: ${daysText} (${selectedClassroom.startTime} - ${selectedClassroom.endTime})។ ការកត់ត្រាវត្តមានត្រូវបានបិទសម្រាប់ថ្ងៃមិនមែនម៉ោងរៀន។`,
              })}
            </p>
          </div>
        </div>
      )}

      {/* State Specific Alert Banners for Teacher (when not holiday) */}
      {selectedClassroom && accessState !== "holiday" && isValidScheduleDay && isTeacherRole && (
        <>
          {/* 1. Upcoming */}
          {accessState === "upcoming" && (
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 text-primary dark:text-blue-200 flex items-start gap-3 text-xs sm:text-sm font-khmer shadow-xs animate-in fade-in">
              <Clock className="h-5 w-5 text-primary dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm">
                  {t("attendance.upcoming")} · {t("attendance.opensAt", { time: selectedClassroom.startTime })}
                </h4>
                <p className="text-xs text-primary/80 dark:text-blue-300 font-khmer leading-relaxed">
                  {t("attendance.upcomingHint", {
                    startTime: selectedClassroom.startTime,
                    defaultValue: `ថ្នាក់នេះនឹងចាប់ផ្តើមនៅម៉ោង ${selectedClassroom.startTime}។ ការកត់ត្រាវត្តមានមិនទាន់អាចធ្វើបាននៅឡើយទេ។`,
                  })}
                </p>
              </div>
            </div>
          )}

          {/* 2. Finished */}
          {accessState === "finished" && (
            <div className="p-4 rounded-2xl bg-slate-500/10 border border-slate-500/30 text-slate-800 dark:text-slate-200 flex items-start gap-3 text-xs sm:text-sm font-khmer shadow-xs animate-in fade-in">
              <Lock className="h-5 w-5 text-slate-600 dark:text-slate-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm">
                  {t("attendance.finished")} · {t("attendance.endedAt", { time: selectedClassroom.endTime })}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-khmer leading-relaxed">
                  {t("attendance.classEndedHint", {
                    endTime: selectedClassroom.endTime,
                    defaultValue: `ម៉ោងរៀនបានបញ្ចប់នៅម៉ោង ${selectedClassroom.endTime}។ ការកត់ត្រាវត្តមានត្រូវបានចាក់សោរមិនអាចកែប្រែបានទៀតទេ។`,
                  })}
                </p>
              </div>
            </div>
          )}

          {/* 3. In Progress but Post-Save Locked */}
          {accessState === "open" && hasExistingRecords && !isEditing && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-3 text-xs font-khmer shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  {t("attendance.savedLockHint", {
                    endTime: selectedClassroom.endTime,
                    defaultValue: `វត្តមានបានរក្សាទុក។ អាចកែប្រែបានត្រឹមមុនម៉ោង ${selectedClassroom.endTime} ប៉ុណ្ណោះ។`,
                  })}
                </span>
              </div>
            </div>
          )}

          {/* 4. In Progress & In Editing Mode */}
          {accessState === "open" && isEditing && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 flex items-center gap-2.5 text-xs font-khmer shadow-xs animate-in fade-in">
              <Edit3 className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                {t("attendance.editingModeHint", {
                  defaultValue: "កំពុងស្ថិតក្នុងទម្រង់កែប្រែវត្តមាន។ សូមចុច \"កែប្រែវត្តមាន\" បន្ទាប់ពីកែសម្រួលរួច។",
                })}
              </span>
            </div>
          )}
        </>
      )}

      {/* Selected Class Information Card */}
      {selectedClassroom && (
        <Card className="rounded-2xl border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card dark:from-primary/10 dark:via-card dark:to-card shadow-xs overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20">
                    {selectedClassroom.code}
                  </span>
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] py-0 px-2 font-khmer">
                    {t("enrollment.statusActive")}
                  </Badge>

                  {/* Dynamic Time / Holiday Status Badge */}
                  {accessState === "holiday" ? (
                    <Badge variant="outline" className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] py-0 px-2 font-khmer gap-1">
                      <Palmtree className="h-2.5 w-2.5 text-amber-600" />
                      <span>{t("holidays.schoolClosed", { defaultValue: "សាលាបិទ" })}</span>
                    </Badge>
                  ) : isTeacherRole && (
                    <>
                      {accessState === "open" ? (
                        <Badge className="bg-emerald-600 text-white text-[10px] py-0 px-2 font-khmer gap-1">
                          <Play className="h-2.5 w-2.5 fill-white" />
                          <span>{t("attendance.inProgress")} ({selectedClassroom.startTime} - {selectedClassroom.endTime})</span>
                        </Badge>
                      ) : accessState === "upcoming" ? (
                        <Badge variant="outline" className="bg-primary/10 text-primary dark:text-blue-300 border-primary/30 text-[10px] py-0 px-2 font-khmer gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          <span>{t("attendance.opensAt", { time: selectedClassroom.startTime })}</span>
                        </Badge>
                      ) : accessState === "finished" ? (
                        <Badge variant="outline" className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30 text-[10px] py-0 px-2 font-khmer gap-1">
                          <Lock className="h-2.5 w-2.5" />
                          <span>{t("attendance.finished")}</span>
                        </Badge>
                      ) : null}
                    </>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground font-khmer truncate">
                  {selectedClassroom.name}
                </h3>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <div className="text-right">
                  <span className="text-[11px] text-muted-foreground block font-khmer">
                    {t("attendance.selectedDateLabel", { defaultValue: "ថ្ងៃវត្តមាន" })}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-foreground font-khmer">
                    {formatKhmerDate(selectedDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
              {/* Study Package */}
              <div className="p-2.5 rounded-xl bg-card border border-border/70 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground font-khmer flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>{t("enrollment.studyPackage")}</span>
                </span>
                <p className="font-bold text-foreground font-khmer truncate pl-5">
                  {selectedPackage ? selectedPackage.nameKh : "-"}
                </p>
              </div>

              {/* Teacher */}
              <div className="p-2.5 rounded-xl bg-card border border-border/70 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground font-khmer flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>{t("enrollment.teacher")}</span>
                </span>
                <p className="font-bold text-foreground font-khmer truncate pl-5">
                  {selectedTeacher ? selectedTeacher.name : "-"}
                </p>
              </div>

              {/* Schedule */}
              <div className="p-2.5 rounded-xl bg-card border border-border/70 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground font-khmer flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>{t("enrollment.schedule")}</span>
                </span>
                <p className="font-bold text-foreground font-khmer truncate pl-5">
                  {daysText} ({selectedClassroom.startTime} - {selectedClassroom.endTime})
                </p>
              </div>

              {/* Eligible Students */}
              <div className="p-2.5 rounded-xl bg-card border border-border/70 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground font-khmer flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>{t("attendance.eligibleStudents", { defaultValue: "សិស្សមានសិទ្ធិចូលរៀន" })}</span>
                </span>
                <p className="font-bold text-foreground font-mono pl-5">
                  <span className="text-primary font-bold text-sm">{eligibleStudentCount}</span>{" "}
                  <span className="text-xs font-khmer font-normal text-muted-foreground">
                    {t("classes.studentsUnit")}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
