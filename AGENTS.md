# AI Agent Instructions — School Management & Attendance App

## Purpose
Maintain the existing React application for school administration, student records, class/enrollment management, daily attendance, attendance corrections, audit history, and reports. Prefer small, verifiable changes over broad rewrites.

## Verified Repository Context
- Frontend entry points: `src/main.tsx`, `src/App.tsx`.
- Routing: React Router configuration in `src/routes/index.tsx`; protected routing in `src/routes/protected-route.tsx`.
- Authentication state: `src/contexts/auth-context.tsx`; auth implementation: `src/services/auth.service.ts`.
- Data access is organized under `src/services/` and Firebase initialization is in `src/firebase/config.ts`.
- Domain models are in `src/models/`; calculations, validators, date/holiday helpers, and report helpers are in `src/lib/`.
- UI components are in `src/components/`, grouped by feature, with shared primitives in `src/components/ui/`.
- Page-level screens are in `src/pages/`.
- Localization uses `react-i18next` with `src/i18n/locales/en.json` and `src/i18n/locales/km.json`. The current default/fallback language is Khmer (`km`).
- Styling uses Tailwind CSS and CSS variables defined in `src/index.css`; icons use `lucide-react`; toast notifications use `sonner`.
- The supplied source archive did not include `package.json`, lockfile, TypeScript/Vite/Tailwind configuration, Firebase rules, or deployment configuration. Inspect the full repository before assuming scripts, dependency versions, alias configuration, or security rules.

## Non-Negotiable Rules
1. Inspect relevant existing files and their callers before editing. Follow established patterns unless the task explicitly includes a refactor.
2. Do not replace Firebase Cloud Firestore or introduce another database without explicit approval.
3. Do not replace the current stack or perform large-scale rewrites to solve a local problem.
4. Keep domain rules in existing services and `src/lib/` helpers when appropriate; avoid duplicating attendance/report calculations in UI components.
5. Preserve role-aware routing (`super_admin`, `admin`, `teacher`) and teacher-scoped data behavior. Never rely on UI hiding alone for authorization; verify server/Firebase security enforcement and document gaps.
6. Preserve auditability for attendance changes. Do not bypass correction validation, confirmation flows, audit log creation, or existing time-lock rules.
7. Preserve student/enrollment/classroom relationships and history. Do not silently delete or rewrite historical attendance or enrollment records.
8. Keep English and Khmer translations aligned. Add/update both locale files for user-visible strings; avoid hard-coded interface text where translation keys are the established pattern.
9. Reuse existing UI primitives from `src/components/ui/` and feature components before adding dependencies or new design systems.
10. Do not add dependencies without explaining why and checking whether existing packages can solve the need.
11. Never put credentials, private keys, passwords, tokens, or service-account JSON in source control. Treat student data and user records as sensitive. Do not print real personal data in logs or tests.
12. Do not claim Firebase client configuration is a secret by itself; instead verify API-key restrictions, Firestore Security Rules, authentication, and authorization. Never weaken security rules to make a feature work.
13. Avoid changing unrelated files. Do not reformat the whole repository for a focused task.
14. Do not assume the project builds or tests successfully until the relevant commands have actually been run.

## Implementation Standards
- TypeScript: preserve strict typing and use existing domain types from `src/models/`; avoid `any` and unsafe casts unless justified.
- React: use function components and existing hooks/context patterns. Keep effects purposeful and prevent stale data, duplicate requests, and state updates after unmount where relevant.
- Data access: follow existing `src/services/` conventions. Handle loading, empty, success, and error states. Validate inputs before writes and consider Firestore query/index implications.
- Domain logic: prefer pure functions in `src/lib/` for calculations and validators so they can be tested independently.
- Dates: use the project's existing date and school-calendar helpers. Be explicit about local school dates, `YYYY-MM-DD` fields, and timezone boundaries; avoid casually converting date-only strings through UTC.
- Forms: reuse established components and validation patterns; show clear validation feedback and protect destructive actions with confirmation.
- Accessibility: use semantic controls, associated labels, keyboard-friendly dialogs, visible focus states, and meaningful accessible names.
- Responsive design: support dense desktop administration workflows and usable mobile layouts; do not sacrifice table readability or core workflows for decoration.
- Localization: keep translation key structure consistent and ensure equivalent keys exist in English and Khmer.
- Reports/exports: verify calculations, date ranges, totals, print layouts, and spreadsheet encoding; do not change business definitions without approval.

## Required Workflow
1. Read this file and the relevant documents under `docs/`.
2. Inspect the affected implementation, models, services, UI, route guards, translation keys, and tests.
3. State assumptions and a concise plan for non-trivial tasks. For multi-file work, use `.ai/commands/plan.md` first.
4. Implement the smallest coherent change.
5. Add/update tests where test infrastructure exists. If it is missing, identify the best validation approach and do not invent a test command.
6. Run available targeted checks and relevant build/type checks. If configuration is absent, state that checks could not be run.
7. Review the diff for unrelated edits, security/authorization regressions, translation gaps, and broken routes.
8. Report changed files, behavior, checks actually run and their outcomes, and known risks/open questions.

## Definition of Done
- Requirements and role access are satisfied.
- Loading, empty, error, and success states are considered.
- English and Khmer strings are updated when needed.
- Attendance history/audit behavior and date handling remain correct where applicable.
- Relevant checks are run, or missing tooling is clearly reported.
- No unrelated files or secrets are added.
