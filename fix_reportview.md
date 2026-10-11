Refactor the existing **Monthly Attendance Report** UI in the ESD Attendance Vite React + TypeScript + Firestore project.

The current `/attendance-reports` page shows the full Monthly Attendance Matrix directly below the filters. This becomes too crowded when a month has many class sessions or a classroom has many students.

Do not change report calculations, Firestore queries, attendance codes, enrollment eligibility, holiday exclusions, permissions, Excel export logic, or i18n behavior. Refactor the report viewing flow and print experience only.

## Required new flow

### 1. Keep `/attendance-reports` as Report Setup page

The existing route:

```text
/attendance-reports
```

must become a clean report setup and summary page.

Keep only:

- Page title and short description
- Classroom selector
- Month / Year selector
- Optional report language selector
- Classroom information summary after selection:
  - Class name and code
  - Study package
  - Assigned teacher
  - Schedule type
  - Learning days
  - Session time
  - Start date
- Summary cards:
  - Enrolled Students
  - Scheduled Sessions
  - Recorded Sessions
  - Present
  - Absent
  - Attendance Rate

Do not render the large Monthly Attendance Matrix table on this page anymore.

Replace the current `Generate Report` behavior with a primary button:

```text
View Monthly Report
```

When clicked, navigate to a dedicated report preview route.

## 2. Add a dedicated Monthly Report Preview route

Create a new route:

```text
/attendance-reports/monthly/:classroomId/:yearMonth
```

Example:

```text
/attendance-reports/monthly/classroom-001/2026-10
```

This page is the full Monthly Attendance Matrix report.

Access rules must remain unchanged:

- `super_admin` and `admin` can view reports for all classrooms.
- `teacher` can view reports only for classrooms assigned to that teacher.
- Invalid classroom/month/permission must show a friendly not-found or unauthorized state.

## 3. Monthly Report Preview page layout

This route must use a report/print-preview layout, not the normal dashboard layout.

Requirements:

- Do not show the normal Sidebar.
- Do not show the normal Top Header.
- Use the full browser width.
- Use a clean white printable report surface.
- Page background can be light gray only outside the report document.
- Center a report document container with a wide landscape-friendly layout.
- On desktop, do not unnecessarily constrain the report width.
- On mobile, allow horizontal scrolling for the matrix while keeping the report header readable.

At the top of the screen, outside the printable document, show a compact action toolbar:

```text
Back to Reports
Print / Save as PDF
Export Excel
```

This toolbar must be hidden when printing.

## 4. Printable report document

Inside the report document, render:

### School header

- Official school logo
- School name
- `Monthly Attendance Report`
- Selected month and year
- Generated date/time in `Asia/Phnom_Penh`

Use the project Royal Blue + Gold branding subtly:

```text
Royal Blue: #1E347B / #314B9C
Gold accent: #F3B51B
```

Do not use excessive gradients.

### Classroom information section

Show in a compact structured layout:

```text
Class name
Class code
Study package
Assigned teacher
Schedule type
Learning days
Session time
Study period
```

### Attendance legend

Show compact status legend:

```text
P = Present
A = Absent
L = Late
E = Permission
H = School Holiday
• = Pending / Not yet recorded
— = Not expected for this student
```

### Monthly Attendance Matrix

Render the existing dynamic matrix:

```text
No.
Student Code
Student Name
Sex
Dynamic valid session date columns
P
A
L
E
Total
Attendance Rate
```

Rules:

- Keep the existing dynamic date column logic.
- Continue showing only valid classroom learning dates.
- Continue respecting weekday/weekend schedules.
- Continue excluding active holidays from expected session totals.
- Continue respecting transfers and enrollment start/end dates.
- Keep status colors semantic.
- Use sticky first columns in screen mode when possible.
- Use readable compact font/cell spacing without making text too small.
- Include Overall Totals row.

### Report footer

Include:

```text
Prepared by
Teacher signature line
Admin signature line
Page number when printing
```

## 5. Print / Save as PDF behavior

Do not build a separate embedded PDF viewer.

Use browser printing as the PDF workflow:

```text
Click “Print / Save as PDF”
→ window.print()
→ browser print dialog
→ user can select “Save as PDF”
```

Create dedicated print CSS:

```css
@media print
```

Print requirements:

- Landscape orientation.
- Hide action toolbar and all non-report UI.
- Hide page background.
- Print only the report document.
- Preserve table header visibility when possible across printed pages.
- Ensure report header and classroom information print once at top.
- Use readable borders and text colors.
- Avoid clipped columns.
- Use page margins appropriate for A4 landscape.
- Do not print navigation, buttons, or browser-only controls.

If many students require multiple pages:

- Repeat table header across pages when possible.
- Do not break a student row across pages.
- Keep summary/overall totals readable.

## 6. Navigation behavior

From `/attendance-reports`:

- Select classroom and month.
- Click `View Monthly Report`.
- Navigate to the new preview route with selected classroom and month.

From preview route:

- `Back to Reports` returns to `/attendance-reports`.
- Preserve previous selected classroom/month in URL query parameters or local state if practical.

## 7. i18n

Add Khmer and English translations for:

```text
attendanceReports.viewMonthlyReport
attendanceReports.backToReports
attendanceReports.printSavePdf
attendanceReports.reportPreview
attendanceReports.monthlyAttendanceReport
attendanceReports.generatedAt
attendanceReports.preparedBy
attendanceReports.teacherSignature
attendanceReports.adminSignature
attendanceReports.overallTotals
attendanceReports.unauthorizedReport
attendanceReports.reportNotFound
```

Do not show raw translation keys.

## 8. Verification

Verify all of the following:

1. `/attendance-reports` no longer renders the large matrix table.
2. The setup page remains clean and usable on desktop/mobile.
3. Clicking `View Monthly Report` opens the dedicated preview route.
4. Preview route has no normal sidebar/top header.
5. Monthly matrix displays correctly with dynamic class dates.
6. Weekday and Weekend classes still show only their valid session dates.
7. Print button opens browser print dialog.
8. Print preview is landscape and hides toolbar/navigation.
9. Export Excel still works from the preview page.
10. Teacher access restriction still works.
11. Run:

```bash
npm run build
```

Fix all TypeScript, routing, i18n, print CSS, and build errors before completion.