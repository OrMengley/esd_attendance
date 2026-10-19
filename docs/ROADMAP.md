# Roadmap and Change Management

This file is a place to record owner-approved priorities. The source archive reveals feature areas but does not establish business priorities, deadlines, or known bugs. Do not treat the suggested sequence below as an approved product roadmap.

## Suggested Maintenance Sequence
1. **Establish a verified baseline** — inspect full repository configuration, current build/typecheck/test status, Firebase rules, and deployment environment.
2. **Security and data integrity review** — verify authentication implementation, role enforcement, Firestore rules, and sensitive user/student data handling.
3. **Reliability** — add or improve tests around attendance calculations, correction validation, holiday/date boundaries, enrollment transfers, and report totals.
4. **Operational usability** — address owner-confirmed workflow friction in student management, attendance recording, and reports.
5. **Performance and accessibility** — profile actual slow queries/rendering and review keyboard/accessibility behavior before optimizing.

## Decision Log Template
For meaningful product/architecture decisions, record:
- Date
- Context/problem
- Options considered
- Decision and reason
- Impact / migration required
- Follow-up validation

## Task Backlog Template
- [ ] Task: _description_
- Priority: _owner-confirmed priority_
- User/role affected: _role_
- Acceptance criteria: _observable result_
- Risks/data impact: _notes_
- Validation: _tests/checks_
