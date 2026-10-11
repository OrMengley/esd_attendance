Implement complete Student Profile Management and Student Enrollment for the ESD Attendance system using existing Vite React, TypeScript, shadcn/ui, Firebase Firestore, Cloudinary, React Router, and Khmer/English i18n.

Existing features that must remain unchanged:
- Firebase config and environment variables
- Login and user roles
- Study Packages and Course Modules
- Class/Batch Management
- Class schedule and expected end-date calculation
- Existing UI foundation

Do not implement Attendance yet. This task is only Student CRUD and Enrollment.

## Main business rules

1. A Student profile is separate from enrollment history.
2. Do not store `classroomId` directly in the Student document.
3. A Student can have multiple enrollment records over time.
4. A Student can only have one `active` enrollment at a time.
5. Every new enrollment must select an existing active Class/Batch.
6. Package is automatically inherited from the selected Class.
7. Expected end date is inherited from the selected Class expected end date.
8. Do not hard-delete Student or Enrollment records.
9. Parent phone fields are optional and must be separate:
   - `fatherPhone?: string`
   - `motherPhone?: string`
10. Remove old `guardianPhone` field completely.

## Firestore collections

```text
students
enrollments
```

## Student model

Update/create `src/models/student.model.ts`:

```ts
export type StudentStatus = "active" | "inactive" | "archived";

export interface StudentAddress {
  village?: string;
  commune?: string;
  district?: string;
  province?: string;
}

export interface Student {
  id: string;
  studentCode: string;

  nameKh: string;
  nameEn?: string;
  gender: "male" | "female";
  dateOfBirth?: string;
  birthCertificateStatus?: "has_certificate" | "no_certificate";

  phone?: string;
  avatarUrl?: string;
  address?: StudentAddress;

  fatherName?: string;
  fatherOccupation?: string;
  fatherPhone?: string;

  motherName?: string;
  motherOccupation?: string;
  motherPhone?: string;

  note?: string;
  status: StudentStatus;

  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}
```

Phone numbers must always be stored as strings, not numbers, to preserve leading zeroes.

## Enrollment model

Create `src/models/enrollment.model.ts`:

```ts
export type EnrollmentStatus =
  | "active"
  | "completed"
  | "paused"
  | "cancelled";

export interface Enrollment {
  id: string;
  studentId: string;
  classroomId: string;
  packageId: string;

  startDate: string;
  expectedEndDate: string;
  actualEndDate?: string;

  status: EnrollmentStatus;
  note?: string;

  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}
```

## Services

Create separate Firestore services:

```text
src/services/student.service.ts
src/services/enrollment.service.ts
```

Required Student functions:

```ts
getStudents()
getStudentById(id)
getStudentByCode(studentCode)
createStudent(data, currentUserId)
updateStudent(id, data, currentUserId)
setStudentStatus(id, status, currentUserId)
```

Required Enrollment functions:

```ts
getEnrollments()
getEnrollmentsByStudentId(studentId)
getActiveEnrollmentByStudentId(studentId)
getEnrollmentById(id)
createEnrollment(data, currentUserId)
updateEnrollment(id, data, currentUserId)
setEnrollmentStatus(id, status, currentUserId)
```

Rules:
- Student code must be unique.
- Before creating an active enrollment, check that student does not already have another active enrollment.
- Selected classroom must exist and have status `active`.
- Selected classroom must have capacity available, if capacity is configured.
- Save `classroomId` and `packageId` only in Enrollment.
- Use Firestore batch write or transaction when creating a Student and first Enrollment together.
- Never hard-delete a student or enrollment.
- Use `archived` for Student and `cancelled` for Enrollment where appropriate.
- Keep Firestore operations inside service files only.

## Routes

Create/refactor:

```text
/students
/students/new
/students/:id
/students/:id/edit
```

Permissions:
- `super_admin` and `admin`: full Student and Enrollment management.
- `teacher`: cannot create/edit students, but future attendance pages will only read enrolled students in their assigned classes.
- Keep Students sidebar item hidden for teacher.

## Student List page

Create a clean responsive Student List page.

Desktop columns:

```text
Student
Student Code
Gender
Active Class
Parent Contact
Status
Actions
```

Display rules:
- Student cell: avatar + Khmer name + English name if available.
- Active Class: resolve from active enrollment and show class name/code.
- Parent Contact: show available father/mother phone number, or `-`.
- Do not show all address/parent fields in the table.
- Show Student profile details through View page.

Toolbar:
- Search by student code, Khmer name, English name, student phone, father phone, or mother phone.
- Filter by active Class.
- Filter by Student status.
- “Add Student” button.

Actions:
- View Student
- Edit Student
- Enroll in Class
- Change Student Status
- Archive Student

For mobile, show compact Student Cards instead of an overflowing table.

## Full-page Student Form

Do not use a small modal/dialog for Student Create/Edit because student information is extensive.

Use full pages:
- `/students/new`
- `/students/:id/edit`

Page header:
- Back button
- Title
- Save button
- Cancel button

Use grouped Cards/sections:

```text
1. Student Information
   - Student Code
   - Khmer Name
   - English Name
   - Gender
   - Date of Birth
   - Birth Certificate Status
   - Student Phone
   - Profile Photo Upload

2. Address
   - Village
   - Commune
   - District
   - Province

3. Father Information
   - Father Name
   - Father Occupation
   - Father Phone (optional)

4. Mother Information
   - Mother Name
   - Mother Occupation
   - Mother Phone (optional)

5. Additional Information
   - Note
   - Student Status
```

Required:
- Student Code
- Khmer Name
- Gender

Optional:
- English Name
- Date of Birth
- Birth Certificate Status
- Student phone
- Address
- All father fields
- All mother fields
- Note
- Profile photo

Use existing Cloudinary configuration for profile photo upload. If no photo is uploaded, save empty `avatarUrl`.

## Enrollment flow

After a Student profile is created successfully:

1. Redirect to Student Detail page.
2. Show primary button:

```text
ចុះឈ្មោះចូលថ្នាក់
Enroll in Class
```

3. Open an Enrollment Dialog or right-side Sheet.

Create:

```text
src/components/students/enrollment-dialog.tsx
```

Enrollment fields:

```text
Student: readonly selected student
Class/Batch: required searchable selector
Study Package: readonly, automatically shown from chosen class
Teacher: readonly, automatically shown from chosen class
Schedule: readonly, automatically shown from chosen class
Start Date: required, default to selected class start date
Expected End Date: readonly, automatically inherited from selected class expected end date
Enrollment Status: default active
Note: optional
```

Class selector requirements:
- Load only active classes.
- Search by class code or class name.
- Display Class Name, Class Code, Package, Teacher, Schedule, Start Date, Expected End Date, and Capacity.
- Do not use a crowded normal dropdown.
- Use a searchable Command/Dialog/Sheet selection UI compatible with Vite shadcn/ui.

When an active enrollment is created:
- Block if student already has an active enrollment.
- Block if class has reached configured capacity.
- Store actual selected `classroomId`, inherited `packageId`, selected `startDate`, and class `expectedEndDate`.
- Refresh Student Details and Student List automatically.

## Student Detail page

Create `/students/:id` full details page with:

```text
- Student Profile
- Address
- Father Information
- Mother Information
- Current Active Enrollment
- Enrollment History
- Edit Student button
- Enroll in Class button
```

Enrollment History table columns:

```text
Class
Package
Teacher
Start Date
Expected End Date
Actual End Date
Status
Note
Actions
```

Enrollment actions:
- View details
- Mark Completed
- Pause
- Resume
- Cancel

Rules:
- Mark Completed: set enrollment status to `completed` and set `actualEndDate`.
- Pause: set enrollment status to `paused`.
- Resume: only allowed if no other active enrollment exists; set status back to `active`.
- Cancel: set enrollment status to `cancelled`.
- Do not delete enrollment history.

## File structure

```text
src/
  components/
    students/
      student-table.tsx
      student-status-badge.tsx
      student-form.tsx
      enrollment-dialog.tsx
      class-selection-dialog.tsx
      enrollment-history-table.tsx
  models/
    student.model.ts
    enrollment.model.ts
  pages/
    students/
      students-list-page.tsx
      student-form-page.tsx
      student-detail-page.tsx
  services/
    student.service.ts
    enrollment.service.ts
```

## i18n

Use `t()` for all visible UI strings.

Add Khmer and English translations for:
- Student fields
- Father and Mother fields
- Optional labels
- Enrollment fields
- Enroll in Class
- Enrollment history
- Active enrollment exists error
- Class capacity full error
- Student created/updated/archived
- Enrollment created/completed/paused/resumed/cancelled

Example Khmer messages:

```text
students.created: "បង្កើតព័ត៌មានសិស្សបានជោគជ័យ"
students.updated: "កែប្រែព័ត៌មានសិស្សបានជោគជ័យ"
enrollment.created: "ចុះឈ្មោះសិស្សចូលថ្នាក់បានជោគជ័យ"
enrollment.activeExists: "សិស្សនេះកំពុងមានថ្នាក់សកម្មរួចហើយ"
enrollment.classFull: "ថ្នាក់រៀននេះពេញហើយ"
```

Finally:
- Do not use mock data.
- Do not use Next.js imports.
- Do not break existing Study Package, Class, User, or Firebase features.
- Run `npm run build`.
- Fix all TypeScript, Firestore, route, import, and i18n errors.