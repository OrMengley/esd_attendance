import {
  runTransaction,
  doc,
  collection,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { Attendance, AttendanceStatus } from "../models/attendance.model";
import {
  AttendanceAuditLog,
  CorrectionReason,
} from "../models/attendance-audit-log.model";
import { Classroom } from "../models/classroom.model";
import { Student } from "../models/student.model";
import { Enrollment } from "../models/enrollment.model";
import { User } from "../models/user.model";
import { classroomService } from "./classroom.service";
import { studentService } from "./student.service";
import { enrollmentService } from "./enrollment.service";
import { userService } from "./user.service";
import { schoolHolidayService } from "./school-holiday.service";
import {
  validateCorrectionDate,
  validateStudentEnrollmentForCorrection,
  validateCorrectionInput,
} from "@/lib/attendance-correction-validator";

const ATTENDANCE_STORAGE_KEY = "esd_local_attendance";
const AUDIT_LOG_STORAGE_KEY = "esd_local_attendance_audit_logs";

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
    console.error("Failed to save local attendance:", e);
  }
}

function getLocalAuditLogs(): AttendanceAuditLog[] {
  try {
    const saved = localStorage.getItem(AUDIT_LOG_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Failed to parse local audit logs:", e);
  }
  return [];
}

function saveLocalAuditLogs(logs: AttendanceAuditLog[]) {
  try {
    localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error("Failed to save local audit logs:", e);
  }
}

export interface CorrectAttendanceParams {
  attendanceDocId?: string;
  attendanceId?: string;
  classroomId: string;
  studentId: string;
  attendanceDate: string; // YYYY-MM-DD
  newStatus: AttendanceStatus;
  reason: CorrectionReason;
  notes?: string;
  currentUser: User;
  // Optional pre-fetched models to avoid duplicate fetching
  classroom?: Classroom;
  student?: Student;
  enrollment?: Enrollment;
  teacher?: User;
}

export const attendanceCorrectionService = {
  /**
   * Execute atomic attendance correction:
   * 1. Validates permissions and eligibility.
   * 2. Reads existing attendance record in Firestore runTransaction.
   * 3. Updates existing attendance document with new status & correction metadata.
   * 4. Creates an immutable audit log record in attendance_audit_logs.
   * 5. Atomically commits both.
   * 6. Re-fetches the record and verifies updatedRecord.status === newStatus.
   * 7. Synchronizes local cache and returns the updated record.
   */
  async correctAttendance(params: CorrectAttendanceParams): Promise<{
    success: boolean;
    attendance: Attendance;
    auditLog: AttendanceAuditLog;
  }> {
    const {
      classroomId,
      studentId,
      attendanceDate,
      newStatus,
      reason,
      notes = "",
      currentUser,
    } = params;

    // 1. Permission check: admin or super_admin only
    if (currentUser.role !== "super_admin" && currentUser.role !== "admin") {
      throw new Error("UNAUTHORIZED_ROLE");
    }

    // 2. Resolve real Firestore document ID
    let realDocId = params.attendanceDocId || params.attendanceId;
    if (!realDocId) {
      try {
        const q = query(
          collection(db, "attendance"),
          where("classroomId", "==", classroomId),
          where("studentId", "==", studentId),
          where("attendanceDate", "==", attendanceDate)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          realDocId = snap.docs[0].id;
        } else {
          const qAlt = query(
            collection(db, "attendance"),
            where("classroomId", "==", classroomId),
            where("studentId", "==", studentId),
            where("date", "==", attendanceDate)
          );
          const snapAlt = await getDocs(qAlt);
          if (!snapAlt.empty) {
            realDocId = snapAlt.docs[0].id;
          } else {
            realDocId = `${classroomId}_${attendanceDate}_${studentId}`;
          }
        }
      } catch (e) {
        console.warn("Firestore query for attendance document ID fallback:", e);
        realDocId = `${classroomId}_${attendanceDate}_${studentId}`;
      }
    }

    // 3. Load necessary entity data
    const [classroom, student, allEnrollments, activeHolidays] = await Promise.all([
      params.classroom ? Promise.resolve(params.classroom) : classroomService.getClassroomById(classroomId),
      params.student ? Promise.resolve(params.student) : studentService.getStudentById(studentId),
      params.enrollment
        ? Promise.resolve([params.enrollment])
        : enrollmentService.getEnrollmentsByClassroomId(classroomId, currentUser),
      schoolHolidayService.getActiveSchoolHolidays(),
    ]);

    if (!classroom) {
      throw new Error("CLASSROOM_NOT_FOUND");
    }

    // Branch authorization check for admin
    if (currentUser.role === "admin") {
      if (classroom.branchId && classroom.branchId !== currentUser.branchId) {
        throw new Error("UNAUTHORIZED_BRANCH");
      }
    }

    if (!student) {
      throw new Error("STUDENT_NOT_FOUND");
    }

    const enrollment =
      params.enrollment ||
      allEnrollments.find(
        (e) => e.studentId === studentId && e.classroomId === classroomId
      );

    if (!enrollment) {
      throw new Error("ENROLLMENT_NOT_FOUND");
    }

    // Load teacher for snapshot if not passed
    let teacher: User | undefined = params.teacher;
    if (!teacher && classroom.assignedTeacherId) {
      const allUsers = await userService.getUsers();
      teacher = allUsers.find((u) => u.id === classroom.assignedTeacherId);
    }

    // 4. Validation: Date eligibility
    const localRecords = getLocalAttendance();
    const existingLocal = localRecords.find(
      (a) =>
        a.id === realDocId ||
        (a.classroomId === classroomId &&
          (a.attendanceDate === attendanceDate || a.date === attendanceDate) &&
          a.studentId === studentId)
    );

    const dateCheck = validateCorrectionDate({
      classroom,
      attendanceDate,
      activeHolidays,
      hasExistingRecord: true, // We are correcting an existing record
    });

    if (!dateCheck.allowed) {
      throw new Error(dateCheck.reason || "DATE_NOT_ELIGIBLE");
    }

    // 5. Validation: Student enrollment eligibility
    const enrollmentCheck = validateStudentEnrollmentForCorrection({
      enrollment,
      attendanceDate,
    });

    if (!enrollmentCheck.allowed) {
      throw new Error(enrollmentCheck.reason || "STUDENT_NOT_ELIGIBLE");
    }

    // 6. Validation: Input fields
    const previousStatus = existingLocal?.status || null;
    const inputCheck = validateCorrectionInput({
      previousStatus,
      newStatus,
      reason,
      notes,
      userRole: currentUser.role,
    });

    if (!inputCheck.isValid) {
      const firstError = Object.values(inputCheck.errors)[0];
      throw new Error(firstError || "INVALID_INPUT");
    }

    const userFullName = (currentUser as any).fullName || currentUser.name || "Admin";
    const trimmedNotes = notes.trim();

    // Prepare snapshots (ensure NO undefined properties for Firestore)
    const studentSnapshot = {
      studentCode: student.studentCode || "",
      fullNameKm: student.nameKh || "",
      fullNameEn: student.nameEn || "",
    };

    const classroomSnapshot = {
      classCode: classroom.code || "",
      className: classroom.name || "",
    };

    const teacherSnapshot = teacher
      ? {
          teacherId: teacher.id,
          fullName: (teacher as any).fullName || teacher.name || "",
          username: teacher.username || "",
        }
      : null;

    const attDocRef = doc(db, "attendance", realDocId);
    const auditColRef = collection(db, "attendance_audit_logs");
    const auditDocRef = doc(auditColRef);
    const auditLogId = auditDocRef.id;

    let transactionPrevStatus: AttendanceStatus | null = null;

    // 7. Execute atomic Firestore runTransaction
    await runTransaction(db, async (transaction) => {
      // 1. Read the real attendance document using attendanceDocId
      const attSnap = await transaction.get(attDocRef);
      if (!attSnap.exists()) {
        throw new Error("ATTENDANCE_NOT_FOUND");
      }

      const existingData = attSnap.data();

      // 2. Validate existing record belongs to expected student, class, date
      const matchClass = existingData.classroomId === classroomId;
      const matchStudent = existingData.studentId === studentId;
      const matchDate =
        existingData.attendanceDate === attendanceDate ||
        existingData.date === attendanceDate;

      if (!matchClass || !matchStudent || !matchDate) {
        throw new Error("ATTENDANCE_MISMATCH");
      }

      // 3. Validate status
      if (!["present", "absent", "late", "permission"].includes(newStatus)) {
        throw new Error("INVALID_STATUS");
      }

      if (existingData.status === newStatus) {
        throw new Error("STATUS_UNCHANGED");
      }

      transactionPrevStatus = (existingData.status as AttendanceStatus) || null;

      // 4. Update the existing attendance document
      transaction.update(attDocRef, {
        status: newStatus,
        lastCorrectedAt: serverTimestamp(),
        lastCorrectedById: currentUser.id,
        lastCorrectedByName: userFullName,
        lastCorrectedByUsername: currentUser.username,
        lastCorrectionReason: reason,
        lastCorrectionNote: trimmedNotes || null,
        updatedAt: serverTimestamp(),
      });

      // 5. Create exactly one new immutable audit log document
      const auditPayload: any = {
        id: auditLogId,
        attendanceId: realDocId,
        classroomId,
        studentId,
        attendanceDate,
        previousStatus: transactionPrevStatus,
        newStatus,
        correctionReason: reason,
        correctionNote: trimmedNotes || null,
        correctedById: currentUser.id,
        correctedByName: userFullName,
        correctedByUsername: currentUser.username,
        correctedByRole: currentUser.role,
        correctedAt: serverTimestamp(),
        studentSnapshot,
        classroomSnapshot,
      };

      if (teacherSnapshot) {
        auditPayload.teacherSnapshot = teacherSnapshot;
      }

      transaction.set(auditDocRef, auditPayload);
    });

    // 8. Verify write result before updating UI (Requirement 4)
    const verifySnap = await getDoc(attDocRef);
    if (!verifySnap.exists()) {
      console.error(
        "Verification failed: Attendance record does not exist after correction",
        realDocId
      );
      throw new Error("CORRECTION_VERIFICATION_FAILED");
    }

    const verifiedRecord = verifySnap.data();
    if (verifiedRecord.status !== newStatus) {
      console.error("Verification failed: Attendance status does not match newStatus", {
        expected: newStatus,
        actual: verifiedRecord.status,
      });
      throw new Error("CORRECTION_VERIFICATION_FAILED");
    }

    // 9. Update local storage caches for immediate consistency
    const nowIso = new Date().toISOString();
    const finalAttendance: Attendance = {
      ...(verifiedRecord as Attendance),
      id: realDocId,
      attendanceDocId: realDocId,
      status: newStatus,
      lastCorrectedAt: nowIso,
      lastCorrectedById: currentUser.id,
      lastCorrectedByName: userFullName,
      lastCorrectedByUsername: currentUser.username,
      lastCorrectionReason: reason,
      lastCorrectionNote: trimmedNotes || undefined,
      updatedAt: nowIso,
      attendanceDate: verifiedRecord.attendanceDate || verifiedRecord.date || attendanceDate,
      date: verifiedRecord.attendanceDate || verifiedRecord.date || attendanceDate,
    };

    const allLocalAtt = getLocalAttendance();
    const updatedAttList = [
      finalAttendance,
      ...allLocalAtt.filter((a) => a.id !== realDocId),
    ];
    saveLocalAttendance(updatedAttList);

    const finalAuditLog: AttendanceAuditLog = {
      id: auditLogId,
      attendanceId: realDocId,
      classroomId,
      studentId,
      attendanceDate,
      previousStatus: transactionPrevStatus,
      newStatus,
      correctionReason: reason,
      correctionNote: trimmedNotes || undefined,
      correctedById: currentUser.id,
      correctedByName: userFullName,
      correctedByUsername: currentUser.username,
      correctedByRole: currentUser.role as "super_admin" | "admin",
      correctedAt: nowIso,
      studentSnapshot,
      classroomSnapshot,
      teacherSnapshot: teacherSnapshot || undefined,
    };

    const allLocalAudit = getLocalAuditLogs();
    saveLocalAuditLogs([
      finalAuditLog,
      ...allLocalAudit.filter((a) => a.id !== auditLogId),
    ]);

    return {
      success: true,
      attendance: finalAttendance,
      auditLog: finalAuditLog,
    };
  },
};
