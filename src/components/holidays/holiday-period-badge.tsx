import React from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { HolidayPeriod } from "@/lib/holiday-period";
import { Calendar, Sparkles, History } from "lucide-react";
import { cn } from "@/lib/utils";

interface HolidayPeriodBadgeProps {
  period: HolidayPeriod;
  className?: string;
  showIcon?: boolean;
}

export const HolidayPeriodBadge: React.FC<HolidayPeriodBadgeProps> = ({
  period,
  className,
  showIcon = true,
}) => {
  const { t } = useTranslation();

  if (period === "today") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 font-medium px-2.5 py-0.5 gap-1.5 font-khmer animate-pulse",
          className
        )}
      >
        {showIcon && <Sparkles className="h-3 w-3 text-amber-600 dark:text-amber-400" />}
        <span>{t("holidays.today", { defaultValue: "ថ្ងៃនេះ" })}</span>
      </Badge>
    );
  }

  if (period === "upcoming") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25 font-medium px-2.5 py-0.5 gap-1.5 font-khmer",
          className
        )}
      >
        {showIcon && <Calendar className="h-3 w-3 text-blue-600 dark:text-blue-400" />}
        <span>{t("holidays.upcoming", { defaultValue: "ខាងមុខ" })}</span>
      </Badge>
    );
  }

  // Past
  return (
    <Badge
      variant="outline"
      className={cn(
        "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25 font-medium px-2.5 py-0.5 gap-1.5 font-khmer",
        className
      )}
    >
      {showIcon && <History className="h-3 w-3 text-slate-500" />}
      <span>{t("holidays.past", { defaultValue: "កន្លងផុត" })}</span>
    </Badge>
  );
};
