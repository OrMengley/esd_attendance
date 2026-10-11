Build the complete Class/Batch Management CRUD feature for this ESD Attendance project using Vite React, TypeScript, shadcn/ui, Firebase Firestore, React Router DOM, and existing Khmer/English i18n. Do not change Firebase config, authentication, Study Package/Course Module feature, Student CRUD, or UI foundation. Do not create Enrollment or Attendance yet.

Create Firestore collection `classrooms` and create/update `src/models/classroom.model.ts`:

```ts
export type ClassroomStatus = "active" | "completed" | "inactive";

export interface Classroom {
  id: string;
  code: string;
  name: string;
  packageId: string;
  assignedTeacherId: string;
  scheduleDays: number[];
  startTime: string;
  endTime: string;
  sessionMinutes: number;
  hoursPerWeek: number;
  startDate: string;
  expectedEndDate: string;
  actualEndDate?: string;
  capacity?: number;
  status: ClassroomStatus;
  note?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}
```

Weekday values must be:

```ts
1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday, 7 = Sunday
```

Create `src/services/classroom.service.ts` with:
- `getClassrooms()`
- `getClassroomById(id)`
- `createClassroom(data, currentUserId)`
- `updateClassroom(id, data, currentUserId)`
- `setClassroomStatus(id, status, currentUserId)`

Rules:
- Use Firestore auto-generated document ID and save it in field `id`.
- Class code must be unique.
- Never hard-delete a class.
- Use `inactive` when stopping an unused class.
- Use `completed` after the class finishes.
- `assignedTeacherId` must reference an active user where `role === "teacher"`.
- Save created/updated audit fields.
- Do not store `totalStudents`; it will be calculated from enrollments later.

Create `src/lib/classroom-schedule.ts` with:
- `calculateSessionMinutes(startTime, endTime)`
- `calculateHoursPerWeek(scheduleDays, sessionMinutes)`
- `calculateExpectedEndDate(startDate, totalPlannedHours, scheduleDays, sessionMinutes)`

Expected end date logic:
- Read `totalPlannedHours` from the selected Study Package.
- Begin at selected start date.
- Count only selected learning days.
- Add one session duration at a time.
- Stop when planned learning hours are reached.
- Return final date as `YYYY-MM-DD`.
- Do not hardcode 2 or 3 months.

Business rules:
- Weekday schedule: Monday to Friday, normally 60 minutes per day.
- Weekend schedule: Saturday and Sunday, normally 120 minutes per day.
- A 40-hour package should finish around 2 months for weekday schedule and around 3 months for weekend schedule.

Create/refactor route `/classes`.

Permissions:
- `super_admin` and `admin`: full class CRUD.
- `teacher`: no class management access and no Classes sidebar menu.

Create a responsive shadcn Classes page with:
- Search by class code/name.
- Filters: package, teacher, status, schedule type.
- Add Class button.
- Loading skeleton, empty state, error state.
- Table columns: Class Code, Class Name, Study Package, Teacher, Schedule, Start Date, Expected End Date, Hours/Week, Capacity, Status, Actions.
- Actions: View Details, Edit, Mark Completed, Activate/Deactivate.

Create Add/Edit Class Dialog fields:
1. Class Code — required and unique, example `ESD-WD-2026-001`.
2. Class Name — required.
3. Study Package — required select from active `study_packages`; display Khmer name and total planned hours.
4. Assigned Teacher — required select from active `users` where role is `teacher`; display name and username.
5. Schedule Type — required: `weekday` or `weekend`.
6. Learning Days — auto set and read-only:
   - weekday: `[1,2,3,4,5]`
   - weekend: `[6,7]`
7. Start Time and End Time — required:
   - weekday default `07:00–08:00`
   - weekend default `07:00–09:00`
   - validate end time is after start time.
8. Start Date — required.
9. Expected End Date — auto calculated, read-only, updates instantly when package/schedule/time/start date changes.
10. Capacity — optional positive number.
11. Note — optional.
12. Status — default active.

Use package and teacher IDs in Firestore, then resolve names for display in UI. Use real Firestore data, not mock data. Do not create attendance or enrollment records in this task.

Use i18n `t()` for all visible Khmer/English labels, validation, buttons, and toast messages.

Create files:

```text
src/components/classes/classroom-table.tsx
src/components/classes/classroom-dialog.tsx
src/components/classes/classroom-detail-dialog.tsx
src/components/classes/classroom-status-badge.tsx
src/lib/classroom-schedule.ts
src/models/classroom.model.ts
src/pages/classes/classes-page.tsx
src/services/classroom.service.ts
```

Run `npm run build`, fix all TypeScript, Firestore, import, route, and i18n errors. Ensure no Next.js imports are introduced.