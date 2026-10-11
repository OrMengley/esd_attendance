import React from "react";
import { useTranslation } from "react-i18next";
import { AbsenceLateSummaryMetrics } from "@/models/absence-late-report.model";
import { UserCheck, UserX, Clock3, AlertTriangle, Users } from "lucide-react";

interface AbsenceLateSummaryCardsProps {
  summary: AbsenceLateSummaryMetrics;
}

export const AbsenceLateSummaryCards: React.FC<AbsenceLateSummaryCardsProps> = ({
  summary,
}) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {/* 1. Students Flagged */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-muted-foreground font-khmer line-clamp-1">
            {t("absenceLateReport.studentsFlagged", { defaultValue: "សិស្សជាប់លក្ខខណ្ឌ" })}
          </span>
          <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-sans text-foreground">
              {summary.studentsFlagged}
            </span>
            <span className="text-[11px] text-muted-foreground font-khmer">
              {t("classes.studentsUnit", { defaultValue: "នាក់" })}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground font-khmer mt-1 truncate">
            {t("absenceLateReport.subFlagged", { defaultValue: "ត្រូវនឹងលក្ខខណ្ឌកំណត់" })}
          </p>
        </div>
      </div>

      {/* 2. Students with Absences */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs flex flex-col justify-between hover:border-rose-500/40 transition-colors">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-muted-foreground font-khmer line-clamp-1">
            {t("absenceLateReport.studentsWithAbsences", { defaultValue: "សិស្សមានអវត្តមាន" })}
          </span>
          <div className="h-8 w-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <UserX className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-sans text-rose-600 dark:text-rose-400">
              {summary.studentsWithAbsences}
            </span>
            <span className="text-[11px] text-muted-foreground font-khmer">
              {t("classes.studentsUnit", { defaultValue: "នាក់" })}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground font-khmer mt-1 truncate">
            {t("absenceLateReport.subWithAbsences", { defaultValue: "មានអវត្តមានចាប់ពី ១ លើក" })}
          </p>
        </div>
      </div>

      {/* 3. Students with Late Records */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs flex flex-col justify-between hover:border-amber-500/40 transition-colors">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-muted-foreground font-khmer line-clamp-1">
            {t("absenceLateReport.studentsWithLates", { defaultValue: "សិស្សមានមកយឺត" })}
          </span>
          <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock3 className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-sans text-amber-600 dark:text-amber-400">
              {summary.studentsWithLates}
            </span>
            <span className="text-[11px] text-muted-foreground font-khmer">
              {t("classes.studentsUnit", { defaultValue: "នាក់" })}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground font-khmer mt-1 truncate">
            {t("absenceLateReport.subWithLates", { defaultValue: "មានមកយឺតចាប់ពី ១ លើក" })}
          </p>
        </div>
      </div>

      {/* 4. Total Absences */}
      <div className="bg-rose-500/5 p-4 rounded-2xl border border-rose-500/20 shadow-xs flex flex-col justify-between hover:border-rose-500/40 transition-colors">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-rose-800 dark:text-rose-300 font-khmer line-clamp-1">
            {t("absenceLateReport.totalAbsences", { defaultValue: "អវត្តមានសរុប" })}
          </span>
          <div className="h-8 w-8 rounded-xl bg-rose-500/15 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-sans text-rose-700 dark:text-rose-400">
              {summary.totalAbsences}
            </span>
            <span className="text-[11px] text-rose-600/80 font-khmer">
              {t("absenceLateReport.timesUnit", { defaultValue: "លើក" })}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground font-khmer mt-1 truncate">
            {t("absenceLateReport.subTotalAbsences", { defaultValue: "គិតក្នុងខែដែលបានជ្រើស" })}
          </p>
        </div>
      </div>

      {/* 5. Total Late Records */}
      <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/20 shadow-xs flex flex-col justify-between hover:border-amber-500/40 transition-colors col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 font-khmer line-clamp-1">
            {t("absenceLateReport.totalLates", { defaultValue: "មកយឺតសរុប" })}
          </span>
          <div className="h-8 w-8 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Clock3 className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-sans text-amber-700 dark:text-amber-400">
              {summary.totalLates}
            </span>
            <span className="text-[11px] text-amber-600/80 font-khmer">
              {t("absenceLateReport.timesUnit", { defaultValue: "លើក" })}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground font-khmer mt-1 truncate">
            {t("absenceLateReport.subTotalLates", { defaultValue: "គិតក្នុងខែដែលបានជ្រើស" })}
          </p>
        </div>
      </div>
    </div>
  );
};
