import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: string;
    positive?: boolean;
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
  trend,
  className,
}) => {
  return (
    <Card className={cn("overflow-hidden border-border/70 relative", className)}>
      <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 bg-gradient-to-bl from-primary/5 to-transparent rounded-full pointer-events-none" />
      <CardContent className="p-5 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline space-x-2">
            <h4 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {value}
            </h4>
            {trend && (
              <span
                className={cn(
                  "text-xs font-semibold px-1.5 py-0.5 rounded",
                  trend.positive
                    ? "text-emerald-700 bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400"
                    : "text-rose-700 bg-rose-100 dark:bg-rose-950/50 dark:text-rose-400"
                )}
              >
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground pt-0.5">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            "p-3 rounded-2xl flex items-center justify-center transition-transform hover:scale-105 shadow-sm",
            iconBg
          )}
        >
          <Icon className={cn("h-6 w-6", iconColor)} />
        </div>
      </CardContent>
    </Card>
  );
};
