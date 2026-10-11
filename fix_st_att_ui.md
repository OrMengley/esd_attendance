Fix the **Student Attendance** module UI issues in the existing ESD Attendance Vite React + TypeScript + Firestore project.

This task covers:

1. Mixed Khmer/English UI text when global language is English.
2. Minor Student Attendance layout issues found in the detail and monthly report pages.
3. Cleanup of irrelevant report legend items.

Do not change Firestore models, attendance calculations, permissions, enrollment/transfer logic, or report data.

## 1. Strict i18n rule

The global language selector is the single source of truth.

When global language is `English`:

- All UI labels, headings, buttons, filters, table headers, empty states, badges, helper text, dialog text, print report labels, and footer labels must display in English.
- No Khmer UI label may remain.

When global language is `Khmer`:

- All UI labels, headings, buttons, filters, table headers, dialogs, print report labels, and footer labels must display in Khmer.
- No English UI label may remain, except universally understandable technical values if unavoidable.

Do not translate stored data values automatically:

- Student Khmer names remain Khmer.
- Student English names remain English.
- Class names use their saved language fields according to the current selected language, with fallback only when that translation is empty.
- Usernames, student codes, class codes, phone numbers, dates, and IDs remain data values.

## 2. Audit Student Attendance module

Audit every UI string in these routes and related components:

```text
/student-attendance
/student-attendance/:studentId
/student-attendance/:studentId/monthly/:yearMonth
```

Also audit:

```text
Student search/list page
Student attendance detail page
Enrollment History section
Detailed Attendance Timeline section
Monthly report generation dialog
Monthly Student Report print preview
Print footer
All filters, selects, table columns, tooltips, empty states, and toasts
```

Replace all hardcoded Khmer/English UI text with the existing `t(...)` i18n function.

Use one consistent namespace:

```text
studentAttendance.*
```

Do not mix unrelated namespaces or create duplicate translation keys.

## 3. Specific mixed-language fixes

When language is English, ensure these and similar labels are English:

```text
Student Attendance
Enrollment History
Detailed Attendance Timeline
Date
Class
Status
Remark
Recorded By
Present
Absent
Late
Permission
Recorded Sessions
Attendance Rate
Monthly Student Report
Generate Monthly Student Attendance Report
Select Month / Year
Cancel
View Report
Back to History
Print / Save as PDF
Student Information
Classroom Information
Scheduled
Recorded
Rate
Prepared By
Teacher Signature
Director / Admin Signature
```

When language is Khmer, provide proper Khmer translations for every equivalent label.

Ensure the table headers currently appearing in Khmer while English is selected, such as Date and Recorded By, are fixed.

## 4. Locale-aware formatting

Use the global app language for formatting:

```text
English UI → English weekday/month labels
Khmer UI → Khmer weekday/month labels
```

Use Cambodia timezone:

```text
Asia/Phnom_Penh
```

Keep attendance codes universal:

```text
P, A, L, E
```

but translate their label text in the legend and badges.

## 5. Student detail page layout fix

On the Student Attendance Detail page:

### Enrollment History

- If there is only one enrollment, its card must use full available width.
- If there are two or more enrollments, use a responsive grid:
  - Desktop: up to 2 columns
  - Mobile: 1 column
- Remove the large empty white space caused by a half-width card when only one enrollment exists.

### Filter row

Fix the date/date-range input overflow in Detailed Attendance Timeline:

- Date control must never be clipped.
- Calendar icon must remain visible.
- Use responsive grid/flex layout.
- Add suitable `min-width` to date controls.
- Use `min-w-0` correctly on shrinkable flex children.
- Remove any parent `overflow-hidden` that cuts the control.
- On narrow screens, filters must wrap into separate rows cleanly.

Use a clear localized placeholder:

```text
English: Select date range
Khmer: ជ្រើសរើសចន្លោះកាលបរិច្ឆេទ
```

## 6. Monthly Student Report dialog

Keep the report generation dialog clean.

- Always show Month / Year selection.
- Show an Enrollment/Class selection only when the student has more than one valid enrollment relevant to the selected month.
- If exactly one enrollment is valid, select it automatically and do not show an unnecessary class field.
- All dialog text must follow global language.

## 7. Monthly Student Report legend cleanup

The current Student Monthly Report table only lists valid expected learning dates for the selected enrollment.

Therefore, remove legend items that cannot appear in this report table:

```text
H = Holiday
— = Off-session
```

Keep only relevant statuses:

```text
P = Present
A = Absent
L = Late
E = Permission
• = Pending
```

If Holiday or Off-session rows are later intentionally displayed, add the matching legend items back at that time.

## 8. Print preview and report layout

Ensure i18n also works correctly on the dedicated monthly student print preview page:

```text
/student-attendance/:studentId/monthly/:yearMonth
```

When printing:

- Print the selected language consistently.
- Do not mix Khmer/English UI labels.
- Keep student/class saved data values intact.
- Keep the current A4 portrait print layout, school logo, summary, table, and signatures.

## 9. Verification

Test both application languages on:

1. Student Attendance list.
2. Student Attendance detail.
3. Enrollment History.
4. Detailed Attendance Timeline.
5. Monthly report dialog.
6. Monthly Student Report preview.
7. Browser print preview.

Verify:

- No hardcoded Khmer UI remains when English is selected.
- No hardcoded English UI remains when Khmer is selected.
- Date-range filter is not clipped on desktop or mobile.
- Single Enrollment History card uses full width.
- Multiple enrollment cards remain responsive.
- Monthly report legend shows only statuses that can actually occur.
- Run:

```bash
npm run build
```

Fix all TypeScript, i18n, responsive layout, and build errors before completion.