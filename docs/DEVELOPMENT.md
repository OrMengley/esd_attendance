# Development Workflow

## Before Editing
1. Read `AGENTS.md` and this document.
2. Inspect the current branch/status and relevant files.
3. Read the relevant service, model, helper, route, and locale entries before changing a feature.
4. Confirm the task's expected behavior and role permissions.
5. For multi-file work, write a plan under `docs/plans/` before implementation.

## Local Commands
The supplied archive did not include `package.json`, lockfiles, or configuration, so command names are intentionally not guessed. Inspect the full project root and use its actual package manager and scripts. Record verified commands here when available:

- Install dependencies: _verify from package manager/lockfile_
- Start development server: _verify in package.json_
- Lint: _verify in package.json_
- Type check: _verify in package.json or tsconfig_
- Tests: _verify in package.json_
- Production build: _verify in package.json_

Do not install a new package manager or test framework just to follow this template.

## Implementation Loop
1. Plan the smallest coherent change.
2. Implement in the existing architecture.
3. Update types, translations, tests, and documentation as needed.
4. Run targeted tests/checks, then relevant broader checks.
5. Inspect the diff for unrelated changes and regressions.
6. Report what changed and exactly which checks ran.

## Firestore Safety
- Check the service and data model before changing persisted fields.
- Consider query shape, indexes, duplicate submissions, concurrent writes, and read/write cost.
- Avoid destructive migrations without a backup/rollback plan and explicit approval.
- Verify Firestore rules in the full repository/deployment configuration; client-side checks are not sufficient.
- Never put service-account credentials or private keys in frontend code.

## Attendance Safety
- Keep date-only values consistent with the app's `YYYY-MM-DD` convention.
- Inspect school holiday, schedule, time-lock, and correction validation helpers before changing attendance behavior.
- Preserve original/correction metadata and audit history.
- Test boundary dates, duplicate records, missing enrollment/classroom relationships, role scope, and correction reasons where relevant.

## Translation Workflow
- Add/update the corresponding keys in both `en.json` and `km.json`.
- Keep key names and nesting aligned.
- Do not translate internal identifiers or persisted enum values unless the app already does so through display labels.
- Search for the key in both locale files and inspect UI fallback behavior.

## Finish Report
Summarize: implementation, files changed, data/schema impact, security/authorization considerations, commands actually run, results, and remaining risks.
