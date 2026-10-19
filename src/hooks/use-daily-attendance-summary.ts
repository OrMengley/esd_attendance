import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getCambodiaToday } from "@/lib/attendance-time-lock";
import {
  dailyAttendanceSummaryService,
  DailyAttendanceSummaryData,
} from "@/services/daily-attendance-summary.service";
import { userService } from "@/services/user.service";
import { studyPackageService } from "@/services/study-package.service";
import { User } from "@/models/user.model";
import { StudyPackage } from "@/models/study-package.model";
import {
  ClassDailyAttendanceSummary,
  DailyClassAttendanceStatus,
} from "@/lib/daily-attendance-summary";
import { useBranch } from "@/contexts/branch-context";
import { toast } from "sonner";

export function useDailyAttendanceSummary(initialDate?: string) {
  const { t } = useTranslation();
  const { currentBranchId, isAllBranches } = useBranch();
  const branchId = isAllBranches ? null : currentBranchId;

  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || getCambodiaToday()
  );

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [summaryData, setSummaryData] = useState<DailyAttendanceSummaryData>({
    selectedDate: selectedDate,
    classesSummary: [],
    overallSummary: {
      selectedDate: selectedDate,
      isHoliday: false,
      scheduledClassesCount: 0,
      completedClassesCount: 0,
      pendingClassesCount: 0,
      missingClassesCount: 0,
      upcomingClassesCount: 0,
      totalEligibleStudents: 0,
      totalRecordedStudents: 0,
      totalPresent: 0,
      totalAbsent: 0,
      totalLate: 0,
      totalPermission: 0,
      overallAttendanceRate: null,
    },
  });

  const [teachers, setTeachers] = useState<User[]>([]);
  const [packages, setPackages] = useState<StudyPackage[]>([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("all");
  const [selectedPackageId, setSelectedPackageId] = useState<string>("all");
  const [selectedScheduleType, setSelectedScheduleType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Load teachers and study packages
  useEffect(() => {
    let isMounted = true;
    async function loadMeta() {
      try {
        const [usersList, packagesList] = await Promise.all([
          userService.getUsers(),
          studyPackageService.getStudyPackages(),
        ]);
        if (isMounted) {
          const teacherUsers = usersList.filter(
            (u) =>
              u.role === "teacher" &&
              u.status === "active" &&
              (!branchId || u.branchId === branchId)
          );
          setTeachers(teacherUsers);
          setPackages(packagesList);
        }
      } catch (e) {
        console.error("Failed to load metadata for summary:", e);
      }
    }
    loadMeta();
    return () => {
      isMounted = false;
    };
  }, [branchId]);

  // Reset selectedTeacherId if outside current branch teachers
  useEffect(() => {
    if (selectedTeacherId !== "all" && !teachers.some((t) => t.id === selectedTeacherId)) {
      setSelectedTeacherId("all");
    }
  }, [teachers, selectedTeacherId]);

  // Fetch summary for selected date and branch
  const fetchSummary = useCallback(async (date: string, bId?: string | null) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dailyAttendanceSummaryService.getDailySummary(date, bId);
      setSummaryData(data);
    } catch (e: any) {
      console.error("Failed to load daily attendance summary:", e);
      const msg =
        e.message || t("dailySummary.fetchError", { defaultValue: "Failed to load summary" });
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSummary(selectedDate, branchId);
  }, [selectedDate, branchId, fetchSummary]);

  const refresh = useCallback(() => {
    fetchSummary(selectedDate, branchId);
  }, [selectedDate, branchId, fetchSummary]);

  // Compute filtered classes
  const filteredClasses = useMemo(() => {
    if (summaryData.overallSummary.isHoliday) return [];

    return summaryData.classesSummary.filter((item: ClassDailyAttendanceSummary) => {
      // 1. Search Query (class name, code)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.classroom.name.toLowerCase().includes(q);
        const matchesCode = item.classroom.code.toLowerCase().includes(q);
        const matchesTeacher = item.teacher?.name.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesTeacher) {
          return false;
        }
      }

      // 2. Teacher Filter
      if (selectedTeacherId !== "all") {
        if (item.classroom.assignedTeacherId !== selectedTeacherId) {
          return false;
        }
      }

      // 3. Study Package Filter
      if (selectedPackageId !== "all") {
        if (item.classroom.packageId !== selectedPackageId) {
          return false;
        }
      }

      // 4. Schedule Type Filter
      if (selectedScheduleType !== "all") {
        if (item.scheduleTypeText !== selectedScheduleType) {
          return false;
        }
      }

      // 5. Status Filter
      if (selectedStatus !== "all") {
        if (item.status !== selectedStatus) {
          return false;
        }
      }

      return true;
    });
  }, [
    summaryData,
    searchQuery,
    selectedTeacherId,
    selectedPackageId,
    selectedScheduleType,
    selectedStatus,
  ]);

  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery.trim() !== "" ||
      selectedTeacherId !== "all" ||
      selectedPackageId !== "all" ||
      selectedScheduleType !== "all" ||
      selectedStatus !== "all"
    );
  }, [
    searchQuery,
    selectedTeacherId,
    selectedPackageId,
    selectedScheduleType,
    selectedStatus,
  ]);

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedTeacherId("all");
    setSelectedPackageId("all");
    setSelectedScheduleType("all");
    setSelectedStatus("all");
  }, []);

  return {
    selectedDate,
    setSelectedDate,
    isLoading,
    error,
    summaryData,
    overallSummary: summaryData.overallSummary,
    classesSummary: summaryData.classesSummary,
    filteredClasses,
    teachers,
    packages,
    // Filter controls
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
  };
}
