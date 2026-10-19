import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  RefreshCw,
  Clock,
  Palmtree,
  CalendarCheck2,
} from "lucide-react";
import { getCambodiaToday } from "@/lib/attendance-time-lock";
import { shiftDateStr } from "@/lib/daily-attendance-summary";
import { formatKhmerDate } from "@/lib/utils";

interface DailySummaryHeaderProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  isSchoolClosed: boolean;
  holidayName?: string;
}

export const DailySummaryHeader: React.FC<DailySummaryHeaderProps> = ({
  selectedDate,
  onDateChange,
  onRefresh,
  isLoading,
  isSchoolClosed,
  holidayName,
}) => {
  const { t, i18n } = useTranslation();
  const todayStr = getCambodiaToday();
  const isToday = selectedDate === todayStr;

  const handlePrevDay = () => {
    onDateChange(shiftDateStr(selectedDate, -1));
  };

  const handleNextDay = () => {
    onDateChange(shiftDateStr(selectedDate, 1));
  };

  const handleToday = () => {
    onDateChange(todayStr);
  };

  return (
    <div className="space-y-4">
      {/* Top Title & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-card p-5 rounded-2xl border border-border/80 shadow-sm">
        {/* Title & Timezone context */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <CalendarCheck2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-khmer text-foreground tracking-tight">
                {t("dailySummary.title", { defaultValue: "សង្ខេបវត្តមានប្រចាំថ្ងៃ" })}
              </h1>
              <p className="text-xs text-muted-foreground font-khmer">
                {t("dailySummary.subtitle", {
                  defaultValue: "តាមដានការកត់ត្រាវត្តមាន និងស្ថានភាពបញ្ចប់វត្តមានតាមថ្នាក់រៀនទាំងអស់ជាក់ស្តែង",
                })}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/90 bg-muted/60 px-2.5 py-1 rounded-lg mt-1 border border-border/40">
            <Clock className="h-3 w-3 text-primary shrink-0" />
            <span>{t("dailySummary.timezoneNotice", { defaultValue: "ម៉ោងនៅកម្ពុជា (Asia/Phnom_Penh, UTC+7)" })}</span>
          </div>
        </div>

        {/* Date Navigator & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Step Controls */}
          <div className="flex items-center bg-muted/50 p-1 rounded-xl border border-border/60 shadow-xs">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handlePrevDay}
              title={t("dailySummary.previousDay", { defaultValue: "ថ្ងៃមុន" })}
              className="h-8 w-8 rounded-lg hover:bg-background"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant={isToday ? "default" : "ghost"}
              size="sm"
              onClick={handleToday}
              className={`h-8 px-3 text-xs font-khmer rounded-lg ${isToday ? "bg-primary text-primary-foreground font-bold shadow-xs" : "hover:bg-background"
                }`}
            >
              {t("dailySummary.today", { defaultValue: "ថ្ងៃនេះ" })}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleNextDay}
              title={t("dailySummary.nextDay", { defaultValue: "ថ្ងៃបន្ទាប់" })}
              className="h-8 w-8 rounded-lg hover:bg-background"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Date Picker Input */}
          <div className="relative flex items-center">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  onDateChange(e.target.value);
                }
              }}
              className="h-10 text-xs sm:text-sm font-sans bg-background border-border/80 rounded-xl w-[150px] sm:w-[160px] pl-3 pr-2 font-medium"
            />
          </div>

          {/* Formatted Date Pill */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/5 text-primary border border-primary/20 text-xs font-semibold font-khmer">
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>{formatKhmerDate(selectedDate)}</span>
          </div>

          {/* Refresh Button */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isLoading}
            title={t("common.refresh", { defaultValue: "ផ្ទុកឡើងវិញ" })}
            className="h-10 w-10 rounded-xl border-border/80 hover:bg-muted shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-primary" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Active Holiday / School Closed Banner */}
      {isSchoolClosed && (
        <div className="flex items-start sm:items-center gap-3.5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200">
          <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Palmtree className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm font-khmer">
                {t("dailySummary.schoolClosed", { defaultValue: "សាលាឈប់សម្រាក" })}:
              </span>
              <span className="font-semibold text-sm text-amber-800 dark:text-amber-300">
                {holidayName || "Official Holiday"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 font-khmer">
              {t("dailySummary.schoolClosedNotice", {
                defaultValue: "សាលារៀនត្រូវបានបិទផ្លូវការនៅថ្ងៃនេះដោយសារជាថ្ងៃឈប់សម្រាក។ មិនមានកាលវិភាគបង្រៀនទេ។",
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
