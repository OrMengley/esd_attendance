Fix and improve the existing **Class Progress Report** only. Do not rewrite unrelated modules or change the progress calculation already implemented.

## 1. Add tooltips for Actions column

The report table currently uses icon-only action buttons. Add accessible Shadcn `Tooltip` components so users understand each action.

Actions:

1. Eye icon
   - English tooltip: `View Class Details`
   - Khmer tooltip: appropriate Khmer translation
   - Action: navigate to the existing classroom detail page.

2. Attendance/report icon
   - English tooltip: `View Attendance Report`
   - Khmer tooltip: appropriate Khmer translation
   - Action: navigate to the existing monthly class attendance report for that classroom.

Requirements:

- Tooltip must appear on hover and keyboard focus.
- Add `aria-label` to every icon-only action button.
- Use existing i18n translation keys; do not hardcode English/Khmer text.
- Keep current icon button design, spacing, and responsive behavior.
- Do not show tooltips in the print layout.

## 2. Fix Assigned Teacher filter data

The `Assigned Teacher` filter in **Class Progress Report** must list only valid active teacher accounts.

Use this exact eligibility rule:

```ts
user.role === "teacher" && user.status === "active"

Requirements:
- Keep All Teachers as the first default option.
- Show only active users with role === "teacher".
- Never show users with roles:
  - super_admin
  - admin
- Never show inactive teachers.
- Display teacher option as:

Full Name (@username)

- Sort teachers alphabetically by full name.
- If the currently selected teacher is inactive, deleted, or no longer has teacher role, reset the filter to All Teachers.
- Teacher filter must correctly update the report table, summary cards, print output, and Excel export.
- Reuse the same active-teacher query/helper used by the Classroom Create/Edit teacher selector and Absence & Late Report when possible.
- Do not modify the Assigned Teacher table column. It must continue showing the actual teacher assigned to each class.
3. Verification
Before completion, verify:
1. Hovering or focusing each action icon shows the correct localized tooltip.
2. English mode contains English tooltips only.
3. Khmer mode contains Khmer tooltips only.
4. Assigned Teacher dropdown includes All Teachers plus active teacher users only.
5. super_admin, admin, and inactive teacher accounts do not appear.
6. Selecting a teacher filters classes correctly.
7. Run npm run build and fix all TypeScript/build errors.