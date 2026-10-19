# Implementation Plan: Branch-Scoped Data & Global Branch Switcher

**Status:** In Progress  
**Author:** AI Agent (Pair Programming)  
**Date:** 2026-10-18  
**Target Feature:** Multi-Branch Data Scoping & Context Filtering  
**Reference Documents:** `AGENTS.md`, `docs/plans/multi-branch.md`, `docs/PROJECT.md`

---

## 1. Confirmed Business Requirements

1. **Super Admin Global Scope:**
   - Super Admins have an "All Branches" (គ្រប់សាខាទាំងអស់) option as well as individual branch switching.
   - Switcher located at the top of the sidebar.
2. **Teacher Strict Isolation:**
   - Teachers are strictly scoped to their single assigned branch (`user.branchId`).
   - If a teacher works at multiple branches, they have separate accounts per branch.
   - Teachers cannot see or switch to other campuses.
3. **Student Branch Scoping:**
   - A student belongs to the branch of the class they are currently enrolled in (`enrollment -> classroom.branchId`).
   - When filtering by a branch, only students enrolled in that branch's classes are displayed. In "All Branches" mode, all students are visible.

---

## 2. Technical Architecture

### A. Model Updates
- **`User`** (`src/models/user.model.ts`):
  ```typescript
  export interface User {
    // ... existing fields ...
    branchId?: string; // Assigned campus for this account (mandatory for teachers)
  }
  ```

### B. Global `BranchContext` (`src/contexts/branch-context.tsx`)
Provides centralized branch state across the entire React tree:
```typescript
interface BranchContextType {
  currentBranchId: string; // "all" | branchId
  currentBranch: Branch | null;
  availableBranches: Branch[];
  isAllBranches: boolean;
  setCurrentBranchId: (id: string) => void;
  isLoading: boolean;
}
```
**Access Control in Context:**
- For `teacher`: `currentBranchId` is automatically locked to `user.branchId`. `setCurrentBranchId` is a no-op.
- For `super_admin`: Can choose any branch ID or `"all"`.
- For `admin`: Can choose from branches or locked to their assigned branch.
- Selection persisted in `localStorage` (`esd_active_branch_id`).

### C. Sidebar Switcher Component (`src/components/layout/branch-switcher.tsx`)
- Placed right below the brand header in `app-sidebar.tsx`.
- Displays active branch name, code pill, and dropdown selector for Super Admins / Admins.
- For teachers, displays their fixed campus badge with a lock/building icon.
- When sidebar is collapsed, renders an accessible icon trigger with a tooltip.

---

## 3. Data Scoping Implementation Across Pages

| Page / Feature | Scoping Rule |
|---|---|
| **Classes List** (`/classes`) | Filter `classrooms` by `cls.branchId === currentBranchId` (unless `"all"`). Pre-fills `currentBranchId` when creating a new class. |
| **Students List** (`/students`) | Filter students who have an active enrollment in a classroom where `cls.branchId === currentBranchId`. |
| **Daily Attendance** (`/attendance`) | Only list classes belonging to `currentBranchId` scheduled for today. |
| **Dashboard** (`/dashboard`) | Recalculate KPIs, attendance overview, and attention alerts strictly for classes & students in `currentBranchId`. |
| **Attendance Reports** (`/attendance-reports`) | Restrict classroom pickers and monthly report generation to the current branch. |
| **Absence & Late Report** (`/absence-late-report`) | Filter classes and chronic absence analytics to `currentBranchId`. |
| **Class Progress Report** (`/class-progress-report`) | Filter syllabus progress to classes in `currentBranchId`. |
| **User Accounts** (`/users`) | Filter teachers by `branchId === currentBranchId`. Assign branch when creating/editing teachers. |

---

## 4. Step-by-Step Implementation Steps

1. **Model & Mock Data:** Update `User` interface with `branchId?: string`. Add `branchId` to mock classrooms and users.
2. **Context Creation:** Implement `BranchContext` in `src/contexts/branch-context.tsx` and wrap inside `src/App.tsx`.
3. **UI Switcher:** Build `BranchSwitcher` component and embed into `app-sidebar.tsx`.
4. **Classes Scoping:** Sync `ClassesListPage` and `ClassroomFormPage` with `useBranch()`.
5. **Students Scoping:** Sync `StudentsListPage` with `useBranch()`.
6. **Attendance & Reports Scoping:** Sync `DailyAttendancePage`, `AttendanceReportsPage`, and progress reports.
7. **Dashboard Scoping:** Update `dashboard-calculator.ts` and `dashboard.service.ts` to accept `branchId` filter.
8. **Users Scoping:** Add branch selector to `UserDialog` and filter teacher roster by branch.
9. **Unit Testing:** Write unit tests in `test/branch-scoping.test.ts` testing scoping rules for students, classes, and teachers.
10. **Build Verification:** Verify `npm test` and `npm run build`.
