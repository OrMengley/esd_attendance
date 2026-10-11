Implement **Teacher Attendance Time Locking & Post-Save Lock** for the existing ESD Attendance Vite React + TypeScript + Firestore project.

Do not redesign or replace the existing attendance feature. Improve the current teacher attendance flow only. Keep the existing deterministic Firestore attendance document ID pattern:

```ts
{classroomId}_{attendanceDate}_{studentId}
```

This must continue preventing duplicate attendance records.

## Main business rules

Use Cambodia timezone only:

```ts
Asia/Phnom_Penh
```

A teacher may record or edit attendance only when all conditions are true:

1. The selected date is today in Cambodia timezone.
2. Today matches the classroom learning schedule day.
3. The current Cambodia time is within the class session time:
   - Start time is inclusive.
   - End time is exclusive.
   - Example: class `15:00–16:00` is editable from `15:00` until before `16:00`.
4. The logged-in teacher is assigned to that classroom.
5. The classroom is active.

## Class time access states

Create a reusable utility:

```text
src/lib/attendance-time-lock.ts
```

It should calculate and return clear states:

```ts
type AttendanceAccessState =
  | "upcoming"
  | "open"
  | "finished"
  | "not_scheduled"
  | "not_today";
```

Include helpers such as:

```ts
getCambodiaNow()
getCambodiaToday()
getAttendanceAccessState(classroom, selectedDate)
canTeacherRecordAttendance(...)
canTeacherEditAttendance(...)
```

Do not rely on the browser’s local timezone. Use `Asia/Phnom_Penh` consistently.

## Teacher attendance page behavior

### 1. Upcoming class

If a teacher has classes:

- Class A: `13:00–14:00`
- Class B: `14:00–15:00`
- Class C: `15:00–16:00`

At `14:30`:

- Class A: show `Finished` and lock it.
- Class B: show `In Progress` and allow attendance.
- Class C: show `Upcoming · Opens at 15:00`, but disable attendance access and all status controls.

The teacher can see upcoming assigned classes, but cannot enter attendance mode, mark statuses, use “Mark all present”, save, or edit before the class start time.

Show a clear status badge on class cards/list items:

- Upcoming
- In Progress
- Finished
- Not scheduled today

Show the class time range and an appropriate Khmer/English helper message.

### 2. During class time

When the class is currently in progress:

- Teacher can mark student statuses.
- Teacher can use “Mark All Present”.
- Teacher can click `Save Attendance`.
- The first save must create/update the deterministic attendance records.
- No duplicate attendance documents may be created.

### 3. Lock immediately after successful save

After the teacher saves attendance successfully:

- Switch the attendance screen into read-only mode immediately.
- Disable student status buttons, remarks, “Mark all present”, and Save button.
- Show a clear saved/locked state, for example:

```text
Attendance saved. Editing is available only until 16:00.
```

- Replace the normal Save button with an `Edit Attendance` button only if the class is still within its active session time.

### 4. Edit after save

If attendance has already been saved:

- Teacher can click `Edit Attendance` only while the class is still in progress.
- Show a confirmation dialog before unlocking edit mode.
- After confirmation, enable editing mode.
- Change the action button to `Update Attendance`.
- After successful update, lock the form again automatically.
- If the class end time has passed, the Edit button must be disabled or hidden and show:

```text
This class session has ended. Attendance can no longer be edited.
```

### 5. After class end time

Once the session reaches or passes the end time:

- Teacher can view attendance only.
- Teacher cannot create, save, edit, update, or change any status.
- “Mark All Present” is disabled.
- Show a finished/locked badge and message.

Example:

```text
Class ended at 16:00. Attendance is locked.
```

## Date access rules

For `teacher` role:

- Attendance date must default to Cambodia today.
- Do not allow the teacher to manually select future dates.
- Do not allow the teacher to create/edit attendance for past dates.
- Teacher can only interact with attendance for Cambodia today and only during the active class time.

For `admin` and `super_admin`:

- Preserve broader access for reviewing and correcting attendance records.
- They may select valid scheduled dates and edit attendance when required.
- Do not apply the teacher’s strict time lock to admin/super_admin management workflows.

## Service-level protection

Do not rely only on disabled UI controls.

Before teacher save/update runs in the attendance service/hook:

- Validate role, assigned teacher, Cambodia date, schedule day, and current class time window.
- If invalid, reject the operation and show a user-friendly toast.
- Keep all existing Firestore CRUD and deterministic document ID behavior.

## UI/UX requirements

- Keep current Shadcn/Vite components and existing attendance layout.
- Do not use Next.js components, imports, or packages.
- Use clear disabled states, lock icons, badges, and helper text.
- Do not remove Attendance History or existing attendance records.
- Ensure mobile responsiveness.
- Avoid raw i18n keys appearing in UI.

Add Khmer and English translations for keys similar to:

```text
attendance.upcoming
attendance.inProgress
attendance.finished
attendance.opensAt
attendance.classInProgress
attendance.classEnded
attendance.savedLocked
attendance.editAttendance
attendance.updateAttendance
attendance.confirmEdit
attendance.teacherTimeRestriction
attendance.notAvailableBeforeClass
attendance.lockedAfterClass
```

## Required verification

Test using Cambodia timezone with these scenarios:

1. Class `15:00–16:00`, current time `14:30`:
   - Teacher can see it but cannot mark/save attendance.

2. Class `15:00–16:00`, current time `15:10`:
   - Teacher can record and save attendance.

3. After successful save at `15:10`:
   - Screen becomes read-only immediately.
   - No repeated normal Save action is possible.
   - Teacher can choose Edit only before `16:00`.

4. At `15:30`:
   - Teacher can edit, update, and the screen locks again after update.

5. At `16:00` or later:
   - Teacher cannot edit or save.
   - Attendance is view-only.

6. Verify saving/updating never creates duplicate attendance documents for the same:
   - classroom
   - date
   - student

Run:

```bash
npm run build
```

Fix all TypeScript and build errors before completion.