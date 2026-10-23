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
import { User } from "../models/user.model";
import { initialMockEnrollments } from "../data/enrollments.mock";
import { classroomService } from "./classroom.service";
import { ALL_BRANCHES_ID } from "../lib/branch-scoping";

const ENROLLMENTS_STORAGE_KEY = "esd_local_enrollments";
const ENROLLMENT_TRANSFERS_STORAGE_KEY = "esd_local_enrollment_transfers";

function getLocalEnrollments(branchId?: string | null): Enrollment[] {
  let list: Enrollment[] = [];
  try {
    const saved = localStorage.getItem(ENROLLMENTS_STORAGE_KEY);
    if (saved) {
      list = JSON.parse(saved);
    } else {
      list = initialMockEnrollments;
    }
  } catch (e) {
    console.error(e);
    list = initialMockEnrollments;
  }

  if (!branchId || branchId === ALL_BRANCHES_ID) {
    return list;
  }
  // Enforce branch isolation on local storage reads
  return list.filter((e) => e.branchId === branchId);
}

function saveLocalEnrollments(enrollments: Enrollment[]) {
  try {
    const saved = localStorage.getItem(ENROLLMENTS_STORAGE_KEY);
    const existingList: Enrollment[] = saved ? JSON.parse(saved) : initialMockEnrollments;
    const incomingMap = new Map(enrollments.map((e) => [e.id, e]));
    const merged = [
      ...enrollments,
      ...existingList.filter((e) => !incomingMap.has(e.id)),
    ];
    localStorage.setItem(ENROLLMENTS_STORAGE_KEY, JSON.stringify(merged));
  } catch (e) {
    console.error("Failed to save enrollments to localStorage:", e);
  }
}

function getLocalTransfers(branchId?: string | null): EnrollmentTransfer[] {
  let list: EnrollmentTransfer[] = [];
  try {
    const saved = localStorage.getItem(ENROLLMENT_TRANSFERS_STORAGE_KEY);
    if (saved) list = JSON.parse(saved);
  } catch (e) {
    console.error(e);
  }

  if (!branchId || branchId === ALL_BRANCHES_ID) {
    return list;
  }
  return list.filter(
    (t) => t.sourceBranchId === branchId || t.targetBranchId === branchId
  );
}

function saveLocalTransfers(transfers: EnrollmentTransfer[]) {
  try {
    const saved = localStorage.getItem(ENROLLMENT_TRANSFERS_STORAGE_KEY);
    const existingList: EnrollmentTransfer[] = saved ? JSON.parse(saved) : [];
    const incomingMap = new Map(transfers.map((t) => [t.id, t]));
    const merged = [
      ...transfers,
      ...existingList.filter((t) => !incomingMap.has(t.id)),
    ];
    localStorage.setItem(ENROLLMENT_TRANSFERS_STORAGE_KEY, JSON.stringify(merged));
  } catch (e) {
    console.error("Failed to save transfers to localStorage:", e);
  }
}

function resolveUser(
  userOrId?: User | string | null,
  userParam?: User | null
): { user: User | null; currentUserId: string } {
  const user =
    typeof userOrId === "object" && userOrId !== null
      ? userOrId
      : userParam || null;
  const currentUserId =
    typeof userOrId === "string"
      ? userOrId
      : user?.id || "system";
  return { user, currentUserId };
}

export const enrollmentService = {
  /**
   * Fetch all enrollments from Firestore with local fallback, scoped by user branch.
   */
  async getEnrollments(
    currentUserOrBranchId?: User | string | null,
    optionalBranchId?: string | null
  ): Promise<Enrollment[]> {
    let effectiveBranch: string | null = null;

    if (currentUserOrBranchId && typeof currentUserOrBranchId === "object") {
      const user = currentUserOrBranchId;
      if (user.role === "super_admin") {
        effectiveBranch =
          optionalBranchId && optionalBranchId !== ALL_BRANCHES_ID
            ? optionalBranchId
            : null;
      } else {
        effectiveBranch = user.branchId || null;
        if (!effectiveBranch) {
          return [];
        }
      }
    } else if (typeof currentUserOrBranchId === "string") {
      effectiveBranch =
        currentUserOrBranchId === ALL_BRANCHES_ID || currentUserOrBranchId === "all"
          ? null
          : currentUserOrBranchId;
    }

    try {
      let q;
      if (effectiveBranch) {
        q = query(
          collection(db, "enrollments"),
          where("branchId", "==", effectiveBranch)
        );
      } else {
        q = collection(db, "enrollments");
      }

      const snap = await getDocs(q);
      const firestoreList = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Enrollment)
      );

      saveLocalEnrollments(firestoreList);
      return firestoreList;
    } catch (e) {
      console.warn("Firestore getEnrollments fallback to local:", e);
      return getLocalEnrollments(effectiveBranch);
    }
  },

  /**
   * Fetch all enrollments for a specific student, scoped by user branch
   */
  async getEnrollmentsByStudentId(
    studentId: string,
    currentUser?: User | null
  ): Promise<Enrollment[]> {
    let list: Enrollment[] = [];
    try {
      const q = query(
        collection(db, "enrollments"),
        where("studentId", "==", studentId)
      );
      const snap = await getDocs(q);
      list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Enrollment));
    } catch (e) {
      console.warn("Firestore getEnrollmentsByStudentId fallback to local:", e);
      const allLocal = getLocalEnrollments(null);
      list = allLocal.filter((e) => e.studentId === studentId);
    }

    // Branch scoping
    if (currentUser && currentUser.role !== "super_admin") {
      const userBranch = currentUser.branchId;
      if (!userBranch) return [];
      list = list.filter((e) => e.branchId === userBranch);
    }

    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  /**
   * Get the single active enrollment of a student (if any)
   */
  async getActiveEnrollmentByStudentId(
    studentId: string,
    currentUser?: User | null
  ): Promise<Enrollment | null> {
    const list = await this.getEnrollmentsByStudentId(studentId, currentUser);
    const active = list.find((e) => e.status === "active");
    return active || null;
  },

  /**
   * Fetch all enrollments for a specific classroom with branch authorization check
   */
  async getEnrollmentsByClassroomId(
    classroomId: string,
    currentUser?: User | null
  ): Promise<Enrollment[]> {
    if (currentUser && currentUser.role !== "super_admin") {
      const classroom = await classroomService.getClassroomById(classroomId);
      if (classroom && classroom.branchId && classroom.branchId !== currentUser.branchId) {
        throw new Error("UNAUTHORIZED_BRANCH");
      }
    }

    try {
      const q = query(
        collection(db, "enrollments"),
        where("classroomId", "==", classroomId)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Enrollment));
    } catch (e) {
      console.warn("Firestore getEnrollmentsByClassroomId fallback to local:", e);
    }

    const all = getLocalEnrollments(
      currentUser && currentUser.role !== "super_admin" ? currentUser.branchId : null
    );
    return all.filter((e) => e.classroomId === classroomId);
  },

  /**
   * Fetch active enrollments count/list for a classroom
   */
  async getActiveEnrollmentsByClassroomId(
    classroomId: string,
    currentUser?: User | null
  ): Promise<Enrollment[]> {
    const all = await this.getEnrollmentsByClassroomId(classroomId, currentUser);
    return all.filter((e) => e.status === "active");
  },

  /**
   * Fetch enrollment by ID with branch authorization check
   */
  async getEnrollmentById(
    id: string,
    currentUser?: User | null
  ): Promise<Enrollment | null> {
    let enr: Enrollment | null = null;
    try {
      const snap = await getDoc(doc(db, "enrollments", id));
      if (snap.exists()) {
        enr = { id: snap.id, ...snap.data() } as Enrollment;
      }
    } catch (e) {
      console.warn("Firestore getEnrollmentById fallback to local:", e);
      const local = getLocalEnrollments(null);
      enr = local.find((e) => e.id === id) || null;
    }

    if (!enr) return null;

    if (currentUser && currentUser.role !== "super_admin") {
      let branchId = enr.branchId;
      if (!branchId) {
        const cls = await classroomService.getClassroomById(enr.classroomId);
        branchId = cls?.branchId;
      }
      if (!branchId || branchId !== currentUser.branchId) {
        throw new Error("UNAUTHORIZED_BRANCH");
      }
    }

    return enr;
  },

  /**
   * Create a new enrollment for a student into a classroom with branch authorization
   */
  async createEnrollment(
    data: Omit<Enrollment, "id" | "createdAt" | "updatedAt">,
    currentUserIdOrUser?: string | User | null,
    currentUserParam?: User | null
  ): Promise<Enrollment> {
    const { user, currentUserId } = resolveUser(currentUserIdOrUser, currentUserParam);

    // 1. Check if student already has an active enrollment
    if (data.status === "active") {
      const activeEnr = await this.getActiveEnrollmentByStudentId(data.studentId, user);
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

    if (!classroom.branchId) {
      throw new Error("CLASSROOM_BRANCH_REQUIRED");
    }

    // 3. Branch authorization check
    if (user && user.role !== "super_admin") {
      if (classroom.branchId !== user.branchId) {
        throw new Error("UNAUTHORIZED_BRANCH");
      }
      try {
        const studentSnap = await getDoc(doc(db, "students", data.studentId));
        if (studentSnap.exists()) {
          const sData = studentSnap.data();
          if (sData.branchId && sData.branchId !== user.branchId) {
            throw new Error("UNAUTHORIZED_BRANCH");
          }
        }
      } catch (err: any) {
        if (err.message === "UNAUTHORIZED_BRANCH") throw err;
      }
    }

    // 4. Validate classroom capacity
    if (classroom.capacity && classroom.capacity > 0) {
      const activeEnrollments = await this.getActiveEnrollmentsByClassroomId(
        data.classroomId,
        user
      );
      if (activeEnrollments.length >= classroom.capacity) {
        throw new Error("CLASS_CAPACITY_FULL");
      }
    }

    const now = new Date().toISOString();
    // Authoritatively derive branchId from classroom
    const newEnrollmentData: Omit<Enrollment, "id"> = {
      studentId: data.studentId,
      classroomId: data.classroomId,
      packageId: classroom.packageId || data.packageId,
      branchId: classroom.branchId,
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
      saveLocalEnrollments([created]);
      return created;
    } catch (e) {
      console.warn("Firestore createEnrollment fallback to local:", e);
      const newId = `enr-${Date.now()}`;
      const created: Enrollment = { id: newId, ...newEnrollmentData };
      saveLocalEnrollments([created]);
      return created;
    }
  },

  /**
   * Bulk enroll multiple students into classrooms with individual validation
   */
  async createEnrollments(
    items: Array<Omit<Enrollment, "id" | "createdAt" | "updatedAt">>,
    currentUserIdOrUser?: string | User | null,
    currentUserParam?: User | null
  ): Promise<Enrollment[]> {
    if (!items || items.length === 0) {
      return [];
    }

    const { user, currentUserId } = resolveUser(currentUserIdOrUser, currentUserParam);
    const now = new Date().toISOString();

    const classroomCache = new Map<string, Classroom>();

    // 1. Validate every item individually
    for (const item of items) {
      let cls = classroomCache.get(item.classroomId);
      if (!cls) {
        const fetched = await classroomService.getClassroomById(item.classroomId);
        if (!fetched) {
          throw new Error("CLASSROOM_NOT_FOUND");
        }
        cls = fetched;
        classroomCache.set(item.classroomId, cls);
      }

      if (cls.status !== "active") {
        throw new Error("CLASSROOM_NOT_ACTIVE");
      }

      if (!cls.branchId) {
        throw new Error("CLASSROOM_BRANCH_REQUIRED");
      }

      if (user && user.role !== "super_admin") {
        if (cls.branchId !== user.branchId) {
          throw new Error("UNAUTHORIZED_BRANCH");
        }
      }
    }

    // 2. Validate capacity per classroom
    for (const [clsId, cls] of classroomCache.entries()) {
      if (cls.capacity && cls.capacity > 0) {
        const activeInClass = await this.getActiveEnrollmentsByClassroomId(clsId, user);
        const incomingCount = items.filter(
          (i) => i.classroomId === clsId && (i.status === "active" || !i.status)
        ).length;
        if (activeInClass.length + incomingCount > cls.capacity) {
          throw new Error("CLASS_CAPACITY_FULL");
        }
      }
    }

    const preparedItems: Array<{
      docRef: any;
      newEnrollment: Enrollment;
      rawData: Omit<Enrollment, "id">;
    }> = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const cls = classroomCache.get(item.classroomId)!;
      const newDocRef = doc(collection(db, "enrollments"));
      const rawData: Omit<Enrollment, "id"> = {
        studentId: item.studentId,
        classroomId: item.classroomId,
        packageId: cls.packageId || item.packageId,
        branchId: cls.branchId, // Authoritative branch derived from individual classroom
        startDate: item.startDate || cls.startDate,
        expectedEndDate: item.expectedEndDate || cls.expectedEndDate,
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
      saveLocalEnrollments(createdList);
      return createdList;
    } catch (e) {
      console.warn("Firestore createEnrollments fallback to local:", e);
      const localCreated: Enrollment[] = preparedItems.map((p, idx) => ({
        ...p.newEnrollment,
        id: `enr-${Date.now()}-${idx}`,
      }));
      saveLocalEnrollments(localCreated);
      return localCreated;
    }
  },

  /**
   * Update enrollment details with branch authorization check
   */
  async updateEnrollment(
    id: string,
    updates: Partial<Enrollment>,
    currentUserIdOrUser?: string | User | null,
    currentUserParam?: User | null
  ): Promise<Enrollment> {
    const { user, currentUserId } = resolveUser(currentUserIdOrUser, currentUserParam);

    const existing = await this.getEnrollmentById(id, null);
    if (!existing) {
      throw new Error("ENROLLMENT_NOT_FOUND");
    }

    const existingClass = await classroomService.getClassroomById(existing.classroomId);
    const existingBranch = existing.branchId || existingClass?.branchId;

    // Disallow arbitrary branchId mutation directly
    delete (updates as any).branchId;

    // Branch authorization check
    if (user && user.role !== "super_admin") {
      if (existingBranch && existingBranch !== user.branchId) {
        throw new Error("UNAUTHORIZED_BRANCH");
      }
    }

    // If changing classroom, validate target class existence, active status & capacity
    if (updates.classroomId && updates.classroomId !== existing.classroomId) {
      const targetClass = await classroomService.getClassroomById(updates.classroomId);
      if (!targetClass) {
        throw new Error("CLASSROOM_NOT_FOUND");
      }
      if (targetClass.status !== "active") {
        throw new Error("CLASSROOM_NOT_ACTIVE");
      }
      if (!targetClass.branchId) {
        throw new Error("CLASSROOM_BRANCH_REQUIRED");
      }

      if (user && user.role !== "super_admin") {
        if (targetClass.branchId !== user.branchId) {
          throw new Error("UNAUTHORIZED_BRANCH");
        }
      }
      // Ordinary update cannot cross branches! Must use transfer workflow
      if (existingBranch && targetClass.branchId !== existingBranch) {
        throw new Error("UNAUTHORIZED_BRANCH");
      }

      if (targetClass.capacity && targetClass.capacity > 0) {
        const activeInTarget = await this.getActiveEnrollmentsByClassroomId(
          updates.classroomId,
          user
        );
        if (activeInTarget.length >= targetClass.capacity) {
          throw new Error("CLASS_CAPACITY_FULL");
        }
      }

      if (!updates.packageId && targetClass.packageId) {
        updates.packageId = targetClass.packageId;
      }
      updates.branchId = targetClass.branchId;
    }

    // If changing status to active, ensure no other active enrollment exists
    if (updates.status === "active" && existing.status !== "active") {
      const activeEnr = await this.getActiveEnrollmentByStudentId(
        existing.studentId,
        user
      );
      if (activeEnr && activeEnr.id !== id) {
        throw new Error("ACTIVE_ENROLLMENT_EXISTS");
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

    const updatedObj: Enrollment = { ...existing, ...updateData };
    saveLocalEnrollments([updatedObj]);
    return updatedObj;
  },

  /**
   * Change enrollment status (active, completed, paused, cancelled)
   */
  async setEnrollmentStatus(
    id: string,
    status: EnrollmentStatus,
    currentUserIdOrUser?: string | User | null,
    currentUserParam?: User | null
  ): Promise<Enrollment> {
    const updates: Partial<Enrollment> = { status };
    if (status === "completed") {
      updates.actualEndDate = new Date().toISOString().split("T")[0];
    }
    return this.updateEnrollment(id, updates, currentUserIdOrUser, currentUserParam);
  },

  /**
   * Transfer active enrollment to a new compatible class atomically using Firestore runTransaction
   */
  async transferEnrollment(params: {
    sourceEnrollmentId: string;
    targetClassroomId: string;
    effectiveDate: string;
    reason: string;
    currentUser?: User | null;
    user?: User | null;
    currentUserId?: string;
  }): Promise<{ newEnrollment: Enrollment; transfer: EnrollmentTransfer }> {
    const currentUser = params.currentUser || params.user || null;
    const currentUserId = params.currentUserId || currentUser?.id || "system";
    const { sourceEnrollmentId, targetClassroomId, effectiveDate, reason } = params;

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

        // 2. Confirm source enrollment status is active
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

        if (targetClassData.status !== "active") {
          throw new Error("CLASSROOM_NOT_ACTIVE");
        }

        if (!targetClassData.branchId) {
          throw new Error("CLASSROOM_BRANCH_REQUIRED");
        }

        if (targetClassroomId === sourceData.classroomId) {
          throw new Error("SAME_CLASS_TRANSFER");
        }

        if (targetClassData.packageId !== sourceData.packageId) {
          throw new Error("DIFFERENT_PACKAGE_TRANSFER");
        }

        // Resolve source branch
        let sourceBranch = sourceData.branchId;
        if (!sourceBranch) {
          const sourceClassRef = doc(db, "classrooms", sourceData.classroomId);
          const sourceClassDoc = await transaction.get(sourceClassRef);
          if (sourceClassDoc.exists()) {
            const sc = sourceClassDoc.data() as Classroom;
            sourceBranch = sc.branchId;
          }
        }

        // Branch authorization check
        if (currentUser && currentUser.role !== "super_admin") {
          if (!sourceBranch || sourceBranch !== currentUser.branchId) {
            throw new Error("UNAUTHORIZED_BRANCH");
          }
          if (targetClassData.branchId !== currentUser.branchId) {
            throw new Error("UNAUTHORIZED_BRANCH");
          }
        }

        // 4. Check target class capacity
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

        // 5. Create new target Enrollment with target classroom's branchId
        const newEnrollmentData: Omit<Enrollment, "id"> = {
          studentId: sourceData.studentId,
          classroomId: targetClassroomId,
          packageId: targetClassData.packageId,
          branchId: targetClassData.branchId,
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

        // 6. Update source enrollment
        transaction.update(sourceEnrollmentRef, {
          status: "transferred" as EnrollmentStatus,
          actualEndDate: effectiveDate,
          transferredAt: now,
          transferredToEnrollmentId: targetEnrollmentRef.id,
          updatedAt: now,
          updatedBy: currentUserId,
        });

        // 7. Create enrollment_transfers audit document with source & target branch IDs
        const transferData: Omit<EnrollmentTransfer, "id"> = {
          studentId: sourceData.studentId,
          sourceEnrollmentId,
          sourceClassroomId: sourceData.classroomId,
          sourceBranchId: sourceBranch,
          targetEnrollmentId: targetEnrollmentRef.id,
          targetClassroomId,
          targetBranchId: targetClassData.branchId,
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
        saveLocalEnrollments([createdEnrollment]);
        saveLocalTransfers([createdTransfer]);
        return { newEnrollment: createdEnrollment, transfer: createdTransfer };
      }
    } catch (e: any) {
      // Critical: Immediately rethrow validation and authorization errors!
      const knownErrors = [
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
      if (knownErrors.includes(e.message)) {
        throw e;
      }

      console.warn("Firestore transfer transaction fallback to local:", e);

      // Fallback to local storage handling if offline
      const localEnrollments = getLocalEnrollments(null);
      const source = localEnrollments.find((e) => e.id === sourceEnrollmentId);
      if (!source) throw new Error("SOURCE_ENROLLMENT_NOT_FOUND");
      if (source.status !== "active") throw new Error("SOURCE_ENROLLMENT_NOT_ACTIVE");

      const targetClass = await classroomService.getClassroomById(targetClassroomId);
      if (!targetClass) throw new Error("TARGET_CLASS_NOT_FOUND");
      if (targetClass.status !== "active") throw new Error("CLASSROOM_NOT_ACTIVE");
      if (!targetClass.branchId) throw new Error("CLASSROOM_BRANCH_REQUIRED");
      if (targetClass.packageId !== source.packageId) throw new Error("DIFFERENT_PACKAGE_TRANSFER");

      const sourceBranch = source.branchId;
      if (currentUser && currentUser.role !== "super_admin") {
        if (!sourceBranch || sourceBranch !== currentUser.branchId) {
          throw new Error("UNAUTHORIZED_BRANCH");
        }
        if (targetClass.branchId !== currentUser.branchId) {
          throw new Error("UNAUTHORIZED_BRANCH");
        }
      }

      const newEnrollmentId = `enr-${Date.now()}`;
      const transferId = `tr-${Date.now()}`;

      const newEnrollmentData: Enrollment = {
        id: newEnrollmentId,
        studentId: source.studentId,
        classroomId: targetClassroomId,
        packageId: targetClass.packageId,
        branchId: targetClass.branchId,
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
        sourceBranchId: sourceBranch,
        targetEnrollmentId: newEnrollmentId,
        targetClassroomId,
        targetBranchId: targetClass.branchId,
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
      saveLocalTransfers([transferData]);

      return { newEnrollment: newEnrollmentData, transfer: transferData };
    }

    throw new Error("TRANSFER_FAILED");
  },

  /**
   * Fetch all transfer audit records for a student, scoped by branch
   */
  async getTransfersByStudentId(
    studentId: string,
    currentUser?: User | null
  ): Promise<EnrollmentTransfer[]> {
    let list: EnrollmentTransfer[] = [];
    try {
      const q = query(
        collection(db, "enrollment_transfers"),
        where("studentId", "==", studentId)
      );
      const snap = await getDocs(q);
      list = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as EnrollmentTransfer)
      );
    } catch (e) {
      console.warn("Firestore getTransfersByStudentId fallback to local:", e);
      const local = getLocalTransfers(null);
      list = local.filter((t) => t.studentId === studentId);
    }

    // Branch scoping
    if (currentUser && currentUser.role !== "super_admin") {
      const branchId = currentUser.branchId;
      if (!branchId) return [];
      list = list.filter(
        (t) => t.sourceBranchId === branchId || t.targetBranchId === branchId
      );
    }

    return list.sort(
      (a, b) =>
        new Date(b.transferredAt).getTime() - new Date(a.transferredAt).getTime()
    );
  },

  /**
   * Delete enrollment record with branch authorization check
   */
  async deleteEnrollment(
    id: string,
    currentUserIdOrUser?: string | User | null,
    currentUserParam?: User | null
  ): Promise<void> {
    const { user } = resolveUser(currentUserIdOrUser, currentUserParam);

    const existing = await this.getEnrollmentById(id, null);
    if (!existing) {
      throw new Error("ENROLLMENT_NOT_FOUND");
    }

    if (user && user.role !== "super_admin") {
      let branch = existing.branchId;
      if (!branch) {
        const cls = await classroomService.getClassroomById(existing.classroomId);
        branch = cls?.branchId;
      }
      if (!branch || branch !== user.branchId) {
        throw new Error("UNAUTHORIZED_BRANCH");
      }
    }

    try {
      await deleteDoc(doc(db, "enrollments", id));
    } catch (e) {
      console.warn("Firestore deleteEnrollment fallback to local:", e);
    }

    const local = getLocalEnrollments(null);
    const filtered = local.filter((e) => e.id !== id);
    try {
      localStorage.setItem(ENROLLMENTS_STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error(e);
    }
  },
};
