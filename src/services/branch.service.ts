import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { Branch, BranchStatus } from "../models/branch.model";
import { initialMockBranches } from "../data/branches.mock";
import { classroomService } from "./classroom.service";
import {
  validateBranchCode,
  validateBranchName,
  canDeleteBranch,
} from "../lib/branch-validation";

const BRANCHES_STORAGE_KEY = "esd_local_branches";

function getLocalBranches(): Branch[] {
  try {
    const saved = localStorage.getItem(BRANCHES_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Failed to parse local branches:", e);
  }
  return initialMockBranches;
}

function saveLocalBranches(branches: Branch[]) {
  try {
    localStorage.setItem(BRANCHES_STORAGE_KEY, JSON.stringify(branches));
  } catch (e) {
    console.error("Failed to save branches to localStorage:", e);
  }
}

export const branchService = {
  /**
   * Fetch all branches from Firestore with local fallback
   */
  async getBranches(): Promise<Branch[]> {
    try {
      const snap = await getDocs(collection(db, "branches"));
      if (!snap.empty) {
        const firestoreList = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Branch)
        );
        saveLocalBranches(firestoreList);
        return firestoreList.sort((a, b) => {
          if (a.isMain) return -1;
          if (b.isMain) return 1;
          return a.code.localeCompare(b.code);
        });
      }
    } catch (e) {
      console.warn("Firestore getBranches fallback to local:", e);
    }

    const local = getLocalBranches();
    return local.sort((a, b) => {
      if (a.isMain) return -1;
      if (b.isMain) return 1;
      return a.code.localeCompare(b.code);
    });
  },

  /**
   * Fetch active branches
   */
  async getActiveBranches(): Promise<Branch[]> {
    const all = await this.getBranches();
    return all.filter((b) => b.status === "active");
  },

  /**
   * Fetch single branch by ID
   */
  async getBranchById(id: string): Promise<Branch | null> {
    try {
      const snap = await getDoc(doc(db, "branches", id));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Branch;
      }
    } catch (e) {
      console.warn("Firestore getBranchById fallback to local:", e);
    }

    const local = getLocalBranches();
    return local.find((b) => b.id === id) || null;
  },

  /**
   * Create a new branch
   */
  async createBranch(
    data: Omit<Branch, "id" | "createdAt" | "updatedAt">,
    currentUserId?: string
  ): Promise<Branch> {
    const existing = await this.getBranches();

    // 1. Validation
    const nameValidation = validateBranchName(data.nameKh);
    if (!nameValidation.isValid) {
      throw new Error(nameValidation.error);
    }

    const codeValidation = validateBranchCode(data.code, undefined, existing);
    if (!codeValidation.isValid) {
      throw new Error(codeValidation.error);
    }

    const now = new Date().toISOString();
    const cleanCode = data.code.trim().toUpperCase();
    const cleanNameKh = data.nameKh.trim();
    const cleanNameEn = (data.nameEn || "").trim();
    const cleanPhone = (data.phone || "").trim();
    const cleanEmail = (data.email || "").trim();
    const cleanAddress = (data.address || "").trim();
    const isMain = Boolean(data.isMain);
    const status: BranchStatus = data.status || "active";

    // If setting this new branch as main, unset isMain on other branches
    let updatedExisting = existing;
    if (isMain) {
      updatedExisting = existing.map((b) => (b.isMain ? { ...b, isMain: false } : b));
    }

    const newBranchPayload: Omit<Branch, "id"> = {
      code: cleanCode,
      nameKh: cleanNameKh,
      nameEn: cleanNameEn,
      phone: cleanPhone,
      email: cleanEmail,
      address: cleanAddress,
      isMain,
      status,
      createdAt: now,
      updatedAt: now,
      createdBy: currentUserId || "system",
      updatedBy: currentUserId || "system",
    };

    try {
      // If isMain changed, batch update existing main in Firestore
      if (isMain) {
        const prevMain = existing.find((b) => b.isMain);
        if (prevMain) {
          try {
            await updateDoc(doc(db, "branches", prevMain.id), {
              isMain: false,
              updatedAt: now,
              updatedBy: currentUserId || "system",
            });
          } catch (err) {
            console.warn("Failed to unset previous main branch in Firestore:", err);
          }
        }
      }

      const docRef = await addDoc(collection(db, "branches"), newBranchPayload);
      const created: Branch = { id: docRef.id, ...newBranchPayload };
      saveLocalBranches([created, ...updatedExisting]);
      return created;
    } catch (e) {
      console.warn("Firestore createBranch fallback to local:", e);
      const newId = `branch-${Date.now()}`;
      const created: Branch = { id: newId, ...newBranchPayload };
      saveLocalBranches([created, ...updatedExisting]);
      return created;
    }
  },

  /**
   * Update existing branch
   */
  async updateBranch(
    id: string,
    updates: Partial<Branch>,
    currentUserId?: string
  ): Promise<Branch> {
    const existing = await this.getBranches();
    const target = existing.find((b) => b.id === id);
    if (!target) {
      throw new Error("BRANCH_NOT_FOUND");
    }

    if (updates.code) {
      const codeValidation = validateBranchCode(updates.code, id, existing);
      if (!codeValidation.isValid) {
        throw new Error(codeValidation.error);
      }
    }

    if (updates.nameKh !== undefined) {
      const nameValidation = validateBranchName(updates.nameKh);
      if (!nameValidation.isValid) {
        throw new Error(nameValidation.error);
      }
    }

    const now = new Date().toISOString();
    const updatePayload: Partial<Branch> = {
      ...updates,
      updatedAt: now,
      updatedBy: currentUserId || "system",
    };

    if (updates.code) {
      updatePayload.code = updates.code.trim().toUpperCase();
    }
    if (updates.nameKh) {
      updatePayload.nameKh = updates.nameKh.trim();
    }
    if (updates.nameEn !== undefined) {
      updatePayload.nameEn = updates.nameEn.trim();
    }
    if (updates.phone !== undefined) {
      updatePayload.phone = updates.phone.trim();
    }
    if (updates.email !== undefined) {
      updatePayload.email = updates.email.trim();
    }
    if (updates.address !== undefined) {
      updatePayload.address = updates.address.trim();
    }

    // Handle isMain switch
    if (updates.isMain === true) {
      const prevMain = existing.find((b) => b.isMain && b.id !== id);
      if (prevMain) {
        try {
          await updateDoc(doc(db, "branches", prevMain.id), {
            isMain: false,
            updatedAt: now,
            updatedBy: currentUserId || "system",
          });
        } catch (err) {
          console.warn("Failed to unset previous main branch in Firestore:", err);
        }
      }
    }

    try {
      await updateDoc(doc(db, "branches", id), updatePayload);
    } catch (e) {
      console.warn("Firestore updateBranch fallback to local:", e);
    }

    let updatedObj: Branch | null = null;
    const updatedList = existing.map((item) => {
      if (item.id === id) {
        updatedObj = { ...item, ...updatePayload };
        return updatedObj;
      }
      if (updates.isMain === true && item.isMain) {
        return { ...item, isMain: false };
      }
      return item;
    });

    saveLocalBranches(updatedList);
    return updatedObj || ({ ...target, ...updatePayload } as Branch);
  },

  /**
   * Set branch active/inactive status
   */
  async setBranchStatus(
    id: string,
    status: BranchStatus,
    currentUserId?: string
  ): Promise<Branch> {
    return this.updateBranch(id, { status }, currentUserId);
  },

  /**
   * Delete branch with safety guards
   */
  async deleteBranch(
    id: string,
    currentUserId?: string
  ): Promise<{ success: boolean; error?: string; activeClassCount?: number }> {
    const [allBranches, allClasses] = await Promise.all([
      this.getBranches(),
      classroomService.getClassrooms(),
    ]);

    const check = canDeleteBranch(id, allBranches, allClasses);
    if (!check.canDelete) {
      return {
        success: false,
        error: check.reason,
        activeClassCount: check.activeClassCount,
      };
    }

    try {
      await deleteDoc(doc(db, "branches", id));
    } catch (e) {
      console.warn("Firestore deleteBranch fallback to local:", e);
    }

    const remaining = allBranches.filter((b) => b.id !== id);
    saveLocalBranches(remaining);
    return { success: true };
  },
};
