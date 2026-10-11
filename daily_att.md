Implement **Daily Attendance Summary** for the existing ESD Attendance Vite React + TypeScript + Firestore project.

This is an operational dashboard for `super_admin` and `admin` to monitor daily classroom attendance completion.

Main goal:

```text
Admin selects a date, defaulting to today.
Admin can immediately see:
- Which classes are scheduled today
- Which classes have completed attendance
- Which classes have partial attendance
- Which classes have not recorded attendance yet
- Present / Absent / Late / Permission totals for the selected date
```

Do not change existing classroom schedules, attendance record IDs, teacher time-lock behavior, enrollment transfer logic, holiday logic, or monthly report features.

Use existing collections:

```text
classrooms
enrollments
attendance
students
users
study_packages
school_holidays
```

Use Cambodia timezone consistently:

```text
Asia/Phnom_Penh
```

Keep Vite React + TypeScript + Tailwind + Shadcn UI only. Do not use Next.js packages or components.

## 1. Route and permissions

Create route:

```text
/daily-attendance-summary
```

Permissions:

- `super_admin` and `admin`: full access.
- `teacher`: must not see this route or Sidebar menu item.
- Teacher keeps using the existing Daily Attendance page only.

Add Sidebar menu item for admin/super_admin:

```text
Daily Summary
```

Place it near Daily Attendance and Attendance Reports.

## 2. Selected date behavior

At top of page, include a date picker.

Rules:

- Default to Cambodia today.
- Admin/super_admin may select today or past dates for review.
- Future dates may be selected only for schedule planning, but must show `Upcoming` classes and must never show them as missing attendance.
- Active school holidays must be recognized.

If the selected date is an active school holiday:

- Show a clear School Closed state.
- Show holiday name.
- Do not list classes as pending/missing.
- Show attendance totals as zero.
- Do not create or alter attendance records.

## 3. Determine scheduled classrooms

For the selected date, include only classrooms where all are true:

```text
classroom.status === "active"
selected date is between classroom.startDate and expectedEndDate/actualEndDate
selected date matches classroom.learningDays
selected date is not an active school holiday
classroom has eligible active enrollments on selected date
```

Respect enrollment rules:

- Student must be active for that classroom/date.
- Exclude cancelled enrollments.
- Respect enrollment start date, end date, and transfer date.
- Do not count students before transfer-in or after transfer-out.

Do not display completed, inactive, expired, previous-term, or irrelevant classrooms as current scheduled classes.

## 4. Classroom attendance summary statuses

Create a reusable summary status utility, for example:

```text
src/lib/daily-attendance-summary.ts
```

Use statuses:

```ts
type DailyClassAttendanceStatus =
  | "upcoming"
  | "not_recorded"
  | "partial"
  | "completed"
  | "missing"
  | "school_closed";
```

Rules:

### Upcoming

- Selected date is in the future, OR
- Selected date is today but current Cambodia time is before the classroom start time.
- Do not mark as missing.

### Not recorded

- Class is currently active/in progress.
- No attendance record exists yet for eligible students.

### Partial

- At least one eligible student has an attendance record.
- Not all eligible students have attendance records yet.

### Completed

- Every eligible enrolled student for that date has an attendance record.

### Missing

- Selected date is in the past, OR class session has ended today.
- Attendance record count is zero or incomplete.
- Highlight clearly so admin can follow up.

### School closed

- Only used as page-level state when active holiday applies.
- Do not create missing/pending class rows for holiday dates.

For every classroom, calculate:

```ts
eligibleStudentCount
recordedStudentCount
presentCount
absentCount
lateCount
permissionCount
attendanceRate
```

Attendance rate formula:

```text
(Present + Late + Permission) / Recorded Student Count × 100
```

If no attendance is recorded, display `—` rather than misleading `0%`.

## 5. Daily Summary UI

Create a clean admin dashboard page.

### Header

Show:

```text
Daily Attendance Summary
Selected date
Cambodia timezone context
```

Add navigation controls:

```text
Previous Day
Today
Next Day
Date Picker
```

### Summary cards

Show cards for the selected date:

```text
Scheduled Classes
Completed Classes
Pending / Partial Classes
Missing Attendance Classes
Present Students
Absent Students
Late Students
Permission Students
Overall Attendance Rate
```

Use semantic colors:

```text
Completed = green
Pending/Partial = amber
Missing = red
Upcoming = blue/gray
Present = green
Absent = red
Late = amber
Permission = blue
```

Do not treat upcoming future classes as missing.

### Filters

Include:

```text
Search class name/code
Teacher filter
Study package filter
Schedule type filter (Weekday / Weekend)
Attendance completion status filter
```

Filters must be responsive and never clip controls.

### Main classroom table

Desktop columns:

```text
Class
Teacher
Study Package
Schedule & Time
Eligible Students
Recorded
Present
Absent
Late
Permission
Attendance Rate
Completion Status
Actions
```

Class cell should show:

```text
Class name
Class code
```

Teacher cell should show:

```text
Avatar
Teacher name
@username
```

Completion Status must be a clear badge:

```text
Upcoming
Not Recorded
Partial
Completed
Missing
```

Actions:

```text
View Attendance
```

For admin/super_admin, open the existing attendance page/detail for that classroom and selected date.

Pass route/query parameters if needed, for example:

```text
/daily-attendance?classroomId={id}&date={YYYY-MM-DD}
```

Admin/super_admin may use existing authorized attendance correction/edit behavior. Do not bypass teacher time restrictions for teacher accounts.

### Mobile layout

Use compact cards showing:

```text
Class
Teacher
Schedule
Recorded / Eligible count
Present / Absent
Completion status
View Attendance action
```

No horizontal overflow.

## 6. Empty states

Provide clear states:

```text
No classes are scheduled for this date.
School is closed today.
No eligible students are enrolled in scheduled classes.
No results match your filters.
```

Do not show empty/misleading summary cards without explanation.

## 7. Data and performance requirements

- Fetch only relevant attendance records for selected date and scheduled classroom IDs.
- Avoid fetching the full attendance collection.
- Reuse existing attendance service/models where possible.
- Do not create duplicate attendance documents.
- Do not modify attendance merely by opening the summary page.
- Build reusable helpers/components instead of placing all logic in one component.

Suggested structure:

```text
src/lib/daily-attendance-summary.ts
src/services/daily-attendance-summary.service.ts
src/hooks/use-daily-attendance-summary.ts
src/components/daily-summary/
src/pages/daily-summary/
```

## 8. i18n

Add complete Khmer and English translations for:

```text
dailySummary.title
dailySummary.selectedDate
dailySummary.previousDay
dailySummary.today
dailySummary.nextDay
dailySummary.scheduledClasses
dailySummary.completedClasses
dailySummary.pendingClasses
dailySummary.missingClasses
dailySummary.presentStudents
dailySummary.absentStudents
dailySummary.lateStudents
dailySummary.permissionStudents
dailySummary.overallAttendanceRate
dailySummary.eligibleStudents
dailySummary.recordedStudents
dailySummary.completionStatus
dailySummary.upcoming
dailySummary.notRecorded
dailySummary.partial
dailySummary.completed
dailySummary.missing
dailySummary.viewAttendance
dailySummary.schoolClosed
dailySummary.noScheduledClasses
dailySummary.noMatchingClasses
dailySummary.timezoneNotice
```

All UI text must follow the global Khmer/English language selector. Do not show raw i18n keys or mixed hardcoded UI text.

## 9. Required verification

Test all scenarios:

1. Today, class before start time:
   - Shows `Upcoming`, never Missing.

2. Today, class in progress with no attendance:
   - Shows `Not Recorded`.

3. Today, class in progress with some student records:
   - Shows `Partial`.

4. Today, all eligible students recorded:
   - Shows `Completed`.

5. Past date with incomplete or zero attendance:
   - Shows `Missing`.

6. Future date:
   - Shows only Upcoming scheduled classes, never Missing.

7. Active school holiday:
   - Shows School Closed and no missing classes.

8. Transferred student:
   - Is counted only in the correct classroom/date period.

9. Teacher account:
   - Cannot access Daily Attendance Summary route/menu.

10. Admin can open a class/date attendance detail from `View Attendance`.

11. Verify desktop and mobile responsive layouts.

12. Run:

```bash
npm run build
```

Fix all TypeScript, Firestore query, permissions, i18n, responsive UI, and build errors before completion.