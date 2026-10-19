import type { Student } from "../models/student.model";
import type { Classroom } from "../models/classroom.model";
import type { Enrollment } from "../models/enrollment.model";

export type StudentClassEligibility =
  | { status: "available"; isSelectable: true }
  | { status: "in_this_class"; isSelectable: false }
  | {
      status: "in_other_class";
      isSelectable: false;
      otherClassroomId: string;
      otherClassroomName: string;
      otherClassroomCode: string;
    };

/**
 * Checks a student's enrollment eligibility relative to a target classroom.
 * Rule: A student can only have 1 active enrollment in the system at a time.
 */
export function getStudentClassEligibility(
  studentId: string,
  targetClassroomId: string,
  activeEnrollments: Enrollment[],
  classroomsMap: Record<string, Classroom>
): StudentClassEligibility {
  const activeEnr = activeEnrollments.find(
    (e) => e.studentId === studentId && e.status === "active"
  );

  if (!activeEnr) {
    return { status: "available", isSelectable: true };
  }

  if (activeEnr.classroomId === targetClassroomId) {
    return { status: "in_this_class", isSelectable: false };
  }

  const otherClass = classroomsMap[activeEnr.classroomId];
  return {
    status: "in_other_class",
    isSelectable: false,
    otherClassroomId: activeEnr.classroomId,
    otherClassroomName: otherClass ? otherClass.name : activeEnr.classroomId,
    otherClassroomCode: otherClass ? otherClass.code : "",
  };
}

/**
 * Validates whether multiple students can be enrolled in a classroom based on status & capacity.
 */
export function canEnrollCountInClassroom(
  classroom: Classroom,
  currentActiveCount: number,
  newCount: number = 1
): {
  canEnroll: boolean;
  remainingSpots?: number;
  reason?: "CLASS_NOT_ACTIVE" | "CLASS_FULL" | "EXCEEDS_CAPACITY";
} {
  if (classroom.status !== "active") {
    return { canEnroll: false, reason: "CLASS_NOT_ACTIVE" };
  }

  if (classroom.capacity && classroom.capacity > 0) {
    const remainingSpots = Math.max(0, classroom.capacity - currentActiveCount);
    if (currentActiveCount >= classroom.capacity) {
      return { canEnroll: false, remainingSpots: 0, reason: "CLASS_FULL" };
    }
    if (currentActiveCount + newCount > classroom.capacity) {
      return { canEnroll: false, remainingSpots, reason: "EXCEEDS_CAPACITY" };
    }
    return { canEnroll: true, remainingSpots };
  }

  return { canEnroll: true };
}

/**
 * Validates whether a single new student can be enrolled in a classroom based on status & capacity.
 */
export function canEnrollInClassroom(
  classroom: Classroom,
  currentActiveCount: number
): {
  canEnroll: boolean;
  remainingSpots?: number;
  reason?: "CLASS_NOT_ACTIVE" | "CLASS_FULL" | "EXCEEDS_CAPACITY";
} {
  return canEnrollCountInClassroom(classroom, currentActiveCount, 1);
}

/**
 * Filters a student list by search query and eligibility filter.
 */
export function filterStudentsForEnrollment(
  students: Student[],
  searchQuery: string,
  targetClassroomId: string,
  activeEnrollments: Enrollment[],
  classroomsMap: Record<string, Classroom>,
  filterTab: "all" | "available" | "enrolled" = "all"
): Array<{ student: Student; eligibility: StudentClassEligibility }> {
  const q = searchQuery.trim().toLowerCase();

  return students
    .map((student) => ({
      student,
      eligibility: getStudentClassEligibility(
        student.id,
        targetClassroomId,
        activeEnrollments,
        classroomsMap
      ),
    }))
    .filter(({ student, eligibility }) => {
      // 1. Text search match
      if (q) {
        const matchCode = (student.studentCode || "").toLowerCase().includes(q);
        const matchKh = (student.nameKh || "").toLowerCase().includes(q);
        const matchEn = (student.nameEn || "").toLowerCase().includes(q);
        const matchPhone = (student.phone || "").toLowerCase().includes(q);
        if (!matchCode && !matchKh && !matchEn && !matchPhone) {
          return false;
        }
      }

      // 2. Tab filter
      if (filterTab === "available") {
        return eligibility.isSelectable;
      }
      if (filterTab === "enrolled") {
        return !eligibility.isSelectable;
      }

      return true;
    });
}
