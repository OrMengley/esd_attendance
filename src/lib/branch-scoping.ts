import type { Classroom } from "../models/classroom.model";
import type { Student } from "../models/student.model";
import type { Enrollment } from "../models/enrollment.model";
import type { User } from "../models/user.model";
import type { Attendance } from "../models/attendance.model";
import type { AttendanceAuditLog } from "../models/attendance-audit-log.model";
import type { EnrollmentTransfer } from "../models/enrollment-transfer.model";

export const ALL_BRANCHES_ID = "all";

/**
 * Determine the authoritative, tamper-proof branch ID for an operation.
 * - Super admin can choose "all" or any specific branch ID.
 * - Admin and Teacher are PERMANENTLY scoped to user.branchId and cannot override it.
 */
export function getEffectiveBranchId(
  user?: User | null,
  requestedBranchId?: string | null
): string | null {
  if (!user) return null;
  if (user.role === "super_admin") {
    if (!requestedBranchId || requestedBranchId === ALL_BRANCHES_ID) {
      return ALL_BRANCHES_ID;
    }
    return requestedBranchId;
  }
  // All other roles (admin, teacher) are strictly locked to their assigned branchId
  return user.branchId || null;
}

/**
 * Verify whether a user is authorized to access or modify a branch-specific entity.
 */
export function canAccessBranch(
  user?: User | null,
  targetBranchId?: string | null
): boolean {
  if (!user) return false;
  if (user.role === "super_admin") return true;
  if (!targetBranchId) return false;
  return user.branchId === targetBranchId;
}

/**
 * Filter classrooms by branch ID.
 * If branchId is "all" or undefined/empty, all classrooms are returned.
 */
export function filterClassesByBranch(
  classes: Classroom[],
  branchId?: string | null
): Classroom[] {
  if (!branchId || branchId === ALL_BRANCHES_ID) {
    return classes;
  }
  return classes.filter((cls) => cls.branchId === branchId);
}

/**
 * Check if a single classroom belongs to the specified branch.
 */
export function isClassroomInBranch(
  cls: Classroom,
  branchId?: string | null
): boolean {
  if (!branchId || branchId === ALL_BRANCHES_ID) return true;
  return cls.branchId === branchId;
}

/**
 * Filter students according to their class enrollment or stored branchId.
 * Rule: Students follow whichever class they are enrolled in OR their stored branchId.
 * If branchId is "all" or undefined/empty, all students are returned.
 */
export function filterStudentsByBranch(
  students: Student[],
  enrollments: Enrollment[],
  classes: Classroom[],
  branchId?: string | null
): Student[] {
  if (!branchId || branchId === ALL_BRANCHES_ID) {
    return students;
  }

  // Find class IDs for the given branch
  const branchClassIds = new Set(
    classes
      .filter((cls) => cls.branchId === branchId)
      .map((cls) => cls.id)
  );

  // Find student IDs enrolled in those classes
  const enrolledStudentIds = new Set(
    enrollments
      .filter((enr) => branchClassIds.has(enr.classroomId))
      .map((enr) => enr.studentId)
  );

  // A student belongs to the branch if their student.branchId matches
  // OR if they are currently enrolled in a class belonging to this branch
  return students.filter(
    (student) => student.branchId === branchId || enrolledStudentIds.has(student.id)
  );
}

/**
 * Check if a single student belongs to the specified branch.
 */
export function isStudentInBranch(
  student: Student,
  enrollments: Enrollment[],
  classes: Classroom[],
  branchId?: string | null
): boolean {
  if (!branchId || branchId === ALL_BRANCHES_ID) return true;
  if (student.branchId === branchId) return true;

  const branchClassIds = new Set(
    classes.filter((cls) => cls.branchId === branchId).map((cls) => cls.id)
  );

  return enrollments.some(
    (enr) => enr.studentId === student.id && branchClassIds.has(enr.classroomId)
  );
}

/**
 * Filter teachers / users by branch ID.
 * Rule: Teachers and admins belong strictly to their assigned branch.
 * Super admins are accessible across all branches.
 * If branchId is "all" or undefined/empty, all users are returned.
 */
export function filterUsersByBranch(
  users: User[],
  branchId?: string | null
): User[] {
  if (!branchId || branchId === ALL_BRANCHES_ID) {
    return users;
  }
  return users.filter((user) => {
    if (user.role === "super_admin") return true;
    return user.branchId === branchId;
  });
}

/**
 * Filter enrollments by branch ID (scoped via enrollment.branchId, classroom, or student).
 */
export function filterEnrollmentsByBranch(
  enrollments: Enrollment[],
  classes: Classroom[],
  students: Student[],
  branchId?: string | null
): Enrollment[] {
  if (!branchId || branchId === ALL_BRANCHES_ID) {
    return enrollments;
  }

  const classMap = new Map(classes.map((c) => [c.id, c]));
  const studentMap = new Map(students.map((s) => [s.id, s]));

  return enrollments.filter((enr) => {
    // 1. Authoritative direct branchId
    if (enr.branchId) {
      return enr.branchId === branchId;
    }
    // 2. Legacy fallback to classroom branchId
    const cls = classMap.get(enr.classroomId);
    if (cls && cls.branchId) {
      return cls.branchId === branchId;
    }
    // 3. Fallback to student branchId
    const stu = studentMap.get(enr.studentId);
    return stu?.branchId === branchId;
  });
}

/**
 * Check if a single enrollment belongs to the specified branch.
 */
export function isEnrollmentInBranch(
  enrollment: Enrollment,
  classes: Classroom[],
  branchId?: string | null
): boolean {
  if (!branchId || branchId === ALL_BRANCHES_ID) return true;
  if (enrollment.branchId) {
    return enrollment.branchId === branchId;
  }
  const cls = classes.find((c) => c.id === enrollment.classroomId);
  return cls?.branchId === branchId;
}

/**
 * Filter enrollment transfer audit records by branch ID.
 * Returns transfers where either the source or target branch matches.
 */
export function filterTransfersByBranch(
  transfers: EnrollmentTransfer[],
  classes: Classroom[],
  branchId?: string | null
): EnrollmentTransfer[] {
  if (!branchId || branchId === ALL_BRANCHES_ID) {
    return transfers;
  }

  const classMap = new Map(classes.map((c) => [c.id, c]));

  return transfers.filter((t) => {
    // Direct branch properties
    if (t.sourceBranchId === branchId || t.targetBranchId === branchId) {
      return true;
    }
    // Legacy fallback via classes
    const srcClass = classMap.get(t.sourceClassroomId);
    if (srcClass?.branchId === branchId) {
      return true;
    }
    const tgtClass = classMap.get(t.targetClassroomId);
    return tgtClass?.branchId === branchId;
  });
}

/**
 * Filter attendance records by branch ID (scoped via classroom).
 */
export function filterAttendanceByBranch(
  attendanceList: Attendance[],
  classes: Classroom[],
  branchId?: string | null
): Attendance[] {
  if (!branchId || branchId === ALL_BRANCHES_ID) {
    return attendanceList;
  }

  const classMap = new Map(classes.map((c) => [c.id, c]));
  return attendanceList.filter((att) => {
    const cls = classMap.get(att.classroomId);
    return cls?.branchId === branchId;
  });
}

/**
 * Filter attendance audit logs by branch ID (scoped via classroom).
 */
export function filterAuditLogsByBranch(
  auditLogs: AttendanceAuditLog[],
  classes: Classroom[],
  branchId?: string | null
): AttendanceAuditLog[] {
  if (!branchId || branchId === ALL_BRANCHES_ID) {
    return auditLogs;
  }

  const classMap = new Map(classes.map((c) => [c.id, c]));
  return auditLogs.filter((log) => {
    const cls = classMap.get(log.classroomId);
    return cls?.branchId === branchId;
  });
}

