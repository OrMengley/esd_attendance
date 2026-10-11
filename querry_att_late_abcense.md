Fix the `Assigned Teacher` filter in the existing **Absence & Late Report**.

## Current issue

The `Assigned Teacher` dropdown currently includes users with roles:

- `super_admin`
- `admin`
- `teacher`

This is incorrect because only users with the `teacher` role can be assigned to classrooms and should appear in this filter.

## Required fix

Update the teacher-filter data source so it includes only active teacher accounts:

```ts
user.role === "teacher" && user.status === "active"

Requirements:
- Keep the first option:
  - English: All Teachers
  - Khmer: appropriate Khmer translation
- Do not show any super_admin account.
- Do not show any admin account.
- Do not show inactive teacher accounts.
- Show active teachers only, with display format:

Full Name (@username)

Sort teacher options alphabetically by display name.
Preserve the selected filter value if it is an active teacher.
If a previously selected teacher becomes inactive or invalid, reset the filter to All Teachers.
Ensure report filtering still works correctly after selecting a teacher.
Do not modify the Assigned Teacher column in the result table; it should continue to display the actual classroom teacher.
Reuse the same active-teacher filtering rule used by Classroom Create/Edit teacher selection when possible.
Add/update i18n only if any new text is required.
Run npm run build and fix all TypeScript errors.