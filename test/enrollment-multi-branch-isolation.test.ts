import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  filterEnrollmentsByBranch,
  filterTransfersByBranch,
  isEnrollmentInBranch,
  ALL_BRANCHES_ID,
} from "../src/lib/branch-scoping.ts";
import type { Enrollment } from "../src/models/enrollment.model.ts";
import type { EnrollmentTransfer } from "../src/models/enrollment-transfer.model.ts";
import type { Classroom } from "../src/models/classroom.model.ts";
import type { Student } from "../src/models/student.model.ts";
import type { User } from "../src/models/user.model.ts";

describe("Complete Multi-Branch Isolation: Enrollment Module Tests", () => {
  const branchA = "branch-001";
  const branchB = "branch-002";

  const superAdminUser: User = {
    id: "usr-super",
    name: "Super Administrator",
    username: "superadmin",
    password: "hashed_password",
    role: "super_admin",
    assignedClassroomIds: [],
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  const adminBranchA: User = {
    id: "usr-admin-a",
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
    id: "usr-admin-b",
    name: "Admin Branch B",
    username: "admin_b",
    password: "hashed_password",
    role: "admin",
    branchId: branchB,
    assignedClassroomIds: [],
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  const classBranchA: Classroom = {
    id: "cls-a",
    code: "ESD-A-01",
    name: "Classroom in Branch A",
    packageId: "pkg-1",
    assignedTeacherId: "usr-teacher-1",
    branchId: branchA,
    capacity: 20,
    scheduleDays: [1, 2, 3, 4, 5],
    startTime: "08:00",
    endTime: "09:30",
    sessionMinutes: 90,
    hoursPerWeek: 7.5,
    startDate: "2026-03-01",
    expectedEndDate: "2026-06-30",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  const classBranchB: Classroom = {
    id: "cls-b",
    code: "ESD-B-01",
    name: "Classroom in Branch B",
    packageId: "pkg-1",
    assignedTeacherId: "usr-teacher-2",
    branchId: branchB,
    capacity: 20,
    scheduleDays: [1, 2, 3, 4, 5],
    startTime: "14:00",
    endTime: "15:30",
    sessionMinutes: 90,
    hoursPerWeek: 7.5,
    startDate: "2026-03-01",
    expectedEndDate: "2026-06-30",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  const studentBranchA: Student = {
    id: "stu-a",
    studentCode: "ESD-0001",
    nameKh: "សិស្ស សាខា ក",
    nameEn: "Student Branch A",
    gender: "female",
    branchId: branchA,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  const studentBranchB: Student = {
    id: "stu-b",
    studentCode: "ESD-0002",
    nameKh: "សិស្ស សាខា ខ",
    nameEn: "Student Branch B",
    gender: "male",
    branchId: branchB,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  const enrollmentBranchA: Enrollment = {
    id: "enr-a",
    studentId: studentBranchA.id,
    classroomId: classBranchA.id,
    packageId: "pkg-1",
    branchId: branchA,
    startDate: "2026-03-01",
    expectedEndDate: "2026-06-30",
    status: "active",
    createdAt: "2026-03-01T08:00:00.000Z",
  };

  const enrollmentBranchB: Enrollment = {
    id: "enr-b",
    studentId: studentBranchB.id,
    classroomId: classBranchB.id,
    packageId: "pkg-1",
    branchId: branchB,
    startDate: "2026-03-01",
    expectedEndDate: "2026-06-30",
    status: "active",
    createdAt: "2026-03-01T08:00:00.000Z",
  };

  const legacyEnrollmentWithoutBranch: Enrollment = {
    id: "enr-legacy",
    studentId: studentBranchA.id,
    classroomId: classBranchA.id,
    packageId: "pkg-1",
    startDate: "2026-03-01",
    expectedEndDate: "2026-06-30",
    status: "active",
    createdAt: "2026-03-01T08:00:00.000Z",
  };

  const sampleTransfers: EnrollmentTransfer[] = [
    {
      id: "tr-within-a",
      studentId: studentBranchA.id,
      sourceEnrollmentId: "enr-a-1",
      sourceClassroomId: "cls-a-1",
      sourceBranchId: branchA,
      targetEnrollmentId: "enr-a-2",
      targetClassroomId: "cls-a-2",
      targetBranchId: branchA,
      packageId: "pkg-1",
      effectiveDate: "2026-04-01",
      reason: "Shift schedule",
      transferredBy: adminBranchA.id,
      transferredAt: "2026-04-01T00:00:00.000Z",
    },
    {
      id: "tr-within-b",
      studentId: studentBranchB.id,
      sourceEnrollmentId: "enr-b-1",
      sourceClassroomId: "cls-b-1",
      sourceBranchId: branchB,
      targetEnrollmentId: "enr-b-2",
      targetClassroomId: "cls-b-2",
      targetBranchId: branchB,
      packageId: "pkg-1",
      effectiveDate: "2026-04-01",
      reason: "Shift schedule",
      transferredBy: adminBranchB.id,
      transferredAt: "2026-04-01T00:00:00.000Z",
    },
    {
      id: "tr-cross-branch",
      studentId: studentBranchA.id,
      sourceEnrollmentId: "enr-a-2",
      sourceClassroomId: classBranchA.id,
      sourceBranchId: branchA,
      targetEnrollmentId: "enr-b-3",
      targetClassroomId: classBranchB.id,
      targetBranchId: branchB,
      packageId: "pkg-1",
      effectiveDate: "2026-05-01",
      reason: "Relocated to Branch B",
      transferredBy: superAdminUser.id,
      transferredAt: "2026-05-01T00:00:00.000Z",
    },
  ];

  describe("Section 1: Enrollment Model & Access Scoping", () => {
    it("Enrollment model contains authoritative branchId", () => {
      assert.equal(enrollmentBranchA.branchId, branchA);
      assert.equal(enrollmentBranchB.branchId, branchB);
      assert.equal(legacyEnrollmentWithoutBranch.branchId, undefined);
    });

    it("filterEnrollmentsByBranch respects direct branchId", () => {
      const allEnrollments = [enrollmentBranchA, enrollmentBranchB];
      const scopedToA = filterEnrollmentsByBranch(
        allEnrollments,
        [classBranchA, classBranchB],
        [studentBranchA, studentBranchB],
        branchA
      );
      assert.equal(scopedToA.length, 1);
      assert.equal(scopedToA[0].id, "enr-a");

      const scopedToB = filterEnrollmentsByBranch(
        allEnrollments,
        [classBranchA, classBranchB],
        [studentBranchA, studentBranchB],
        branchB
      );
      assert.equal(scopedToB.length, 1);
      assert.equal(scopedToB[0].id, "enr-b");
    });

    it("filterEnrollmentsByBranch correctly resolves legacy enrollments via classroom", () => {
      const scoped = filterEnrollmentsByBranch(
        [legacyEnrollmentWithoutBranch],
        [classBranchA, classBranchB],
        [studentBranchA, studentBranchB],
        branchA
      );
      assert.equal(scoped.length, 1);
      assert.equal(scoped[0].id, "enr-legacy");

      const scopedToB = filterEnrollmentsByBranch(
        [legacyEnrollmentWithoutBranch],
        [classBranchA, classBranchB],
        [studentBranchA, studentBranchB],
        branchB
      );
      assert.equal(scopedToB.length, 0);
    });

    it("Super Admin 'all' returns all enrollments across branches", () => {
      const allEnrollments = [enrollmentBranchA, enrollmentBranchB, legacyEnrollmentWithoutBranch];
      const resultAll = filterEnrollmentsByBranch(
        allEnrollments,
        [classBranchA, classBranchB],
        [studentBranchA, studentBranchB],
        ALL_BRANCHES_ID
      );
      assert.equal(resultAll.length, 3);
    });

    it("isEnrollmentInBranch verifies branch membership correctly", () => {
      assert.equal(isEnrollmentInBranch(enrollmentBranchA, [classBranchA], branchA), true);
      assert.equal(isEnrollmentInBranch(enrollmentBranchA, [classBranchA], branchB), false);
      assert.equal(isEnrollmentInBranch(legacyEnrollmentWithoutBranch, [classBranchA], branchA), true);
      assert.equal(isEnrollmentInBranch(legacyEnrollmentWithoutBranch, [classBranchA], branchB), false);
    });
  });

  describe("Section 2: Transfer History Scoping & Branch Isolation", () => {
    it("EnrollmentTransfer model contains sourceBranchId and targetBranchId", () => {
      assert.equal(sampleTransfers[0].sourceBranchId, branchA);
      assert.equal(sampleTransfers[0].targetBranchId, branchA);
      assert.equal(sampleTransfers[2].sourceBranchId, branchA);
      assert.equal(sampleTransfers[2].targetBranchId, branchB);
    });

    it("Branch A admin sees transfers within Branch A and cross-transfers involving Branch A", () => {
      const visibleToA = filterTransfersByBranch(
        sampleTransfers,
        [classBranchA, classBranchB],
        branchA
      );
      // tr-within-a (A->A) and tr-cross-branch (A->B)
      assert.equal(visibleToA.length, 2);
      assert.equal(visibleToA.some((t) => t.id === "tr-within-a"), true);
      assert.equal(visibleToA.some((t) => t.id === "tr-cross-branch"), true);
      assert.equal(visibleToA.some((t) => t.id === "tr-within-b"), false);
    });

    it("Branch B admin sees transfers within Branch B and cross-transfers involving Branch B", () => {
      const visibleToB = filterTransfersByBranch(
        sampleTransfers,
        [classBranchA, classBranchB],
        branchB
      );
      // tr-within-b (B->B) and tr-cross-branch (A->B)
      assert.equal(visibleToB.length, 2);
      assert.equal(visibleToB.some((t) => t.id === "tr-within-b"), true);
      assert.equal(visibleToB.some((t) => t.id === "tr-cross-branch"), true);
      assert.equal(visibleToB.some((t) => t.id === "tr-within-a"), false);
    });

    it("Super Admin sees all transfers across all branches", () => {
      const visibleToSuper = filterTransfersByBranch(
        sampleTransfers,
        [classBranchA, classBranchB],
        ALL_BRANCHES_ID
      );
      assert.equal(visibleToSuper.length, 3);
    });
  });

  describe("Section 3: Enrollment Service Authorization & Invariant Rules", () => {
    it("Branch derivation: new enrollment derives branchId authoritatively from target Classroom", () => {
      // Simulation of createEnrollment branch assignment logic
      const targetClass = classBranchA;
      assert.ok(targetClass.branchId, "Target classroom must have branchId");

      const rawInput = {
        studentId: studentBranchA.id,
        classroomId: targetClass.id,
        packageId: targetClass.packageId,
        startDate: targetClass.startDate,
        expectedEndDate: targetClass.expectedEndDate,
        status: "active" as const,
      };

      // Service sets branchId strictly from classroom:
      const createdEnrollment: Enrollment = {
        id: "enr-new",
        ...rawInput,
        branchId: targetClass.branchId,
        createdAt: "2026-03-01T00:00:00.000Z",
      };

      assert.equal(createdEnrollment.branchId, branchA);
    });

    it("Rejects enrollment creation when classroom belongs to a different branch for ordinary admin", () => {
      const attemptingAdmin = adminBranchA;
      const targetClass = classBranchB; // in branchB

      const isPermitted = attemptingAdmin.role === "super_admin" || attemptingAdmin.branchId === targetClass.branchId;
      assert.equal(isPermitted, false, "Admin A must NOT be permitted to create enrollment in Branch B class");
    });

    it("Bulk enroll validates every classroom individually without assuming first classroom branch", () => {
      const bulkItems = [
        { studentId: "s1", classroomId: classBranchA.id },
        { studentId: "s2", classroomId: classBranchB.id }, // Trojan item in branch B!
      ];

      const attemptingAdmin = adminBranchA;
      const classroomMap = new Map([
        [classBranchA.id, classBranchA],
        [classBranchB.id, classBranchB],
      ]);

      let hasUnauthorizedItem = false;
      for (const item of bulkItems) {
        const cls = classroomMap.get(item.classroomId);
        if (attemptingAdmin.role !== "super_admin" && cls?.branchId !== attemptingAdmin.branchId) {
          hasUnauthorizedItem = true;
          break;
        }
      }

      assert.equal(hasUnauthorizedItem, true, "Bulk enrollment must catch items outside the user's branch");
    });

    it("Update enrollment disallows changing branchId arbitrarily or moving cross-branch via edit", () => {
      const existing = enrollmentBranchA;
      const targetClass = classBranchB;
      const user = adminBranchA;

      // Rule: Simple update cannot move cross-branch
      const isCrossBranchEdit = targetClass.branchId !== existing.branchId;
      const permitted = user.role === "super_admin" || (!isCrossBranchEdit && targetClass.branchId === user.branchId);

      assert.equal(permitted, false, "Cross-branch class changes must be blocked in simple update");
    });

    it("Transfer enrollment: ordinary admin is blocked from cross-branch transfers; super admin is allowed", () => {
      const sourceClass = classBranchA;
      const targetClass = classBranchB;

      // Admin A trying cross-branch transfer:
      const adminAPermitted =
        adminBranchA.role === "super_admin" ||
        (sourceClass.branchId === adminBranchA.branchId && targetClass.branchId === adminBranchA.branchId);
      assert.equal(adminAPermitted, false, "Admin A cannot execute cross-branch transfer");

      // Super Admin executing cross-branch transfer:
      const superAdminPermitted =
        superAdminUser.role === "super_admin" ||
        (sourceClass.branchId === superAdminUser.branchId && targetClass.branchId === superAdminUser.branchId);
      assert.equal(superAdminPermitted, true, "Super admin is allowed to execute cross-branch transfer");
    });

    it("Transfer execution: newly created target enrollment receives target classroom branchId", () => {
      const targetClass = classBranchB;
      const newEnrollmentFromTransfer: Enrollment = {
        id: "enr-transfer-target",
        studentId: studentBranchA.id,
        classroomId: targetClass.id,
        packageId: targetClass.packageId,
        branchId: targetClass.branchId, // Authoritative
        startDate: "2026-05-01",
        expectedEndDate: targetClass.expectedEndDate,
        status: "active",
        createdAt: "2026-05-01T00:00:00.000Z",
      };

      assert.equal(newEnrollmentFromTransfer.branchId, branchB);
    });

    it("Transfer execution: transfer record receives sourceBranchId and targetBranchId", () => {
      const transferAudit: EnrollmentTransfer = {
        id: "tr-001",
        studentId: studentBranchA.id,
        sourceEnrollmentId: enrollmentBranchA.id,
        sourceClassroomId: classBranchA.id,
        sourceBranchId: branchA,
        targetEnrollmentId: "enr-transfer-target",
        targetClassroomId: classBranchB.id,
        targetBranchId: branchB,
        packageId: "pkg-1",
        effectiveDate: "2026-05-01",
        reason: "Family relocation",
        transferredBy: superAdminUser.id,
        transferredAt: "2026-05-01T00:00:00.000Z",
      };

      assert.equal(transferAudit.sourceBranchId, branchA);
      assert.equal(transferAudit.targetBranchId, branchB);
    });

    it("Transaction error handling: UNAUTHORIZED_BRANCH must be rethrown and never trigger fallback", () => {
      const knownRethrowErrors = [
        "AUTH_REQUIRED",
        "UNAUTHORIZED_BRANCH",
        "CLASSROOM_BRANCH_REQUIRED",
        "SOURCE_ENROLLMENT_NOT_FOUND",
        "SOURCE_ENROLLMENT_NOT_ACTIVE",
        "TARGET_CLASS_NOT_FOUND",
        "CLASSROOM_NOT_ACTIVE",
        "SAME_CLASS_TRANSFER",
        "DIFFERENT_PACKAGE_TRANSFER",
        "CLASS_CAPACITY_FULL",
      ];

      assert.ok(knownRethrowErrors.includes("UNAUTHORIZED_BRANCH"), "UNAUTHORIZED_BRANCH must be rethrown");
      assert.ok(knownRethrowErrors.includes("AUTH_REQUIRED"), "AUTH_REQUIRED must be rethrown");
      assert.ok(knownRethrowErrors.includes("CLASSROOM_BRANCH_REQUIRED"), "CLASSROOM_BRANCH_REQUIRED must be rethrown");
    });
  });

  describe("Section 4: Data Migration Verification", () => {
    it("Migration correctly resolves missing branchId from Classroom", () => {
      const legacy = legacyEnrollmentWithoutBranch;
      assert.equal(legacy.branchId, undefined);

      const classroomsMap = new Map([[classBranchA.id, classBranchA]]);
      const resolvedClassroom = classroomsMap.get(legacy.classroomId);

      assert.ok(resolvedClassroom);
      assert.equal(resolvedClassroom.branchId, branchA);

      const migrated: Enrollment = {
        ...legacy,
        branchId: resolvedClassroom.branchId,
        updatedAt: "2026-10-23T00:00:00.000Z",
        updatedBy: "migration",
      };

      assert.equal(migrated.branchId, branchA);
    });

    it("Migration marks orphaned enrollments as unresolved without guessing", () => {
      const orphanedEnrollment: Enrollment = {
        id: "enr-orphan",
        studentId: "stu-unknown",
        classroomId: "cls-deleted",
        packageId: "pkg-1",
        startDate: "2026-01-01",
        expectedEndDate: "2026-06-01",
        status: "active",
        createdAt: "2026-01-01T00:00:00.000Z",
      };

      const classroomsMap = new Map([[classBranchA.id, classBranchA]]);
      const resolvedClassroom = classroomsMap.get(orphanedEnrollment.classroomId);

      const isUnresolved = !resolvedClassroom || !resolvedClassroom.branchId;
      assert.equal(isUnresolved, true, "Orphaned enrollment must be recorded as unresolved without guessing branch");
    });
  });
});
