import { classroomService } from "./classroom.service";
import { studyPackageService } from "./study-package.service";
import { userService } from "./user.service";
import { studentService } from "./student.service";
import { enrollmentService } from "./enrollment.service";
import { attendanceService } from "./attendance.service";
import { schoolHolidayService } from "./school-holiday.service";
import { getHolidayForDate } from "@/lib/holiday-calendar";
import {
  MonthlyAttendanceReportData,
  ReportDateColumn,
  StudentReportRow,
  ReportSummaryMetrics,
  ReportCellData,
} from "@/models/attendance-report.model";

const KHMER_NUMERALS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];

export function toKhmerNumber(num: number | string): string {
  return String(num)
    .split("")
    .map((char) => (/[0-9]/.test(char) ? KHMER_NUMERALS[parseInt(char, 10)] : char))
    .join("");
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

import { User } from "@/models/user.model";

export const attendanceReportService = {
  /**
   * Generates complete monthly attendance report data for a specific classroom and month (YYYY-MM).
   */
  async generateMonthlyReport(
    classroomId: string,
    yearMonth: string,
    currentUserName?: string,
    currentUser?: User | null
  ): Promise<MonthlyAttendanceReportData> {
    const [yearStr, monthStr] = yearMonth.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10); // 1-indexed (1..12)

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      throw new Error("INVALID_MONTH_FORMAT");
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const monthStart = `${yearStr}-${monthStr.padStart(2, "0")}-01`;
    const monthEnd = `${yearStr}-${monthStr.padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

    // Parallel fetch required data
    const [classroom, allPackages, allUsers, allStudents, allEnrollments, allAttendance, activeHolidays] =
      await Promise.all([
        classroomService.getClassroomById(classroomId, currentUser),
        studyPackageService.getStudyPackages(),
        userService.getUsers(),
        studentService.getStudents(),
        enrollmentService.getEnrollmentsByClassroomId(classroomId, currentUser),
        attendanceService.getAttendance(),
        schoolHolidayService.getActiveSchoolHolidays(),
      ]);

    if (!classroom) {
      throw new Error("CLASSROOM_NOT_FOUND");
    }

    if (currentUser?.role === "admin" && currentUser.branchId && classroom.branchId !== currentUser.branchId) {
      throw new Error("UNAUTHORIZED_CLASSROOM_ACCESS");
    }

    const studyPackage = allPackages.find((p) => p.id === classroom.packageId) || null;
    const teacher = allUsers.find((u) => u.id === classroom.assignedTeacherId) || null;

    // 1. Generate dynamic date columns based on classroom schedule, date boundaries, and holidays
    const dateColumns: ReportDateColumn[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dPadded = String(d).padStart(2, "0");
      const dateStr = `${yearStr}-${monthStr.padStart(2, "0")}-${dPadded}`;
      const currentDate = new Date(year, month - 1, d);

      const jsDay = currentDate.getDay(); // 0=Sun, 1=Mon ... 6=Sat
      const customDay = jsDay === 0 ? 7 : jsDay; // 1=Mon ... 7=Sun

      // Condition 1: Must be on classroom learningDays / scheduleDays
      if (!classroom.scheduleDays.includes(customDay)) {
        continue;
      }

      // Condition 2: Must be on or after classroom startDate
      if (classroom.startDate && dateStr < classroom.startDate) {
        continue;
      }

      // Condition 3: Must be on or before actualEndDate or expectedEndDate when applicable
      const maxClassEndDate = classroom.actualEndDate || classroom.expectedEndDate;
      if (maxClassEndDate && dateStr > maxClassEndDate) {
        continue;
      }

      // Condition 4: Check if date is an active School Holiday
      const holiday = getHolidayForDate(dateStr, activeHolidays);
      const isHol = !!holiday;

      const dayNameEn = EN_DAY_NAMES[customDay] || "";
      const dayNameKm = KHMER_DAY_NAMES[customDay] || "";

      dateColumns.push({
        dateStr,
        dayNumber: dPadded,
        dayOfWeek: customDay,
        dayNameEn,
        dayNameKm,
        shortHeaderEn: `${dPadded} ${dayNameEn}`,
        shortHeaderKm: `${toKhmerNumber(dPadded)} ${dayNameKm}`,
        isHoliday: isHol,
        holiday: holiday || null,
        isScheduledSession: !isHol,
      });
    }

    // 2. Filter eligible students and enrollments for this classroom in this month
    const studentMap = new Map<string, (typeof allStudents)[0]>();
    allStudents.forEach((s) => studentMap.set(s.id, s));

    // Map attendance records: key = `${attendanceDate}_${studentId}`
    const attendanceMap = new Map<string, (typeof allAttendance)[0]>();
    allAttendance.forEach((a) => {
      const aDate = a.attendanceDate || a.date || "";
      if (a.classroomId === classroomId && aDate.startsWith(yearMonth)) {
        attendanceMap.set(`${aDate}_${a.studentId}`, a);
      }
    });

    const relevantEnrollments = allEnrollments.filter((enr) => {
      if (enr.classroomId !== classroomId) return false;
      if (enr.status === "cancelled") return false;

      // Enrollment must overlap with selected month
      if (enr.startDate > monthEnd) return false;
      if (enr.actualEndDate && enr.actualEndDate < monthStart) return false;

      return true;
    });

    const studentRows: StudentReportRow[] = [];

    for (const enr of relevantEnrollments) {
      const student = studentMap.get(enr.studentId);
      if (!student) continue;

      const cells: Record<string, ReportCellData> = {};
      let presentCount = 0;
      let absentCount = 0;
      let lateCount = 0;
      let permissionCount = 0;
      let expectedSessionCount = 0;
      let recordedSessionCount = 0;

      for (const col of dateColumns) {
        if (col.isHoliday) {
          cells[col.dateStr] = {
            status: "holiday",
            code: "H",
            isHoliday: true,
            holidayNameKm: col.holiday?.nameKm,
            holidayNameEn: col.holiday?.nameEn,
            isEligibleDate: false,
            hasRecord: false,
          };
          continue;
        }

        // Student active date check
        let isStudentActiveOnDate = true;

        if (enr.startDate && col.dateStr < enr.startDate) {
          isStudentActiveOnDate = false;
        } else if (enr.status === "transferred" && enr.actualEndDate && col.dateStr >= enr.actualEndDate) {
          isStudentActiveOnDate = false;
        } else if (enr.status === "completed" && enr.actualEndDate && col.dateStr > enr.actualEndDate) {
          isStudentActiveOnDate = false;
        }

        if (!isStudentActiveOnDate) {
          cells[col.dateStr] = {
            status: "not_enrolled",
            code: "—",
            isEligibleDate: false,
            hasRecord: false,
          };
          continue;
        }

        // Valid expected session for this student
        expectedSessionCount++;

        const att = attendanceMap.get(`${col.dateStr}_${student.id}`);
        if (att) {
          recordedSessionCount++;
          let code: ReportCellData["code"] = "•";

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

          cells[col.dateStr] = {
            attendanceDocId: att.attendanceDocId || att.id,
            status: att.status,
            code,
            remark: att.remark,
            isEligibleDate: true,
            hasRecord: true,
          };
        } else {
          // Unrecorded / pending session
          cells[col.dateStr] = {
            status: "unrecorded",
            code: "•",
            isEligibleDate: true,
            hasRecord: false,
          };
        }
      }

      const attendanceRate =
        recordedSessionCount > 0
          ? Math.round(((presentCount + lateCount + permissionCount) / recordedSessionCount) * 1000) / 10
          : 0;

      studentRows.push({
        student,
        enrollment: enr,
        cells,
        presentCount,
        absentCount,
        lateCount,
        permissionCount,
        recordedSessionCount,
        expectedSessionCount,
        attendanceRate,
      });
    }

    // Sort students by studentCode ascending, then by nameKh
    studentRows.sort((a, b) => {
      const codeComp = a.student.studentCode.localeCompare(b.student.studentCode);
      if (codeComp !== 0) return codeComp;
      return a.student.nameKh.localeCompare(b.student.nameKh);
    });

    // 3. Overall Summary Calculations
    const scheduledSessionsCount = dateColumns.filter((c) => c.isScheduledSession).length;

    // Count how many date columns have at least 1 student with recorded attendance
    let recordedSessionsCount = 0;
    for (const col of dateColumns) {
      if (col.isScheduledSession) {
        const hasAnyRecord = studentRows.some((row) => row.cells[col.dateStr]?.hasRecord);
        if (hasAnyRecord) recordedSessionsCount++;
      }
    }

    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalPermission = 0;
    let totalRecordedStudentSessions = 0;

    for (const row of studentRows) {
      totalPresent += row.presentCount;
      totalAbsent += row.absentCount;
      totalLate += row.lateCount;
      totalPermission += row.permissionCount;
      totalRecordedStudentSessions += row.recordedSessionCount;
    }

    const overallAttendanceRate =
      totalRecordedStudentSessions > 0
        ? Math.round(((totalPresent + totalLate + totalPermission) / totalRecordedStudentSessions) * 1000) / 10
        : 0;

    const summaryMetrics: ReportSummaryMetrics = {
      totalEnrolledStudents: studentRows.length,
      scheduledSessionsCount,
      recordedSessionsCount,
      totalPresent,
      totalAbsent,
      totalLate,
      totalPermission,
      totalRecordedStudentSessions,
      overallAttendanceRate,
    };

    const monthNameEn = `${EN_MONTH_NAMES[month - 1]} ${year}`;
    const monthNameKm = `${KHMER_MONTH_NAMES[month - 1]} ${toKhmerNumber(year)}`;

    // Timestamp in Phnom Penh timezone format
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
      classroom,
      studyPackage,
      teacher,
      selectedMonth: yearMonth,
      monthNameEn,
      monthNameKm,
      dateColumns,
      studentRows,
      summaryMetrics,
      generatedAt: phnomPenhFormatted,
      generatedBy: currentUserName,
    };
  },
};
