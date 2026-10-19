# Security Review Notes — Verify Before Changing

This is a list of areas to inspect, not a claim that a vulnerability has been confirmed.

## Confirmed High-Priority Finding in Supplied Source

**The current user-authentication implementation compares passwords as plaintext and stores user objects in browser storage.** This is directly visible in `src/services/auth.service.ts`: login reads user documents from the Firestore `users` collection and compares `userData.password !== password`; the local-account fallback does the same; and `setCurrentUser()` serializes the full user object to `localStorage`. `src/services/user.service.ts` also writes `userData.password` into Firestore user documents. Because the `User` object includes `password`, the full user record may be copied into the `esd_current_user` localStorage entry after login.

Treat this as a high-priority security issue. Do not silently patch authentication in a routine feature task: it may require a planned migration, user password reset/rehash strategy, Firebase Authentication or a trusted server-side authentication design, removal of password fields from returned/stored user objects, review of Firestore rules, and secure session handling. Do not expose, copy, or log any real passwords while investigating. Ask the project owner to approve a dedicated security remediation plan.

## Other Items Observed in the Supplied Source
- `src/firebase/config.ts` includes fallback Firebase web configuration values. Firebase web configuration is commonly included in client applications, but access must be protected by appropriate API-key restrictions and Firebase Security Rules. Do not treat the config as a service-account secret, and do not weaken rules to solve a UI bug.
- `src/contexts/auth-context.tsx` obtains current user state from `authService`; the current user object is stored through `authService.setCurrentUser()`. Verify session persistence and role/data enforcement as part of the remediation plan.
- Route guards are client-side. Confirm Firestore Security Rules independently enforce role- and record-level permissions.

## Review Checklist
- Authentication: trusted identity source, password handling, session lifecycle, logout, and account disable behavior.
- Authorization: role permissions enforced in Firestore rules and any trusted backend, not only in React routes.
- Data minimization: users can read only the student, attendance, and staff data needed for their role.
- Writes: validate allowed fields, actor identity, correction reason, and immutable audit data.
- Configuration: no private keys/service account JSON in frontend bundles; restrict web API keys appropriately.
- Operations: backups, recovery, rules/index deployment review, and audit log retention.
- Privacy: avoid real student details in console logs, fixtures, screenshots, or test output.

Any confirmed issue should be described with evidence, impact, reproduction, and a proposed fix before making high-risk data/auth changes.
