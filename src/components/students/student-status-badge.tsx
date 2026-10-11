import React from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { StudentStatus } from "@/models/student.model";
import { CheckCircle2, PauseCircle, Archive } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentStatusBadgeProps {
  status: StudentStatus;
  className?: string;
  showIcon?: boolean;
}

export const StudentStatusBadge: React.FC<StudentStatusBadgeProps> = ({
  status,
  className,
  showIcon = true,
}) => {
  const { t } = useTranslation();

  switch (status) {
    case "active":
      return (
        <Badge
          variant="outline"
          className={cn(
            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 font-medium px-2.5 py-0.5 gap-1.5",
            className
          )}
        >
          {showIcon && <CheckCircle2 className="h-3 w-3" />}
          <span>{t("students.statusActive")}</span>
        </Badge>
      );
    case "inactive":
      return (
        <Badge
          variant="outline"
          className={cn(
            "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 font-medium px-2.5 py-0.5 gap-1.5",
            className
          )}
        >
          {showIcon && <PauseCircle className="h-3 w-3" />}
          <span>{t("students.statusInactive")}</span>
        </Badge>
      );
    case "archived":
      return (
        <Badge
          variant="outline"
          className={cn(
            "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25 font-medium px-2.5 py-0.5 gap-1.5",
            className
          )}
        >
          {showIcon && <Archive className="h-3 w-3" />}
          <span>{t("students.statusArchived")}</span>
        </Badge>
      );
    default:
      return null;
  }
};
