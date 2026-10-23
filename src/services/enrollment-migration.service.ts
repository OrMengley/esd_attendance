import { collection, getDocs, doc, writeBatch } from "firebase/firestore";
import { db } from "../firebase/config";
import { Enrollment } from "../models/enrollment.model";
import { EnrollmentTransfer } from "../models/enrollment-transfer.model";
import { Classroom } from "../models/classroom.model";
import { User } from "../models/user.model";
import { classroomService } from "./classroom.service";

export interface EnrollmentMigrationResult {
  totalEnrollments: number;
  migratedEnrollments: number;
  alreadyMigratedEnrollments: number;
  unresolvedEnrollments: number;
  unresolvedEnrollmentIds: string[];
  totalTransfers: number;
  migratedTransfers: number;
  alreadyMigratedTransfers: number;
  unresolvedTransfers: number;
  unresolvedTransferIds: string[];
}

export const enrollmentMigrationService = {
  /**
   * Migrate existing enrollment and transfer documents in Firestore and localStorage
   * to backfill branchId from authoritative Classroom records.
   * Strictly requires super_admin user authorization.
   */
  async runMigration(currentUser: User | null): Promise<EnrollmentMigrationResult> {
    if (!currentUser || currentUser.role !== "super_admin") {
      throw new Error("UNAUTHORIZED_BRANCH");
    }

    const result: EnrollmentMigrationResult = {
      totalEnrollments: 0,
      migratedEnrollments: 0,
      alreadyMigratedEnrollments: 0,
      unresolvedEnrollments: 0,
      unresolvedEnrollmentIds: [],
      totalTransfers: 0,
      migratedTransfers: 0,
      alreadyMigratedTransfers: 0,
      unresolvedTransfers: 0,
      unresolvedTransferIds: [],
    };

    // 1. Fetch classrooms map
    const classrooms = await classroomService.getClassrooms();
    const classroomMap = new Map<string, Classroom>(
      classrooms.map((c) => [c.id, c])
    );

    // 2. Fetch all enrollments
    try {
      const enrSnap = await getDocs(collection(db, "enrollments"));
      result.totalEnrollments = enrSnap.size;

      const enrollmentsToUpdate: Array<{ id: string; branchId: string }> = [];

      for (const docSnap of enrSnap.docs) {
        const enr = { id: docSnap.id, ...docSnap.data() } as Enrollment;
        if (enr.branchId) {
          result.alreadyMigratedEnrollments++;
          continue;
        }

        const cls = classroomMap.get(enr.classroomId);
        if (cls && cls.branchId) {
          enrollmentsToUpdate.push({ id: enr.id, branchId: cls.branchId });
        } else {
          result.unresolvedEnrollments++;
          result.unresolvedEnrollmentIds.push(enr.id);
        }
      }

      // Batch write enrollments in chunks of 450
      const chunkSize = 450;
      for (let i = 0; i < enrollmentsToUpdate.length; i += chunkSize) {
        const chunk = enrollmentsToUpdate.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        const now = new Date().toISOString();
        chunk.forEach(({ id, branchId }) => {
          batch.update(doc(db, "enrollments", id), {
            branchId,
            updatedAt: now,
            updatedBy: "migration",
          });
        });
        await batch.commit();
        result.migratedEnrollments += chunk.length;
      }
    } catch (err) {
      console.warn("Firestore enrollment migration skipped or partially completed:", err);
    }

    // 3. Fetch all transfers
    try {
      const trSnap = await getDocs(collection(db, "enrollment_transfers"));
      result.totalTransfers = trSnap.size;

      const transfersToUpdate: Array<{
        id: string;
        sourceBranchId?: string;
        targetBranchId?: string;
      }> = [];

      for (const docSnap of trSnap.docs) {
        const tr = { id: docSnap.id, ...docSnap.data() } as EnrollmentTransfer;
        if (tr.sourceBranchId && tr.targetBranchId) {
          result.alreadyMigratedTransfers++;
          continue;
        }

        const srcCls = classroomMap.get(tr.sourceClassroomId);
        const tgtCls = classroomMap.get(tr.targetClassroomId);

        const sourceBranchId = tr.sourceBranchId || srcCls?.branchId;
        const targetBranchId = tr.targetBranchId || tgtCls?.branchId;

        if (sourceBranchId && targetBranchId) {
          transfersToUpdate.push({
            id: tr.id,
            sourceBranchId,
            targetBranchId,
          });
        } else {
          result.unresolvedTransfers++;
          result.unresolvedTransferIds.push(tr.id);
        }
      }

      // Batch write transfers
      const chunkSize = 450;
      for (let i = 0; i < transfersToUpdate.length; i += chunkSize) {
        const chunk = transfersToUpdate.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach(({ id, sourceBranchId, targetBranchId }) => {
          batch.update(doc(db, "enrollment_transfers", id), {
            sourceBranchId,
            targetBranchId,
          });
        });
        await batch.commit();
        result.migratedTransfers += chunk.length;
      }
    } catch (err) {
      console.warn("Firestore transfer migration skipped or partially completed:", err);
    }

    // 4. Clean and backfill local storage cache
    try {
      const savedEnr = localStorage.getItem("esd_local_enrollments");
      if (savedEnr) {
        const localEnrs: Enrollment[] = JSON.parse(savedEnr);
        const updatedLocal = localEnrs.map((e) => {
          if (!e.branchId) {
            const cls = classroomMap.get(e.classroomId);
            if (cls?.branchId) {
              return { ...e, branchId: cls.branchId };
            }
          }
          return e;
        });
        localStorage.setItem("esd_local_enrollments", JSON.stringify(updatedLocal));
      }
    } catch (e) {
      console.error("Local storage enrollment migration error:", e);
    }

    return result;
  },
};
