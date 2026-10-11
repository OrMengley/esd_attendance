Implement a new **Class Progress / Completion Report** for the existing ESD Attendance Vite React + TypeScript + Firestore application.

Purpose: help `super_admin` and `admin` monitor each classroom’s learning progress, total planned hours, completed hours, remaining hours, expected end date, and student capacity.

Reuse existing classroom, study package, enrollment, school holiday, attendance schedule, user, i18n, and report utilities. Do not break current reports or features.

## 1. Access and navigation

- Add sidebar item:
  - English: `Class Progress Report`
  - Khmer: appropriate Khmer translation
  - Suggested route: `/class-progress-report`
- Only `super_admin` and `admin` can access this report.
- Hide the menu item from `teacher`.
- Block direct route access for `teacher`.

## 2. Accurate class progress calculation

Create reusable progress-calculation utilities. Use Cambodia timezone for all date/time comparisons.

### Planned Hours

`plannedHours` must come from the selected Study Package:

```ts
plannedHours = studyPackage.total_hours;

Do not hardcode 40 hours, 2 months, or 3 months.
Completed Hours
completedHours means the total duration of valid class sessions that have already ended.
Count a session only when all conditions are true:
- The date matches the classroom learning_days.
- The date is on or after the class start_date.
- The date is on or before the class expected_end_date.
- The date is not an active school holiday/closed date.
- The scheduled class session has already ended based on end_time in Cambodia timezone.
- For past dates, count the session.
- For today, count the session only after the class end_time has passed.
- For future dates, do not count the session.
Calculation:

completedHoursRaw = completedSessionCount * (session_minutes / 60);
completedHours = Math.min(completedHoursRaw, plannedHours);
remainingHours = Math.max(0, plannedHours - completedHours);
progressPercent =
  plannedHours > 0
    ? Math.min((completedHours / plannedHours) * 100, 100)
    : 0;

Important:
- Do not calculate completed hours by counting present students.
- A class session can be completed even if attendance was not recorded yet.
- Attendance records are not the source of class progress.
- Exclude holidays correctly.
- A future session must never increase completed hours.
- Use decimal display only when needed, for example 10.5 hrs; otherwise display 10 hrs.
Capacity
Use active/current enrollments only:

enrolledStudents = active enrollment count for the classroom;
capacity = classroom.capacity;
availableSeats = Math.max(0, capacity - enrolledStudents);
capacityPercent =
  capacity > 0 ? (enrolledStudents / capacity) * 100 : 0;

Do not count transferred-out, completed, cancelled, or inactive enrollments as current students.
3. Report page UI
Create a clean admin report page consistent with the existing ESD Attendance report style.
Header:
- Title:
  - English: Class Progress Report
- Description:
  - English: Track classroom learning hours, expected completion, and student capacity.
- Actions:
  - Refresh
  - Print Report
  - Export Excel
4. Summary cards
Show summary cards based on active filters:
1. Total Classes
2. Active Classes
3. Completed Classes
4. Average Progress
5. Classes Near Completion
6. Overdue Classes
Definitions:
- Classes Near Completion: active classes with progress >= 80% and remaining hours > 0.
- Overdue Classes: class has remaining hours > 0 and expected end date is before today in Cambodia timezone.
- Do not display generic copied subtitles.
- Each card must have a meaningful subtitle and use correct global i18n.
Example subtitles:
- Active Classes: Currently running classes
- Average Progress: Across filtered classes
- Overdue Classes: Expected end date has passed
5. Filters
Add a clean filter card:
- Search by class name or class code.
- Class status:
  - All Statuses
  - Active
  - Completed
  - Inactive
  - default: Active
- Study Package:
  - default: All Study Packages
- Assigned Teacher:
  - default: All Teachers
  - show only active users where role === "teacher".
  - never include super_admin or admin.
- Schedule:
  - All Schedules
  - Monday–Friday (Weekday)
  - Saturday–Sunday (Weekend)
  - default: All Schedules
- Progress range:
  - All Progress
  - Not Started (0%)
  - In Progress (1–79%)
  - Near Completion (80–99%)
  - Completed (100%)
- Completion health:
  - All
  - On Track
  - Overdue
- Clear Filters button.
6. Results table
Use a responsive desktop table and compact mobile cards.
Desktop columns:
1. Class
   - Class name
   - Class code
2. Study Package
   - Package name
   - Planned Hours
3. Assigned Teacher
   - Avatar if available
   - Full name
   - @username
4. Schedule
   - Weekday or Weekend
   - Learning days
   - Start time → End time
5. Learning Progress
   - Progress bar
   - completedHours / plannedHours
   - Percentage
6. Remaining Hours
7. Expected End Date
8. Completion Health
   - Not Started
   - On Track
   - Near Completion
   - Overdue
   - Completed
9. Capacity
   - enrolledStudents / capacity
   - Capacity progress bar
   - available seats
10. Status
11. Actions
    - View Class Details
    - View Attendance Report
Table requirements:
- Default sorting:
  1. Overdue classes first
  2. Near completion classes second
  3. Lowest progress percentage after that
  4. Class name
- Show empty state when no class matches filters.
- Use pagination for many classes.
- Keep Class as a sticky left column on desktop table.
- Do not create page-level horizontal overflow.
- Reset table horizontal scroll to the left after filters, pagination, or refresh changes.
7. Status and health badges
Use distinct, accessible colors and do not rely only on color.
Suggested rules:
- Not Started: gray
- On Track: blue or green
- Near Completion: amber
- Overdue: red
- Completed: green
A classroom manually marked completed should show Completed status. If its completed hours are less than planned hours, show a small warning in Class Details only; do not silently alter historical data.
8. Class detail drill-down
View Class Details must navigate to the existing classroom detail page.
Enhance the existing class detail page if needed with a Learning Progress card showing:
- Planned Hours
- Completed Hours
- Remaining Hours
- Progress percentage
- Expected End Date
- Current enrollment/capacity
- Completion health
Reuse the same calculation utility so report and detail page always show identical results.
9. Print report
Create a print-friendly report layout.
Print header:
- School logo and school name if available
- Class Progress Report
- Applied filters
- Generated date/time in Cambodia timezone
Print table columns:
- No.
- Class
- Package
- Teacher
- Schedule
- Planned Hours
- Completed Hours
- Remaining Hours
- Progress
- Expected End Date
- Capacity
- Completion Health
Use landscape orientation. Hide sidebar, buttons, filter controls, pagination, and action column in print mode.
10. Excel export
Export exactly the currently filtered classes.
Excel sheet title: Class Progress Report
Include:
- Generated date/time
- Applied filters
- Class name
- Class code
- Study package
- Teacher name
- Teacher username
- Schedule type
- Learning days
- Start time
- End time
- Start date
- Expected end date
- Planned hours
- Completed hours
- Remaining hours
- Progress percentage
- Enrolled students
- Capacity
- Available seats
- Capacity percentage
- Classroom status
- Completion health
11. File organization
Keep logic modular. Do not place all logic in one component.
Suggested structure:
src/
├── models/
│   └── class-progress-report.model.ts
├── lib/
│   └── class-progress-calculator.ts
├── services/
│   └── class-progress-report.service.ts
├── components/reports/class-progress/
│   ├── class-progress-filters.tsx
│   ├── class-progress-summary-cards.tsx
│   ├── class-progress-table.tsx
│   ├── class-progress-mobile-card.tsx
│   ├── class-progress-health-badge.tsx
│   ├── class-progress-print-view.tsx
│   └── class-progress-empty-state.tsx
├── pages/reports/
│   ├── class-progress-report-page.tsx
│   └── class-progress-report-print-page.tsx
└── i18n/locales/
    ├── en.json
    └── km.json
12. Quality and testing
- Use the existing Vite React-compatible Shadcn UI only. Never introduce Next.js components/packages.
- All UI texts must support Khmer and English through i18n.
- Do not show raw i18n keys.
- Desktop table must be readable and mobile must use cards without horizontal overflow.
- Reuse existing date, holiday, classroom schedule, and active enrollment helpers whenever possible.
- Avoid N+1 Firestore reads.
Test before completion:
1. Weekday class: one ended session counts as 1 completed hour.
2. Weekend class: one ended session counts as 2 completed hours.
3. Future sessions do not increase completed hours.
4. Today’s session is counted only after its end_time.
5. Holiday dates do not increase completed hours.
6. Completed hours never exceed planned hours.
7. Transferred-out students do not count toward current capacity.
8. Overdue class shows red health badge when expected end date has passed and remaining hours > 0.
9. Assigned Teacher filter shows active teacher users only.
10. English and Khmer switch fully without mixed UI text.
11. Excel and print use the same filtered data and calculations.
12. Run npm run build and fix all TypeScript/build errors.