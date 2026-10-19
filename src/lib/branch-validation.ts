import type { Branch } from "../models/branch.model.ts";

/**
 * Validates a branch code for presence, format, and uniqueness.
 */
export function validateBranchCode(
  code: string,
  currentId?: string,
  existingBranches: Branch[] = []
): { isValid: boolean; error?: "CODE_REQUIRED" | "CODE_EXISTS" } {
  const cleanCode = (code || "").trim().toUpperCase();
  if (!cleanCode) {
    return { isValid: false, error: "CODE_REQUIRED" };
  }

  const isDuplicate = existingBranches.some(
    (b) => b.id !== currentId && b.code.trim().toUpperCase() === cleanCode
  );

  if (isDuplicate) {
    return { isValid: false, error: "CODE_EXISTS" };
  }

  return { isValid: true };
}

/**
 * Validates required Khmer branch name.
 */
export function validateBranchName(
  nameKh: string
): { isValid: boolean; error?: "NAME_KH_REQUIRED" } {
  if (!nameKh || !nameKh.trim()) {
    return { isValid: false, error: "NAME_KH_REQUIRED" };
  }
  return { isValid: true };
}

/**
 * Checks whether a branch can be safely deleted.
 * Rules:
 * 1. Main campus cannot be deleted.
 * 2. Branches with active classrooms assigned cannot be deleted.
 */
export function canDeleteBranch(
  branchId: string,
  branches: Branch[],
  classrooms: Array<{ branchId?: string; status?: string }>
): {
  canDelete: boolean;
  reason?: "BRANCH_NOT_FOUND" | "CANNOT_DELETE_MAIN" | "BRANCH_IN_USE";
  activeClassCount?: number;
} {
  const target = branches.find((b) => b.id === branchId);
  if (!target) {
    return { canDelete: false, reason: "BRANCH_NOT_FOUND" };
  }

  if (target.isMain) {
    return { canDelete: false, reason: "CANNOT_DELETE_MAIN" };
  }

  const linkedClasses = classrooms.filter(
    (c) => c.branchId === branchId && c.status === "active"
  );

  if (linkedClasses.length > 0) {
    return {
      canDelete: false,
      reason: "BRANCH_IN_USE",
      activeClassCount: linkedClasses.length,
    };
  }

  return { canDelete: true };
}

/**
 * Filters a list of branches by search query and status.
 */
export function filterBranches(
  branches: Branch[],
  searchQuery: string,
  statusFilter: "all" | "active" | "inactive" = "all"
): Branch[] {
  const q = searchQuery.trim().toLowerCase();

  return branches.filter((branch) => {
    // 1. Status Filter
    if (statusFilter !== "all" && branch.status !== statusFilter) {
      return false;
    }

    // 2. Query Search
    if (q) {
      const matchCode = branch.code.toLowerCase().includes(q);
      const matchKh = (branch.nameKh || "").toLowerCase().includes(q);
      const matchEn = (branch.nameEn || "").toLowerCase().includes(q);
      const matchPhone = (branch.phone || "").toLowerCase().includes(q);
      const matchAddress = (branch.address || "").toLowerCase().includes(q);

      if (!matchCode && !matchKh && !matchEn && !matchPhone && !matchAddress) {
        return false;
      }
    }

    return true;
  });
}
