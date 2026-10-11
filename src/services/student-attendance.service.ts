import { studentService } from "./student.service";
import { enrollmentService } from "./enrollment.service";
import { classroomService } from "./classroom.service";
import { attendanceService } from "./attendance.service";
import { schoolHolidayService } from "./school-holiday.service";
import { studyPackageService } from "./study-package.service";
import { userService } from "./user.service";
import { Student } from "@/models/student.model";
import { Enrollment } from "@/models/enrollment.model";
import { Classroom } from "@/models/classroom.model";
import { Attendance, AttendanceStatus } from "@/models/attendance.model";
import { StudyPackage } from "@/models/study-package.model";
import { User } from "@/models/user.model";
import { SchoolHoliday } from "@/models/school-holiday.model";
import { getHolidayForDate } from "@/lib/holiday-calendar";

export interface StudentListItemWithMeta {
  student: Student;
  latestEnrollment: Enrollment | null;
  latestClassroom: Classroom | null;
  latestTeacher: User | null;
  attendanceRate: number;
  totalRecordedSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  permissionCount: number;
}

export interface StudentAttendanceSummary {
  presentCount: number;
  absentCount: number;
  lateCount: number;
  permissionCount: number;
  recordedSessions: number;
  attendanceRate: number;
}

export interface SingleStudentMonthlySessionItem {
  dateStr: string; // YYYY-MM-DD
  dayNumber: string;
  dayOfWeek: number;
  dayNameKm: string;
  dayNameEn: string;
  status: AttendanceStatus | "holiday" | "not_expected" | "pending";
  code: "P" | "A" | "L" | "E" | "H" | "—" | "•";
  remark?: string;
  recordedBy?: string;
  recordedByName?: string;
  updatedBy?: string;
  isHoliday: boolean;
  holidayNameKm?: string;
  holidayNameEn?: string;
  isExpectedSession: boolean;
}

export interface StudentMonthlyReportData {
  student: Student;
  enrollment: Enrollment;
  classroom: Classroom;
  studyPackage: StudyPackage | null;
  teacher: User | null;
  selectedMonth: string; // YYYY-MM
  monthNameKm: string;
  monthNameEn: string;
  sessions: SingleStudentMonthlySessionItem[];
  summary: {
    scheduledSessions: number;
    recordedSessions: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    permissionCount: number;
    attendanceRate: number;
  };
  generatedAt: string;
  generatedBy?: string;
}

const KHMER_MONTH_NAMES = [
  "មករា",
  "កុម្ភៈ",
  "មីនា",
  "មេសា",
  "ឧសភា",
  "មិថុនា",
  "កក្កដា",
  "សីហា",
  "កញ្ញា",
  "តុលា",
  "វិច្ឆិកា",
  "ធ្នូ",
];

const EN_MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const KHMER_DAY_NAMES = ["", "ចន្ទ", "អង្គារ", "ពុធ", "ព្រហ", "សុក្រ", "សៅរ៍", "អាទិត្យ"];
const EN_DAY_NAMES = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const KHMER_NUMERALS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];

export function toKhmerNum(num: number | string): string {
  return String(num)
    .split("")
    .map((char) => (/[0-9]/.test(char) ? KHMER_NUMERALS[parseInt(char, 10)] : char))
    .join("");
}

export const studentAttendanceService = {
  /**
   * Get all students accessible to current user with their latest class and attendance rate.
   * Teachers only get students who are or were enrolled in their assigned classrooms.
   */
  async getPermittedStudentsList(user: User | null): Promise<StudentListItemWithMeta[]> {
    const [allStudents, allEnrollments, allClasses, allUsers, allAttendance] = await Promise.all([
      studentService.getStudents(),
      enrollmentService.getEnrollments(),
      classroomService.getClassrooms(),
      userService.getUsers(),
      attendanceService.getAttendance(),
    ]);

    const isTeacher = user?.role === "teacher";
    const teacherClassIds = isTeacher
      ? allClasses
          .filter(
            (c) =>
              c.assignedTeacherId === user?.id ||
              user?.assignedClassroomIds?.includes(c.id)
          )
          .map((c) => c.id)
      : [];

    const classMap = new Map<string, Classroom>();
    allClasses.forEach((c) => classMap.set(c.id, c));

    const userMap = new Map<string, User>();
    allUsers.forEach((u) => userMap.set(u.id, u));

    // Group enrollments by studentId (sorted latest first)
    const studentEnrollmentsMap = new Map<string, Enrollment[]>();
    allEnrollments.forEach((e) => {
      if (e.status === "cancelled") return;
      const list = studentEnrollmentsMap.get(e.studentId) || [];
      list.push(e);
      studentEnrollmentsMap.set(e.studentId, list);
    });

    // Group attendance by studentId
    const studentAttendanceMap = new Map<string, Attendance[]>();
    allAttendance.forEach((a) => {
      // If teacher, only count attendance for teacher's classrooms
      if (isTeacher && !teacherClassIds.includes(a.classroomId)) return;
      const list = studentAttendanceMap.get(a.studentId) || [];
      list.push(a);
      studentAttendanceMap.set(a.studentId, list);
    });

    const result: StudentListItemWithMeta[] = [];

    for (const student of allStudents) {
      const enrollments = studentEnrollmentsMap.get(student.id) || [];

      // If teacher, check if student has any enrollment in teacher's classes
      if (isTeacher) {
        const hasTeacherEnrollment = enrollments.some((e) =>
          teacherClassIds.includes(e.classroomId)
        );
        if (!hasTeacherEnrollment) {
          continue; // Teacher cannot see this student
        }
      }

      // Sort enrollments: active first, then by startDate desc
      const sortedEnrollments = [...enrollments].sort((a, b) => {
        if (a.status === "active" && b.status !== "active") return -1;
        if (b.status === "active" && a.status !== "active") return 1;
        return (b.startDate || "").localeCompare(a.startDate || "");
      });

      const latestEnrollment = isTeacher
        ? sortedEnrollments.find((e) => teacherClassIds.includes(e.classroomId)) || sortedEnrollments[0] || null
        : sortedEnrollments[0] || null;

      const latestClassroom = latestEnrollment ? classMap.get(latestEnrollment.classroomId) || null : null;
      const latestTeacher = latestClassroom ? userMap.get(latestClassroom.assignedTeacherId) || null : null;

      // Calculate attendance statistics
      const attList = studentAttendanceMap.get(student.id) || [];
      let presentCount = 0;
      let absentCount = 0;
      let lateCount = 0;
      let permissionCount = 0;

      attList.forEach((a) => {
        if (a.status === "present") presentCount++;
        else if (a.status === "absent") absentCount++;
        else if (a.status === "late") lateCount++;
        else if (a.status === "permission") permissionCount++;
      });

      const totalRecordedSessions = presentCount + absentCount + lateCount + permissionCount;
      const attendanceRate =
        totalRecordedSessions > 0
          ? Math.round(((presentCount + lateCount + permissionCount) / totalRecordedSessions) * 1000) / 10
          : 0;

      result.push({
        student,
        latestEnrollment,
        latestClassroom,
        latestTeacher,
        attendanceRate,
        totalRecordedSessions,
        presentCount,
        absentCount,
        lateCount,
        permissionCount,
      });
    }

    return result;
  },

  /**
   * Get full attendance history & enrollment timeline for a single student.
   * Strictly enforces teacher access.
   */
  async getStudentFullHistory(
    studentId: string,
    currentUser: User | null
  ): Promise<{
    student: Student;
    enrollments: {
      enrollment: Enrollment;
      classroom: Classroom | null;
      studyPackage: StudyPackage | null;
      teacher: User | null;
    }[];
    attendanceRecords: (Attendance & {
      classroomName?: string;
      classroomCode?: string;
      teacherName?: string;
      recordedByName?: string;
    })[];
    overallSummary: StudentAttendanceSummary;
  }> {
    const [student, allEnrollments, allClasses, allPackages, allUsers, allAttendance] = await Promise.all([
      studentService.getStudentById(studentId),
      enrollmentService.getEnrollmentsByStudentId(studentId),
      classroomService.getClassrooms(),
      studyPackageService.getStudyPackages(),
      userService.getUsers(),
      attendanceService.getAttendance(),
    ]);

    if (!student) {
      throw new Error("STUDENT_NOT_FOUND");
    }

    const isTeacher = currentUser?.role === "teacher";
    const teacherClassIds = isTeacher
      ? allClasses
          .filter(
            (c) =>
              c.assignedTeacherId === currentUser?.id ||
              currentUser?.assignedClassroomIds?.includes(c.id)
          )
          .map((c) => c.id)
      : [];

    // Filter permitted enrollments
    const permittedEnrollments = isTeacher
      ? allEnrollments.filter((e) => teacherClassIds.includes(e.classroomId))
      : allEnrollments;

    if (isTeacher && permittedEnrollments.length === 0) {
      throw new Error("UNAUTHORIZED_STUDENT_ACCESS");
    }

    const classMap = new Map<string, Classroom>();
    allClasses.forEach((c) => classMap.set(c.id, c));

    const packageMap = new Map<string, StudyPackage>();
    allPackages.forEach((p) => packageMap.set(p.id, p));

    const userMap = new Map<string, User>();
    allUsers.forEach((u) => userMap.set(u.id, u));

    // Map enriched enrollments
    const enrichedEnrollments = permittedEnrollments
      .filter((e) => e.status !== "cancelled")
      .map((enr) => {
        const cls = classMap.get(enr.classroomId) || null;
        const pkg = cls ? packageMap.get(cls.packageId) : null;
        const tch = cls ? userMap.get(cls.assignedTeacherId) : null;
        return {
          enrollment: enr,
          classroom: cls,
          studyPackage: pkg || (enr.packageId ? packageMap.get(enr.packageId) || null : null),
          teacher: tch || null,
        };
      })
      .sort((a, b) => (b.enrollment.startDate || "").localeCompare(a.enrollment.startDate || ""));

    // Filter and enrich attendance records
    const permittedClassIds = new Set(permittedEnrollments.map((e) => e.classroomId));

    const studentAtt = allAttendance.filter(
      (a) =>
        a.studentId === studentId &&
        permittedClassIds.has(a.classroomId)
    );

    const enrichedAttendance = studentAtt
      .map((att) => {
        const cls = classMap.get(att.classroomId);
        const tch = cls ? userMap.get(cls.assignedTeacherId) : userMap.get(att.teacherId);
        const recUser = userMap.get(att.recordedBy);
        return {
          ...att,
          attendanceDate: att.attendanceDate || att.date || "",
          classroomName: cls?.name,
          classroomCode: cls?.code,
          teacherName: tch?.name,
          recordedByName: recUser?.name || att.recordedBy,
        };
      })
      .sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate));

    // Calculate overall summary
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let permissionCount = 0;

    enrichedAttendance.forEach((a) => {
      if (a.status === "present") presentCount++;
      else if (a.status === "absent") absentCount++;
      else if (a.status === "late") lateCount++;
      else if (a.status === "permission") permissionCount++;
    });

    const recordedSessions = presentCount + absentCount + lateCount + permissionCount;
    const attendanceRate =
      recordedSessions > 0
        ? Math.round(((presentCount + lateCount + permissionCount) / recordedSessions) * 1000) / 10
        : 0;

    return {
      student,
      enrollments: enrichedEnrollments,
      attendanceRecords: enrichedAttendance,
      overallSummary: {
        presentCount,
        absentCount,
        lateCount,
        permissionCount,
        recordedSessions,
        attendanceRate,
      },
    };
  },

  /**
   * Generates single-student monthly attendance report data.
   */
  async getStudentMonthlyReport(params: {
    studentId: string;
    yearMonth: string;
    enrollmentId?: string;
    currentUser?: User | null;
  }): Promise<StudentMonthlyReportData> {
    const { studentId, yearMonth, enrollmentId, currentUser } = params;

    const [yearStr, monthStr] = yearMonth.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      throw new Error("INVALID_MONTH");
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const monthStart = `${yearStr}-${monthStr.padStart(2, "0")}-01`;
    const monthEnd = `${yearStr}-${monthStr.padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

    const [
      student,
      allEnrollments,
      allClasses,
      allPackages,
      allUsers,
      allAttendance,
      activeHolidays,
    ] = await Promise.all([
      studentService.getStudentById(studentId),
      enrollmentService.getEnrollmentsByStudentId(studentId),
      classroomService.getClassrooms(),
      studyPackageService.getStudyPackages(),
      userService.getUsers(),
      attendanceService.getAttendance(),
      schoolHolidayService.getActiveSchoolHolidays(),
    ]);

    if (!student) {
      throw new Error("STUDENT_NOT_FOUND");
    }

    const isTeacher = currentUser?.role === "teacher";
    const teacherClassIds = isTeacher
      ? allClasses
          .filter(
            (c) =>
              c.assignedTeacherId === currentUser?.id ||
              currentUser?.assignedClassroomIds?.includes(c.id)
          )
          .map((c) => c.id)
      : [];

    const classMap = new Map<string, Classroom>();
    allClasses.forEach((c) => classMap.set(c.id, c));

    const packageMap = new Map<string, StudyPackage>();
    allPackages.forEach((p) => packageMap.set(p.id, p));

    const userMap = new Map<string, User>();
    allUsers.forEach((u) => userMap.set(u.id, u));

    // Find candidate enrollments for this month
    const validMonthEnrollments = allEnrollments.filter((enr) => {
      if (enr.status === "cancelled") return false;
      if (isTeacher && !teacherClassIds.includes(enr.classroomId)) return false;

      // Must overlap selected month
      if (enr.startDate > monthEnd) return false;
      if (enr.actualEndDate && enr.actualEndDate < monthStart) return false;

      return true;
    });

    if (validMonthEnrollments.length === 0) {
      throw new Error("NO_VALID_ENROLLMENT_IN_MONTH");
    }

    // Select targeted enrollment
    let targetEnrollment: Enrollment | undefined;
    if (enrollmentId) {
      targetEnrollment = validMonthEnrollments.find((e) => e.id === enrollmentId);
    }
    if (!targetEnrollment) {
      // Pick active first, or latest startDate
      targetEnrollment =
        validMonthEnrollments.find((e) => e.status === "active") || validMonthEnrollments[0];
    }

    const targetClassroom = classMap.get(targetEnrollment.classroomId);
    if (!targetClassroom) {
      throw new Error("CLASSROOM_NOT_FOUND");
    }

    // Permission double check
    if (isTeacher && targetClassroom.assignedTeacherId !== currentUser?.id && !currentUser?.assignedClassroomIds?.includes(targetClassroom.id)) {
      throw new Error("UNAUTHORIZED_TEACHER_REPORT");
    }

    const studyPackage = packageMap.get(targetClassroom.packageId) || (targetEnrollment.packageId ? packageMap.get(targetEnrollment.packageId) || null : null);
    const teacher = userMap.get(targetClassroom.assignedTeacherId) || null;

    // Filter attendance records for (studentId, classroomId, in this month)
    const attMap = new Map<string, Attendance>();
    allAttendance.forEach((a) => {
      const aDate = a.attendanceDate || a.date || "";
      if (
        a.studentId === studentId &&
        a.classroomId === targetClassroom.id &&
        aDate.startsWith(yearMonth)
      ) {
        attMap.set(aDate, a);
      }
    });

    // Generate valid session dates for this classroom & enrollment
    const sessions: SingleStudentMonthlySessionItem[] = [];
    let scheduledSessions = 0;
    let recordedSessions = 0;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let permissionCount = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dPadded = String(d).padStart(2, "0");
      const dateStr = `${yearStr}-${monthStr.padStart(2, "0")}-${dPadded}`;
      const currentDate = new Date(year, month - 1, d);

      const jsDay = currentDate.getDay(); // 0=Sun, 1=Mon ... 6=Sat
      const customDay = jsDay === 0 ? 7 : jsDay;

      // Condition 1: Must be a classroom scheduleDay
      if (!targetClassroom.scheduleDays.includes(customDay)) {
        continue;
      }

      // Condition 2: Classroom start date
      if (targetClassroom.startDate && dateStr < targetClassroom.startDate) {
        continue;
      }

      // Condition 3: Classroom end date
      const maxClassEndDate = targetClassroom.actualEndDate || targetClassroom.expectedEndDate;
      if (maxClassEndDate && dateStr > maxClassEndDate) {
        continue;
      }

      const holiday = getHolidayForDate(dateStr, activeHolidays);
      const isHol = !!holiday;

      const dayNameKm = KHMER_DAY_NAMES[customDay] || "";
      const dayNameEn = EN_DAY_NAMES[customDay] || "";

      // Condition 4: Holiday handling
      if (isHol) {
        sessions.push({
          dateStr,
          dayNumber: dPadded,
          dayOfWeek: customDay,
          dayNameKm,
          dayNameEn,
          status: "holiday",
          code: "H",
          isHoliday: true,
          holidayNameKm: holiday?.nameKm,
          holidayNameEn: holiday?.nameEn,
          isExpectedSession: false,
        });
        continue;
      }

      // Condition 5: Student enrollment boundaries
      let isStudentActive = true;
      if (targetEnrollment.startDate && dateStr < targetEnrollment.startDate) {
        isStudentActive = false;
      } else if (targetEnrollment.status === "transferred" && targetEnrollment.actualEndDate && dateStr >= targetEnrollment.actualEndDate) {
        isStudentActive = false;
      } else if (targetEnrollment.status === "completed" && targetEnrollment.actualEndDate && dateStr > targetEnrollment.actualEndDate) {
        isStudentActive = false;
      }

      if (!isStudentActive) {
        sessions.push({
          dateStr,
          dayNumber: dPadded,
          dayOfWeek: customDay,
          dayNameKm,
          dayNameEn,
          status: "not_expected",
          code: "—",
          isHoliday: false,
          isExpectedSession: false,
        });
        continue;
      }

      // Valid expected session for this student!
      scheduledSessions++;

      const att = attMap.get(dateStr);
      if (att) {
        recordedSessions++;
        let code: SingleStudentMonthlySessionItem["code"] = "•";

        if (att.status === "present") {
          presentCount++;
          code = "P";
        } else if (att.status === "absent") {
          absentCount++;
          code = "A";
        } else if (att.status === "late") {
          lateCount++;
          code = "L";
        } else if (att.status === "permission") {
          permissionCount++;
          code = "E";
        }

        const recUser = userMap.get(att.recordedBy);

        sessions.push({
          dateStr,
          dayNumber: dPadded,
          dayOfWeek: customDay,
          dayNameKm,
          dayNameEn,
          status: att.status,
          code,
          remark: att.remark,
          recordedBy: att.recordedBy,
          recordedByName: recUser?.name || att.recordedBy,
          updatedBy: att.updatedBy,
          isHoliday: false,
          isExpectedSession: true,
        });
      } else {
        // Pending session
        sessions.push({
          dateStr,
          dayNumber: dPadded,
          dayOfWeek: customDay,
          dayNameKm,
          dayNameEn,
          status: "pending",
          code: "•",
          isHoliday: false,
          isExpectedSession: true,
        });
      }
    }

    const attendanceRate =
      recordedSessions > 0
        ? Math.round(((presentCount + lateCount + permissionCount) / recordedSessions) * 1000) / 10
        : 0;

    const monthNameKm = `${KHMER_MONTH_NAMES[month - 1]} ${toKhmerNum(year)}`;
    const monthNameEn = `${EN_MONTH_NAMES[month - 1]} ${year}`;

    const now = new Date();
    const phnomPenhFormatted = now.toLocaleString("km-KH", {
      timeZone: "Asia/Phnom_Penh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    return {
      student,
      enrollment: targetEnrollment,
      classroom: targetClassroom,
      studyPackage,
      teacher,
      selectedMonth: yearMonth,
      monthNameKm,
      monthNameEn,
      sessions,
      summary: {
        scheduledSessions,
        recordedSessions,
        presentCount,
        absentCount,
        lateCount,
        permissionCount,
        attendanceRate,
      },
      generatedAt: phnomPenhFormatted,
      generatedBy: currentUser?.name,
    };
  },
};
