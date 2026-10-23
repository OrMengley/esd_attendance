# Task: Implement Complete Multi-Branch Isolation for ESD Attendance Enrollment Module

You are working on the existing ESD Attendance project built with React, TypeScript, Vite, and Firebase Firestore.

## Context

Multi-branch CRUD functionality has already been implemented for the rest of the system. However, the Enrollment module is incomplete.

Current issues identified:
- `Enrollment` in `enrollment.model.ts` does not contain `branchId`.
- `enrollment.service.ts` fetches enrollment documents without consistent branch filtering.
- New enrollments are saved without `branchId`.
- Some UI components pass only `user?.id` instead of the full authenticated User object.
- LocalStorage fallbacks may return enrollment data from every branch.
- Transfer, update, status-change, and delete operations do not consistently enforce branch authorization.
- Existing Firestore enrollment documents may not have `branchId`.

## Objective

Implement complete, consistent, and safe branch isolation across the entire Enrollment module without breaking existing attendance, enrollment, classroom, student, and transfer functionality.

### 1. Inspect the existing architecture first

Inspect these files and search the repository for all related call sites:

- `src/models/enrollment.model.ts`
- `src/services/enrollment.service.ts`
- `src/components/.../EnrollmentsTable.tsx`
- `EnrollStudentDialog.tsx`
- `EditEnrollmentDialog.tsx`
- `TransferClassDialog.tsx`
- The Enrollment page/container that loads enrollments
- Student, Classroom, Branch, and User models/services
- Authentication context and the existing Firestore security rules
- Any localStorage enrollment caches, mock enrollment data, and transfer-history UI

Use the real project paths; do not assume every file is located in the same directory.

Before making changes, understand the current `User` role definitions, `user.branchId`, the existing super-admin exception, and the current data-loading patterns.

### 2. Update the Enrollment model

Add `branchId` to the Enrollment model.

Existing Firestore documents may not contain this property, so support legacy records during migration. However, every new Enrollment creation or transfer must write a valid `branchId`.

Do not trust a `branchId` supplied arbitrarily by the UI. Derive it from the validated Classroom record.

Update mock data and TypeScript types as needed without inventing branch assignments.

### 3. Enforce a consistent access policy

Use the existing authentication and role system.

- `super_admin`: may access enrollments across all branches.
- Other authorized users: may access only enrollments belonging to their assigned branch.
- A user without valid authentication or a required `branchId` must not gain unrestricted access.
- Documents with missing or unresolved `branchId` must not automatically become visible to ordinary branch administrators.
- Reject unauthorized access to enrollment records instead of silently returning or modifying them.

Validate both the Enrollment branch and the associated Classroom branch. Validate the Student/Classroom branch relationship according to the existing application data model, and do not allow a missing `student.branchId` to bypass authorization.

Use consistent errors such as `UNAUTHORIZED_BRANCH`, `AUTH_REQUIRED`, or existing project conventions.

### 4. Fix all Enrollment service methods

Review and correct every related function, including:

- `getEnrollments`
- `getEnrollmentsByStudentId`
- `getActiveEnrollmentByStudentId`
- `getEnrollmentsByClassroomId`
- `getActiveEnrollmentsByClassroomId`
- `getEnrollmentById`
- `createEnrollment`
- `createEnrollments`
- `updateEnrollment`
- `setEnrollmentStatus`
- `transferEnrollment`
- `getTransfersByStudentId`
- `deleteEnrollment`

Use the authenticated User context consistently. If a function needs the current user, update its signature and every caller rather than relying on an optional User object that callers never supply.

For Firestore queries, apply `branchId` filtering for branch-scoped users. Super-admin queries may return records across branches.

Specific write requirements:

**Create enrollment**
- Validate the authenticated user's authorization.
- Load and validate the selected Classroom.
- Require a valid Classroom `branchId`.
- Set the new Enrollment `branchId` from that Classroom.
- Validate student/classroom branch consistency.
- Preserve existing active-enrollment, classroom-status, and capacity checks.

**Bulk create**
- Validate every item individually.
- Do not validate only the first Classroom and assume all other items belong to the same branch.
- Set `branchId` correctly for every new document.
- Preserve existing batch write limits and business rules.

**Update enrollment**
- Verify that the existing enrollment belongs to the current user's authorized branch.
- Validate any target Classroom.
- Prevent ordinary edits from changing `branchId` arbitrarily.
- Keep an Enrollment's branch consistent with its Classroom.
- Preserve existing attendance-history safeguards and capacity checks.
- Do not silently permit an unauthorized cross-branch Classroom change; use the established transfer workflow where appropriate.

**Status changes**
- Pass the actual User context through `setEnrollmentStatus` and `updateEnrollment`.
- Prevent a branch administrator from changing another branch's Enrollment status.

**Delete**
- Require User context and verify branch authorization before deletion.

**Lookup by ID**
- Verify authorization before returning a record.
- Do not expose an unauthorized Enrollment through a direct document lookup.

### 5. Correct transfer and transfer-history isolation

Inspect the existing transfer behavior before changing it.

- Validate the source Enrollment and source Classroom.
- Validate the target Classroom.
- Enforce authorization for both source and target branches.
- Ensure newly created target Enrollments store the target Classroom's `branchId`.
- Preserve the source Enrollment and transfer audit history.
- If transfer records can span branches, record `sourceBranchId` and `targetBranchId` so access and audit history can be scoped consistently.
- Update transfer-history queries so branch administrators cannot retrieve unrelated transfer records.
- Preserve existing rules for who may transfer between branches; cross-branch transfers must not become available to ordinary branch administrators accidentally.

Critical: Inspect the transaction error handling and offline/local fallback in `transferEnrollment`. An `UNAUTHORIZED_BRANCH` or validation error must be rethrown. It must never trigger a fallback path that performs the same unauthorized operation without checking permissions.

### 6. Fix every UI caller

Search the entire repository for calls to the Enrollment service methods.

Update every relevant caller, including:

- `EnrollStudentDialog`
- `EditEnrollmentDialog`
- `EnrollmentsTable`
- `TransferClassDialog`
- The Enrollment page/container
- Any student detail, classroom detail, dashboard, or reporting page that loads Enrollment data

Pass the correct authenticated User context to methods that require it.

Ensure branch administrators only receive their own branch's students, classrooms, enrollments, and transfer options through the existing page-loading patterns.

Do not rely solely on UI filtering: the service layer must enforce the same access policy.

### 7. Correct LocalStorage and offline fallbacks

Audit `esd_local_enrollments` and `esd_local_enrollment_transfers`.

- Ensure every read path enforces the same branch-access policy as Firestore.
- Prevent a successful Firestore query returning zero documents from falling back to a global cache containing all branches.
- If caching data per branch is appropriate, use branch-specific cache keys and avoid mixing data after a user or role change.
- Do not expose legacy documents with missing `branchId` to ordinary branch users.
- Do not let offline fallbacks bypass authorization, validation, capacity checks, or transfer rules.
- Preserve the existing offline behavior where safe and compatible with the application's current design.

### 8. Migrate existing enrollment documents safely

Create a safe, idempotent migration using the project's existing migration or service conventions.

For each existing Enrollment without `branchId`:
1. Resolve its Classroom using `classroomId`.
2. Read the Classroom's authoritative `branchId`.
3. Backfill the Enrollment with that value when it is valid.
4. Record unresolved documents for review when the Classroom or branch cannot be resolved.
5. Do not guess or arbitrarily assign branches to unresolved records.

Apply the same principle to existing transfer-history data where necessary.

Use Firestore batches within valid write limits. Do not run destructive automatic migration on every normal page load. Provide a clear way for an authorized super-admin to run or review the migration using the project's existing conventions.

Also handle old LocalStorage cache entries safely.

### 9. Review Firestore security rules

Inspect the actual Firebase authentication model and existing Firestore security rules.

Determine whether branch restrictions are enforced only by client-side services or also by Firestore security rules.

If the existing authentication and rules support trusted branch authorization, enforce the corresponding restrictions there without breaking unrelated collections or application roles.

Do not assume that `user.branchId` stored only in client-controlled state is a secure authorization boundary. Do not overwrite the entire rules file blindly. If proper server-enforced branch authorization requires changes to the authentication architecture, clearly explain that limitation instead of claiming that client filtering alone provides complete security.

### 10. Validation and completion report

After implementation:

- Run TypeScript checks and the project's existing build/test commands where available.
- Fix errors introduced by these changes.
- Confirm every affected service call site has been updated.
- Check that no fallback, transfer handler, or status/delete operation bypasses branch checks.
- Preserve existing enrollment, attendance, capacity, and history features.

Report the files changed, migration steps required, any remaining data-integrity issues, and the actual build/test results.

Do not report tests as passed unless they were actually run successfully.

Do not make unrelated UI redesigns or modify unrelated modules.