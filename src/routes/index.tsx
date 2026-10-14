import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "./protected-route";
import { LoginPage } from "@/pages/login/login-page";
import { DashboardPage } from "@/pages/dashboard/dashboard-page";
import { StudentsListPage } from "@/pages/students/students-list-page";
import { StudentFormPage } from "@/pages/students/student-form-page";
import { StudentDetailPage } from "@/pages/students/student-detail-page";
import { PackagesPage } from "@/pages/packages/packages-page";
import { ClassesListPage } from "@/pages/classes/classes-list-page";
import { ClassroomFormPage } from "@/pages/classes/classroom-form-page";
import { ClassroomDetailPage } from "@/pages/classes/classroom-detail-page";
import { AttendancePage } from "@/pages/attendance/attendance-page";
import { AttendanceReportsPage } from "@/pages/attendance-reports/attendance-reports-page";
import { MonthlyReportPreviewPage } from "@/pages/attendance-reports/monthly-report-preview-page";
import { AttendanceHistoryPage } from "@/pages/attendance-history/attendance-history-page";
import { StudentAttendanceListPage } from "@/pages/student-attendance/student-attendance-list-page";
import { StudentAttendanceDetailPage } from "@/pages/student-attendance/student-attendance-detail-page";
import { StudentMonthlyReportPreviewPage } from "@/pages/student-attendance/student-monthly-report-preview-page";
import { HolidaysPage } from "@/pages/holidays/holidays-page";
import { HolidayFormPage } from "@/pages/holidays/holiday-form-page";
import { UsersPage } from "@/pages/users/users-page";
import { SettingsPage } from "@/pages/settings/settings-page";
import { DailyAttendanceSummaryPage } from "@/pages/daily-summary/daily-attendance-summary-page";
import { AbsenceLateReportPage } from "@/pages/reports/absence-late-report-page";
import { AbsenceLateReportPrintPage } from "@/pages/reports/absence-late-report-print-page";
import { ClassProgressReportPage } from "@/pages/reports/class-progress-report-page";
import { ClassProgressReportPrintPage } from "@/pages/reports/class-progress-report-print-page";
import { AttendanceCorrectionsPage } from "@/pages/attendance/attendance-corrections-page";
import { AttendanceAuditLogsPage } from "@/pages/attendance/attendance-audit-logs-page";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard" replace />,
          },
          // Shared pages for all roles (teacher sees scoped data)
          {
            path: "dashboard",
            element: <DashboardPage />,
          },
          {
            path: "attendance",
            element: <AttendancePage />,
          },
          {
            path: "attendance-history",
            element: <AttendanceHistoryPage />,
          },
          {
            path: "attendance-reports",
            element: <AttendanceReportsPage />,
          },
          {
            path: "student-attendance",
            element: <StudentAttendanceListPage />,
          },
          {
            path: "student-attendance/:studentId",
            element: <StudentAttendanceDetailPage />,
          },

          // Admin only pages
          {
            element: <ProtectedRoute allowedRoles={["super_admin", "admin"]} />,
            children: [
              {
                path: "students",
                element: <StudentsListPage />,
              },
              {
                path: "students/new",
                element: <StudentFormPage mode="create" />,
              },
              {
                path: "students/:id",
                element: <StudentDetailPage />,
              },
              {
                path: "students/:id/edit",
                element: <StudentFormPage mode="edit" />,
              },
              {
                path: "packages",
                element: <PackagesPage />,
              },
              {
                path: "subjects",
                element: <Navigate to="/packages" replace />,
              },
              {
                path: "classes",
                element: <ClassesListPage />,
              },
              {
                path: "classes/new",
                element: <ClassroomFormPage mode="create" />,
              },
              {
                path: "classes/:id/edit",
                element: <ClassroomFormPage mode="edit" />,
              },
              {
                path: "classes/:id",
                element: <ClassroomDetailPage />,
              },
              {
                path: "holidays",
                element: <HolidaysPage />,
              },
              {
                path: "holidays/new",
                element: <HolidayFormPage mode="create" />,
              },
              {
                path: "holidays/:id/edit",
                element: <HolidayFormPage mode="edit" />,
              },
              {
                path: "daily-attendance-summary",
                element: <DailyAttendanceSummaryPage />,
              },
              {
                path: "attendance-corrections",
                element: <AttendanceCorrectionsPage />,
              },
              {
                path: "attendance-audit-logs",
                element: <AttendanceAuditLogsPage />,
              },
              {
                path: "users",
                element: <UsersPage />,
              },
              {
                path: "settings",
                element: <SettingsPage />,
              },
              {
                path: "absence-late-report",
                element: <AbsenceLateReportPage />,
              },
              {
                path: "class-progress-report",
                element: <ClassProgressReportPage />,
              },
            ],
          },
        ],
      },
      // Standalone Full-Width Preview Pages (No normal sidebar/header)
      {
        path: "attendance-reports/monthly/:classroomId/:yearMonth",
        element: <MonthlyReportPreviewPage />,
      },
      {
        path: "student-attendance/:studentId/monthly/:yearMonth",
        element: <StudentMonthlyReportPreviewPage />,
      },
      {
        element: <ProtectedRoute allowedRoles={["super_admin", "admin"]} />,
        children: [
          {
            path: "absence-late-report/print",
            element: <AbsenceLateReportPrintPage />,
          },
          {
            path: "class-progress-report/print",
            element: <ClassProgressReportPrintPage />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);
