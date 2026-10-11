import { Classroom } from "@/models/classroom.model";
import { StudyPackage } from "@/models/study-package.model";
import { User } from "@/models/user.model";
import { Enrollment } from "@/models/enrollment.model";
import { Student } from "@/models/student.model";
import { Attendance } from "@/models/attendance.model";
import { SchoolHoliday } from "@/models/school-holiday.model";
import { isHoliday, getHolidayForDate } from "@/lib/holiday-calendar";
import {
  DashboardData,
  AdminDashboardMetrics,
  AdminAttendanceOverview,
  AdminClassAttendanceItem,
  AttentionItem,
  TeacherDashboardMetrics,
  TeacherScheduleItem,
  DashboardClassAttendanceStatus,
  TeacherSessionState,
  TeacherActionType,
} from "@/models/dashboard.model";

export interface CalculateDashboardParams {
  user: User;
  classrooms: Classroom[];
  packages: StudyPackage[];
  users: User[];
  enrollments: Enrollment[];
  students: Student[];
  attendance: Attendance[];
  holidays: SchoolHoliday[];
  currentDateTime: {
    dateStr: string;
    timeStr: string;
    dayOfWeek: number;
    hours: number;
    minutes: number;
  };
}

export function calculateDashboardData(params: CalculateDashboardParams): DashboardData {
  const {
    user,
    classrooms,
    packages,
    users,
    enrollments,
    students,
    attendance,
    holidays,
    currentDateTime,
  } = params;

  const cambodiaToday = currentDateTime.dateStr;
  const cambodiaNow = currentDateTime.timeStr;
  const dayOfWeek = currentDateTime.dayOfWeek;

  // 1. Holiday Check
  const holiday = getHolidayForDate(cambodiaToday, holidays);
  const isSchoolHoliday = !!holiday;

  // Lookup maps for fast joining
  const packageMap = new Map<string, StudyPackage>();
  packages.forEach((p) => packageMap.set(p.id, p));

  const userMap = new Map<string, User>();
  users.forEach((u) => userMap.set(u.id, u));

  const studentMap = new Map<string, Student>();
  students.forEach((s) => studentMap.set(s.id, s));

  // Active enrollments per classroom for cambodiaToday
  // An enrollment is eligible if:
  // - matches classroomId
  // - status === "active" OR transferred/completed with valid date range
  // - startDate <= cambodiaToday
  // - if transferred, cambodiaToday < actualEndDate
  // - if completed, cambodiaToday <= actualEndDate
  const getEligibleEnrollmentsForClass = (classroomId: string): Enrollment[] => {
    return enrollments.filter((enr) => {
      if (enr.classroomId !== classroomId) return false;
      if (!enr.startDate || enr.startDate > cambodiaToday) return false;

      if (enr.status === "active") return true;
      if (enr.status === "transferred" && enr.actualEndDate && cambodiaToday < enr.actualEndDate) {
        return true;
      }
      if (enr.status === "completed" && (!enr.actualEndDate || cambodiaToday <= enr.actualEndDate)) {
        return true;
      }
      return false;
    });
  };

  // Pre-filter attendance records for today
  const todayAttendance = attendance.filter(
    (a) => (a.attendanceDate || a.date) === cambodiaToday
  );
  const attendanceByClassAndStudent = new Map<string, Attendance>();
  todayAttendance.forEach((a) => {
    attendanceByClassAndStudent.set(`${a.classroomId}_${a.studentId}`, a);
  });

  const isAdmin = user.role === "super_admin" || user.role === "admin";
  const isTeacher = user.role === "teacher";

  // Result object
  const result: DashboardData = {
    selectedDate: cambodiaToday,
    currentTimeStr: cambodiaNow,
    isHoliday: isSchoolHoliday,
    holidayNameKm: holiday?.nameKm,
    holidayNameEn: holiday?.nameEn,
  };

  // ==========================================
  // ADMIN DASHBOARD CALCULATION
  // ==========================================
  if (isAdmin) {
    // 1. Active Students: Unique student IDs with at least one active enrollment
    const activeStudentIds = new Set(
      enrollments
        .filter((e) => e.status === "active")
        .map((e) => e.studentId)
    );
    const activeStudentsCount = activeStudentIds.size;

    // 2. Active Classes
    const activeClasses = classrooms.filter((c) => c.status === "active");
    const activeClassesCount = activeClasses.length;

    // 3. Active Teachers
    const activeTeachersCount = users.filter(
      (u) => u.role === "teacher" && u.status === "active"
    ).length;

    // 4. Today's Scheduled Classes (Active, learning day matches today, inside study period, not holiday)
    const scheduledClassroomsToday = isSchoolHoliday
      ? []
      : activeClasses.filter((c) => {
          if (!c.scheduleDays?.includes(dayOfWeek)) return false;
          if (c.startDate && c.startDate > cambodiaToday) return false;
          const maxEndDate = c.actualEndDate || c.expectedEndDate;
          if (maxEndDate && cambodiaToday > maxEndDate) return false;
          return true;
        });

    const todayScheduledClassesCount = scheduledClassroomsToday.length;

    // Sort scheduled classes by start time
    scheduledClassroomsToday.sort((a, b) => (a.startTime || "00:00").localeCompare(b.startTime || "00:00"));

    let completedClassesCount = 0;
    let attentionClassesCount = 0;

    let overallPresent = 0;
    let overallAbsent = 0;
    let overallLate = 0;
    let overallPermission = 0;
    let overallRecorded = 0;
    let overallEligible = 0;

    const classItems: AdminClassAttendanceItem[] = [];

    scheduledClassroomsToday.forEach((cls) => {
      const eligibleEnrs = getEligibleEnrollmentsForClass(cls.id);
      const enrolledCount = eligibleEnrs.length;
      overallEligible += enrolledCount;

      let presentCount = 0;
      let absentCount = 0;
      let lateCount = 0;
      let permissionCount = 0;
      let recordedCount = 0;

      eligibleEnrs.forEach((enr) => {
        const att = attendanceByClassAndStudent.get(`${cls.id}_${enr.studentId}`);
        if (att) {
          recordedCount++;
          if (att.status === "present") presentCount++;
          else if (att.status === "absent") absentCount++;
          else if (att.status === "late") lateCount++;
          else if (att.status === "permission") permissionCount++;
        }
      });

      overallPresent += presentCount;
      overallAbsent += absentCount;
      overallLate += lateCount;
      overallPermission += permissionCount;
      overallRecorded += recordedCount;

      // Status rule
      const startTime = cls.startTime || "00:00";
      const endTime = cls.endTime || "23:59";
      let status: DashboardClassAttendanceStatus;

      if (isSchoolHoliday) {
        status = "holiday";
      } else if (cambodiaNow < startTime) {
        status = "upcoming";
      } else if (cambodiaNow >= startTime && cambodiaNow <= endTime) {
        // Between start and end time -> In Progress (unless all already recorded)
        if (enrolledCount > 0 && recordedCount >= enrolledCount) {
          status = "completed";
          completedClassesCount++;
        } else {
          status = "in_progress";
        }
      } else {
        // Session has ended (cambodiaNow > endTime)
        if (enrolledCount > 0 && recordedCount >= enrolledCount) {
          status = "completed";
          completedClassesCount++;
        } else if (recordedCount > 0) {
          status = "partial";
          attentionClassesCount++;
        } else {
          status = "missing";
          attentionClassesCount++;
        }
      }

      classItems.push({
        classroom: cls,
        studyPackage: packageMap.get(cls.packageId) || null,
        teacher: cls.assignedTeacherId ? userMap.get(cls.assignedTeacherId) || null : null,
        scheduleTime: `${startTime} - ${endTime}`,
        enrolledCount,
        recordedCount,
        presentCount,
        absentCount,
        lateCount,
        permissionCount,
        status,
      });
    });

    const attendanceRate =
      overallRecorded > 0
        ? Math.round(
            ((overallPresent + overallLate + overallPermission) / overallRecorded) * 1000
          ) / 10
        : null;

    const metrics: AdminDashboardMetrics = {
      activeStudentsCount,
      activeClassesCount,
      activeTeachersCount,
      todayScheduledClassesCount,
      attendanceRecordedCount: completedClassesCount,
      requiresAttentionCount: attentionClassesCount,
    };

    const attendanceOverview: AdminAttendanceOverview = {
      presentCount: overallPresent,
      absentCount: overallAbsent,
      lateCount: overallLate,
      permissionCount: overallPermission,
      totalRecorded: overallRecorded,
      totalEligible: overallEligible,
      attendanceRate,
    };

    // Attention Required Panel items (max 5 items)
    const attentionItems: AttentionItem[] = [];

    // 1. Missing attendance classes after session end
    classItems
      .filter((c) => c.status === "missing")
      .forEach((c) => {
        attentionItems.push({
          id: `missing_${c.classroom.id}`,
          type: "missing_attendance",
          title: `${c.classroom.name} (${c.classroom.code})`,
          description: `Session ended at ${c.classroom.endTime} with 0/${c.enrolledCount} attendance recorded.`,
          severity: "danger",
          link: `/attendance?classroomId=${c.classroom.id}&date=${cambodiaToday}`,
          linkText: "Record Attendance",
        });
      });

    // 2. Partial attendance classes after session end
    classItems
      .filter((c) => c.status === "partial")
      .forEach((c) => {
        attentionItems.push({
          id: `partial_${c.classroom.id}`,
          type: "partial_attendance",
          title: `${c.classroom.name} (${c.classroom.code})`,
          description: `Incomplete attendance: only ${c.recordedCount}/${c.enrolledCount} students marked.`,
          severity: "warning",
          link: `/attendance?classroomId=${c.classroom.id}&date=${cambodiaToday}`,
          linkText: "Complete Attendance",
        });
      });

    // 3. Overdue classes (active classes past expected end date)
    activeClasses.forEach((cls) => {
      const maxEndDate = cls.actualEndDate || cls.expectedEndDate;
      if (maxEndDate && cambodiaToday > maxEndDate) {
        attentionItems.push({
          id: `overdue_${cls.id}`,
          type: "overdue_class",
          title: `${cls.name} (${cls.code})`,
          description: `Class expected completion date (${maxEndDate}) has passed.`,
          severity: "warning",
          link: `/reports/class-progress`,
          linkText: "Class Progress",
        });
      }
    });

    // 4. Repeated absences in the current month (>= 3 absences or lates)
    const currentYearMonth = cambodiaToday.substring(0, 7);
    const monthIncidents = new Map<string, { absent: number; late: number }>();
    attendance.forEach((a) => {
      const d = a.attendanceDate || a.date || "";
      if (d.startsWith(currentYearMonth)) {
        const cur = monthIncidents.get(a.studentId) || { absent: 0, late: 0 };
        if (a.status === "absent") cur.absent++;
        else if (a.status === "late") cur.late++;
        monthIncidents.set(a.studentId, cur);
      }
    });

    monthIncidents.forEach((counts, studentId) => {
      if (counts.absent >= 3 || (counts.absent + counts.late >= 4)) {
        const student = studentMap.get(studentId);
        if (student) {
          const studentName = student.nameKh || student.nameEn || student.studentCode;
          attentionItems.push({
            id: `repeated_${studentId}`,
            type: "repeated_absence_late",
            title: `${studentName} (#${student.studentCode})`,
            description: `${counts.absent} absences and ${counts.late} late arrivals recorded this month.`,
            severity: "danger",
            link: `/reports/absence-late`,
            linkText: "Absence Report",
          });
        }
      }
    });

    result.admin = {
      metrics,
      attendanceOverview,
      classes: classItems,
      attentionItems: attentionItems.slice(0, 5),
    };
  }

  // ==========================================
  // TEACHER DASHBOARD CALCULATION
  // ==========================================
  if (isTeacher) {
    // 1. My Active Classes (Assigned to this teacher and status === active)
    const myActiveClasses = classrooms.filter(
      (c) => c.assignedTeacherId === user.id && c.status === "active"
    );
    const myActiveClassesCount = myActiveClasses.length;

    // 2. Today's Classes
    const myTodayClasses = isSchoolHoliday
      ? []
      : myActiveClasses.filter((c) => {
          if (!c.scheduleDays?.includes(dayOfWeek)) return false;
          if (c.startDate && c.startDate > cambodiaToday) return false;
          const maxEndDate = c.actualEndDate || c.expectedEndDate;
          if (maxEndDate && cambodiaToday > maxEndDate) return false;
          return true;
        });

    // Sort by start time
    myTodayClasses.sort((a, b) => (a.startTime || "00:00").localeCompare(b.startTime || "00:00"));

    let completedTodayCount = 0;
    let requiresAttendanceCount = 0;
    let nextClass: Classroom | null = null;
    let nextClassText = "No more classes today";

    const scheduleItems: TeacherScheduleItem[] = [];

    myTodayClasses.forEach((cls) => {
      const eligibleEnrs = getEligibleEnrollmentsForClass(cls.id);
      const enrolledCount = eligibleEnrs.length;

      let recordedCount = 0;
      eligibleEnrs.forEach((enr) => {
        if (attendanceByClassAndStudent.has(`${cls.id}_${enr.studentId}`)) {
          recordedCount++;
        }
      });

      const startTime = cls.startTime || "00:00";
      const endTime = cls.endTime || "23:59";

      let sessionState: TeacherSessionState;
      let actionType: TeacherActionType;
      let actionText: string;

      if (cambodiaNow < startTime) {
        sessionState = "upcoming";
        actionType = "disabled_upcoming";
        actionText = `Available at ${startTime}`;

        // Find nearest future class
        if (!nextClass) {
          nextClass = cls;
          nextClassText = `${cls.code} (${startTime})`;
        }
      } else if (cambodiaNow >= startTime && cambodiaNow <= endTime) {
        sessionState = "in_progress";
        if (enrolledCount > 0 && recordedCount >= enrolledCount) {
          sessionState = "completed";
          completedTodayCount++;
          actionType = "view";
          actionText = "View Attendance";
        } else {
          actionType = recordedCount > 0 ? "continue" : "mark";
          actionText = recordedCount > 0 ? "Continue Attendance" : "Mark Attendance";
        }
      } else {
        // Session ended
        if (enrolledCount > 0 && recordedCount >= enrolledCount) {
          sessionState = "completed";
          completedTodayCount++;
          actionType = "view";
          actionText = "View Attendance";
        } else {
          sessionState = "requires_attendance";
          requiresAttendanceCount++;
          actionType = "required";
          actionText = "Attendance Required";
        }
      }

      scheduleItems.push({
        classroom: cls,
        studyPackage: packageMap.get(cls.packageId) || null,
        scheduleTime: `${startTime} - ${endTime}`,
        enrolledCount,
        recordedCount,
        sessionState,
        actionType,
        actionText,
        actionLink: `/attendance?classroomId=${cls.id}&date=${cambodiaToday}`,
      });
    });

    const metrics: TeacherDashboardMetrics = {
      myActiveClassesCount,
      todayClassesCount: myTodayClasses.length,
      attendanceCompletedCount: completedTodayCount,
      requiresAttendanceCount,
      nextClassText,
      nextClass,
    };

    result.teacher = {
      metrics,
      schedule: scheduleItems,
      hasNoClassesScheduled: myTodayClasses.length === 0,
      hasNoAssignedClassrooms: myActiveClassesCount === 0,
    };
  }

  return result;
}
