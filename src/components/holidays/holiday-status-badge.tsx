import React from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { SchoolHolidayStatus } from "@/models/school-holiday.model";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HolidayStatusBadgeProps {
  status: SchoolHolidayStatus;
  className?: string;
  showIcon?: boolean;
}

export const HolidayStatusBadge: React.FC<HolidayStatusBadgeProps> = ({
  status,
  className,
  showIcon = true,
}) => {
  const { t } = useTranslation();

  if (status === "active") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25 font-medium px-2.5 py-0.5 gap-1.5 font-khmer",
          className
        )}
      >
        {showIcon && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
        <span>{t("holidays.active", { defaultValue: "សកម្ម" })}</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/25 font-medium px-2.5 py-0.5 gap-1.5 font-khmer",
        className
      )}
    >
      {showIcon && <XCircle className="h-3 w-3 text-slate-500" />}
      <span>{t("holidays.inactive", { defaultValue: "អសកម្ម" })}</span>
    </Badge>
  );
};
