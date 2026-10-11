Implement a complete **Holiday & School Closure Management** feature for the existing ESD Attendance Vite React + TypeScript + Firestore project.

This feature must integrate with:

- Classroom schedule calculation
- Expected class end date calculation
- Teacher daily attendance UI
- Admin attendance management
- Khmer / English i18n

Keep the existing Vite React + Shadcn UI architecture. Do not use Next.js components or imports.

## 1. Firestore model

Create a dedicated `school_holidays` collection.

Create model file:

```text
src/models/school-holiday.model.ts
```

Use a model similar to:

```ts
export type SchoolHolidayStatus = "active" | "inactive";

export interface SchoolHoliday {
  id: string;
  nameKm: string;
  nameEn?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  note?: string;
  status: SchoolHolidayStatus;

  createdAt: Timestamp | Date;
  createdBy: string;
  updatedAt?: Timestamp | Date;
  updatedBy?: string;
}
```

Rules:

- `nameKm` is required.
- `startDate` and `endDate` are required.
- `endDate` cannot be earlier than `startDate`.
- One record can cover one day or multiple consecutive days.
- Example: Khmer New Year from `2026-04-14` to `2026-04-16`.
- Prevent overlapping active holiday date ranges. Show a validation error if overlap exists.
- Inactive holidays must not affect class schedules or attendance.

## 2. Service and utility structure

Create separate files; do not place all logic in one file:

```text
src/services/school-holiday.service.ts
src/lib/holiday-calendar.ts
src/hooks/use-school-holidays.ts
src/components/holidays/
src/pages/holidays/
```

Implement CRUD functions:

```ts
getSchoolHolidays()
getActiveSchoolHolidays()
getSchoolHolidayById()
createSchoolHoliday()
updateSchoolHoliday()
setSchoolHolidayStatus()
```

There is no hard delete. Admin can activate or deactivate a holiday record to preserve history.

Create reusable calendar utility functions:

```ts
isHoliday(date, activeHolidays)
getHolidayForDate(date, activeHolidays)
isSchoolClosed(date, activeHolidays)
getSchoolClosuresBetweenDates(startDate, endDate, activeHolidays)
```

Use date-only values in `YYYY-MM-DD` format and Cambodia timezone:

```text
Asia/Phnom_Penh
```

Avoid timezone date-shift bugs.

## 3. Permissions

- `super_admin` and `admin` can access and manage Holiday / School Closure settings.
- `teacher` must not see this menu or access holiday CRUD pages.
- Teachers can only see a clear closure message when today is an active holiday.

Add a Sidebar menu item for authorized users:

```text
School Holidays
```

## 4. Holiday management UI

Create routes:

```text
/holidays
/holidays/new
/holidays/:id/edit
```

Build a clean responsive UI with Shadcn components.

### Holiday list page

Include:

- Page title and description
- `Add Holiday` button
- Search by Khmer/English holiday name
- Filter by active/inactive status
- Table on desktop and cards on mobile
- Columns:
  - Holiday name
  - Start date
  - End date
  - Total days
  - Status
  - Note
  - Actions
- Actions:
  - View/Edit
  - Activate
  - Deactivate
- Show a friendly empty state.

### Create/Edit full-page form

Use a full-page form, not a small dialog.

Fields:

- Holiday name Khmer — required
- Holiday name English — optional
- Start date — required
- End date — required
- Note — optional
- Status — active/inactive

Display a small summary such as:

```text
This closure covers 3 calendar days.
```

## 5. Integration with classroom expected end date

Update the existing classroom schedule/end-date calculation logic.

When calculating `expectedEndDate`:

1. Count only valid scheduled learning days.
2. Skip dates that are active school holidays.
3. Skip days not included in the classroom `learningDays`.
4. Continue calculating future valid class sessions until the study package `totalHours` is completed.

Example:

```text
Class: Monday–Friday, 1 hour per day
Package total: 40 hours
Holiday: 2026-04-14 to 2026-04-16

Those holiday dates must not count as learning hours.
Expected end date must automatically move forward by the missed valid learning sessions.
```

Do not automatically mark students absent on holidays.

When an admin creates, edits, activates, or deactivates a holiday:

- Recalculate `expectedEndDate` for affected active classrooms.
- Update only classrooms whose study period may be affected.
- Do not modify completed or inactive classrooms.
- Keep previously recorded attendance history unchanged.

Make this logic reusable and safe. Do not hardcode 2-month or 3-month durations.

## 6. Integration with teacher attendance UI

Update the Teacher Daily Attendance page.

Before allowing a teacher to mark attendance, check:

```ts
isSchoolClosed(today, activeHolidays)
```

If today is an active school holiday:

- Do not show active attendance controls.
- Do not allow selecting student status.
- Disable/hide `Mark All Present`, `Save Attendance`, `Edit Attendance`, and `Update Attendance`.
- Show a clear locked state:

```text
School is closed today.
[Holiday Name]
Attendance cannot be recorded.
```

Teacher class cards may still be visible if needed, but must show:

```text
School Closed
```

and cannot be opened for attendance entry.

The existing time-lock rules must still apply on normal school days:

- Upcoming class: cannot record.
- Current class session: teacher can record.
- Saved attendance: locked; teacher can edit only while current class time is still active.
- Finished class: view only.

A holiday has higher priority than class time. Even if the current time is within the class schedule, attendance must remain locked when school is closed.

## 7. Attendance service validation

Do not rely only on UI disabled states.

Before a teacher saves or updates attendance, validate:

- Logged-in user role
- Teacher is assigned to the classroom
- Today is valid in Cambodia timezone
- Today matches classroom schedule day
- Current time is inside the class session time
- Today is not an active school holiday

If school is closed, reject the operation with a clear toast message.

`admin` and `super_admin` may view historical attendance, but normal teacher restrictions must remain enforced.

Keep the existing deterministic attendance ID behavior:

```ts
{classroomId}_{attendanceDate}_{studentId}
```

Never create duplicate attendance records.

## 8. i18n

Add complete Khmer and English translations. Do not display raw translation keys.

Add keys similar to:

```text
holidays.title
holidays.description
holidays.addHoliday
holidays.editHoliday
holidays.nameKm
holidays.nameEn
holidays.startDate
holidays.endDate
holidays.totalDays
holidays.status
holidays.active
holidays.inactive
holidays.schoolClosed
holidays.closedToday
holidays.attendanceLocked
holidays.overlappingDates
holidays.noHolidays
holidays.activate
holidays.deactivate
```

## 9. Required verification

Test these cases:

1. Create a one-day holiday on a normal weekday.
   - Teacher cannot record attendance on that date.

2. Create a multi-day holiday range, such as 3–5 days.
   - Teacher cannot record attendance on any date in that range.

3. A weekday class with a 40-hour package has holiday dates during its study period.
   - Expected end date moves forward correctly.

4. An inactive holiday does not lock attendance or affect expected end date.

5. Completed classroom records are not changed after holiday creation.

6. Teachers cannot access Holiday Management routes/menu.

7. `admin` and `super_admin` can create, edit, activate, and deactivate holidays.

8. Run:

```bash
npm run build
```

Fix all TypeScript, Firestore, i18n, and build errors before completion.