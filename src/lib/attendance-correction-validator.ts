import { Classroom } from "@/models/classroom.model";
import { Enrollment } from "@/models/enrollment.model";
import { SchoolHoliday } from "@/models/school-holiday.model";
import { AttendanceStatus } from "@/models/attendance.model";
import { CorrectionReason } from "@/models/attendance-audit-log.model";
import {
  getCambodiaDateTime,
  getDayOfWeekFromDateStr,
} from "./attendance-time-lock";
import { isHoliday } from "./holiday-calendar";

export interface DateValidationResult {
  allowed: boolean;
  reason?:
    | "FUTURE_DATE"
    | "SCHOOL_HOLIDAY"
    | "BEFORE_CLASS_START"
    | "AFTER_CLASS_END"
    | "NOT_SCHEDULED_DAY"
    | "SESSION_NOT_ENDED_YET"
    | "CLASSROOM_REQUIRED";
}

export interface EnrollmentValidationResult {
  allowed: boolean;
  reason?:
    | "NO_ENROLLMENT"
    | "BEFORE_ENROLLMENT_START"
    | "AFTER_TRANSFER_DATE"
    | "AFTER_COMPLETION_DATE"
    | "ENROLLMENT_NOT_ACTIVE";
}

export interface InputValidationResult {
  isValid: boolean;
  errors: {
    status?: string;
    reason?: string;
    notes?: string;
    role?: string;
  };
}

/**
 * Validates whether the given date is eligible for attendance correction in the specified classroom.
 */
export function validateCorrectionDate(params: {
  classroom: Classroom | null | undefined;
  attendanceDate: string;
  activeHolidays?: SchoolHoliday[];
  hasExistingRecord?: boolean;
}): DateValidationResult {
  const { classroom, attendanceDate, activeHolidays = [], hasExistingRecord = false } = params;

  if (!classroom) {
    return { allowed: false, reason: "CLASSROOM_REQUIRED" };
  }

  const { dateStr: cambodiaToday, timeStr: cambodiaNow } = getCambodiaDateTime();

  // 1. Future dates are strictly forbidden
  if (attendanceDate > cambodiaToday) {
    return { allowed: false, reason: "FUTURE_DATE" };
  }

  // 2. School holiday / closed dates
  if (isHoliday(attendanceDate, activeHolidays)) {
    return { allowed: false, reason: "SCHOOL_HOLIDAY" };
  }

  // 3. Dates outside the classroom study period
  if (classroom.startDate && attendanceDate < classroom.startDate) {
    return { allowed: false, reason: "BEFORE_CLASS_START" };
  }
  const effectiveClassEndDate = classroom.actualEndDate || classroom.expectedEndDate;
  if (effectiveClassEndDate && attendanceDate > effectiveClassEndDate) {
    return { allowed: false, reason: "AFTER_CLASS_END" };
  }

  // 4. Learning days
  const dayOfWeek = getDayOfWeekFromDateStr(attendanceDate);
  if (!classroom.scheduleDays?.includes(dayOfWeek)) {
    return { allowed: false, reason: "NOT_SCHEDULED_DAY" };
  }

  // 5. Past date vs Today check:
  // Allowed if: past date, OR session for today has already ended, OR an existing record is locked
  if (attendanceDate < cambodiaToday) {
    return { allowed: true };
  }

  // If today: check if session has ended or existing record already exists
  const endTime = classroom.endTime || "23:59";
  if (cambodiaNow >= endTime || hasExistingRecord) {
    return { allowed: true };
  }

  // If today and session is still upcoming or in progress without saved record, teacher marks normal attendance
  return { allowed: false, reason: "SESSION_NOT_ENDED_YET" };
}

/**
 * Validates whether a student was actively and validly enrolled on the target attendance date.
 */
export function validateStudentEnrollmentForCorrection(params: {
  enrollment: Enrollment | null | undefined;
  attendanceDate: string;
}): EnrollmentValidationResult {
  const { enrollment, attendanceDate } = params;

  if (!enrollment) {
    return { allowed: false, reason: "NO_ENROLLMENT" };
  }

  // 1. Start date check
  if (!enrollment.startDate || enrollment.startDate > attendanceDate) {
    return { allowed: false, reason: "BEFORE_ENROLLMENT_START" };
  }

  // 2. Status check
  if (enrollment.status === "active") {
    return { allowed: true };
  }

  if (enrollment.status === "transferred") {
    // Only eligible before the transfer effective date (actualEndDate)
    if (enrollment.actualEndDate && attendanceDate >= enrollment.actualEndDate) {
      return { allowed: false, reason: "AFTER_TRANSFER_DATE" };
    }
    return { allowed: true };
  }

  if (enrollment.status === "completed") {
    // Eligible on or before the completion date
    if (enrollment.actualEndDate && attendanceDate > enrollment.actualEndDate) {
      return { allowed: false, reason: "AFTER_COMPLETION_DATE" };
    }
    return { allowed: true };
  }

  // Paused, cancelled, or inactive enrollments
  return { allowed: false, reason: "ENROLLMENT_NOT_ACTIVE" };
}

/**
 * Validates mandatory fields before saving a correction.
 */
export function validateCorrectionInput(params: {
  previousStatus: AttendanceStatus | null | undefined;
  newStatus: AttendanceStatus | undefined;
  reason: CorrectionReason | undefined;
  notes?: string;
  userRole?: string;
}): InputValidationResult {
  const { previousStatus, newStatus, reason, notes = "", userRole } = params;
  const errors: InputValidationResult["errors"] = {};

  // 1. User role check
  if (userRole !== "super_admin" && userRole !== "admin") {
    errors.role = "UNAUTHORIZED_ROLE";
  }

  // 2. Status check
  const validStatuses: AttendanceStatus[] = ["present", "absent", "late", "permission"];
  if (!newStatus || !validStatuses.includes(newStatus)) {
    errors.status = "INVALID_STATUS";
  } else if (previousStatus && previousStatus === newStatus) {
    errors.status = "STATUS_UNCHANGED";
  }

  // 3. Reason check
  const validReasons: CorrectionReason[] = [
    "teacher_wrong_status",
    "student_valid_explanation",
    "medical_reason",
    "system_data_entry_error",
    "other",
  ];
  if (!reason || !validReasons.includes(reason)) {
    errors.reason = "REASON_REQUIRED";
  }

  // 4. Notes check
  const trimmedNotes = notes.trim();
  if (reason === "other" && trimmedNotes.length === 0) {
    errors.notes = "NOTES_REQUIRED_FOR_OTHER";
  } else if (trimmedNotes.length > 500) {
    errors.notes = "NOTES_TOO_LONG";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
