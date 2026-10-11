# 🎓 ប្រព័ន្ធគ្រប់គ្រងវត្តមានសិស្ស - ESD Attendance System

> Modern, responsive, and bilingual School Attendance Management Web Application built with **Vite**, **React 19**, **TypeScript**, **Tailwind CSS**, and **Firebase Firestore**.

---

## 📋 មាតិកា / Table of Contents

- [🌟 លក្ខណៈពិសេសចម្បង / Key Features](#-លក្ខណៈពិសេសចម្បង--key-features)
- [🛠️ បច្ចេកវិទ្យាប្រើប្រាស់ / Technology Stack](#️-បច្ចេកវិទ្យាប្រើប្រាស់--technology-stack)
- [📂 រចនាសម្ព័ន្ធគម្រោង / Project Structure](#-រចនាសម្ព័ន្ធគម្រោង--project-structure)
- [👥 តួនាទី និងសិទ្ធិប្រើប្រាស់ / Roles & Permissions (RBAC)](#-តួនាទី-និងសិទ្ធិប្រើប្រាស់--roles--permissions-rbac)
- [🗄️ ទិន្នន័យ Firestore / Firestore Collections & Models](#️-ទិន្នន័យ-firestore--firestore-collections--models)
- [🚀 ការដំឡើង និងដំណើរការ / Getting Started](#-ការដំឡើង-និងដំណើរការ--getting-started)
- [⚙️ អថេរប្រព័ន្ធ / Environment Variables](#️-អថេរប្រព័ន្ធ--environment-variables)
- [📦 ការបង្កើត Production Build / Build & Deployment](#-ការបង្កើត-production-build--build--deployment)

---

## 🌟 លក្ខណៈពិសេសចម្បង / Key Features

### 1. 🔐 ការផ្ទៀងផ្ទាត់ និងការគ្រប់គ្រងអ្នកប្រើប្រាស់ (Authentication & User Management)
- **Role-Based Access Control (RBAC)** គាំទ្រ 3 តួនាទី: `super_admin`, `admin`, និង `teacher`។
- ការពារផ្លូវ Route ដោយស្វ័យប្រវត្តិតាមរយៈ `ProtectedRoute`។
- Quick Demo Login credentials សម្រាប់ងាយស្រួលសាកល្បងប្រព័ន្ធ។
- ការគ្រប់គ្រងគណនី (បង្កើត កែប្រែ បិទដំណើរការ និងលុប) ជាមួយការការពារសិទ្ធិតឹងរ៉ឹង។

### 2. 📊 ផ្ទាំងគ្រប់គ្រងទូទៅ (Dashboard & Analytics)
- បង្ហាញទិន្នន័យសរុប (សិស្សសរុប, គ្រូបង្រៀន, វត្តមានថ្ងៃនេះ, អវត្តមាន)។
- តារាងវត្តមានប្រចាំថ្ងៃ និងស្ថានភាពវត្តមានទាន់ហេតុការណ៍។
- ទិន្នន័យត្រូវបានច្រោះដោយស្វ័យប្រវត្តិតាមសិទ្ធិរបស់គ្រូនីមួយៗ (Scoped Data for Teachers)។

### 3. 👨‍🎓 ការគ្រប់គ្រងទិន្នន័យសិស្ស (Student Management - `/students`)
- ផ្ទាំងបញ្ចូលទិន្នន័យសិស្ស 3 ដំណាក់កាល (Tabs):
  - **ទូទៅ (General)**: អត្តលេខ, ឈ្មោះខ្មែរ-ឡាតាំង, ភេទ, ថ្ងៃខែឆ្នាំកំណើត, ថ្នាក់រៀន, ស្ថានភាពសំបុត្រកំណើត។
  - **អាសយដ្ឋាន (Address)**: ភូមិ, ឃុំ/សង្កាត់, ស្រុក/ខណ្ឌ, ខេត្ត/រាជធានី។
  - **គ្រួសារ (Family)**: ឈ្មោះ និងមុខរបរឪពុក-ម្តាយ, លេខទូរស័ព្ទអាណាព្យាបាល។
- ស្វែងរក (Search) និងច្រោះតាមថ្នាក់រៀន (Filter by Class)។
- ផ្ទាំងមើលព័ត៌មានលម្អិតសិស្ស (Student Profile View Modal)។

### 4. 📚 ការគ្រប់គ្រងមុខវិជ្ជា និងថ្នាក់រៀន (Subjects & Classrooms)
- **មុខវិជ្ជា (`/subjects`)**: បង្កើត កែប្រែ លុប កូដមុខវិជ្ជា ឈ្មោះ និងចំនួនម៉ោងបង្រៀន។
- **ថ្នាក់រៀន (`/classes`)**: ចាត់តាំងគ្រូទទួលបន្ទុក, មុខវិជ្ជា, កាលវិភាគ, និងចំនួនសិស្ស។

### 5. 📝 ការកត់ត្រាវត្តមានប្រចាំថ្ងៃ (Daily Attendance - `/attendance`)
- ជ្រើសរើសកាលបរិច្ឆេទ និងថ្នាក់រៀន។
- កំណត់ស្ថានភាពវត្តមាន: **វត្តមាន (Present)**, **អវត្តមាន (Absent)**, **យឺត (Late)**, និង **ច្បាប់ (Permission)**។
- ប៊ូតុងរហ័ស **"វត្តមានទាំងអស់" (Mark All Present)** ដើម្បីបង្កើនល្បឿននៃការស្រង់វត្តមាន។
- កត់ត្រាកំណត់សម្គាល់បន្ថែម (Remarks) និងរក្សាទុកទៅកាន់ Firestore ភ្លាមៗ។

### 6. 📜 ប្រវត្តិវត្តមាន និងរបាយការណ៍ (Attendance History - `/attendance-history`)
- ពិនិត្យមើលប្រវត្តិនៃការស្រង់វត្តមានកន្លងមកតាមកាលបរិច្ឆេទ និងថ្នាក់រៀន។
- ស្ថិតិសរុបនៃអត្រាវត្តមាន និងការទាញទិន្នន័យមកវិភាគ។

### 7. 🌐 ប្រព័ន្ធពហុភាសា (Bilingual i18n - Khmer & English)
- ប្តូរភាសាបានភ្លាមៗរវាង **ភាសាខ្មែរ** និង **English**។
- រចនាឡើងជាមួយពុម្ពអក្សរខ្មែរ `Kantumruy Pro` យ៉ាងរលូន និងស្រស់ស្អាត។

---

## 🛠️ បច្ចេកវិទ្យាប្រើប្រាស់ / Technology Stack

| ផ្នែក (Area) | បច្ចេកវិទ្យា (Technology) | កំណែ (Version) |
|---|---|---|
| **Core Framework** | [React](https://react.dev/) | `^19.0.0` |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | `~5.7.2` |
| **Bundler & Dev Server** | [Vite](https://vitejs.dev/) | `^6.2.0` |
| **Styling & CSS** | [Tailwind CSS](https://tailwindcss.com/) + PostCSS | `^3.4.17` |
| **UI Component Library** | [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/) | Latest |
| **Routing** | [React Router DOM](https://reactrouter.com/) | `^7.3.0` |
| **Database & Backend** | [Firebase Firestore](https://firebase.google.com/) | `^11.4.0` |
| **Icons** | [Lucide React](https://lucide.dev/) | `^0.477.0` |
| **Localization (i18n)** | [i18next](https://www.i18next.com/) + [react-i18next](https://react.i18next.com/) | `^26.4.2` |
| **Notifications** | [Sonner](https://sonner.emilkowal.ski/) Toast | `^2.0.1` |
| **Forms & Validation** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | `^7.89.0` / `^3.25.76` |

---

## 📂 រចនាសម្ព័ន្ធគម្រោង / Project Structure

```text
esd_attendance/
├── public/                      # Static assets
├── src/
│   ├── components/
│   │   ├── classes/             # Classroom dialog & components
│   │   ├── layout/              # AppLayout, AppHeader, AppSidebar, PageHeader
│   │   ├── shared/              # LanguageSwitcher, StatusBadge, ConfirmDialog, StatCard
│   │   ├── students/            # StudentDialog (3 tabs), StudentViewDialog
│   │   ├── subjects/            # SubjectDialog
│   │   ├── ui/                  # Standard shadcn/ui components (Vite React compatible)
│   │   └── users/               # UsersTable, UserRoleBadge, UserStatusBadge
│   ├── contexts/
│   │   └── auth-context.tsx     # Authentication state & login/logout logic
│   ├── data/
│   │   └── mock-data.ts         # Initial fallback & seed data
│   ├── firebase/
│   │   └── firebase.ts          # Firebase app & Firestore initialization
│   ├── i18n/
│   │   ├── index.ts             # i18n configuration
│   │   └── locales/
│   │       ├── en.json          # English translations
│   │       └── km.json          # Khmer translations
│   ├── lib/
│   │   └── utils.ts             # cn utility, date/time formatters for Khmer
│   ├── models/                  # TypeScript Data Models
│   │   ├── attendance.model.ts
│   │   ├── classroom.model.ts
│   │   ├── role.model.ts
│   │   ├── student.model.ts
│   │   ├── subject.model.ts
│   │   └── user.model.ts
│   ├── pages/                   # Application Pages & Views
│   │   ├── attendance/          # Daily attendance marking
│   │   ├── attendance-history/  # Historical records & logs
│   │   ├── classes/             # Classes management
│   │   ├── dashboard/           # Overview metrics & quick tables
│   │   ├── login/               # Authentication page
│   │   ├── settings/            # System & school settings
│   │   ├── students/            # Student list & operations
│   │   ├── subjects/            # Subjects management
│   │   └── users/               # User management & dialogs
│   ├── routes/
│   │   ├── index.tsx            # Route definitions
│   │   └── protected-route.tsx  # Auth & role guard
│   ├── App.tsx                  # Root application component & Toaster
│   ├── index.css                # Tailwind base, CSS variables & typography
│   └── main.tsx                 # App entry point
├── components.json              # shadcn/ui configuration for Vite
├── package.json                 # Project dependencies & scripts
├── tailwind.config.js           # Tailwind theme, colors & font setup
├── tsconfig.json                # TypeScript root configuration
├── tsconfig.app.json            # Vite React TypeScript compiler settings
└── vite.config.ts               # Vite build configuration & path aliases (@/*)
```

---

## 👥 តួនាទី និងសិទ្ធិប្រើប្រាស់ / Roles & Permissions (RBAC)

| សិទ្ធិ / មុខងារ (Feature) | `super_admin` | `admin` | `teacher` |
|---|:---:|:---:|:---:|
| **មើល Dashboard** | គ្រប់ទិន្នន័យ | គ្រប់ទិន្នន័យ | តែថ្នាក់ដែលខ្លួនទទួលបន្ទុក |
| **គ្រប់គ្រងសិស្ស (`/students`)** | ✅ ពេញលេញ | ✅ ពេញលេញ | ❌ គ្មានសិទ្ធិ |
| **គ្រប់គ្រងមុខវិជ្ជា (`/subjects`)** | ✅ ពេញលេញ | ✅ ពេញលេញ | ❌ គ្មានសិទ្ធិ |
| **គ្រប់គ្រងថ្នាក់រៀន (`/classes`)** | ✅ ពេញលេញ | ✅ ពេញលេញ | ❌ គ្មានសិទ្ធិ |
| **ស្រង់វត្តមាន (`/attendance`)** | ✅ គ្រប់ថ្នាក់ | ✅ គ្រប់ថ្នាក់ | ✅ តែថ្នាក់ដែលខ្លួនទទួលបន្ទុក |
| **ប្រវត្តិវត្តមាន (`/attendance-history`)** | ✅ គ្រប់ថ្នាក់ | ✅ គ្រប់ថ្នាក់ | ✅ តែថ្នាក់ដែលខ្លួនទទួលបន្ទុក |
| **គ្រប់គ្រងគណនី (`/users`)** | ✅ បង្កើត/កែ/លុប `admin` និង `teacher` | ✅ បង្កើត/កែ/លុប តែ `teacher` | ❌ គ្មានសិទ្ធិ (Menu លាក់) |
| **ការកំណត់ប្រព័ន្ធ (`/settings`)** | ✅ ពេញលេញ | ✅ ពេញលេញ | ❌ គ្មានសិទ្ធិ |

> ⚠️ **ច្បាប់សុវត្ថិភាពសំខាន់**:
> - មិនអនុញ្ញាតឱ្យបង្កើតគណនី `super_admin` ថ្មីតាមរយៈ UI ឡើយ។
> - មិនអនុញ្ញាតឱ្យលុបគណនី `super_admin` ឬលុបគណនីដែលកំពុង Login ឡើយ។

---

## 🗄️ ទិន្នន័យ Firestore / Firestore Collections & Models

### 1. `users` Collection
```typescript
interface User {
  id: string;
  name: string;
  username: string;
  password: string;
  email?: string;
  phone?: string;
  role: "super_admin" | "admin" | "teacher";
  avatarUrl?: string;
  assignedClassroomIds: string[];
  status: "active" | "inactive";
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
}
```

### 2. `students` Collection
```typescript
interface Student {
  id: string;
  studentCode: string;
  nameKh: string;
  nameEn: string;
  gender: "male" | "female";
  dateOfBirth: string;
  birthCertificateStatus: string;
  phone: string;
  classroomId: string;
  address: {
    village: string;
    commune: string;
    district: string;
    province: string;
  };
  fatherName: string;
  fatherOccupation: string;
  motherName: string;
  motherOccupation: string;
  guardianPhone: string;
  status: "active" | "inactive";
  avatarUrl?: string;
  createdAt: string;
}
```

### 3. `classrooms` Collection
```typescript
interface Classroom {
  id: string;
  code: string;
  name: string;
  subjectId: string;
  assignedTeacherId: string;
  schedule: string;
  totalStudents: number;
  status: "active" | "inactive";
}
```

### 4. `subjects` Collection
```typescript
interface Subject {
  id: string;
  code: string;
  name: string;
  totalHours: number;
  description?: string;
}
```

### 5. `attendance` Collection
```typescript
interface Attendance {
  id: string;
  studentId: string;
  classroomId: string;
  date: string; // YYYY-MM-DD
  status: "present" | "absent" | "late" | "permission";
  remark?: string;
  recordedBy: string;
  recordedAt: string;
}
```

---

## 🚀 ការដំឡើង និងដំណើរការ / Getting Started

### តម្រូវការជាមុន (Prerequisites)
- [Node.js](https://nodejs.org/) (កំណែ `18.x` ឬ `20.x` ឬខ្ពស់ជាងនេះ)
- កម្មវិធីគ្រប់គ្រងកញ្ចប់ `npm` ឬ `pnpm` ឬ `yarn`

### ជំហានដំឡើង (Installation Steps)

1. **ក្លូនគម្រោង (Clone or open directory)**:
   ```bash
   cd /path/to/esd_attendance
   ```

2. **ដំឡើង Dependencies**:
   ```bash
   npm install
   ```

3. **កំណត់ Environment Variables**:
   បង្កើត ឬកែប្រែឯកសារ `.env` នៅ Root ថត (សូមមើលផ្នែកខាងក្រោម)។

4. **ដំណើរការ Development Server**:
   ```bash
   npm run dev
   ```
   កម្មវិធីនឹងដំណើរការនៅលើ `http://localhost:5173` ឬ `http://localhost:5174`។

---

## ⚙️ អថេរប្រព័ន្ធ / Environment Variables

បង្កើតឯកសារ `.env` នៅក្នុង Root Directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Cloudinary Configuration (Optional for photo uploads)
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

---

## 📦 ការបង្កើត Production Build / Build & Deployment

### 1. ដំណើរការ Type-check និងបង្កើត Build Bundle
```bash
npm run build
```

ដំណើរការនេះនឹងធ្វើការផ្ទៀងផ្ទាត់ TypeScript Type ទាំងអស់តាមរយៈ `tsc -b` និងបង្កើតឯកសារ Optimized Static Files ក្នុងថត `dist/`។

### 2. Preview Production Build ជា Local
```bash
npm run preview
```

### 3. Deploy ទៅកាន់ Hosting
អ្នកអាច Deploy ថត `dist/` ទៅកាន់ Static Web Host ណាមួយបានយ៉ាងងាយស្រួលដូចជា:
- **Firebase Hosting**: `firebase deploy`
- **Vercel**: `vercel deploy`
- **Netlify**: `netlify deploy`
- **Cloudflare Pages** / **GitHub Pages**

---

## 📄 អាជ្ញាប័ណ្ណ / License

គម្រោងនេះត្រូវបានបង្កើតឡើងសម្រាប់គោលបំណងគ្រប់គ្រងវត្តមានសាលារៀន (School Attendance Management)។ រក្សាសិទ្ធិគ្រប់យ៉ាង © 2026 ESD Attendance System។
