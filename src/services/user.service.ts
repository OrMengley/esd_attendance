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
} from "firebase/firestore";
import { db } from "../firebase/config";
import { User, UserRole, UserStatus } from "../models/user.model";
import { classroomService } from "./classroom.service";

export const userService = {
  /**
   * Fetch all users directly from Firestore 'users' collection
   */
  async getUsers(): Promise<User[]> {
    try {
      const snap = await getDocs(collection(db, "users"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as User));

      // Sort: super_admin first, then admin, then teachers, then by creation date
      return list.sort((a, b) => {
        const roleOrder: Record<string, number> = { super_admin: 1, admin: 2, teacher: 3 };
        const orderDiff = (roleOrder[a.role] ?? 99) - (roleOrder[b.role] ?? 99);
        if (orderDiff !== 0) return orderDiff;
        return (b.createdAt || "").localeCompare(a.createdAt || "");
      });
    } catch (e) {
      console.error("Firestore getUsers error:", e);
      throw e;
    }
  },

  /**
   * Fetch users filtered by role from Firestore, optionally filtered by branchId
   */
  async getUsersByRole(role: UserRole, branchId?: string | null): Promise<User[]> {
    try {
      const q = query(collection(db, "users"), where("role", "==", role));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as User));
      if (branchId && branchId !== "all") {
        return list.filter((u) => u.branchId === branchId);
      }
      return list;
    } catch (e) {
      console.error(`Firestore getUsersByRole(${role}) error:`, e);
      throw e;
    }
  },

  /**
   * Convenience method to fetch teacher users
   */
  async getTeachers(branchId?: string | null): Promise<User[]> {
    return this.getUsersByRole("teacher", branchId);
  },

  /**
   * Convenience method to fetch active teacher users sorted alphabetically by name
   */
  async getActiveTeachers(branchId?: string | null): Promise<User[]> {
    const teachers = await this.getTeachers(branchId);
    return teachers
      .filter((u) => u.role === "teacher" && u.status === "active")
      .sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", undefined, {
          sensitivity: "base",
        })
      );
  },

  /**
   * Fetch single user by document ID from Firestore
   */
  async getUserById(id: string): Promise<User | null> {
    if (!id || id === "system") return null;
    try {
      const snap = await getDoc(doc(db, "users", id));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as User;
      }
      return null;
    } catch (e) {
      console.error(`Firestore getUserById(${id}) error:`, e);
      return null;
    }
  },

  /**
   * Fetch multiple users by IDs from Firestore and return a key-value record
   */
  async getUsersByIds(ids: string[]): Promise<Record<string, User>> {
    const validIds = Array.from(
      new Set(ids.filter((id) => id && typeof id === "string" && id.trim().length > 0 && id !== "system"))
    );
    if (validIds.length === 0) return {};

    const result: Record<string, User> = {};
    const fetchPromises = validIds.map(async (id) => {
      const user = await this.getUserById(id);
      if (user) {
        result[id] = user;
      }
    });

    await Promise.all(fetchPromises);
    return result;
  },

  /**
   * Fetch user by username (case-insensitive check against Firestore collection)
   */
  async getUserByUsername(username: string): Promise<User | null> {
    const trimmed = username.trim().toLowerCase();
    try {
      const snap = await getDocs(collection(db, "users"));
      const found = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as User))
        .find((u) => u.username?.toLowerCase() === trimmed);
      return found || null;
    } catch (e) {
      console.error(`Firestore getUserByUsername(${username}) error:`, e);
      return null;
    }
  },

  /**
   * Create user in Firestore with auto-generated ID saved to 'id' field
   */
  async createUser(
    userData: Omit<User, "id" | "createdAt" | "updatedAt">,
    currentUser?: User | null
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    const trimmedUsername = userData.username.trim();

    // Check duplicate username (case-insensitive)
    const existing = await this.getUserByUsername(trimmedUsername);
    if (existing) {
      return {
        success: false,
        error: "usernameExists",
      };
    }

    // Role & branch authorization for non-super-admins
    if (currentUser && currentUser.role !== "super_admin") {
      if (userData.role !== "teacher") {
        return { success: false, error: "UNAUTHORIZED_ROLE" };
      }
      if (!currentUser.branchId || (userData.branchId && userData.branchId !== currentUser.branchId)) {
        return { success: false, error: "UNAUTHORIZED_BRANCH" };
      }
    }

    const now = new Date().toISOString();
    const cleanData: Omit<User, "id"> = {
      name: userData.name.trim(),
      username: trimmedUsername,
      password: userData.password.trim(),
      email: userData.email?.trim() || "",
      phone: userData.phone?.trim() || "",
      role: userData.role,
      avatarUrl: userData.avatarUrl || "",
      branchId: (currentUser && currentUser.role !== "super_admin")
        ? (currentUser.branchId || "")
        : (userData.branchId?.trim() || ""),
      assignedClassroomIds: userData.assignedClassroomIds || [],
      status: userData.status || "active",
      lastLogin: "",
      createdAt: now,
      updatedAt: now,
      createdBy: currentUser?.id || "system",
      updatedBy: currentUser?.id || "system",
    };

    try {
      // 1. Create document in Firestore
      const docRef = await addDoc(collection(db, "users"), cleanData);
      // 2. Save document ID to id field
      await updateDoc(docRef, { id: docRef.id });

      const newUser: User = { id: docRef.id, ...cleanData };
      return { success: true, user: newUser };
    } catch (e) {
      console.error("Firestore createUser error:", e);
      return { success: false, error: "saveError" };
    }
  },

  /**
   * Update existing user in Firestore
   */
  async updateUser(
    id: string,
    userData: Partial<User>,
    currentUser?: User | null
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    const targetUser = await this.getUserById(id);
    if (!targetUser) {
      return { success: false, error: "userNotFound" };
    }

    // Branch authorization check for non-super-admins
    if (currentUser && currentUser.role !== "super_admin") {
      if (targetUser.branchId && targetUser.branchId !== currentUser.branchId) {
        return { success: false, error: "UNAUTHORIZED_BRANCH" };
      }
      if (targetUser.role !== "teacher" && targetUser.id !== currentUser.id) {
        return { success: false, error: "UNAUTHORIZED_ROLE" };
      }
      if (userData.role && userData.role !== "teacher" && targetUser.role === "teacher") {
        return { success: false, error: "UNAUTHORIZED_ROLE" };
      }
      if (userData.branchId && userData.branchId !== targetUser.branchId) {
        return { success: false, error: "BRANCH_REASSIGNMENT_NOT_ALLOWED" };
      }
    }

    // If username is being changed, check for duplicate excluding current user ID
    if (userData.username) {
      const trimmedUsername = userData.username.trim();
      const existing = await this.getUserByUsername(trimmedUsername);
      if (existing && existing.id !== id) {
        return {
          success: false,
          error: "usernameExists",
        };
      }
    }

    const now = new Date().toISOString();
    const updateData: Partial<User> = {
      ...userData,
      updatedAt: now,
      updatedBy: currentUser?.id || "system",
    };

    if (updateData.name !== undefined) updateData.name = updateData.name.trim();
    if (updateData.username !== undefined) updateData.username = updateData.username.trim();
    if (updateData.password !== undefined) updateData.password = updateData.password.trim();
    if (updateData.email !== undefined) updateData.email = updateData.email ? updateData.email.trim() : "";
    if (updateData.phone !== undefined) updateData.phone = updateData.phone ? updateData.phone.trim() : "";
    if (updateData.branchId !== undefined) updateData.branchId = updateData.branchId ? updateData.branchId.trim() : "";

    // Strip undefined properties to prevent Firestore updateDoc crashes
    const cleanedUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        cleanedUpdates[key] = value;
      }
    }

    try {
      await updateDoc(doc(db, "users", id), cleanedUpdates);
      const updatedUser = await this.getUserById(id);
      return { success: true, user: updatedUser || ({ id, ...cleanedUpdates } as User) };
    } catch (e) {
      console.error("Firestore updateUser error:", e);
      return { success: false, error: "saveError" };
    }
  },

  /**
   * Toggle user active/inactive status in Firestore
   */
  async toggleStatus(id: string, currentUser?: User | null): Promise<User | null> {
    const user = await this.getUserById(id);
    if (!user) return null;
    const newStatus: UserStatus = user.status === "active" ? "inactive" : "active";
    const res = await this.updateUser(id, { status: newStatus }, currentUser);
    return res.user || null;
  },

  /**
   * Delete user with safeguards for super_admin, self-deletion, and assigned teachers
   */
  async deleteUser(
    id: string,
    currentUser?: User | null
  ): Promise<{ success: boolean; deactivated?: boolean; error?: string }> {
    const targetUser = await this.getUserById(id);
    if (!targetUser) {
      return { success: false, error: "userNotFound" };
    }

    // Branch authorization check for non-super-admins
    if (currentUser && currentUser.role !== "super_admin") {
      if (targetUser.branchId && targetUser.branchId !== currentUser.branchId) {
        return { success: false, error: "UNAUTHORIZED_BRANCH" };
      }
      if (targetUser.role !== "teacher") {
        return { success: false, error: "cannotDeleteAdmin" };
      }
    }

    // Safety 1: Cannot delete super_admin
    if (targetUser.role === "super_admin") {
      return { success: false, error: "cannotDeleteSuperAdmin" };
    }

    // Safety 2: Cannot delete own account
    if (currentUser && targetUser.id === currentUser.id) {
      return { success: false, error: "cannotDeleteSelf" };
    }

    // Safety 3: Check if teacher is assigned to classrooms
    let hasAssignedClasses = (targetUser.assignedClassroomIds || []).length > 0;
    if (!hasAssignedClasses && targetUser.role === "teacher") {
      try {
        const allClasses = await classroomService.getClassrooms();
        hasAssignedClasses = allClasses.some((c) => c.assignedTeacherId === id);
      } catch (err) {
        console.warn("Checking classrooms for teacher deletion:", err);
      }
    }

    // If teacher is assigned to classrooms, deactivate instead of hard delete
    if (hasAssignedClasses && targetUser.role === "teacher") {
      await this.updateUser(id, { status: "inactive" }, currentUser);
      return { success: true, deactivated: true };
    }

    // Permanent deletion from Firestore
    try {
      await deleteDoc(doc(db, "users", id));
      return { success: true, deactivated: false };
    } catch (e) {
      console.error("Firestore deleteDoc error:", e);
      return { success: false, error: "deleteError" };
    }
  },
};
