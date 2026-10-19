import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";
import { classroomService } from "@/services/classroom.service";
import { studyPackageService } from "@/services/study-package.service";
import { userService } from "@/services/user.service";
import { attendanceService } from "@/services/attendance.service";
import { schoolHolidayService } from "@/services/school-holiday.service";
import { Classroom } from "@/models/classroom.model";
import { StudyPackage } from "@/models/study-package.model";
import { User } from "@/models/user.model";
import { Student } from "@/models/student.model";
import { Enrollment } from "@/models/enrollment.model";
import { Attendance, AttendanceStatus } from "@/models/attendance.model";
import { SchoolHoliday } from "@/models/school-holiday.model";
import { getHolidayForDate } from "@/lib/holiday-calendar";
import { AttendanceHeader } from "@/components/attendance/attendance-header";
import { ClassAttendanceSelector } from "@/components/attendance/class-attendance-selector";
import { AttendanceSummary } from "@/components/attendance/attendance-summary";
import {
  AttendanceStudentTable,
  StudentAttendanceItem,
} from "@/components/attendance/attendance-student-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  getCambodiaToday,
  getCambodiaDateTime,
  getAttendanceAccessState,
  getDayOfWeekFromDateStr,
  AttendanceAccessState,
} from "@/lib/attendance-time-lock";
import { toast } from "sonner";
import { LockOpen, AlertCircle } from "lucide-react";

export const DailyAttendancePage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currentBranchId, isAllBranches } = useBranch();
  const [searchParams] = useSearchParams();

  const isTeacher = user?.role === "teacher";

  const paramDate = searchParams.get("date");
  const paramClassroomId = searchParams.get("classroomId");

  // Cambodia Date (Teacher is locked to today; Admin may choose date or read from query params)
  const [date, setDate] = useState<string>(() => {
    if (!isTeacher && paramDate) {
      return paramDate;
    }
    return getCambodiaToday();
  });
  const [selectedClassId, setSelectedClassId] = useState<string>(() => paramClassroomId || "");

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [packages, setPackages] = useState<StudyPackage[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [activeHolidays, setActiveHolidays] = useState<SchoolHoliday[]>([]);

  const [attendanceItems, setAttendanceItems] = useState<StudentAttendanceItem[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState<StudentAttendanceItem[]>([]);
  const [hasExistingRecords, setHasExistingRecords] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmEditOpen, setIsConfirmEditOpen] = useState(false);

  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Time ticker to update time state automatically every 10 seconds
  const [currentTimeTick, setCurrentTimeTick] = useState<string>(() => getCambodiaDateTime().timeStr);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeTick(getCambodiaDateTime().timeStr);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Ensure teacher date is always Cambodia today
  useEffect(() => {
    if (isTeacher) {
      setDate(getCambodiaToday());
    }
  }, [isTeacher]);

  // Load classrooms, packages, teachers, and active holidays
  const loadInitialData = useCallback(async () => {
    setIsLoadingClasses(true);
    try {
      const [allClasses, allPackages, allUsers, holidays] = await Promise.all([
        classroomService.getClassrooms(),
        studyPackageService.getStudyPackages(),
        userService.getUsers(),
        schoolHolidayService.getActiveSchoolHolidays(),
      ]);

      const activeClasses = allClasses.filter((c) => c.status === "active");
      const branchScopedClasses = (!isAllBranches && currentBranchId)
        ? activeClasses.filter((c) => c.branchId === currentBranchId)
        : activeClasses;

      const accessibleClasses = isTeacher
        ? branchScopedClasses.filter((c) => c.assignedTeacherId === user?.id)
        : branchScopedClasses;

      setClassrooms(accessibleClasses);
      setPackages(allPackages);
      setTeachers(allUsers);
      setActiveHolidays(holidays);

      if (accessibleClasses.length > 0) {
        setIsLoadingAttendance(true);
        setSelectedClassId((prev) => {
          if (paramClassroomId && accessibleClasses.some((c) => c.id === paramClassroomId)) {
            return paramClassroomId;
          }
          if (!prev || !accessibleClasses.some((c) => c.id === prev)) {
            return accessibleClasses[0].id;
          }
          return prev;
        });
      } else {
        setSelectedClassId("");
        setIsLoadingAttendance(false);
      }
    } catch (e) {
      console.error("Failed to load classrooms for attendance:", e);
      toast.error(t("attendance.fetchError", { defaultValue: "មិនអាចទាញយកទិន្នន័យថ្នាក់រៀនបានទេ" }));
    } finally {
      setIsLoadingClasses(false);
    }
  }, [isTeacher, user?.id, isAllBranches, currentBranchId, paramClassroomId, t]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const selectedClassroom = useMemo(() => {
    return classrooms.find((c) => c.id === selectedClassId) || null;
  }, [classrooms, selectedClassId]);

  const selectedPackage = useMemo(() => {
    if (!selectedClassroom) return null;
    return packages.find((p) => p.id === selectedClassroom.packageId) || null;
  }, [selectedClassroom, packages]);

  const selectedTeacher = useMemo(() => {
    if (!selectedClassroom) return null;
    return teachers.find((u) => u.id === selectedClassroom.assignedTeacherId) || null;
  }, [selectedClassroom, teachers]);

  // Active holiday on selected date
  const activeHoliday = useMemo(() => {
    return getHolidayForDate(date, activeHolidays);
  }, [date, activeHolidays]);

  // Validate schedule day
  const isValidScheduleDay = useMemo(() => {
    if (!selectedClassroom) return true;
    if (!selectedClassroom.scheduleDays || selectedClassroom.scheduleDays.length === 0) {
      return true;
    }
    const dayOfWeek = getDayOfWeekFromDateStr(date);
    return selectedClassroom.scheduleDays.includes(dayOfWeek);
  }, [selectedClassroom, date]);

  // Compute live attendance access state based on Cambodia time, schedule & active holidays
  const accessState: AttendanceAccessState = useMemo(() => {
    return getAttendanceAccessState(
      selectedClassroom,
      date,
      isTeacher ? "teacher" : "admin",
      activeHolidays
    );
  }, [selectedClassroom, date, isTeacher, currentTimeTick, activeHolidays]);

  // Determine if the form is in editable mode right now
  const isEditable = useMemo(() => {
    if (accessState === "holiday") return false;
    if (!isValidScheduleDay) return false;
    if (isTeacher && accessState !== "open") return false;
    if (hasExistingRecords && !isEditing) return false;
    return true;
  }, [accessState, isValidScheduleDay, isTeacher, hasExistingRecords, isEditing]);

  // Handler for class selection with immediate loading state
  const handleSelectClassId = (newClassId: string) => {
    if (newClassId !== selectedClassId) {
      setIsLoadingAttendance(true);
      setSelectedClassId(newClassId);
    }
  };

  // Handler for date selection with immediate loading state
  const handleSelectDate = (newDate: string) => {
    if (newDate !== date) {
      setIsLoadingAttendance(true);
      setDate(newDate);
    }
  };

  // Load eligible students & attendance records
  const loadClassAttendance = useCallback(async () => {
    if (!selectedClassId || !date) {
      setAttendanceItems([]);
      setSavedSnapshot([]);
      setHasExistingRecords(false);
      setHasUnsavedChanges(false);
      setIsEditing(false);
      setIsLoadingAttendance(false);
      return;
    }

    setIsLoadingAttendance(true);
    try {
      const [eligibleList, existingAttendance] = await Promise.all([
        attendanceService.getEligibleStudentsForAttendance(selectedClassId, date),
        attendanceService.getAttendanceByClassAndDate(selectedClassId, date),
      ]);

      const existingMap = new Map<string, Attendance>();
      existingAttendance.forEach((rec) => existingMap.set(rec.studentId, rec));

      const isExisting = existingAttendance.length > 0;
      setHasExistingRecords(isExisting);
      setIsEditing(!isExisting); // If not existing, start in entry mode; if existing, start in locked mode

      const items: StudentAttendanceItem[] = eligibleList.map(({ student, enrollment }) => {
        const saved = existingMap.get(student.id);
        if (saved) {
          return {
            student,
            enrollment,
            status: saved.status,
            remark: saved.remark || "",
          };
        } else {
          return {
            student,
            enrollment,
            status: "present" as AttendanceStatus,
            remark: "",
          };
        }
      });

      setAttendanceItems(items);
      setSavedSnapshot(items);
      setHasUnsavedChanges(!isExisting && items.length > 0);
    } catch (e) {
      console.error("Failed to load attendance for class:", e);
      toast.error(t("attendance.loadRecordsError", { defaultValue: "មិនអាចទាញយកទិន្នន័យវត្តមានបានទេ" }));
    } finally {
      setIsLoadingAttendance(false);
    }
  }, [selectedClassId, date, t]);

  useEffect(() => {
    loadClassAttendance();
  }, [loadClassAttendance]);

  // Status and remark changes
  const handleStatusChange = (studentId: string, newStatus: AttendanceStatus) => {
    if (!isEditable) return;
    setAttendanceItems((prev) =>
      prev.map((item) =>
        item.student.id === studentId ? { ...item, status: newStatus } : item
      )
    );
    setHasUnsavedChanges(true);
  };

  const handleRemarkChange = (studentId: string, newRemark: string) => {
    if (!isEditable) return;
    setAttendanceItems((prev) =>
      prev.map((item) =>
        item.student.id === studentId ? { ...item, remark: newRemark } : item
      )
    );
    setHasUnsavedChanges(true);
  };

  // Mark all students present
  const handleMarkAllPresent = () => {
    if (!isEditable || attendanceItems.length === 0) return;
    setAttendanceItems((prev) =>
      prev.map((item) => ({
        ...item,
        status: "present" as AttendanceStatus,
      }))
    );
    setHasUnsavedChanges(true);
    toast.info(t("attendance.allMarkedPresentInfo", { defaultValue: "បានកំណត់សិស្សទាំងអស់ជា វត្តមាន" }));
  };

  // Request to start editing
  const handleStartEditRequest = () => {
    if (accessState === "holiday") {
      toast.error(
        t("holidays.attendanceLocked", {
          defaultValue: "សាលាត្រូវបានបិទសម្រាប់ថ្ងៃនេះ (ថ្ងៃឈប់សម្រាក)។ មិនអាចកែប្រែវត្តមានបានទេ។",
        })
      );
      return;
    }
    if (isTeacher && accessState !== "open") {
      toast.error(t("attendance.classEndedHint", {
        endTime: selectedClassroom?.endTime || "",
        defaultValue: "ម៉ោងរៀនបានបញ្ចប់។ មិនអាចកែប្រែវត្តមានបានទៀតទេ។",
      }));
      return;
    }
    setIsConfirmEditOpen(true);
  };

  // Confirm Unlock Editing
  const handleConfirmEdit = () => {
    setIsConfirmEditOpen(false);
    setIsEditing(true);
    toast.success(t("attendance.editUnlocked", { defaultValue: "បានបើកសិទ្ធិកែប្រែវត្តមាន" }));
  };

  // Cancel Editing & revert
  const handleCancelEdit = () => {
    setIsEditing(false);
    setAttendanceItems(savedSnapshot);
    setHasUnsavedChanges(false);
    toast.info(t("attendance.editCancelled", { defaultValue: "បានបោះបង់ការកែប្រែ" }));
  };

  // Save / Update Attendance
  const handleSaveAttendance = async () => {
    if (!selectedClassroom) {
      toast.error(t("attendance.selectClass", { defaultValue: "សូមជ្រើសរើសថ្នាក់រៀន" }));
      return;
    }

    if (accessState === "holiday") {
      toast.error(
        t("holidays.attendanceLocked", {
          defaultValue: "សាលាត្រូវបានបិទសម្រាប់ថ្ងៃនេះ (ថ្ងៃឈប់សម្រាក)។ មិនអាចកត់ត្រាវត្តមានបានទេ។",
        })
      );
      return;
    }

    if (!isValidScheduleDay) {
      toast.error(t("attendance.noClassToday", { defaultValue: "ថ្នាក់នេះមិនមានកាលវិភាគរៀននៅថ្ងៃដែលបានជ្រើសរើសទេ" }));
      return;
    }

    if (isTeacher && accessState !== "open") {
      if (accessState === "upcoming") {
        toast.error(t("attendance.upcomingHint", {
          startTime: selectedClassroom.startTime,
          defaultValue: "មិនទាន់ដល់ម៉ោងរៀននៅឡើយទេ",
        }));
      } else {
        toast.error(t("attendance.classEndedHint", {
          endTime: selectedClassroom.endTime,
          defaultValue: "ម៉ោងរៀនបានបញ្ចប់។ ការកត់ត្រាវត្តមានត្រូវបានចាក់សោរ",
        }));
      }
      return;
    }

    if (attendanceItems.length === 0) {
      toast.error(t("attendance.noStudents", { defaultValue: "មិនមានសិស្សសកម្មក្នុងថ្នាក់នេះទេ" }));
      return;
    }

    setIsSaving(true);
    try {
      const recordsToSave = attendanceItems.map((item) => ({
        studentId: item.student.id,
        enrollmentId: item.enrollment.id,
        status: item.status,
        remark: item.remark,
      }));

      const result = await attendanceService.saveDailyAttendance({
        classroom: selectedClassroom,
        attendanceDate: date,
        records: recordsToSave,
        currentUserId: user?.id,
        currentUserRole: user?.role,
      });

      if (result.updatedCount > 0 && result.createdCount === 0) {
        toast.success(t("attendance.updated", { defaultValue: "កែប្រែវត្តមានបានជោគជ័យ" }));
      } else {
        toast.success(t("attendance.saved", { defaultValue: "កត់ត្រាវត្តមានបានជោគជ័យ" }));
      }

      setHasExistingRecords(true);
      setHasUnsavedChanges(false);
      setIsEditing(false); // Automatically lock form after save/update
      await loadClassAttendance();
    } catch (e: any) {
      console.error("Save attendance error:", e);
      if (e.message === "SCHOOL_CLOSED_HOLIDAY") {
        toast.error(
          t("holidays.attendanceLocked", {
            defaultValue: "សាលាត្រូវបានបិទសម្រាប់ថ្ងៃនេះ (ថ្ងៃឈប់សម្រាក)។ មិនអាចកត់ត្រាវត្តមានបានទេ។",
          })
        );
      } else if (e.message === "TEACHER_TIME_UPCOMING") {
        toast.error(t("attendance.upcomingHint", { startTime: selectedClassroom.startTime }));
      } else if (e.message === "TEACHER_TIME_FINISHED") {
        toast.error(t("attendance.classEndedHint", { endTime: selectedClassroom.endTime }));
      } else if (e.message === "TEACHER_NOT_TODAY") {
        toast.error(t("attendance.notTodayHint"));
      } else {
        toast.error(e.message || t("common.error", { defaultValue: "មានបញ្ហាក្នុងការរក្សាទុក" }));
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Summary counts
  const totalCount = attendanceItems.length;
  const presentCount = attendanceItems.filter((i) => i.status === "present").length;
  const absentCount = attendanceItems.filter((i) => i.status === "absent").length;
  const lateCount = attendanceItems.filter((i) => i.status === "late").length;
  const permissionCount = attendanceItems.filter((i) => i.status === "permission").length;

  return (
    <div className="max-w-full mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <AttendanceHeader
        onMarkAllPresent={handleMarkAllPresent}
        onSave={handleSaveAttendance}
        onStartEdit={handleStartEditRequest}
        onCancelEdit={handleCancelEdit}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        hasExistingRecords={hasExistingRecords}
        isEditing={isEditing}
        isValidScheduleDay={isValidScheduleDay}
        hasClassSelected={!!selectedClassroom}
        hasStudents={attendanceItems.length > 0}
        accessState={accessState}
        selectedClassroom={selectedClassroom}
        isTeacherRole={isTeacher}
        activeHoliday={activeHoliday}
      />

      {/* Class and Date Selector Bar & Info Card */}
      <ClassAttendanceSelector
        classrooms={classrooms}
        packages={packages}
        teachers={teachers}
        selectedClassId={selectedClassId}
        onSelectClassId={handleSelectClassId}
        selectedDate={date}
        onSelectDate={handleSelectDate}
        selectedClassroom={selectedClassroom}
        selectedPackage={selectedPackage}
        selectedTeacher={selectedTeacher}
        eligibleStudentCount={attendanceItems.length}
        isValidScheduleDay={isValidScheduleDay}
        isTeacherRole={isTeacher}
        accessState={accessState}
        hasExistingRecords={hasExistingRecords}
        isEditing={isEditing}
        activeHolidays={activeHolidays}
        activeHoliday={activeHoliday}
      />

      {/* Live Summary Statistics */}
      {selectedClassroom && (
        <AttendanceSummary
          totalCount={totalCount}
          presentCount={presentCount}
          absentCount={absentCount}
          lateCount={lateCount}
          permissionCount={permissionCount}
        />
      )}

      {/* Student Attendance List / Table */}
      {selectedClassroom && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-khmer text-foreground">
              {t("attendance.studentListTitle", { defaultValue: "បញ្ជីវត្តមានសិស្ស" })}
            </h2>
            <span className="text-xs text-muted-foreground font-khmer">
              {totalCount} {t("classes.studentsUnit")}
            </span>
          </div>

          {isLoadingClasses || isLoadingAttendance ? (
            <div className="space-y-3 py-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-card rounded-2xl border animate-pulse" />
              ))}
            </div>
          ) : (
            <AttendanceStudentTable
              items={attendanceItems}
              onStatusChange={handleStatusChange}
              onRemarkChange={handleRemarkChange}
              disabled={!isEditable || isSaving}
            />
          )}
        </div>
      )}

      {/* Confirm Unlock Edit Dialog */}
      <Dialog open={isConfirmEditOpen} onOpenChange={setIsConfirmEditOpen}>
        <DialogContent className="sm:max-w-md font-khmer p-5 sm:p-6 rounded-2xl">
          <DialogHeader className="gap-2">
            <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <LockOpen className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold">
                {t("attendance.confirmEditTitle", { defaultValue: "បញ្ជាក់ការកែប្រែវត្តមាន" })}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                {t("attendance.confirmEditDesc", {
                  endTime: selectedClassroom?.endTime || "",
                  defaultValue: `តើអ្នកពិតជាចង់ដោះសោរដើម្បីកែប្រែទិន្នន័យវត្តមានសម្រាប់ថ្នាក់នេះមែនទេ? ការកែប្រែអាចធ្វើបានត្រឹមមុនម៉ោង ${selectedClassroom?.endTime} ប៉ុណ្ណោះ។`,
                })}
              </DialogDescription>
            </div>
          </DialogHeader>

          <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmEditOpen(false)}
              className="text-xs font-khmer h-9"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleConfirmEdit}
              className="text-xs font-khmer h-9 bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shadow-sm"
            >
              <LockOpen className="h-4 w-4" />
              <span>{t("attendance.editAttendance", { defaultValue: "កែប្រែវត្តមាន" })}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
