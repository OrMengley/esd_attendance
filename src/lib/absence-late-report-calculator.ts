import { Student } from "@/models/student.model";
import { Classroom } from "@/models/classroom.model";
import { StudyPackage } from "@/models/study-package.model";
import { User } from "@/models/user.model";
import { Enrollment } from "@/models/enrollment.model";
import { Attendance } from "@/models/attendance.model";
import { SchoolHoliday } from "@/models/school-holiday.model";
import { getHolidayForDate } from "@/lib/holiday-calendar";
import { getCambodiaDateTime } from "@/lib/attendance-time-lock";
import {
  AbsenceLateFilters,
  AbsenceLateIncident,
  AbsenceLateStudentRow,
  AbsenceLateSummaryMetrics,
  AbsenceLateReportData,
} from "@/models/absence-late-report.model";

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

const KHMER_NUMERALS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];

export function toKhmerNumeralString(num: number | string): string {
  return String(num)
    .split("")
    .map((char) => (/[0-9]/.test(char) ? KHMER_NUMERALS[parseInt(char, 10)] : char))
    .join("");
}

export function calculateAbsenceLateReport(params: {
  filters: AbsenceLateFilters;
  students: Student[];
  enrollments: Enrollment[];
  classrooms: Classroom[];
  studyPackages: StudyPackage[];
  users: User[];
  attendance: Attendance[];
  holidays: SchoolHoliday[];
  currentUserName?: string;
}): AbsenceLateReportData {
  const {
    filters,
    students,
    enrollments,
    classrooms,
    studyPackages,
    users,
    attendance,
    holidays,
    currentUserName,
  } = params;

  const [yearStr, monthStr] = filters.yearMonth.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const daysInMonth = new Date(year, month, 0).getDate();
  const monthStart = `${yearStr}-${monthStr.padStart(2, "0")}-01`;
  const monthEnd = `${yearStr}-${monthStr.padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  const { dateStr: cambodiaToday, timeStr: cambodiaNow } = getCambodiaDateTime();

  // Indexing maps
  const classroomMap = new Map<string, Classroom>();
  classrooms.forEach((c) => classroomMap.set(c.id, c));

  const packageMap = new Map<string, StudyPackage>();
  studyPackages.forEach((p) => packageMap.set(p.id, p));

  const userMap = new Map<string, User>();
  users.forEach((u) => userMap.set(u.id, u));

  // Attendance lookup: key = `${studentId}_${classroomId}_${date}`
  const attendanceMap = new Map<string, Attendance>();
  attendance.forEach((att) => {
    const aDate = att.attendanceDate || att.date || "";
    if (aDate.startsWith(filters.yearMonth)) {
      const key = `${att.studentId}_${att.classroomId}_${aDate}`;
      attendanceMap.set(key, att);
    }
  });

  // Group enrollments by studentId (excluding cancelled)
  const studentEnrollmentsMap = new Map<string, Enrollment[]>();
  enrollments.forEach((enr) => {
    if (enr.status === "cancelled") return;

    // Check overlap with month
    if (enr.startDate > monthEnd) return;
    if (enr.actualEndDate && enr.actualEndDate < monthStart) return;

    const list = studentEnrollmentsMap.get(enr.studentId) || [];
    list.push(enr);
    studentEnrollmentsMap.set(enr.studentId, list);
  });

  // Pre-calculate valid scheduled dates for each classroom in this month
  // A date is scheduled if: matches scheduleDays, within startDate and (actualEndDate||expectedEndDate), and NOT holiday
  const classroomScheduledDatesMap = new Map<string, string[]>();

  classrooms.forEach((classroom) => {
    const validDates: string[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dPadded = String(d).padStart(2, "0");
      const dateStr = `${yearStr}-${monthStr.padStart(2, "0")}-${dPadded}`;
      const currentDate = new Date(year, month - 1, d);

      const jsDay = currentDate.getDay(); // 0=Sun ... 6=Sat
      const customDay = jsDay === 0 ? 7 : jsDay; // 1=Mon ... 7=Sun

      // Condition 1: Must match classroom scheduleDays
      if (!classroom.scheduleDays || !classroom.scheduleDays.includes(customDay)) {
        continue;
      }

      // Condition 2: Classroom start date
      if (classroom.startDate && dateStr < classroom.startDate) {
        continue;
      }

      // Condition 3: Classroom end date
      const maxEndDate = classroom.actualEndDate || classroom.expectedEndDate;
      if (maxEndDate && dateStr > maxEndDate) {
        continue;
      }

      // Condition 4: Exclude School Holidays
      const holiday = getHolidayForDate(dateStr, holidays);
      if (holiday) {
        continue;
      }

      validDates.push(dateStr);
    }

    classroomScheduledDatesMap.set(classroom.id, validDates);
  });

  const rawStudentRows: AbsenceLateStudentRow[] = [];

  // Evaluate each student
  students.forEach((student) => {
    const studentEnrs = studentEnrollmentsMap.get(student.id);
    if (!studentEnrs || studentEnrs.length === 0) {
      return; // Not enrolled in any class in this month
    }

    // Determine current/latest classroom
    // Prioritize active enrollment, then latest by startDate
    const sortedEnrs = [...studentEnrs].sort((a, b) => {
      if (a.status === "active" && b.status !== "active") return -1;
      if (b.status === "active" && a.status !== "active") return 1;
      return (b.startDate || "").localeCompare(a.startDate || "");
    });

    const primaryEnrollment = sortedEnrs[0];
    const currentClass = classroomMap.get(primaryEnrollment.classroomId);
    if (!currentClass) {
      return;
    }

    const assignedTeacher = userMap.get(currentClass.assignedTeacherId) || null;
    const studyPackage = packageMap.get(currentClass.packageId) || null;
    const isWeekday = currentClass.scheduleDays?.length === 5;
    const scheduleTypeText: "weekday" | "weekend" = isWeekday ? "weekday" : "weekend";

    let plannedSessions = 0;
    let elapsedSessions = 0;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let permissionCount = 0;
    const incidents: AbsenceLateIncident[] = [];

    // Track dates processed to avoid duplicate session counts across enrollments on same date
    const processedDates = new Set<string>();

    // For each enrollment of this student, check sessions
    studentEnrs.forEach((enr) => {
      const cls = classroomMap.get(enr.classroomId);
      if (!cls) return;

      const scheduledDates = classroomScheduledDatesMap.get(cls.id) || [];

      scheduledDates.forEach((dateStr) => {
        if (processedDates.has(`${cls.id}_${dateStr}`)) return;

        // Check if date falls in student's active enrollment window
        if (enr.startDate && dateStr < enr.startDate) return;
        if (enr.status === "transferred" && enr.actualEndDate && dateStr >= enr.actualEndDate) return;
        if (enr.status === "completed" && enr.actualEndDate && dateStr > enr.actualEndDate) return;

        processedDates.add(`${cls.id}_${dateStr}`);
        plannedSessions++;

        // Query attendance
        const attKey = `${student.id}_${cls.id}_${dateStr}`;
        const att = attendanceMap.get(attKey);

        // Check if session is elapsed (past or today after end_time, or attendance already marked)
        let isSessionElapsed = false;
        if (dateStr < cambodiaToday) {
          isSessionElapsed = true;
        } else if (dateStr === cambodiaToday) {
          const endTime = cls.endTime || "23:59";
          if (cambodiaNow >= endTime || !!att) {
            isSessionElapsed = true;
          }
        }

        if (isSessionElapsed) {
          elapsedSessions++;
        }

        if (att) {
          if (att.status === "present") {
            presentCount++;
          } else if (att.status === "absent") {
            absentCount++;
            incidents.push({
              date: dateStr,
              status: "absent",
              remark: att.remark,
              classroomId: cls.id,
              classroomName: cls.name,
              classroomCode: cls.code,
            });
          } else if (att.status === "late") {
            lateCount++;
            incidents.push({
              date: dateStr,
              status: "late",
              remark: att.remark,
              classroomId: cls.id,
              classroomName: cls.name,
              classroomCode: cls.code,
            });
          } else if (att.status === "permission") {
            permissionCount++;
          }
        }
      });
    });

    // Sort incidents by date descending
    incidents.sort((a, b) => b.date.localeCompare(a.date));

    const lastIncident = incidents.length > 0 ? incidents[0] : null;

    // Calculate attendance rate only from elapsed sessions
    // late counts as attended (present + late), absent is not in numerator
    // if elapsedSessions === 0, rate is null
    const attendanceRate: number | null =
      elapsedSessions > 0
        ? Math.min(100, Math.round(((presentCount + lateCount) / elapsedSessions) * 1000) / 10)
        : null;

    rawStudentRows.push({
      rank: 0, // Will be set after filtering & sorting
      student,
      currentClass,
      assignedTeacher,
      studyPackage,
      scheduleTypeText,
      plannedSessions,
      elapsedSessions,
      scheduledSessions: plannedSessions,
      presentCount,
      absentCount,
      lateCount,
      permissionCount,
      attendanceRate,
      lastIncidentDate: lastIncident ? lastIncident.date : null,
      lastIncidentStatus: lastIncident ? lastIncident.status : null,
      incidents,
    });
  });

  // Apply Filters
  const minOcc = Math.max(1, filters.minOccurrences || 1);

  const filteredRows = rawStudentRows.filter((row) => {
    // 1. Report Type & Threshold filter
    if (filters.reportType === "absent_only") {
      if (row.absentCount < minOcc) return false;
    } else if (filters.reportType === "late_only") {
      if (row.lateCount < minOcc) return false;
    } else {
      // "either"
      const matchesEither =
        row.absentCount >= minOcc ||
        row.lateCount >= minOcc ||
        row.absentCount + row.lateCount >= minOcc;
      if (!matchesEither) return false;
    }

    // 2. Classroom Filter
    if (filters.selectedClassId !== "all") {
      if (row.currentClass.id !== filters.selectedClassId) {
        return false;
      }
    }

    // 3. Teacher Filter
    if (filters.selectedTeacherId !== "all") {
      if (row.currentClass.assignedTeacherId !== filters.selectedTeacherId) {
        return false;
      }
    }

    // 4. Study Package Filter
    if (filters.selectedPackageId !== "all") {
      if (row.currentClass.packageId !== filters.selectedPackageId) {
        return false;
      }
    }

    // 5. Schedule Type Filter
    if (filters.selectedSchedule !== "all") {
      if (row.scheduleTypeText !== filters.selectedSchedule) {
        return false;
      }
    }

    // 6. Search Query Filter
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      const nameKh = (row.student.nameKh || "").toLowerCase();
      const nameEn = (row.student.nameEn || "").toLowerCase();
      const code = (row.student.studentCode || "").toLowerCase();
      const phone = (row.student.phone || "").toLowerCase();
      const fatherPhone = (row.student.fatherPhone || "").toLowerCase();
      const motherPhone = (row.student.motherPhone || "").toLowerCase();

      const matchesSearch =
        nameKh.includes(q) ||
        nameEn.includes(q) ||
        code.includes(q) ||
        phone.includes(q) ||
        fatherPhone.includes(q) ||
        motherPhone.includes(q);

      if (!matchesSearch) return false;
    }

    return true;
  });

  // Sort: Highest absences first, then highest lates, then student name
  filteredRows.sort((a, b) => {
    if (b.absentCount !== a.absentCount) {
      return b.absentCount - a.absentCount;
    }
    if (b.lateCount !== a.lateCount) {
      return b.lateCount - a.lateCount;
    }
    return (a.student.nameKh || "").localeCompare(b.student.nameKh || "");
  });

  // Assign 1-indexed rank
  filteredRows.forEach((row, idx) => {
    row.rank = idx + 1;
  });

  // Summary Metrics
  let totalAbsences = 0;
  let totalLates = 0;
  let studentsWithAbsences = 0;
  let studentsWithLates = 0;

  filteredRows.forEach((r) => {
    totalAbsences += r.absentCount;
    totalLates += r.lateCount;
    if (r.absentCount > 0) studentsWithAbsences++;
    if (r.lateCount > 0) studentsWithLates++;
  });

  const summary: AbsenceLateSummaryMetrics = {
    studentsFlagged: filteredRows.length,
    studentsWithAbsences,
    studentsWithLates,
    totalAbsences,
    totalLates,
  };

  const monthNameEn = `${EN_MONTH_NAMES[month - 1]} ${year}`;
  const monthNameKm = `${KHMER_MONTH_NAMES[month - 1]} ${toKhmerNumeralString(year)}`;

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
    selectedMonth: filters.yearMonth,
    monthNameKm,
    monthNameEn,
    filters,
    students: filteredRows,
    summary,
    generatedAt: phnomPenhFormatted,
    generatedBy: currentUserName,
  };
}
