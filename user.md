Implement complete User CRUD using Firebase Firestore collection `users`.

Firebase is already configured using `.env`. Reuse the existing Firebase config. Do NOT use Firebase Authentication.

## Files structure

Create or update these separate files:

```text
src/
  models/
    role.model.ts
    user.model.ts
  services/
    user.service.ts
  pages/
    users/
      users-page.tsx
      user-dialog.tsx
      user-delete-dialog.tsx
  components/
    users/
      users-table.tsx
      user-role-badge.tsx
      user-status-badge.tsx
```

Do not put all logic into one file.

## Roles and permissions

Use roles:

```ts
export type UserRole = "super_admin" | "admin" | "teacher";
```

Permission rules:

| Current user role | Can view users | Can create | Can edit | Can delete |
|---|---:|---:|---:|---:|
| `super_admin` | All users | `admin`, `teacher` | All users except own role change | `admin`, `teacher` |
| `admin` | Only teacher users | `teacher` only | `teacher` only | `teacher` only |
| `teacher` | No Users page | No | No | No |

Important:
- Never allow creating another `super_admin` from UI.
- Never allow deleting `super_admin`.
- Never allow a user to delete their own account.
- `admin` must never see or manage `super_admin` or other `admin` accounts.
- Hide the User Accounts sidebar menu for `teacher`.

## User model

`src/models/user.model.ts`

```ts
import type { UserRole } from "./role.model";

export type UserStatus = "active" | "inactive";

export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
  email?: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  assignedClassroomIds: string[];
  status: UserStatus;
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}
```

## Firestore structure

Collection:

```text
users/{userId}
```

Use Firestore auto-generated document ID and save it back as field `id`.

Example document:

```ts
{
  id: "firestore-document-id",
  name: "គ្រូ សុភា",
  username: "teacher_sophea",
  password: "123456",
  email: "",
  phone: "012345678",
  role: "teacher",
  avatarUrl: "",
  assignedClassroomIds: [],
  status: "active",
  lastLogin: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: currentUser.id
}
```

## Firestore service

Create `src/services/user.service.ts`.

Keep every Firestore query/write operation in this service, not in React components.

Required functions:

```ts
getUsers()
getUsersByRole(role)
getUserById(id)
getUserByUsername(username)
createUser(data, currentUser)
updateUser(id, data, currentUser)
deleteUser(id)
```

Rules:
- Before create, check whether `username` already exists.
- Username must be unique and case-insensitive.
- Before updating username, check duplicate username excluding current user ID.
- Return clear errors for duplicate username.
- Use `serverTimestamp()` for Firestore timestamps if existing project style supports it. Otherwise keep ISO string style consistently.
- Do not expose Firebase configuration values in the UI.

## Users page UI

Create a polished responsive Users page using shadcn/ui.

Page features:
- Page title
- Search by name, username, phone, or email
- Role filter
- Status filter
- “Add User” button
- Loading skeleton
- Empty state
- Error state
- Pagination if list is large
- Automatically refresh table after create, edit, delete, or status change

Table columns:

```text
Avatar
Name
Username
Email
Phone
Role
Assigned Classes
Status
Last Login
Actions
```

- Show `-` for empty optional `email`, `phone`, `lastLogin`, or assigned classes.
- Use role/status badges.
- For `teacher` role, assigned classes should display as readable class names, not IDs.
- Use a dropdown action menu: Edit, Activate/Deactivate, Delete.

## Create / Edit User dialog

Use shadcn Dialog, Form, Input, Select, and validation.

Fields:
- Name: required
- Username: required, minimum 3 characters, no spaces
- Password:
  - Required when creating
  - Optional when editing
  - If left empty on edit, retain old password
  - Include show/hide password button
- Email: optional, validate only if user entered it
- Phone: optional
- Role:
  - `super_admin` can select `admin` or `teacher`
  - `admin` can select only `teacher`
  - Never show `super_admin` as create option
- Assigned Classes:
  - Show only if selected role is `teacher`
  - Use multi-select from Firestore `classrooms` collection
- Status: active/inactive

Validation messages and toast messages must use i18n translation keys, not hardcoded text.

Example Khmer translations:

```text
users.title: "គណនីអ្នកប្រើប្រាស់"
users.add: "បន្ថែមអ្នកប្រើប្រាស់"
users.edit: "កែប្រែអ្នកប្រើប្រាស់"
users.usernameExists: "ឈ្មោះអ្នកប្រើប្រាស់នេះមានក្នុងប្រព័ន្ធរួចហើយ"
users.created: "បង្កើតគណនីអ្នកប្រើប្រាស់បានជោគជ័យ"
users.updated: "កែប្រែគណនីអ្នកប្រើប្រាស់បានជោគជ័យ"
users.deleted: "លុបគណនីអ្នកប្រើប្រាស់បានជោគជ័យ"
users.deleteConfirm: "តើអ្នកពិតជាចង់លុបគណនីនេះមែនទេ?"
users.cannotDeleteSelf: "មិនអាចលុបគណនីរបស់ខ្លួនឯងបានទេ"
```

Also add complete English translations in `en.json`.

## Delete behavior

Use a confirmation dialog.

Before deleting:
- Block deletion of `super_admin`.
- Block self-delete.
- If the user is a teacher assigned to classrooms, do not hard delete them.
- Instead set their status to `inactive` and show:
  - Khmer: `គណនីគ្រូនេះមានថ្នាក់កំពុងទទួលបន្ទុក ដូច្នេះបានបិទគណនីជំនួសវិញ`
  - English: `This teacher is assigned to classes, so the account was deactivated instead.`

For a teacher with no assigned classrooms, allow permanent deletion from Firestore.

## Integration requirements

- Use `useAuth()` / current logged-in user from existing auth context.
- Use i18n `t()` for every visible UI string.
- Show Users sidebar menu only for `super_admin` and `admin`.
- Redirect `teacher` from `/users` to `/dashboard`.
- Run TypeScript checks and ensure no lint/build errors.
- Do not change unrelated student, classroom, attendance, Firebase, or Cloudinary code.