import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Enrollment } from "../src/models/enrollment.model.ts";
import type { Student } from "../src/models/student.model.ts";
import type { Classroom } from "../src/models/classroom.model.ts";

describe("Enrollment Management Unit Tests", () => {
  const mockStudents: Student[] = [
    {
      id: "stu-1",
      studentCode: "STU-001",
      nameKh: "សាន វណ្ណា",
      nameEn: "San Vanna",
      gender: "male",
      phone: "012345678",
      branchId: "branch-central",
      status: "active",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "stu-2",
      studentCode: "STU-002",
      nameKh: "កែវ សុភា",
      nameEn: "Keo Sopheak",
      gender: "female",
      phone: "098765432",
      branchId: "branch-north",
      status: "active",
      createdAt: "2026-01-02T00:00:00.000Z",
    },
    {
      id: "stu-3",
      studentCode: "STU-003",
      nameKh: "ម៉ៅ ចិន្តា",
      nameEn: "Mao Chenda",
      gender: "female",
      phone: "077112233",
      branchId: "branch-central",
      status: "archived",
      createdAt: "2026-01-03T00:00:00.000Z",
    },
  ];

  const mockClassrooms: Classroom[] = [
    {
      id: "cls-morning",
      code: "ESD-WD-001",
      name: "Web Development Morning",
      branchId: "branch-central",
      packageId: "pkg-1",
      capacity: 20,
      scheduleDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      startTime: "08:00",
      endTime: "09:30",
      startDate: "2026-03-01",
      expectedEndDate: "2026-05-30",
      status: "active",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "cls-afternoon",
      code: "ESD-WD-002",
      name: "Web Development Afternoon",
      branchId: "branch-central",
      packageId: "pkg-1",
      capacity: 2, // limited capacity for test
      scheduleDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      startTime: "14:00",
      endTime: "15:30",
      startDate: "2026-03-01",
      expectedEndDate: "2026-05-30",
      status: "active",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "cls-north",
      code: "ESD-WD-003",
      name: "Web Development North",
      branchId: "branch-north",
      packageId: "pkg-1",
      capacity: 15,
      scheduleDays: ["saturday", "sunday"],
      startTime: "08:00",
      endTime: "11:00",
      startDate: "2026-03-01",
      expectedEndDate: "2026-05-30",
      status: "active",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ];

  const mockEnrollments: Enrollment[] = [
    {
      id: "enr-1",
      studentId: "stu-1",
      classroomId: "cls-morning",
      packageId: "pkg-1",
      startDate: "2026-03-01",
      expectedEndDate: "2026-05-30",
      status: "active",
      note: "Morning session",
      createdAt: "2026-03-01T08:00:00.000Z",
    },
    {
      id: "enr-2",
      studentId: "stu-2",
      classroomId: "cls-north",
      packageId: "pkg-1",
      startDate: "2026-03-01",
      expectedEndDate: "2026-05-30",
      status: "active",
      note: "Weekend student",
      createdAt: "2026-03-01T08:00:00.000Z",
    },
    {
      id: "enr-3",
      studentId: "stu-3",
      classroomId: "cls-morning",
      packageId: "pkg-1",
      startDate: "2026-01-01",
      expectedEndDate: "2026-03-01",
      actualEndDate: "2026-03-01",
      status: "completed",
      note: "Graduated",
      createdAt: "2026-01-01T08:00:00.000Z",
    },
  ];

  it("filters enrollments accurately by branch scoping", () => {
    const classroomsMap = new Map(mockClassrooms.map((c) => [c.id, c]));
    const studentsMap = new Map(mockStudents.map((s) => [s.id, s]));

    const filterByBranch = (branchId: string) => {
      return mockEnrollments.filter((e) => {
        const cls = classroomsMap.get(e.classroomId);
        if (cls?.branchId) return cls.branchId === branchId;
        const stu = studentsMap.get(e.studentId);
        return stu?.branchId === branchId;
      });
    };

    const centralEnrollments = filterByBranch("branch-central");
    assert.strictEqual(centralEnrollments.length, 2);
    assert.ok(centralEnrollments.some((e) => e.id === "enr-1"));
    assert.ok(centralEnrollments.some((e) => e.id === "enr-3"));

    const northEnrollments = filterByBranch("branch-north");
    assert.strictEqual(northEnrollments.length, 1);
    assert.strictEqual(northEnrollments[0].id, "enr-2");
  });

  it("filters enrollments by status correctly", () => {
    const active = mockEnrollments.filter((e) => e.status === "active");
    assert.strictEqual(active.length, 2);

    const completed = mockEnrollments.filter((e) => e.status === "completed");
    assert.strictEqual(completed.length, 1);
    assert.strictEqual(completed[0].id, "enr-3");

    const paused = mockEnrollments.filter((e) => e.status === "paused");
    assert.strictEqual(paused.length, 0);
  });

  it("searches enrollments by student name, code, class code, and note", () => {
    const classroomsMap = new Map(mockClassrooms.map((c) => [c.id, c]));
    const studentsMap = new Map(mockStudents.map((s) => [s.id, s]));

    const search = (query: string) => {
      const q = query.toLowerCase().trim();
      return mockEnrollments.filter((enr) => {
        const student = studentsMap.get(enr.studentId);
        const classroom = classroomsMap.get(enr.classroomId);

        return (
          (student?.studentCode || "").toLowerCase().includes(q) ||
          (student?.nameKh || "").toLowerCase().includes(q) ||
          (student?.nameEn || "").toLowerCase().includes(q) ||
          (classroom?.name || "").toLowerCase().includes(q) ||
          (classroom?.code || "").toLowerCase().includes(q) ||
          (enr.note || "").toLowerCase().includes(q)
        );
      });
    };

    assert.strictEqual(search("STU-001").length, 1);
    assert.strictEqual(search("Sopheak").length, 1);
    assert.strictEqual(search("វណ្ណា").length, 1);
    assert.strictEqual(search("North").length, 1);
    assert.strictEqual(search("Graduated").length, 1);
    assert.strictEqual(search("nonexistent").length, 0);
  });

  it("enforces class capacity rules during wrong class correction", () => {
    const targetClass = mockClassrooms.find((c) => c.id === "cls-afternoon")!;
    assert.strictEqual(targetClass.capacity, 2);

    // If afternoon class already has 2 active enrollments
    const simulatedActiveInTarget = [
      { id: "enr-10", classroomId: "cls-afternoon", status: "active" },
      { id: "enr-11", classroomId: "cls-afternoon", status: "active" },
    ];

    const canChangeToClass = (classCapacity: number, activeCount: number) => {
      return activeCount < classCapacity;
    };

    assert.strictEqual(
      canChangeToClass(targetClass.capacity, simulatedActiveInTarget.length),
      false
    );

    // If afternoon class only has 1 active enrollment
    assert.strictEqual(canChangeToClass(targetClass.capacity, 1), true);
  });
});
