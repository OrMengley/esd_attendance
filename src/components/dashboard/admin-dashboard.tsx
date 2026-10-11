import React from "react";
import { useTranslation } from "react-i18next";
import { DashboardData } from "@/models/dashboard.model";
import { DashboardSummaryCard } from "./dashboard-summary-card";
import { AdminAttendanceOverview } from "./admin-attendance-overview";
import { AdminClassAttendanceList } from "./admin-class-attendance-list";
import { AdminAttentionPanel } from "./admin-attention-panel";
import { DashboardQuickActions } from "./dashboard-quick-actions";
import { DashboardEmptyState } from "./dashboard-empty-state";
import {
  GraduationCap,
  School,
  Users,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface AdminDashboardProps {
  data: DashboardData;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ data }) => {
  const { t, i18n } = useTranslation();
  const isKm = i18n.language === "km";

  const khmerDigits = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];
  const toKhmerNum = (n: number | string) =>
    String(n).replace(/[0-9]/g, (w) => khmerDigits[parseInt(w, 10)]);

  if (!data.admin) return null;

  const { metrics, attendanceOverview, classes, attentionItems } = data.admin;

  return (
    <div className="space-y-6">
      {/* Holiday Alert if today is school holiday */}
      {data.isHoliday && (
        <DashboardEmptyState
          type="holiday"
          customTitle={
            isKm && data.holidayNameKm
              ? `${t("dashboard.holidayEmptyTitle", { defaultValue: "School Closed Today" })}: ${data.holidayNameKm}`
              : data.holidayNameEn
              ? `${t("dashboard.holidayEmptyTitle", { defaultValue: "School Closed Today" })}: ${data.holidayNameEn}`
              : undefined
          }
        />
      )}

      {/* TOP SUMMARY CARDS (6 items) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Active Students */}
        <DashboardSummaryCard
          title={t("dashboard.activeStudents", { defaultValue: "Active Students" })}
          value={isKm ? toKhmerNum(metrics.activeStudentsCount) : metrics.activeStudentsCount}
          icon={<GraduationCap className="h-5 w-5" />}
          theme="primary"
          to="/students"
        />

        {/* 2. Active Classes */}
        <DashboardSummaryCard
          title={t("dashboard.activeClasses", { defaultValue: "Active Classes" })}
          value={isKm ? toKhmerNum(metrics.activeClassesCount) : metrics.activeClassesCount}
          icon={<School className="h-5 w-5" />}
          theme="indigo"
          to="/classes"
        />

        {/* 3. Active Teachers */}
        <DashboardSummaryCard
          title={t("dashboard.activeTeachers", { defaultValue: "Active Teachers" })}
          value={isKm ? toKhmerNum(metrics.activeTeachersCount) : metrics.activeTeachersCount}
          icon={<Users className="h-5 w-5" />}
          theme="blue"
          to="/users"
        />

        {/* 4. Today's Scheduled Classes */}
        <DashboardSummaryCard
          title={t("dashboard.todayScheduledClasses", { defaultValue: "Scheduled Today" })}
          value={
            isKm
              ? toKhmerNum(metrics.todayScheduledClassesCount)
              : metrics.todayScheduledClassesCount
          }
          icon={<CalendarCheck className="h-5 w-5" />}
          theme="amber"
          to={`/daily-attendance-summary?date=${data.selectedDate}`}
        />

        {/* 5. Attendance Recorded */}
        <DashboardSummaryCard
          title={t("dashboard.attendanceRecorded", { defaultValue: "Completed" })}
          value={
            isKm
              ? toKhmerNum(metrics.attendanceRecordedCount)
              : metrics.attendanceRecordedCount
          }
          icon={<CheckCircle2 className="h-5 w-5" />}
          theme="emerald"
          to={`/daily-attendance-summary?date=${data.selectedDate}`}
        />

        {/* 6. Requires Attention */}
        <DashboardSummaryCard
          title={t("dashboard.requiresAttention", { defaultValue: "Attention" })}
          value={
            isKm
              ? toKhmerNum(metrics.requiresAttentionCount)
              : metrics.requiresAttentionCount
          }
          icon={<AlertTriangle className="h-5 w-5" />}
          theme={metrics.requiresAttentionCount > 0 ? "rose" : "emerald"}
        />
      </div>

      {/* TODAY'S ATTENDANCE OVERVIEW */}
      <AdminAttendanceOverview
        overview={attendanceOverview}
        selectedDate={data.selectedDate}
      />

      {/* TWO-COLUMN LAYOUT: Class Attendance List & Attention Required Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AdminClassAttendanceList
            classes={classes}
            selectedDate={data.selectedDate}
          />
        </div>
        <div className="lg:col-span-1">
          <AdminAttentionPanel items={attentionItems} />
        </div>
      </div>

      {/* ADMIN QUICK ACTIONS */}
      <DashboardQuickActions />
    </div>
  );
};
