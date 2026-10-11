Implement a complete **Monthly Class Attendance Report** feature for the existing ESD Attendance Vite React + TypeScript + Firestore project.

This is a reporting and export feature. Do not change existing student, classroom, enrollment, holiday, or daily attendance business logic.

The report is for **one classroom for one selected month**.

Use existing data from:

```text
classrooms
students
enrollments
attendance
school_holidays
users
study_packages
```

Keep the existing Vite React + Tailwind + Shadcn UI architecture. Do not use Next.js packages or components.

## 1. Access and routes

Create an Attendance Reports page:

```text
/attendance-reports
```

Permissions:

- `super_admin` and `admin`: can create reports for all classrooms.
- `teacher`: can create/view reports only for classrooms currently or previously assigned to that teacher.
- Teachers must not access another teacher’s classes.

Add a Sidebar menu item:

```text
Attendance Reports
```

Place it near Daily Attendance and Attendance History.

## 2. Report filters

At the top of the page, add a clean report filter card with:

- Classroom — required, searchable select/dialog
- Month — required month picker (`YYYY-MM`)
- Report language — Khmer / English, default to current application language
- Generate Report button
- Print button — enabled only after report generation
- Export Excel button — enabled only after report generation
- Export PDF button — optional if implementation is stable; otherwise keep Print as the PDF browser workflow

When classroom is selected, show a compact classroom summary:

```text
Class name and code
Study package
Assigned teacher
Schedule type: Weekday or Weekend
Learning days
Class time
```

## 3. Important report date logic

Do not copy a static 31-day Excel layout.

Generate attendance date columns dynamically based on the selected classroom and selected month.

Include a date column only when all conditions are true:

1. Date is inside the selected month.
2. Date is on the classroom `learningDays`.
3. Date is on or after classroom `startDate`.
4. Date is on or before `expectedEndDate` or `actualEndDate`, when applicable.
5. Date is not an active School Holiday.

This means:

### Weekday classroom

For a Monday–Friday classroom:

```text
Show only Monday to Friday scheduled dates.
Do not create Saturday/Sunday attendance columns.
```

### Weekend classroom

For a Saturday–Sunday classroom:

```text
Show only Saturday and Sunday scheduled dates.
Do not create Monday–Friday attendance columns.
```

### School holiday handling

If a scheduled class date is an active holiday:

- Do not count it as an expected session.
- Show it in the report calendar header as a muted holiday column or holiday marker if useful.
- Display `H` / `Holiday` / `School Closed`.
- Do not count it toward attendance totals or attendance percentage.

Do not mark students absent on holidays.

## 4. Report table design

Create a horizontally scrollable attendance matrix on desktop and mobile.

Freeze/sticky the first columns where practical:

```text
No.
Student Code
Student Name
```

Then generate one compact column for each valid class session date.

Each date header must show:

```text
Day number
Short weekday name
```

Example:

```text
01 Mon
02 Tue
03 Wed
```

Use clear weekend/date styling where appropriate, but do not create columns for non-learning days.

At the end of the table, show summary columns:

```text
Present
Absent
Late
Permission
Total Sessions
Attendance Rate
```

Use the currently active enrollment list for the selected classroom/month.

Enrollment eligibility rules:

- Include students who have an enrollment that overlaps the selected month.
- Respect enrollment start date, end date, transfer date, and status.
- Do not include cancelled enrollments.
- If a student transferred into the class mid-month, show `—` for dates before transfer.
- If a student transferred out mid-month, show `—` for dates after transfer.
- Do not count `—` cells in totals.

## 5. Attendance codes and visual states

Use clear compact report codes:

```text
P = Present
A = Absent
L = Late
E = Permission
H = School Holiday
— = No expected class session for this student
```

Use semantic colors:

- `P`: green
- `A`: red
- `L`: amber/orange
- `E`: blue
- `H`: muted gray/gold
- `—`: neutral gray

Add a report legend above or below the table.

If no attendance record exists for an expected class session date:

```text
Show a neutral pending/blank state.
Do not automatically count it as Absent.
```

Use a safe code such as:

```text
• or —
```

and exclude it from `Total Sessions` until attendance has been recorded.

## 6. Calculations

For each student calculate:

```ts
presentCount
absentCount
lateCount
permissionCount
recordedSessionCount
expectedSessionCount
attendanceRate
```

Attendance rate formula:

```text
(Present + Late + Permission) / Recorded Expected Sessions × 100
```

Rules:

- Exclude active holidays.
- Exclude dates outside enrollment period.
- Exclude unrecorded/pending attendance dates from the denominator.
- Do not treat Late or Permission as Absent.
- Round attendance rate to one decimal place.

Also show report summary cards above the table:

```text
Enrolled Students
Scheduled Sessions
Recorded Attendance Sessions
Overall Present
Overall Absent
Overall Attendance Rate
```

Calculate overall rate from actual aggregate totals, not the average of student percentages.

## 7. Report header and print layout

Build a dedicated printable report layout.

Header must include:

```text
School logo
School name
Monthly Attendance Report
Selected month and year
Class name and code
Study package
Teacher name
Schedule type and learning days
Class time
Generated date/time in Asia/Phnom_Penh
```

Footer must include:

```text
Prepared by
Teacher signature line
Admin signature line
Page number when printing
```

For print:

- Use landscape orientation.
- Use compact readable cells.
- Repeat table header on printed pages when possible.
- Ensure long tables remain readable.
- Hide normal sidebar, top navigation, filters, and action buttons in print mode.
- Use the school Royal Blue + Gold brand theme subtly in the report header only.
- Do not print unnecessary UI controls.

## 8. Export Excel

Implement a real `.xlsx` export for the generated report.

Excel output requirements:

- File name format:

```text
Attendance_Report_{CLASS_CODE}_{YYYY-MM}.xlsx
```

- Include the school name, report title, classroom information, month, teacher, and generated date.
- Include the same dynamic date columns and summary columns as the UI report.
- Apply readable styling:
  - Royal Blue title/header
  - Gold accent for report title area
  - Status cell colors
  - Frozen first header row
  - Frozen Student Code and Student Name columns when supported
  - Landscape page orientation
  - Fit-to-width printing
- Do not use a hardcoded 31-day layout.
- Export should work correctly for both Weekday and Weekend schedules.

Use a browser-safe spreadsheet library already compatible with the project, or add one only if necessary.

## 9. i18n

Add complete Khmer and English translation keys for:

```text
attendanceReports.title
attendanceReports.monthlyReport
attendanceReports.selectClassroom
attendanceReports.selectMonth
attendanceReports.generateReport
attendanceReports.printReport
attendanceReports.exportExcel
attendanceReports.exportPdf
attendanceReports.noReportData
attendanceReports.classInformation
attendanceReports.scheduleType
attendanceReports.learningDays
attendanceReports.totalSessions
attendanceReports.recordedSessions
attendanceReports.attendanceRate
attendanceReports.present
attendanceReports.absent
attendanceReports.late
attendanceReports.permission
attendanceReports.holiday
attendanceReports.pending
attendanceReports.noExpectedSession
attendanceReports.preparedBy
attendanceReports.teacherSignature
attendanceReports.adminSignature
attendanceReports.generatedAt
```

Do not show raw translation keys in any UI.

## 10. Required verification

Test at least these scenarios:

1. Weekday class in a selected month:
   - Only Mon–Fri scheduled class dates appear.
   - Weekend dates do not appear.
   - Active holidays do not count as scheduled sessions.

2. Weekend class in a selected month:
   - Only Saturday and Sunday dates appear.
   - Weekday dates do not appear.

3. Student transfers into a class in the middle of a month:
   - Dates before transfer show `—` and do not affect totals.

4. Student transfers out during a month:
   - Dates after transfer show `—` and do not affect totals.

5. Present, Absent, Late, Permission, Holiday, and unrecorded attendance render correctly.

6. Excel export has correct dynamic date columns, totals, and colors.

7. Print view is landscape, hides app navigation, and is readable.

8. Teacher can access only their assigned classrooms.

9. Run:

```bash
npm run build
```

Fix all TypeScript, Firestore, i18n, export, and build errors before completion.