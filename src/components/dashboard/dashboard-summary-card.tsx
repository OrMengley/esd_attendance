import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export type CardColorTheme =
  | "primary"
  | "emerald"
  | "amber"
  | "rose"
  | "blue"
  | "indigo";

interface DashboardSummaryCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  theme?: CardColorTheme;
  to?: string;
  onClick?: () => void;
  className?: string;
}

const THEME_STYLES: Record<
  CardColorTheme,
  {
    iconBg: string;
    iconColor: string;
    borderHover: string;
  }
> = {
  primary: {
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    borderHover: "hover:border-primary/50",
  },
  emerald: {
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    borderHover: "hover:border-emerald-500/50",
  },
  amber: {
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
    borderHover: "hover:border-amber-500/50",
  },
  rose: {
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-600 dark:text-rose-400",
    borderHover: "hover:border-rose-500/50",
  },
  blue: {
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
    borderHover: "hover:border-blue-500/50",
  },
  indigo: {
    iconBg: "bg-indigo-500/10",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    borderHover: "hover:border-indigo-500/50",
  },
};

export const DashboardSummaryCard: React.FC<DashboardSummaryCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  theme = "primary",
  to,
  onClick,
  className,
}) => {
  const styles = THEME_STYLES[theme] || THEME_STYLES.primary;

  const content = (
    <div
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-3.5 p-4 rounded-2xl border bg-card/90 shadow-2xs transition-all duration-200",
        (to || onClick) && "cursor-pointer hover:shadow-xs",
        (to || onClick) && styles.borderHover,
        className
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform",
          styles.iconBg,
          styles.iconColor
        )}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground truncate font-khmer">
          {title}
        </p>
        <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono mt-0.5">
          {value}
        </p>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground truncate font-khmer mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block group outline-none">
        {content}
      </Link>
    );
  }

  return content;
};
