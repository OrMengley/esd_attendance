import type { Classroom } from "../models/classroom.model";
import type { Student } from "../models/student.model";
import type { Enrollment } from "../models/enrollment.model";
import type { User } from "../models/user.model";

export const ALL_BRANCHES_ID = "all";

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
 * Filter students according to their class enrollment.
 * Rule: Students follow whichever class they are enrolled in.
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
 * Filter teachers / users by branch ID.
 * Rule: Teachers belong strictly to their assigned branch.
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
    // Super admins are system-wide, teachers and admins are branch-scoped if assigned
    if (user.role === "super_admin") return true;
    return user.branchId === branchId;
  });
}
