import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { Branch } from "../models/branch.model";
import { branchService } from "../services/branch.service";
import { useAuth } from "./auth-context";

export const ALL_BRANCHES_ID = "all";
const ACTIVE_BRANCH_STORAGE_KEY = "esd_active_branch_id";

interface BranchContextType {
  currentBranchId: string;
  currentBranch: Branch | null;
  branches: Branch[];
  isLoading: boolean;
  isAllBranches: boolean;
  canSelectAll: boolean;
  isLockedToBranch: boolean;
  setBranchId: (branchId: string) => void;
  refreshBranches: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export const BranchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    try {
      return localStorage.getItem(ACTIVE_BRANCH_STORAGE_KEY) || ALL_BRANCHES_ID;
    } catch {
      return ALL_BRANCHES_ID;
    }
  });

  const loadBranches = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await branchService.getBranches();
      // Only keep active branches in selector
      setBranches(list.filter((b) => b.status === "active"));
    } catch (e) {
      console.error("Failed to load branches in BranchProvider:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  // Determine permissions based on user role:
  // Super Admin has full multi-branch access and can view "All Branches"
  // Admin and Teacher are both strictly locked to their assigned branch
  const isSuperAdmin = user?.role === "super_admin";
  const isLockedToBranch = !isSuperAdmin;
  const canSelectAll = isSuperAdmin;

  // Active branch ID resolution
  const currentBranchId = useMemo(() => {
    if (isLockedToBranch) {
      // Non-super-admins (admin, teacher) are strictly locked to their assigned branch
      return user?.branchId || "";
    }

    return selectedBranchId;
  }, [isLockedToBranch, user?.branchId, selectedBranchId]);

  const setBranchId = (branchId: string) => {
    if (isLockedToBranch) return; // Only super admin can change branches
    if (branchId === ALL_BRANCHES_ID && !canSelectAll) return;

    setSelectedBranchId(branchId);
    try {
      localStorage.setItem(ACTIVE_BRANCH_STORAGE_KEY, branchId);
    } catch (e) {
      console.error("Failed to persist active branch ID:", e);
    }
  };

  const currentBranch = useMemo(() => {
    if (currentBranchId === ALL_BRANCHES_ID || !currentBranchId) return null;
    return branches.find((b) => b.id === currentBranchId) || null;
  }, [currentBranchId, branches]);

  const isAllBranches = currentBranchId === ALL_BRANCHES_ID;

  return (
    <BranchContext.Provider
      value={{
        currentBranchId,
        currentBranch,
        branches,
        isLoading,
        isAllBranches,
        canSelectAll,
        isLockedToBranch,
        setBranchId,
        refreshBranches: loadBranches,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
};

export function useBranch(): BranchContextType {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error("useBranch must be used within a BranchProvider");
  }
  return context;
}
