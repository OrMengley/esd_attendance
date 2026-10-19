# Architecture Notes

This document records the observed structure from the supplied `src/` archive. It is a map, not a mandate to refactor the code to match an idealized architecture.

## Current Shape
The application is organized by technical layer and feature:

- Route-level screens live in `src/pages/`.
- Reusable feature UI lives in `src/components/<feature>/`.
- Generic UI primitives live in `src/components/ui/`.
- Data operations live in `src/services/`.
- Domain types live in `src/models/`.
- Reusable calculations and validation helpers live in `src/lib/`.
- Auth state is exposed through `src/contexts/auth-context.tsx`.
- Firebase is initialized in `src/firebase/config.ts`.
- Route definitions and guards live in `src/routes/`.

## Dependency Direction (Preferred)
1. Pages compose feature components and coordinate page-level state.
2. Feature components use typed models, hooks, and service functions.
3. Services own Firestore reads/writes and map persisted data to domain models.
4. Pure domain calculations/validation belong in `src/lib/` where appropriate.
5. Shared UI components remain generic and should not contain school-specific business rules.

Follow existing patterns when they differ; improve them incrementally rather than moving many files for cosmetic consistency.

## Routing and Authorization
- Router: `src/routes/index.tsx`.
- Guard: `src/routes/protected-route.tsx`.
- Current role union: `super_admin | admin | teacher`.
- Auth context: `src/contexts/auth-context.tsx`.

Client-side route guards improve navigation and user experience but are not a security boundary by themselves. Verify Firestore rules and service-level authorization for protected data. Do not assume hiding a page prevents direct reads/writes.

## Persistence
`src/firebase/config.ts` initializes the Firebase app and exports the Firestore database handle. Feature services are grouped in `src/services/`. Keep Firestore queries, document writes, and persistence mapping in those service modules rather than scattering direct database operations through components.

When editing persistence:
- Check document identifiers and relationship fields before changing schema.
- Consider existing data compatibility and migration needs.
- Consider query indexes, pagination, query limits, and read costs.
- Never delete audit/history records as a shortcut.
- Do not change deployed rules or indexes without explicit scope and validation.

## Domain Areas
Models and helpers indicate important domain concepts including students, enrollments, classrooms, study packages/course modules, attendance, school holidays, users/roles, attendance correction audit logs, dashboards, attendance reports, absence/late reports, and class progress reports.

Attendance includes date-only values (`YYYY-MM-DD`) and correction metadata. Preserve these semantics. Use `src/lib/attendance-time-lock.ts`, holiday helpers, correction validators, and report calculators where relevant instead of implementing parallel rules.

## Localization and Design
- Localization setup: `src/i18n/index.ts`.
- Locale files: `src/i18n/locales/en.json`, `src/i18n/locales/km.json`.
- Theme variables and Tailwind base styles: `src/index.css`.
- Reuse existing primitives from `src/components/ui/`.
- Keep user-facing strings translated in both supported locales.

## Unknowns
The source archive does not include project configuration, tests, Firestore rules/indexes, or deployment files. Do not assume these are absent from the full repository; inspect them there.
