Implement **Study Package Management** with **Course Modules CRUD** using Firebase Firestore.

This project uses:
- Vite + React + TypeScript
- Tailwind CSS
- shadcn/ui for Vite React
- Firebase Firestore
- React Router DOM
- i18n Khmer / English

Do not modify the existing Firebase config, auth logic, Student CRUD, Users CRUD, or UI foundation.

## Purpose

ESD currently has one computer study package. A package contains ordered course modules:

1. Basic Computer
2. Typing
3. Microsoft Word
4. Microsoft Excel
5. Microsoft PowerPoint
6. Additional modules later

A student will enroll in a Package through a Class/Batch later. Do NOT create enrollment or attendance features in this task.

Important:
- Package duration must NOT be stored as fixed 2 or 3 months.
- Duration depends on a future class schedule:
  - Monday–Friday class: normally around 2 months
  - Saturday–Sunday class: normally around 3 months
- Store `totalPlannedHours` in the package instead.

## Firestore collections

Create:

```text
study_packages
course_modules
```

## Models

Create separate model files:

```text
src/models/study-package.model.ts
src/models/course-module.model.ts
```

`study-package.model.ts`

```ts
export type PackageStatus = "active" | "inactive";

export interface StudyPackage {
  id: string;
  code: string;
  nameKh: string;
  nameEn?: string;
  totalPlannedHours: number;
  description?: string;
  status: PackageStatus;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}
```

`course-module.model.ts`

```ts
export type CourseModuleStatus = "active" | "inactive";

export interface CourseModule {
  id: string;
  packageId: string;
  code: string;
  nameKh: string;
  nameEn?: string;
  order: number;
  plannedHours?: number;
  description?: string;
  status: CourseModuleStatus;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}
```

## Services

Create separate Firestore service files:

```text
src/services/study-package.service.ts
src/services/course-module.service.ts
```

Required functions:

```ts
getStudyPackages()
getStudyPackageById(id)
createStudyPackage(data, currentUserId)
updateStudyPackage(id, data, currentUserId)
setStudyPackageStatus(id, status, currentUserId)

getCourseModulesByPackageId(packageId)
createCourseModule(data, currentUserId)
updateCourseModule(id, data, currentUserId)
deleteCourseModule(id)
reorderCourseModules(packageId, modules, currentUserId)
```

Rules:
- Use Firestore auto-generated document IDs and save the same value in field `id`.
- Package code must be unique.
- Module code must be unique inside the same package.
- Default new records to `active`.
- Use the current logged-in user ID for `createdBy` and `updatedBy`.
- Never hard-delete a Study Package. Only change it to `inactive`.
- Do not allow package status to become `inactive` if it is used by a future class/enrollment collection. For now, keep this check prepared but safe if those collections do not yet exist.

## Page and route

Create page route:

```text
/packages
```

Add sidebar menu item:
- Khmer: `កញ្ចប់សិក្សា`
- English: `Study Packages`

Permissions:
- `super_admin` and `admin`: full access
- `teacher`: no access and no sidebar menu item

## Package List UI

Build a clean responsive shadcn UI page.

Features:
- Page title and description
- “Add Package” button
- Search by package code, Khmer name, or English name
- Status filter: Active / Inactive
- Loading skeleton
- Empty state
- Firestore error state
- Table columns:

```text
Code
Package Name
Total Planned Hours
Modules Count
Status
Created Date
Actions
```

Actions dropdown:
- View modules
- Edit package
- Activate / Deactivate

Use i18n `t()` for every visible UI string.

## Add/Edit Package Dialog

Fields:
- Package Code: required, uppercase text input
- Khmer Name: required
- English Name: optional
- Total Planned Hours: required, number greater than 0
- Description: optional
- Status: active / inactive

Validation:
- Show an error if package code already exists.
- Do not permit negative or zero planned hours.
- Show Khmer and English validation/toast messages through i18n keys.

## Course Module management

When user clicks “View modules” on a package:
- Open a Dialog or dedicated detail page.
- Display selected package information at top.
- Show ordered module list/table.

Module table columns:

```text
Order
Code
Khmer Name
English Name
Planned Hours
Status
Actions
```

Module actions:
- Add Module
- Edit Module
- Delete Module
- Move Up
- Move Down

Module form fields:
- Code: required
- Khmer Name: required
- English Name: optional
- Planned Hours: optional positive number
- Description: optional
- Status: active / inactive

Rules:
- New module order should be the next available order number.
- Move Up/Move Down must update Firestore order values safely.
- When deleting a module, show a confirmation dialog.
- After delete, reorder remaining modules as `1, 2, 3...`.
- Total module planned hours may be different from package total planned hours. Show both values but do not block saving.

## Initial real data

After feature implementation, create this first package and modules in Firestore only once. Prevent duplicates by code.

Package:

```ts
{
  code: "ESD-COMPUTER-001",
  nameKh: "កញ្ចប់សិក្សាកុំព្យូទ័រ",
  nameEn: "Computer Study Package",
  totalPlannedHours: 40,
  description: "កញ្ចប់សិក្សាមូលដ្ឋានកុំព្យូទ័រ រួមមានការវាយអក្សរ និង Microsoft Office",
  status: "active"
}
```

Modules:

```text
1. BASIC-COMPUTER — មូលដ្ឋានកុំព្យូទ័រ — Basic Computer
2. TYPING — វាយអក្សរ — Typing
3. MS-WORD — Microsoft Word — Microsoft Word
4. MS-EXCEL — Microsoft Excel — Microsoft Excel
5. MS-POWERPOINT — Microsoft PowerPoint — Microsoft PowerPoint
```

Use placeholder planned hours only if required by the UI. Admin can edit them later.

## File organization

Use this structure:

```text
src/
  components/
    packages/
      package-table.tsx
      package-dialog.tsx
      package-status-badge.tsx
      module-list-dialog.tsx
      module-dialog.tsx
      module-delete-dialog.tsx
  models/
    study-package.model.ts
    course-module.model.ts
  pages/
    packages/
      packages-page.tsx
  services/
    study-package.service.ts
    course-module.service.ts
```

Finally:
- Ensure no Next.js imports exist.
- Ensure the page works in Vite React.
- Run `npm run build` and fix all TypeScript/build errors.