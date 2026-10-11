import React from "react";
import { useTranslation } from "react-i18next";
import { DashboardData } from "@/models/dashboard.model";
import { DashboardSummaryCard } from "./dashboard-summary-card";
import { TeacherNextClassCard } from "./teacher-next-class-card";
import { TeacherScheduleCard } from "./teacher-schedule-card";
import { DashboardEmptyState } from "./dashboard-empty-state";
import {
  School,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";

interface TeacherDashboardProps {
  data: DashboardData;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ data }) => {
  const { t, i18n } = useTranslation();
  const isKm = i18n.language === "km";

  const khmerDigits = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];
  const toKhmerNum = (n: number | string) =>
    String(n).replace(/[0-9]/g, (w) => khmerDigits[parseInt(w, 10)]);

  if (!data.teacher) return null;

  const { metrics, schedule, hasNoClassesScheduled, hasNoAssignedClassrooms } = data.teacher;

  return (
    <div className="space-y-6">
      {/* 1. Holiday Banner */}
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

      {/* 2. Top Summary Cards (5 items) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* My Active Classes */}
        <DashboardSummaryCard
          title={t("dashboard.myActiveClasses", { defaultValue: "My Active Classes" })}
          value={isKm ? toKhmerNum(metrics.myActiveClassesCount) : metrics.myActiveClassesCount}
          icon={<School className="h-5 w-5" />}
          theme="indigo"
          to="/classes"
        />

        {/* Today's Classes */}
        <DashboardSummaryCard
          title={t("dashboard.todayClasses", { defaultValue: "Today's Classes" })}
          value={isKm ? toKhmerNum(metrics.todayClassesCount) : metrics.todayClassesCount}
          icon={<CalendarCheck className="h-5 w-5" />}
          theme="primary"
        />

        {/* Attendance Completed Today */}
        <DashboardSummaryCard
          title={t("dashboard.attendanceCompletedToday", { defaultValue: "Completed Today" })}
          value={
            isKm
              ? toKhmerNum(metrics.attendanceCompletedCount)
              : metrics.attendanceCompletedCount
          }
          icon={<CheckCircle2 className="h-5 w-5" />}
          theme="emerald"
        />

        {/* Requires Attendance */}
        <DashboardSummaryCard
          title={t("dashboard.requiresAttendance", { defaultValue: "Requires Attendance" })}
          value={
            isKm
              ? toKhmerNum(metrics.requiresAttendanceCount)
              : metrics.requiresAttendanceCount
          }
          icon={<AlertTriangle className="h-5 w-5" />}
          theme={metrics.requiresAttendanceCount > 0 ? "rose" : "emerald"}
        />

        {/* Next Class */}
        <div className="col-span-2 sm:col-span-1">
          <DashboardSummaryCard
            title={t("dashboard.nextClass", { defaultValue: "Next Class" })}
            value={metrics.nextClass ? metrics.nextClass.code : "—"}
            subtitle={metrics.nextClassText}
            icon={<Clock className="h-5 w-5" />}
            theme="amber"
          />
        </div>
      </div>

      {/* 3. Next Class Highlight Card (if exists) */}
      {!data.isHoliday && metrics.nextClass && (
        <TeacherNextClassCard
          nextClass={metrics.nextClass}
          selectedDate={data.selectedDate}
        />
      )}

      {/* 4. Today's Teaching Schedule List */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-foreground font-khmer">
              {t("dashboard.todaySchedule", { defaultValue: "Today's Teaching Schedule" })}
            </h3>
            <p className="text-xs text-muted-foreground font-khmer">
              {t("dashboard.todayScheduleSubtitle", {
                defaultValue: "Your scheduled classes for today sorted chronologically",
              })}
            </p>
          </div>
        </div>

        {/* Schedule List or Empty States */}
        {hasNoAssignedClassrooms ? (
          <DashboardEmptyState type="no_assigned_classes" />
        ) : hasNoClassesScheduled && !data.isHoliday ? (
          <DashboardEmptyState type="no_classes_today" />
        ) : schedule.length > 0 ? (
          <div className="space-y-3">
            {schedule.map((item) => (
              <TeacherScheduleCard key={item.classroom.id} item={item} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};
