Fix the Student Detail page audit information display.

Current problem:
The Student Detail page displays raw Firestore user IDs for:

```text
createdBy
updatedBy
```

Do not display raw IDs to users.

## Required behavior

Keep `createdBy` and `updatedBy` as user IDs in Firestore. They are correct for relationships and audit integrity.

On the Student Detail page, resolve those IDs from Firestore collection `users` and display:

```text
User full name
@username
```

Example:

```text
Created by
លោក មេងលី
@or_mengley

Updated by
អ្នកគ្រប់គ្រង
@admin_esd
```

Do not show the raw ID in normal UI.

## Implementation

Create reusable helper/service function in:

```text
src/services/user.service.ts
```

```ts
getUserById(id: string): Promise<User | null>
```

Optionally create:

```ts
getUsersByIds(ids: string[]): Promise<Record<string, User>>
```

On Student Detail page:
- Load Student record.
- Read `student.createdBy` and `student.updatedBy`.
- Fetch the related users from `users` collection.
- Display user name and username in the Audit Information section.
- Use Avatar if available.
- Show loading skeleton while audit users are loading.

Fallback rules:
- If `createdBy` or `updatedBy` is empty, show `-`.
- If user record no longer exists, show:
  - Khmer: `អ្នកប្រើប្រាស់មិនមានក្នុងប្រព័ន្ធ`
  - English: `User no longer exists`
- Do not expose the raw ID as fallback.

Create reusable component:

```text
src/components/shared/audit-user-display.tsx
```

Props:

```ts
interface AuditUserDisplayProps {
  userId?: string;
  label: string;
}
```

Component display:
- Avatar
- User full name
- `@username`
- Optional role badge
- Clean compact layout for Student Detail audit section

Use this reusable component for:
- Student Detail page now
- Classroom Detail page later
- Study Package Detail page later
- Enrollment Detail page later

## Audit timestamps

Also format:
- `createdAt`
- `updatedAt`

Show readable localized date and time based on current selected language.

Example:
- Khmer: `៥ តុលា ២០២៦, ១:៤០ រសៀល`
- English: `October 5, 2026, 1:40 PM`

Do not show raw ISO timestamp in UI.

## Enrollment

Do not remove or change the existing Add Enrollment feature.

Keep:
- `Enroll in Class` button on Student Detail page
- Enrollment Dialog / Class Selection Dialog
- Current Active Enrollment section
- Enrollment History section

Only improve audit display. Do not change Student, Enrollment, Class, Package, Authentication, or Firestore business logic.

Add required Khmer and English i18n keys, run `npm run build`, and fix all errors.