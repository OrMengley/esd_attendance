Implement **Attendance Correction & Audit Log** for the existing ESD Attendance Vite React + TypeScript + Firestore application.

Purpose: after daily attendance has been saved and locked, authorized admins can correct a wrong or missing attendance status with a mandatory reason. Every correction must create an immutable audit log.

Reuse the existing attendance models, attendance locking rules, classrooms, students, users, i18n, and Cambodia timezone helpers. Do not break teacher attendance marking or existing reports.

## 1. Permission rules

### super_admin and admin

Can correct attendance records for any classroom and any past/completed session.

### teacher

- Can continue marking or editing attendance only during their own assigned classroom’s active session, following the existing lock rules.
- Cannot correct locked attendance.
- Cannot access correction pages, correction dialogs, or audit log pages.
- Must be blocked from direct route access too.

Important: existing teacher attendance lock rules must remain unchanged.

## 2. Correction rules

An attendance correction is an administrative action, not normal attendance marking.

Allow `super_admin` and `admin` to correct attendance when:

- The selected class session date is in the past, OR
- The selected class session for today has already ended in Cambodia timezone, OR
- An existing attendance record is locked.

Do not allow corrections for:

- Future class sessions.
- School holiday/closed dates.
- Dates outside the classroom study period.
- Dates not included in classroom learning days.
- Students who were not actively enrolled in that classroom on the selected date.
- Transferred-out, completed, cancelled, or inactive enrollments for dates outside their valid enrollment period.

The selectable status list must reuse the existing attendance status enum. Do not invent incompatible new statuses. Support all statuses already used in the project, such as:

- `present`
- `absent`
- `late`
- `permission`

## 3. Mandatory correction reason

Before an admin saves a correction, require:

1. Correction reason dropdown:
   - Teacher recorded wrong status
   - Student submitted valid explanation
   - Medical reason
   - System/data entry error
   - Other

2. Notes field:
   - Required when reason is `Other`
   - Optional for other reasons
   - Maximum 500 characters

3. Confirmation dialog before final save:

Example English text:

```text
Confirm Attendance Correction
You are changing this student's attendance record. This action will be recorded in the audit log.

Show:
- Student name and student code
- Class name and class code
- Attendance date
- Previous status
- New status
- Reason
- Notes if provided
4. Firestore audit log model
Create a new Firestore collection:

attendance_audit_logs

Create a separate model file. Each correction must create one immutable audit log document.
Suggested fields:


interface AttendanceAuditLog {
  id: string;

  attendanceId: string;
  classroomId: string;
  studentId: string;
  attendanceDate: string; // YYYY-MM-DD

  previousStatus: AttendanceStatus | null;
  newStatus: AttendanceStatus;

  correctionReason:
    | "teacher_wrong_status"
    | "student_valid_explanation"
    | "medical_reason"
    | "system_data_entry_error"
    | "other";

  correctionNote?: string;

  correctedById: string;
  correctedByName: string;
  correctedByUsername: string;
  correctedByRole: "super_admin" | "admin";

  correctedAt: Timestamp;

  studentSnapshot: {
    studentCode: string;
    fullNameKm?: string;
    fullNameEn?: string;
  };

  classroomSnapshot: {
    classCode: string;
    className: string;
  };

  teacherSnapshot?: {
    teacherId: string;
    fullName: string;
    username: string;
  };
}

Requirements:
- Never update, delete, or overwrite an existing audit log.
- Create a new log for every successful correction, including repeated corrections on the same attendance record.
- Use Firestore runTransaction or an atomic write mechanism:
  1. Read and validate the current attendance record.
  2. Update attendance status and correction metadata.
  3. Create the audit log document.
  4. Commit both operations atomically.
- Save attendance correction metadata on the attendance record too:

lastCorrectedAt
lastCorrectedById
lastCorrectedByName
lastCorrectionReason

- Do not overwrite original fields such as original createdBy, original attendance creation time, or original teacher record information.
5. Correction entry points
Add correction access in appropriate existing admin flows:
A. Student Attendance History
On each attendance record row, show Correct Attendance action only for super_admin and admin.
B. Monthly Class Attendance Report
Allow admin to open a session/date and correct an eligible student’s attendance record.
C. Optional dedicated route
Add an admin-only route:

/attendance-corrections

This page should help admin find a specific record quickly.
Filters:
- Date range
- Classroom
- Student search
- Teacher
- Current attendance status
- Corrected by
- Search by student code, student name, class code, or class name
Default date range: current month.
6. Audit log page
Add an admin-only page:

/attendance-audit-logs

Sidebar item:
- English: Attendance Audit Logs
- Khmer: appropriate Khmer translation
Display a clean responsive table with:
1. Corrected At
2. Student
3. Class
4. Attendance Date
5. Changed From
6. Changed To
7. Reason
8. Corrected By
9. Notes
10. Action: View Details
Requirements:
- Show old and new status as clear badges.
- Sort newest corrections first.
- Support pagination.
- Support filters:
  - Date range
  - Classroom
  - Student search
  - Corrected by
  - Previous status
  - New status
  - Correction reason
- Add View Details dialog/page showing full audit information.
- Audit logs are read-only: no edit and no delete actions.
- Provide empty states for no results.
7. UI/UX requirements
- Use the existing Vite React-compatible Shadcn UI setup only.
- Use a focused Dialog or Sheet for correction form; do not create a small crowded form.
- Make old/new status highly visible.
- Use warning color for correction action, but do not use destructive styling.
- Add loading states and prevent double-submit.
- Show success/error toast messages.
- Add all UI text to en.json and km.json.
- No mixed Khmer/English interface text based on global language.
- Stored student/class data can remain in their original language.
8. Suggested file structure
Keep implementation modular:

src/
├── models/
│   └── attendance-audit-log.model.ts
├── services/
│   ├── attendance-correction.service.ts
│   └── attendance-audit-log.service.ts
├── lib/
│   └── attendance-correction-validator.ts
├── components/attendance-corrections/
│   ├── attendance-correction-dialog.tsx
│   ├── attendance-correction-confirm-dialog.tsx
│   ├── attendance-correction-filters.tsx
│   ├── attendance-correction-table.tsx
│   ├── audit-log-table.tsx
│   ├── audit-log-filters.tsx
│   ├── audit-log-detail-dialog.tsx
│   └── attendance-status-change.tsx
├── pages/attendance/
│   ├── attendance-corrections-page.tsx
│   └── attendance-audit-logs-page.tsx
└── i18n/locales/
    ├── en.json
    └── km.json

9. Reports consistency
After an attendance correction:
- Daily Attendance Summary must refresh correctly.
- Monthly Class Attendance Report must refresh correctly.
- Student Attendance History and Student Monthly Report must refresh correctly.
- Absence & Late Report must refresh correctly.
- Excel export and print outputs must use the corrected attendance data.
- Audit log must remain historical even if the attendance record is corrected again later.
10. Verification checklist
Test all cases before completion:
1. Teacher cannot see or access correction/audit routes.
2. Admin can correct a past attendance record.
3. Admin cannot correct a future attendance record.
4. Admin cannot correct a holiday or invalid class schedule date.
5. A correction requires a reason.
6. Other reason requires notes.
7. Each correction atomically updates attendance and creates exactly one audit log.
8. Two consecutive corrections create two separate audit logs.
9. Audit log cannot be edited or deleted through UI.
10. Reports update to reflect corrected attendance values.
11. English and Khmer UI switch fully without mixed UI text.
12. Run npm run build and fix all TypeScript/build errors.
