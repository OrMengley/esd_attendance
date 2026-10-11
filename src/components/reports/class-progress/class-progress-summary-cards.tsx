import React from "react";
import { useTranslation } from "react-i18next";
import { ClassProgressSummaryMetrics } from "@/models/class-progress-report.model";
import { formatPercent } from "@/lib/class-progress-calculator";
import {
  School,
  PlayCircle,
  CheckCircle2,
  Gauge,
  Hourglass,
  AlertTriangle,
} from "lucide-react";

interface ClassProgressSummaryCardsProps {
  summary: ClassProgressSummaryMetrics;
}

export const ClassProgressSummaryCards: React.FC<ClassProgressSummaryCardsProps> = ({
  summary,
}) => {
  const { t } = useTranslation();
  const unit = t("classProgressReport.summary.classesUnit");

  const cards = [
    {
      key: "total",
      label: t("classProgressReport.summary.totalClasses"),
      sub: t("classProgressReport.summary.totalClassesSub"),
      value: String(summary.totalClasses),
      unit,
      Icon: School,
      card: "bg-card border-border/80 hover:border-primary/40",
      iconBox: "bg-primary/10 text-primary",
      valueColor: "text-foreground",
    },
    {
      key: "active",
      label: t("classProgressReport.summary.activeClasses"),
      sub: t("classProgressReport.summary.activeClassesSub"),
      value: String(summary.activeClasses),
      unit,
      Icon: PlayCircle,
      card: "bg-card border-border/80 hover:border-emerald-500/40",
      iconBox: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      valueColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      key: "completed",
      label: t("classProgressReport.summary.completedClasses"),
      sub: t("classProgressReport.summary.completedClassesSub"),
      value: String(summary.completedClasses),
      unit,
      Icon: CheckCircle2,
      card: "bg-card border-border/80 hover:border-blue-500/40",
      iconBox: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      valueColor: "text-blue-600 dark:text-blue-400",
    },
    {
      key: "average",
      label: t("classProgressReport.summary.averageProgress"),
      sub: t("classProgressReport.summary.averageProgressSub"),
      value: formatPercent(summary.averageProgress),
      unit: "",
      Icon: Gauge,
      card: "bg-card border-border/80 hover:border-primary/40",
      iconBox: "bg-primary/10 text-primary",
      valueColor: "text-foreground",
    },
    {
      key: "near",
      label: t("classProgressReport.summary.nearCompletion"),
      sub: t("classProgressReport.summary.nearCompletionSub"),
      value: String(summary.nearCompletionClasses),
      unit,
      Icon: Hourglass,
      card: "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40",
      iconBox: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
      valueColor: "text-amber-700 dark:text-amber-400",
    },
    {
      key: "overdue",
      label: t("classProgressReport.summary.overdueClasses"),
      sub: t("classProgressReport.summary.overdueClassesSub"),
      value: String(summary.overdueClasses),
      unit,
      Icon: AlertTriangle,
      card: "bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40",
      iconBox: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
      valueColor: "text-rose-700 dark:text-rose-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {cards.map(({ key, label, sub, value, unit: cardUnit, Icon, card, iconBox, valueColor }) => (
        <div
          key={key}
          className={`p-4 rounded-2xl border shadow-xs flex flex-col justify-between transition-colors ${card}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted-foreground line-clamp-1">
              {label}
            </span>
            <div
              className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${iconBox}`}
            >
              <Icon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold font-sans ${valueColor}`}>{value}</span>
              {cardUnit && (
                <span className="text-[11px] text-muted-foreground">{cardUnit}</span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 truncate" title={sub}>
              {sub}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
