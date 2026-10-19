import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  filterClassesByBranch,
  filterStudentsByBranch,
  filterUsersByBranch,
  ALL_BRANCHES_ID,
} from "../src/lib/branch-scoping.ts";
import type { Classroom } from "../src/models/classroom.model.ts";
import type { Student } from "../src/models/student.model.ts";
import type { Enrollment } from "../src/models/enrollment.model.ts";
import type { User } from "../src/models/user.model.ts";

describe("Branch Scoping Logic Unit Tests", () => {
  const mockClassrooms: Classroom[] = [
    {
      id: "cls-1",
      code: "ESD-WD-001",
      name: "Class A (Main)",
      packageId: "pkg-1",
      branchId: "branch-001",
      capacity: 25,
      status: "active",
      scheduleDays: [1, 2, 3, 4, 5],
      startTime: "07:00",
      endTime: "08:00",
      sessionMinutes: 60,
      hoursPerWeek: 5,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "cls-2",
      code: "ESD-WD-002",
      name: "Class B (Main)",
      packageId: "pkg-1",
      branchId: "branch-001",
      capacity: 20,
      status: "active",
      scheduleDays: [1, 2, 3, 4, 5],
      startTime: "17:30",
      endTime: "18:30",
      sessionMinutes: 60,
      hoursPerWeek: 5,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "cls-3",
      code: "ESD-WE-001",
      name: "Class C (Battambang)",
      packageId: "pkg-1",
      branchId: "branch-002",
      capacity: 30,
      status: "active",
      scheduleDays: [6, 7],
      startTime: "08:00",
      endTime: "10:00",
      sessionMinutes: 120,
      hoursPerWeek: 4,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ];

  const mockStudents: Student[] = [
    {
      id: "std-1",
      studentCode: "ST-001",
      nameKh: "សិស្ស ១",
      nameEn: "Student One",
      gender: "M",
      dateOfBirth: "2010-01-01",
      status: "active",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "std-2",
      studentCode: "ST-002",
      nameKh: "សិស្ស ២",
      nameEn: "Student Two",
      gender: "F",
      dateOfBirth: "2010-02-02",
      status: "active",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "std-3",
      studentCode: "ST-003",
      nameKh: "សិស្ស ៣",
      nameEn: "Student Three",
      gender: "M",
      dateOfBirth: "2010-03-03",
      status: "active",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ];

  const mockEnrollments: Enrollment[] = [
    // std-1 enrolled in cls-1 (branch-001)
    {
      id: "enr-1",
      studentId: "std-1",
      classroomId: "cls-1",
      packageId: "pkg-1",
      startDate: "2026-02-01",
      status: "active",
      createdAt: "2026-02-01T00:00:00.000Z",
      updatedAt: "2026-02-01T00:00:00.000Z",
    },
    // std-2 enrolled in cls-2 (branch-001)
    {
      id: "enr-2",
      studentId: "std-2",
      classroomId: "cls-2",
      packageId: "pkg-1",
      startDate: "2026-02-01",
      status: "active",
      createdAt: "2026-02-01T00:00:00.000Z",
      updatedAt: "2026-02-01T00:00:00.000Z",
    },
    // std-3 enrolled in cls-3 (branch-002)
    {
      id: "enr-3",
      studentId: "std-3",
      classroomId: "cls-3",
      packageId: "pkg-1",
      startDate: "2026-02-01",
      status: "active",
      createdAt: "2026-02-01T00:00:00.000Z",
      updatedAt: "2026-02-01T00:00:00.000Z",
    },
  ];

  const mockUsers: User[] = [
    {
      id: "usr-super",
      name: "Super Administrator",
      username: "superadmin",
      role: "super_admin",
      status: "active",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "usr-admin-1",
      name: "School Admin (Branch 1)",
      username: "admin_main",
      role: "admin",
      branchId: "branch-001",
      status: "active",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "usr-teacher-1",
      name: "Teacher Sok (Branch 1)",
      username: "sok_main",
      role: "teacher",
      branchId: "branch-001",
      status: "active",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "usr-teacher-2",
      name: "Teacher Sok (Branch 2)", // Same teacher name, different account & branch
      username: "sok_btb",
      role: "teacher",
      branchId: "branch-002",
      status: "active",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ];

  describe("Rule 1: Super Admin 'All Branches' option", () => {
    it("returns all classrooms when branchId is 'all' or empty", () => {
      const all1 = filterClassesByBranch(mockClassrooms, "all");
      assert.strictEqual(all1.length, 3);

      const all2 = filterClassesByBranch(mockClassrooms, undefined);
      assert.strictEqual(all2.length, 3);

      const all3 = filterClassesByBranch(mockClassrooms, ALL_BRANCHES_ID);
      assert.strictEqual(all3.length, 3);
    });

    it("returns all students when branchId is 'all'", () => {
      const students = filterStudentsByBranch(mockStudents, mockEnrollments, mockClassrooms, ALL_BRANCHES_ID);
      assert.strictEqual(students.length, 3);
    });

    it("returns all users/teachers when branchId is 'all'", () => {
      const users = filterUsersByBranch(mockUsers, ALL_BRANCHES_ID);
      assert.strictEqual(users.length, 4);
    });
  });

  describe("Rule 2: Teacher and Admin accessible only by their branch", () => {
    it("scopes teachers and admins strictly to their branchId", () => {
      const branch1Users = filterUsersByBranch(mockUsers, "branch-001");
      // Super admin is always included + admin 1 + teacher 1
      assert.ok(branch1Users.some((u) => u.id === "usr-super"));
      assert.ok(branch1Users.some((u) => u.id === "usr-admin-1"));
      assert.ok(branch1Users.some((u) => u.id === "usr-teacher-1"));
      assert.ok(!branch1Users.some((u) => u.id === "usr-teacher-2"));

      const branch2Users = filterUsersByBranch(mockUsers, "branch-002");
      assert.ok(branch2Users.some((u) => u.id === "usr-super"));
      assert.ok(!branch2Users.some((u) => u.id === "usr-admin-1"));
      assert.ok(!branch2Users.some((u) => u.id === "usr-teacher-1"));
      assert.ok(branch2Users.some((u) => u.id === "usr-teacher-2"));
    });
  });

  describe("Rule 3: Students follow whichever class they are enrolled in or their stored branchId", () => {
    it("filters students enrolled in branch-001 classes", () => {
      const branch1Students = filterStudentsByBranch(mockStudents, mockEnrollments, mockClassrooms, "branch-001");
      const ids = branch1Students.map((s) => s.id);
      assert.deepStrictEqual(ids.sort(), ["std-1", "std-2"].sort());
      assert.ok(!ids.includes("std-3"));
    });

    it("filters students enrolled in branch-002 classes", () => {
      const branch2Students = filterStudentsByBranch(mockStudents, mockEnrollments, mockClassrooms, "branch-002");
      const ids = branch2Students.map((s) => s.id);
      assert.deepStrictEqual(ids, ["std-3"]);
    });

    it("includes newly created unenrolled students if their stored branchId matches", () => {
      const unenrolledStudent: Student = {
        id: "std-new",
        studentCode: "ST-NEW",
        nameKh: "សិស្ស ថ្មី",
        gender: "male",
        branchId: "branch-001",
        status: "active",
        createdAt: "2026-10-18T00:00:00.000Z",
      };

      const result = filterStudentsByBranch(
        [...mockStudents, unenrolledStudent],
        mockEnrollments,
        mockClassrooms,
        "branch-001"
      );
      assert.ok(result.some((s) => s.id === "std-new"));
    });

    it("returns empty list if branch has no classes with enrolled students and no students with that branchId", () => {
      const branch3Students = filterStudentsByBranch(mockStudents, mockEnrollments, mockClassrooms, "branch-999");
      assert.strictEqual(branch3Students.length, 0);
    });
  });

  describe("Classroom Branch Scoping", () => {
    it("filters classrooms belonging strictly to branch-001", () => {
      const b1Classes = filterClassesByBranch(mockClassrooms, "branch-001");
      assert.strictEqual(b1Classes.length, 2);
      assert.ok(b1Classes.every((c) => c.branchId === "branch-001"));
    });

    it("filters classrooms belonging strictly to branch-002", () => {
      const b2Classes = filterClassesByBranch(mockClassrooms, "branch-002");
      assert.strictEqual(b2Classes.length, 1);
      assert.strictEqual(b2Classes[0].id, "cls-3");
    });
  });

  describe("Attendance Records & Daily Summary Branch Scoping", () => {
    const mockAttendance = [
      { id: "att-1", classroomId: "cls-1", studentId: "std-1", status: "present", date: "2026-10-18" },
      { id: "att-2", classroomId: "cls-2", studentId: "std-2", status: "absent", date: "2026-10-18" },
      { id: "att-3", classroomId: "cls-3", studentId: "std-3", status: "present", date: "2026-10-18" },
    ];

    it("scopes attendance records by classroom branchId (branch-001 vs branch-002)", () => {
      const classMap = new Map(mockClassrooms.map((c) => [c.id, c]));

      const filterAtt = (bId: string) => {
        return mockAttendance.filter((att) => {
          const cls = classMap.get(att.classroomId);
          return cls?.branchId === bId;
        });
      };

      const b1Att = filterAtt("branch-001");
      assert.strictEqual(b1Att.length, 2);
      assert.ok(b1Att.some((a) => a.id === "att-1"));
      assert.ok(b1Att.some((a) => a.id === "att-2"));

      const b2Att = filterAtt("branch-002");
      assert.strictEqual(b2Att.length, 1);
      assert.strictEqual(b2Att[0].id, "att-3");
    });

    it("scopes daily summary scheduled classrooms by branch", () => {
      const b1Scheduled = mockClassrooms.filter((c) => c.branchId === "branch-001");
      const b2Scheduled = mockClassrooms.filter((c) => c.branchId === "branch-002");

      assert.strictEqual(b1Scheduled.length, 2);
      assert.strictEqual(b2Scheduled.length, 1);
    });
  });
});
