Refactor and repair the UI foundation of this project.

Project framework is:

```text
Vite + React + TypeScript
```

Important:
This is NOT a Next.js project.

A previous UI implementation was incorrectly copied from a Next.js + shadcn/ui project. Remove that incompatible copied UI setup and rebuild the UI component foundation correctly for Vite React.

## Preserve these existing parts

Do NOT delete or rewrite:

- Firebase configuration and `.env` usage
- Cloudinary configuration
- Firestore services and data
- Models/types
- Authentication business logic
- i18n Khmer/English translation files and language switcher
- Pages, routes, CRUD logic, and existing business rules

Only refactor UI dependencies, UI components, CSS/theme setup, and imports that are incompatible with Vite React.

## Remove incompatible Next.js code

Find and remove/replace all Next.js-only imports and code, including:

```ts
next/link
next/image
next/font
next/navigation
next/headers
next-themes
"use server"
server actions
app router specific code
```

Replace:
- `next/link` → `react-router-dom` `Link` / `NavLink`
- `next/image` → normal HTML `<img />`
- `next/navigation` → `useNavigate`, `useLocation` from `react-router-dom`

Do not leave any `next/` imports in the project.

## Clean incompatible UI dependencies

Inspect `package.json`.

Remove only dependencies that exist solely because they were copied from the Next.js project and are not compatible/needed for this Vite React project.

Do NOT blindly delete all dependencies.

Keep required dependencies such as:
- react
- react-dom
- vite
- typescript
- tailwindcss
- firebase
- react-router-dom
- i18next
- react-i18next
- lucide-react
- zod
- react-hook-form

Then run a clean install:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Reinstall shadcn/ui correctly for Vite React

Initialize shadcn/ui specifically for this Vite React project.

Requirements:
- Use the current Vite React shadcn/ui setup.
- Use `components.json` configured for Vite.
- Configure the correct alias:

```text
@/* → ./src/*
```

- Ensure Tailwind CSS is configured correctly for Vite.
- Ensure `src/index.css` contains the correct Tailwind imports and Shadcn CSS variables.
- Use CSS variables for theme colors.
- Use the existing primary visual style only as a reference, not copied component source code.

Install/rebuild only required components for this project:

```text
button
input
label
textarea
card
dialog
alert-dialog
dropdown-menu
select
table
tabs
badge
avatar
sheet
tooltip
popover
calendar
form
skeleton
separator
scroll-area
command
```

## Rebuild UI components for Vite React

Delete and regenerate only copied/broken UI component files under:

```text
src/components/ui/
```

All regenerated components must be compatible with:
- Vite React
- React TypeScript
- Tailwind CSS
- Radix UI
- shadcn/ui for Vite

Do not copy component files from the previous Next.js project.

## Dialog and modal repair

Dialog, modal, dropdown, sheet, select, and popover must work correctly.

Verify:
- Dialog opens centered on screen.
- Overlay covers the entire viewport.
- Overlay and content use correct `z-index`.
- Clicking outside behaves correctly.
- Escape key closes dialog.
- Form inputs inside dialog are clickable.
- Dropdown menu and select appear above tables/cards.
- No modal is clipped by sidebar, table container, or parent `overflow-hidden`.
- No broken portal behavior.

Use the standard regenerated shadcn Vite `Dialog`, `Select`, `DropdownMenu`, `Sheet`, and `Popover` components.

## Visual design

Use Healthy Food POS only as a visual reference for:
- Clean sidebar layout
- Card spacing
- Border radius
- Neutral colors
- Table styling
- Button styling

Do NOT copy its Next.js source code, UI component folder, package configuration, global CSS, or layout implementation.

## Final verification

Run:

```bash
npm run build
```

Fix all TypeScript, import, Tailwind, and build errors.

Confirm:
- No `next/` imports remain.
- All pages still route correctly.
- Firebase and Firestore CRUD logic remains intact.
- Dialogs/modals work normally.
- The Vite React project runs with:

```bash
npm run dev
```