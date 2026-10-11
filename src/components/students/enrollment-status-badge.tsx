import React from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { EnrollmentStatus } from "@/models/enrollment.model";
import { CheckCircle2, Award, PauseCircle, XCircle, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnrollmentStatusBadgeProps {
  status: EnrollmentStatus;
  className?: string;
  showIcon?: boolean;
}

export const EnrollmentStatusBadge: React.FC<EnrollmentStatusBadgeProps> = ({
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
          <span>{t("enrollment.statusActive")}</span>
        </Badge>
      );
    case "completed":
      return (
        <Badge
          variant="outline"
          className={cn(
            "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25 font-medium px-2.5 py-0.5 gap-1.5",
            className
          )}
        >
          {showIcon && <Award className="h-3 w-3" />}
          <span>{t("enrollment.statusCompleted")}</span>
        </Badge>
      );
    case "paused":
      return (
        <Badge
          variant="outline"
          className={cn(
            "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 font-medium px-2.5 py-0.5 gap-1.5",
            className
          )}
        >
          {showIcon && <PauseCircle className="h-3 w-3" />}
          <span>{t("enrollment.statusPaused")}</span>
        </Badge>
      );
    case "cancelled":
      return (
        <Badge
          variant="outline"
          className={cn(
            "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25 font-medium px-2.5 py-0.5 gap-1.5",
            className
          )}
        >
          {showIcon && <XCircle className="h-3 w-3" />}
          <span>{t("enrollment.statusCancelled")}</span>
        </Badge>
      );
    case "transferred":
      return (
        <Badge
          variant="outline"
          className={cn(
            "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25 font-medium px-2.5 py-0.5 gap-1.5",
            className
          )}
        >
          {showIcon && <ArrowRightLeft className="h-3 w-3" />}
          <span>{t("enrollment.statusTransferred")}</span>
        </Badge>
      );
    default:
      return null;
  }
};
