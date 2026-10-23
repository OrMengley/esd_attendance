# 📋 ESD Attendance System — Comprehensive Feature Catalog

> **Enterprise-Grade, Responsive, Bilingual Multi-Branch School Management & Attendance Web Application**  
> Technology: **React 19**, **TypeScript 5.7**, **Vite 6**, **Tailwind CSS 3.4**, **Firebase Firestore 11.4**, **ExcelJS**

---

## 📑 Table of Contents
1. [Multi-Branch Campus Architecture](#1-multi-branch-campus-architecture)
2. [Role-Based Access Control (RBAC) & Authentication](#2-role-based-access-control-rbac--authentication)
3. [Student Management & Batch Excel Import](#3-student-management--batch-excel-import)
4. [Classroom Lifecycle & Enrollment Management](#4-classroom-lifecycle--enrollment-management)
5. [Daily Attendance Operations & Time-Lock Rules](#5-daily-attendance-operations--time-lock-rules)
6. [Attendance Corrections & Immutable Audit Logs](#6-attendance-corrections--immutable-audit-logs)
7. [Curriculum Packages & Academic Calendar](#7-curriculum-packages--academic-calendar)
8. [Advanced Reports, Analytics & Print Views](#8-advanced-reports-analytics--print-views)
9. [Role-Tailored Dashboards](#9-role-tailored-dashboards)
10. [Bilingual Localization & Custom School Branding](#10-bilingual-localization--custom-school-branding)
11. [Data Architecture, Reliability & Offline Fallback](#11-data-architecture-reliability--offline-fallback)

---

## 1. Multi-Branch Campus Architecture

Designed for educational organizations operating multiple campuses or training centers (e.g., Wat Damnak Campus, Siem Reap Center).

* **Central Branch Management (`/branches`)**:
  * Administer branch records: Branch Code, Khmer Name, English Name, Address, Contact Phone, Campus Manager/Contact Person, Status (`active` / `inactive`), and Main Campus (`isDefault`) flag.
  * Integrity safeguards: Prevents accidental deletion of the primary campus or branches containing active classes, students, or personnel.
* **Global Branch Switcher (`BranchSwitcher`)**:
  * Persistent switcher in the top navigation header and sidebar.
  * **Super Admin**: Instant switching between specific branches or aggregate `"All Branches"` (`all`) view.
  * **Branch Admin & Teachers**: Automatically locked to their assigned branch for strict operational isolation.
* **Multi-Branch Data Scoping Engine (`src/lib/branch-scoping.ts`)**:
  * Dynamic scoping across Classrooms, Student rosters, Staff/Teachers, Daily Attendance Sessions, and Dashboard KPI calculations.

---

## 2. Role-Based Access Control (RBAC) & Authentication

Three-tiered authorization hierarchy enforcing security boundaries across UI, route guards, and service layers.

| Role | Access Scope | Key Capabilities |
|---|---|---|
| **`super_admin`** | Entire Institution (All Branches) | Full branch management, user administration, cross-campus reporting, global configuration. |
| **`admin`** | Assigned Branch | Student registration, batch Excel imports, class creation, enrollment corrections, attendance overrides, branch audit logs. |
| **`teacher`** | Assigned Classrooms | Real-time daily attendance taking, class roster inspection, class monthly attendance matrix, personal schedule dashboard. |

* **Route Guards (`src/routes/protected-route.tsx`)**:
  * Prevents unauthorized URL navigation and automatically redirects users according to role permissions.
* **User Administration (`/users`)**:
  * Account provisioning (Full Name, Username, Role, Assigned Branch, Contact Phone, Avatar Upload).
  * Password management and account activation/deactivation toggles.

---

## 3. Student Management & Batch Excel Import

* **Student Records Directory (`/students`)**:
  * Rich profile tracking: Auto/manual Student Code, Khmer Name (`nameKh`), English Name (`nameEn`), Gender, Date of Birth, Phone Number, Home Address, Emergency Contact, and Status (`active`, `inactive`, `graduated`, `dropped`).
  * Avatar upload via camera capture, local file picker, or Cloudinary cloud hosting.
* **Student Detail Screen (`/students/:id`)**:
  * Complete demographic profile, active and historical classroom enrollments, attendance summaries, and direct contact shortcuts.
* **Batch Excel Student Import Engine (`ImportStudentsDialog` & `src/lib/student-import-excel.ts`)**:
  * **Template Generator**: One-click download of official bilingual Excel template (`.xlsx`) pre-styled with column headers, example entries, and data formatting hints.
  * **Client-Side Parsing (`ExcelJS`)**: Fast, browser-based extraction of spreadsheet rows without sending raw files to external servers.
  * **Rigorous Row Validation**:
    * Required field checks (Khmer Name, Student Code, Gender).
    * Gender normalization (e.g., `M`, `F`, `ប្រុស`, `ស្រី`, `Male`, `Female`).
    * Cambodian date parsing (handles Excel serial numbers, ISO dates, `DD/MM/YYYY`, and `YYYY-MM-DD`).
    * Phone number formatting and sanitization.
    * In-file duplicate code detection + collision detection against existing Firestore student records.
  * **Interactive Preview Modal**: Tabbed inspection of valid rows vs invalid rows with clear cell-level error diagnostics before database write.
  * **Batch Firestore Ingestion**: Atomic progress-monitored insertion of validated student records.

---

## 4. Classroom Lifecycle & Enrollment Management

* **Classroom Administration (`/classes`, `/classes/new`, `/classes/:id`)**:
  * Define Class Code, Name, Assigned Branch, Linked Study Package, Maximum Student Capacity, Assigned Teacher/Instructor, Room Number, Schedule Days (e.g., Mon-Fri, Mon-Sat, Weekend), Start/End Times, and Academic Status (`active`, `completed`, `cancelled`).
* **Classroom Detail View (`ClassroomDetailPage`)**:
  * Visual schedule badges, instructor summary, capacity gauge bar (`X / Y Enrolled`).
  * **Enrolled Students Card (`EnrolledStudentsCard`)**:
    * Tabulated roster of enrolled students with real-time attendance rate badges and direct action menus.
  * **Quick Add Student to Class Dialog (`AddStudentToClassDialog`)**:
    * **Mode 1 (Enroll Existing)**: Searchable directory of existing students categorized into *Available to Enroll*, *Already in This Class*, or *Active in Another Class*.
    * **Mode 2 (Quick Register & Enroll)**: Register a brand-new student and immediately enroll them in this classroom in a single step.
    * Live class capacity enforcement preventing over-enrollment.
* **Centralized Enrollments Management Screen (`/enrollments`)**:
  * Dedicated administrative hub for auditing and managing all student-to-classroom relationships across branches.
  * Summary KPI cards: Total Enrollments, Active, Completed, Transferred, Paused/Cancelled.
  * Multi-attribute filtering by branch, target classroom, enrollment status, and search query.
  * **Wrong Class Selection Correction (`EditEnrollmentDialog`)**:
    * Allows administrative staff to correct clerical mistakes when a student was mistakenly registered in the wrong class batch or level.
    * Dynamic classroom switching with capacity and branch compatibility checks.
    * **Audit Safety Guard**: If attendance sessions have already been recorded for that student in the existing class, staff are automatically guided to execute an audited **Class Transfer** instead of a clerical overwrite, preserving historical attendance records.
  * **Status Transitions**: One-click transitions with confirmation modals (Mark as Completed, Pause Enrollment, Resume, Cancel).
  * **Class Transfer Workflow**: Seamless transfer from one class to another within the study package, recording origin and destination audit pointers.

---

## 5. Daily Attendance Operations & Time-Lock Rules

* **Interactive Attendance Sheet (`/attendance`)**:
  * Filter by Classroom and Calendar Date (defaults to Cambodia local time `UTC+7`).
  * Fast, touch-friendly status toggling for every enrolled student:
    * 🟢 **Present (វត្តមាន)**
    * 🟡 **Late (យឺត)**
    * 🔵 **Permission (ច្បាប់)**
    * 🔴 **Absent (អវត្តមាន)**
  * **"Mark All Present"** bulk shortcut for high-efficiency classroom management.
  * Individual student remarks / note input per session.
* **Session Locking Rules (`src/lib/attendance-time-lock.ts`)**:
  * Once an attendance session is submitted and locked by the instructor, direct editing is restricted to prevent tampering.
  * Later changes require the formal Attendance Correction workflow with an audit reason.
* **Daily Attendance Summary (`/daily-attendance-summary`)**:
  * Institution-wide daily dashboard displaying attendance completion status across all scheduled classes for the day.
  * Instantly highlights classes that have not yet taken attendance.

---

## 6. Attendance Corrections & Immutable Audit Logs

* **Attendance Correction Screen (`/attendance-corrections`)**:
  * Authorized workflow for `super_admin` and `admin` to modify previously locked attendance entries.
  * Requires explicit entry of a correction reason (e.g., medical certificate provided later, clerical entry error).
* **Immutable Audit Trail (`/attendance-audit-logs`)**:
  * Complete, searchable log of every modification made to attendance records.
  * Captures: Target Student, Classroom, Attendance Date, Previous Status ➔ New Status, Modifying User, Timestamp, and Reason.

---

## 7. Curriculum Packages & Academic Calendar

* **Study Packages (`/packages`)**:
  * Curriculum course packages and modules.
  * Tracks course codes, planned syllabus hours, and course descriptions. Planned hours directly power curriculum pacing analytics.
* **School Holiday Management (`/holidays`)**:
  * Define national holidays, public observances, and school term breaks.
  * Supports single-day or multi-day date ranges.
  * Automatically flags holidays on the attendance calendar and excludes them from expected teaching day counts in progress reports.

---

## 8. Advanced Reports, Analytics & Print Views

* **Monthly Attendance Matrix (`/attendance-reports`)**:
  * Comprehensive 31-day visual calendar grid for each classroom.
  * Highlights weekends and official school holidays with distinct column tints.
  * Real-time calculation of student monthly metrics: Total Present, Late, Permission, Absent, and Net Attendance Percentage.
  * **Standalone Print View (`/attendance-reports/monthly/:classroomId/:yearMonth`)**: Clean, distraction-free layout formatted for A4 horizontal printing.
* **Individual Student Attendance Profile (`/student-attendance`, `/student-attendance/:studentId`)**:
  * Lifetime and term-based attendance summaries for individual students across all their enrollments.
  * Student Monthly Attendance Card preview (`/student-attendance/:studentId/monthly/:yearMonth`).
* **Absence & Tardiness Analytics (`/absence-late-report`)**:
  * Filters students crossing configurable absence or tardiness warning thresholds (e.g., >3 absences).
  * Direct export to formatted Excel spreadsheet (`.xlsx`) via `ExcelJS`.
  * Dedicated print layout (`/absence-late-report/print`).
* **Class Progress & Curriculum Pacing Report (`/class-progress-report`)**:
  * Compares actual completed teaching hours against total planned course hours.
  * Pacing calculations: Syllabus completion percentage, remaining hours, and estimated completion date.
  * Excel export and dedicated print layout (`/class-progress-report/print`).

---

## 9. Role-Tailored Dashboards

* **Administrator & Super Admin View (`/dashboard`)**:
  * Top KPI Metric Cards: Total Active Students, Active Classrooms, Teaching Faculty, Overall Attendance Rate, and Monthly Holidays.
  * Operational Health Indicator: Automatic assessment (`Good`, `Normal`, `Needs Attention`).
  * Today's Real-time Attendance Breakdown (Present, Absent, Permission, Late).
  * Class-by-Class Attendance Status Tracker (`Not Marked`, `In Progress`, `Completed`).
  * High-Priority Attention Alert Box: Flagging unrecorded sessions and classes with low attendance (<70%).
  * Quick-launch navigation action buttons.
* **Teacher View (`/dashboard`)**:
  * Scoped strictly to the logged-in teacher's classes.
  * "Next Upcoming Class" banner with countdown and direct "Take Attendance" shortcut.
  * Summary of assigned students and scheduled classes for the current day.

---

## 10. Bilingual Localization & Custom School Branding

* **100% Bilingual Khmer & English Support**:
  * Complete localization via `react-i18next` with structured locale files (`src/i18n/locales/km.json` and `src/i18n/locales/en.json`).
  * Default language: **Khmer (`km`)** with English (`en`) one-click switcher.
  * Khmer typography: Styled with `Kantumruy Pro` font for readable, beautiful rendering of Khmer script.
* **School Branding & Configuration (`/settings`)**:
  * School Name in Khmer & English.
  * School Logo upload and display across sidebar, headers, and printable reports.
  * School contact details (Phone, Address, Email).
  * Attendance threshold percentages (warning thresholds for low attendance alerts).

---

## 11. Data Architecture, Reliability & Offline Fallback

* **Google Cloud Firestore Backend**:
  * Clean collection layout: `branches`, `classrooms`, `students`, `enrollments`, `studyPackages`, `attendanceRecords`, `schoolHolidays`, `users`, `attendanceAuditLogs`, `schoolSettings`.
* **Resilient Dual-Layer Persistence**:
  * Service layer includes automated `localStorage` fallback and mock datasets, allowing the application to function smoothly during development, network outages, or demo environments.
* **Unit Test Suite**:
  * Automated testing covering critical domain logic:
    * Branch scoping and isolation rules (`test/branch-scoping.test.ts`).
    * Branch management validation (`test/branch.test.ts`).
    * Student-to-class eligibility & capacity checks (`test/add-student-to-class.test.ts`).
    * Enrollments management and wrong class correction (`test/enrollment-management.test.ts`).
    * Excel import parsing, date normalization, and duplicate detection (`test/student-import-excel.test.ts`).
