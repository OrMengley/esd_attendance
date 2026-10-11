import React from "react";
import { useTranslation } from "react-i18next";
import { AbsenceLateReportData } from "@/models/absence-late-report.model";
import { useSchoolSettings } from "@/hooks/use-school-settings";

interface AbsenceLatePrintViewProps {
  reportData: AbsenceLateReportData;
  language?: "km" | "en";
}

export const AbsenceLatePrintView: React.FC<AbsenceLatePrintViewProps> = ({
  reportData,
  language = "km",
}) => {
  const { t } = useTranslation();
  const schoolSettings = useSchoolSettings();
  const isKm = language === "km";

  const { selectedMonth, monthNameKm, monthNameEn, filters, students, summary, generatedAt, generatedBy } =
    reportData;

  const reportTypeLabel =
    filters.reportType === "absent_only"
      ? isKm ? "អវត្តមានប៉ុណ្ណោះ" : "Absence Only"
      : filters.reportType === "late_only"
      ? isKm ? "មកយឺតប៉ុណ្ណោះ" : "Late Only"
      : isKm ? "អវត្តមាន ឬមកយឺត" : "Absence or Late";

  const scheduleLabel =
    filters.selectedSchedule === "weekday"
      ? isKm ? "ចន្ទ - សុក្រ (Weekday)" : "Monday - Friday"
      : filters.selectedSchedule === "weekend"
      ? isKm ? "សៅរ៍ - អាទិត្យ (Weekend)" : "Saturday - Sunday"
      : isKm ? "កាលវិភាគទាំងអស់" : "All Schedules";

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
                {schoolSettings.centerName || "មជ្ឈមណ្ឌលបណ្តុះបណ្តាលកុំព្យូទ័រ វត្តសុរិយារាម"}
              </h1>
              <h2 className="text-xs sm:text-sm font-semibold text-slate-700 tracking-wide">
                WAT SORIYARAM COMPUTER TRAINING SCHOOL
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {t("app.fullTitle", { defaultValue: "ប្រព័ន្ធគ្រប់គ្រងវត្តមានសិស្សថ្នាក់កុំព្យូទ័រ" })}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="inline-block px-3 py-1 bg-[#F3B51B] text-[#16213D] font-extrabold text-xs sm:text-sm rounded-lg shadow-xs uppercase tracking-wide">
              {isKm ? "របាយការណ៍សិស្សអវត្តមាន និងមកយឺត" : "Absence & Late Report"}
            </div>
            <p className="text-sm font-bold text-slate-900 mt-1 font-mono">
              {isKm ? monthNameKm : monthNameEn}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              {isKm ? "កាលបរិច្ឆេទបង្កើត" : "Generated"}: {generatedAt}
              {generatedBy ? ` (${generatedBy})` : ""}
            </p>
          </div>
        </div>

        {/* 2. Metadata / Filter bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 font-semibold text-[10px] uppercase block">
              {isKm ? "ប្រភេទរបាយការណ៍" : "Report Type"}
            </span>
            <span className="font-bold text-slate-900 block">
              {reportTypeLabel} (≥ {filters.minOccurrences})
            </span>
          </div>

          <div>
            <span className="text-slate-500 font-semibold text-[10px] uppercase block">
              {isKm ? "កាលវិភាគ" : "Schedule"}
            </span>
            <span className="font-semibold text-slate-900 block">
              {scheduleLabel}
            </span>
          </div>

          <div>
            <span className="text-slate-500 font-semibold text-[10px] uppercase block">
              {isKm ? "សិស្សជាប់លក្ខខណ្ឌ" : "Flagged Students"}
            </span>
            <span className="font-bold text-rose-700 block font-mono">
              {summary.studentsFlagged} {isKm ? "នាក់" : "students"}
            </span>
          </div>

          <div>
            <span className="text-slate-500 font-semibold text-[10px] uppercase block">
              {isKm ? "សរុបអវត្តមាន / មកយឺត" : "Total Absences / Lates"}
            </span>
            <span className="font-bold text-slate-900 block font-mono">
              {summary.totalAbsences} {isKm ? "អវត្តមាន" : "Abs"} / {summary.totalLates} {isKm ? "យឺត" : "Late"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Printed Table */}
      <table className="w-full border-collapse border border-slate-400 text-xs mt-3">
        <thead>
          <tr className="bg-[#1E347B] text-white">
            <th className="py-2 px-1 text-center border border-slate-400 w-10">
              {isKm ? "ល.រ" : "No."}
            </th>
            <th className="py-2 px-3 text-left border border-slate-400">
              {isKm ? "គោត្តនាម-នាម" : "Student"}
            </th>
            <th className="py-2 px-2 text-center border border-slate-400 font-mono w-24">
              {isKm ? "អត្តលេខ" : "Student Code"}
            </th>
            <th className="py-2 px-2 text-left border border-slate-400">
              {isKm ? "ថ្នាក់រៀន" : "Class"}
            </th>
            <th className="py-2 px-2 text-left border border-slate-400">
              {isKm ? "គ្រូបង្រៀន" : "Teacher"}
            </th>
            <th className="py-2 px-2 text-center border border-slate-400 font-mono w-16">
              {isKm ? "គ្រោងទុក" : "Planned"}
            </th>
            <th className="py-2 px-2 text-center border border-slate-400 font-mono w-16">
              {isKm ? "គិតវត្តមាន" : "Counted"}
            </th>
            <th className="py-2 px-2 text-center border border-slate-400 font-mono w-14 text-rose-200">
              {isKm ? "អវត្តមាន" : "Absent"}
            </th>
            <th className="py-2 px-2 text-center border border-slate-400 font-mono w-14 text-amber-200">
              {isKm ? "មកយឺត" : "Late"}
            </th>
            <th className="py-2 px-2 text-center border border-slate-400 font-mono w-16">
              {isKm ? "អត្រា (%)" : "Rate (%)"}
            </th>
            <th className="py-2 px-2 text-center border border-slate-400 w-28">
              {isKm ? "លើកចុងក្រោយ" : "Last Incident"}
            </th>
          </tr>
        </thead>
        <tbody>
          {students.map((row) => {
            const lastIncidentText = row.lastIncidentDate
              ? `${row.lastIncidentDate} (${row.lastIncidentStatus === "absent" ? (isKm ? "អវត្តមាន" : "Absent") : (isKm ? "មកយឺត" : "Late")})`
              : "—";

            const rateDisplay = row.attendanceRate !== null ? `${row.attendanceRate}%` : "—";

            return (
              <tr key={row.student.id} className="border-b border-slate-300">
                <td className="py-1.5 px-1 text-center border border-slate-300 font-mono font-bold text-slate-600">
                  {row.rank}
                </td>
                <td className="py-1.5 px-3 border border-slate-300 font-bold text-slate-900">
                  {row.student.nameKh}
                  {row.student.nameEn && (
                    <span className="text-[11px] font-normal text-slate-600 block">
                      {row.student.nameEn}
                    </span>
                  )}
                </td>
                <td className="py-1.5 px-2 text-center border border-slate-300 font-mono text-slate-800">
                  {row.student.studentCode}
                </td>
                <td className="py-1.5 px-2 border border-slate-300">
                  <div className="font-semibold text-slate-900 leading-tight">
                    {row.currentClass.name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    {row.currentClass.code}
                  </div>
                </td>
                <td className="py-1.5 px-2 border border-slate-300 text-slate-800">
                  {row.assignedTeacher?.name || "—"}
                </td>
                <td className="py-1.5 px-2 text-center border border-slate-300 font-mono font-semibold">
                  {row.plannedSessions}
                </td>
                <td className="py-1.5 px-2 text-center border border-slate-300 font-mono font-semibold text-[#1E347B]">
                  {row.elapsedSessions}
                </td>
                <td className="py-1.5 px-2 text-center border border-slate-300 font-mono font-bold text-rose-700 bg-rose-50/50">
                  {row.absentCount}
                </td>
                <td className="py-1.5 px-2 text-center border border-slate-300 font-mono font-bold text-amber-700 bg-amber-50/50">
                  {row.lateCount}
                </td>
                <td className="py-1.5 px-2 text-center border border-slate-300 font-mono font-bold text-[#1E347B]">
                  {rateDisplay}
                </td>
                <td className="py-1.5 px-2 text-center border border-slate-300 text-[11px] font-mono">
                  {lastIncidentText}
                </td>
              </tr>
            );
          })}

          {students.length === 0 && (
            <tr>
              <td
                colSpan={11}
                className="py-8 text-center text-slate-500 border border-slate-300 italic"
              >
                {isKm
                  ? "មិនមានទិន្នន័យសិស្សត្រូវតាមលក្ខខណ្ឌដែលបានជ្រើសរើសទេ"
                  : "No students matched the selected criteria."}
              </td>
            </tr>
          )}

          {/* Totals Row */}
          {students.length > 0 && (
            <tr className="bg-slate-100 font-bold border-t-2 border-slate-500 text-slate-900">
              <td
                colSpan={5}
                className="py-2 px-3 text-center border border-slate-400 font-khmer uppercase"
              >
                {isKm ? "សរុបរួម (Overall Totals)" : "Overall Totals"}
              </td>
              <td className="py-2 px-2 text-center border border-slate-400 font-mono">
                {students.reduce((s, r) => s + r.plannedSessions, 0)}
              </td>
              <td className="py-2 px-2 text-center border border-slate-400 font-mono text-[#1E347B]">
                {students.reduce((s, r) => s + r.elapsedSessions, 0)}
              </td>
              <td className="py-2 px-2 text-center border border-slate-400 font-mono text-rose-700">
                {summary.totalAbsences}
              </td>
              <td className="py-2 px-2 text-center border border-slate-400 font-mono text-amber-700">
                {summary.totalLates}
              </td>
              <td className="py-2 px-2 text-center border border-slate-400 font-mono" colSpan={2}>
                —
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 4. Formal Signatures Block */}
      <div className="grid grid-cols-3 gap-6 mt-10 pt-4 text-xs font-khmer text-center break-inside-avoid">
        <div>
          <p className="font-bold text-slate-800">
            {isKm ? "រៀបចំដោយ" : "Prepared By"}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isKm ? "បុគ្គលិករដ្ឋបាល" : "Administrative Staff"}
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
            {isKm ? "ប្រធានមជ្ឈមណ្ឌល / រដ្ឋបាល" : "Director / Admin"}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isKm ? "បានឃើញ និងឯកភាព" : "Approved By"}
          </p>
          <div className="mt-14 border-t border-dotted border-slate-400 w-36 mx-auto pt-1 font-mono text-[11px] text-slate-600">
            .......................
          </div>
        </div>
      </div>
    </div>
  );
};
