Refactor only the Classroom Management UI/UX. Keep all existing Firestore CRUD logic, models, schedule calculation logic, i18n, roles, and business rules unchanged.

Current problems:
- Classroom data table is crowded and messy.
- Create/Edit Classroom form is inside a small dialog and requires too much scrolling.
- Teacher selection uses a normal dropdown, which will become unusable when there are many teachers.

## 1. Replace Classroom Create/Edit Dialog with full pages

Remove the small create/edit classroom dialog.

Create routes:

```text
/classes
/classes/new
/classes/:id/edit
/classes/:id
```

Behavior:
- “Add Class” button navigates to `/classes/new`.
- Edit action navigates to `/classes/:id/edit`.
- View Details action navigates to `/classes/:id`.
- Keep the Class List page at `/classes`.

Create files:

```text
src/pages/classes/classes-list-page.tsx
src/pages/classes/classroom-form-page.tsx
src/pages/classes/classroom-detail-page.tsx
```

Use a clean desktop-first full page form with responsive mobile layout.

Form page header:
- Back button
- Create mode: `បង្កើតថ្នាក់រៀនថ្មី` / `Create New Class`
- Edit mode: `កែប្រែថ្នាក់រៀន` / `Edit Class`
- Save button at top right
- Cancel button

Use grouped Cards/sections instead of one long unstructured form:

```text
1. Basic Information
   - Class Code
   - Class Name
   - Study Package
   - Status

2. Teacher Assignment
   - Selected Teacher Card
   - Change / Select Teacher button

3. Learning Schedule
   - Schedule Type
   - Learning Days
   - Start Time
   - End Time
   - Hours Per Week

4. Study Period
   - Start Date
   - Expected End Date (auto calculated, read only)

5. Additional Information
   - Capacity
   - Note
```

Do not place the full form inside a Dialog or Modal.

## 2. Create searchable Teacher Selection Dialog

Do not use a normal Select/dropdown for teachers.

When user clicks `Select Teacher` or `Change Teacher`, open a dedicated Teacher Selection Dialog.

Create:

```text
src/components/classes/teacher-selection-dialog.tsx
```

Dialog features:
- Title: `ជ្រើសរើសគ្រូបង្រៀន` / `Select Teacher`
- Search input
- Search by teacher name, username, phone, or email
- Load only active users from Firestore where:

```ts
user.role === "teacher" && user.status === "active"
```

- Display teachers in a clean selectable list/table:
  - Avatar
  - Teacher Name
  - Username
  - Phone
  - Email
  - Select action
- Clicking a teacher row selects the teacher and closes the dialog.
- Selected teacher appears in the Classroom Form as a clean card with:
  - Avatar
  - Name
  - Username
  - Phone
  - Change button
  - Remove button
- Show empty state if no teacher exists, with a button linking to `/users`.
- Use Dialog/Command/Input components compatible with Vite React shadcn/ui.
- Ensure the dialog overlay and content z-index work correctly.

## 3. Improve Classroom List Table

Refactor the classroom data table to be clean and compact.

Do not show too many separate columns.

Use only these columns:

```text
Class
Study Package
Teacher
Schedule
Study Period
Status
Actions
```

Column details:

1. Class:
- Show class name as primary text.
- Show class code below in smaller muted text.

2. Study Package:
- Show package Khmer name.
- Show total planned hours below in smaller muted text.

3. Teacher:
- Show avatar + teacher name.
- Show username below in smaller muted text.
- Show `Unassigned` badge only if no teacher exists.

4. Schedule:
- Show readable summary:
  - `Mon–Fri · 07:00–08:00`
  - `Sat–Sun · 07:00–09:00`
- Show `5 hrs/week` or `4 hrs/week` below in muted text.

5. Study Period:
- Show start date → expected end date in one cell.
- Do not display extra date columns.

6. Status:
- Use existing status badge.

7. Actions:
- Use compact dropdown menu:
  - View Details
  - Edit
  - Mark Completed
  - Activate / Inactivate

Do NOT show these fields directly in the list table:
- Capacity
- Note
- Session minutes
- Raw schedule day numbers
- Internal IDs

Move those fields to the Details page.

Add top toolbar:
- Search by class code/name
- Package filter
- Teacher filter
- Status filter
- Schedule type filter
- Add Class button aligned right

Use responsive behavior:
- Desktop: table layout.
- Mobile: display each classroom as a compact Card, not a horizontally overflowing table.

## 4. Classroom Details Page

Create a clean readonly details page at:

```text
/classes/:id
```

Display sections:
- Class Information
- Study Package Information
- Assigned Teacher
- Schedule
- Study Period
- Capacity and Notes
- Audit Information: created date, updated date

Include Edit button for `super_admin` and `admin`.

## 5. Technical requirements

- Keep existing Firestore collection `classrooms`.
- Keep current model and schedule calculation utility.
- Keep role permissions:
  - `super_admin`, `admin`: full access
  - `teacher`: no Classes page access
- Use existing Khmer/English i18n for all text.
- Do not add Next.js imports.
- Use Vite React shadcn/ui components only.
- Ensure Dialog/Popover/Dropdown have correct z-index and are not clipped.
- Run `npm run build` and fix all TypeScript, routing, i18n, and import errors.