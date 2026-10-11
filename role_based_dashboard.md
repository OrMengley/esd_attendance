Implement a new **Role-Based Dashboard** for the existing ESD Attendance Vite React + TypeScript + Firestore application.

Purpose: after login, each user sees a useful dashboard based on their role.

Use existing Firestore data and existing utilities for classrooms, enrollments, attendance, holidays, schedules, daily attendance summary, users, i18n, and Cambodia timezone. Do not create mock data and do not break existing pages.

## 1. Dashboard route and permissions

Use the existing dashboard route:

/dashboard

Role behavior:

- super_admin: show Admin Dashboard
- admin: show Admin Dashboard
- teacher: show Teacher Dashboard

Do not show admin-only data to teacher users.

## 2. Shared dashboard header

Create a clean dashboard header:

- Greeting with current user name.
- Current Cambodia date and live time.
- Language-aware UI using existing Khmer/English i18n.
- Refresh button.
- Data should refresh when clicking Refresh.
- Update time-sensitive session state every minute without reloading the whole application.

Example English greeting:

Good morning, {name}
Here is your attendance overview for today.

Use appropriate greeting based on Cambodia local time:

- Good morning
- Good afternoon
- Good evening

## 3. Admin Dashboard

Show this dashboard only to super_admin and admin.

### Top summary cards

Show these cards for today using Cambodia timezone:

1. Active Students
   - Count students with at least one current active enrollment.

2. Active Classes
   - Count classrooms with status active.

3. Active Teachers
   - Count users where role is teacher and status is active.

4. Today’s Scheduled Classes
   - Count only active classrooms scheduled today.
   - Exclude school holidays and closed dates.
   - Exclude classes outside their study period.

5. Attendance Recorded
   - Number of today’s scheduled classes with attendance fully recorded.

6. Requires Attention
   - Count classes whose session has ended but attendance is missing or partial.
   - Do not count upcoming/future sessions as missing.

### Today’s Attendance Overview

Create a main card for today’s attendance:

- Present total
- Absent total
- Late total
- Permission total
- Attendance rate

Calculation rules:

- Use only attendance records from valid scheduled classes today.
- Do not count holiday or invalid schedule dates.
- Attendance rate should use recorded student attendance only.
- Display `—` when no attendance has been recorded yet.
- Link button: `View Daily Summary` → existing Daily Attendance Summary page.

### Attendance Status by Class

Show a table or list of today’s scheduled classes:

Columns/content:

- Class name and code
- Assigned teacher
- Schedule time
- Enrolled students
- Recorded students / total enrolled students
- Present / Absent / Late
- Attendance status:
  - Upcoming
  - In Progress
  - Completed
  - Partial
  - Missing
  - Holiday / No Class
- Action:
  - View Daily Summary
  - View Class Details

Important status rules:

- Before start time: Upcoming
- Between start and end time: In Progress
- After end time with all enrolled students recorded: Completed
- After end time with some students recorded: Partial
- After end time with no attendance record: Missing
- Never label a future/upcoming class as Missing.

### Attention Required panel

Show only meaningful items:

- Classes with Missing attendance after session end.
- Classes with Partial attendance after session end.
- Overdue classes from Class Progress Report.
- Students with repeated Absence/Late records from current month.

Each item should link to the relevant existing page:

- Daily Attendance Summary
- Absence & Late Report
- Class Progress Report

Limit list to 5 items and show `View All` link where appropriate.

### Admin quick actions

Show compact quick-action cards/buttons:

- Add Student → /students/new
- Create Class → /classes/new
- Record/Review Daily Attendance → existing Daily Attendance page or Daily Summary
- View Attendance Reports → /attendance-reports
- Create School Holiday → existing School Holidays page

Do not show actions that user role cannot access.

## 4. Teacher Dashboard

Show this dashboard only to users with role teacher.

Teacher must only see data for classrooms where:

classroom.teacher_id === currentUser.id

and classroom status is active.

### Teacher top summary cards

Show:

1. My Active Classes
2. Today’s Classes
3. Attendance Completed Today
4. Requires Attendance
5. Next Class

Rules:

- Today’s Classes includes only the teacher’s own valid scheduled classes today.
- Exclude holidays, closed dates, inactive/completed classes, and invalid study dates.
- Requires Attendance includes only sessions already ended with missing/partial attendance.
- Next Class is the nearest future scheduled class today. Show `No more classes today` when none exists.

### Today’s Teaching Schedule

Show teacher’s own scheduled classes for today as clear cards, sorted by start time.

Each class card must show:

- Class name and class code
- Study package
- Schedule time
- Enrolled student count
- Session state:
  - Upcoming
  - In Progress
  - Attendance Completed
  - Requires Attendance
  - Locked
- Attendance progress:
  - recorded students / enrolled students
- Contextual action button.

Action rules:

- Before start time:
  - Show `Available at {startTime}`.
  - Disable attendance action.
  - Teacher cannot mark attendance early.

- During active session:
  - Show `Mark Attendance` or `Continue Attendance`.
  - Navigate to the existing teacher daily attendance page for that class and date.

- After session end:
  - If attendance is completed: show `View Attendance`.
  - If attendance is partial/missing: show `Attendance Required`.
  - Teacher cannot edit a locked record outside existing teacher lock rules.

- Do not create a new teacher attendance page. Reuse the existing attendance-marking flow and its locking rules.

### Teacher empty states

Show clear states:

- Holiday / school closed today:
  - `School is closed today. No classes are scheduled.`

- No class scheduled:
  - `You have no classes scheduled today.`

- No active classroom:
  - `No active classrooms are assigned to you.`

## 5. Data accuracy rules

Use Cambodia timezone for every date/time comparison.

Reuse existing helpers wherever possible:

- classroom learning days
- start date and expected end date
- class start/end time
- school holiday/closed dates
- active/current enrollment rules
- attendance locking/session access rules
- Daily Attendance Summary status rules

Do not hardcode weekday, weekend, class duration, teacher ID, or report values.

Avoid N+1 Firestore reads:

- Fetch required classrooms, active enrollments, users, holidays, and attendance efficiently.
- Create dashboard service/aggregation helpers.
- Reuse data in dashboard widgets where possible.

## 6. UI and responsive requirements

- Use the existing Vite React-compatible Shadcn UI only.
- Follow the existing school blue/gold design theme.
- Use responsive grid layout:
  - Desktop: summary cards in grid and clear two-column content layout where suitable.
  - Mobile: single-column cards with no horizontal overflow.
- Add loading skeletons.
- Add meaningful empty states.
- Add tooltip/aria-label for icon-only buttons.
- Do not duplicate existing report tables inside dashboard.
- Use compact summaries with links to existing full pages.

## 7. i18n

- Add every new Dashboard UI text to en.json and km.json.
- English mode must contain English interface text only.
- Khmer mode must contain Khmer interface text only.
- Stored names/data may remain in the language in which they were entered.
- Do not show untranslated i18n keys.

## 8. Suggested file structure

src/
├── models/
│   └── dashboard.model.ts
├── services/
│   └── dashboard.service.ts
├── lib/
│   └── dashboard-calculator.ts
├── components/dashboard/
│   ├── dashboard-header.tsx
│   ├── dashboard-summary-card.tsx
│   ├── admin-dashboard.tsx
│   ├── teacher-dashboard.tsx
│   ├── admin-attendance-overview.tsx
│   ├── admin-class-attendance-list.tsx
│   ├── admin-attention-panel.tsx
│   ├── dashboard-quick-actions.tsx
│   ├── teacher-schedule-card.tsx
│   ├── teacher-next-class-card.tsx
│   └── dashboard-empty-state.tsx
├── pages/
│   └── dashboard-page.tsx
└── i18n/locales/
    ├── en.json
    └── km.json

## 9. Testing checklist

Test before completion:

1. super_admin and admin see Admin Dashboard.
2. teacher sees Teacher Dashboard only.
3. Teacher sees only their own active classes.
4. Future class is shown as Upcoming, never Missing.
5. Class after end time with no attendance is shown as Missing/Requires Attendance.
6. Holiday excludes all scheduled classes and shows holiday empty state.
7. Active student count ignores transferred-out/completed/cancelled enrollments.
8. Dashboard links navigate to existing relevant pages correctly.
9. English and Khmer switch without mixed UI labels.
10. Desktop and mobile layouts have no horizontal overflow.
11. Run npm run build and fix all TypeScript/build errors.

