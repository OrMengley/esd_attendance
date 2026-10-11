Update the existing **School Holidays & Closures** list UI and status logic in the ESD Attendance Vite React + TypeScript + Firestore project.

Do not change the existing Holiday CRUD, school closure logic, attendance locking, or expected end-date calculation. This task only clarifies the Holiday list UI and separates manual status from date-based period.

## Problem to fix

Currently, Holiday `Active / Inactive` appears to be determined by whether the date is past or upcoming. This is incorrect and confusing.

Example:

- Khmer New Year: `14/04/2026–16/04/2026`, already past, shown as `Active`
- A holiday on `08/10/2026`, upcoming, shown as `Inactive`

`Active / Inactive` must never be derived from date range.

## Required logic

### 1. Status = manual enforcement status

Keep the existing Firestore field:

```ts
status: "active" | "inactive"
```

Meaning:

- `Active` = This holiday is enabled and must affect school closure, attendance lock, and expected end date calculation when its date arrives.
- `Inactive` = This holiday has been cancelled/disabled and must not affect attendance or schedules.

Rules:

- New holidays must default to `active`.
- A future holiday should normally be `Active`.
- A past holiday may remain `Active` to preserve historical configuration.
- Only admin/super_admin can manually change Active/Inactive.
- Do not automatically change this field because a date becomes past or future.

### 2. Add a computed Period column

Add a new table column after date range and before Status:

```text
Period
```

This is computed automatically from Cambodia timezone:

```text
Asia/Phnom_Penh
```

Use the current Cambodia date and return:

```ts
type HolidayPeriod = "upcoming" | "today" | "past";
```

Rules:

- `Upcoming`: Cambodia today is before `startDate`
- `Today`: Cambodia today is between `startDate` and `endDate`, inclusive
- `Past`: Cambodia today is after `endDate`

Create a reusable helper, for example:

```text
src/lib/holiday-period.ts
```

```ts
getHolidayPeriod(startDate, endDate): HolidayPeriod
```

Use date-only `YYYY-MM-DD` comparison to prevent timezone shifts.

## UI requirements

Update the `/holidays` table desktop and mobile cards.

Desktop table order:

1. No.
2. Holiday Name
3. Start Date
4. End Date
5. Total Days
6. Period
7. Status
8. Notes
9. Actions

### Period badges

Use visually different badges:

- `Upcoming` — blue / indigo with calendar or clock icon
- `Today` — orange / amber with alert/calendar icon
- `Past` — gray / muted with history/check icon

### Status badges

Keep clearly separate from Period:

- `Active` — green badge with check icon
- `Inactive` — gray/red muted badge with disabled icon

Examples:

| Holiday | Period | Status |
|---|---|---|
| Holiday on tomorrow | Upcoming | Active |
| Holiday happening today | Today | Active |
| Khmer New Year from past date | Past | Active |
| Cancelled future holiday | Upcoming | Inactive |

## Filters and summary cards

Keep existing status filters, but ensure they filter manual `active/inactive` status only.

Add an optional Period filter:

```text
All Periods
Upcoming
Today
Past
```

Update or add summary cards:

- Total Holidays
- Active Holidays
- Inactive Holidays
- Upcoming Holidays

Do not count a Holiday as inactive merely because it is past.

## Form clarification

On Create Holiday and Edit Holiday pages:

- Keep the `Status` field visible.
- Add short helper text:

```text
Active holidays will close the school and block attendance when their dates arrive.
Inactive holidays are disabled and will not affect classroom schedules or attendance.
```

- Default new holiday status to `active`.

## i18n

Add complete Khmer and English translations for:

```text
holidays.period
holidays.upcoming
holidays.today
holidays.past
holidays.statusHelp
holidays.activeHolidayHelp
holidays.inactiveHolidayHelp
holidays.allPeriods
holidays.upcomingHolidays
```

Do not display raw i18n keys.

## Verification

Verify with Cambodia date `2026-10-07`:

1. Holiday `2026-10-08`:
   - Period = `Upcoming`
   - Status = `Active` by default

2. Holiday `2026-10-07`:
   - Period = `Today`
   - Status remains independently editable

3. Holiday `2026-04-14` to `2026-04-16`:
   - Period = `Past`
   - Status can remain `Active`

4. A future holiday manually set to `Inactive`:
   - Period remains `Upcoming`
   - It does not block attendance or affect expected end date calculation.

Run:

```bash
npm run build
```

Fix all TypeScript and i18n errors before completion.