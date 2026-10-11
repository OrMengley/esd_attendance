Implement **Student Attendance History & Monthly Student Report** for the existing ESD Attendance Vite React + TypeScript + Firestore project.

This feature lets an authorized user select one student, review their attendance across all enrollment history, filter a selected month, and print/save a professional monthly student attendance report.

Do not change existing attendance records, classroom report calculations, enrollment transfer logic, holiday logic, or daily attendance workflow.

Use existing collections:

```text
students
enrollments
classrooms
attendance
school_holidays
users
study_packages
```

Keep Vite React + Tailwind + Shadcn UI only. Do not use Next.js packages or components.

## 1. Roles and access control

### super_admin and admin

Can:

- Search and view all students.
- View all attendance history and enrollment history.
- Generate and print a monthly report for any student.

### teacher

Can:

- Search/view only students who are or were enrolled in a classroom assigned to that teacher.
- View attendance only for the student’s enrollment period in that teacher’s classroom.
- Generate/print reports only for those permitted student/class records.
- Never view students from another teacher’s classroom.

Enforce permission checks in data queries/services, not only in UI filtering.

## 2. Routes

Create routes:

```text
/student-attendance
/student-attendance/:studentId
/student-attendance/:studentId/monthly/:yearMonth
```

Examples:

```text
/student-attendance
/student-attendance/student-001
/student-attendance/student-001/monthly/2026-10
```

Add Sidebar menu item:

```text
Student Attendance
```

For teachers, place it near Daily Attendance and Attendance History.

## 3. Student Attendance Search page

Route:

```text
/student-attendance
```

Create a clean search/list page.

### Search and filters

Include:

- Search input:
  - Student code
  - Khmer name
  - English name
  - Phone number
- Optional Classroom filter
- Optional Student status filter
- For admin/super_admin: show all permitted students.
- For teacher: show only permitted students.

### Student list/table

Desktop columns:

```text
Student
Student Code
Current / Latest Class
Assigned Teacher
Enrollment Status
Attendance Rate
Actions
```

Mobile: use compact cards.

Each row action:

```text
View Attendance History
```

Show a useful empty state when no student is found.

## 4. Student Attendance History detail page

Route:

```text
/student-attendance/:studentId
```

Create a full detail page with:

### Student profile header

Show:

```text
Avatar
Student Khmer name
Student English name, if available
Student code
Gender
Phone, if available
Student status
```

Actions:

```text
Back
Print Monthly Report
```

### Attendance summary cards

Calculate only from recorded expected class sessions:

```text
Present
Absent
Late
Permission
Recorded Sessions
Attendance Rate
```

Formula:

```text
(Present + Late + Permission) / Recorded Expected Sessions × 100
```

Do not include:

- School holidays
- Dates before enrollment start
- Dates after enrollment end/transfer
- Pending/unrecorded attendance
- Cancelled enrollments

### Enrollment History section

Display every enrollment chronologically:

```text
Class name and code
Study package
Teacher
Schedule type
Start date
Expected end date
Actual end date, if any
Enrollment status
Transfer information, if applicable
```

Let the user select an enrollment/class to filter attendance history.

### Attendance timeline/table

Show individual attendance records with:

```text
Date
Class
Teacher
Status
Remark
Recorded by
Last updated by
```

Support filters:

```text
All Time
Selected Month
Date range
Selected Enrollment/Class
Attendance status
```

Use status colors:

```text
Present = green
Absent = red
Late = amber/orange
Permission = blue
```

Show School Holiday / No Scheduled Class only as informative calendar context when useful. Do not create fake attendance records for them.

## 5. Monthly Student Report setup

On Student Attendance Detail page, add a clearly visible action:

```text
View Monthly Student Report
```

When clicked:

1. Let user choose:
   - Month / Year — required
   - Enrollment/Class — required only if the student has multiple overlapping/previous enrollments relevant to that month
2. Navigate to:

```text
/student-attendance/:studentId/monthly/:yearMonth
```

Pass selected enrollment/class through query parameter if needed:

```text
?enrollmentId=...
```

If the student has only one valid enrollment in that month, select it automatically.

## 6. Monthly Student Report preview page

Create a dedicated print-preview page.

Requirements:

- No normal Sidebar.
- No normal dashboard Top Header.
- Full-width print-preview layout.
- Small non-print toolbar at top:

```text
Back to Student Attendance
Print / Save as PDF
```

- Toolbar must be hidden in print mode.

### Report header

Show:

```text
Official school logo
School name
Monthly Student Attendance Report
Selected month and year
Generated date/time in Asia/Phnom_Penh
```

Use the existing Royal Blue + Gold school theme subtly.

### Student and class information

Show:

```text
Student name
Student code
Gender
Class name and code
Study package
Assigned teacher
Schedule type
Learning days
Session time
Enrollment start date
Expected end date
```

### Monthly attendance calendar/table

Do not use a static 31-day calendar.

Generate only valid classroom learning dates for that student’s selected enrollment and month:

1. Date is inside selected month.
2. Date matches classroom `learningDays`.
3. Date is on/after enrollment start date.
4. Date is on/before enrollment end/transfer date, if applicable.
5. Date is inside classroom study period.
6. Active school holidays are excluded from expected sessions.

Display a compact monthly table:

```text
Date
Day
Attendance Status
Remark
Recorded by
```

Optional: group records by week for readability.

For valid scheduled class days:

```text
P = Present
A = Absent
L = Late
E = Permission
• = Pending / Not yet recorded
H = School Holiday
— = Not expected
```

Do not count `H`, `—`, or pending records in attendance rate.

### Monthly summary

Show:

```text
Scheduled Sessions
Recorded Sessions
Present
Absent
Late
Permission
Attendance Rate
```

Add a concise status legend.

### Footer

Include:

```text
Prepared by
Teacher signature line
Director / Admin signature line
```

## 7. Print / Save as PDF

Use browser print workflow:

```ts
window.print()
```

Do not create an embedded PDF viewer.

Add dedicated `@media print` CSS:

- A4 portrait orientation for the single-student report.
- Hide action toolbar and all non-report UI.
- Print only the report document.
- Preserve logo, report header, student/class information, table, summary, and signatures.
- Use readable borders and color contrast.
- Avoid splitting individual table rows across pages.
- Include page numbers if practical.

## 8. i18n

Add complete Khmer and English translations for keys similar to:

```text
studentAttendance.title
studentAttendance.searchStudents
studentAttendance.viewHistory
studentAttendance.attendanceHistory
studentAttendance.enrollmentHistory
studentAttendance.selectEnrollment
studentAttendance.allTime
studentAttendance.dateRange
studentAttendance.monthlyReport
studentAttendance.viewMonthlyReport
studentAttendance.printSavePdf
studentAttendance.studentInformation
studentAttendance.classInformation
studentAttendance.scheduledSessions
studentAttendance.recordedSessions
studentAttendance.attendanceRate
studentAttendance.preparedBy
studentAttendance.teacherSignature
studentAttendance.adminSignature
studentAttendance.noAttendanceRecords
studentAttendance.unauthorized
```

Do not display raw i18n keys.

## 9. Required verification

Test these cases:

1. Admin can search any student and view all valid enrollment/attendance history.
2. Teacher sees only students from their assigned classrooms.
3. Student with transfer history:
   - Old class attendance remains visible.
   - New class attendance appears separately.
   - Attendance is never mixed incorrectly across classes.
4. Student who joined mid-month:
   - Dates before enrollment show as not expected and do not affect totals.
5. Student transferred out mid-month:
   - Dates after transfer do not affect totals.
6. Holiday dates do not affect scheduled/recorded attendance totals.
7. Student monthly report prints correctly in A4 portrait.
8. Attendance rate excludes pending, holiday, and non-enrollment dates.
9. Run:

```bash
npm run build
```

Fix all TypeScript, Firestore, permissions, i18n, routing, and print CSS errors before completion.