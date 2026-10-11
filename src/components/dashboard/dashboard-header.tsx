import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { User } from "@/models/user.model";
import { Button } from "@/components/ui/button";
import { getCambodiaDateTime } from "@/lib/attendance-time-lock";
import { formatAuditDateTime } from "@/lib/utils";
import { RefreshCw, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  user: User;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  isRefreshing,
  onRefresh,
}) => {
  const { t, i18n } = useTranslation();
  const isKm = i18n.language === "km";

  const [cambodiaTime, setCambodiaTime] = useState(() => getCambodiaDateTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setCambodiaTime(getCambodiaDateTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = cambodiaTime.hours;
    if (hour < 12) {
      return isKm ? "អរុណសួស្តី" : "Good morning";
    }
    if (hour < 17) {
      return isKm ? "ទិវាសួស្តី" : "Good afternoon";
    }
    return isKm ? "សាយ័ណ្ហសួស្តី" : "Good evening";
  };

  const userName = (user as any).fullName || user.name || user.username;

  // Format date and time
  const khmerDigits = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];
  const toKhmerNum = (n: number | string) =>
    String(n).replace(/[0-9]/g, (w) => khmerDigits[parseInt(w, 10)]);

  const timeDisplay = isKm
    ? `${toKhmerNum(cambodiaTime.timeStr)} ម៉ោង`
    : `${cambodiaTime.timeStr}`;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/70">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-khmer">
          {getGreeting()}, <span className="text-[#1E347B] dark:text-blue-400">{userName}</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-khmer">
          {t("dashboard.headerSubtitle", {
            defaultValue: "Here is your attendance overview for today.",
          })}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Date & Live Time Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-card text-xs shadow-2xs font-mono">
          <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="font-semibold text-foreground">
            {cambodiaTime.dateStr}
          </span>
          <span className="text-muted-foreground">|</span>
          <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="font-bold text-foreground">
            {timeDisplay}
          </span>
        </div>

        {/* Refresh Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label={t("common.refresh", { defaultValue: "Refresh data" })}
          title={t("common.refresh", { defaultValue: "Refresh data" })}
          className="h-8.5 rounded-xl text-xs gap-1.5 px-3 border-border/80 hover:bg-muted/60"
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5 text-muted-foreground", isRefreshing && "animate-spin text-primary")}
          />
          <span className="font-medium font-khmer">
            {t("common.refresh", { defaultValue: "Refresh" })}
          </span>
        </Button>
      </div>
    </div>
  );
};
