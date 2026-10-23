import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  limit,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { Attendance, AttendanceStatus } from "../models/attendance.model";
import { Student } from "../models/student.model";
import { Enrollment } from "../models/enrollment.model";
import { Classroom } from "../models/classroom.model";
import { User } from "../models/user.model";
import { studentService } from "./student.service";
import { enrollmentService } from "./enrollment.service";
import { canTeacherRecordAttendance } from "@/lib/attendance-time-lock";

const ATTENDANCE_STORAGE_KEY = "esd_local_attendance";

function getLocalAttendance(): Attendance[] {
  try {
    const saved = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Failed to parse local attendance:", e);
  }
  return [];
}

function saveLocalAttendance(attendance: Attendance[]) {
  try {
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(attendance));
  } catch (e) {
    console.error("Failed to save attendance to localStorage:", e);
  }
}

function normalizeTimestamp(val: any): string | undefined {
  if (!val) return undefined;
  if (typeof val === "string") return val;
  if (typeof val.toDate === "function") return val.toDate().toISOString();
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

function mapDocToAttendance(d: any): Attendance {
  const data = d.data();
  const lastCorrectedAt = normalizeTimestamp(data.lastCorrectedAt);
  const updatedAt = normalizeTimestamp(data.updatedAt);
  const recordedAt = normalizeTimestamp(data.recordedAt);
  const createdAt = normalizeTimestamp(data.createdAt);

  return {
    id: d.id,
    attendanceDocId: d.id,
    ...data,
    lastCorrectedAt,
    updatedAt,
    recordedAt,
    createdAt,
    attendanceDate: data.attendanceDate || data.date || "",
    date: data.attendanceDate || data.date || "",
  } as Attendance;
}

export const attendanceService = {
  /**
   * Fetch all attendance records (with fallback to local storage)
   */
  async getAttendance(): Promise<Attendance[]> {
    try {
      const snap = await getDocs(collection(db, "attendance"));
      if (!snap.empty) {
        const list = snap.docs.map(mapDocToAttendance);
        saveLocalAttendance(list);
        return list;
      }
    } catch (e) {
      console.warn("Firestore getAttendance fallback to local:", e);
    }
    return getLocalAttendance();
  },

  /**
   * Fetch a single attendance record by ID
   */
  async getAttendanceById(id: string): Promise<Attendance | null> {
    try {
      const docRef = doc(db, "attendance", id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return mapDocToAttendance(snap);
      }
    } catch (e) {
      console.warn("Firestore getAttendanceById fallback to local:", e);
    }
    const local = getLocalAttendance();
    return local.find((a) => a.id === id) || null;
  },

  /**
   * Fetch attendance records for a specific classroom and date
   */
  async getAttendanceByClassAndDate(
    classroomId: string,
    attendanceDate: string
  ): Promise<Attendance[]> {
    try {
      // Query Firestore matching classroomId and attendanceDate
      const q = query(
        collection(db, "attendance"),
        where("classroomId", "==", classroomId),
        where("attendanceDate", "==", attendanceDate)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map(mapDocToAttendance);
      }

      // Backward-compat check with field "date"
      const qAlt = query(
        collection(db, "attendance"),
        where("classroomId", "==", classroomId),
        where("date", "==", attendanceDate)
      );
      const snapAlt = await getDocs(qAlt);
      if (!snapAlt.empty) {
        return snapAlt.docs.map(mapDocToAttendance);
      }
    } catch (e) {
      console.warn("Firestore getAttendanceByClassAndDate fallback to local:", e);
    }

    const local = getLocalAttendance();
    return local.filter(
      (a) =>
        a.classroomId === classroomId &&
        (a.attendanceDate === attendanceDate || a.date === attendanceDate)
    );
  },

  /**
   * Backward-compatibility adapter for getAttendanceByDateAndClass
   */
  async getAttendanceByDateAndClass(
    date: string,
    classroomId: string
  ): Promise<Attendance[]> {
    return this.getAttendanceByClassAndDate(classroomId, date);
  },

  /**
   * Check whether a student has any recorded attendance in a specific classroom
   */
  async hasAttendanceRecords(
    studentId: string,
    classroomId: string
  ): Promise<boolean> {
    try {
      const q = query(
        collection(db, "attendance"),
        where("studentId", "==", studentId),
        where("classroomId", "==", classroomId),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) return true;
    } catch (e) {
      console.warn("Firestore hasAttendanceRecords fallback to local:", e);
    }
    const local = getLocalAttendance();
    return local.some(
      (a) => a.studentId === studentId && a.classroomId === classroomId
    );
  },

  /**
   * Load students who are strictly eligible for attendance on the selected date for this class
   * Rule:
   * - Student is active (not archived)
   * - Enrollment belongs to selected classroom
   * - Enrollment startDate is on or before attendanceDate
   * - For active enrollment: eligible
   * - For transferred enrollment: eligible only before actualEndDate (transfer date)
   * - For completed enrollment: eligible only until actualEndDate
   * - For paused/cancelled: not eligible
   */
  async getEligibleStudentsForAttendance(
    classroomId: string,
    attendanceDate: string,
    currentUser?: User | null
  ): Promise<{ student: Student; enrollment: Enrollment }[]> {
    const [allStudents, allEnrollments] = await Promise.all([
      studentService.getStudents(),
      enrollmentService.getEnrollmentsByClassroomId(classroomId, currentUser),
    ]);

    const activeStudentsMap = new Map<string, Student>();
    allStudents.forEach((s) => {
      if (s.status === "active") {
        activeStudentsMap.set(s.id, s);
      }
    });

    const eligible: { student: Student; enrollment: Enrollment }[] = [];

    for (const enr of allEnrollments) {
      // 1. Must belong to this classroom
      if (enr.classroomId !== classroomId) continue;

      // 2. Enrollment start date must be on or before the attendance date
      if (!enr.startDate || enr.startDate > attendanceDate) continue;

      // 3. Check status & date eligibility
      let isEligible = false;
      if (enr.status === "active") {
        isEligible = true;
      } else if (enr.status === "transferred") {
        // Transferred out: only eligible BEFORE transfer effective date (actualEndDate)
        if (enr.actualEndDate && attendanceDate < enr.actualEndDate) {
          isEligible = true;
        }
      } else if (enr.status === "completed") {
        // Completed: eligible on or before actual completion date
        if (!enr.actualEndDate || attendanceDate <= enr.actualEndDate) {
          isEligible = true;
        }
      }

      if (!isEligible) continue;

      const student = activeStudentsMap.get(enr.studentId);
      if (student) {
        eligible.push({ student, enrollment: enr });
      }
    }

    // Sort by student code or nameKh
    return eligible.sort((a, b) =>
      a.student.studentCode.localeCompare(b.student.studentCode) ||
      a.student.nameKh.localeCompare(b.student.nameKh)
    );
  },

  /**
   * Save daily attendance using batch write and deterministic document ID: {classroomId}_{attendanceDate}_{studentId}
   */
  async saveDailyAttendance(params: {
    classroom: Classroom;
    attendanceDate: string;
    records: {
      studentId: string;
      enrollmentId: string;
      status: AttendanceStatus;
      remark?: string;
    }[];
    currentUserId?: string;
    currentUserRole?: string;
    currentUserBranchId?: string;
  }): Promise<{ createdCount: number; updatedCount: number }> {
    const {
      classroom,
      attendanceDate,
      records,
      currentUserId = "system",
      currentUserRole,
      currentUserBranchId,
    } = params;

    // Branch authorization check for admin role
    if (currentUserRole === "admin" && currentUserBranchId) {
      if (classroom.branchId && classroom.branchId !== currentUserBranchId) {
        throw new Error("UNAUTHORIZED_BRANCH");
      }
    }

    // Service-level validation for teacher role and holiday checks
    const { schoolHolidayService } = await import("./school-holiday.service");
    const activeHolidays = await schoolHolidayService.getActiveSchoolHolidays();

    if (currentUserRole === "teacher") {
      const check = canTeacherRecordAttendance({
        classroom,
        selectedDate: attendanceDate,
        userRole: currentUserRole,
        userId: currentUserId,
        activeHolidays,
      });

      if (!check.allowed) {
        if (check.state === "holiday") {
          throw new Error("SCHOOL_CLOSED_HOLIDAY");
        } else if (check.state === "upcoming") {
          throw new Error("TEACHER_TIME_UPCOMING");
        } else if (check.state === "finished") {
          throw new Error("TEACHER_TIME_FINISHED");
        } else if (check.state === "not_scheduled") {
          throw new Error("NOT_SCHEDULED_DAY");
        } else if (check.state === "not_today") {
          throw new Error("TEACHER_NOT_TODAY");
        } else if (check.reason === "TEACHER_NOT_ASSIGNED") {
          throw new Error("TEACHER_NOT_ASSIGNED");
        }
        throw new Error("TEACHER_TIME_LOCKED");
      }
    }

    const now = new Date().toISOString();

    // Fetch existing records for this class and date to determine insert vs update
    const existingRecords = await this.getAttendanceByClassAndDate(
      classroom.id,
      attendanceDate
    );
    const existingMap = new Map<string, Attendance>();
    existingRecords.forEach((r) => existingMap.set(r.studentId, r));

    let createdCount = 0;
    let updatedCount = 0;

    const savedEntities: Attendance[] = [];

    try {
      const batch = writeBatch(db);

      for (const rec of records) {
        const docId = `${classroom.id}_${attendanceDate}_${rec.studentId}`;
        const docRef = doc(db, "attendance", docId);
        const existing = existingMap.get(rec.studentId);

        const attendanceData: Attendance = {
          id: docId,
          attendanceDate,
          date: attendanceDate,
          studentId: rec.studentId,
          enrollmentId: rec.enrollmentId,
          classroomId: classroom.id,
          packageId: classroom.packageId || "",
          teacherId: classroom.assignedTeacherId || "",
          status: rec.status,
          remark: rec.remark ? rec.remark.trim() : "",
          recordedBy: existing?.recordedBy || currentUserId,
          recordedAt: existing?.recordedAt || now,
          updatedBy: currentUserId,
          updatedAt: now,
        };

        if (existing) {
          updatedCount++;
        } else {
          createdCount++;
        }

        savedEntities.push(attendanceData);
        batch.set(docRef, attendanceData, { merge: true });
      }

      await batch.commit();
    } catch (e) {
      console.warn("Firestore saveDailyAttendance batch fallback to local:", e);
      // If Firestore failed, still increment counts for local storage
      createdCount = 0;
      updatedCount = 0;
      savedEntities.length = 0;

      for (const rec of records) {
        const docId = `${classroom.id}_${attendanceDate}_${rec.studentId}`;
        const existing = existingMap.get(rec.studentId);
        const attendanceData: Attendance = {
          id: docId,
          attendanceDate,
          date: attendanceDate,
          studentId: rec.studentId,
          enrollmentId: rec.enrollmentId,
          classroomId: classroom.id,
          packageId: classroom.packageId || "",
          teacherId: classroom.assignedTeacherId || "",
          status: rec.status,
          remark: rec.remark ? rec.remark.trim() : "",
          recordedBy: existing?.recordedBy || currentUserId,
          recordedAt: existing?.recordedAt || now,
          updatedBy: currentUserId,
          updatedAt: now,
        };
        if (existing) updatedCount++;
        else createdCount++;
        savedEntities.push(attendanceData);
      }
    }

    // Update local storage
    const allLocal = getLocalAttendance();
    const savedIds = new Set(savedEntities.map((s) => s.id));
    const filteredLocal = allLocal.filter((item) => !savedIds.has(item.id));
    saveLocalAttendance([...savedEntities, ...filteredLocal]);

    return { createdCount, updatedCount };
  },
};
