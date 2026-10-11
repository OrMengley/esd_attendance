Fix the following issues in the existing **Absence & Late Report** feature. Do not rewrite unrelated modules or break existing attendance, student history, export, and print features.

## 1. Fix mixed Khmer/English UI text

The global language switch must control every UI label consistently.

Current issue:
- When global language is English, the Export button still displays Khmer text such as `ទាញយក Excel`.

Required fix:
- Audit all new Absence & Late Report UI text:
  - page title and description
  - action buttons
  - summary card labels and subtitles
  - filter labels and options
  - table headers
  - badges
  - empty states
  - pagination
  - print layout
  - Excel export labels/messages
- Move any hardcoded text into the existing `en.json` and `km.json`.
- English mode: all interface labels must be English.
- Khmer mode: all interface labels must be Khmer.
- Student names, teacher names, class names, and package names are stored data, so they may remain Khmer or English as entered.
- Do not display untranslated i18n keys anywhere.

Expected English action labels:

- Refresh
- Print Report
- Export Excel
- View Student History
- Clear Filters

## 2. Fix attendance-rate calculation for the current month

Current issue:
- The report shows `Scheduled = 18` for the full month.
- On October 11, a student with one `late` record receives attendance rate `5.6%` because the system calculates `1 / 18`.
- Future classes that have not happened yet must not reduce attendance rate.

Required calculation rules:

### A. Planned Sessions

`plannedSessions` means all valid scheduled sessions in the selected month.

- Match classroom learning days.
- Respect class start date, expected end date, enrollment active period, transfers, completed/cancelled enrollment state, and school holidays.
- This value can include future sessions and is informational only.

### B. Elapsed Sessions / Counted Sessions

`elapsedSessions` means only sessions that are already eligible to have attendance recorded.

- For a past date: include the scheduled session.
- For today: include the session only after that classroom’s scheduled `end_time` has passed in Cambodia timezone.
- For a future date: do not include the session.
- Exclude holidays and invalid enrollment dates.
- Use Cambodia timezone consistently.

### C. Attendance Rate

Calculate attendance rate only from `elapsedSessions`.

```ts
attendanceRate =
  elapsedSessions > 0
    ? ((presentCount + lateCount) / elapsedSessions) * 100
    : null;

Rules:
- late counts as attended, so it is included with present in attendance rate.
- absent is not included in the numerator.
- If elapsedSessions === 0, show — or Not started instead of 0%.
- Never include future sessions in the attendance-rate denominator.
- For completed/past months, all valid sessions in that month are elapsed sessions.
Example:
- October has 18 planned sessions.
- Today is October 11.
- Only 1 class session has already ended and the student is marked late.
- Display:
  - Planned Sessions: 18
  - Counted Sessions: 1
  - Present: 0
  - Late: 1
  - Absent: 0
  - Attendance Rate: 100%
- Do not display 5.6%.
3. Improve the table UI and horizontal scroll behavior
Current issue:
- The table is too wide.
- On some views, Rank and Student columns are hidden/cut off after horizontal scrolling.
- Users can lose the student identity while viewing columns on the right.
Required fix for desktop table:
- Keep Rank and Student as sticky left columns.
- Set a solid background on sticky cells/header so text behind them does not show through.
- Use subtle right border/shadow on the Student sticky column.
- Ensure table starts horizontally at the far left by default whenever:
  - page first loads
  - filters change
  - pagination changes
  - data refreshes
- Keep horizontal scrolling available only inside the table wrapper.
- Do not allow page-level horizontal overflow.
- Set sensible min-width values for columns; do not let student name/avatar/code overlap.
Recommended compact columns:
1. Rank
2. Student
3. Current Class
4. Assigned Teacher
5. Sessions
6. Present
7. Absent
8. Late
9. Attendance Rate
10. Last Incident
11. Actions
For the Sessions column, make it clear without adding excessive table width:
- Main value: Elapsed Sessions, for example 1
- Muted secondary text: of 18 planned
Example:

1
of 18 planned

This avoids confusion between total monthly planned sessions and sessions currently used for attendance rate.
4. Responsive mobile layout
- On mobile and small tablet screens, do not force the wide desktop table.
- Render report results as clear student cards.
- Each card should show:
  - Rank
  - Student name and student code
  - Class
  - Teacher
  - Elapsed / Planned Sessions
  - Present, Absent, Late
  - Attendance Rate
  - Last Incident
  - View Student History button
- No horizontal overflow on mobile.
5. Export and print consistency
Update Excel export and print report to use the corrected values.
Include both fields:
- Planned Sessions
- Counted/Elapsed Sessions
- Present
- Absent
- Late
- Attendance Rate
For the current/future month, Excel and print must not calculate attendance rate using future sessions.
6. Validation and testing
Test these cases before completion:
1. Current month: one completed session marked late, future sessions remain:
   - attendance rate uses only completed/elapsed session(s).
2. Current month: no class session has ended yet:
   - attendance rate shows — or Not started.
3. Past month:
   - all valid monthly sessions are counted.
4. late contributes to attendance rate as attended.
5. absent does not contribute to attendance rate.
6. English mode contains no Khmer interface labels.
7. Khmer mode contains no English interface labels except stored data where appropriate.
8. Desktop table keeps Rank and Student visible while horizontally scrolling.
9. Mobile report uses cards without horizontal overflow.
10. Run npm run build and fix all TypeScript/build errors.