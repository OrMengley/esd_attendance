import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateBranchCode,
  validateBranchName,
  canDeleteBranch,
  filterBranches,
} from "../src/lib/branch-validation.ts";
import type { Branch } from "../src/models/branch.model.ts";

describe("Branch Management Unit Tests", () => {
  const mockBranches: Branch[] = [
    {
      id: "br-1",
      code: "ESD-MAIN",
      nameKh: "សាខាកណ្តាល",
      nameEn: "Main Campus",
      phone: "012345678",
      address: "Wat Soriyaram",
      isMain: true,
      status: "active",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "br-2",
      code: "ESD-BTB",
      nameKh: "សាខាបាត់ដំបង",
      nameEn: "Battambang Branch",
      phone: "098765432",
      address: "Battambang City",
      isMain: false,
      status: "active",
      createdAt: "2026-01-15T00:00:00.000Z",
    },
    {
      id: "br-3",
      code: "ESD-SR",
      nameKh: "សាខាសៀមរាប",
      nameEn: "Siem Reap Branch",
      isMain: false,
      status: "inactive",
      createdAt: "2026-02-01T00:00:00.000Z",
    },
  ];

  it("validates branch code presence and duplicate prevention", () => {
    // Empty code
    const emptyRes = validateBranchCode("", undefined, mockBranches);
    assert.strictEqual(emptyRes.isValid, false);
    assert.strictEqual(emptyRes.error, "CODE_REQUIRED");

    // Existing code
    const duplicateRes = validateBranchCode("ESD-BTB", undefined, mockBranches);
    assert.strictEqual(duplicateRes.isValid, false);
    assert.strictEqual(duplicateRes.error, "CODE_EXISTS");

    // Case-insensitive duplicate check
    const caseInsensitiveRes = validateBranchCode("esd-main", undefined, mockBranches);
    assert.strictEqual(caseInsensitiveRes.isValid, false);
    assert.strictEqual(caseInsensitiveRes.error, "CODE_EXISTS");

    // Same code allowed when editing same branch
    const sameEditRes = validateBranchCode("ESD-BTB", "br-2", mockBranches);
    assert.strictEqual(sameEditRes.isValid, true);

    // New unique code
    const uniqueRes = validateBranchCode("ESD-KPC", undefined, mockBranches);
    assert.strictEqual(uniqueRes.isValid, true);
  });

  it("validates required Khmer branch name", () => {
    assert.strictEqual(validateBranchName("").isValid, false);
    assert.strictEqual(validateBranchName("   ").isValid, false);
    assert.strictEqual(validateBranchName("សាខាភ្នំពេញ").isValid, true);
  });

  it("safeguards deletion of main campus and branches in use", () => {
    const mockClassrooms = [
      { branchId: "br-2", status: "active" },
      { branchId: "br-3", status: "completed" },
    ];

    // Cannot delete main campus
    const mainDel = canDeleteBranch("br-1", mockBranches, mockClassrooms);
    assert.strictEqual(mainDel.canDelete, false);
    assert.strictEqual(mainDel.reason, "CANNOT_DELETE_MAIN");

    // Cannot delete branch in use by active classrooms
    const inUseDel = canDeleteBranch("br-2", mockBranches, mockClassrooms);
    assert.strictEqual(inUseDel.canDelete, false);
    assert.strictEqual(inUseDel.reason, "BRANCH_IN_USE");
    assert.strictEqual(inUseDel.activeClassCount, 1);

    // Can delete unused branch (br-3 has only completed classrooms)
    const unusedDel = canDeleteBranch("br-3", mockBranches, mockClassrooms);
    assert.strictEqual(unusedDel.canDelete, true);
  });

  it("filters branches correctly by search query and status", () => {
    // Status filter
    const activeOnly = filterBranches(mockBranches, "", "active");
    assert.strictEqual(activeOnly.length, 2);

    const inactiveOnly = filterBranches(mockBranches, "", "inactive");
    assert.strictEqual(inactiveOnly.length, 1);
    assert.strictEqual(inactiveOnly[0].id, "br-3");

    // Search by code
    const byCode = filterBranches(mockBranches, "BTB", "all");
    assert.strictEqual(byCode.length, 1);
    assert.strictEqual(byCode[0].id, "br-2");

    // Search by Khmer name
    const byKhmer = filterBranches(mockBranches, "សៀមរាប", "all");
    assert.strictEqual(byKhmer.length, 1);
    assert.strictEqual(byKhmer[0].id, "br-3");
  });
});
