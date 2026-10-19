import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  runTransaction,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { Enrollment, EnrollmentStatus } from "../models/enrollment.model";
import { EnrollmentTransfer } from "../models/enrollment-transfer.model";
import { Classroom } from "../models/classroom.model";
import { initialMockEnrollments } from "../data/enrollments.mock";
import { classroomService } from "./classroom.service";

const ENROLLMENTS_STORAGE_KEY = "esd_local_enrollments";
const ENROLLMENT_TRANSFERS_STORAGE_KEY = "esd_local_enrollment_transfers";

function getLocalEnrollments(): Enrollment[] {
  try {
    const saved = localStorage.getItem(ENROLLMENTS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(e);
  }
  return initialMockEnrollments;
}

function saveLocalEnrollments(enrollments: Enrollment[]) {
  try {
    localStorage.setItem(ENROLLMENTS_STORAGE_KEY, JSON.stringify(enrollments));
  } catch (e) {
    console.error("Failed to save enrollments to localStorage:", e);
  }
}

function getLocalTransfers(): EnrollmentTransfer[] {
  try {
    const saved = localStorage.getItem(ENROLLMENT_TRANSFERS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(e);
  }
  return [];
}

function saveLocalTransfers(transfers: EnrollmentTransfer[]) {
  try {
    localStorage.setItem(ENROLLMENT_TRANSFERS_STORAGE_KEY, JSON.stringify(transfers));
  } catch (e) {
    console.error("Failed to save transfers to localStorage:", e);
  }
}

export const enrollmentService = {
  /**
   * Fetch all enrollments from Firestore with local fallback
   */
  async getEnrollments(): Promise<Enrollment[]> {
    try {
      const snap = await getDocs(collection(db, "enrollments"));
      if (!snap.empty) {
        const firestoreList = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Enrollment)
        );
        saveLocalEnrollments(firestoreList);
        return firestoreList;
      }
    } catch (e) {
      console.warn("Firestore getEnrollments fallback to local:", e);
    }
    return getLocalEnrollments();
  },

  /**
   * Fetch all enrollments for a specific student
   */
  async getEnrollmentsByStudentId(studentId: string): Promise<Enrollment[]> {
    try {
      const q = query(
        collection(db, "enrollments"),
        where("studentId", "==", studentId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Enrollment));
        return list.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
    } catch (e) {
      console.warn("Firestore getEnrollmentsByStudentId fallback to local:", e);
    }

    const all = await this.getEnrollments();
    return all
      .filter((e) => e.studentId === studentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * Get the single active enrollment of a student (if any)
   */
  async getActiveEnrollmentByStudentId(
    studentId: string
  ): Promise<Enrollment | null> {
    const list = await this.getEnrollmentsByStudentId(studentId);
    const active = list.find((e) => e.status === "active");
    return active || null;
  },

  /**
   * Fetch all enrollments for a specific classroom
   */
  async getEnrollmentsByClassroomId(classroomId: string): Promise<Enrollment[]> {
    try {
      const q = query(
        collection(db, "enrollments"),
        where("classroomId", "==", classroomId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Enrollment));
      }
    } catch (e) {
      console.warn("Firestore getEnrollmentsByClassroomId fallback to local:", e);
    }

    const all = await this.getEnrollments();
    return all.filter((e) => e.classroomId === classroomId);
  },

  /**
   * Fetch active enrollments count/list for a classroom
   */
  async getActiveEnrollmentsByClassroomId(
    classroomId: string
  ): Promise<Enrollment[]> {
    const all = await this.getEnrollmentsByClassroomId(classroomId);
    return all.filter((e) => e.status === "active");
  },

  /**
   * Fetch enrollment by ID
   */
  async getEnrollmentById(id: string): Promise<Enrollment | null> {
    try {
      const snap = await getDoc(doc(db, "enrollments", id));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Enrollment;
      }
    } catch (e) {
      console.warn("Firestore getEnrollmentById fallback to local:", e);
    }
    const local = getLocalEnrollments();
    return local.find((e) => e.id === id) || null;
  },

  /**
   * Create a new enrollment for a student into a classroom
   */
  async createEnrollment(
    data: Omit<Enrollment, "id" | "createdAt" | "updatedAt">,
    currentUserId?: string
  ): Promise<Enrollment> {
    // 1. Check if student already has an active enrollment
    if (data.status === "active") {
      const activeEnr = await this.getActiveEnrollmentByStudentId(data.studentId);
      if (activeEnr) {
        throw new Error("ACTIVE_ENROLLMENT_EXISTS");
      }
    }

    // 2. Validate classroom
    const classroom = await classroomService.getClassroomById(data.classroomId);
    if (!classroom) {
      throw new Error("CLASSROOM_NOT_FOUND");
    }

    if (classroom.status !== "active") {
      throw new Error("CLASSROOM_NOT_ACTIVE");
    }

    // 3. Validate classroom capacity
    if (classroom.capacity && classroom.capacity > 0) {
      const activeEnrollments = await this.getActiveEnrollmentsByClassroomId(
        data.classroomId
      );
      if (activeEnrollments.length >= classroom.capacity) {
        throw new Error("CLASS_CAPACITY_FULL");
      }
    }

    const now = new Date().toISOString();
    const newEnrollmentData: Omit<Enrollment, "id"> = {
      studentId: data.studentId,
      classroomId: data.classroomId,
      packageId: classroom.packageId || data.packageId,
      startDate: data.startDate || classroom.startDate,
      expectedEndDate: data.expectedEndDate || classroom.expectedEndDate,
      actualEndDate: data.actualEndDate || "",
      status: data.status || "active",
      note: data.note ? data.note.trim() : "",
      createdAt: now,
      updatedAt: now,
      createdBy: currentUserId || "system",
      updatedBy: currentUserId || "system",
    };

    try {
      const docRef = await addDoc(
        collection(db, "enrollments"),
        newEnrollmentData
      );
      const created: Enrollment = { id: docRef.id, ...newEnrollmentData };
      const local = getLocalEnrollments();
      saveLocalEnrollments([created, ...local]);
      return created;
    } catch (e) {
      console.warn("Firestore createEnrollment fallback to local:", e);
      const newId = `enr-${Date.now()}`;
      const created: Enrollment = { id: newId, ...newEnrollmentData };
      const local = getLocalEnrollments();
      saveLocalEnrollments([created, ...local]);
      return created;
    }
  },

  /**
   * Bulk enroll multiple students into a classroom
   */
  async createEnrollments(
    items: Array<Omit<Enrollment, "id" | "createdAt" | "updatedAt">>,
    currentUserId?: string
  ): Promise<Enrollment[]> {
    if (!items || items.length === 0) {
      return [];
    }

    const classroomId = items[0].classroomId;
    const classroom = await classroomService.getClassroomById(classroomId);
    if (!classroom) {
      throw new Error("CLASSROOM_NOT_FOUND");
    }

    if (classroom.status !== "active") {
      throw new Error("CLASSROOM_NOT_ACTIVE");
    }

    // Capacity validation
    if (classroom.capacity && classroom.capacity > 0) {
      const activeEnrollments = await this.getActiveEnrollmentsByClassroomId(classroomId);
      if (activeEnrollments.length + items.length > classroom.capacity) {
        throw new Error("CLASS_CAPACITY_FULL");
      }
    }

    const now = new Date().toISOString();
    const preparedItems: Array<{ docRef: any; newEnrollment: Enrollment; rawData: Omit<Enrollment, "id"> }> = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const newDocRef = doc(collection(db, "enrollments"));
      const rawData: Omit<Enrollment, "id"> = {
        studentId: item.studentId,
        classroomId: item.classroomId,
        packageId: classroom.packageId || item.packageId,
        startDate: item.startDate || classroom.startDate,
        expectedEndDate: item.expectedEndDate || classroom.expectedEndDate,
        actualEndDate: item.actualEndDate || "",
        status: item.status || "active",
        note: item.note ? item.note.trim() : "",
        createdAt: now,
        updatedAt: now,
        createdBy: currentUserId || "system",
        updatedBy: currentUserId || "system",
      };
      preparedItems.push({
        docRef: newDocRef,
        newEnrollment: { id: newDocRef.id, ...rawData },
        rawData,
      });
    }

    try {
      // Chunk writes into batches of 450 (Firestore limit is 500)
      const chunkSize = 450;
      for (let i = 0; i < preparedItems.length; i += chunkSize) {
        const chunk = preparedItems.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach(({ docRef, rawData }) => {
          batch.set(docRef, rawData);
        });
        await batch.commit();
      }

      const createdList = preparedItems.map((p) => p.newEnrollment);
      const local = getLocalEnrollments();
      saveLocalEnrollments([...createdList, ...local]);
      return createdList;
    } catch (e) {
      console.warn("Firestore createEnrollments fallback to local:", e);
      const localCreated: Enrollment[] = preparedItems.map((p, idx) => ({
        ...p.newEnrollment,
        id: `enr-${Date.now()}-${idx}`,
      }));
      const local = getLocalEnrollments();
      saveLocalEnrollments([...localCreated, ...local]);
      return localCreated;
    }
  },

  /**
   * Update enrollment details
   */
  async updateEnrollment(
    id: string,
    updates: Partial<Enrollment>,
    currentUserId?: string
  ): Promise<Enrollment> {
    const existing = await this.getEnrollmentById(id);
    if (!existing) {
      throw new Error("ENROLLMENT_NOT_FOUND");
    }

    // If changing status to active, ensure no other active enrollment exists
    if (updates.status === "active" && existing.status !== "active") {
      const activeEnr = await this.getActiveEnrollmentByStudentId(
        existing.studentId
      );
      if (activeEnr && activeEnr.id !== id) {
        throw new Error("ACTIVE_ENROLLMENT_EXISTS");
      }
    }

    // If changing classroom, validate target class existence, active status & capacity
    if (updates.classroomId && updates.classroomId !== existing.classroomId) {
      const targetClass = await classroomService.getClassroomById(
        updates.classroomId
      );
      if (!targetClass) {
        throw new Error("CLASSROOM_NOT_FOUND");
      }
      if (targetClass.status !== "active") {
        throw new Error("CLASSROOM_NOT_ACTIVE");
      }
      if (targetClass.capacity && targetClass.capacity > 0) {
        const activeInTarget = await this.getActiveEnrollmentsByClassroomId(
          updates.classroomId
        );
        if (activeInTarget.length >= targetClass.capacity) {
          throw new Error("CLASS_CAPACITY_FULL");
        }
      }
      if (!updates.packageId && targetClass.packageId) {
        updates.packageId = targetClass.packageId;
      }
    }

    const now = new Date().toISOString();
    const updateData: Partial<Enrollment> = {
      ...updates,
      updatedAt: now,
      updatedBy: currentUserId || "system",
    };

    try {
      await updateDoc(doc(db, "enrollments", id), updateData);
    } catch (e) {
      console.warn("Firestore updateEnrollment fallback to local:", e);
    }

    const local = getLocalEnrollments();
    let updatedObj: Enrollment | null = null;
    const list = local.map((item) => {
      if (item.id === id) {
        updatedObj = { ...item, ...updateData };
        return updatedObj;
      }
      return item;
    });
    saveLocalEnrollments(list);
    return updatedObj || ({ id, ...updateData } as Enrollment);
  },

  /**
   * Change enrollment status (active, completed, paused, cancelled)
   */
  async setEnrollmentStatus(
    id: string,
    status: EnrollmentStatus,
    currentUserId?: string
  ): Promise<Enrollment> {
    const updates: Partial<Enrollment> = { status };
    if (status === "completed") {
      updates.actualEndDate = new Date().toISOString().split("T")[0];
    }
    return this.updateEnrollment(id, updates, currentUserId);
  },

  /**
   * Transfer active enrollment to a new compatible class atomically using Firestore runTransaction
   */
  async transferEnrollment(params: {
    sourceEnrollmentId: string;
    targetClassroomId: string;
    effectiveDate: string;
    reason: string;
    currentUserId?: string;
  }): Promise<{ newEnrollment: Enrollment; transfer: EnrollmentTransfer }> {
    const {
      sourceEnrollmentId,
      targetClassroomId,
      effectiveDate,
      reason,
      currentUserId = "system",
    } = params;

    const now = new Date().toISOString();
    const sourceEnrollmentRef = doc(db, "enrollments", sourceEnrollmentId);
    const targetEnrollmentRef = doc(collection(db, "enrollments"));
    const transferAuditRef = doc(collection(db, "enrollment_transfers"));

    let createdEnrollment: Enrollment | null = null;
    let createdTransfer: EnrollmentTransfer | null = null;

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Load source enrollment
        const sourceDoc = await transaction.get(sourceEnrollmentRef);
        if (!sourceDoc.exists()) {
          throw new Error("SOURCE_ENROLLMENT_NOT_FOUND");
        }
        const sourceData = sourceDoc.data() as Omit<Enrollment, "id">;

        // 2. Confirm source enrollment status is exactly active
        if (sourceData.status !== "active") {
          throw new Error("SOURCE_ENROLLMENT_NOT_ACTIVE");
        }

        // 3. Load target class
        const targetClassRef = doc(db, "classrooms", targetClassroomId);
        const targetClassDoc = await transaction.get(targetClassRef);

        if (!targetClassDoc.exists()) {
          throw new Error("TARGET_CLASS_NOT_FOUND");
        }
        const targetClassData = targetClassDoc.data() as Classroom;

        // 4. Confirm target class criteria
        if (targetClassData.status !== "active") {
          throw new Error("CLASSROOM_NOT_ACTIVE");
        }

        if (targetClassroomId === sourceData.classroomId) {
          throw new Error("SAME_CLASS_TRANSFER");
        }

        if (targetClassData.packageId !== sourceData.packageId) {
          throw new Error("DIFFERENT_PACKAGE_TRANSFER");
        }

        // 5. Check target class capacity
        if (targetClassData.capacity && targetClassData.capacity > 0) {
          const qTarget = query(
            collection(db, "enrollments"),
            where("classroomId", "==", targetClassroomId),
            where("status", "==", "active")
          );
          const targetActiveSnap = await getDocs(qTarget);
          if (targetActiveSnap.size >= targetClassData.capacity) {
            throw new Error("CLASS_CAPACITY_FULL");
          }
        }

        // 6. Create new target Enrollment
        const newEnrollmentData: Omit<Enrollment, "id"> = {
          studentId: sourceData.studentId,
          classroomId: targetClassroomId,
          packageId: targetClassData.packageId,
          startDate: effectiveDate,
          expectedEndDate: targetClassData.expectedEndDate || sourceData.expectedEndDate,
          actualEndDate: "",
          status: "active",
          note: sourceData.note || "",
          transferredFromEnrollmentId: sourceEnrollmentId,
          createdAt: now,
          updatedAt: now,
          createdBy: currentUserId,
          updatedBy: currentUserId,
        };

        transaction.set(targetEnrollmentRef, newEnrollmentData);

        // 7. Update source enrollment
        transaction.update(sourceEnrollmentRef, {
          status: "transferred" as EnrollmentStatus,
          actualEndDate: effectiveDate,
          transferredAt: now,
          transferredToEnrollmentId: targetEnrollmentRef.id,
          updatedAt: now,
          updatedBy: currentUserId,
        });

        // 8. Create enrollment_transfers audit document
        const transferData: Omit<EnrollmentTransfer, "id"> = {
          studentId: sourceData.studentId,
          sourceEnrollmentId,
          sourceClassroomId: sourceData.classroomId,
          targetEnrollmentId: targetEnrollmentRef.id,
          targetClassroomId,
          packageId: targetClassData.packageId,
          effectiveDate,
          reason: reason.trim(),
          transferredBy: currentUserId,
          transferredAt: now,
        };

        transaction.set(transferAuditRef, transferData);

        createdEnrollment = { id: targetEnrollmentRef.id, ...newEnrollmentData };
        createdTransfer = { id: transferAuditRef.id, ...transferData };
      });

      if (createdEnrollment && createdTransfer) {
        // Sync local cache
        const localEnrollments = getLocalEnrollments();
        const updatedLocal = localEnrollments.map((e) =>
          e.id === sourceEnrollmentId
            ? {
                ...e,
                status: "transferred" as EnrollmentStatus,
                actualEndDate: effectiveDate,
                transferredAt: now,
                transferredToEnrollmentId: createdEnrollment!.id,
                updatedAt: now,
                updatedBy: currentUserId,
              }
            : e
        );
        saveLocalEnrollments([createdEnrollment, ...updatedLocal]);

        const localTransfers = getLocalTransfers();
        saveLocalTransfers([createdTransfer, ...localTransfers]);

        return { newEnrollment: createdEnrollment, transfer: createdTransfer };
      }
    } catch (e: any) {
      // If error is a validation error from transaction, rethrow
      const knownErrors = [
        "SOURCE_ENROLLMENT_NOT_FOUND",
        "SOURCE_ENROLLMENT_NOT_ACTIVE",
        "TARGET_CLASS_NOT_FOUND",
        "CLASSROOM_NOT_ACTIVE",
        "SAME_CLASS_TRANSFER",
        "DIFFERENT_PACKAGE_TRANSFER",
        "CLASS_CAPACITY_FULL",
      ];
      if (knownErrors.includes(e.message)) {
        throw e;
      }

      console.warn("Firestore transfer transaction fallback to local:", e);

      // Fallback to local storage handling if offline
      const localEnrollments = getLocalEnrollments();
      const source = localEnrollments.find((e) => e.id === sourceEnrollmentId);
      if (!source) throw new Error("SOURCE_ENROLLMENT_NOT_FOUND");
      if (source.status !== "active") throw new Error("SOURCE_ENROLLMENT_NOT_ACTIVE");

      const targetClass = await classroomService.getClassroomById(targetClassroomId);
      if (!targetClass) throw new Error("TARGET_CLASS_NOT_FOUND");
      if (targetClass.status !== "active") throw new Error("CLASSROOM_NOT_ACTIVE");
      if (targetClass.packageId !== source.packageId) throw new Error("DIFFERENT_PACKAGE_TRANSFER");

      const newEnrollmentId = `enr-${Date.now()}`;
      const transferId = `tr-${Date.now()}`;

      const newEnrollmentData: Enrollment = {
        id: newEnrollmentId,
        studentId: source.studentId,
        classroomId: targetClassroomId,
        packageId: targetClass.packageId,
        startDate: effectiveDate,
        expectedEndDate: targetClass.expectedEndDate || source.expectedEndDate,
        actualEndDate: "",
        status: "active",
        note: source.note || "",
        transferredFromEnrollmentId: sourceEnrollmentId,
        createdAt: now,
        updatedAt: now,
        createdBy: currentUserId,
        updatedBy: currentUserId,
      };

      const transferData: EnrollmentTransfer = {
        id: transferId,
        studentId: source.studentId,
        sourceEnrollmentId,
        sourceClassroomId: source.classroomId,
        targetEnrollmentId: newEnrollmentId,
        targetClassroomId,
        packageId: targetClass.packageId,
        effectiveDate,
        reason: reason.trim(),
        transferredBy: currentUserId,
        transferredAt: now,
      };

      const updatedLocal = localEnrollments.map((e) =>
        e.id === sourceEnrollmentId
          ? {
              ...e,
              status: "transferred" as EnrollmentStatus,
              actualEndDate: effectiveDate,
              transferredAt: now,
              transferredToEnrollmentId: newEnrollmentId,
              updatedAt: now,
              updatedBy: currentUserId,
            }
          : e
      );

      saveLocalEnrollments([newEnrollmentData, ...updatedLocal]);
      const localTransfers = getLocalTransfers();
      saveLocalTransfers([transferData, ...localTransfers]);

      return { newEnrollment: newEnrollmentData, transfer: transferData };
    }

    throw new Error("TRANSFER_FAILED");
  },

  /**
   * Fetch all transfer audit records for a student
   */
  async getTransfersByStudentId(studentId: string): Promise<EnrollmentTransfer[]> {
    try {
      const q = query(
        collection(db, "enrollment_transfers"),
        where("studentId", "==", studentId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const list = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as EnrollmentTransfer)
        );
        return list.sort(
          (a, b) =>
            new Date(b.transferredAt).getTime() -
            new Date(a.transferredAt).getTime()
        );
      }
    } catch (e) {
      console.warn("Firestore getTransfersByStudentId fallback to local:", e);
    }

    const local = getLocalTransfers();
    return local
      .filter((t) => t.studentId === studentId)
      .sort(
        (a, b) =>
          new Date(b.transferredAt).getTime() -
          new Date(a.transferredAt).getTime()
      );
  },

  /**
   * Delete enrollment record
   */
  async deleteEnrollment(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "enrollments", id));
    } catch (e) {
      console.warn("Firestore deleteEnrollment fallback to local:", e);
    }
    const local = getLocalEnrollments();
    saveLocalEnrollments(local.filter((e) => e.id !== id));
  },
};
