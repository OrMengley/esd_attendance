Update the visual theme of the existing ESD Attendance Vite React + TypeScript + Tailwind + Shadcn UI project to match the official school logo:

```text
Logo-Wat-Soriyaram-Training-Computer-School.png
```

The school brand is based on **Royal Blue + Gold**.

Do not change business logic, Firestore models, routes, permissions, attendance flow, i18n behavior, or existing functionality. This task is a visual theme refactor only.

## Brand color palette

Create reusable semantic design tokens in the existing global Tailwind/Shadcn theme CSS. Do not scatter hardcoded colors across components.

Use these colors:

```css
--brand-navy: #1E347B;
--brand-primary: #314B9C;
--brand-primary-hover: #263E89;
--brand-blue-light: #3D58AE;

--brand-gold: #F3B51B;
--brand-gold-light: #F9D978;
--brand-gold-hover: #D99A08;

--brand-background: #F7F9FC;
--brand-surface: #FFFFFF;
--brand-text: #16213D;
--brand-muted: #6B7894;
--brand-border: #E4E9F2;
```

Keep semantic status colors separate:

```text
Success = green
Warning = amber/orange
Destructive = red
Info = brand blue
```

Do not use the logo’s red/yellow gradient as a general UI background.

## Sidebar redesign

Update the app sidebar to follow the school identity:

- Main sidebar background: `#1E347B`
- Use the official school logo at the top.
- Keep logo visible, correctly sized, and not stretched.
- School name and “ESD Attendance” text should be white or soft white.
- Normal menu item text/icons: white with reduced opacity.
- Hover item: lighter blue background such as `#3D58AE`.
- Active menu item:
  - Background: gold `#F3B51B`
  - Text and icon: dark navy `#16213D`
  - Rounded corners consistent with current UI
  - Remove the existing purple active state completely.
- Logout should remain visually distinct but must still fit the sidebar design.
- User profile card at sidebar bottom:
  - Use darker/lighter navy surface
  - Keep avatar, name, and role readable
  - Do not use purple accents.

## Main interface theme

Apply the brand theme consistently to:

- Primary buttons: Royal Blue
- Primary button hover: Darker Royal Blue
- Focus rings: Brand Blue
- Links and active tabs: Brand Blue
- Header date/time pill: soft blue background/icon
- Cards: white background with subtle border/shadow
- Page background: `#F7F9FC`
- Main headings: `#16213D`
- Secondary text: muted blue-gray
- Table header background: soft blue-gray/white, not purple
- Search input focus state: brand blue
- Pagination active state: brand blue

Use gold only as an accent:

- Sidebar active item
- Small section icons
- Important brand highlights
- Optional subtle icon backgrounds

Do not make all buttons gold. Primary actions such as `Save`, `Add`, `Create`, and `Update` must remain Royal Blue for usability and visual balance.

## Components to update consistently

Review and update all shared UI/layout components:

```text
App sidebar
Top header
Buttons
Tabs
Cards
Tables
Dialogs
Dropdown menus
Inputs
Selects
Date pickers
Badges
Pagination
Empty states
Loading states
Toast notifications
```

Keep existing attendance status badge meanings unchanged:

```text
Present = green
Absent = red
Late = amber/orange
Permission = blue
```

Keep Holiday period/status badge colors semantically correct and do not force all badges into brand colors.

## Theme implementation requirements

- Use existing Shadcn UI and Tailwind architecture for Vite React.
- Do not import Next.js UI code or packages.
- Update shared theme tokens/classes first, then remove old purple classes from shared layout/components.
- Search the source code for old purple/violet/indigo theme classes and replace only those used as the old global brand color.
- Do not replace semantic colors such as error red, success green, or warning amber.
- Preserve dark text contrast and accessible color contrast ratios.
- Ensure the UI remains responsive on desktop and mobile.

## Logo usage

Use the provided official school logo in:

- Sidebar brand area
- Optional login page branding, if a login page already exists

Do not use the logo as a repeated background watermark or stretch it across page content.

## Verification

1. Confirm no purple active sidebar menu remains.
2. Confirm active sidebar item is Gold with Navy text/icon.
3. Confirm primary action buttons are Royal Blue.
4. Confirm sidebar is Royal Blue and readable.
5. Confirm existing attendance status colors still work correctly.
6. Check at least Dashboard, Students, Classes, Daily Attendance, Attendance History, Holidays, and User Accounts pages.
7. Verify Khmer and English UI still display correctly.
8. Run:

```bash
npm run build
```

Fix all TypeScript, Tailwind, and build errors before completion.