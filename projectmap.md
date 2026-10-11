Create a modern, responsive **School Attendance Management** frontend project using:

- Vite
- React + TypeScript
- Tailwind CSS
- shadcn/ui
- React Router DOM
- Lucide React icons

Important: Build only the **frontend project shell/UI** for now. Do NOT implement backend, API calls, database, authentication, login logic, JWT, or real CRUD actions yet. Use local mock data only where needed to show UI states.

Project goal:
A small school attendance management system for managing daily student attendance, teachers, and user accounts.

Use a clean professional admin dashboard design with:
- Left collapsible sidebar
- Top header/navbar
- Responsive layout for desktop and mobile
- Khmer language as the primary UI language
- Use English only for technical labels where appropriate
- Use shadcn/ui components consistently
- Good spacing, modern cards, tables, dialogs, badges, dropdown menus, tooltips, and loading/empty states

Create these pages and routes:

1. `/dashboard`
   - Dashboard overview
   - Summary cards:
     - Total Students
     - Total Teachers
     - Present Today
     - Absent Today
   - Simple recent attendance table with mock data
   - Attendance status badges: Present, Absent, Late

2. `/students`
   - Student management page
   - Header with title and “Add Student” button
   - Search input
   - Filter by class
   - Students data table with columns:
     - Profile
     - Student ID
     - Name
     - Gender
     - Class
     - Parent Phone
     - Status
     - Actions
   - Action dropdown: View, Edit, Delete
   - Add/Edit student dialog UI only

3. `/teachers`
   - Teacher management page
   - Table columns:
     - Profile
     - Teacher ID
     - Name
     - Phone
     - Email
     - Assigned Class
     - Status
     - Actions
   - Add/Edit teacher dialog UI only

4. `/attendance`
   - Daily attendance page
   - Date picker
   - Class select dropdown
   - Attendance student table:
     - Student ID
     - Student Name
     - Class
     - Attendance Status
     - Remark
   - Status selection UI:
     - Present
     - Absent
     - Late
     - Permission
   - “Save Attendance” button UI only
   - Show mock attendance data

5. `/users`
   - User account management page
   - Table columns:
     - Name
     - Email
     - Role
     - Status
     - Last Login
     - Actions
   - Roles: Admin, Teacher
   - Add/Edit user dialog UI only

6. `/settings`
   - Basic school settings shell
   - School name, phone number, email, address fields
   - Save button UI only

Sidebar menu:
- Dashboard
- Students
- Teachers
- Attendance
- User Accounts
- Settings

Use reusable components:
- `AppSidebar`
- `Header`
- `PageHeader`
- `StatCard`
- `DataTable` (or reusable table structure)
- `StatusBadge`
- `EmptyState`

Suggested folder structure:

src/
  components/
    layout/
    shared/
    students/
    teachers/
    attendance/
    users/
  pages/
  routes/
  types/
  lib/
  data/

Create mock TypeScript types for:
- Student
- Teacher
- Attendance
- User
- Classroom

Use placeholder profile avatars and mock Khmer student/teacher names.

Do not create a login page yet. The dashboard should be directly accessible for now. Structure the app cleanly so authentication and backend API integration can be added later without major refactoring.

Ensure the project runs correctly with:
`npm install`
`npm run dev`


Create a modern, responsive frontend project named **Computer Class Attendance Management System** using:

- Vite
- React + TypeScript
- Tailwind CSS
- shadcn/ui
- React Router DOM
- Lucide React icons

Important scope:
- Build only the frontend project shell and UI for now.
- Do NOT create backend, database, API calls, login page, authentication logic, JWT, or real CRUD actions yet.
- Use mock data for demonstrating tables, cards, filters, and UI states.
- Structure the project cleanly so backend API and login can be integrated later.

System purpose:
This system manages daily student attendance for a computer training school/classroom.

Computer subjects include:
- Microsoft Word
- Microsoft Excel
- Microsoft PowerPoint
- Microsoft Access
- Typing
- Internet & Email
- Basic Computer
- Other computer-related courses

User roles:

1. `super_admin`
   - For developer/system owner only
   - Can manage all users, admins, teachers, classes, subjects, attendance, and settings
   - This role should exist in mock data and role badges only for now

2. `admin`
   - Manages teachers, students, classes, subjects, user accounts, and attendance reports

3. `teacher`
   - Can see only their assigned classes and assigned subjects
   - Can record daily attendance for students in their assigned class
   - Can view their own attendance history

Use a clean professional admin dashboard design:
- Collapsible left sidebar
- Top header/navbar
- Responsive desktop and mobile layout
- Khmer language as primary UI language
- English is acceptable for technical terms such as Word, Excel, PowerPoint
- Use shadcn/ui components consistently
- Use cards, tables, dialogs, select dropdowns, date picker, tabs, badges, tooltips, skeleton loaders, empty states, and dropdown menus

Create these routes/pages:

1. `/dashboard`
   - Dashboard summary cards:
     - Total Students
     - Total Teachers
     - Total Classes
     - Present Today
     - Absent Today
   - Today’s attendance summary by class
   - Recent attendance records table
   - If the mock current user role is `teacher`, show only assigned class data

2. `/students`
   - Student management page
   - Search student
   - Filter by class
   - Table columns:
     - Profile
     - Student ID
     - Name
     - Gender
     - Phone Number
     - Enrolled Class
     - Status
     - Actions
   - Add/Edit Student dialog UI only

3. `/teachers`
   - Teacher management page
   - Table columns:
     - Profile
     - Teacher ID
     - Name
     - Phone
     - Email
     - Assigned Classes
     - Assigned Subjects
     - Status
     - Actions
   - Add/Edit Teacher dialog UI only

4. `/subjects`
   - Subject/course management page
   - Display subjects such as Word, Excel, PowerPoint, Access, Typing, Basic Computer
   - Table columns:
     - Subject Code
     - Subject Name
     - Description
     - Duration
     - Status
     - Actions
   - Add/Edit Subject dialog UI only

5. `/classes`
   - Classroom management page
   - Table columns:
     - Class Code
     - Class Name
     - Subject
     - Teacher
     - Schedule
     - Total Students
     - Status
     - Actions
   - Add/Edit Class dialog UI only
   - Example class names:
     - Word Basic Morning
     - Excel Advanced Evening
     - PowerPoint Weekend
     - Computer Basic Batch 01

6. `/attendance`
   - Daily attendance recording page
   - Date picker
   - Class select dropdown
   - Subject information display
   - Assigned teacher display
   - Student attendance table:
     - Student ID
     - Student Name
     - Class
     - Attendance Status
     - Remark
   - Attendance statuses:
     - Present
     - Absent
     - Late
     - Permission
   - “Save Attendance” button UI only
   - Teacher UI should show only assigned classes in mock data

7. `/attendance-history`
   - Attendance report/history page
   - Search by student name
   - Filter by date range
   - Filter by class
   - Filter by attendance status
   - Table showing attendance records

8. `/users`
   - User account management page
   - Table columns:
     - Profile
     - Name
     - Email
     - Role
     - Linked Teacher
     - Status
     - Last Login
     - Actions
   - Role badges:
     - `super_admin`
     - `admin`
     - `teacher`
   - Add/Edit User dialog UI only

9. `/settings`
   - School/training center settings shell
   - Fields:
     - Center Name
     - Phone Number
     - Email
     - Address
     - Logo upload UI
   - Save button UI only

Sidebar navigation:
- Dashboard
- Students
- Teachers
- Subjects / Courses
- Classes
- Daily Attendance
- Attendance History
- User Accounts
- Settings

Create reusable UI components:

src/
  components/
    layout/
      app-sidebar.tsx
      app-header.tsx
      page-header.tsx
    shared/
      stat-card.tsx
      status-badge.tsx
      empty-state.tsx
      confirm-dialog.tsx
      data-table.tsx
    students/
    teachers/
    subjects/
    classes/
    attendance/
    users/

Use separate TypeScript model files. Do NOT put all models/interfaces into one file.

Required folder structure:

src/
  models/
    user.model.ts
    student.model.ts
    teacher.model.ts
    subject.model.ts
    classroom.model.ts
    attendance.model.ts
    role.model.ts
  data/
    users.mock.ts
    students.mock.ts
    teachers.mock.ts
    subjects.mock.ts
    classrooms.mock.ts
    attendance.mock.ts
  pages/
    dashboard/
    students/
    teachers/
    subjects/
    classes/
    attendance/
    attendance-history/
    users/
    settings/
  routes/
    index.tsx
  components/
  lib/

Model requirements:

`role.model.ts`
- UserRole = `"super_admin" | "admin" | "teacher"`

`user.model.ts`
- id
- name
- email
- role
- avatarUrl
- teacherId (optional)
- status
- lastLogin
- createdAt

`student.model.ts`
- id
- studentCode
- name
- gender
- phone
- address
- avatarUrl
- classroomId
- status
- createdAt

`teacher.model.ts`
- id
- teacherCode
- name
- phone
- email
- avatarUrl
- classroomIds
- subjectIds
- status
- createdAt

`subject.model.ts`
- id
- code
- name
- description
- duration
- status

`classroom.model.ts`
- id
- code
- name
- subjectId
- teacherId
- schedule
- totalStudents
- status

`attendance.model.ts`
- id
- studentId
- classroomId
- subjectId
- teacherId
- date
- status (`present`, `absent`, `late`, `permission`)
- remark
- createdAt

Use mock Khmer names for students and teachers. Add clear comments indicating that API integration, authentication, and permissions will be implemented later.

The app must run successfully with:

npm install
npm run dev

Update the project architecture: remove the separate Teacher entity completely.

Important business rule:
A teacher is only a user account with role `teacher`.

Do NOT create:
- Teacher model
- Teacher mock data
- Teacher management page
- Teacher data table
- Teacher add/edit dialog
- Teacher components folder

Use only these user roles:
- `super_admin`
- `admin`
- `teacher`

Update the project as follows:

1. Remove these files/folders if they exist:
- `src/models/teacher.model.ts`
- `src/data/teachers.mock.ts`
- `src/pages/teachers/`
- `src/components/teachers/`

2. Remove “Teachers” from the sidebar navigation.

3. Update `user.model.ts`:
```ts
export type UserRole = "super_admin" | "admin" | "teacher";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  assignedClassroomIds?: string[];
  status: "active" | "inactive";
  lastLogin?: string;
  createdAt: string;
}
```

4. Update `classroom.model.ts`:
- Replace `teacherId` with `assignedTeacherId`
- `assignedTeacherId` must reference a User whose role is `teacher`

```ts
export interface Classroom {
  id: string;
  code: string;
  name: string;
  subjectId: string;
  assignedTeacherId: string;
  schedule: string;
  totalStudents: number;
  status: "active" | "inactive";
}
```

5. Update `/classes` page:
- Show an “Assigned Teacher” column.
- In Add/Edit Class dialog, show teacher select options only from mock users where:
```ts
user.role === "teacher"
```

6. Update `/attendance` page:
- For mock current user with role `teacher`, show only classrooms where:
```ts
classroom.assignedTeacherId === currentUser.id
```
- Teacher can record attendance only for their assigned classrooms.
- `super_admin` and `admin` can view all classrooms and attendance records.

7. Update `/users` page:
- This is the only page for creating/managing teacher accounts.
- Admin can create a user with role `teacher`.
- Show assigned classes for teacher-role users.
- User table columns:
  - Profile
  - Name
  - Email
  - Phone
  - Role
  - Assigned Classes
  - Status
  - Last Login
  - Actions

8. Keep these models only:
- `role.model.ts`
- `user.model.ts`
- `student.model.ts`
- `subject.model.ts`
- `classroom.model.ts`
- `attendance.model.ts`

9. Update dashboard:
- Replace “Total Teachers” logic with:
  - Count users where role is `teacher`
- Keep the dashboard card label as “Total Teachers” / “ចំនួនគ្រូបង្រៀន”

Ensure there is no duplicate teacher data anywhere. Every teacher must exist only once in `users.mock.ts` as a User with role `teacher`.

Update the user account and login feature with these requirements.

## User model update

Email must be optional. Username is required and must be unique.

Update `src/models/user.model.ts`:

```ts
export type UserRole = "super_admin" | "admin" | "teacher";

export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
  email?: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  assignedClassroomIds?: string[];
  status: "active" | "inactive";
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
}
```

Update User Management page:

- `username` is required.
- `password` is required when creating a new user.
- `email` is optional: user can leave it empty.
- Add `Username` column in user table.
- Keep `Email` column, but display `-` when no email exists.
- User create/edit dialog fields:
  - Name (required)
  - Username (required)
  - Password (required for create; optional on edit)
  - Email (optional)
  - Phone (optional)
  - Role (required)
  - Assigned Classes (shown only when role is `teacher`)
  - Status

## Firebase Firestore login

Implement a normal login feature using only Firebase Firestore collection:

```text
users
```

Important:
- Do NOT use Firebase Authentication.
- Do NOT use `signInWithEmailAndPassword`.
- Do NOT use Firebase Auth SDK.
- Login only with `username` and `password`.
- Firestore is the only database for user accounts.

Create these files separately:

```text
src/
  firebase/
    config.ts
  services/
    auth.service.ts
    user.service.ts
  contexts/
    auth-context.tsx
  pages/
    login/
      login-page.tsx
  models/
    user.model.ts
```

Firestore collection structure:

```text
users/{userId}
  name: string
  username: string
  password: string
  email?: string
  phone?: string
  role: "super_admin" | "admin" | "teacher"
  avatarUrl?: string
  assignedClassroomIds?: string[]
  status: "active" | "inactive"
  lastLogin?: string
  createdAt: string
  updatedAt?: string
```

Login flow:

1. User enters `username` and `password`.
2. Query Firestore `users` collection by `username`.
3. Check if the account exists.
4. Check if account `status === "active"`.
5. Compare entered password with the password from Firestore.
6. If successful:
   - Save the logged-in user safely in localStorage.
   - Update `lastLogin` in Firestore.
   - Redirect user to `/dashboard`.
7. If failed:
   - Show Khmer error message using shadcn toast:
     - Username not found: `រកមិនឃើញគណនីអ្នកប្រើប្រាស់`
     - Wrong password: `លេខសម្ងាត់មិនត្រឹមត្រូវ`
     - Inactive account: `គណនីនេះត្រូវបានបិទ`

Create `/login` page:
- Username input
- Password input with show/hide password button
- Login button
- Loading state while logging in
- Khmer UI labels
- Clean, modern, responsive shadcn UI design

Role access UI behavior:
- `super_admin` and `admin`: access all admin pages.
- `teacher`: only access Dashboard, Daily Attendance, and Attendance History.
- Teacher must only see classes where:
```ts
classroom.assignedTeacherId === currentUser.id
```

Create `ProtectedRoute` component:
- If no logged-in user exists, redirect to `/login`.
- If role does not have access, redirect to `/dashboard`.

For now, use Firestore password comparison exactly as required. Keep the authentication logic isolated inside `auth.service.ts` so it can later be replaced with a secure backend API and hashed passwords without changing the UI structure.
Implement a real Firestore create-student test using one real student record.

Firebase Firestore and Cloudinary are already configured with environment variables. Do NOT recreate Firebase or Cloudinary configuration files. Reuse the existing configuration.

Important:
- Do not use mock data for this test.
- Create only ONE student document in Firestore collection `students`.
- Do not create an image upload yet because this student has no profile photo.
- Set `avatarUrl` to an empty string for now.
- Prevent duplicate creation by checking `studentCode` before writing to Firestore.
- If the student already exists, show a Khmer toast message and do not create a duplicate.

Update the Student model in a separate file:

`src/models/student.model.ts`

```ts
export interface Student {
  id: string;
  studentCode: string;
  nameKh: string;
  nameEn?: string;
  gender: "male" | "female";
  dateOfBirth?: string;
  birthCertificateStatus?: string;
  phone?: string;
  address?: {
    village?: string;
    commune?: string;
    district?: string;
    province?: string;
  };
  fatherName?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherOccupation?: string;
  guardianPhone?: string;
  classroomId?: string;
  avatarUrl?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt?: string;
}
```

Create a separate Firestore service file:

`src/services/student.service.ts`

It must contain:
- `createStudent`
- `getStudentByCode`
- `getStudents`

Use Firestore collection name:

```text
students
```

Use this real student data for the first test:

```ts
const testStudent: Omit<Student, "id"> = {
  studentCode: "1",
  nameKh: "ធា ធីនណា",
  nameEn: "Thea Thinna",
  gender: "female",
  dateOfBirth: "2009-10-15",
  birthCertificateStatus: "មានប័ណ",
  phone: "0972167348",
  address: {
    village: "ព្រៃព្រំ១",
    commune: "របស់មង្គល",
    district: "មោងឫស្សី",
    province: "បាត់ដំបង",
  },
  fatherName: "រួន ធា",
  fatherOccupation: "កសិករ",
  motherName: "រស់ ស៊ីម",
  motherOccupation: "កសិករ",
  guardianPhone: "066479199",
  classroomId: "",
  avatarUrl: "",
  status: "active",
  createdAt: new Date().toISOString(),
};
```

Create a temporary test button on the Students page:

```text
បញ្ចូលសិស្សសាកល្បង
```

Button behavior:
1. Check Firestore first by `studentCode: "1"`.
2. If it does not exist, create this one student in Firestore.
3. Show success toast:
   `បញ្ចូលព័ត៌មានសិស្សបានជោគជ័យ`
4. If it already exists, show:
   `សិស្សនេះមានក្នុងប្រព័ន្ធរួចហើយ`
5. Refresh the student table automatically after success.
6. Display the real student data in the Student table.

Use Firestore server timestamp where appropriate. Keep all Firestore operations inside `student.service.ts`, not directly inside React page components.