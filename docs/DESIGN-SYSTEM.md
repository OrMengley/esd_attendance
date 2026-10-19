# Design System Guidelines

## Existing Visual Direction
The current global CSS defines a school-brand palette with navy/blue as the primary color, gold as an accent, a light cool background, white surfaces, dark navy text, muted secondary text, and soft borders. Preserve and extend these tokens instead of introducing a competing palette.

Observed token names include:
- `--brand-navy`, `--brand-primary`, `--brand-primary-hover`, `--brand-blue-light`
- `--brand-gold`, `--brand-gold-light`, `--brand-gold-hover`
- `--brand-background`, `--brand-surface`, `--brand-text`, `--brand-muted`, `--brand-border`
- shadcn-style semantic HSL variables such as `--background`, `--foreground`, `--primary`, `--muted`, `--border`, and sidebar tokens

## Principles
1. Professional, calm, readable school-administration UI; avoid trendy effects that reduce task efficiency.
2. Prioritize common actions: find a student, record attendance, review exceptions, correct an entry, and produce a report.
3. Keep tables scannable with clear column labels, consistent alignment, useful filters, and predictable row actions.
4. Make forms understandable: group related fields, mark required fields, validate near the field, preserve entered values on recoverable errors, and confirm destructive actions.
5. Always design loading, empty, error, success, disabled, and permission-denied states.
6. Use status color consistently, but never rely on color alone to communicate meaning.
7. Ensure Khmer and English text both fit; test longer Khmer labels and mixed-language content.
8. Support keyboard navigation, visible focus, semantic labels, accessible dialogs, and reasonable contrast.
9. Keep desktop data density efficient while adapting tables and forms for smaller screens.
10. Reuse existing UI primitives and spacing/radius conventions. Add a new dependency only when necessary.

## Interaction Patterns
- Use confirmation for destructive operations and attendance corrections.
- Explain why an action is unavailable when that is useful and safe.
- Disable submit buttons during writes to prevent accidental duplicate submissions.
- Show success/error feedback through the existing toast approach where appropriate.
- Preserve filters and relevant context after editing or returning from details when feasible.
- For reports, verify both on-screen and print output.

## Review Checklist
- Does the page clearly communicate its purpose and primary action?
- Can a staff member complete the task with minimal navigation and ambiguity?
- Are the most important values visible without excessive decoration?
- Are long names, Khmer text, empty values, and narrow screens handled?
- Are keyboard, focus, label, contrast, and screen-reader basics respected?
- Are loading/error/empty/permission states present?
- Does the UI match the existing palette and component language?
