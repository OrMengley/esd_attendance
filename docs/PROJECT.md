# Project Overview

## Product
A school management and attendance web application. The provided source tree indicates a broad administration workflow rather than a minimal attendance-only tool.

## Observed Feature Areas
> Detailed documentation is available in [docs/FEATURES.md](file:///Users/kerker/Documents/reactProjects/esd_attendance/docs/FEATURES.md).

- Multi-branch campus management and global branch switcher
- Role-based dashboard views for administrators and teachers
- Student directory, detailed profiles, and batch Excel student import
- Classroom scheduling, capacity tracking, and quick student enrollment
- Centralized enrollments management with clerical error correction
- Study packages, course modules, and curriculum pacing
- Real-time daily attendance taking with session time-locking
- Daily attendance summary and status alerts
- Attendance corrections with mandatory reasons and immutable audit logs
- Monthly attendance matrix tables with printable views
- Student individual attendance profiles and monthly cards
- Absence/late warning reports and class progress reports with Excel export & print layouts
- School holiday calendar management and vacation auto-exclusions
- User administration with branch scoping and role permissions
- 100% Khmer and English bilingual interface localization


## Roles Observed in Source
`src/models/role.model.ts` defines `super_admin`, `admin`, and `teacher`. `src/routes/index.tsx` restricts several administration routes to `super_admin` and `admin`, while shared pages are available to authenticated users. Confirm actual permissions and data scoping in services and Firebase rules before changing access behavior.

## Technology Observed in Source
- React + TypeScript
- Vite-style environment variables (`import.meta.env`)
- React Router
- Firebase client SDK / Cloud Firestore
- Tailwind CSS with CSS-variable-based theme tokens
- `react-i18next` with English (`en`) and Khmer (`km`) JSON locale files
- `lucide-react` icons
- `sonner` toast notifications
- Local UI primitives under `src/components/ui/`, using a shadcn-style organization

Versions, scripts, package manager, test framework, deployment platform, and exact dependency list are not verified because the provided archive only contained `src/`.

## Main Code Areas
| Path | Responsibility |
|---|---|
| `src/App.tsx` | App providers, router provider, toast host |
| `src/main.tsx` | Browser entry point, global CSS and i18n initialization |
| `src/routes/` | Route tree and route protection |
| `src/contexts/auth-context.tsx` | Shared authentication state |
| `src/firebase/config.ts` | Firebase app and Firestore initialization |
| `src/services/` | Data access and application operations |
| `src/models/` | Domain interfaces and unions |
| `src/lib/` | Calculations, validators, calendar/date helpers, export helpers |
| `src/pages/` | Route-level screens |
| `src/components/` | Feature UI, shared UI, and layout |
| `src/i18n/locales/` | English and Khmer translations |
| `src/index.css` | Tailwind layers and design tokens |

## Confirmed Security Concern
The supplied `src/services/auth.service.ts` compares passwords as plaintext from Firestore user documents and from local fallback accounts. `src/services/user.service.ts` writes a `password` field to Firestore, and the current user object is serialized into browser `localStorage`. See `docs/SECURITY-REVIEW.md`. This should be treated as a high-priority issue requiring an explicitly approved remediation plan, not silently changed as part of unrelated feature work.

## Product Constraints
- Keep Firebase Cloud Firestore as the database unless the owner explicitly changes this decision.
- Preserve current features and historical records while making incremental changes.
- Maintain English and Khmer localization.
- Preserve role-aware access and teacher data scoping.
- Treat student records, attendance, user profiles, and audit logs as sensitive data.

## Open Questions to Verify in the Full Repository
- What are the exact install, dev, lint, typecheck, test, and build commands?
- What Firestore Security Rules and indexes are deployed?
- What deployment and backup/recovery processes exist?
- Which tests and CI checks already exist?
- What are the deployment and environment-management practices?
