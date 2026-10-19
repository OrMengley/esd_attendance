# Implementation Plan: Enrollments Management

**Status:** Implemented  
**Author:** AI Agent (Pair Programming)  
**Date:** 2026-10-19 (Enhanced with Comprehensive Wrong Class Correction, Safety Guards & Service Layer Specs)  
**Target Feature:** Dedicated Enrollments Management Screen (`/enrollments`) & Sidebar Integration  
**Full Spec File:** [`docs/plans/enrollments-management.md`](file:///Users/noii/Documents/work/dambang/esd_attendance/docs/plans/enrollments-management.md)  
**Reference Documents:** `AGENTS.md`, `docs/PROJECT.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN-SYSTEM.md`

---

## 1. Executive Summary & Goals

### Context & Need
Currently in the application:
1. **Enrollments exist as backend join entities** (`Enrollment`) between a `Student` and a `Classroom`, with full service capabilities in `enrollmentService` (CRUD, status changes, transfers, and audit logs).
2. **Access is fragmented**:
   - Staff can view enrolled students inside a specific class view (`ClassroomDetailPage`).
   - Staff can view a single student's enrollment history inside `StudentDetailPage`.
   - However, there is **no centralized screen** where administrators can view, filter, audit, search, and manipulate all student enrollments across classrooms and branches.
3. **Clerical Error Correction (Wrong Class Selection)**:
   - If a student is accidentally enrolled into the wrong class (e.g., selected morning batch instead of evening batch, or selected the wrong level/course), staff currently have no simple way to edit or reassign the class without manually deleting or dealing with inconsistencies.

### Goals
1. **Dedicated Management Page (`/enrollments`)**:
   - Provide a top-level, searchable, and filterable page matching the exact look-and-feel of `StudentsListPage` and `ClassesListPage`.
   - Real-time metric cards (Total Enrollments, Active, Completed, Transferred, Paused/Cancelled).
2. **Sidebar Integration**:
   - Add **"Enrollments"** (`sidebar.enrollments` / `"ការចុះឈ្មោះចូលរៀន"`) under the **"Students & Attendance"** sidebar section.
   - Restricted to `super_admin` and `admin` roles.
3. **Full Manipulation Capabilities**:
   - **New Enrollment**: Dialog to select student and target active class with live capacity and branch checks.
   - **Edit Enrollment / Wrong Class Correction (`EditEnrollmentDialog`)**:
     - Correct mistakes if staff selected the wrong class during enrollment.
     - Update classroom (`classroomId`), course package (`packageId`), start date, expected end date, and remarks.
     - Enforces target class capacity and branch compatibility.
     - **Safety Guard**: If attendance has already been taken in the old class, guides staff to use **Transfer** instead so historical attendance records are preserved for audits.
   - **Status Transitions**: One-click actions with confirmations (Complete with date, Pause, Resume, Cancel).
   - **Class Transfer**: Seamless integration with the existing `TransferClassDialog` (for transferring active students between classes of the same package).
   - **Deletion**: Safe deletion with confirmation for erroneous registrations.
4. **Multi-Branch & Role Scoping**:
   - **Super Admin**: Can filter by any branch or view "All Branches" via top switcher.
   - **Regular Admin**: Strictly scoped to enrollments of their assigned branch.
5. **Bilingual Localization**:
   - Complete Khmer (`km`) and English (`en`) translations for all headers, tabs, badges, dialogs, and toast messages.

---

## 2. Technical Stack & Domain Models

### Existing Entities & Relationships
- **`Enrollment`** (`src/models/enrollment.model.ts`):
  ```typescript
  export interface Enrollment {
    id: string;
    studentId: string;
    classroomId: string;
    packageId: string;
    startDate: string;
    expectedEndDate: string;
    actualEndDate?: string;
    status: "active" | "completed" | "paused" | "cancelled" | "transferred";
    note?: string;
    transferredAt?: string;
    transferredToEnrollmentId?: string;
    transferredFromEnrollmentId?: string;
    createdAt: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
  }
  ```
- **`Classroom`** (`src/models/classroom.model.ts`): Provides `code`, `name`, `branchId`, `packageId`, `capacity`, `scheduleDays`, `startTime`, `endTime`, `status`.
- **`Student`** (`src/models/student.model.ts`): Provides `studentCode`, `nameKh`, `nameEn`, `gender`, `phone`, `avatarUrl`, `branchId`, `status`.
- **`StudyPackage`** (`src/models/study-package.model.ts`): Provides package name, course code, planned hours.
- **`Branch`** (`src/models/branch.model.ts`): Provides branch name and code.

### Service Layer Analysis & Required Enhancements (`enrollmentService`)
Existing functions in `src/services/enrollment.service.ts`:
- `getEnrollments()`: Fetches all enrollments from Firestore (`enrollments` collection) with `localStorage` (`esd_local_enrollments`) fallback.
- `createEnrollment(data, userId)`:
  - Validates `ACTIVE_ENROLLMENT_EXISTS`.
  - Validates `CLASSROOM_NOT_ACTIVE`.
  - Enforces `CLASS_CAPACITY_FULL`.
- `setEnrollmentStatus(id, status, userId)`: Updates status (auto-sets `actualEndDate` on `completed`).
- `transferEnrollment(params)`: Runs atomic transaction to mark old enrollment `transferred`, creates new active enrollment with audit pointers.
- `updateEnrollment(id, updates, userId)`:
  - Currently updates dates, note, status, and audit fields.
  - **Enhancement Needed for Wrong Class Selection**:
    - When `updates.classroomId` differs from `existing.classroomId`:
      1. Fetch target classroom and verify it exists and is `active`.
      2. Verify target classroom has available capacity (`activeEnrollments < capacity`).
      3. Automatically sync `packageId` with `targetClassroom.packageId` if not explicitly changed.
      4. Validate branch compatibility (ensure target classroom is within user's branch permissions).
- `hasAttendanceRecords(studentId, classroomId)`:
  - Helper to quickly check if a student has any recorded attendance sessions in a classroom to power the safety guard in `EditEnrollmentDialog`.

---

## 3. Wrong Class Correction vs. Class Transfer

To avoid data corruption and maintain strict audit compliance, the system explicitly distinguishes between fixing a registration mistake vs. a genuine academic transfer:

| Feature / Scenario | Option A: Edit Enrollment (Fix Wrong Class) | Option B: Transfer Class (`TransferClassDialog`) |
| :--- | :--- | :--- |
| **Typical Use Case** | Clerical mistake right after enrollment (e.g. clicked 08:00 AM class instead of 02:00 PM class, or wrong teacher). | Student actually attended Class A for several days/weeks, then changes schedule or level. |
| **Attendance History** | Student has **0 recorded attendance marks** in the old class. | Student has **existing attendance records** in Class A that must be preserved for history and reports. |
| **Enrollment Record** | **In-place update**: Updates `classroomId` (and `packageId`) directly on the same enrollment record ID. | **Closes & Creates**: Closes old enrollment (`status: "transferred"`, `transferredAt`), creates a new enrollment record (`transferredFromEnrollmentId`). |
| **Audit Trail** | Logged as `enrollment.updated` with old class and new class in details. | Logged as `enrollment.transferred` with complete linked lineage. |
| **Capacity Management** | Old class active count decreases by 1; new class active count increases by 1. | Old class active count decreases by 1; new class active count increases by 1. |
| **Safety Guard** | If attendance is detected, UI warns the user and offers a 1-click shortcut to switch to "Transfer Class Instead". | Always safe to use at any time. |

---

## 4. UI/UX Flow & Component Hierarchy

```
AppLayout
 └── AppSidebar (Added "Enrollments" under "Students & Attendance")
 └── Routes (/enrollments)
      └── EnrollmentsListPage
           ├── PageHeader (Title, subtitle, "New Enrollment" button)
           ├── Metrics Summary Cards (Total, Active, Completed, Transferred, Paused)
           ├── Filter & Search Bar
           │    ├── Search Input (Student name Kh/En, code, class name, class code)
           │    ├── Branch Filter (Super Admin only; Admin auto-locked to branch)
           │    ├── Class Selector Dropdown
           │    ├── Status Selector Tabs / Dropdown (All, Active, Completed, Paused, Cancelled, Transferred)
           │    └── Date Range Filter (Start / End Date)
           ├── EnrollmentsTable
           │    ├── Student Info Column (Avatar, Khmer Name, Latin Name, Code, Phone)
           │    ├── Classroom Column (Class Code, Name, Time, Schedule Days)
           │    ├── Course Package Column (Package name & duration)
           │    ├── Branch Column (Badge)
           │    ├── Dates & Duration Column (Start -> Expected / Actual End)
           │    ├── Status Column (EnrollmentStatusBadge)
           │    ├── Notes Column (Tooltip on hover)
           │    └── Actions Dropdown Menu
           │         ├── ✏️ Edit Enrollment (Change Class, Dates, Notes)  <-- NEW
           │         ├── 👁️ View Student Profile (/students/:id)
           │         ├── 🏫 View Classroom Roster (/classes/:id)
           │         ├── 🔄 Transfer to Another Class (active enrollments only)
           │         ├── ⏸️ Pause / ▶️ Resume Enrollment
           │         ├── 🎓 Mark as Completed
           │         ├── ❌ Cancel Enrollment
           │         └── 🗑️ Delete Enrollment (ConfirmDialog)
           ├── EnrollStudentDialog (New Enrollment Modal)
           ├── EditEnrollmentDialog (Edit Class / Dates / Notes Modal)  <-- NEW
           ├── TransferClassDialog (Existing component)
           └── ConfirmDialog (Status transitions & deletion confirmation)
```

---

## 5. Detailed Component Specifications

### 1. `EnrollmentsListPage` (`src/pages/enrollments/enrollments-list-page.tsx`)
- **Page Layout**: Matches `StudentsListPage` with responsive `max-w-7xl mx-auto space-y-6 pb-16`.
- **Top Metrics Strip**:
  - Total Enrollments
  - Active (`status === "active"`)
  - Completed (`status === "completed"`)
  - Transferred (`status === "transferred"`)
  - Paused / Cancelled (`status === "paused" || status === "cancelled"`)
- **Multi-Branch Filtering**:
  - Uses `useBranch()` hook (`currentBranchId`, `isAllBranches`).
  - Scopes enrollments according to the classroom's `branchId` and/or student's `branchId`.
  - Super Admin can switch branches freely; Admin is restricted to their branch.

### 2. `EnrollmentsTable` (`src/components/enrollments/enrollments-table.tsx`)
- **Columns**:
  1. **#**: Row index.
  2. **Student**: Avatar thumbnail, Khmer name, English name, student code (`STU-XXX`), and phone.
  3. **Classroom**: Class title, badge with class code (`ESD-WD-2026-001`), and schedule chips (e.g. `07:00 - 08:00`).
  4. **Package**: Course name in Khmer and duration badge.
  5. **Branch**: Campus badge (e.g. `សាខាកណ្តាល`).
  6. **Dates**:
     - Start Date (`startDate`)
     - End Date (`actualEndDate` if completed/transferred, otherwise `expectedEndDate`)
     - Days elapsed / remaining indicator.
  7. **Status**: Reuses [`EnrollmentStatusBadge`](file:///Users/noii/Documents/work/dambang/esd_attendance/src/components/students/enrollment-status-badge.tsx).
  8. **Note**: Text preview with tooltip for long remarks.
  9. **Actions Menu**:
     - ✏️ **Edit Enrollment**: Opens `EditEnrollmentDialog` to fix wrong class or adjust dates/notes.
     - 👁️ View Student Profile (`/students/:id`)
     - 🏫 View Classroom Roster (`/classes/:id`)
     - 🔄 Transfer to Another Class (active enrollments only)
     - ⏸️ Pause Enrollment (active enrollments only)
     - ▶️ Resume Enrollment (paused enrollments only)
     - 🎓 Mark as Completed (active enrollments only)
     - ❌ Cancel Enrollment (active or paused enrollments)
     - 🗑️ Delete Enrollment (with `ConfirmDialog`)

### 3. `EditEnrollmentDialog` (`src/components/enrollments/edit-enrollment-dialog.tsx`) — *Wrong Class Correction*
- **Purpose**: Fix clerical enrollment mistakes when staff select the wrong class or need to adjust study dates/notes.
- **Form Fields**:
  1. **Student Summary Card**: Displays selected student photo, name, code (read-only).
  2. **Classroom Select**:
     - Dropdown listing active classes in the current branch.
     - Displays capacity indicator (e.g. `14 / 20 seats`).
     - Selecting a new class automatically updates the associated `packageId` and recalculates expected end dates.
  3. **Start Date & Expected End Date**: Editable date pickers.
  4. **Notes**: Textarea for administrative comments.
- **Attendance Safety Check**:
  - When the dialog opens, it inspects whether attendance records already exist for this student under the current classroom:
    - **No attendance records yet**: Direct update allowed with no warnings.
    - **Attendance records exist**: An alert card appears:
      > ⚠️ *"Student already has attendance recorded in this class. If the student attended classes and is changing their schedule, please use **Transfer Class** to preserve attendance audit history. Use direct class change only to correct an immediate entry mistake."*
      - Provides a convenient **"Transfer Class Instead"** action button.
      - Requires an explicit confirmation checkbox if proceeding with in-place change.

### 4. `EnrollStudentDialog` (`src/components/enrollments/enroll-student-dialog.tsx`)
- **Workflow**:
  1. **Student Selection**: Searchable picker to select any active registered student without an existing active enrollment.
  2. **Classroom Selection**: Filtered by active status and matching branch. Displays current enrolled count vs capacity (e.g. `14 / 20`). Prevents selecting full classes.
  3. **Dates**: Defaults `startDate` to classroom start date or today; defaults `expectedEndDate` to classroom end date.
  4. **Note**: Optional remarks.
  5. **Submission**: Calls `enrollmentService.createEnrollment` and triggers list reload.

### 5. Status Transition Actions & Dialogs
- Direct integration with `ConfirmDialog` for each transition:
  - **Complete**: Prompts for completion date (defaults to today) and marks enrollment as `completed`.
  - **Pause**: Confirms pausing studies; marks `status: "paused"`.
  - **Resume**: Verifies student doesn't have another conflicting active enrollment; sets `status: "active"`.
  - **Cancel**: Confirms cancellation with reason; marks `status: "cancelled"`.
  - **Transfer**: Opens existing [`TransferClassDialog`](file:///Users/noii/Documents/work/dambang/esd_attendance/src/components/students/transfer-class-dialog.tsx).

---

## 6. Routing & Sidebar Integration

### Routing (`src/routes/index.tsx`)
Under the admin protected block (`allowedRoles: ["super_admin", "admin"]`):
```tsx
{
  path: "enrollments",
  element: <EnrollmentsListPage />,
}
```

### Sidebar (`src/components/layout/app-sidebar.tsx`)
In `navSections` under `sectionStudentsAttendance`:
```tsx
{
  titleKey: "sidebar.sectionStudentsAttendance",
  defaultTitle: "Students & Attendance",
  items: [
    {
      title: t("sidebar.students"),
      path: "/students",
      icon: Users,
      roles: ["super_admin", "admin"],
    },
    {
      title: t("sidebar.enrollments", { defaultValue: "ការចុះឈ្មោះចូលរៀន" }),
      path: "/enrollments",
      icon: UserCheck,
      roles: ["super_admin", "admin"],
    },
    {
      title: t("sidebar.attendance"),
      path: "/attendance",
      icon: ClipboardCheck,
      roles: ["super_admin", "admin", "teacher"],
    },
    // ...
  ]
}
```

---

## 7. Bilingual Localization Keys

### English (`src/i18n/locales/en.json`)
```json
"sidebar": {
  "enrollments": "Enrollments"
},
"enrollments": {
  "title": "Enrollments Management",
  "subtitle": "Track, enroll, transfer, and manage student enrollments across all classes",
  "newEnrollment": "New Enrollment",
  "editEnrollment": "Edit Enrollment",
  "editEnrollmentDesc": "Update classroom, study dates, or notes for this enrollment",
  "totalEnrollments": "Total Enrollments",
  "activeEnrollments": "Active Enrollments",
  "completedEnrollments": "Completed",
  "transferredEnrollments": "Transferred",
  "pausedCancelled": "Paused / Cancelled",
  "searchPlaceholder": "Search by student name, code, class...",
  "filterByClass": "Filter by Class",
  "filterByStatus": "Filter by Status",
  "allClasses": "All Classes",
  "allStatuses": "All Statuses",
  "student": "Student",
  "class": "Classroom",
  "package": "Course Package",
  "branch": "Branch",
  "dates": "Enrollment Period",
  "startDate": "Start Date",
  "expectedEndDate": "Expected End Date",
  "status": "Status",
  "note": "Note",
  "changeClass": "Change Classroom",
  "hasAttendanceWarning": "This student already has attendance recorded in this class. If the student attended classes and is changing their schedule, use Transfer Class instead to preserve attendance records.",
  "transferInstead": "Transfer Class Instead",
  "confirmOverrideAttendance": "I understand that past attendance records in the previous class will remain unchanged.",
  "noEnrollments": "No enrollments found",
  "noEnrollmentsDesc": "No student enrollment records match the selected filters.",
  "confirmCompleteTitle": "Mark Enrollment as Completed",
  "confirmCompleteDesc": "Are you sure you want to mark this enrollment as completed? An actual end date will be recorded.",
  "confirmPauseTitle": "Pause Enrollment",
  "confirmPauseDesc": "This will pause the student's study in this class. They will not be counted as eligible for daily attendance.",
  "confirmResumeTitle": "Resume Enrollment",
  "confirmResumeDesc": "Resume student's study in this class. The student must not have another active enrollment.",
  "confirmCancelTitle": "Cancel Enrollment",
  "confirmCancelDesc": "Are you sure you want to cancel this enrollment record?",
  "confirmDeleteTitle": "Delete Enrollment",
  "confirmDeleteDesc": "Are you sure you want to delete this enrollment record? This action cannot be undone.",
  "enrollSuccess": "Student enrolled successfully",
  "updateSuccess": "Enrollment updated successfully",
  "statusUpdateSuccess": "Enrollment status updated successfully",
  "deleteSuccess": "Enrollment deleted successfully",
  "fetchError": "Failed to load enrollment records",
  "capacityFullError": "Selected classroom has reached full capacity"
}
```

### Khmer (`src/i18n/locales/km.json`)
```json
"sidebar": {
  "enrollments": "ការចុះឈ្មោះចូលរៀន"
},
"enrollments": {
  "title": "គ្រប់គ្រងការចុះឈ្មោះចូលរៀន",
  "subtitle": "តាមដាន ចុះឈ្មោះ ផ្ទេរថ្នាក់ និងគ្រប់គ្រងការសិក្សារបស់សិស្សតាមថ្នាក់ទាំងអស់",
  "newEnrollment": "ចុះឈ្មោះសិស្សថ្មី",
  "editEnrollment": "កែប្រែការចុះឈ្មោះ",
  "editEnrollmentDesc": "កែប្រែថ្នាក់រៀន កាលបរិច្ឆេទសិក្សា ឬចំណាំសម្រាប់ការចុះឈ្មោះនេះ",
  "totalEnrollments": "ការចុះឈ្មោះសរុប",
  "activeEnrollments": "កំពុងសិក្សា",
  "completedEnrollments": "បានបញ្ចប់ការសិក្សា",
  "transferredEnrollments": "បានផ្ទេរថ្នាក់",
  "pausedCancelled": "ផ្អាក / បោះបង់",
  "searchPlaceholder": "ស្វែងរកតាមឈ្មោះសិស្ស អត្តលេខ ថ្នាក់...",
  "filterByClass": "ត្រងតាមថ្នាក់",
  "filterByStatus": "ត្រងតាមស្ថានភាព",
  "allClasses": "ថ្នាក់ទាំងអស់",
  "allStatuses": "ស្ថានភាពទាំងអស់",
  "student": "សិស្ស",
  "class": "ថ្នាក់រៀន",
  "package": "កញ្ចប់សិក្សា",
  "branch": "សាខា",
  "dates": "កាលបរិច្ឆេទសិក្សា",
  "startDate": "ថ្ងៃចាប់ផ្តើម",
  "expectedEndDate": "ថ្ងៃរំពឹងបញ្ចប់",
  "status": "ស្ថានភាព",
  "note": "ចំណាំ",
  "changeClass": "ផ្លាស់ប្តូរថ្នាក់រៀន",
  "hasAttendanceWarning": "សិស្សនេះមានទិន្នន័យកត់វត្តមានរួចហើយក្នុងថ្នាក់នេះ។ ប្រសិនបើសិស្សធ្លាប់បានរៀនហើយចង់ប្តូរម៉ោង សូមប្រើ 'ផ្ទេរថ្នាក់' វិញ ដើម្បីរក្សាប្រវត្តិវត្តមាន។",
  "transferInstead": "ផ្ទេរថ្នាក់ជំនួសវិញ",
  "confirmOverrideAttendance": "ខ្ញុំយល់ព្រមថាកំណត់ត្រាវត្តមានកន្លងមកក្នុងថ្នាក់ចាស់នឹងនៅរក្សាដដែល។",
  "noEnrollments": "មិនមានទិន្នន័យចុះឈ្មោះទេ",
  "noEnrollmentsDesc": "មិនមានទិន្នន័យនៃការចុះឈ្មោះសិស្សដែលត្រូវនឹងលក្ខខណ្ឌចម្រាញ់នេះទេ។",
  "confirmCompleteTitle": "បញ្ជាក់ការបញ្ចប់ការសិក្សា",
  "confirmCompleteDesc": "តើអ្នកពិតជាចង់កំណត់ការចុះឈ្មោះនេះថាបានបញ្ចប់មែនទេ? កាលបរិច្ឆេទបញ្ចប់នឹងត្រូវបានកត់ត្រា។",
  "confirmPauseTitle": "ផ្អាកការសិក្សាជាបណ្តោះអាសន្ន",
  "confirmPauseDesc": "សិស្សនឹងត្រូវបានផ្អាកការសិក្សាក្នុងថ្នាក់នេះ ហើយនឹងមិនមានវត្តមានក្នុងបញ្ជីវត្តមានប្រចាំថ្ងៃទេ។",
  "confirmResumeTitle": "បន្តការសិក្សាឡើងវិញ",
  "confirmResumeDesc": "បន្តការសិក្សារបស់សិស្សក្នុងថ្នាក់នេះឡើងវិញ។ សិស្សត្រូវតែមិនមានការចុះឈ្មោះសកម្មផ្សេងទៀត។",
  "confirmCancelTitle": "បោះបង់ការចុះឈ្មោះ",
  "confirmCancelDesc": "តើអ្នកពិតជាចង់បោះបង់កំណត់ត្រាចុះឈ្មោះនេះមែនទេ?",
  "confirmDeleteTitle": "លុបការចុះឈ្មោះ",
  "confirmDeleteDesc": "តើអ្នកពិតជាចង់លុបការចុះឈ្មោះនេះចេញពីប្រព័ន្ធមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។",
  "enrollSuccess": "បានចុះឈ្មោះសិស្សចូលរៀនដោយជោគជ័យ",
  "updateSuccess": "បានកែប្រែការចុះឈ្មោះដោយជោគជ័យ",
  "statusUpdateSuccess": "បានកែប្រែស្ថានភាពការចុះឈ្មោះដោយជោគជ័យ",
  "deleteSuccess": "បានលុបការចុះឈ្មោះដោយជោគជ័យ",
  "fetchError": "មិនអាចទាញយកទិន្នន័យចុះឈ្មោះបានទេ",
  "capacityFullError": "ថ្នាក់រៀនដែលបានជ្រើសរើសបានពេញចំណុះហើយ"
}
```

---

## 8. Step-by-Step Implementation Tasks

- [x] **Step 1: Add Translations**
  - Added `sidebar.enrollments` and `enrollments.*` keys to `src/i18n/locales/en.json` and `src/i18n/locales/km.json`.
- [x] **Step 2: Service Layer Refinements**
  - Updated `updateEnrollment` in `src/services/enrollment.service.ts` to validate target class capacity and sync `packageId` when changing `classroomId`.
  - Added `deleteEnrollment` method to `enrollmentService`.
  - Added `hasAttendanceRecords(studentId, classroomId)` helper to `src/services/attendance.service.ts`.
- [x] **Step 3: Create Enrollment Components**
  - Created `src/components/enrollments/enrollments-table.tsx` with sorting, filtering, badge displays, and action menu.
  - Created `src/components/enrollments/enroll-student-dialog.tsx` for registering a student into an active class.
  - Created `src/components/enrollments/edit-enrollment-dialog.tsx` for updating wrong class, dates, and notes, with attendance safety alerts.
- [x] **Step 4: Create Page Screen**
  - Created `src/pages/enrollments/enrollments-list-page.tsx` incorporating metrics cards, search/filter controls, multi-branch scoping, and table rendering.
- [x] **Step 5: Configure Routing & Navigation**
  - Registered `/enrollments` route in `src/routes/index.tsx` guarded for `super_admin` and `admin`.
  - Added the `Enrollments` item to `AppSidebar` under `sectionStudentsAttendance`.
- [x] **Step 6: Automated Verification & Testing**
  - Created unit tests in `test/enrollment-management.test.ts` covering enrollment filtering, wrong class editing, branch scoping, and status transitions.
  - Verified `npm test` (30/30 tests passing) and `npm run build` (clean compilation).

---

## 9. Definition of Done
1. `/enrollments` route is accessible to `super_admin` and `admin` roles, and blocked for `teacher`.
2. Sidebar displays "Enrollments" under "Students & Attendance" section with correct active route highlighting.
3. Page displays summary metrics and comprehensive enrollment records with student, class, branch, date, and status details.
4. Users can create a new enrollment, edit existing enrollment (correct wrong class, adjust dates, edit remarks), change status (complete, pause, resume, cancel), transfer class, and delete.
5. In-place class correction enforces capacity checks and warns if attendance records already exist.
6. Multi-branch scoping adheres strictly to role permissions.
7. All text is fully localized in both English and Khmer.
8. `npm test` passes without errors and `npm run build` compiles cleanly.
