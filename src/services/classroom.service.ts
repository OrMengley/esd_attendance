import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { Classroom, ClassroomStatus } from "../models/classroom.model";
import { User } from "../models/user.model";
import { initialMockClassrooms } from "../data/classrooms.mock";
import {
  calculateSessionMinutes,
  calculateHoursPerWeek,
} from "../lib/classroom-schedule";

const CLASSROOMS_STORAGE_KEY = "esd_local_classrooms";

function getLocalClassrooms(): Classroom[] {
  try {
    const saved = localStorage.getItem(CLASSROOMS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(e);
  }
  return initialMockClassrooms;
}

function saveLocalClassrooms(classrooms: Classroom[]) {
  try {
    localStorage.setItem(CLASSROOMS_STORAGE_KEY, JSON.stringify(classrooms));
  } catch (e) {
    console.error("Failed to save classrooms to localStorage:", e);
  }
}

export const classroomService = {
  /**
   * Fetch all classrooms from Firestore with local fallback, optionally filtered by branchId
   */
  async getClassrooms(branchId?: string | null): Promise<Classroom[]> {
    let items: Classroom[] = [];
    try {
      const snap = await getDocs(collection(db, "classrooms"));
      if (!snap.empty) {
        items = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Classroom[];
        saveLocalClassrooms(items);
      } else {
        items = getLocalClassrooms();
      }
    } catch (e) {
      console.warn("Firestore getClassrooms fallback to local:", e);
      items = getLocalClassrooms();
    }

    if (branchId && branchId !== "all") {
      return items.filter((c) => c.branchId === branchId);
    }
    return items;
  },

  /**
   * Fetch single classroom by document ID with authorization check
   */
  async getClassroomById(
    id: string,
    currentUser?: User | null
  ): Promise<Classroom | null> {
    let classroom: Classroom | null = null;
    try {
      const snap = await getDoc(doc(db, "classrooms", id));
      if (snap.exists()) {
        classroom = { id: snap.id, ...snap.data() } as Classroom;
      }
    } catch (e) {
      console.warn("Firestore getClassroomById fallback to local:", e);
    }

    if (!classroom) {
      const local = getLocalClassrooms();
      classroom = local.find((c) => c.id === id) || null;
    }

    if (!classroom) return null;

    // Authorization verification
    if (currentUser && currentUser.role !== "super_admin") {
      if (currentUser.role === "admin" && classroom.branchId && classroom.branchId !== currentUser.branchId) {
        return null;
      }
      if (currentUser.role === "teacher") {
        const isAssigned =
          classroom.assignedTeacherId === currentUser.id ||
          currentUser.assignedClassroomIds?.includes(classroom.id);
        if (!isAssigned) {
          return null;
        }
      }
    }

    return classroom;
  },

  /**
   * Fetch classrooms assigned to a specific teacher
   */
  async getClassroomsByTeacher(teacherId: string): Promise<Classroom[]> {
    const all = await this.getClassrooms();
    return all.filter((c) => c.assignedTeacherId === teacherId);
  },

  /**
   * Create a new classroom in Firestore with branch authorization
   */
  async createClassroom(
    data: Omit<Classroom, "id" | "createdAt" | "updatedAt">,
    currentUserIdOrUser?: string | User | null,
    currentUserParam?: User | null
  ): Promise<Classroom> {
    const user = typeof currentUserIdOrUser === "object" ? currentUserIdOrUser : currentUserParam;
    const currentUserId = typeof currentUserIdOrUser === "string" ? currentUserIdOrUser : (user?.id || "system");

    // Enforce branch isolation for non-super_admins
    let branchId = data.branchId;
    if (user && user.role !== "super_admin") {
      if (!user.branchId) {
        throw new Error("UNAUTHORIZED_BRANCH");
      }
      if (data.branchId && data.branchId !== user.branchId) {
        throw new Error("UNAUTHORIZED_BRANCH");
      }
      branchId = user.branchId;
    }

    const cleanCode = data.code.trim().toUpperCase();
    const existing = await this.getClassrooms();
    const codeExists = existing.some(
      (c) => c.code.trim().toUpperCase() === cleanCode
    );

    if (codeExists) {
      throw new Error("CLASS_CODE_EXISTS");
    }

    const sessionMinutes =
      data.sessionMinutes || calculateSessionMinutes(data.startTime, data.endTime);
    const hoursPerWeek =
      data.hoursPerWeek || calculateHoursPerWeek(data.scheduleDays, sessionMinutes);

    const now = new Date().toISOString();
    const newClassroomData: Omit<Classroom, "id"> = {
      ...data,
      branchId,
      code: cleanCode,
      name: data.name.trim(),
      packageId: data.packageId,
      assignedTeacherId: data.assignedTeacherId,
      scheduleDays: data.scheduleDays,
      startTime: data.startTime,
      endTime: data.endTime,
      sessionMinutes,
      hoursPerWeek,
      startDate: data.startDate,
      expectedEndDate: data.expectedEndDate,
      capacity: data.capacity !== undefined ? Number(data.capacity) : undefined,
      status: data.status || "active",
      note: data.note ? data.note.trim() : "",
      createdAt: now,
      updatedAt: now,
      createdBy: currentUserId || "system",
      updatedBy: currentUserId || "system",
    };

    try {
      const docRef = await addDoc(collection(db, "classrooms"), newClassroomData);
      const created: Classroom = {
        id: docRef.id,
        ...newClassroomData,
      };
      const local = getLocalClassrooms();
      saveLocalClassrooms([created, ...local]);
      return created;
    } catch (e) {
      console.warn("Firestore createClassroom fallback to local:", e);
      const newId = `cls-${Date.now()}`;
      const created: Classroom = {
        id: newId,
        ...newClassroomData,
      };
      const local = getLocalClassrooms();
      saveLocalClassrooms([created, ...local]);
      return created;
    }
  },

  /**
   * Update an existing classroom with branch authorization
   */
  async updateClassroom(
    id: string,
    data: Partial<Classroom>,
    currentUserIdOrUser?: string | User | null,
    currentUserParam?: User | null
  ): Promise<Classroom> {
    const user = typeof currentUserIdOrUser === "object" ? currentUserIdOrUser : currentUserParam;
    const currentUserId = typeof currentUserIdOrUser === "string" ? currentUserIdOrUser : (user?.id || "system");

    const existing = await this.getClassroomById(id);
    if (!existing) {
      throw new Error("CLASSROOM_NOT_FOUND");
    }

    // Branch authorization check
    if (user && user.role !== "super_admin") {
      if (existing.branchId && existing.branchId !== user.branchId) {
        throw new Error("UNAUTHORIZED_BRANCH");
      }
      if (data.branchId && data.branchId !== existing.branchId) {
        throw new Error("BRANCH_REASSIGNMENT_NOT_ALLOWED");
      }
    }

    if (data.code) {
      const cleanCode = data.code.trim().toUpperCase();
      const existingList = await this.getClassrooms();
      const codeExists = existingList.some(
        (c) => c.id !== id && c.code.trim().toUpperCase() === cleanCode
      );
      if (codeExists) {
        throw new Error("CLASS_CODE_EXISTS");
      }
    }

    const updates: Partial<Classroom> = {
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUserId || "system",
    };

    if (updates.code) {
      updates.code = updates.code.trim().toUpperCase();
    }
    if (updates.name) {
      updates.name = updates.name.trim();
    }
    if (updates.startTime && updates.endTime) {
      updates.sessionMinutes = calculateSessionMinutes(updates.startTime, updates.endTime);
    }
    if (updates.scheduleDays && updates.sessionMinutes) {
      updates.hoursPerWeek = calculateHoursPerWeek(updates.scheduleDays, updates.sessionMinutes);
    }
    if (updates.capacity !== undefined) {
      updates.capacity = Number(updates.capacity);
    }

    try {
      await updateDoc(doc(db, "classrooms", id), updates);
    } catch (e) {
      console.warn("Firestore updateClassroom fallback to local:", e);
    }

    const local = getLocalClassrooms();
    let updatedObj: Classroom | null = null;
    const list = local.map((item) => {
      if (item.id === id) {
        updatedObj = { ...item, ...updates };
        return updatedObj;
      }
      return item;
    });
    saveLocalClassrooms(list);
    return updatedObj || ({ id, ...updates } as Classroom);
  },

  /**
   * Delete classroom with authorization check
   */
  async deleteClassroom(
    id: string,
    currentUser?: User | null
  ): Promise<void> {
    const existing = await this.getClassroomById(id);
    if (!existing) {
      throw new Error("CLASSROOM_NOT_FOUND");
    }

    if (currentUser && currentUser.role !== "super_admin") {
      if (existing.branchId && existing.branchId !== currentUser.branchId) {
        throw new Error("UNAUTHORIZED_BRANCH");
      }
    }

    try {
      await deleteDoc(doc(db, "classrooms", id));
    } catch (e) {
      console.warn("Firestore deleteClassroom fallback to local:", e);
    }

    const local = getLocalClassrooms();
    saveLocalClassrooms(local.filter((c) => c.id !== id));
  },

  /**
   * Set status of a classroom (active, completed, inactive)
   */
  async setClassroomStatus(
    id: string,
    status: ClassroomStatus,
    currentUserId?: string,
    currentUser?: User | null
  ): Promise<Classroom> {
    const updates: Partial<Classroom> = { status };
    if (status === "completed") {
      updates.actualEndDate = new Date().toISOString().split("T")[0];
    }
    return this.updateClassroom(id, updates, currentUserId, currentUser);
  },
};

