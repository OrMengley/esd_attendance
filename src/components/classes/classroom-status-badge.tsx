import React from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { ClassroomStatus } from "@/models/classroom.model";
import { cn } from "@/lib/utils";

interface ClassroomStatusBadgeProps {
  status: ClassroomStatus;
  className?: string;
}

export const ClassroomStatusBadge: React.FC<ClassroomStatusBadgeProps> = ({
  status,
  className,
}) => {
  const { t } = useTranslation();

  if (status === "active") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-semibold font-khmer",
          className
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5" />
        {t("classes.activeStatus")}
      </Badge>
    );
  }

  if (status === "completed") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 text-[11px] font-semibold font-khmer",
          className
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-1.5" />
        {t("classes.completedStatus")}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30 text-[11px] font-semibold font-khmer",
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mr-1.5" />
      {t("classes.inactiveStatus")}
    </Badge>
  );
};
