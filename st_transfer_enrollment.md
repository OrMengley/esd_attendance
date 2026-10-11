Implement Student Class Transfer feature for the ESD Attendance system.
Existing system already has:
- Students
- Enrollments
- Study Packages
- Classes/Batch
- Teacher assignment
- Student Detail page
- Enrollment History
- Firebase Firestore
- Khmer/English i18n
Do not change or delete existing Student, Enrollment, Class, Package, or Attendance data.
Purpose
When a student wants to change study time/class, admin must transfer the student to another class without losing old enrollment or old attendance history.
Example:
    Old class: Weekday 07:00–08:00
    New class: Weekday 16:00–17:00
The old enrollment must remain in history. Do NOT edit the old enrollment classroomId directly.
Enrollment model update
Update src/models/enrollment.model.ts.
Add transferred status and transfer fields:
    export type EnrollmentStatus =
  | "active"
  | "completed"
  | "paused"
  | "cancelled"
  | "transferred";

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

  transferredAt?: string;
  transferredToEnrollmentId?: string;
  transferredFromEnrollmentId?: string;

  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}
Transfer history collection
Create Firestore collection:
    enrollment_transfers

Create model:
    src/models/enrollment-transfer.model.ts

    export interface EnrollmentTransfer {
  id: string;
  studentId: string;

  sourceEnrollmentId: string;
  sourceClassroomId: string;

  targetEnrollmentId: string;
  targetClassroomId: string;

  packageId: string;
  effectiveDate: string;
  reason: string;

  transferredBy: string;
  transferredAt: string;
}

Transfer service
Update/create:

    src/services/enrollment.service.ts

Add:

    transferEnrollment({
  sourceEnrollmentId,
  targetClassroomId,
  effectiveDate,
  reason,
  currentUserId
})
Use Firestore runTransaction() so all changes succeed or all changes roll back.
Transaction steps:
1. Load source enrollment.
2. Confirm source enrollment status is exactly active.
3. Load source class and target class.
4. Confirm target class:
   - exists
   - status is active
   - is not the same class as source
   - has the same packageId as source enrollment
   - has remaining capacity if capacity is configured
5. Confirm the student has no other active enrollment except the source enrollment.
6. Create a new target Enrollment:
   - new Firestore document ID
   - same studentId
   - target classroomId
   - target class packageId
   - startDate: effectiveDate
   - expectedEndDate: targetClass.expectedEndDate
   - status: "active"
   - transferredFromEnrollmentId: sourceEnrollmentId
   - audit fields from current user
7. Update source enrollment:
   - status: "transferred"
   - actualEndDate: effectiveDate
   - transferredAt
   - transferredToEnrollmentId: newTargetEnrollmentId
   - updatedBy, updatedAt
8. Create enrollment_transfers audit document.
9. Do NOT edit or delete any existing attendance records.
Transfer UI
On Student Detail page, in Current Active Enrollment section, add button:
ផ្ទេរថ្នាក់រៀន
Transfer Class

Only show this button when there is an active enrollment.
Create component:

src/components/students/transfer-class-dialog.tsx

Use a shadcn Dialog or right-side Sheet.
Fields:

Student: readonly
Current Class: readonly
Current Schedule: readonly
Study Package: readonly
Target Class: required searchable selector
Target Teacher: readonly after class selection
Target Schedule: readonly after class selection
Target Expected End Date: readonly after class selection
Effective Transfer Date: required date picker
Transfer Reason: required textarea

Target class selector:
- Load only active classes.
- Show only classes with the same package as current enrollment.
- Exclude current class.
- Search by class name or class code.
- Show teacher, schedule, expected end date, capacity.
- Do not use a large normal dropdown. Use searchable Class Selection Dialog/Command list.
- Show clear empty state if no compatible class exists.
Validation:
- Target class required.
- Transfer reason required.
- Effective transfer date required.
- Effective date cannot be before source enrollment start date.
- Default effective date to the next calendar day.
- Block transfer if target class is full.
- Block transfer if package is different.
- Block transfer if source enrollment is not active.
Student Detail and Enrollment History
After successful transfer:
- Refresh Student Detail page automatically.
- Current Active Enrollment must show the new class.
- Enrollment History must show:
  - Old enrollment status: Transferred
  - New enrollment status: Active
- Add a Transfer History section showing:
  - From Class
  - To Class
  - Effective Date
  - Reason
  - Transferred By
  - Transferred At
For old enrollment detail, show link/reference to new enrollment.
For new enrollment detail, show link/reference to old enrollment.
Attendance rule
Attendance records must stay connected to the class where they were originally recorded.

Attendance before effective date → source class
Attendance from effective date onward → target class

Do not move, duplicate, edit, or delete old attendance records.
i18n
Add all required Khmer and English translation keys.
Khmer examples:
transfer.title: "ផ្ទេរថ្នាក់រៀន"
transfer.currentClass: "ថ្នាក់រៀនបច្ចុប្បន្ន"
transfer.targetClass: "ថ្នាក់រៀនថ្មី"
transfer.effectiveDate: "ថ្ងៃចាប់ផ្តើមផ្ទេរ"
transfer.reason: "មូលហេតុនៃការផ្ទេរ"
transfer.success: "ផ្ទេរថ្នាក់រៀនបានជោគជ័យ"
transfer.classFull: "ថ្នាក់រៀនថ្មីពេញហើយ"
transfer.noCompatibleClass: "មិនមានថ្នាក់រៀនសមស្របសម្រាប់ផ្ទេរទេ"
transfer.samePackageOnly: "អាចផ្ទេរបានតែទៅថ្នាក់ដែលមានកញ្ចប់សិក្សាដូចគ្នាប៉ុណ្ណោះ"


Files
Create/update:

    src/models/enrollment.model.ts
src/models/enrollment-transfer.model.ts
src/services/enrollment.service.ts
src/components/students/transfer-class-dialog.tsx
src/components/students/transfer-history-section.tsx
src/pages/students/student-detail-page.tsx
src/i18n/locales/km.json
src/i18n/locales/en.json

Run npm run build, fix all TypeScript, Firestore, i18n, and UI errors, then verify this full flow in browser:

Student Detail
→ Click Transfer Class
→ Select compatible target class
→ Enter effective date and reason
→ Confirm transfer
→ Old enrollment becomes Transferred
→ New enrollment becomes Active
→ Transfer History displays correctly

