import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getStudentClassEligibility,
  canEnrollInClassroom,
  canEnrollCountInClassroom,
  filterStudentsForEnrollment,
} from "../src/lib/class-student-enrollment.ts";
import type { Student } from "../src/models/student.model.ts";
import type { Classroom } from "../src/models/classroom.model.ts";
import type { Enrollment } from "../src/models/enrollment.model.ts";

describe("Add Student To Class Eligibility Unit Tests", () => {
  const mockClassrooms: Record<string, Classroom> = {
    "cls-1": {
      id: "cls-1",
      code: "ESD-WD-001",
      name: "Web Development Morning",
      packageId: "pkg-1",
      assignedTeacherId: "usr-1",
      scheduleDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      startTime: "08:00",
      endTime: "09:30",
      sessionMinutes: 90,
      hoursPerWeek: 7.5,
      startDate: "2026-03-01",
      expectedEndDate: "2026-05-15",
      capacity: 20,
      status: "active",
      createdAt: "2026-02-15T00:00:00.000Z",
    },
    "cls-2": {
      id: "cls-2",
      code: "ESD-WD-002",
      name: "Basic Computer Afternoon",
      packageId: "pkg-2",
      assignedTeacherId: "usr-2",
      scheduleDays: ["saturday", "sunday"],
      startTime: "13:00",
      endTime: "15:00",
      sessionMinutes: 120,
      hoursPerWeek: 4,
      startDate: "2026-03-01",
      expectedEndDate: "2026-06-01",
      capacity: 10,
      status: "active",
      createdAt: "2026-02-15T00:00:00.000Z",
    },
  };

  const mockStudents: Student[] = [
    {
      id: "std-1",
      studentCode: "STU-001",
      nameKh: "សុខ សាន",
      nameEn: "Sok San",
      gender: "male",
      phone: "012345678",
      status: "active",
      createdAt: "2026-02-01T00:00:00.000Z",
    },
    {
      id: "std-2",
      studentCode: "STU-002",
      nameKh: "ចាន់ ធីតា",
      nameEn: "Chan Thida",
      gender: "female",
      phone: "096778899",
      status: "active",
      createdAt: "2026-02-01T00:00:00.000Z",
    },
    {
      id: "std-3",
      studentCode: "STU-003",
      nameKh: "កែវ វិបុល",
      nameEn: "Keo Vibul",
      gender: "male",
      status: "active",
      createdAt: "2026-02-01T00:00:00.000Z",
    },
  ];

  const mockActiveEnrollments: Enrollment[] = [
    // std-1 is in cls-1
    {
      id: "enr-1",
      studentId: "std-1",
      classroomId: "cls-1",
      packageId: "pkg-1",
      startDate: "2026-03-01",
      expectedEndDate: "2026-05-15",
      status: "active",
      createdAt: "2026-03-01T00:00:00.000Z",
    },
    // std-2 is in cls-2
    {
      id: "enr-2",
      studentId: "std-2",
      classroomId: "cls-2",
      packageId: "pkg-2",
      startDate: "2026-03-01",
      expectedEndDate: "2026-06-01",
      status: "active",
      createdAt: "2026-03-01T00:00:00.000Z",
    },
  ];

  it("identifies an un-enrolled student as available", () => {
    const res = getStudentClassEligibility("std-3", "cls-1", mockActiveEnrollments, mockClassrooms);
    assert.strictEqual(res.status, "available");
    assert.strictEqual(res.isSelectable, true);
  });

  it("identifies a student already in the target class as in_this_class and non-selectable", () => {
    const res = getStudentClassEligibility("std-1", "cls-1", mockActiveEnrollments, mockClassrooms);
    assert.strictEqual(res.status, "in_this_class");
    assert.strictEqual(res.isSelectable, false);
  });

  it("identifies a student active in another class as in_other_class with class details", () => {
    const res = getStudentClassEligibility("std-2", "cls-1", mockActiveEnrollments, mockClassrooms);
    assert.strictEqual(res.status, "in_other_class");
    assert.strictEqual(res.isSelectable, false);
    if (res.status === "in_other_class") {
      assert.strictEqual(res.otherClassroomId, "cls-2");
      assert.strictEqual(res.otherClassroomName, "Basic Computer Afternoon");
    }
  });

  it("evaluates classroom enrollment capacity correctly", () => {
    // 1. Open capacity
    const openRes = canEnrollInClassroom(mockClassrooms["cls-1"], 15);
    assert.strictEqual(openRes.canEnroll, true);

    // 2. Full capacity
    const fullRes = canEnrollInClassroom(mockClassrooms["cls-1"], 20);
    assert.strictEqual(fullRes.canEnroll, false);
    assert.strictEqual(fullRes.reason, "CLASS_FULL");

    // 3. Inactive classroom
    const inactiveCls: Classroom = { ...mockClassrooms["cls-1"], status: "completed" };
    const inactiveRes = canEnrollInClassroom(inactiveCls, 5);
    assert.strictEqual(inactiveRes.canEnroll, false);
    assert.strictEqual(inactiveRes.reason, "CLASS_NOT_ACTIVE");

    // 4. Multi-student bulk capacity checks
    // Remaining spots: 20 - 15 = 5
    const bulkFit = canEnrollCountInClassroom(mockClassrooms["cls-1"], 15, 5);
    assert.strictEqual(bulkFit.canEnroll, true);
    assert.strictEqual(bulkFit.remainingSpots, 5);

    const bulkExceed = canEnrollCountInClassroom(mockClassrooms["cls-1"], 15, 6);
    assert.strictEqual(bulkExceed.canEnroll, false);
    assert.strictEqual(bulkExceed.remainingSpots, 5);
    assert.strictEqual(bulkExceed.reason, "EXCEEDS_CAPACITY");
  });

  it("filters students by search query and availability tab", () => {
    // Search by code
    const byCode = filterStudentsForEnrollment(
      mockStudents,
      "STU-001",
      "cls-1",
      mockActiveEnrollments,
      mockClassrooms,
      "all"
    );
    assert.strictEqual(byCode.length, 1);
    assert.strictEqual(byCode[0].student.id, "std-1");

    // Filter available only
    const availableOnly = filterStudentsForEnrollment(
      mockStudents,
      "",
      "cls-1",
      mockActiveEnrollments,
      mockClassrooms,
      "available"
    );
    assert.strictEqual(availableOnly.length, 1);
    assert.strictEqual(availableOnly[0].student.id, "std-3");

    // Filter enrolled only
    const enrolledOnly = filterStudentsForEnrollment(
      mockStudents,
      "",
      "cls-1",
      mockActiveEnrollments,
      mockClassrooms,
      "enrolled"
    );
    assert.strictEqual(enrolledOnly.length, 2);
  });
});
