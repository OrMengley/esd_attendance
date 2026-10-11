import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { classroomService } from "./classroom.service";
import { studyPackageService } from "./study-package.service";
import { userService } from "./user.service";
import { enrollmentService } from "./enrollment.service";
import { studentService } from "./student.service";
import { schoolHolidayService } from "./school-holiday.service";
import { attendanceService } from "./attendance.service";
import { Classroom } from "@/models/classroom.model";
import { StudyPackage } from "@/models/study-package.model";
import { User } from "@/models/user.model";
import { Student } from "@/models/student.model";
import { Enrollment } from "@/models/enrollment.model";
import { Attendance } from "@/models/attendance.model";
import { SchoolHoliday } from "@/models/school-holiday.model";
import { getHolidayForDate } from "@/lib/holiday-calendar";
import {
  getDayOfWeekFromDateStr,
  getCambodiaToday,
} from "@/lib/attendance-time-lock";
import {
  ClassDailyAttendanceSummary,
  DailyAttendanceOverallSummary,
  determineClassDailyAttendanceStatus,
} from "@/lib/daily-attendance-summary";

export interface DailyAttendanceSummaryData {
  selectedDate: string;
  overallSummary: DailyAttendanceOverallSummary;
  classesSummary: ClassDailyAttendanceSummary[];
}

export const dailyAttendanceSummaryService = {
  /**
   * Fetch and calculate complete daily attendance summary for a selected date
   */
  async getDailySummary(selectedDate: string): Promise<DailyAttendanceSummaryData> {
    const targetDate = selectedDate || getCambodiaToday();

    // 1. Fetch all core data in parallel
    const [
      allClassrooms,
      allPackages,
      allUsers,
      allEnrollments,
      allStudents,
      activeHolidays,
    ] = await Promise.all([
      classroomService.getClassrooms(),
      studyPackageService.getStudyPackages(),
      userService.getUsers(),
      enrollmentService.getEnrollments(),
      studentService.getStudents(),
      schoolHolidayService.getActiveSchoolHolidays(),
    ]);

    // 2. Check if selected date is an active school holiday
    const holiday = getHolidayForDate(targetDate, activeHolidays);
    const isHoliday = !!holiday;

    if (isHoliday) {
      const overallSummary: DailyAttendanceOverallSummary = {
        selectedDate: targetDate,
        isHoliday: true,
        holidayNameKm: holiday?.nameKm,
        holidayNameEn: holiday?.nameEn,
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
      };

      return {
        selectedDate: targetDate,
        overallSummary,
        classesSummary: [],
      };
    }

    // 3. Filter scheduled active classrooms for this date
    const dayOfWeek = getDayOfWeekFromDateStr(targetDate);

    const scheduledClassrooms = allClassrooms.filter((c) => {
      // Must be active
      if (c.status !== "active") return false;

      // Must be between start date and end date
      if (c.startDate && c.startDate > targetDate) return false;
      const effectiveEndDate = c.actualEndDate || c.expectedEndDate;
      if (effectiveEndDate && targetDate > effectiveEndDate) return false;

      // Must be a scheduled learning day
      if (!c.scheduleDays || !c.scheduleDays.includes(dayOfWeek)) return false;

      return true;
    });

    // 4. Fetch attendance records for target date
    let attendanceRecordsForDate: Attendance[] = [];
    try {
      // Direct date query
      const q = query(
        collection(db, "attendance"),
        where("attendanceDate", "==", targetDate)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        attendanceRecordsForDate = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Attendance)
        );
      } else {
        // Fallback for date field
        const qAlt = query(
          collection(db, "attendance"),
          where("date", "==", targetDate)
        );
        const snapAlt = await getDocs(qAlt);
        if (!snapAlt.empty) {
          attendanceRecordsForDate = snapAlt.docs.map(
            (d) => ({ id: d.id, ...d.data() } as Attendance)
          );
        } else {
          // Fallback to local attendance cache
          const local = await attendanceService.getAttendance();
          attendanceRecordsForDate = local.filter(
            (a) => (a.attendanceDate || a.date) === targetDate
          );
        }
      }
    } catch (e) {
      console.warn("Firestore query fallback to local attendance for summary:", e);
      const local = await attendanceService.getAttendance();
      attendanceRecordsForDate = local.filter(
        (a) => (a.attendanceDate || a.date) === targetDate
      );
    }

    // Map lookup caches
    const packageMap = new Map<string, StudyPackage>();
    allPackages.forEach((p) => packageMap.set(p.id, p));

    const userMap = new Map<string, User>();
    allUsers.forEach((u) => userMap.set(u.id, u));

    const activeStudentsMap = new Map<string, Student>();
    allStudents.forEach((s) => {
      if (s.status === "active") {
        activeStudentsMap.set(s.id, s);
      }
    });

    // Group attendance by classroom ID and student ID
    const attendanceByClass = new Map<string, Map<string, Attendance>>();
    attendanceRecordsForDate.forEach((att) => {
      if (!attendanceByClass.has(att.classroomId)) {
        attendanceByClass.set(att.classroomId, new Map());
      }
      attendanceByClass.get(att.classroomId)!.set(att.studentId, att);
    });

    // 5. Evaluate each classroom's eligible students and attendance completion
    const classesSummary: ClassDailyAttendanceSummary[] = [];

    for (const classroom of scheduledClassrooms) {
      // Find eligible enrollments for this classroom on targetDate
      const classroomEnrollments = allEnrollments.filter((enr) => {
        if (enr.classroomId !== classroom.id) return false;
        if (!enr.startDate || enr.startDate > targetDate) return false;

        if (enr.status === "active") {
          return true;
        }
        if (enr.status === "transferred") {
          // Eligible BEFORE transfer effective date
          return !!enr.actualEndDate && targetDate < enr.actualEndDate;
        }
        if (enr.status === "completed") {
          // Eligible ON or BEFORE completion date
          return !enr.actualEndDate || targetDate <= enr.actualEndDate;
        }
        return false;
      });

      // Filter active student profiles
      const eligibleStudentIds = classroomEnrollments
        .filter((enr) => activeStudentsMap.has(enr.studentId))
        .map((enr) => enr.studentId);

      const eligibleStudentCount = eligibleStudentIds.length;

      // Classrooms with 0 eligible students on this date are excluded from operational summary
      if (eligibleStudentCount === 0) {
        continue;
      }

      // Count attendance stats
      const classAttMap = attendanceByClass.get(classroom.id) || new Map();

      let presentCount = 0;
      let absentCount = 0;
      let lateCount = 0;
      let permissionCount = 0;
      let recordedStudentCount = 0;

      eligibleStudentIds.forEach((studentId) => {
        const att = classAttMap.get(studentId);
        if (att) {
          recordedStudentCount++;
          if (att.status === "present") presentCount++;
          else if (att.status === "absent") absentCount++;
          else if (att.status === "late") lateCount++;
          else if (att.status === "permission") permissionCount++;
        }
      });

      const attendanceRate =
        recordedStudentCount > 0
          ? Math.round(
              ((presentCount + lateCount + permissionCount) / recordedStudentCount) * 1000
            ) / 10
          : null;

      const status = determineClassDailyAttendanceStatus({
        selectedDate: targetDate,
        classroom,
        eligibleStudentCount,
        recordedStudentCount,
        isHoliday: false,
      });

      const isWeekday = classroom.scheduleDays?.length === 5;

      classesSummary.push({
        classroom,
        studyPackage: packageMap.get(classroom.packageId) || null,
        teacher: userMap.get(classroom.assignedTeacherId) || null,
        eligibleStudentCount,
        recordedStudentCount,
        presentCount,
        absentCount,
        lateCount,
        permissionCount,
        attendanceRate,
        status,
        isHoliday: false,
        scheduleTypeText: isWeekday ? "weekday" : "weekend",
      });
    }

    // Sort classes summary: Missing & Not Recorded first, then Partial, Upcoming, Completed
    const statusPriority: Record<string, number> = {
      missing: 1,
      not_recorded: 2,
      partial: 3,
      upcoming: 4,
      completed: 5,
      school_closed: 6,
    };

    classesSummary.sort((a, b) => {
      const priorityDiff = (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
      if (priorityDiff !== 0) return priorityDiff;
      return (a.classroom.startTime || "").localeCompare(b.classroom.startTime || "");
    });

    // 6. Calculate overall aggregate summary
    let completedClassesCount = 0;
    let pendingClassesCount = 0;
    let missingClassesCount = 0;
    let upcomingClassesCount = 0;
    let totalEligibleStudents = 0;
    let totalRecordedStudents = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalPermission = 0;

    classesSummary.forEach((c) => {
      if (c.status === "completed") completedClassesCount++;
      else if (c.status === "missing") missingClassesCount++;
      else if (c.status === "upcoming") upcomingClassesCount++;
      else if (c.status === "partial" || c.status === "not_recorded") pendingClassesCount++;

      totalEligibleStudents += c.eligibleStudentCount;
      totalRecordedStudents += c.recordedStudentCount;
      totalPresent += c.presentCount;
      totalAbsent += c.absentCount;
      totalLate += c.lateCount;
      totalPermission += c.permissionCount;
    });

    const overallAttendanceRate =
      totalRecordedStudents > 0
        ? Math.round(
            ((totalPresent + totalLate + totalPermission) / totalRecordedStudents) * 1000
          ) / 10
        : null;

    const overallSummary: DailyAttendanceOverallSummary = {
      selectedDate: targetDate,
      isHoliday: false,
      scheduledClassesCount: classesSummary.length,
      completedClassesCount,
      pendingClassesCount,
      missingClassesCount,
      upcomingClassesCount,
      totalEligibleStudents,
      totalRecordedStudents,
      totalPresent,
      totalAbsent,
      totalLate,
      totalPermission,
      overallAttendanceRate,
    };

    return {
      selectedDate: targetDate,
      overallSummary,
      classesSummary,
    };
  },
};
