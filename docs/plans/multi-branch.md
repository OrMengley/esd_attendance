# Implementation Plan: Multi-Branch School Management

**Status:** Implemented  
**Author:** AI Agent (Pair Programming)  
**Date:** 2026-10-18  
**Target Feature:** Multi-Branch School Administration (CRUD)  
**Reference Documents:** `AGENTS.md`, `docs/PROJECT.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN-SYSTEM.md`

---

## 1. Executive Summary & Requirements

### Goal
Empower school administrators (`super_admin` and `admin` roles) to configure, manage, and monitor multiple school branches/campuses (e.g., Main Campus, Phnom Penh Branch, Battambang Branch, Siem Reap Branch).

### Key Requirements
1. **Admin-Only Role Access:**
   - Only `super_admin` and `admin` can access the Branches management page, create, update, or delete branches.
   - Teachers are strictly prohibited and redirected or blocked by route guards.
2. **Full CRUD Operations:**
   - **Create:** Add new branches with code, Khmer name, English name, contact info (phone, email, address), and main campus indicator.
   - **Read / List:** View all branches with real-time status, stats (e.g., active classrooms count), and quick filtering/searching.
   - **Update:** Edit branch details, toggle active/inactive status, and change the designated main campus.
   - **Delete:** Safely remove a branch with referential integrity checks (prevent deleting the main campus or branches with active classrooms/students; prompt deactivation instead).
3. **Entity Relationships & Backward Compatibility:**
   - Establish relationship with `Classroom` (`branchId?: string`).
   - Existing classrooms without a `branchId` continue to work without disruption.
   - Optional branch assignment during class creation/editing in `ClassroomFormPage`.
4. **Bilingual Localization:**
   - All labels, descriptions, table headers, forms, validation errors, and toasts fully translated in Khmer (`km`) and English (`en`).
5. **Architectural & Design Consistency:**
   - Follow established `src/services/` conventions (Firestore collection `"branches"` + local storage fallback `"esd_local_branches"`).
   - Reuse existing UI components (`PageHeader`, `Card`, `Badge`, `Button`, `Input`, `Dialog`, `ConfirmDialog`, `StatusBadge`).

---

## 2. Domain Model & Data Architecture

### A. New Entity: `Branch` (`src/models/branch.model.ts`)
```typescript
export type BranchStatus = "active" | "inactive";

export interface Branch {
  id: string;
  code: string;           // Unique branch identifier (e.g., "ESD-MAIN", "ESD-PP", "ESD-BTB")
  nameKh: string;         // Khmer name (e.g., "សាខាកណ្តាល", "សាខាភ្នំពេញ")
  nameEn?: string;        // English name (e.g., "Main Campus", "Phnom Penh Branch")
  phone?: string;         // Contact phone number
  email?: string;         // Contact email address
  address?: string;       // Physical location / street address
  isMain: boolean;        // Whether this is the primary/headquarters branch (default: false)
  status: BranchStatus;   // "active" | "inactive"
  createdAt: string;      // ISO 8601
  updatedAt?: string;     // ISO 8601
  createdBy?: string;
  updatedBy?: string;
}
```

### B. Relationship Updates to Existing Models
- **`Classroom`** ([`src/models/classroom.model.ts`](file:///Users/noii/Documents/work/dambang/esd_attendance/src/models/classroom.model.ts)):
  ```typescript
  export interface Classroom {
    // ... existing fields ...
    branchId?: string; // Optional reference to Branch.id
  }
  ```
- **`User`** ([`src/models/user.model.ts`](file:///Users/noii/Documents/work/dambang/esd_attendance/src/models/user.model.ts)):
  ```typescript
  export interface User {
    // ... existing fields ...
    branchId?: string; // Optional home branch for staff
  }
  ```
- **`Student`** ([`src/models/student.model.ts`](file:///Users/noii/Documents/work/dambang/esd_attendance/src/models/student.model.ts)):
  ```typescript
  export interface Student {
    // ... existing fields ...
    branchId?: string; // Optional primary branch for registered student
  }
  ```

---

## 3. Safe Deletion & Referential Integrity Strategy

To adhere to `AGENTS.md` rules regarding history preservation:
1. **Main Branch Protection:**
   - A branch marked as `isMain: true` cannot be deleted. The system requires another branch to be designated as main first.
2. **Active Dependency Check:**
   - Before deleting, the service inspects whether any active classrooms or registered students are linked to `branchId`.
   - If referenced: Deletion is blocked with a friendly explanation (`BRANCH_IN_USE`), offering the administrator the option to **Deactivate** the branch (`status: "inactive"`) instead.
3. **Firestore & Local Storage Sync:**
   - Deletion removes the document from Firestore `deleteDoc(doc(db, "branches", id))` and updates `localStorage`.

---

## 4. Service Layer: `branch.service.ts`

**Path:** `src/services/branch.service.ts`

### API Surface
| Method | Description |
|---|---|
| `getBranches()` | Fetches all branches from Firestore `"branches"`, caches in localStorage (`"esd_local_branches"`), seeds default main campus if empty. |
| `getActiveBranches()` | Returns only branches with `status === "active"`. |
| `getBranchById(id: string)` | Returns single branch or `null`. |
| `createBranch(data, currentUserId)` | Validates required `nameKh`, uniqueness of `code`. If `isMain` is true, unset previous main branch atomically. |
| `updateBranch(id, updates, currentUserId)` | Validates code uniqueness against other records. Handles `isMain` migration. |
| `setBranchStatus(id, status, currentUserId)` | Quick activate/deactivate toggle. |
| `deleteBranch(id, currentUserId)` | Checks safety rules (not main, no linked classrooms/students) and executes deletion. |

---

## 5. UI/UX Flow & Component Architecture

### A. Navigation & Route Guarding
1. **Route Definition:**
   - Path: `/branches` in [`src/routes/index.tsx`](file:///Users/noii/Documents/work/dambang/esd_attendance/src/routes/index.tsx).
   - Enclosed inside `<ProtectedRoute allowedRoles={["super_admin", "admin"]} />`.
2. **Sidebar Navigation:**
   - In [`src/components/layout/app-sidebar.tsx`](file:///Users/noii/Documents/work/dambang/esd_attendance/src/components/layout/app-sidebar.tsx):
   - Added to `navItems` with icon `Building2`:
     ```ts
     {
       title: t("sidebar.branches", { defaultValue: "សាខាសាលា" }),
       path: "/branches",
       icon: Building2,
       roles: ["super_admin", "admin"],
     }
     ```

### B. Screens & Components
1. **`BranchesPage` (`src/pages/branches/branches-page.tsx`):**
   - **Header:** Title "School Branches" / "សាខាសាលា", description, and primary button `+ Add Branch` / `+ បន្ថែមសាខា`.
   - **Summary Stats Cards:**
     - Total Branches
     - Active Campuses
     - Main Campus indicator
   - **Toolbar:**
     - Search input (filter by code, Khmer name, English name, phone, address).
     - Status selector (`All`, `Active`, `Inactive`).
   - **Branches Table / Grid:**
     - Columns: `Code`, `Branch Name (Khmer & English)`, `Main Campus Badge`, `Contact (Phone & Email)`, `Address`, `Linked Classes`, `Status`, `Actions`.
     - Row Actions: `Edit`, `Toggle Status`, `Delete`.
2. **`BranchDialog` (`src/components/branches/branch-dialog.tsx`):**
   - Modal for creating or editing branch records.
   - Fields:
     - Branch Code (`ESD-MAIN`, `ESD-PP`, etc.) [Required, uppercase]
     - Branch Name in Khmer (`nameKh`) [Required]
     - Branch Name in English (`nameEn`) [Optional]
     - Phone Number (`phone`) [Optional]
     - Email Address (`email`) [Optional]
     - Address (`address`) [Optional, Textarea]
     - Main Campus Toggle (`isMain`) [Checkbox with explanation badge]
     - Status (`active` / `inactive`) [Select dropdown]
3. **`BranchDeleteDialog`:**
   - Uses existing [`ConfirmDialog`](file:///Users/noii/Documents/work/dambang/esd_attendance/src/components/shared/confirm-dialog.tsx) with safety warning regarding dependent classes/students.

### C. Progressive Enhancements in Existing Views
- **`ClassroomFormPage`:**
  - Add an optional "Branch / សាខា" select field so classes can be tagged with their physical campus.
- **`ClassesListPage`:**
  - Display branch pill/badge on class cards or table rows.

---

## 6. Bilingual Translations (`en.json` & `km.json`)

New keys under `sidebar.branches` and `branches.*`:
```json
{
  "sidebar": {
    "branches": "School Branches"
  },
  "branches": {
    "title": "School Branches",
    "pageTitle": "School Branches",
    "description": "Manage multi-campus facilities, locations, and branch details",
    "addBranch": "Add Branch",
    "editBranch": "Edit Branch",
    "branchCode": "Branch Code",
    "branchCodePlaceholder": "e.g. ESD-PP",
    "nameKh": "Branch Name (Khmer)",
    "nameKhPlaceholder": "e.g. សាខាភ្នំពេញ",
    "nameEn": "Branch Name (English)",
    "nameEnPlaceholder": "e.g. Phnom Penh Branch",
    "phone": "Phone Number",
    "email": "Email Address",
    "address": "Address / Location",
    "isMain": "Main Campus / Headquarters",
    "isMainDesc": "Designate this location as the primary headquarters campus",
    "mainCampusBadge": "Main Campus",
    "status": "Status",
    "totalBranches": "Total Branches",
    "activeBranches": "Active Branches",
    "mainCampus": "Main Campus",
    "codeRequired": "Branch code is required",
    "nameKhRequired": "Khmer branch name is required",
    "codeExists": "A branch with this code already exists",
    "cannotDeleteMain": "Cannot delete the main campus branch. Please designate another branch as the main campus first.",
    "cannotDeleteInUse": "Cannot delete this branch because {{count}} class(es) are currently assigned to it. Please deactivate the branch instead.",
    "deleteConfirmTitle": "Delete School Branch",
    "deleteConfirmDesc": "Are you sure you want to permanently delete \"{{name}}\"? This action cannot be undone.",
    "createSuccess": "Branch created successfully",
    "updateSuccess": "Branch updated successfully",
    "deleteSuccess": "Branch deleted successfully",
    "noBranches": "No branches found",
    "noBranchesDesc": "No school branches match your search criteria. Click \"Add Branch\" to register a new campus."
  }
}
```

---

## 7. Affected Files Overview

| Action | Path | Description |
|---|---|---|
| **Create** | `src/models/branch.model.ts` | Branch domain interface and types |
| **Create** | `src/services/branch.service.ts` | Branch CRUD service with Firestore & localStorage sync |
| **Create** | `src/pages/branches/branches-page.tsx` | Main branches management view (Admin only) |
| **Create** | `src/components/branches/branch-dialog.tsx` | Create/edit branch modal dialog |
| **Create** | `src/components/branches/branch-table.tsx` | Responsive branch roster table |
| **Create** | `test/branch.test.ts` | Unit tests for validations, uniqueness, and deletion safeguards |
| **Update** | `src/models/classroom.model.ts` | Add optional `branchId?: string` |
| **Update** | `src/routes/index.tsx` | Register `/branches` under admin-protected route block |
| **Update** | `src/components/layout/app-sidebar.tsx` | Add `Branches` navigation item with `Building2` icon for admins |
| **Update** | `src/i18n/locales/en.json` | English translation strings |
| **Update** | `src/i18n/locales/km.json` | Khmer translation strings |

---

## 8. Verification & Testing Strategy

1. **Unit Testing (`npm test`):**
   - Test `createBranch` validation (unique code enforcement, required Khmer name).
   - Test `isMain` flag updates (ensuring only one main campus active).
   - Test `deleteBranch` safety guards (blocking deletion of main campus and branches with linked classrooms).
2. **Access Control Verification:**
   - Log in as teacher -> `/branches` route is blocked and sidebar link is hidden.
   - Log in as admin / super_admin -> `/branches` route is fully accessible.
3. **Functional CRUD Verification:**
   - Create new branch ("ESD-BTB", "សាខាបាត់ដំបង", "Battambang Branch").
   - Edit phone, address, and status.
   - Attempt to delete a main branch (verify error dialog appears).
   - Delete an empty non-main branch (verify successful removal).
4. **Build Verification (`npm run build`):**
   - Ensure zero TypeScript errors and successful production bundling.
