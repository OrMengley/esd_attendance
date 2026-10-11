import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import {
  AttendanceAuditLog,
  CorrectionReason,
} from "../models/attendance-audit-log.model";
import { AttendanceStatus } from "../models/attendance.model";

const AUDIT_LOG_STORAGE_KEY = "esd_local_attendance_audit_logs";

export interface AuditLogFilters {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  classroomId?: string;
  studentSearch?: string;
  correctedById?: string;
  previousStatus?: AttendanceStatus | "all";
  newStatus?: AttendanceStatus | "all";
  correctionReason?: CorrectionReason | "all";
}

function getLocalAuditLogs(): AttendanceAuditLog[] {
  try {
    const saved = localStorage.getItem(AUDIT_LOG_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Failed to parse local attendance audit logs:", e);
  }
  return [];
}

export function saveLocalAuditLogs(logs: AttendanceAuditLog[]) {
  try {
    localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error("Failed to save local attendance audit logs:", e);
  }
}

function normalizeTimestamp(val: any): string | undefined {
  if (!val) return undefined;
  if (typeof val === "string") return val;
  if (typeof val.toDate === "function") return val.toDate().toISOString();
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

export const attendanceAuditLogService = {
  /**
   * Fetch all audit logs (with local storage fallback)
   */
  async getAuditLogs(filters?: AuditLogFilters): Promise<AttendanceAuditLog[]> {
    let logs: AttendanceAuditLog[] = [];

    try {
      const q = query(
        collection(db, "attendance_audit_logs"),
        orderBy("correctedAt", "desc")
      );
      const snap = await getDocs(q);
      logs = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          correctedAt: normalizeTimestamp(data.correctedAt) || new Date().toISOString(),
        } as AttendanceAuditLog;
      });
      saveLocalAuditLogs(logs);
    } catch (e) {
      console.warn("Firestore getAuditLogs fallback to local:", e);
      logs = getLocalAuditLogs();
    }

    // Sort newest first
    logs.sort((a, b) => (b.correctedAt || "").localeCompare(a.correctedAt || ""));

    // In-memory filtering
    if (!filters) return logs;

    return logs.filter((log) => {
      // Date range filtering (by attendanceDate)
      if (filters.startDate && log.attendanceDate < filters.startDate) {
        return false;
      }
      if (filters.endDate && log.attendanceDate > filters.endDate) {
        return false;
      }

      // Classroom filter
      if (filters.classroomId && filters.classroomId !== "all" && log.classroomId !== filters.classroomId) {
        return false;
      }

      // Corrected by filter
      if (filters.correctedById && filters.correctedById !== "all" && log.correctedById !== filters.correctedById) {
        return false;
      }

      // Previous status filter
      if (filters.previousStatus && filters.previousStatus !== "all" && log.previousStatus !== filters.previousStatus) {
        return false;
      }

      // New status filter
      if (filters.newStatus && filters.newStatus !== "all" && log.newStatus !== filters.newStatus) {
        return false;
      }

      // Correction reason filter
      if (filters.correctionReason && filters.correctionReason !== "all" && log.correctionReason !== filters.correctionReason) {
        return false;
      }

      // Student search filter (nameKh, nameEn, studentCode)
      if (filters.studentSearch && filters.studentSearch.trim() !== "") {
        const query = filters.studentSearch.toLowerCase().trim();
        const code = (log.studentSnapshot?.studentCode || "").toLowerCase();
        const nameKh = (log.studentSnapshot?.fullNameKm || "").toLowerCase();
        const nameEn = (log.studentSnapshot?.fullNameEn || "").toLowerCase();
        const matches =
          code.includes(query) ||
          nameKh.includes(query) ||
          nameEn.includes(query);
        if (!matches) return false;
      }

      return true;
    });
  },

  /**
   * Fetch audit logs for a specific attendance record
   */
  async getAuditLogsForAttendance(attendanceId: string): Promise<AttendanceAuditLog[]> {
    const all = await this.getAuditLogs();
    return all.filter((l) => l.attendanceId === attendanceId);
  },

  /**
   * Directly save a single audit log document (atomic transaction usually writes this,
   * but this is available for fallback / direct logging)
   */
  async createAuditLog(log: AttendanceAuditLog): Promise<void> {
    try {
      const docRef = doc(db, "attendance_audit_logs", log.id);
      await setDoc(docRef, log);
    } catch (e) {
      console.warn("Firestore createAuditLog fallback to local:", e);
    }

    const current = getLocalAuditLogs();
    saveLocalAuditLogs([log, ...current.filter((l) => l.id !== log.id)]);
  },
};
