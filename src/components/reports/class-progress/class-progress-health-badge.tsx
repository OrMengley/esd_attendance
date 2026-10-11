import React from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { ClassProgressHealth } from "@/models/class-progress-report.model";
import { getHealthLabel } from "@/lib/class-progress-labels";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, CircleDashed, Hourglass, TrendingUp } from "lucide-react";

interface ClassProgressHealthBadgeProps {
  health: ClassProgressHealth;
  className?: string;
}

// Distinct color + icon + text so meaning never relies on color alone.
const HEALTH_STYLES: Record<
  ClassProgressHealth,
  { className: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  not_started: {
    className:
      "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/30",
    Icon: CircleDashed,
  },
  on_track: {
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
    Icon: TrendingUp,
  },
  near_completion: {
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/40",
    Icon: Hourglass,
  },
  overdue: {
    className: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/40",
    Icon: AlertTriangle,
  },
  completed: {
    className:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    Icon: CheckCircle2,
  },
};

export const ClassProgressHealthBadge: React.FC<ClassProgressHealthBadgeProps> = ({
  health,
  className,
}) => {
  const { t } = useTranslation();
  const { className: styleClass, Icon } = HEALTH_STYLES[health];

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 text-[11px] font-semibold whitespace-nowrap",
        styleClass,
        className
      )}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {getHealthLabel(t, health)}
    </Badge>
  );
};

/** Progress bar color follows health so the bar and badge always agree. */
export function getProgressBarColor(health: ClassProgressHealth): string {
  switch (health) {
    case "overdue":
      return "bg-rose-500";
    case "near_completion":
      return "bg-amber-500";
    case "completed":
      return "bg-emerald-500";
    case "not_started":
      return "bg-slate-400";
    default:
      return "bg-blue-500";
  }
}
