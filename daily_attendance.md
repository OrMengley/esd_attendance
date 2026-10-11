Implement the complete Daily Attendance feature for the ESD Attendance system using existing Vite React, TypeScript, shadcn/ui, Firebase Firestore, React Router, authentication, role permissions, Classes, Students, and Enrollments.

Do not build Attendance History/Reports in this task. This task is only Daily Attendance recording.

## Firestore collection

Use one collection:

```text
attendance
```

Use a deterministic Firestore document ID:

```text
{classroomId}_{attendanceDate}_{studentId}
```

Example:

```text
class_001_2026-10-05_student_001
```

This prevents duplicate attendance records when the same class/date/student is saved again.

## Attendance model

Create/update:

```text
src/models/attendance.model.ts
```

```ts
export type AttendanceStatus =
  | "present"
  | "absent"
  | "late"
  | "permission";

export interface Attendance {
  id: string;
  attendanceDate: string; // YYYY-MM-DD

  studentId: string;
  enrollmentId: string;
  classroomId: string;
  packageId: string;
  teacherId: string;

  status: AttendanceStatus;
  remark?: string;

  recordedBy: string;
  recordedAt: string;
  updatedBy?: string;
  updatedAt?: string;
}
```

## Attendance service

Create:

```text
src/services/attendance.service.ts
```

Required functions:

```ts
getAttendanceByClassAndDate(classroomId, attendanceDate)
getEligibleStudentsForAttendance(classroomId, attendanceDate)
saveDailyAttendance({
  classroom,
  attendanceDate,
  records,
  currentUserId
})
```

Rules:

1. Use Firestore `writeBatch()` to save all student attendance records together.
2. Use `setDoc(..., { merge: true })` with the deterministic document ID.
3. If attendance already exists for the same class/date/student:
   - update existing record
   - set `updatedBy` and `updatedAt`
   - do not create duplicate documents
4. If attendance does not exist:
   - create the new record
   - set `recordedBy` and `recordedAt`
5. Firestore operations must stay inside the service file, not page components.

## Eligible student rule

Load students from `enrollments` and `students`, not from `student.classroomId`.

A student is eligible on the selected attendance date only if:

```text
- Student is not archived/inactive
- Enrollment belongs to selected classroom
- Enrollment startDate is on or before selected date
- Enrollment status/date means the student belonged to that class on that date
```

Important transfer rule:

```text
Attendance before transfer → old class enrollment
Attendance from transfer date onward → new class enrollment
```

Do not show students transferred out before the selected date.
Do not show students transferred into the class before their enrollment start date.

Support enrollment statuses properly:
- `active`: eligible from startDate through expectedEndDate
- `transferred`: eligible only until actualEndDate
- `completed`: eligible only until actualEndDate
- `paused` and `cancelled`: not eligible for new attendance by default

## Route

Use:

```text
/attendance
```

Sidebar label:
- Khmer: `កត់ត្រាវត្តមាន`
- English: `Daily Attendance`

## Permissions

```text
super_admin:
- View and record attendance for all active classes

admin:
- View and record attendance for all active classes

teacher:
- View and record attendance only for active classes where:
  classroom.assignedTeacherId === currentUser.id
```

Teacher must never see or access other teachers’ classes, including by manually changing URL or client state.

## Daily Attendance page UI

Create/refactor:

```text
src/pages/attendance/daily-attendance-page.tsx
```

Create components:

```text
src/components/attendance/attendance-header.tsx
src/components/attendance/class-attendance-selector.tsx
src/components/attendance/attendance-summary.tsx
src/components/attendance/attendance-student-table.tsx
src/components/attendance/attendance-status-control.tsx
```

Page flow:

1. Show page title and description.
2. Default Attendance Date to today in Cambodia timezone.
3. Select Class:
   - For teacher: show only their assigned active classes.
   - For admin/super_admin: searchable class selector with active classes.
4. When class and date are selected:
   - Validate that selected date matches `classroom.scheduleDays`.
   - If it is not a scheduled learning day, show warning and disable attendance save.
   - If it is valid, load eligible students and existing attendance.
5. If existing attendance is found, load saved statuses/remarks for editing.
6. If no attendance exists:
   - Initialize every eligible student as `present`
   - Show clear unsaved state
7. Save Attendance button saves all records.

## Page top information card

After selecting Class, show:

```text
Class Name and Code
Study Package
Assigned Teacher
Schedule
Attendance Date
Total Eligible Students
```

## Attendance summary cards

Show live counts:

```text
Total Students
Present
Absent
Late
Permission
```

## Student attendance table

Desktop columns:

```text
No.
Student
Student Code
Parent Contact
Status
Remark
```

Student cell:
- Avatar
- Khmer name
- English name if available

Status control:
- Present
- Absent
- Late
- Permission

Use clear colored buttons/badges:
- Present: green
- Absent: red
- Late: amber/orange
- Permission: blue

Each student row must support:
- Click a status button to change status
- Optional remark input
- Existing saved status must load correctly

Mobile:
- Use compact cards, not an overflowing table.

## Mark All Present

Add button:

```text
វត្តមានទាំងអស់
Mark All Present
```

Behavior:
- Set all currently displayed eligible students to `present`.
- Do not auto-save; user must click Save Attendance.

## Save behavior

Save button:
- Disabled until a class is selected.
- Disabled when selected date is not a scheduled learning day.
- Disabled while saving.
- On success:
  - Show success toast
  - Keep the saved data visible
  - Refresh data from Firestore
- On failure:
  - Show error toast
  - Do not clear entered values

Khmer messages:

```text
attendance.selectClass: "សូមជ្រើសរើសថ្នាក់រៀន"
attendance.noClassToday: "ថ្នាក់នេះមិនមានកាលវិភាគរៀននៅថ្ងៃដែលបានជ្រើសរើសទេ"
attendance.noStudents: "មិនមានសិស្សសកម្មក្នុងថ្នាក់នេះទេ"
attendance.markAllPresent: "វត្តមានទាំងអស់"
attendance.save: "រក្សាទុកវត្តមាន"
attendance.saved: "កត់ត្រាវត្តមានបានជោគជ័យ"
attendance.updated: "កែប្រែវត្តមានបានជោគជ័យ"
attendance.unsaved: "មិនទាន់រក្សាទុក"
```

Add matching English translations.

## Important safeguards

- Do not create attendance records automatically when opening the page.
- Do not allow duplicate records for the same class/date/student.
- Do not show all students globally. Only show eligible enrolled students.
- Do not show students outside the selected class.
- Do not show a transferred-out student in the new class before their effective transfer date.
- Do not modify old attendance when student transfers class.
- Do not implement Attendance History in this task.
- Do not use mock data.
- Do not use Next.js imports.

## Files

```text
src/models/attendance.model.ts
src/services/attendance.service.ts
src/pages/attendance/daily-attendance-page.tsx
src/components/attendance/attendance-header.tsx
src/components/attendance/class-attendance-selector.tsx
src/components/attendance/attendance-summary.tsx
src/components/attendance/attendance-student-table.tsx
src/components/attendance/attendance-status-control.tsx
src/i18n/locales/km.json
src/i18n/locales/en.json
```

Finally:
- Run `npm run build`.
- Fix all TypeScript, Firestore, i18n, permission, and UI errors.
- Verify in browser:
  1. Admin can select an active class.
  2. Teacher can see only own assigned class.
  3. Students with active enrollment appear.
  4. Mark All Present works.
  5. Status and remark can be edited.
  6. Save works.
  7. Saving again updates records without duplicates.