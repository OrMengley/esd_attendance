import React from "react";
import i18n from "i18next";
import { ClassProgressReportData } from "@/models/class-progress-report.model";
import { useSchoolSettings } from "@/hooks/use-school-settings";
import {
  formatHours,
  formatPercent,
} from "@/lib/class-progress-calculator";
import {
  getHealthLabel,
  getScheduleTypeLabel,
  getPackageDisplayName,
  getAppliedFilterEntries,
} from "@/lib/class-progress-labels";

interface ClassProgressPrintViewProps {
  reportData: ClassProgressReportData;
  language?: "km" | "en";
}

export const ClassProgressPrintView: React.FC<ClassProgressPrintViewProps> = ({
  reportData,
  language = "km",
}) => {
  const schoolSettings = useSchoolSettings();
  const t = i18n.getFixedT(language);
  const isKm = language === "km";

  const { rows, summary, generatedAt, generatedBy } = reportData;
  const filterEntries = getAppliedFilterEntries(t, reportData, language);

  return (
    <div className="bg-white text-slate-900 font-khmer p-6 max-w-full print:p-0 print:max-w-none">
      {/* 1. Official Header */}
      <div className="border-b-2 border-[#1E347B] pb-4 mb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={schoolSettings.logoUrl || "/images/Logo-Wat-Soriyaram-Training-Computer-School.png"}
              alt="School Logo"
              className="h-16 w-16 object-contain shrink-0"
            />
            <div>
              <h1 className="text-base sm:text-lg font-bold font-khmer text-[#1E347B] leading-snug">
                {schoolSettings.centerName || (isKm ? "មជ្ឈមណ្ឌលបណ្តុះបណ្តាលកុំព្យូទ័រ វត្តសុរិយារាម" : "Wat Soriyaram Computer Training School")}
              </h1>
              <h2 className="text-xs sm:text-sm font-semibold text-slate-700 tracking-wide font-sans">
                WAT SORIYARAM COMPUTER TRAINING SCHOOL
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {t("app.fullTitle", { defaultValue: isKm ? "ប្រព័ន្ធគ្រប់គ្រងវត្តមានសិស្សថ្នាក់កុំព្យូទ័រ" : "Computer Class Student Attendance Management System" })}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="inline-block px-3 py-1 bg-[#F3B51B] text-[#16213D] font-extrabold text-xs sm:text-sm rounded-lg shadow-xs uppercase tracking-wide">
              {t("classProgressReport.title")}
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-1.5">
              {t("classProgressReport.print.generated")}: {generatedAt}
              {generatedBy ? ` (${generatedBy})` : ""}
            </p>
          </div>
        </div>

        {/* 2. Metadata / Filter bar */}
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 tracking-wider">
            {t("classProgressReport.print.appliedFilters")}:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs">
            {filterEntries.map((f, i) => (
              <div key={i} className="bg-slate-50 p-1.5 rounded border border-slate-200">
                <span className="text-slate-500 font-semibold text-[10px] block leading-tight">
                  {f.label}
                </span>
                <span className="font-bold text-slate-800 block text-[11px] truncate mt-0.5">
                  {f.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Quick Totals Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-2 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-500 text-[10px] block">
              {t("classProgressReport.print.totalClasses")}
            </span>
            <span className="font-bold text-slate-900 font-mono text-sm">
              {summary.totalClasses}
            </span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">
              {t("classProgressReport.summary.activeClasses")}
            </span>
            <span className="font-bold text-emerald-700 font-mono text-sm">
              {summary.activeClasses}
            </span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">
              {t("classProgressReport.print.averageProgress")}
            </span>
            <span className="font-bold text-primary font-mono text-sm">
              {formatPercent(summary.averageProgress)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">
              {t("classProgressReport.print.overdue")}
            </span>
            <span className="font-bold text-rose-700 font-mono text-sm">
              {summary.overdueClasses}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Printed Table */}
      <table className="w-full border-collapse border border-slate-400 text-xs mt-3">
        <thead>
          <tr className="bg-[#1E347B] text-white">
            <th className="py-2 px-1 text-center border border-slate-400 w-9">
              {t("classProgressReport.table.no")}
            </th>
            <th className="py-2 px-2 text-left border border-slate-400">
              {t("classProgressReport.table.class")}
            </th>
            <th className="py-2 px-2 text-left border border-slate-400">
              {t("classProgressReport.table.package")}
            </th>
            <th className="py-2 px-2 text-left border border-slate-400">
              {t("classProgressReport.table.teacher")}
            </th>
            <th className="py-2 px-2 text-center border border-slate-400 w-24">
              {t("classProgressReport.table.schedule")}
            </th>
            <th className="py-2 px-1.5 text-center border border-slate-400 font-mono w-16">
              {t("classProgressReport.table.plannedHours")}
            </th>
            <th className="py-2 px-1.5 text-center border border-slate-400 font-mono w-16">
              {t("classProgressReport.table.completedHours")}
            </th>
            <th className="py-2 px-1.5 text-center border border-slate-400 font-mono w-16">
              {t("classProgressReport.table.remainingHours")}
            </th>
            <th className="py-2 px-1.5 text-center border border-slate-400 font-mono w-16">
              {t("classProgressReport.table.progress")}
            </th>
            <th className="py-2 px-2 text-center border border-slate-400 font-mono w-24">
              {t("classProgressReport.table.expectedEndDate")}
            </th>
            <th className="py-2 px-2 text-center border border-slate-400 font-mono w-24">
              {t("classProgressReport.table.capacity")}
            </th>
            <th className="py-2 px-2 text-center border border-slate-400 w-28">
              {t("classProgressReport.table.health")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const pkgName = getPackageDisplayName(row.studyPackage, language);
            const scheduleText = `${getScheduleTypeLabel(t, row.scheduleType)} (${row.classroom.startTime}-${row.classroom.endTime})`;
            const healthLabel = getHealthLabel(t, row.health);
            const capacityDisplay =
              row.capacity !== null
                ? `${row.enrolledStudents}/${row.capacity}${row.capacity > 0 ? ` (${Math.round(row.capacityPercent)}%)` : ""}`
                : `${row.enrolledStudents}/—`;

            return (
              <tr key={row.classroom.id} className="border-b border-slate-300">
                <td className="py-1.5 px-1 text-center border border-slate-300 font-mono font-bold text-slate-600">
                  {index + 1}
                </td>
                <td className="py-1.5 px-2 border border-slate-300">
                  <div className="font-bold text-slate-900 leading-tight">
                    {row.classroom.name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    {row.classroom.code}
                  </div>
                </td>
                <td className="py-1.5 px-2 border border-slate-300 text-slate-800">
                  <div className="font-medium">{pkgName}</div>
                  <div className="text-[10px] font-mono text-slate-500">
                    {row.studyPackage?.code || "—"}
                  </div>
                </td>
                <td className="py-1.5 px-2 border border-slate-300 text-slate-800">
                  {row.teacher?.name || "—"}
                </td>
                <td className="py-1.5 px-2 text-center border border-slate-300 text-[11px]">
                  {scheduleText}
                </td>
                <td className="py-1.5 px-1.5 text-center border border-slate-300 font-mono font-semibold">
                  {formatHours(row.plannedHours)}
                </td>
                <td className="py-1.5 px-1.5 text-center border border-slate-300 font-mono font-semibold text-[#1E347B]">
                  {formatHours(row.completedHours)}
                </td>
                <td className="py-1.5 px-1.5 text-center border border-slate-300 font-mono font-semibold text-slate-700">
                  {formatHours(row.remainingHours)}
                </td>
                <td className="py-1.5 px-1.5 text-center border border-slate-300 font-mono font-bold text-slate-900">
                  {formatPercent(row.progressPercent)}
                </td>
                <td className="py-1.5 px-2 text-center border border-slate-300 font-mono text-[11px]">
                  {row.classroom.expectedEndDate}
                </td>
                <td className="py-1.5 px-2 text-center border border-slate-300 font-mono text-[11px]">
                  {capacityDisplay}
                </td>
                <td className="py-1.5 px-2 text-center border border-slate-300 text-[11px] font-semibold">
                  <span
                    className={
                      row.health === "overdue"
                        ? "text-rose-700"
                        : row.health === "near_completion"
                        ? "text-amber-700"
                        : row.health === "completed"
                        ? "text-emerald-700"
                        : "text-slate-700"
                    }
                  >
                    {healthLabel}
                  </span>
                </td>
              </tr>
            );
          })}

          {rows.length === 0 && (
            <tr>
              <td
                colSpan={12}
                className="py-8 text-center text-slate-500 border border-slate-300 italic"
              >
                {t("classProgressReport.print.emptyRow")}
              </td>
            </tr>
          )}

          {/* Totals Row */}
          {rows.length > 0 && (
            <tr className="bg-slate-100 font-bold border-t-2 border-slate-500 text-slate-900">
              <td
                colSpan={5}
                className="py-2 px-3 text-center border border-slate-400 font-khmer uppercase"
              >
                {isKm ? "សរុបរួម (Overall Totals)" : "Overall Totals"} ({rows.length} {isKm ? "ថ្នាក់" : "classes"})
              </td>
              <td className="py-2 px-1.5 text-center border border-slate-400 font-mono">
                {formatHours(rows.reduce((s, r) => s + r.plannedHours, 0))}
              </td>
              <td className="py-2 px-1.5 text-center border border-slate-400 font-mono text-[#1E347B]">
                {formatHours(rows.reduce((s, r) => s + r.completedHours, 0))}
              </td>
              <td className="py-2 px-1.5 text-center border border-slate-400 font-mono text-slate-700">
                {formatHours(rows.reduce((s, r) => s + r.remainingHours, 0))}
              </td>
              <td className="py-2 px-1.5 text-center border border-slate-400 font-mono text-primary font-bold">
                {formatPercent(summary.averageProgress)}
              </td>
              <td className="py-2 px-2 text-center border border-slate-400 font-mono" colSpan={3}>
                —
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 5. Formal Signatures Block */}
      <div className="grid grid-cols-3 gap-6 mt-10 pt-4 text-xs font-khmer text-center break-inside-avoid">
        <div>
          <p className="font-bold text-slate-800">
            {t("classProgressReport.print.preparedBy")}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {t("classProgressReport.print.administrativeStaff")}
          </p>
          <div className="mt-14 border-t border-dotted border-slate-400 w-36 mx-auto pt-1 font-mono text-[11px] text-slate-600">
            {generatedBy || "......................."}
          </div>
        </div>

        <div>
          <p className="font-bold text-slate-800">
            {isKm ? "ហត្ថលេខាគ្រូបង្រៀន" : "Teacher Signature"}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isKm ? "គ្រូទទួលបន្ទុក" : "Classroom Teacher"}
          </p>
          <div className="mt-14 border-t border-dotted border-slate-400 w-36 mx-auto pt-1 font-mono text-[11px] text-slate-600">
            .......................
          </div>
        </div>

        <div>
          <p className="font-bold text-slate-800">
            {t("classProgressReport.print.directorAdmin")}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {t("classProgressReport.print.approvedBy")}
          </p>
          <div className="mt-14 border-t border-dotted border-slate-400 w-36 mx-auto pt-1 font-mono text-[11px] text-slate-600">
            .......................
          </div>
        </div>
      </div>
    </div>
  );
};
