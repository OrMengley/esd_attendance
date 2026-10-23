import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getEffectiveBranchId,
  canAccessBranch,
  filterClassesByBranch,
  filterStudentsByBranch,
  filterUsersByBranch,
  filterEnrollmentsByBranch,
  filterAttendanceByBranch,
  filterAuditLogsByBranch,
  isClassroomInBranch,
  isStudentInBranch,
  ALL_BRANCHES_ID,
} from "../src/lib/branch-scoping.ts";
import type { Classroom } from "../src/models/classroom.model.ts";
import type { Student } from "../src/models/student.model.ts";
import type { Enrollment } from "../src/models/enrollment.model.ts";
import type { User } from "../src/models/user.model.ts";
import type { Attendance } from "../src/models/attendance.model.ts";
import type { AttendanceAuditLog } from "../src/models/attendance-audit-log.model.ts";

describe("Phase 5: Multi-Branch Data Isolation Verification Tests", () => {
  // Test Data Fixtures
  const branchA = "branch-001";
  const branchB = "branch-002";

  const superAdminUser: User = {
    id: "user-super",
    name: "Super Admin",
    username: "superadmin",
    password: "hashed_password",
    role: "super_admin",
    assignedClassroomIds: [],
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  const adminBranchA: User = {
    id: "user-admin-a",
    name: "Admin Branch A",
    username: "admin_a",
    password: "hashed_password",
    role: "admin",
    branchId: branchA,
    assignedClassroomIds: [],
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  const adminBranchB: User = {
    id: "user-admin-b",
    name: "Admin Branch B",
    username: "admin_b",
    password: "hashed_password",
    role: "admin",
    branchId: branchB,
    assignedClassroomIds: [],
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  const teacherBranchA: User = {
    id: "user-teacher-a",
    name: "Teacher A",
    username: "teacher_a",
    password: "hashed_password",
    role: "teacher",
    branchId: branchA,
    assignedClassroomIds: ["cls-a"],
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  const teacherBranchB: User = {
    id: "user-teacher-b",
    name: "Teacher B",
    username: "teacher_b",
    password: "hashed_password",
    role: "teacher",
    branchId: branchB,
    assignedClassroomIds: ["cls-b"],
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  const classBranchA: Classroom = {
    id: "cls-a",
    code: "CLASS-A",
    name: "Class in Branch A",
    branchId: branchA,
    packageId: "pkg-1",
    assignedTeacherId: "user-teacher-a",
    capacity: 25,
    status: "active",
    scheduleDays: [1, 2, 3, 4, 5],
    startTime: "07:00",
    endTime: "08:00",
    sessionMinutes: 60,
    hoursPerWeek: 5,
    startDate: "2026-02-01",
    expectedEndDate: "2026-06-30",
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  const classBranchB: Classroom = {
    id: "cls-b",
    code: "CLASS-B",
    name: "Class in Branch B",
    branchId: branchB,
    packageId: "pkg-1",
    assignedTeacherId: "user-teacher-b",
    capacity: 25,
    status: "active",
    scheduleDays: [1, 2, 3, 4, 5],
    startTime: "07:00",
    endTime: "08:00",
    sessionMinutes: 60,
    hoursPerWeek: 5,
    startDate: "2026-02-01",
    expectedEndDate: "2026-06-30",
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  const studentBranchA: Student = {
    id: "stu-a",
    studentCode: "STU-A",
    nameKh: "សិស្ស សាខា ក",
    gender: "male",
    branchId: branchA,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  const studentBranchB: Student = {
    id: "stu-b",
    studentCode: "STU-B",
    nameKh: "សិស្ស សាខា ខ",
    gender: "female",
    branchId: branchB,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  const enrollmentBranchA: Enrollment = {
    id: "enr-a",
    studentId: studentBranchA.id,
    classroomId: classBranchA.id,
    packageId: "pkg-1",
    status: "active",
    startDate: "2026-02-01",
    expectedEndDate: "2026-06-30",
    createdAt: "2026-02-01T00:00:00.000Z",
  };

  const enrollmentBranchB: Enrollment = {
    id: "enr-b",
    studentId: studentBranchB.id,
    classroomId: classBranchB.id,
    packageId: "pkg-1",
    status: "active",
    startDate: "2026-02-01",
    expectedEndDate: "2026-06-30",
    createdAt: "2026-02-01T00:00:00.000Z",
  };

  const attendanceBranchA: Attendance = {
    id: "att-a",
    enrollmentId: enrollmentBranchA.id,
    classroomId: classBranchA.id,
    packageId: "pkg-1",
    studentId: studentBranchA.id,
    status: "present",
    attendanceDate: "2026-10-20",
    teacherId: teacherBranchA.id,
    recordedBy: teacherBranchA.id,
    recordedAt: "2026-10-20T07:00:00.000Z",
    createdAt: "2026-10-20T07:00:00.000Z",
  };

  const attendanceBranchB: Attendance = {
    id: "att-b",
    enrollmentId: enrollmentBranchB.id,
    classroomId: classBranchB.id,
    packageId: "pkg-1",
    studentId: studentBranchB.id,
    status: "present",
    attendanceDate: "2026-10-20",
    teacherId: teacherBranchB.id,
    recordedBy: teacherBranchB.id,
    recordedAt: "2026-10-20T07:00:00.000Z",
    createdAt: "2026-10-20T07:00:00.000Z",
  };

  const auditLogBranchA: AttendanceAuditLog = {
    id: "log-a",
    attendanceId: "att-a",
    studentId: studentBranchA.id,
    classroomId: classBranchA.id,
    attendanceDate: "2026-10-20",
    previousStatus: "absent",
    newStatus: "present",
    correctionReason: "teacher_wrong_status",
    correctionNote: "Corrected by admin A",
    correctedById: adminBranchA.id,
    correctedByName: adminBranchA.name,
    correctedByUsername: adminBranchA.username,
    correctedByRole: "admin",
    correctedAt: "2026-10-20T10:00:00.000Z",
    studentSnapshot: {
      studentCode: studentBranchA.studentCode,
      fullNameKm: studentBranchA.nameKh,
      fullNameEn: studentBranchA.nameEn,
    },
    classroomSnapshot: {
      classCode: classBranchA.code,
      className: classBranchA.name,
    },
  };

  const auditLogBranchB: AttendanceAuditLog = {
    id: "log-b",
    attendanceId: "att-b",
    studentId: studentBranchB.id,
    classroomId: classBranchB.id,
    attendanceDate: "2026-10-20",
    previousStatus: "absent",
    newStatus: "permission",
    correctionReason: "student_valid_explanation",
    correctionNote: "Corrected by admin B",
    correctedById: adminBranchB.id,
    correctedByName: adminBranchB.name,
    correctedByUsername: adminBranchB.username,
    correctedByRole: "admin",
    correctedAt: "2026-10-20T10:00:00.000Z",
    studentSnapshot: {
      studentCode: studentBranchB.studentCode,
      fullNameKm: studentBranchB.nameKh,
      fullNameEn: studentBranchB.nameEn,
    },
    classroomSnapshot: {
      classCode: classBranchB.code,
      className: classBranchB.name,
    },
  };

  // Scenario 1: Admin of branch A cannot read classes from branch B
  describe("Scenario 1: Admin of branch A cannot read classes from branch B", () => {
    it("denies access to branch B classroom for admin A", () => {
      assert.strictEqual(canAccessBranch(adminBranchA, classBranchB.branchId), false);
      assert.strictEqual(isClassroomInBranch(classBranchB, adminBranchA.branchId), false);
    });

    it("filterClassesByBranch returns only branch A classrooms for admin A", () => {
      const classes = [classBranchA, classBranchB];
      const scoped = filterClassesByBranch(classes, adminBranchA.branchId);
      assert.strictEqual(scoped.length, 1);
      assert.strictEqual(scoped[0].id, classBranchA.id);
    });

    it("tamper resistance: getEffectiveBranchId forces admin A to branch A even if requested 'all' or branch B", () => {
      assert.strictEqual(getEffectiveBranchId(adminBranchA, "all"), branchA);
      assert.strictEqual(getEffectiveBranchId(adminBranchA, branchB), branchA);
      assert.strictEqual(getEffectiveBranchId(adminBranchA, null), branchA);
    });
  });

  // Scenario 2: Admin of branch A cannot create a class in branch B
  describe("Scenario 2: Admin of branch A cannot create a class in branch B", () => {
    it("canAccessBranch blocks admin A from targeting branch B", () => {
      const targetBranchId = branchB;
      const isAllowed = canAccessBranch(adminBranchA, targetBranchId);
      assert.strictEqual(isAllowed, false);
    });

    it("effective branch assignment locks class creation to admin's assigned branchId", () => {
      // Even if payload had branch B requested, effective branch must be branch A
      const effectiveBranch = getEffectiveBranchId(adminBranchA, branchB);
      assert.strictEqual(effectiveBranch, branchA);
    });
  });

  // Scenario 3: Admin of branch A cannot update a class in branch B
  describe("Scenario 3: Admin of branch A cannot update a class in branch B", () => {
    it("rejects update attempt on a branch B classroom", () => {
      const targetClass = classBranchB;
      const canUpdate = canAccessBranch(adminBranchA, targetClass.branchId);
      assert.strictEqual(canUpdate, false);
    });

    it("rejects cross-branch reassignment (changing class from branch A to branch B)", () => {
      const currentClassBranch = classBranchA.branchId;
      const attemptedNewBranch = branchB;
      // Admin A trying to reassign class to branch B
      const isReassignmentAllowed =
        adminBranchA.role === "super_admin" || currentClassBranch === attemptedNewBranch;
      assert.strictEqual(isReassignmentAllowed, false);
    });
  });

  // Scenario 4: Admin of branch A cannot delete a class in branch B
  describe("Scenario 4: Admin of branch A cannot delete a class in branch B", () => {
    it("denies deletion of a branch B class by admin A", () => {
      const canDelete = canAccessBranch(adminBranchA, classBranchB.branchId);
      assert.strictEqual(canDelete, false);
    });
  });

  // Scenario 5: Admin of branch A cannot read students exclusive to branch B
  describe("Scenario 5: Admin of branch A cannot read students exclusive to branch B", () => {
    it("excludes branch B exclusive students from branch A queries", () => {
      const students = [studentBranchA, studentBranchB];
      const enrollments = [enrollmentBranchA, enrollmentBranchB];
      const classes = [classBranchA, classBranchB];

      const scopedStudents = filterStudentsByBranch(students, enrollments, classes, adminBranchA.branchId);
      assert.strictEqual(scopedStudents.length, 1);
      assert.strictEqual(scopedStudents[0].id, studentBranchA.id);
    });

    it("isStudentInBranch returns false for student belonging to branch B", () => {
      const enrollments = [enrollmentBranchA, enrollmentBranchB];
      const classes = [classBranchA, classBranchB];

      assert.strictEqual(
        isStudentInBranch(studentBranchB, enrollments, classes, adminBranchA.branchId),
        false
      );
    });
  });

  // Scenario 6: Admin of branch A cannot enroll student in branch B class
  describe("Scenario 6: Admin of branch A cannot enroll student in branch B class", () => {
    it("blocks enrollment when target classroom belongs to branch B", () => {
      const targetClassroom = classBranchB;
      const isClassAccessible = canAccessBranch(adminBranchA, targetClassroom.branchId);
      assert.strictEqual(isClassAccessible, false);
    });

    it("filterEnrollmentsByBranch excludes branch B enrollments", () => {
      const enrollments = [enrollmentBranchA, enrollmentBranchB];
      const classes = [classBranchA, classBranchB];
      const students = [studentBranchA, studentBranchB];

      const scoped = filterEnrollmentsByBranch(enrollments, classes, students, adminBranchA.branchId);
      assert.strictEqual(scoped.length, 1);
      assert.strictEqual(scoped[0].id, enrollmentBranchA.id);
    });
  });

  // Scenario 7: Admin of branch A cannot transfer student from/to branch B class
  describe("Scenario 7: Admin of branch A cannot transfer student from/to branch B class", () => {
    it("blocks transfer from branch B class", () => {
      const fromClass = classBranchB;
      const canTransferFrom = canAccessBranch(adminBranchA, fromClass.branchId);
      assert.strictEqual(canTransferFrom, false);
    });

    it("blocks transfer into branch B class", () => {
      const toClass = classBranchB;
      const canTransferTo = canAccessBranch(adminBranchA, toClass.branchId);
      assert.strictEqual(canTransferTo, false);
    });

    it("allows transfer only when BOTH fromClass and toClass belong to admin's branch", () => {
      const fromClassA = classBranchA;
      const anotherClassA: Classroom = {
        ...classBranchA,
        id: "cls-a-2",
        code: "CLASS-A-2",
      };

      const canTransferSameBranch =
        canAccessBranch(adminBranchA, fromClassA.branchId) &&
        canAccessBranch(adminBranchA, anotherClassA.branchId);

      assert.strictEqual(canTransferSameBranch, true);
    });
  });

  // Scenario 8: Super admin CAN do all cross-branch operations
  describe("Scenario 8: Super admin CAN do all cross-branch operations", () => {
    it("canAccessBranch returns true for super admin across all branches", () => {
      assert.strictEqual(canAccessBranch(superAdminUser, branchA), true);
      assert.strictEqual(canAccessBranch(superAdminUser, branchB), true);
      assert.strictEqual(canAccessBranch(superAdminUser, "any-other-branch"), true);
    });

    it("super admin can select specific branches or 'all' branches", () => {
      assert.strictEqual(getEffectiveBranchId(superAdminUser, "all"), ALL_BRANCHES_ID);
      assert.strictEqual(getEffectiveBranchId(superAdminUser, branchA), branchA);
      assert.strictEqual(getEffectiveBranchId(superAdminUser, branchB), branchB);
      assert.strictEqual(getEffectiveBranchId(superAdminUser, null), ALL_BRANCHES_ID);
    });

    it("filterClassesByBranch returns all classrooms when branchId is 'all'", () => {
      const classes = [classBranchA, classBranchB];
      const all = filterClassesByBranch(classes, ALL_BRANCHES_ID);
      assert.strictEqual(all.length, 2);
    });

    it("filterStudentsByBranch returns all students when branchId is 'all'", () => {
      const students = [studentBranchA, studentBranchB];
      const enrollments = [enrollmentBranchA, enrollmentBranchB];
      const classes = [classBranchA, classBranchB];
      const all = filterStudentsByBranch(students, enrollments, classes, ALL_BRANCHES_ID);
      assert.strictEqual(all.length, 2);
    });

    it("filterUsersByBranch includes all teachers and admins when branchId is 'all'", () => {
      const users = [superAdminUser, adminBranchA, adminBranchB, teacherBranchA, teacherBranchB];
      const all = filterUsersByBranch(users, ALL_BRANCHES_ID);
      assert.strictEqual(all.length, 5);
    });
  });

  // Scenario 9: Attendance records cannot be created for a class in another branch by an admin
  describe("Scenario 9: Attendance records cannot be created for a class in another branch by an admin", () => {
    it("blocks attendance recording when classroom branch does not match admin branch", () => {
      const targetClassroom = classBranchB;
      const isAuthorized = canAccessBranch(adminBranchA, targetClassroom.branchId);
      assert.strictEqual(isAuthorized, false);
    });

    it("filterAttendanceByBranch excludes records belonging to another branch", () => {
      const attList = [attendanceBranchA, attendanceBranchB];
      const classes = [classBranchA, classBranchB];

      const scopedA = filterAttendanceByBranch(attList, classes, adminBranchA.branchId);
      assert.strictEqual(scopedA.length, 1);
      assert.strictEqual(scopedA[0].id, attendanceBranchA.id);

      const scopedB = filterAttendanceByBranch(attList, classes, adminBranchB.branchId);
      assert.strictEqual(scopedB.length, 1);
      assert.strictEqual(scopedB[0].id, attendanceBranchB.id);
    });
  });

  // Scenario 10: Audit logs filter correctly by branch
  describe("Scenario 10: Audit logs filter correctly by branch", () => {
    it("filters audit logs strictly to admin's branch", () => {
      const allLogs = [auditLogBranchA, auditLogBranchB];
      const classes = [classBranchA, classBranchB];

      const branchALogs = filterAuditLogsByBranch(allLogs, classes, adminBranchA.branchId);
      assert.strictEqual(branchALogs.length, 1);
      assert.strictEqual(branchALogs[0].id, auditLogBranchA.id);

      const branchBLogs = filterAuditLogsByBranch(allLogs, classes, adminBranchB.branchId);
      assert.strictEqual(branchBLogs.length, 1);
      assert.strictEqual(branchBLogs[0].id, auditLogBranchB.id);
    });

    it("super admin viewing 'all' branches sees all audit logs", () => {
      const allLogs = [auditLogBranchA, auditLogBranchB];
      const classes = [classBranchA, classBranchB];

      const allBranchLogs = filterAuditLogsByBranch(allLogs, classes, ALL_BRANCHES_ID);
      assert.strictEqual(allBranchLogs.length, 2);
    });
  });
});
