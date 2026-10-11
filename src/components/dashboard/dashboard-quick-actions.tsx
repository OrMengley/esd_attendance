import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  UserPlus,
  PlusCircle,
  ClipboardCheck,
  FileBarChart2,
  CalendarPlus,
  ArrowRight,
} from "lucide-react";

export const DashboardQuickActions: React.FC = () => {
  const { t } = useTranslation();

  const actions = [
    {
      title: t("dashboard.actionAddStudent", { defaultValue: "Add Student" }),
      description: t("dashboard.actionAddStudentDesc", { defaultValue: "Register new student profile" }),
      icon: <UserPlus className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />,
      bg: "bg-blue-500/10",
      link: "/students/new",
    },
    {
      title: t("dashboard.actionCreateClass", { defaultValue: "Create Class" }),
      description: t("dashboard.actionCreateClassDesc", { defaultValue: "Set up study schedule & teacher" }),
      icon: <PlusCircle className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />,
      bg: "bg-emerald-500/10",
      link: "/classes/new",
    },
    {
      title: t("dashboard.actionDailyAttendance", { defaultValue: "Daily Attendance" }),
      description: t("dashboard.actionDailyAttendanceDesc", { defaultValue: "Mark or verify daily records" }),
      icon: <ClipboardCheck className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />,
      bg: "bg-amber-500/10",
      link: "/attendance",
    },
    {
      title: t("dashboard.actionReports", { defaultValue: "Attendance Reports" }),
      description: t("dashboard.actionReportsDesc", { defaultValue: "Monthly & absence analytics" }),
      icon: <FileBarChart2 className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />,
      bg: "bg-indigo-500/10",
      link: "/attendance-reports",
    },
    {
      title: t("dashboard.actionHoliday", { defaultValue: "School Holidays" }),
      description: t("dashboard.actionHolidayDesc", { defaultValue: "Manage public school closures" }),
      icon: <CalendarPlus className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400" />,
      bg: "bg-rose-500/10",
      link: "/holidays",
    },
  ];

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-2xs space-y-3.5">
      <h3 className="text-sm font-bold text-foreground font-khmer">
        {t("dashboard.quickActionsTitle", { defaultValue: "Quick Actions" })}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {actions.map((act) => (
          <Link
            key={act.link}
            to={act.link}
            className="group flex flex-col justify-between p-3.5 rounded-xl border bg-muted/20 hover:bg-muted/40 hover:border-primary/40 transition-all shadow-2xs"
          >
            <div className="flex items-start gap-2.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${act.bg}`}
              >
                {act.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground font-khmer group-hover:text-primary transition-colors truncate">
                  {act.title}
                </p>
                <p className="text-[10px] text-muted-foreground font-khmer line-clamp-1 mt-0.5">
                  {act.description}
                </p>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-end text-[10px] text-muted-foreground group-hover:text-primary font-khmer gap-0.5">
              <span>{t("common.proceed", { defaultValue: "Open" })}</span>
              <ArrowRight className="h-2.5 w-2.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
