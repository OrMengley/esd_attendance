import React from "react";
import { useTranslation } from "react-i18next";
import { CalendarX, Palmtree, School, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardEmptyStateType =
  | "holiday"
  | "no_classes_today"
  | "no_assigned_classes"
  | "no_attention_needed";

interface DashboardEmptyStateProps {
  type: DashboardEmptyStateType;
  customTitle?: string;
  customDescription?: string;
  className?: string;
}

export const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({
  type,
  customTitle,
  customDescription,
  className,
}) => {
  const { t } = useTranslation();

  let icon = <CalendarX className="h-8 w-8 text-muted-foreground" />;
  let title = "";
  let description = "";

  switch (type) {
    case "holiday":
      icon = <Palmtree className="h-8 w-8 text-amber-600 dark:text-amber-400" />;
      title = customTitle || t("dashboard.holidayEmptyTitle", {
        defaultValue: "School Closed Today",
      });
      description =
        customDescription ||
        t("dashboard.holidayEmptyDesc", {
          defaultValue: "School is closed today for a public holiday. No classes are scheduled.",
        });
      break;

    case "no_classes_today":
      icon = <CalendarX className="h-8 w-8 text-primary/70" />;
      title = customTitle || t("dashboard.noClassesTodayTitle", {
        defaultValue: "No Classes Scheduled Today",
      });
      description =
        customDescription ||
        t("dashboard.noClassesTodayDesc", {
          defaultValue: "You have no classes scheduled for today. Enjoy your day!",
        });
      break;

    case "no_assigned_classes":
      icon = <School className="h-8 w-8 text-muted-foreground" />;
      title = customTitle || t("dashboard.noAssignedClassesTitle", {
        defaultValue: "No Classrooms Assigned",
      });
      description =
        customDescription ||
        t("dashboard.noAssignedClassesDesc", {
          defaultValue: "No active classrooms are currently assigned to your account. Contact an administrator for assistance.",
        });
      break;

    case "no_attention_needed":
      icon = <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />;
      title = customTitle || t("dashboard.noAttentionTitle", {
        defaultValue: "All Clear!",
      });
      description =
        customDescription ||
        t("dashboard.noAttentionDesc", {
          defaultValue: "All attendance records are up to date and no urgent items require attention.",
        });
      break;
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed bg-card/50",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 mb-3.5">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-foreground font-khmer">
        {title}
      </h3>
      <p className="text-xs text-muted-foreground max-w-sm mt-1 font-khmer leading-relaxed">
        {description}
      </p>
    </div>
  );
};
