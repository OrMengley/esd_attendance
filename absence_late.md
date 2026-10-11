Implement a new **Absence & Late Report** feature for the existing ESD Attendance Vite React + TypeScript + Firestore application.

This feature helps `super_admin` and `admin` identify students who are absent or late frequently during a selected month. Reuse existing attendance, student, enrollment, classroom, study package, holiday, user, i18n, and report utilities. Do not break existing reports or features.

## 1. Access and navigation

- Add sidebar navigation item:
  - English: `Absence & Late Report`
  - Khmer: appropriate Khmer translation
  - Suggested route: `/absence-late-report`
- Only `super_admin` and `admin` can access this report.
- `teacher` must not see this sidebar item and must be blocked from opening the route directly.

## 2. Report rules and data accuracy

For the selected month, calculate each student’s attendance only from valid scheduled class sessions:

- Include only class dates that match the classroom learning days and are within the classroom study period.
- Exclude school holidays/closed dates.
- Count only attendance records with:
  - `absent` as absence
  - `late` as late
- Do not count `present` as absence or late.
- Respect enrollment history:
  - Count a student only for dates where their enrollment was active in that classroom.
  - Do not count dates before enrollment, after transfer-out, or after enrollment completion/cancellation.
- A student transferred to another class should show report data based on each valid enrollment period only.
- Do not use hardcoded class duration, weekdays, or package hours.
- Do not create duplicate rows when a student has multiple enrollment records.
- Use Cambodia timezone for all date calculations.

## 3. Page design

Create a clean report page matching the existing school theme and existing report UI.

Header:

- Title: `Absence & Late Report`
- Short description: identify students who need attendance follow-up.
- Actions:
  - Export Excel
  - Print Report
  - Refresh

Top summary cards for the selected filters/month:

1. Students Flagged
2. Students with Absences
3. Students with Late Records
4. Total Absences
5. Total Late Records

Do not use generic copied subtitles such as `Classroom & Batch Management`. Each card must have a useful contextual subtitle.

Example:

- Students Flagged: `Matched the selected threshold`
- Total Absences: `Across the selected month`

## 4. Filters

Place filters in a clean card above the results table:

- Month picker (`YYYY-MM`), default to the current Cambodia month.
- Report type:
  - `Absence only`
  - `Late only`
  - `Absence or Late`
  - default: `Absence or Late`
- Minimum occurrences:
  - Numeric input, minimum `1`, default `1`.
  - Example: selecting `3` means show students with at least 3 absences, 3 late records, or either one based on selected report type.
- Classroom filter, default `All Classes`.
- Teacher filter, default `All Teachers`.
- Study package filter, default `All Study Packages`.
- Schedule filter:
  - `All Schedules` as default
  - `Monday–Friday (Weekday)`
  - `Saturday–Sunday (Weekend)`
- Student search by Khmer name, English name, student code, phone, or guardian phone.
- Clear filters button.

Important: never default schedule to Weekday, because weekend classes must not be hidden accidentally.

## 5. Results table

Show only students matching the selected threshold. Use a responsive desktop table and compact mobile cards.

Desktop columns:

1. Rank
2. Student
   - Avatar/photo if available
   - Khmer name / English name
   - Student code
3. Current Class
   - Class name and class code
4. Assigned Teacher
5. Scheduled Sessions
   - valid scheduled sessions for this student in the selected month
6. Present
7. Absent
   - red count badge when greater than zero
8. Late
   - amber count badge when greater than zero
9. Attendance Rate
   - calculate from valid scheduled sessions
10. Last Incident
   - latest absence or late date/status in selected month
11. Actions
   - `View Student History`

Requirements:

- Default sort: highest absence count first, then highest late count, then student name.
- Use pagination when there are many results.
- Show a clear empty state when no students match the filters.
- For `View Student History`, navigate to the existing student attendance history page with the selected student and month preselected when possible.
- Student/class data names may remain Khmer if those are stored data; all UI labels, buttons, empty states, and table headers must follow the global English/Khmer language setting only.

## 6. Student report drill-down

When admin clicks `View Student History`:

- Reuse the existing Student Attendance History & Monthly Student Report feature.
- Automatically apply the selected month.
- Clearly show the student’s absence and late totals for that month.
- Do not create a duplicate student report implementation.

## 7. Print view

Add a dedicated print-friendly route or print layout for this report.

Print header must include:

- School logo and school name if available
- Report title
- Selected month
- Applied filters
- Generated date/time in Cambodia timezone

The printed table should include only meaningful columns:

- No.
- Student
- Student Code
- Class
- Teacher
- Scheduled Sessions
- Absent
- Late
- Attendance Rate
- Last Incident

Use landscape print layout. Hide sidebar, filter controls, action buttons, pagination controls, and action column during printing.

## 8. Excel export

Export the currently filtered result set to Excel.

Excel sheet title: `Absence & Late Report`

Include:

- Report month
- Applied filters
- Generated date/time
- Student name
- Student code
- Class
- Teacher
- Schedule type
- Valid scheduled sessions
- Present count
- Absent count
- Late count
- Attendance rate
- Last incident date
- Last incident status

Export exactly the same filtered rows shown in the report, not unrelated students.

## 9. Suggested file structure

Keep code modular; do not place everything in one file.

src/
├── models/
│   └── absence-late-report.model.ts
├── services/
│   └── absence-late-report.service.ts
├── lib/
│   └── absence-late-report-calculator.ts
├── components/reports/absence-late/
│   ├── absence-late-filters.tsx
│   ├── absence-late-summary-cards.tsx
│   ├── absence-late-table.tsx
│   ├── absence-late-mobile-card.tsx
│   ├── absence-late-print-view.tsx
│   └── absence-late-empty-state.tsx
├── pages/reports/
│   ├── absence-late-report-page.tsx
│   └── absence-late-report-print-page.tsx
└── i18n/locales/
    ├── en.json
    └── km.json

## 10. Quality requirements

- Use only the existing Vite React-compatible Shadcn UI setup. Do not add Next.js components, imports, or packages.
- Fully support light/dark mode if the project already has it.
- Fully responsive: table on desktop, cards on mobile, no horizontal overflow.
- Add all new UI text to both `en.json` and `km.json`.
- Do not display untranslated keys such as `report.absenceLate.title`.
- Reuse existing Firestore data and helper functions where possible.
- Avoid N+1 Firestore reads as much as practical; fetch and map related users/classes/packages efficiently.
- Run `npm run build` and fix all TypeScript/build errors before completion.
- Test these cases:
  1. Student with multiple absences is shown.
  2. Student with late records is shown.
  3. Student with no absence/late does not show when minimum is 1.
  4. Holiday and non-learning days are excluded.
  5. Transferred student is counted only for valid enrollment dates.
  6. English and Khmer UI switch cleanly without mixed interface text.
  7. Excel export and print output use the active filters.