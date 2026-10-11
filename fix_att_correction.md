Fix the critical bug in **Attendance Corrections**.

## Current bug

When an admin changes attendance from `absent` to `present`:

1. The confirmation flow completes.
2. A success toast appears: `Attendance corrected successfully`.
3. But the attendance table still shows `Absent`.
4. The `Corrected` column remains empty.
5. The summary card `Corrected` remains `0`.
6. Reports do not reflect the new attendance status.

This means the UI reports success even though the real attendance document was not updated, or the page is showing stale data.

## Required fix

### 1. Always update the real existing Firestore attendance document

Do not construct or guess an attendance document ID from:

```text
classroomId + date + studentId

unless the existing attendance system is explicitly guaranteed to use that exact deterministic ID.
Instead:
- Every attendance row loaded into the Attendance Corrections table must include the actual Firestore document ID:

attendanceDocId: firestoreDocument.id;

- When user clicks Correct Attendance, pass this exact attendanceDocId into the correction dialog and correction service.
- The correction transaction must use the real document reference:

doc(db, ACTUAL_ATTENDANCE_COLLECTION_NAME, attendanceDocId)

- Use the same attendance collection name and model already used by Daily Attendance, Student Attendance History, and all existing reports.
- Do not update a new/incorrect document in another collection.
2. Use one atomic Firestore transaction
Implement correction with runTransaction.
Inside the transaction:
1. Read the real attendance document using attendanceDocId.
2. Throw an error if the document does not exist.
3. Validate:
   - existing record belongs to the expected student, class, and date
   - selected new status is valid
   - current user role is admin or super_admin
4. Update the existing attendance document.
5. Create exactly one new immutable audit log document in attendance_audit_logs.
6. Commit both atomically.
Update the attendance document with at least:

{
  status: newStatus,

  lastCorrectedAt: serverTimestamp(),
  lastCorrectedById: currentUser.id,
  lastCorrectedByName: currentUser.fullName,
  lastCorrectedByUsername: currentUser.username,
  lastCorrectionReason: correctionReason,
  lastCorrectionNote: correctionNote || null,

  updatedAt: serverTimestamp(),
}

Do not overwrite:
- original attendance document ID
- original teacher/creator information
- original created date
- studentId
- classroomId
- attendance date
Create audit log with:

{
  attendanceId: attendanceDocId,
  classroomId,
  studentId,
  attendanceDate,

  previousStatus,
  newStatus,

  correctionReason,
  correctionNote: correctionNote || null,

  correctedById: currentUser.id,
  correctedByName: currentUser.fullName,
  correctedByUsername: currentUser.username,
  correctedByRole: currentUser.role,

  correctedAt: serverTimestamp(),

  studentSnapshot,
  classroomSnapshot,
  teacherSnapshot,
}
3. Never show success before the real write succeeds
The success toast must run only after:
await runTransaction(...)

has completed successfully.
If the transaction fails:
- Do not close the dialog.
- Do not show success toast.
- Show error toast with useful error message.
- Keep selected status/reason/notes so admin can retry.
4. Verify write result before updating UI
After successful transaction:
1. Re-fetch the corrected attendance document using the same attendanceDocId.
2. Verify:

updatedRecord.status === newStatus

3. If the status does not match:
   - treat as error
   - do not show success toast
   - log a clear console error for development
Only after verification:
- Close all correction dialogs.
- Show success toast.
- Refresh/refetch the Attendance Corrections table.
- Refresh summary cards.
- Update the corrected row immediately in local state if applicable.
- The row must show:
  - new status badge, for example Present
  - corrected indicator/badge
  - correction reason or audit indicator in the Remark column
- Corrected summary count must increase.
- If Corrected checkbox filter is enabled, the corrected record must appear.
5. Refresh dependent pages and reports
After a successful correction, invalidate/refetch the same data source used by:
- Daily Attendance Summary
- Monthly Class Attendance Report
- Student Attendance History
- Student Monthly Report
- Absence & Late Report
- Class Progress Report if it displays attendance-related values
- Attendance Audit Logs
Do not rely on stale arrays, hardcoded mock data, or an outdated fallback service.
6. Handle repeated corrections correctly
If an attendance record was already corrected once:
- Allow admin to correct it again.
- Update the same attendance document status.
- Update lastCorrection... metadata.
- Create one additional audit log entry.
- Never overwrite or delete earlier audit logs.
Example:
Original: Absent
Correction 1: Present
Correction 2: Late

Expected result:
- Current attendance record status: Late
- Audit logs: two records
  1. Absent → Present
  2. Present → Late
7. UI checks
Keep the current correction UI design because it is already good:
- correction dialog
- status selection cards
- reason dropdown
- confirmation dialog
Small improvement:
- After successful correction, show a visible Corrected badge/indicator in the table row.
- In Remark, show the latest correction reason in compact text or a tooltip.
- Ensure status counts recalculate immediately.
8. Required test
Perform this exact test:
1. Find student STU-377 on attendance date 2026-10-07.
2. Existing status is Absent.
3. Choose new status Present.
4. Select reason Student submitted valid explanation.
5. Confirm correction.
6. Verify all of these:
   - table status changes from Absent to Present
   - corrected indicator appears
   - summary cards update:
     - Present increases by 1
     - Absent decreases by 1
     - Corrected increases by 1
   - refreshed page still shows Present
   - Student Attendance History shows Present
   - Absence & Late Report no longer counts this record as absent
   - Attendance Audit Logs contains Absent → Present
7. Run npm run build and fix all TypeScript/build errors.